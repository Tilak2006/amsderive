import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ErrorBanner from '../components/ui/ErrorBanner';
import RegistrationCard from '../components/ui/RegistrationCard';
import styles from './register.module.css';
import { uploadRegistrationFiles } from '../firebase/storageService';
import PerformanceLogger from '../utils/performanceLogger';
import { TIMEOUT_MS } from '../lib/constants';

// Lazy load registration form to defer loading until page is rendered
const RegistrationForm = dynamic(
  () => import('../components/form/RegistrationForm'),
  { 
    ssr: false,
    loading: () => (
      <div className={styles.skeletonContainer}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.skeletonLabel} />
          <div className={styles.skeletonField} />
        </div>
        <div className={styles.skeletonRow}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className={styles.skeletonLabel} />
            <div className={styles.skeletonField} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className={styles.skeletonLabel} />
            <div className={styles.skeletonField} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.skeletonLabel} />
          <div className={styles.skeletonField} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className={styles.skeletonLabel} />
          <div className={styles.skeletonField} />
        </div>
        <div className={styles.skeletonBtn} />
      </div>
    )
  }
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
  // isHydrated gate removed — RegistrationForm's ssr:false dynamic children handle hydration safely
  const submittingRef = useRef(false); // synchronous guard — prevents double-submit before re-render
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [submittedUniversity, setSubmittedUniversity] = useState('');
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [countData, setCountData] = useState(null);

  // Fetch registration count on load.
  // sessionStorage caches for 60s so navigating back doesn't re-hit the API.
  useEffect(() => {
    const CACHE_KEY = 'reg_count_cache';
    const CACHE_TTL = 60 * 1000;

    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setCountData(data);
          if (data.full) setRegistrationClosed(true);
          return; // Skip fetch entirely if we have fresh cached data
        }
      }
    } catch { /* sessionStorage unavailable */ }

    // Fire after browser is genuinely idle — never competes with paint or hydration.
    // 2000ms hard timeout covers Safari (no rIC) and slow devices.
    const doFetch = () => {
      fetch('/api/registration-count')
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) {
            setCountData(data);
            if (data.full) setRegistrationClosed(true);
            try {
              sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
            } catch { /* quota exceeded or unavailable */ }
          }
        })
        .catch(() => { /* fail silently */ });
    };

    let handle;
    if (typeof requestIdleCallback === 'function') {
      handle = { type: 'ric', id: requestIdleCallback(doFetch, { timeout: 2000 }) };
    } else {
      handle = { type: 'timeout', id: setTimeout(doFetch, 200) };
    }

    return () => {
      if (handle.type === 'ric') cancelIdleCallback(handle.id);
      else clearTimeout(handle.id);
    };
  }, []);


  async function handleSubmit(data, setFieldErrors) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Step 1: Sanitize name for file paths
      const sanitizedName = data.fullName
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
        .slice(0, 40); // cap storage path segment per security_rules.md

      // Step 2: Upload files — 30s cap (Firebase Storage, slow mobile)
      const uploadResult = await PerformanceLogger.monitor(
        'File Upload',
        withTimeout(uploadRegistrationFiles(data.resumeFile, data.transcriptFile, sanitizedName), 30000)
      );

      if (!uploadResult.success) {
        setStatus('error');
        setErrorMessage(uploadResult.error || 'Failed to upload files. Please try again.');
        return;
      }

      // Step 3: Submit to server API — 15s cap (server-side only, no upload)
      const regRes = await PerformanceLogger.monitor(
        'Firestore Submission',
        withTimeout(
          fetch('/api/submit-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: data.fullName.trim(),
              email: data.email.toLowerCase().trim(),
              university: data.university.trim(),
              branch: data.branch,
              graduationYear: data.graduationYear,
              resumeUrl: uploadResult.resumeUrl,
              resumeFileName: uploadResult.resumeFileName,
              transcriptUrl: uploadResult.transcriptUrl,
              transcriptFileName: uploadResult.transcriptFileName,
              codeforcesHandle: data.codeforcesHandle.trim(),
              phoneNumber: data.phoneNumber.trim(),
              linkedIn: data.linkedIn.trim(),
              gitHub: data.gitHub.trim() || null,
              dataConsent: data.dataConsent,
              refCode: data.refCode || null,
            }),
          }),
          15000
        )
      );

      const regResult = await regRes.json();

      if (!regResult.success) {
        if (regResult.field === 'linkedIn') {
          submittingRef.current = false;
          setStatus('idle');
          setFieldErrors({ linkedIn: regResult.error });
          return;
        }
        if (regRes.status === 403) {
          setRegistrationClosed(true);
        }
        submittingRef.current = false;
        setStatus('error');
        setErrorMessage(regResult.error || 'Registration failed. Please try again.');
        return;
      }

      // Success — ref stays true: successful submission is terminal, no retry needed
      setSubmittedName(data.fullName.trim());
      setSubmittedUniversity(data.university.trim());
      setStatus('success');
    } catch (err) {
      submittingRef.current = false;
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

        {countData?.warning && !countData?.full && (
          <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>⚡</span>
            <span>Only <strong>{10000 - countData.count} spots remaining</strong>. Registration closes at 10,000 participants.</span>
          </div>
        )}

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
                  <RegistrationCard fullName={submittedName} university={submittedUniversity} />
                </div>
              ) : (
                <RegistrationForm
                  onSubmit={handleSubmit}
                  loading={status === 'submitting'}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
