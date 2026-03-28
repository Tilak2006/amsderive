import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { AMBASSADOR_REF_MAP } from '../../lib/ambassador-codes';
import styles from '../../styles/admin.module.css';

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

function exportAmbassadorCSV(refGroups) {
  const headers = ['Ref Code', 'Institution', 'Registration Count', 'Last Registration', 'Emails'];
  const rows = refGroups.map((g) => [
    `"${g.code}"`,
    `"${g.institution}"`,
    g.count,
    `"${formatDate(g.lastRegistration)}"`,
    `"${g.emails.map((e) => e.email).join('; ')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ams-derive-ambassadors-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function getAuthHeader(currentUser) {
  const token = await currentUser?.getIdToken();
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminAmbassadors() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expandedCode, setExpandedCode] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setChecking(false);
      } else {
        router.replace('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const headers = await getAuthHeader(user);
    const res = await fetch('/api/admin/get-ambassador-stats', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const result = await res.json();
    setData(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  const tableData = useMemo(() => {
    if (!data?.refGroups) return [];
    return data.refGroups.map((g) => ({
      code: g.code,
      institution: AMBASSADOR_REF_MAP[g.code.toLowerCase()] || g.code,
      count: g.emails.length,
      lastRegistration: g.emails.length > 0 ? g.emails[0].submittedAt : null,
      emails: g.emails,
    }));
  }, [data]);

  async function handleLogout() {
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
            <button
              className={styles.exportBtn}
              onClick={() => tableData.length > 0 && exportAmbassadorCSV(tableData)}
              disabled={tableData.length === 0}
            >
              EXPORT CSV
            </button>
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
            <span className={`${styles.tab} ${styles.tabActive}`}>AMBASSADORS</span>
          </div>

          {loading ? (
            <div className={styles.tableLoading}>Loading ambassador data...</div>
          ) : (
            <>
              {/* Summary cards */}
              <div className={styles.statsGrid}>
                {[
                  { label: 'Total Pre-Registrations', value: data?.totalOverall || 0 },
                  { label: 'With Ref Code', value: data?.totalWithRef || 0 },
                  { label: 'Without Ref Code', value: data?.totalWithoutRef || 0 },
                  { label: 'Active Ambassadors', value: tableData.length },
                ].map((s) => (
                  <div key={s.label} className={styles.statCard}>
                    <span className={styles.statLabel}>{s.label}</span>
                    <span className={styles.statValue}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Ambassador table */}
              <div className={styles.tableWrap}>
                <div style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'auto', width: '100%' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {['Ref Code', 'Institution', 'Registrations', 'Last Registration', ''].map((h) => (
                          <th key={h} className={styles.th} style={{ position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className={styles.emptyRow}>No ambassador referrals yet.</td>
                        </tr>
                      ) : tableData.map((row, i) => (
                        <React.Fragment key={row.code}>
                          <tr
                            className={`${styles.tr} ${i % 2 === 1 ? styles.trAlt : ''} ${expandedCode === row.code ? styles.trExpanded : ''}`}
                            onClick={() => setExpandedCode(expandedCode === row.code ? null : row.code)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className={`${styles.td} ${styles.mono}`}>{row.code}</td>
                            <td className={styles.td}>{row.institution}</td>
                            <td className={styles.td} style={{ fontVariantNumeric: 'tabular-nums' }}>{row.count}</td>
                            <td className={`${styles.td} ${styles.mono} ${styles.dateCell}`}>{formatDate(row.lastRegistration)}</td>
                            <td className={styles.td} style={{ textAlign: 'center', fontSize: '0.6rem', color: '#6b6560' }}>
                              {expandedCode === row.code ? '▲' : '▼'}
                            </td>
                          </tr>
                          {expandedCode === row.code && (
                            <tr className={styles.expandedPanel}>
                              <td colSpan={5} className={styles.expandedCell}>
                                <table className={styles.table} style={{ width: '100%', marginBottom: 0 }}>
                                  <thead>
                                    <tr>
                                      <th className={styles.th} style={{ position: 'static' }}>#</th>
                                      <th className={styles.th} style={{ position: 'static' }}>Email</th>
                                      <th className={styles.th} style={{ position: 'static' }}>Registered At</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.emails.map((e, j) => (
                                      <tr key={e.email + j} className={j % 2 === 1 ? styles.trAlt : ''}>
                                        <td className={styles.td}>{j + 1}</td>
                                        <td className={`${styles.td} ${styles.mono}`}>{e.email}</td>
                                        <td className={`${styles.td} ${styles.mono} ${styles.dateCell}`}>{formatDate(e.submittedAt)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
