import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import styles from '../../styles/admin.module.css';

// Sanitize input — strip scripts, SQL fragments, null bytes
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .replace(/<[^>]*>/g, '') // HTML tags
    .trim();
}

const MAX_EMAIL_LEN = 120;
const MAX_PASS_LEN = 128;

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [locked, setLocked] = useState(false);
  const emailRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;
    let authTimeout;

    const checkAuth = () => {
      // CRITICAL: Force show form after 2 seconds no matter what
      authTimeout = setTimeout(() => {
        if (isMounted) {
          console.warn('[AdminLogin] Auth check timeout - showing login form');
          setChecking(false);
        }
      }, 2000);

      try {
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!isMounted) return;
          if (authTimeout) clearTimeout(authTimeout);

          if (user) {
            try {
              // Exchange ID token for an HttpOnly server-side session cookie.
              // The cookie is set by the server — JS never touches it.
              const token = await user.getIdToken();
              const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'admin' }),
              });
              if (res.ok) {
                router.replace('/admin/dashboard');
              } else {
                // Token valid but no admin claim — sign out and show form
                await signOut(auth);
                setChecking(false);
              }
            } catch {
              setChecking(false);
            }
          } else {
            setChecking(false);
          }
        });
      } catch (err) {
        console.error('[AdminLogin] Firebase auth error:', err);
        if (isMounted) {
          if (authTimeout) clearTimeout(authTimeout);
          setChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!checking) emailRef.current?.focus();
  }, [checking]);

  async function handleLogin(e) {
    e.preventDefault();

    if (locked) {
      setError('Too many attempts. Please wait and try again.');
      return;
    }

    const cleanEmail = sanitize(email).slice(0, MAX_EMAIL_LEN);
    const cleanPassword = password.slice(0, MAX_PASS_LEN);

    if (!cleanEmail || !cleanPassword) {
      setError('Both fields are required.');
      return;
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Invalid email format.');
      return;
    }

    setLoading(true);
    setError('');

    // Server-side rate limit check
    try {
      const rlRes = await fetch('/api/check-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login' }),
      });
      const rlData = await rlRes.json();

      if (!rlData.allowed) {
        setError(rlData.error || 'Too many attempts. Try again later.');
        setLocked(true);
        // Auto-unlock after retryAfter seconds
        setTimeout(() => setLocked(false), (rlData.retryAfter || 60) * 1000);
        setLoading(false);
        return;
      }
    } catch {
      // Fail open if rate limit API is down
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const token = await cred.user.getIdToken();
      // Exchange for an HttpOnly server-side session cookie
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'admin' }),
      });
      if (!sessionRes.ok) {
        // Signed in but not an admin — sign out and show error
        await signOut(auth);
        setError('This account does not have admin access.');
        setLoading(false);
        return;
      }
      router.push('/admin/dashboard');
    } catch {
      setError('Invalid credentials.');
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
        <Link href="/" className={styles.backToHome}>
          <span className={styles.backIcon}>←</span>
          <span>HOME</span>
        </Link>
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
                disabled={loading || locked}
                autoComplete="email"
                maxLength={MAX_EMAIL_LEN}
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
                disabled={loading || locked}
                autoComplete="current-password"
                maxLength={MAX_PASS_LEN}
              />
            </div>

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading || locked}
            >
              {locked ? 'LOCKED' : loading ? <span className={styles.loadingDots}>Verifying</span> : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}