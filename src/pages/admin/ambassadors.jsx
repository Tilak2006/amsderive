import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { AMBASSADOR_REF_MAP } from '../../lib/ambassador-codes';
import styles from '../../styles/admin.module.css';

function normalizeInstitution(name) {
  return name.replace(/\s*\(Ambassador \d+\)$/, '').trim();
}

// All unique institution names from the ref map (multi-ambassador colleges merged)
const ALL_KNOWN_INSTITUTIONS = new Set(
  Object.values(AMBASSADOR_REF_MAP).map(normalizeInstitution)
);

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

const INPUT_STYLE = {
  background: '#111',
  border: '1px solid #333',
  color: '#D4AF37',
  padding: '3px 6px',
  fontFamily: 'var(--font-mono), monospace',
  fontSize: '0.78rem',
  borderRadius: '2px',
};

export default function AdminAmbassadors() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expandedCode, setExpandedCode] = useState(null);
  const [offsets, setOffsets] = useState({});
  const [pendingOffsets, setPendingOffsets] = useState({});
  const [savingOffset, setSavingOffset] = useState({});
  const [newInstName, setNewInstName] = useState('');
  const [newInstOffset, setNewInstOffset] = useState(0);
  const [addingCustom, setAddingCustom] = useState(false);
  const [refreshingLeaderboard, setRefreshingLeaderboard] = useState(false);
  const [leaderboardRefreshedAt, setLeaderboardRefreshedAt] = useState(null);

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
    const [statsRes, offsetsRes] = await Promise.all([
      fetch('/api/admin/get-ambassador-stats', { method: 'POST', headers, body: JSON.stringify({}) }),
      fetch('/api/admin/get-ambassador-offsets', { method: 'GET', headers }),
    ]);
    const statsResult = await statsRes.json();
    const offsetsResult = await offsetsRes.json();
    setData(statsResult);
    const loaded = offsetsResult.offsets || {};
    setOffsets(loaded);
    setPendingOffsets(loaded);
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

  // All institutions: every known ref-map institution + any custom ones from offsets,
  // pre-filled with actual pre-registration counts where applicable.
  const institutionData = useMemo(() => {
    const map = {};

    // Seed with all known institutions at zero
    for (const inst of ALL_KNOWN_INSTITUTIONS) {
      map[inst] = { institution: inst, actualCount: 0, isCustom: false };
    }

    // Fill in actual counts from pre_registrations grouped by ref code
    for (const row of tableData) {
      const inst = normalizeInstitution(row.institution);
      if (map[inst]) {
        map[inst].actualCount += row.count;
      } else {
        map[inst] = { institution: inst, actualCount: row.count, isCustom: false };
      }
    }

    // Add custom institutions stored in offsets that aren't in the ref map
    for (const inst of Object.keys(offsets)) {
      if (!map[inst]) {
        map[inst] = { institution: inst, actualCount: 0, isCustom: true };
      }
    }

    return Object.values(map).sort((a, b) => {
      const dispA = a.actualCount + (offsets[a.institution] || 0);
      const dispB = b.actualCount + (offsets[b.institution] || 0);
      return dispB - dispA || b.actualCount - a.actualCount;
    });
  }, [tableData, offsets]);

  async function handleSaveOffset(institution) {
    setSavingOffset((prev) => ({ ...prev, [institution]: true }));
    const headers = await getAuthHeader(user);
    const offset = pendingOffsets[institution] ?? 0;
    await fetch('/api/admin/update-ambassador-offset', {
      method: 'POST',
      headers,
      body: JSON.stringify({ institution, offset }),
    });
    setOffsets((prev) => ({ ...prev, [institution]: offset }));
    setSavingOffset((prev) => ({ ...prev, [institution]: false }));
  }

  async function handleAddCustom() {
    const name = newInstName.trim();
    if (!name) return;
    setAddingCustom(true);
    const headers = await getAuthHeader(user);
    const offset = newInstOffset;
    await fetch('/api/admin/update-ambassador-offset', {
      method: 'POST',
      headers,
      body: JSON.stringify({ institution: name, offset }),
    });
    setOffsets((prev) => ({ ...prev, [name]: offset }));
    setPendingOffsets((prev) => ({ ...prev, [name]: offset }));
    setNewInstName('');
    setNewInstOffset(0);
    setAddingCustom(false);
  }

  async function handleRefreshLeaderboard() {
    setRefreshingLeaderboard(true);
    const headers = await getAuthHeader(user);
    await fetch('/api/admin/refresh-ambassador-leaderboard', { method: 'POST', headers });
    setLeaderboardRefreshedAt(new Date());
    setRefreshingLeaderboard(false);
  }

  async function handleLogout() {
    document.cookie = '__session=; path=/; max-age=0; SameSite=Strict; Secure';
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
            <Link href="/admin/firms" className={styles.tab}>FIRMS</Link>
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

              {/* Institution leaderboard offset management */}
              <div style={{ marginTop: '40px' }}>
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <span className={styles.statLabel} style={{ fontSize: '0.7rem', letterSpacing: '0.18em' }}>
                      CAMPUS AMBASSADOR LEADERBOARD — OFFSET MANAGEMENT
                    </span>
                    <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '6px', fontFamily: 'var(--font-mono), monospace' }}>
                      Offset is added to actual count on the public leaderboard. Admin-only.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <button
                      className={styles.exportBtn}
                      style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}
                      onClick={handleRefreshLeaderboard}
                      disabled={refreshingLeaderboard}
                    >
                      {refreshingLeaderboard ? 'REFRESHING...' : 'REFRESH LEADERBOARD'}
                    </button>
                    {leaderboardRefreshedAt && (
                      <span style={{ fontSize: '0.6rem', color: '#555', fontFamily: 'var(--font-mono), monospace' }}>
                        Refreshed {leaderboardRefreshedAt.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {['Institution', 'Actual', 'Offset', 'Displayed', ''].map((h) => (
                          <th key={h} className={styles.th} style={{ position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {institutionData.map((row, i) => {
                        const pending = pendingOffsets[row.institution] ?? 0;
                        return (
                          <tr key={row.institution} className={`${styles.tr} ${i % 2 === 1 ? styles.trAlt : ''}`}>
                            <td className={styles.td}>
                              {row.institution}
                              {row.isCustom && (
                                <span style={{ fontSize: '0.6rem', color: '#555', marginLeft: '6px', fontFamily: 'var(--font-mono), monospace' }}>
                                  CUSTOM
                                </span>
                              )}
                            </td>
                            <td className={styles.td} style={{ fontVariantNumeric: 'tabular-nums' }}>{row.actualCount}</td>
                            <td className={styles.td}>
                              <input
                                type="number"
                                min="0"
                                max="1000000"
                                value={pending}
                                onChange={(e) => {
                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                  setPendingOffsets((prev) => ({ ...prev, [row.institution]: val }));
                                }}
                                style={{ ...INPUT_STYLE, width: '72px' }}
                              />
                            </td>
                            <td className={styles.td} style={{ fontVariantNumeric: 'tabular-nums', color: '#D4AF37' }}>
                              {row.actualCount + pending}
                            </td>
                            <td className={styles.td} style={{ textAlign: 'center' }}>
                              <button
                                className={styles.exportBtn}
                                style={{ fontSize: '0.62rem', padding: '3px 10px' }}
                                onClick={() => handleSaveOffset(row.institution)}
                                disabled={savingOffset[row.institution]}
                              >
                                {savingOffset[row.institution] ? 'SAVING...' : 'SAVE'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add custom institution */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="New institution name"
                    value={newInstName}
                    onChange={(e) => setNewInstName(e.target.value)}
                    maxLength={100}
                    style={{ ...INPUT_STYLE, width: '220px', color: '#ccc' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    placeholder="0"
                    value={newInstOffset}
                    onChange={(e) => setNewInstOffset(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ ...INPUT_STYLE, width: '80px' }}
                  />
                  <button
                    className={styles.exportBtn}
                    style={{ fontSize: '0.65rem' }}
                    onClick={handleAddCustom}
                    disabled={!newInstName.trim() || addingCustom}
                  >
                    {addingCustom ? 'ADDING...' : '+ ADD INSTITUTION'}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
