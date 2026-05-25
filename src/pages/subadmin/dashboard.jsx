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

function buildSubadminRequestBody(filters, lastDocId = null, includeOptions = false) {
  return {
    lastDocId,
    includeOptions,
    search: filters.search,
    status: filters.status,
    round: filters.round,
    dateRange: filters.dateRange,
    startDate: filters.startDate,
    endDate: filters.endDate,
    graduationYear: filters.graduationYear,
    university: filters.university === 'all' ? '' : filters.university,
    branch: filters.branch === 'all' ? '' : filters.branch,
    consent: filters.consent,
    sortOrder: filters.sortOrder,
  };
}

function statusBadgeClass(status) {
  if (status === 'approved') return styles.badgeGreen;
  if (status === 'rejected') return styles.badgeRed;
  return styles.badgeGrey;
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRound, setFilterRound] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterGraduationYear, setFilterGraduationYear] = useState('all');
  const [filterConsent, setFilterConsent] = useState('all');
  const [filterUniversity, setFilterUniversity] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [universityOptions, setUniversityOptions] = useState([]);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);

  const userRef = useRef(null);
  const tokenCache = useRef({ token: null, expiry: 0 });
  const lastUrlQueryRef = useRef('');
  const tableScrollRef = useRef(null);
  const lastRegistrantFilterKeyRef = useRef('');

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

  async function handleViewResume(fileUrl) {
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/subadmin/get-signed-url', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ fileUrl }),
      });
      const data = await res.json();
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('Could not open resume. Please try again.');
      }
    } catch {
      alert('Could not open resume. Please try again.');
    }
  }

  const registrantFilters = useMemo(() => ({
    search,
    status: filterStatus,
    round: filterRound,
    dateRange: filterDateRange,
    startDate: filterStartDate,
    endDate: filterEndDate,
    graduationYear: filterGraduationYear,
    consent: filterConsent,
    university: filterUniversity,
    branch: filterBranch,
    sortOrder,
  }), [
    search,
    filterStatus,
    filterRound,
    filterDateRange,
    filterStartDate,
    filterEndDate,
    filterGraduationYear,
    filterConsent,
    filterUniversity,
    filterBranch,
    sortOrder,
  ]);

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

  // ── URL-persisted registrant filters ────────────────────────────────────
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query || {};
    const get = (key, fallback = '') => {
      const value = q[key];
      return Array.isArray(value) ? (value[0] || fallback) : (value || fallback);
    };
    const urlState = {
      search: get('search'),
      status: get('status', 'all'),
      round: get('round', 'all'),
      dateRange: get('dateRange', 'all'),
      startDate: get('startDate'),
      endDate: get('endDate'),
      graduationYear: get('graduationYear', 'all'),
      consent: get('consent', 'all'),
      university: get('university', 'all'),
      branch: get('branch', 'all'),
      sort: get('sort', 'newest'),
    };
    const compactQuery = {};
    if (urlState.search) compactQuery.search = urlState.search;
    if (urlState.status !== 'all') compactQuery.status = urlState.status;
    if (urlState.round !== 'all') compactQuery.round = urlState.round;
    if (urlState.dateRange !== 'all') compactQuery.dateRange = urlState.dateRange;
    if (urlState.dateRange === 'custom' && urlState.startDate) compactQuery.startDate = urlState.startDate;
    if (urlState.dateRange === 'custom' && urlState.endDate) compactQuery.endDate = urlState.endDate;
    if (urlState.graduationYear !== 'all') compactQuery.graduationYear = urlState.graduationYear;
    if (urlState.consent !== 'all') compactQuery.consent = urlState.consent;
    if (urlState.university !== 'all') compactQuery.university = urlState.university;
    if (urlState.branch !== 'all') compactQuery.branch = urlState.branch;
    if (urlState.sort !== 'newest') compactQuery.sort = urlState.sort;
    const serialized = JSON.stringify(compactQuery);
    if (filtersHydrated && serialized === lastUrlQueryRef.current) return;
    lastUrlQueryRef.current = serialized;

    setSearchInput(urlState.search);
    setSearch(urlState.search);
    setFilterStatus(urlState.status);
    setFilterRound(urlState.round);
    setFilterDateRange(urlState.dateRange);
    setFilterStartDate(urlState.startDate);
    setFilterEndDate(urlState.endDate);
    setFilterGraduationYear(urlState.graduationYear);
    setFilterConsent(urlState.consent);
    setFilterUniversity(urlState.university);
    setFilterBranch(urlState.branch);
    setSortOrder(urlState.sort);
    setFiltersHydrated(true);
  }, [router.isReady, router.query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!router.isReady || !filtersHydrated) return;

    const nextQuery = {};
    if (search) nextQuery.search = search;
    if (filterStatus !== 'all') nextQuery.status = filterStatus;
    if (filterRound !== 'all') nextQuery.round = filterRound;
    if (filterDateRange !== 'all') nextQuery.dateRange = filterDateRange;
    if (filterDateRange === 'custom' && filterStartDate) nextQuery.startDate = filterStartDate;
    if (filterDateRange === 'custom' && filterEndDate) nextQuery.endDate = filterEndDate;
    if (filterGraduationYear !== 'all') nextQuery.graduationYear = filterGraduationYear;
    if (filterConsent !== 'all') nextQuery.consent = filterConsent;
    if (filterUniversity !== 'all') nextQuery.university = filterUniversity;
    if (filterBranch !== 'all') nextQuery.branch = filterBranch;
    if (sortOrder !== 'newest') nextQuery.sort = sortOrder;

    const serialized = JSON.stringify(nextQuery);
    if (serialized === lastUrlQueryRef.current) return;
    lastUrlQueryRef.current = serialized;
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [
    router,
    filtersHydrated,
    search,
    filterStatus,
    filterRound,
    filterDateRange,
    filterStartDate,
    filterEndDate,
    filterGraduationYear,
    filterConsent,
    filterUniversity,
    filterBranch,
    sortOrder,
  ]);

  // ── Search debounce ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Initial stats load ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();

    async function loadAll() {
      try {
        const token = await getToken();
        const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

        const statsRes = await fetch('/api/subadmin/get-stats', {
          method: 'POST', headers: hdrs,
          body: JSON.stringify({}),
          signal: controller.signal,
        });

        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[subadmin dashboard] loadAll error:', err);
      }
    }

    loadAll();
    return () => controller.abort();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter-aware registrant load ────────────────────────────────────────
  useEffect(() => {
    if (!user || !filtersHydrated) return;
    const controller = new AbortController();

    async function loadRegistrants() {
      const filterKey = JSON.stringify(registrantFilters);
      const filtersChanged = lastRegistrantFilterKeyRef.current && lastRegistrantFilterKeyRef.current !== filterKey;
      lastRegistrantFilterKeyRef.current = filterKey;
      if (filtersChanged && tableScrollRef.current) {
        tableScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      setLoadingData(true);
      setSelectedRegistrant(null);
      try {
        const hdrs = await authHeaders();
        const res = await fetch('/api/subadmin/get-registrants', {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify(buildSubadminRequestBody(registrantFilters, null, universityOptions.length === 0)),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Registrant load failed');
        const result = await res.json();
        setRegistrants(attachTs(result.registrants || []));
        setLastDoc(result.lastDocId);
        setHasMore(result.hasMore);
        if (result.filterOptions?.universities) {
          setUniversityOptions(result.filterOptions.universities);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[subadmin dashboard] loadRegistrants error:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadRegistrants();
    return () => controller.abort();
  }, [user?.uid, filtersHydrated, registrantFilters]); // eslint-disable-line react-hooks/exhaustive-deps

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
        body: JSON.stringify(buildSubadminRequestBody(registrantFilters, lastDoc)),
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

  // Registrants are filtered and sorted by /api/subadmin/get-registrants.
  const filtered = registrants;

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
          <div className={`${styles.filterBar} ${styles.filterBarSticky}`}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search name, CF handle, university..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <select className={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select className={styles.filterSelect} value={filterRound} onChange={(e) => setFilterRound(e.target.value)}>
              <option value="all">All Rounds</option>
              <option value="prior">PRIOR</option>
              <option value="posterior">POSTERIOR</option>
              <option value="convergence">CONVERGENCE</option>
            </select>
            <select className={styles.filterSelect} value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)}>
              <option value="all">Any Date</option>
              <option value="today">Today</option>
              <option value="last24h">Last 24h</option>
              <option value="last7d">Last 7d</option>
              <option value="custom">Custom Range</option>
            </select>
            {filterDateRange === 'custom' && (
              <>
                <input
                  className={styles.filterTextInput}
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
                <input
                  className={styles.filterTextInput}
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </>
            )}
            <select className={styles.filterSelect} value={filterGraduationYear} onChange={(e) => setFilterGraduationYear(e.target.value)}>
              <option value="all">All Grad Years</option>
              {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map((year) => (
                <option key={year} value={String(year)}>{year}</option>
              ))}
            </select>
            <select className={styles.filterSelect} value={filterConsent} onChange={(e) => setFilterConsent(e.target.value)}>
              <option value="all">All</option>
              <option value="yes">Consent Given</option>
              <option value="no">Consent Not Given</option>
            </select>
            <select className={styles.filterSelect} value={filterUniversity} onChange={(e) => setFilterUniversity(e.target.value)}>
              <option value="all">All Universities</option>
              {[
                ...(filterUniversity !== 'all' && !universityOptions.includes(filterUniversity) ? [filterUniversity] : []),
                ...universityOptions,
              ].map((university) => (
                <option key={university} value={university}>{university}</option>
              ))}
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
            <span className={`${styles.resultCount} ${loadingData && filtered.length > 0 ? styles.resultCountLoading : ''}`}>
              {loadingData && filtered.length > 0
                ? 'Refreshing...'
                : `Showing ${filtered.length}${hasMore ? '+' : ''} result${filtered.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {/* Table */}
          {loadingData && filtered.length === 0 ? (
            <div className={styles.tableLoading}>Loading registrants...</div>
          ) : (
            <div className={`${styles.tableWrap} ${loadingData ? styles.tableRefreshing : ''}`}>
              <div ref={tableScrollRef} className={styles.tableViewport}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {['#', 'Full Name', 'Status', 'Round', 'University', 'Branch', 'Grad Year', 'CF Handle', 'Consent', 'Submitted At'].map((h) => (
                        <th key={h} className={styles.th} style={{ position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={10} className={styles.emptyRow}>No registrants found.</td></tr>
                    ) : filtered.map((reg, i) => (
                      <tr
                        key={reg.id}
                        className={`${styles.tr} ${i % 2 === 1 ? styles.trAlt : ''} ${selectedRegistrant?.id === reg.id ? styles.trSelected : ''} ${reg.status === 'approved' ? styles.trApproved : ''}`}
                        onClick={() => setSelectedRegistrant(selectedRegistrant?.id === reg.id ? null : reg)}
                      >
                        <td className={styles.td}>{i + 1}</td>
                        <td className={styles.td}>{reg.fullName}</td>
                        <td className={styles.td}>
                          <span className={statusBadgeClass(reg.status)}>
                            {(reg.status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.badgeAmber}>
                            {(reg.round || 'prior').toUpperCase()}
                          </span>
                        </td>
                        <td className={styles.td}>{reg.university}</td>
                        <td className={styles.td}>{reg.branch || '—'}</td>
                        <td className={`${styles.td} ${styles.mono}`}>{reg.graduationYear || '—'}</td>
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

              {r.linkedIn && (
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>LinkedIn</p>
                  <a
                    href={r.linkedIn.startsWith('http') ? r.linkedIn : `https://${r.linkedIn}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.panelValue} ${styles.cfLink}`}
                    style={{ wordBreak: 'break-all' }}
                  >
                    {r.linkedIn}
                  </a>
                </div>
              )}

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

              {r.resumeUrl && (
                <>
                  <div className={styles.panelDivider} />
                  <div className={styles.panelSection}>
                    <p className={styles.panelLabel}>Resume</p>
                    <button
                      className={styles.panelActionBtn}
                      onClick={() => handleViewResume(r.resumeUrl)}
                    >
                      VIEW RESUME
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
