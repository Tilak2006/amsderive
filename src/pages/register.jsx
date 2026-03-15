import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RegistrationForm from '../components/form/RegistrationForm';
import ErrorBanner from '../components/ui/ErrorBanner';
import { checkDuplicateHandle, submitRegistration } from '../firebase/firestoreService';
import { uploadFile } from '../firebase/storageService';
import { checkRateLimit } from '../utils/rateLimit';
import { hashIp } from '../utils/hashIp';
import PerformanceLogger from '../utils/performanceLogger';

// April 20, 2026 00:00 IST = April 19, 2026 18:30 UTC
const REGISTRATION_OPENS = new Date('2026-04-19T18:30:00Z');
const TIMEOUT_MS = 50000;

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
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  // Monitoring component mount
  useEffect(() => {
    PerformanceLogger.logDuration('Register Page Mount', 0); // Simplified tracking
  }, []);

  // Date gate — redirect before registration opens
  // In production, add server-side check via getServerSideProps
  useEffect(() => {
    if (Date.now() < REGISTRATION_OPENS.getTime()) {
      router.replace('/');
    }
  }, [router]);

  async function handleSubmit(data, setFieldErrors) {
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Step 1: Trigger independent tasks in parallel
      const sanitizedName = data.name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const storagePath = `registrants/${Date.now()}_${sanitizedName}_${data.file.name}`;

      // Start checkDuplicateHandle, uploadFile, and IP retrieval concurrently
      const [dupResult, uploadResult, ipHash] = await PerformanceLogger.monitor('Registration Pre-checks (Parallel)', Promise.all([
        withTimeout(checkDuplicateHandle(data.cfHandle.trim(), data.ccHandle.trim())),
        withTimeout(uploadFile(data.file, storagePath)),
        (async () => {
          try {
            const ipRes = await fetch('/api/get-ip');
            const ipData = await ipRes.json();
            if (ipData.ip) {
              return await hashIp(ipData.ip);
            }
          } catch {
            return 'unknown';
          }
          return 'unknown';
        })()
      ]));

      // Handle duplicate check result
      if (dupResult.duplicate) {
        setStatus('error');
        setErrorMessage(dupResult.error || 'A registration with this handle already exists.');
        return;
      }
      if (dupResult.error) {
        setStatus('error');
        setErrorMessage(dupResult.error);
        return;
      }

      // Handle file upload result
      if (!uploadResult.success) {
        setStatus('error');
        setErrorMessage(uploadResult.error || 'Failed to upload document. Please try again.');
        return;
      }

      // Step 2: Check rate limit (depends on ipHash)
      const rateResult = await PerformanceLogger.monitor('Rate Limit Check', withTimeout(checkRateLimit(ipHash)));
      if (!rateResult.allowed) {
        setStatus('error');
        setErrorMessage(rateResult.error || 'Too many submissions. Please try again later.');
        return;
      }

      // Step 3: Submit registration to Firestore
      const regResult = await PerformanceLogger.monitor('Firestore Submission', withTimeout(submitRegistration({
        name: data.name.trim(),
        institution: data.institution.trim(),
        codeforcesHandle: data.cfHandle.trim(),
        codechefHandle: data.ccHandle.trim(),
        idDocumentUrl: uploadResult.url,
        idDocumentFileName: data.file.name,
        ipHash,
      })));

      if (!regResult.success) {
        setStatus('error');
        setErrorMessage(regResult.error || 'Registration failed. Please try again.');
        return;
      }

      setSubmittedName(data.name.trim());
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
      </Head>
      <main className="register-main">
        <div className="register-container">
          {/* Custom header */}
          <h1 className="register-wordmark">AMS DERIVE</h1>
          <p className="register-subtitle">REGISTRATION</p>
          <hr className="register-divider" />
          <span className="register-accent-line" />

          <div className="register-content">
            {status === 'error' && <ErrorBanner message={errorMessage} />}
            {status === 'success' ? (
              <div className="register-success">
                <div className="register-success-checkmark">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="16" cy="16" r="16" fill="#c9a84c" />
                    <path
                      d="M9 16.5l5 5 9-9"
                      stroke="#0a0a0a"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2 className="register-success-title">Registration Received</h2>
                <p className="register-success-name">{submittedName}</p>
                <p className="register-success-message">
                  We&apos;ll reach out before the event.
                </p>
              </div>
            ) : (
              <RegistrationForm
                onSubmit={handleSubmit}
                loading={status === 'submitting'}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
