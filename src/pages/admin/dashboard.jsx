import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import {
  getAllRegistrants,
  getRegistrantStats,
  updateRegistrantStatus,
} from '../../firebase/firestoreService';
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

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [registrants, setRegistrants] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [stats, setStats] = useState({ total: 0, consentGiven: 0, pending: 0, today: 0 });

  const [search, setSearch] = useState('');
  const [filterConsent, setFilterConsent] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [expandedRow, setExpandedRow] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

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

  useEffect(() => {
    if (!user) return;
    loadInitial();
    loadStats();
  }, [user]);

  async function loadInitial() {
    setLoadingData(true);
    const result = await getAllRegistrants(null);
    setRegistrants(result.registrants || []);
    setLastDoc(result.lastDoc);
    setHasMore(result.hasMore);
    setLoadingData(false);
  }

  async function loadStats() {
    const s = await getRegistrantStats();
    setStats(s);
  }

  async function loadMore() {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    const result = await getAllRegistrants(lastDoc);
    setRegistrants((prev) => [...prev, ...(result.registrants || [])]);
    setLastDoc(result.lastDoc);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }

  async function handleStatusChange(docId, newStatus) {
    setUpdatingStatus(docId);
    const result = await updateRegistrantStatus(docId, newStatus);
    if (result.success) {
      setRegistrants((prev) =>
        prev.map((r) => (r.id === docId ? { ...r, status: newStatus } : r))
      );
      if (expandedRow === docId) {
        setExpandedRow(null);
        setTimeout(() => setExpandedRow(docId), 10);
      }
    }
    setUpdatingStatus(null);
  }

  async function handleLogout() {
    await signOut(auth);
    router.push('/admin/login');
  }

  const filtered = registrants
    .filter((r) => {
      const q = search.toLowerCase();
      if (q && !(
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.codeforcesHandle.toLowerCase().includes(q)
      )) return false;
      if (filterConsent === 'yes' && !r.dataConsent) return false;
      if (filterConsent === 'no' && r.dataConsent) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.submittedAt) - new Date(a.submittedAt);
      if (sortOrder === 'oldest') return new Date(a.submittedAt) - new Date(b.submittedAt);
      if (sortOrder === 'name') return a.fullName.localeCompare(b.fullName);
      return 0;
    });

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
              onClick={() => exportCSV(filtered)}
              title="Export current view to CSV"
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
              { label: 'Pending Review', value: stats.pending },
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
              <table className={styles.table}>
                <thead>
                  <tr>
                    {['#', 'Full Name', 'Email', 'University', 'CF Handle', 'CC Handle', 'Consent', 'Submitted At', 'Resume', 'ID Card', 'Status'].map((h) => (
                      <th key={h} className={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className={styles.emptyRow}>No registrants found.</td>
                    </tr>
                  ) : filtered.map((r, i) => (
                    <>
                      <tr
                        key={r.id}
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
                            <a
                              href={r.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.viewBtn}
                              onClick={(e) => e.stopPropagation()}
                            >VIEW</a>
                          ) : '—'}
                        </td>
                        <td className={styles.td}>
                          {r.idCardUrl ? (
                            <a
                              href={r.idCardUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.viewBtn}
                              onClick={(e) => e.stopPropagation()}
                            >VIEW</a>
                          ) : '—'}
                        </td>
                        <td className={styles.td}>
                          <span className={
                            r.status === 'approved' ? styles.badgeGreen :
                            r.status === 'rejected' ? styles.badgeRed :
                            styles.badgeAmber
                          }>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>

                      {expandedRow === r.id && (
                        <tr key={`${r.id}-expanded`} className={styles.expandedPanel}>
                          <td colSpan={11} className={styles.expandedCell}>
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
                                  <a href={r.resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>
                                    VIEW PDF
                                  </a>
                                ) : <p className={styles.expandedValue}>—</p>}
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>ID Card</p>
                                {r.idCardUrl ? (
                                  <a href={r.idCardUrl} target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>
                                    VIEW
                                  </a>
                                ) : <p className={styles.expandedValue}>—</p>}
                              </div>
                              <div className={styles.expandedSection}>
                                <p className={styles.expandedLabel}>Update Status</p>
                                <select
                                  className={styles.statusSelect}
                                  value={r.status}
                                  disabled={updatingStatus === r.id}
                                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
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
                    </>
                  ))}
                </tbody>
              </table>
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