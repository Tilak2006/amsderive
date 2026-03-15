import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RegistrationForm from '../components/form/RegistrationForm';
import ErrorBanner from '../components/ui/ErrorBanner';
import { checkDuplicateHandle, submitRegistration } from '../firebase/firestoreService';
import { uploadFile } from '../firebase/storageService';
import { checkRateLimit } from '../utils/rateLimit';
import { hashIp } from '../utils/hashIp';

// March 20, 2026 00:00 IST = March 19, 2026 18:30 UTC
const REGISTRATION_OPENS = new Date('2026-03-19T18:30:00Z');
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
      // Step 1: Check for duplicate handles
      const dupResult = await withTimeout(checkDuplicateHandle(data.cfHandle.trim(), data.ccHandle.trim()));
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

      // Step 2: Upload ID document
      const sanitizedName = data.name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const storagePath = `registrants/${Date.now()}_${sanitizedName}_${data.file.name}`;
      const uploadResult = await withTimeout(uploadFile(data.file, storagePath));
      if (!uploadResult.success) {
        setStatus('error');
        setErrorMessage(uploadResult.error || 'Failed to upload document. Please try again.');
        return;
      }

      // Step 3: Get IP and hash it (graceful fallback)
      let ipHash = 'unknown';
      try {
        const ipRes = await fetch('/api/get-ip');
        const ipData = await ipRes.json();
        if (ipData.ip) {
          ipHash = await hashIp(ipData.ip);
        }
      } catch {
        // Graceful fallback — proceed with 'unknown'
      }

      // Step 4: Check rate limit
      const rateResult = await withTimeout(checkRateLimit(ipHash));
      if (!rateResult.allowed) {
        setStatus('error');
        setErrorMessage(rateResult.error || 'Too many submissions. Please try again later.');
        return;
      }

      // Step 5: Submit registration to Firestore
      const regResult = await withTimeout(submitRegistration({
        name: data.name.trim(),
        institution: data.institution.trim(),
        codeforcesHandle: data.cfHandle.trim(),
        codechefHandle: data.ccHandle.trim(),
        idDocumentUrl: uploadResult.url,
        idDocumentFileName: data.file.name,
        ipHash,
      }));

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
