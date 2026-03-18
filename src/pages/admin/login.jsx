import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import styles from '../../styles/admin.module.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const emailRef = useRef(null);
  const failedAttemptsRef = useRef(0);
  const lockoutUntilRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/admin/dashboard');
      } else {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!checking) emailRef.current?.focus();
  }, [checking]);

  async function handleLogin(e) {
    e.preventDefault();
    
    if (Date.now() < lockoutUntilRef.current) {
      const secsLeft = Math.ceil((lockoutUntilRef.current - Date.now()) / 1000);
      setError(`Too many attempts. Try again in ${secsLeft}s.`);
      return;
    }
    
    if (!email.trim() || !password.trim()) {
      setError('Both fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/admin/dashboard');
    } catch {
      setError('Invalid credentials.');
      failedAttemptsRef.current += 1;
      if (failedAttemptsRef.current >= 5) {
        lockoutUntilRef.current = Date.now() + 30 * 1000;
        failedAttemptsRef.current = 0;
        setError('Too many failed attempts. Try again in 30s.');
      }
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className={styles.checkingWrap}>
        <span className={styles.checkingDot} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin — AMS Derive</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <span className={styles.loginWordmark}>
              AMS <span className={styles.loginWordmarkGold}>DERIVE</span>
            </span>
            <p className={styles.loginSubtitle}>ADMIN ACCESS</p>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorIcon}>!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="email">
                Email
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                className={styles.fieldInput}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="admin@amsociety.in"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={styles.fieldInput}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading ? <span className={styles.loadingDots}>Verifying</span> : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}