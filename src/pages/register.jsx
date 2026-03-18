import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ErrorBanner from '../components/ui/ErrorBanner';
import styles from './register.module.css';
import {
  checkRegistrationCap,
  checkDuplicateRegistration,
  submitRegistration,
} from '../firebase/firestoreService';
import { uploadRegistrationFiles } from '../firebase/storageService';
import { checkRateLimit } from '../utils/rateLimit';
import { hashIp, createRateLimitFingerprint } from '../utils/hashIp';
import PerformanceLogger from '../utils/performanceLogger';
import { TIMEOUT_MS } from '../lib/constants';

// Lazy load registration form to defer loading until page is rendered
const RegistrationForm = dynamic(
  () => import('../components/form/RegistrationForm'),
  { ssr: false }
);

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms)
    ),
  ]);
}

export default function Register() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [registrationClosed, setRegistrationClosed] = useState(false);

  // Ensure hydration matches between server and client
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function handleSubmit(data, setFieldErrors) {
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Step 1: Sanitize name for file paths
      const sanitizedName = data.fullName
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();

      // Step 2: Fetch IP and create device fingerprint for rate limiting
      // (Ref: firebase-upload-safety skill - Rule 6: IP + User-Agent fingerprinting)
      const fingerprint = await PerformanceLogger.monitor(
        'IP Fetch & Fingerprint for Rate Limit',
        (async () => {
          try {
            const ipRes = await fetch('/api/get-ip');
            const ipData = await ipRes.json();
            if (ipData.ip) {
              // Get User-Agent from browser
              const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
              // Create fingerprint from IP + User-Agent (not just IP)
              return await createRateLimitFingerprint(ipData.ip, userAgent);
            }
          } catch {
            return 'unknown';
          }
          return 'unknown';
        })()
      );

      // Step 3: CHECK RATE LIMIT FIRST - BEFORE any file operations
      // (Ref: firebase-upload-safety skill - Rule 1)
      const rateResult = await PerformanceLogger.monitor(
        'Rate Limit Check (Before Upload)',
        withTimeout(checkRateLimit(fingerprint))
      );

      if (!rateResult.allowed) {
        setStatus('error');
        setErrorMessage(rateResult.error || 'Too many submissions. Please try again later.');
        return;
      }

      // Step 4: CHECK REGISTRATION DATE GATE (server-side)
      // (Ref: firebase-upload-safety skill - admin bypass moved to server)
      // Gate check skips date if admin bypass cookie is active
      const gateResult = await PerformanceLogger.monitor(
        'Registration Gate Check',
        withTimeout(
          fetch('/api/check-registration-gate', { method: 'POST' }).then(r => {
            if (r.status === 403) {
              return { allowed: false, error: 'Registration has not opened yet.' };
            }
            if (r.status !== 200) {
              return { allowed: false, error: 'Failed to verify registration status.' };
            }
            return r.json();
          })
        )
      );

      if (!gateResult.allowed) {
        setStatus('error');
        setErrorMessage(gateResult.error || 'Registration is not available.');
        return;
      }

      // Step 5: Check cap and duplicates in parallel (safe, no file operations)
      const [capResult, dupResult] = await PerformanceLogger.monitor(
        'Registration Pre-checks (Parallel)',
        Promise.all([
          withTimeout(checkRegistrationCap()),
          withTimeout(checkDuplicateRegistration(data.email, data.codeforcesHandle)),
        ])
      );

      // Check registration cap
      if (!capResult.allowed) {
        setStatus('error');
        setErrorMessage(capResult.error || 'Registrations are now closed.');
        setRegistrationClosed(true);
        return;
      }

      // Check for duplicates
      if (dupResult.duplicate) {
        setStatus('error');
        setErrorMessage(dupResult.error || 'This email or Codeforces handle is already registered.');
        return;
      }
      if (dupResult.error) {
        setStatus('error');
        setErrorMessage(dupResult.error);
        return;
      }

      // Step 6: NOW upload files (rate limit already passed)
      const uploadResult = await PerformanceLogger.monitor(
        'File Upload',
        withTimeout(uploadRegistrationFiles(data.resumeFile, data.idCardFile, sanitizedName))
      );

      if (!uploadResult.success) {
        setStatus('error');
        setErrorMessage(uploadResult.error || 'Failed to upload files. Please try again.');
        return;
      }

      // Step 7: Submit to Firestore
      const regResult = await PerformanceLogger.monitor(
        'Firestore Submission',
        withTimeout(
          submitRegistration({
            fullName: data.fullName.trim(),
            email: data.email.toLowerCase().trim(),
            university: data.university.trim(),
            resumeUrl: uploadResult.resumeUrl,
            resumeFileName: uploadResult.resumeFileName,
            idCardUrl: uploadResult.idCardUrl,
            idCardFileName: uploadResult.idCardFileName,
            codeforcesHandle: data.codeforcesHandle.trim(),
            codechefHandle: data.codechefHandle.trim() || null,
            linkedIn: data.linkedIn.trim() || null,
            gitHub: data.gitHub.trim() || null,
            dataConsent: data.dataConsent,
            ipHash: fingerprint, // Device fingerprint (IP + User-Agent)
          })
        )
      );

      if (!regResult.success) {
        setStatus('error');
        setErrorMessage(regResult.error || 'Registration failed. Please try again.');
        return;
      }

      // Success
      setSubmittedName(data.fullName.trim());
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <Head>
        <title>Register — AMS-DERIVE</title>
        <meta name="description" content="Register for the AMS-DERIVE competitive programming contest." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Prevent search engine indexing (security: user data collection form) */}
        {/* Ref: firebase-upload-safety skill - prevent public exposure of registration flow */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Navbar />

      <main className={styles.registerMain}>
        <div className={styles.registerHero}>
          <div className={styles.registerHeroContent}>
            <h1 className={styles.registerHeroTitle}>REGISTRATION</h1>
            <p className={styles.registerHeroSubtitle}>
              Signal-Generation System for First-Principles Thinkers
            </p>
          </div>
        </div>

        <div className={styles.registerFormContainer}>
          <div className={styles.registerCard}>
            <div className={styles.registerHeader}>
              <h2 className={styles.registerFormTitle}>Participant Information</h2>
              <p className={styles.registerFormSubtitle}>Complete all fields to register</p>
            </div>

            <div className={styles.registerContent}>
              {status === 'error' && <ErrorBanner message={errorMessage} />}
              {registrationClosed ? (
                <div className={styles.registerClosed}>
                  <p className={styles.registerClosedMessage}>
                    Thank you for your interest in AMS DERIVE. Registration has closed.
                  </p>
                </div>
              ) : status === 'success' ? (
                <div className={styles.registerSuccess}>
                  <div className={styles.registerSuccessCheckmark}>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 32 32"
                      fill="none"
                      aria-hidden="true"
                    >
                      {/* Candlestick chart with 3 bars */}
                      {/* Left bar - down */}
                      <g>
                        <line x1="6" y1="8" x2="6" y2="20" stroke="#D4AF37" strokeWidth="2" />
                        <rect x="4" y="16" width="4" height="4" fill="#D4AF37" />
                      </g>
                      {/* Middle bar - up */}
                      <g>
                        <line x1="14" y1="12" x2="14" y2="24" stroke="#D4AF37" strokeWidth="2" />
                        <rect x="12" y="12" width="4" height="12" fill="#D4AF37" />
                      </g>
                      {/* Right bar - up */}
                      <g>
                        <line x1="22" y1="10" x2="22" y2="22" stroke="#D4AF37" strokeWidth="2" />
                        <rect x="20" y="10" width="4" height="12" fill="#D4AF37" />
                      </g>
                    </svg>
                  </div>
                  <h3 className={styles.registerSuccessTitle}>Registration Received</h3>
                  <p className={styles.registerSuccessName}>{submittedName}</p>
                  <p className={styles.registerSuccessMessage}>
                    We&apos;ll reach out before the event starts.
                  </p>
                </div>
              ) : (
                isHydrated && (
                  <RegistrationForm
                    onSubmit={handleSubmit}
                    loading={status === 'submitting'}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
