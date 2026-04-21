import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
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

function attachTs(registrants) {
  return registrants.map((r) => ({ ...r, _ts: r.submittedAt ? new Date(r.submittedAt).getTime() : 0 }));
}

export default function SubadminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [registrants, setRegistrants] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [stats, setStats] = useState({ total: 0, consentGiven: 0, today: 0, approved: 0 });

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterConsent, setFilterConsent] = useState('all');
  const [filterUniversity, setFilterUniversity] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);

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
        router.replace('/subadmin/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ── Escape to close panel ────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSelectedRegistrant(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Search debounce ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();

    async function loadAll() {
      setLoadingData(true);
      try {
        const token = await getToken();
        const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

        const [regRes, statsRes] = await Promise.all([
          fetch('/api/subadmin/get-registrants', {
            method: 'POST', headers: hdrs,
            body: JSON.stringify({ lastDocId: null }),
            signal: controller.signal,
          }),
          fetch('/api/subadmin/get-stats', {
            method: 'POST', headers: hdrs,
            body: JSON.stringify({}),
            signal: controller.signal,
          }),
        ]);

        const [regData, statsData] = await Promise.all([regRes.json(), statsRes.json()]);
        setRegistrants(attachTs(regData.registrants || []));
        setLastDoc(regData.lastDocId);
        setHasMore(regData.hasMore);
        setStats(statsData);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[subadmin dashboard] loadAll error:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadAll();
    return () => controller.abort();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stats poll — every 5 min ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    async function pollStats() {
      if (document.hidden) return;
      try {
        const hdrs = await authHeaders();
        const res = await fetch('/api/subadmin/get-stats', { method: 'POST', headers: hdrs, body: JSON.stringify({}) });
        const s = await res.json();
        setStats(s);
      } catch { /* silently ignore */ }
    }
    const interval = setInterval(pollStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pagination ────────────────────────────────────────────────────────────
  async function loadMore() {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/subadmin/get-registrants', {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ lastDocId: lastDoc }),
      });
      if (res.status === 410) { setLastDoc(null); setHasMore(false); return; }
      const result = await res.json();
      setRegistrants((prev) => [...prev, ...attachTs(result.registrants || [])]);
      setLastDoc(result.lastDocId);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('[subadmin dashboard] loadMore error:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subadmin' }),
      });
    } catch { /* proceed anyway */ }
    await signOut(auth);
    router.push('/subadmin/login');
  }

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = registrants.filter((r) => {
      if (q && !(
        r.fullName.toLowerCase().includes(q) ||
        r.codeforcesHandle.toLowerCase().includes(q) ||
        (r.university || '').toLowerCase().includes(q)
      )) return false;
      if (filterConsent === 'yes' && !r.dataConsent) return false;
      if (filterConsent === 'no' && r.dataConsent) return false;
      if (filterUniversity !== 'all' && !(r.university || '').toLowerCase().includes(filterUniversity.toLowerCase())) return false;
      if (filterBranch !== 'all' && (r.branch || '').toLowerCase() !== filterBranch.toLowerCase()) return false;
      return true;
    });

    if (sortOrder === 'newest') return list.sort((a, b) => b._ts - a._ts);
    if (sortOrder === 'oldest') return list.sort((a, b) => a._ts - b._ts);
    if (sortOrder === 'name')   return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    return list;
  }, [registrants, search, filterConsent, filterUniversity, filterBranch, sortOrder]);

  if (checking) {
    return (
      <div className={styles.checkingWrap}>
        <span className={styles.checkingDot} />
      </div>
    );
  }

  const r = selectedRegistrant;

  return (
    <>
      <Head>
        <title>Team Dashboard — AMS Derive</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.dashPage}>
        <header className={styles.topBar}>
          <span className={styles.topBarTitle}>
            AMS <span className={styles.topBarGold}>DERIVE</span>
            <span className={styles.topBarAdmin}> — TEAM</span>
          </span>
          <div className={styles.topBarRight}>
            <span className={styles.topBarEmail}>{user?.email}</span>
            <button className={styles.logoutBtn} onClick={handleLogout}>LOGOUT</button>
          </div>
        </header>

        <main className={styles.dashMain}>
          {/* Tabs */}
          <div className={styles.tabBar}>
            <span className={`${styles.tab} ${styles.tabActive}`}>REGISTRANTS</span>
            <Link href="/subadmin/analytics" className={styles.tab}>ANALYTICS</Link>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            {[
              { label: 'Total Registrants', value: stats.total },
              { label: 'Approved', value: stats.approved },
              { label: "Today's Registrations", value: stats.today },
              { label: 'Data Consent', value: stats.consentGiven },
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
              placeholder="Search name, CF handle, university..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <select className={styles.filterSelect} value={filterConsent} onChange={(e) => setFilterConsent(e.target.value)}>
              <option value="all">All</option>
              <option value="yes">Consent Given</option>
              <option value="no">Consent Not Given</option>
            </select>
            <select className={styles.filterSelect} value={filterUniversity} onChange={(e) => setFilterUniversity(e.target.value)}>
              <option value="all">All Universities</option>
              <option value="iit">IIT</option>
              <option value="nit">NIT</option>
              <option value="iiit">IIIT</option>
              <option value="bits">BITS</option>
              <option value="vit">VIT</option>
              <option value="thadomal">Thadomal</option>
            </select>
            <select className={styles.filterSelect} value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
              <option value="all">All Branches</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="AI & Machine Learning">AI &amp; Machine Learning</option>
              <option value="Electronics & Communication Engineering">Electronics &amp; Communication Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Chemical Engineering">Chemical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Engineering Physics">Engineering Physics</option>
              <option value="Mathematics and Computing">Mathematics and Computing</option>
              <option value="Data Science & Engineering">Data Science &amp; Engineering</option>
              <option value="Biotechnology">Biotechnology</option>
              <option value="Statistics">Statistics</option>
              <option value="Other">Other</option>
            </select>
            <select className={styles.filterSelect} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
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
              <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'auto', width: '100%' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {['#', 'Full Name', 'University', 'Branch', 'CF Handle', 'Consent', 'Submitted At'].map((h) => (
                        <th key={h} className={styles.th} style={{ position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className={styles.emptyRow}>No registrants found.</td></tr>
                    ) : filtered.map((reg, i) => (
                      <tr
                        key={reg.id}
                        className={`${styles.tr} ${i % 2 === 1 ? styles.trAlt : ''} ${selectedRegistrant?.id === reg.id ? styles.trSelected : ''} ${reg.status === 'approved' ? styles.trApproved : ''}`}
                        onClick={() => setSelectedRegistrant(selectedRegistrant?.id === reg.id ? null : reg)}
                      >
                        <td className={styles.td}>{i + 1}</td>
                        <td className={styles.td}>{reg.fullName}</td>
                        <td className={styles.td}>{reg.university}</td>
                        <td className={styles.td}>{reg.branch || '—'}</td>
                        <td className={`${styles.td} ${styles.mono}`}>
                          <a
                            href={`https://codeforces.com/profile/${reg.codeforcesHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.cfLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {reg.codeforcesHandle}
                          </a>
                        </td>
                        <td className={styles.td}>
                          <span className={reg.dataConsent ? styles.badgeGreen : styles.badgeRed}>
                            {reg.dataConsent ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.mono} ${styles.dateCell}`}>{formatDate(reg.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasMore && (
            <div className={styles.loadMoreWrap}>
              <button className={styles.loadMoreBtn} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <span className={styles.loadingDots}>Loading</span> : 'LOAD MORE'}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Side panel */}
      {r && (
        <>
          <div className={styles.panelBackdrop} onClick={() => setSelectedRegistrant(null)} />
          <aside className={styles.sidePanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelName}>{r.fullName}</span>
              <button className={styles.panelClose} onClick={() => setSelectedRegistrant(null)}>CLOSE ✕</button>
            </div>

            <div className={styles.panelBody}>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>University</p>
                <p className={styles.panelValue}>{r.university}</p>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Branch</p>
                <p className={styles.panelValue}>{r.branch || '—'}</p>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Graduation Year</p>
                <p className={styles.panelValue}>{r.graduationYear || '—'}</p>
              </div>

              <div className={styles.panelDivider} />

              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Codeforces Handle</p>
                <a
                  href={`https://codeforces.com/profile/${r.codeforcesHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.panelValue} ${styles.mono} ${styles.cfLink}`}
                >
                  {r.codeforcesHandle}
                </a>
              </div>

              <div className={styles.panelDivider} />

              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Data Consent</p>
                <span className={r.dataConsent ? styles.badgeGreen : styles.badgeRed}>
                  {r.dataConsent ? 'YES' : 'NO'}
                </span>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Round</p>
                <p className={`${styles.panelValue} ${styles.mono}`}>{(r.round || 'prior').toUpperCase()}</p>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Status</p>
                <span className={r.status === 'approved' ? styles.badgeGreen : r.status === 'rejected' ? styles.badgeRed : styles.badgeGrey}>
                  {(r.status || 'pending').toUpperCase()}
                </span>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Submitted At</p>
                <p className={`${styles.panelValue} ${styles.mono}`}>{formatDate(r.submittedAt)}</p>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
