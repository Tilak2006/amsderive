import { useState } from 'react';
import Head from 'next/head';
import Wordmark from '../components/layout/Wordmark';
import RegistrationForm from '../components/form/RegistrationForm';
import ErrorBanner from '../components/ui/ErrorBanner';
import SuccessState from '../components/ui/SuccessState';

export default function Register() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(data, setFieldErrors) {
    setStatus('loading');
    setErrorMessage('');

    try {
      // TODO: validate fields, upload file, submit registration
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
        <div className="register-header">
          <Wordmark size="sm" />
        </div>
        <div className="register-content">
          <h2 className="register-title">Registration</h2>
          {status === 'error' && <ErrorBanner message={errorMessage} />}
          {status === 'success' ? (
            <SuccessState />
          ) : (
            <RegistrationForm
              onSubmit={handleSubmit}
              loading={status === 'loading'}
            />
          )}
        </div>
      </main>
    </>
  );
}
