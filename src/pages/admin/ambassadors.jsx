import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import styles from '../../styles/admin.module.css';
import ambStyles from '../../styles/ambassadors.module.css';

const INSTITUTIONS = [
  { value: 'iitbhu', label: 'IIT BHU' },
  { value: 'bitspilani', label: 'BITS Pilani' },
  { value: 'iitkgp', label: 'IIT KGP' },
];

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

export default function AmbassadorsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [ambassadors, setAmbassadors] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Generate form state
  const [selectedInstitution, setSelectedInstitution] = useState('iitbhu');
  const [generating, setGenerating] = useState(false);
  const [generateMsg, setGenerateMsg] = useState(null);
  const [newCode, setNewCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const userRef = useRef(null);
  const tokenCache = useRef({ token: null, expiry: 0 });

  async function getToken() {
    if (tokenCache.current.token && Date.now() < tokenCache.current.expiry) {
      return tokenCache.current.token;
    }
    const token = await userRef.current?.getIdToken();
    tokenCache.current = { token, expiry: Date.now() + 50 * 60 * 1000 };
    return token;
  }

  async function authHeaders() {
    const token = await getToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        userRef.current = u;
        setUser(u);
        setChecking(false);
      } else {
        router.replace('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ── Load ambassadors ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadAmbassadors();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAmbassadors() {
    setLoadingData(true);
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/get-ambassadors', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setAmbassadors(data.ambassadors || []);
      }
    } catch (err) {
      console.error('[ambassadors] load error:', err);
    } finally {
      setLoadingData(false);
    }
  }

  // ── Generate code ─────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    setGenerateMsg(null);
    setNewCode(null);
    setCopied(false);
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/create-ambassador', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ institution: selectedInstitution }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCode(data.code);
        setGenerateMsg({ type: 'success', text: 'Code generated successfully.' });
        // Reload list to show new entry
        await loadAmbassadors();
      } else {
        setGenerateMsg({ type: 'error', text: data.error || 'Failed to generate code.' });
      }
    } catch {
      setGenerateMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setGenerating(false);
    }
  }

  function buildLink(code) {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/register?ref=${code}`;
  }

  async function handleCopy(code) {
    try {
      await navigator.clipboard.writeText(buildLink(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'admin' }),
      });
    } catch {
      // proceed anyway
    }
    await signOut(auth);
    router.push('/admin/login');
  }

  if (checking) {
    return (
      <div className={styles.checkingWrap}>
        <span className={styles.checkingDot} />
      </div>
    );
  }

  // Group ambassadors by institution
  const byInstitution = ambassadors.reduce((acc, a) => {
    if (!acc[a.institution]) acc[a.institution] = [];
    acc[a.institution].push(a);
    return acc;
  }, {});

  return (
    <>
      <Head>
        <title>Ambassadors — AMS Derive Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.dashPage}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <span className={styles.topBarTitle}>
            AMS <span className={styles.topBarGold}>DERIVE</span>
            <span className={styles.topBarAdmin}> — ADMIN</span>
          </span>
          <div className={styles.topBarRight}>
            <span className={styles.topBarEmail}>{user?.email}</span>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        </header>

        <main className={styles.dashMain}>
          {/* Tabs */}
          <div className={styles.tabBar}>
            <Link href="/admin/dashboard" className={styles.tab}>REGISTRANTS</Link>
            <Link href="/admin/analytics" className={styles.tab}>ANALYTICS</Link>
            <Link href="/admin/firms" className={styles.tab}>FIRMS</Link>
            <span className={`${styles.tab} ${styles.tabActive}`}>AMBASSADORS</span>
          </div>

          {/* Generate new code panel */}
          <div className={ambStyles.generatePanel}>
            <p className={ambStyles.panelTitle}>GENERATE REFERRAL LINK</p>
            <div className={ambStyles.generateRow}>
              <select
                className={styles.filterSelect}
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                disabled={generating}
              >
                {INSTITUTIONS.map((inst) => (
                  <option key={inst.value} value={inst.value}>{inst.label}</option>
                ))}
              </select>
              <button
                className={ambStyles.generateBtn}
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'GENERATING...' : 'GENERATE LINK'}
              </button>
              {generateMsg && (
                <span className={generateMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                  {generateMsg.text}
                </span>
              )}
            </div>

            {/* Newly generated code preview */}
            {newCode && (
              <div className={ambStyles.newCodeBox}>
                <div className={ambStyles.newCodeHeader}>
                  <span className={ambStyles.newCodeLabel}>NEW LINK · {INSTITUTIONS.find(i => i.value === selectedInstitution)?.label}</span>
                  <button
                    className={ambStyles.copyBtn}
                    onClick={() => handleCopy(newCode)}
                  >
                    {copied ? '✓ COPIED' : 'COPY LINK'}
                  </button>
                </div>
                <div className={ambStyles.newCodeWrap}>
                  <span className={ambStyles.codePrefix}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=` : '/register?ref='}
                  </span>
                  <span className={ambStyles.codeValue}>{newCode}</span>
                </div>
                <p className={ambStyles.newCodeHint}>
                  Share this link with the campus ambassador. Registrations via this link will be tracked automatically.
                </p>
              </div>
            )}
          </div>

          {/* Ambassador table per institution */}
          {loadingData ? (
            <div className={styles.tableLoading}>Loading ambassadors...</div>
          ) : ambassadors.length === 0 ? (
            <div className={ambStyles.emptyState}>
              No ambassador links generated yet. Use the panel above to create one.
            </div>
          ) : (
            <div className={ambStyles.institutionSections}>
              {INSTITUTIONS.map((inst) => {
                const rows = byInstitution[inst.value] || [];
                if (rows.length === 0) return null;
                const totalRegs = rows.reduce((sum, r) => sum + r.registrationCount, 0);
                return (
                  <div key={inst.value} className={ambStyles.institutionBlock}>
                    <div className={ambStyles.institutionHeader}>
                      <span className={ambStyles.institutionTitle}>{inst.label}</span>
                      <span className={ambStyles.institutionTotal}>
                        {totalRegs} total registration{totalRegs !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className={ambStyles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            {['#', 'Code', 'Referral Link', 'Registrations', 'Created At', 'Actions'].map((h) => (
                              <th key={h} className={styles.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((amb, i) => (
                            <tr key={amb.code} className={`${styles.tr} ${i % 2 === 1 ? styles.trAlt : ''}`}>
                              <td className={styles.td}>{i + 1}</td>
                              <td className={`${styles.td} ${styles.mono}`}>{amb.code}</td>
                              <td className={`${styles.td} ${styles.mono}`}>
                                <span className={ambStyles.linkPreview}>
                                  /register?ref=<strong>{amb.code}</strong>
                                </span>
                              </td>
                              <td className={styles.td}>
                                <span className={ambStyles.countBadge}>
                                  {amb.registrationCount}
                                </span>
                              </td>
                              <td className={`${styles.td} ${styles.mono} ${styles.dateCell}`}>
                                {formatDate(amb.createdAt)}
                              </td>
                              <td className={styles.td}>
                                <button
                                  className={ambStyles.copyRowBtn}
                                  onClick={() => handleCopy(amb.code)}
                                  title="Copy referral link to clipboard"
                                >
                                  COPY LINK
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
