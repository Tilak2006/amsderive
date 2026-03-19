import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
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

function exportCSV(data) {
  const headers = [
    'Full Name', 'Email', 'University',
    'CF Handle', 'CC Handle', 'Data Consent', 'Submitted At', 'Status',
  ];
  const rows = data.map((r) => [
    `"${(r.fullName || '').replace(/"/g, '""')}"`,
    `"${(r.email || '').replace(/"/g, '""')}"`,
    `"${(r.university || '').replace(/"/g, '""')}"`,
    `"${(r.codeforcesHandle || '').replace(/"/g, '""')}"`,
    `"${(r.codechefHandle || '').replace(/"/g, '""')}"`,
    r.dataConsent ? 'Yes' : 'No',
    `"${formatDate(r.submittedAt)}"`,
    r.status || 'pending',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ams-derive-registrants-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function getAuthHeader(currentUser) {
  const token = await currentUser?.getIdToken();
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [registrants, setRegistrants] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [stats, setStats] = useState({ total: 0, consentGiven: 0, today: 0 });

  const [search, setSearch] = useState('');
  const [filterConsent, setFilterConsent] = useState('all');
  const [filterUniversity, setFilterUniversity] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [expandedRow, setExpandedRow] = useState(null);

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

  const loadInitial = useCallback(async () => {
    setLoadingData(true);
    const headers = await getAuthHeader(user);
    const res = await fetch('/api/admin/get-registrants', {
      method: 'POST',
      headers,
      body: JSON.stringify({ lastDocId: null }),
    });
    const result = await res.json();
    setRegistrants(result.registrants || []);
    setLastDoc(result.lastDocId);
    setHasMore(result.hasMore);
    setLoadingData(false);
  }, [user]);

  const loadStats = useCallback(async () => {
    const headers = await getAuthHeader(user);
    const res = await fetch('/api/admin/get-stats', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const s = await res.json();
    setStats(s);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadInitial();
    loadStats();
  }, [user, loadInitial, loadStats]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, loadStats]);

  async function loadMore() {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    const headers = await getAuthHeader(user);
    const res = await fetch('/api/admin/get-registrants', {
      method: 'POST',
      headers,
      body: JSON.stringify({ lastDocId: lastDoc }),
    });
    const result = await res.json();
    setRegistrants((prev) => [...prev, ...(result.registrants || [])]);
    setLastDoc(result.lastDocId);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }

  async function handleLogout() {
    await signOut(auth);
    router.push('/admin/login');
  }

  async function handleViewFile(fileUrl) {
    const headers = await getAuthHeader(user);
    const res = await fetch('/api/admin/get-signed-url', {
      method: 'POST',
      headers,
      body: JSON.stringify({ fileUrl }),
    });
    const data = await res.json();
    if (data.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }
  }

  const filtered = useMemo(() =>
    registrants
      .filter((r) => {
        const q = search.toLowerCase();
        if (q && !(
          r.fullName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.codeforcesHandle.toLowerCase().includes(q) ||
          (r.university || '').toLowerCase().includes(q)
        )) return false;
        if (filterConsent === 'yes' && !r.dataConsent) return false;
        if (filterConsent === 'no' && r.dataConsent) return false;
        if (filterUniversity !== 'all' && !(r.university || '').toLowerCase().includes(filterUniversity.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.submittedAt) - new Date(a.submittedAt);
        if (sortOrder === 'oldest') return new Date(a.submittedAt) - new Date(b.submittedAt);
        if (sortOrder === 'name') return a.fullName.localeCompare(b.fullName);
        return 0;
      }),
    [registrants, search, filterConsent, filterUniversity, sortOrder]
  );

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
        <title>Dashboard — AMS Derive Admin</title>
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
              onClick={async () => {
                if (hasMore) {
                  // Fetch all from server for complete export
                  const headers = await getAuthHeader(user);
                  const res = await fetch('/api/admin/export-registrants', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({}),
                  });
                  const data = await res.json();
                  if (data.registrants) exportCSV(data.registrants);
                } else {
                  // All data loaded — export filtered view
                  exportCSV(filtered);
                }
              }}
              title={hasMore ? 'Export all registrants to CSV' : `Export ${filtered.length} filtered registrants to CSV`}
            >
              EXPORT CSV
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        </header>

        <main className={styles.dashMain}>
          {/* Stats */}
          <div className={styles.statsGrid}>
            {[
              { label: 'Total Registrants', value: stats.total },
              { label: 'Data Consent', value: stats.consentGiven },
              { label: "Today's Registrations", value: stats.today },
            ].map((s) => (
              <div key={s.label} className={styles.statCard}>
                <span className={styles.statLabel}>{s.label}</span>
                <span className={styles.statValue}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className={styles.filterBar}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search name, email, CF handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={styles.filterSelect}
              value={filterConsent}
              onChange={(e) => setFilterConsent(e.target.value)}
            >
              <option value="all">All</option>
              <option value="yes">Consent Given</option>
              <option value="no">Consent Not Given</option>
            </select>
            <select
              className={styles.filterSelect}
              value={filterUniversity}
              onChange={(e) => setFilterUniversity(e.target.value)}
            >
              <option value="all">All Universities</option>
              <option value="iit">IIT</option>
              <option value="nit">NIT</option>
              <option value="iiit">IIIT</option>
              <option value="bits">BITS</option>
              <option value="vit">VIT</option>
              <option value="thadomal">Thadomal</option>
            </select>
            <select
              className={styles.filterSelect}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A–Z</option>
            </select>
            <span className={styles.resultCount}>
              Showing {filtered.length} of {registrants.length}
            </span>
          </div>

          {/* Table */}
          {loadingData ? (
            <div className={styles.tableLoading}>Loading registrants...</div>
          ) : (
            <div className={styles.tableWrap}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                <thead>
                  <tr>
                    {['#', 'Full Name', 'Email', 'University', 'CF Handle', 'CC Handle', 'Consent', 'Submitted At', 'Resume', 'ID Card'].map((h) => (
                      <th key={h} className={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className={styles.emptyRow}>No registrants found.</td>
                    </tr>
                  ) : filtered.map((r, i) => (
                    <React.Fragment key={r.id}>
                      <tr
                        className={`${styles.tr} ${i % 2 === 1 ? styles.trAlt : ''} ${expandedRow === r.id ? styles.trExpanded : ''}`}
                        onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                      >
                        <td className={styles.td}>{i + 1}</td>
                        <td className={styles.td}>{r.fullName}</td>
                        <td className={`${styles.td} ${styles.mono}`}>{r.email}</td>
                        <td className={styles.td}>{r.university}</td>
                        <td className={`${styles.td} ${styles.mono}`}>
                          <a
                            href={`https://codeforces.com/profile/${r.codeforcesHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.cfLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {r.codeforcesHandle}
                          </a>
                        </td>
                        <td className={`${styles.td} ${styles.mono}`}>{r.codechefHandle || '—'}</td>
                        <td className={styles.td}>
                          <span className={r.dataConsent ? styles.badgeGreen : styles.badgeRed}>
                            {r.dataConsent ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.mono} ${styles.dateCell}`}>{formatDate(r.submittedAt)}</td>
                        <td className={styles.td}>
                          {r.resumeUrl ? (
                            <button
                              className={styles.viewBtn}
                              onClick={(e) => { e.stopPropagation(); handleViewFile(r.resumeUrl); }}
                            >VIEW</button>
                          ) : '—'}
                        </td>
                        <td className={styles.td}>
                          {r.idCardUrl ? (
                            <button
                              className={styles.viewBtn}
                              onClick={(e) => { e.stopPropagation(); handleViewFile(r.idCardUrl); }}
                            >VIEW</button>
                          ) : '—'}
                        </td>
                      </tr>

                      {expandedRow === r.id && (
                        <tr key={`${r.id}-expanded`} className={styles.expandedPanel}>
                          <td colSpan={10} className={styles.expandedCell}>
                            <div className={styles.expandedGrid}>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>Full Name</p>
                                <p className={styles.expandedValue}>{r.fullName}</p>
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>Email</p>
                                <p className={`${styles.expandedValue} ${styles.mono}`}>{r.email}</p>
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>University</p>
                                <p className={styles.expandedValue}>{r.university}</p>
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>CF Handle</p>
                                <a
                                  href={`https://codeforces.com/profile/${r.codeforcesHandle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${styles.expandedValue} ${styles.mono} ${styles.cfLink}`}
                                >
                                  {r.codeforcesHandle}
                                </a>
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>CC Handle</p>
                                <p className={`${styles.expandedValue} ${styles.mono}`}>{r.codechefHandle || '—'}</p>
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>LinkedIn</p>
                                {r.linkedIn ? (
                                  <a
                                    href={r.linkedIn.startsWith('http') ? r.linkedIn : `https://${r.linkedIn}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.expandedValue} ${styles.mono} ${styles.cfLink}`}
                                  >
                                    {r.linkedIn}
                                  </a>
                                ) : <p className={styles.expandedValue}>—</p>}
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>GitHub</p>
                                {r.gitHub ? (
                                  <a
                                    href={r.gitHub.startsWith('http') ? r.gitHub : `https://${r.gitHub}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.expandedValue} ${styles.mono} ${styles.cfLink}`}
                                  >
                                    {r.gitHub}
                                  </a>
                                ) : <p className={styles.expandedValue}>—</p>}
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>Data Consent</p>
                                <p className={styles.expandedValue}>{r.dataConsent ? 'Yes' : 'No'}</p>
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>IP Hash</p>
                                <p className={`${styles.expandedValue} ${styles.mono}`}>{r.ipHash}</p>
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>Submitted At</p>
                                <p className={`${styles.expandedValue} ${styles.mono}`}>{formatDate(r.submittedAt)}</p>
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>Resume</p>
                                {r.resumeUrl ? (
                                  <button className={styles.viewBtn} onClick={(e) => { e.stopPropagation(); handleViewFile(r.resumeUrl); }}>
                                    VIEW PDF
                                  </button>
                                ) : <p className={styles.expandedValue}>—</p>}
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>ID Card</p>
                                {r.idCardUrl ? (
                                  <button className={styles.viewBtn} onClick={(e) => { e.stopPropagation(); handleViewFile(r.idCardUrl); }}>
                                    VIEW
                                  </button>
                                ) : <p className={styles.expandedValue}>—</p>}
                              </div>
                            </div>
                            <button
                              className={styles.closeExpanded}
                              onClick={() => setExpandedRow(null)}
                            >
                              CLOSE ✕
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {hasMore && (
            <div className={styles.loadMoreWrap}>
              <button
                className={styles.loadMoreBtn}
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? <span className={styles.loadingDots}>Loading</span> : 'LOAD MORE'}
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}