import { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './check-registration.module.css';

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins} IST`;
}

export default function CheckRegistration() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // null | { found: false } | { found: true, registration: {...} }
  const [error, setError] = useState('');

  async function handleCheck(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const reg = result?.registration;
  const statusColor = reg?.status === 'approved'
    ? '#4ade80'
    : reg?.status === 'rejected'
    ? '#f87171'
    : '#D4AF37';

  return (
    <>
      <Head>
        <title>Check Registration — AMS DERIVE</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>CHECK REGISTRATION</h1>
          <p className={styles.heroSubtitle}>Verify your registration status</p>
        </div>

        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Registration Lookup</h2>
              <p className={styles.cardSubtitle}>Enter your name and email to check your status</p>
            </div>

            <div className={styles.cardBody}>
              <form onSubmit={handleCheck} className={styles.form} noValidate>
                <div className={styles.terminalLabel}>$ ams-derive-check</div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="fullName">FULL NAME</label>
                  <input
                    id="fullName"
                    type="text"
                    className={styles.input}
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(''); }}
                    placeholder="Your full name"
                    disabled={loading}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="email">EMAIL</label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>

                {error && <p className={styles.errorText} role="alert">{error}</p>}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Checking...' : 'Check Status'}
                </button>
              </form>

              {/* Result */}
              {result && !result.found && (
                <div className={styles.notFound}>
                  <p className={styles.notFoundText}>
                    No registration found. Please check your name and email and try again.
                  </p>
                </div>
              )}

              {result?.found && reg && (
                <div className={styles.resultCard}>
                  <div className={styles.resultHeader}>
                    <span className={styles.resultCheck}>✓</span>
                    <span className={styles.resultTitle}>Registration Found</span>
                  </div>
                  <div className={styles.resultGrid}>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>STATUS</span>
                      <span className={styles.resultValue} style={{ color: statusColor, fontWeight: 700 }}>
                        {(reg.status || 'pending').toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>SUBMITTED</span>
                      <span className={`${styles.resultValue} ${styles.mono}`}>{formatDate(reg.submittedAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}