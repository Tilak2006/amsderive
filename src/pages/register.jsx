import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ErrorBanner from '../components/ui/ErrorBanner';
import RegistrationCard from '../components/ui/RegistrationCard';
import RegistrationForm from '../components/form/RegistrationForm';
import styles from './register.module.css';
import PerformanceLogger from '../utils/performanceLogger';
import { TIMEOUT_MS, MAX_REGISTRATIONS, REGISTRATION_CLOSES } from '../lib/constants';

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms)
    ),
  ]);
}

async function uploadFileViaApi(file, sanitizedName, type) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', sanitizedName);
  formData.append('type', type);

  const res = await fetch('/api/upload-file', {
    method: 'POST',
    body: formData,
    // No Content-Type header — browser sets multipart boundary automatically
  });

  let data = {};
  try { data = await res.json(); } catch { /* non-JSON body on gateway error */ }
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'File upload failed.');
  }
  return { url: data.url, fileName: data.fileName };
}

export default function Register() {
  // isHydrated gate removed — child components use effects for browser APIs, SSR-safe
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
    const dateClosed = Date.now() >= REGISTRATION_CLOSES.getTime();

    if (dateClosed) {
      setRegistrationClosed(true);
    }

    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setCountData(data);
          if (dateClosed || data.full) setRegistrationClosed(true);
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
            if (dateClosed || data.full) setRegistrationClosed(true);
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
      // Sanitize name for file paths
      const sanitizedName = data.fullName
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
        .slice(0, 40); // cap storage path segment per security_rules.md

      // Fire gate check + file uploads concurrently — saves one RTT on happy path.
      // Tradeoff: if gate rejects (already closed), uploads complete wastefully.
      // Acceptable since gate-rejection is rare (launch edge case only).
      let gateRes, resumeUpload, transcriptUpload;
      try {
        const uploadTasks = [uploadFileViaApi(data.resumeFile, sanitizedName, 'resume')];
        if (data.transcriptFile) {
          uploadTasks.push(uploadFileViaApi(data.transcriptFile, sanitizedName, 'transcript'));
        }

        const [gate, uploads] = await PerformanceLogger.monitor(
          'Gate + File Upload',
          withTimeout(
            Promise.all([
              fetch('/api/check-registration-gate', { method: 'POST' }),
              Promise.all(uploadTasks),
            ]),
            30000
          )
        );
        gateRes = gate;
        [resumeUpload] = uploads;
        transcriptUpload = data.transcriptFile ? uploads[1] : null;
      } catch (uploadErr) {
        submittingRef.current = false;
        setStatus('error');
        setErrorMessage(uploadErr.message || 'Failed to upload files. Please try again.');
        return;
      }

      // Gate check runs in parallel with uploads — reject AFTER uploads completed.
      if (!gateRes.ok) {
        const gateData = await gateRes.json().catch(() => ({}));
        if (gateRes.status === 403) setRegistrationClosed(true);
        submittingRef.current = false;
        setStatus('error');
        setErrorMessage(gateData.error || 'Registration is not currently open.');
        return;
      }

      const uploadResult = {
        resumeUrl: resumeUpload.url,
        resumeFileName: resumeUpload.fileName,
        transcriptUrl: transcriptUpload ? transcriptUpload.url : null,
        transcriptFileName: transcriptUpload ? transcriptUpload.fileName : null,
      };

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
      const isNetworkError = err instanceof TypeError && err.message === 'Failed to fetch';
      setErrorMessage(
        isNetworkError
          ? 'Network error — please check your connection and try again. If the issue persists, try on a different network or browser.'
          : err.message || 'Something went wrong. Please try again.'
      );
    }
  }

  return (
    <>
      <Head>
        <title>Register — AMS-DERIVE</title>
        <meta name="description" content="Register for the AMS-DERIVE competitive programming contest." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Warm TLS to Firebase Storage — saves 100-300ms on first upload */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
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
            <span>Only <strong>{MAX_REGISTRATIONS - countData.count} spots remaining</strong>. Registration closes on 23 May 2026 at 2:00 PM IST or at {MAX_REGISTRATIONS.toLocaleString()} participants.</span>
          </div>
        )}

        <div className={styles.registerFormContainer}>
          <div className={styles.registerCard}>
            <div className={styles.registerHeader}>
              <h2 className={styles.registerFormTitle}>Participant Information</h2>
              <p className={styles.registerFormSubtitle}>Complete all fields to register</p>
              <div className={styles.registrationTrustCue} aria-label="2500 plus people already registered">
                <span className={styles.registrationTrustCount}>2500+</span>
                <span className={styles.registrationTrustText}>people already registered</span>
              </div>
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
                    You&apos;ll receive an email from <strong>team@amsderive.in</strong> once your application is reviewed and approved. Please check your inbox — and <strong>spam/quarantine folder</strong> — periodically. Institutional mail servers (IITs, NITs) sometimes hold external mail for review.
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
