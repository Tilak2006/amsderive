import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import styles from '../../styles/firm.module.css';

// Lazy-load Recharts only when analytics tab is activated
const RechartsComponents = dynamic(
  () =>
    import('recharts').then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } = mod;
      function RechartsProvider({ children }) {
        return children({ BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid });
      }
      return RechartsProvider;
    }),
  {
    ssr: false,
    loading: () => (
      <div className={styles.tableLoading} style={{ minHeight: '300px' }}>
        Loading chart...
      </div>
    ),
  }
);

const GOLD = '#D4AF37';
const LABEL_COLOR = '#6b6560';

const TIER_DESCRIPTIONS = {
  derivation:
    'Derivation Partner — Live leaderboard access (coming soon), performance analytics, logo on the AMS Derive contest platform, and round sponsorship across PRIOR and POSTERIOR rounds.',
  convergence:
    'Convergence Partner — All Derivation benefits, plus finalist profile access, an evaluation panel seat at IIT Bombay finals, in-person attendance, and first access to finalist talent.',
  apex:
    'Apex Partner | Full access to elite quant and CP talent, early finalist resumes ahead of all other partners, custom filtering, naming rights, and bespoke configuration across all contest communications.',
};

const ACCESS_MATRIX = [
  { key: 'registrantProfiles', label: 'Registrant Profiles', status: 'active', unlockLabel: null },
  { key: 'analytics', label: 'Performance Analytics', status: 'active', unlockLabel: null },
  { key: 'linkedinAccess', label: 'LinkedIn Access', status: 'active', unlockLabel: null },
  { key: 'namingRights', label: 'Naming Rights', status: 'active', unlockLabel: null },
  { key: 'leaderboard', label: 'Live Leaderboard', status: 'upcoming', unlockLabel: 'Unlocks May 23' },
  { key: 'resumeDownload', label: 'Resume Download', status: 'upcoming', unlockLabel: 'Unlocks May 24' },
  { key: 'finalistProfiles', label: 'Finalist Profiles', status: 'upcoming', unlockLabel: 'Unlocks Jul 1' },
];

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>{label}</p>
      <p className={styles.chartTooltipValue}>{payload[0].value}</p>
    </div>
  );
}

async function getAuthHeader(currentUser) {
  const token = await currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const CONTEST_ROUNDS = [
  {
    index: '01',
    date: 'May 23, 2026',
    timestamp: new Date('2026-05-23'),
    title: 'Round 1 | PRIOR',
    desc: 'Individual · Codeforces Gym · ICPC format. Online qualification across probability theory and market microstructure.',
  },
  {
    index: '02',
    date: 'June 21, 2026',
    timestamp: new Date('2026-06-21'),
    title: 'Round 2 | POSTERIOR',
    desc: 'Individual · Advanced quantitative problems. Stochastic processes and options pricing. Filters Round 1 performers.',
  },
  {
    index: '03',
    date: 'July 11, 2026',
    timestamp: new Date('2026-07-11'),
    title: 'Round 3 | CONVERGENCE',
    desc: 'Teams of 3 · Offline at a prestigious IIT. Open-ended quant problems with partner firm evaluation.',
  },
];

function getRoundPhase(timestamp) {
  const now = new Date();
  const end = new Date(timestamp);
  end.setDate(end.getDate() + 1);
  if (now > end) return 'past';
  const diffDays = (timestamp - now) / (1000 * 60 * 60 * 24);
  if (diffDays <= 14) return 'active';
  return 'future';
}

function FirmTimeline() {
  const { phases, goldWidthPct } = useMemo(() => {
    const ph = CONTEST_ROUNDS.map(r => getRoundPhase(r.timestamp));
    const pastCount = ph.filter(p => p === 'past').length;
    const activeIdx = ph.indexOf('active');
    let frac = 0;
    if (pastCount > 0 || activeIdx >= 0) {
      const lastIdx = activeIdx >= 0 ? activeIdx : pastCount - 1;
      frac = Math.min((lastIdx * 50) / 100, 1);
    }
    return { phases: ph, goldWidthPct: `${Math.round(frac * 100)}%` };
  }, []);

  return (
    <div className={styles.ftTrack} style={{ '--ft-gold-width': goldWidthPct }}>
      {CONTEST_ROUNDS.map(({ index, date, timestamp, title, desc }, i) => {
        const phase = phases[i];
        const isPast = phase === 'past';
        const isActive = phase === 'active';
        const isFuture = phase === 'future';
        return (
          <div key={index} className={styles.ftCol}>
            <div className={[styles.ftNode, isPast ? styles.ftNodePast : '', isActive ? styles.ftNodeActive : ''].join(' ')}>
              {index}
            </div>
            <div className={[styles.ftCard, isPast ? styles.ftCardPast : '', isActive ? styles.ftCardActive : '', isFuture ? styles.ftCardFuture : ''].join(' ')}>
              {isActive && (
                <span className={styles.ftActiveBadge}>
                  <span className={styles.ftActiveDot} />
                  Active
                </span>
              )}
              <div className={[styles.ftDate, isFuture ? styles.ftDateFuture : ''].join(' ')}>{date}</div>
              <div className={[styles.ftCardTitle, isFuture ? styles.ftCardTitleFuture : ''].join(' ')}>{title}</div>
              <p className={styles.ftCardDesc}>{desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FirmDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [firmProfile, setFirmProfile] = useState(null);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const tabDataLoaded = useRef(new Set());
  const profileUidRef = useRef(null);

  // Talent pool state
  const [finalists, setFinalists] = useState([]);
  const [finalistsLoading, setFinalistsLoading] = useState(false);
  const [finalistsAccess, setFinalistsAccess] = useState(null);
  const [finalistsCount, setFinalistsCount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('all');
  const [selectedFinalist, setSelectedFinalist] = useState(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Overview stats state
  const [overviewStats, setOverviewStats] = useState(null);

  // Registrants state
  const [registrants, setRegistrants] = useState([]);
  const [registrantsLoading, setRegistrantsLoading] = useState(false);
  const [registrantsAccessError, setRegistrantsAccessError] = useState(null);
  const [registrantsTotal, setRegistrantsTotal] = useState(null);
  const [registrantsHasMore, setRegistrantsHasMore] = useState(false);
  const [registrantsLastId, setRegistrantsLastId] = useState(null);
  const [registrantsSearch, setRegistrantsSearch] = useState('');
  const [registrantsFilterUniversity, setRegistrantsFilterUniversity] = useState('all');
  const [registrantsFilterBranch, setRegistrantsFilterBranch] = useState('all');
  const [registrantsFilterGradYear, setRegistrantsFilterGradYear] = useState('all');
  const [registrantsAccess, setRegistrantsAccess] = useState(null);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Starred candidates — persisted in localStorage
  const [starred, setStarred] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem('ams_derive_starred');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  function toggleStar(id, e) {
    if (e) e.stopPropagation();
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem('ams_derive_starred', JSON.stringify([...next])); } catch { }
      return next;
    });
  }

  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const leaderboardIntervalRef = useRef(null);

  // Auth check on mount
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!isMounted) return;
      if (u) {
        // Skip profile re-fetch on token refresh — same user already loaded
        if (profileUidRef.current === u.uid) {
          setChecking(false);
          return;
        }
        try {
          const token = await u.getIdToken();
          const res = await fetch('/api/firm/get-firm-profile', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          });
          if (!res.ok) {
            router.replace('/firm/login');
            return;
          }
          const profile = await res.json();
          profileUidRef.current = u.uid;
          setUser(u);
          setFirmProfile(profile);
          setChecking(false);
        } catch {
          router.replace('/firm/login');
        }
      } else {
        profileUidRef.current = null;
        router.replace('/firm/login');
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  // Lazy-load tab data (once per tab per session)
  useEffect(() => {
    if (!user || !firmProfile) return;

    if (activeTab === 'overview' && !tabDataLoaded.current.has('overview')) {
      tabDataLoaded.current.add('overview');
      fetchOverviewStats();
    }
    if (activeTab === 'talent' && !tabDataLoaded.current.has('talent')) {
      tabDataLoaded.current.add('talent');
      fetchFinalists();
    }
    if (activeTab === 'analytics' && !tabDataLoaded.current.has('analytics')) {
      tabDataLoaded.current.add('analytics');
      fetchAnalytics();
    }
    if (activeTab === 'registrants' && !tabDataLoaded.current.has('registrants')) {
      tabDataLoaded.current.add('registrants');
      fetchRegistrants();
    }
    if (activeTab === 'leaderboard' && !tabDataLoaded.current.has('leaderboard')) {
      tabDataLoaded.current.add('leaderboard');
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, firmProfile]);

  const fetchRegistrants = useCallback(async (after = null) => {
    setRegistrantsLoading(true);
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/get-registrants', {
        method: 'POST',
        headers,
        body: JSON.stringify({ limit: 50, after }),
      });
      const data = await res.json();
      if (res.status === 403) {
        setRegistrantsAccessError(data.message || 'Access denied');
        return;
      }
      if (!res.ok) {
        setRegistrantsAccessError(data.error || 'Failed to load registrant data.');
        return;
      }
      setRegistrants((prev) => (after ? [...prev, ...data.registrants] : data.registrants));
      setRegistrantsTotal(data.count);
      setRegistrantsHasMore(data.hasMore);
      setRegistrantsLastId(data.lastId);
      if (data.access) setRegistrantsAccess(data.access);
    } catch {
      setRegistrantsAccessError('Failed to load registrant data.');
    } finally {
      setRegistrantsLoading(false);
    }
  }, [user]);

  const fetchFinalists = useCallback(async () => {
    setFinalistsLoading(true);
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/get-finalists', { method: 'POST', headers, body: JSON.stringify({}) });
      if (res.status === 403) {
        const data = await res.json();
        setFinalistsAccess({ locked: true, reason: data.message });
        return;
      }
      const data = await res.json();
      setFinalists(data.finalists || []);
      setFinalistsAccess(data.access);
      setFinalistsCount(data.count);
    } catch {
      setFinalistsAccess({ locked: true, reason: 'Failed to load finalist data.' });
    } finally {
      setFinalistsLoading(false);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/get-leaderboard', { method: 'POST', headers, body: JSON.stringify({}) });
      const data = await res.json();
      if (res.status === 403) {
        setLeaderboardError({ type: 'access', message: data.message || 'Access denied' });
        return;
      }
      if (!res.ok) {
        setLeaderboardError({ type: 'fetch', message: data.error || 'Failed to load leaderboard' });
        return;
      }
      setLeaderboardData(data);
      setLeaderboardError(null);
    } catch {
      setLeaderboardError({ type: 'fetch', message: 'Failed to load leaderboard' });
    } finally {
      setLeaderboardLoading(false);
    }
  }, [user]);

  // Auto-refresh leaderboard every 30s while on the tab
  useEffect(() => {
    if (activeTab !== 'leaderboard' || !firmProfile) return;
    leaderboardIntervalRef.current = setInterval(fetchLeaderboard, 30000);
    return () => {
      if (leaderboardIntervalRef.current) clearInterval(leaderboardIntervalRef.current);
    };
  }, [activeTab, firmProfile, fetchLeaderboard]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/public/inst-stats');
      const data = await res.json();
      setAnalyticsData(data);
    } catch {
      setAnalyticsData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchOverviewStats = useCallback(async () => {
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/get-overview-stats', { method: 'POST', headers, body: JSON.stringify({}) });
      if (!res.ok) return;
      const data = await res.json();
      setOverviewStats(data);
    } catch {
      // non-critical — overview still renders without stats
    }
  }, [user]);

  const filteredFinalists = useMemo(() => {
    let list = finalists;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.fullName?.toLowerCase().includes(q) ||
          f.university?.toLowerCase().includes(q)
      );
    }
    if (filterUniversity !== 'all') {
      list = list.filter((f) => f.university === filterUniversity);
    }
    return list;
  }, [finalists, searchQuery, filterUniversity]);

  const uniqueUniversities = useMemo(() => {
    const set = new Set(finalists.map((f) => f.university).filter(Boolean));
    return Array.from(set).sort();
  }, [finalists]);

  const uniqueRegistrantUniversities = useMemo(() => {
    const set = new Set(registrants.map((r) => r.university).filter(Boolean));
    return Array.from(set).sort();
  }, [registrants]);

  const uniqueRegistrantBranches = useMemo(() => {
    const set = new Set(registrants.map((r) => r.branch).filter(Boolean));
    return Array.from(set).sort();
  }, [registrants]);

  const chartData = useMemo(() => {
    if (!analyticsData?.institutions?.length) return [];
    return [...analyticsData.institutions]
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [analyticsData]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'firm' }),
      });
    } catch {
      // Proceed with client-side logout even if server call fails
    }
    await signOut(auth);
    router.push('/firm/login');
  }

  function handleViewLinkedIn(finalist) {
    if (finalist.linkedIn) window.open(finalist.linkedIn, '_blank', 'noopener,noreferrer');
  }

  async function handleViewResume(finalist) {
    if (!finalist.resumeUrl) return;
    window.open(finalist.resumeUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleExportCsv() {
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/export-registrants-csv', { method: 'POST', headers, body: JSON.stringify({}) });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ams-derive-registrants-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent — export is non-critical
    }
  }

  async function handleViewFile(fileUrl) {
    if (!fileUrl) return;
    const headers = await getAuthHeader(user);
    const res = await fetch('/api/firm/get-signed-url', {
      method: 'POST',
      headers,
      body: JSON.stringify({ fileUrl }),
    });
    const data = await res.json();
    if (data.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  function getTierBadgeClass(tier) {
    if (tier === 'apex') return `${styles.tierBadge} ${styles.tierApex}`;
    if (tier === 'convergence') return `${styles.tierBadge} ${styles.tierConvergence}`;
    return `${styles.tierBadge} ${styles.tierDerivation}`;
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
        <title>{firmProfile?.firmName || 'Partner Portal'} — AMS Derive</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.dashPage}>
        {/* Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            {firmProfile?.firmName === 'Jane Street' ? (
              <img src="/Jane_Street.svg" alt="Jane Street" className={styles.firmLogoSvg} />
            ) : firmProfile?.logoUrl ? (
              <img src={firmProfile.logoUrl} alt="" className={styles.firmLogo} />
            ) : (
              <span className={styles.topBarTitle}>{firmProfile?.firmName || 'PARTNER PORTAL'}</span>
            )}
            {firmProfile?.tier && (
              <span className={getTierBadgeClass(firmProfile.tier)}>
                {firmProfile.tier.toUpperCase()} PARTNER
              </span>
            )}
          </div>
          <div className={styles.topBarRight}>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        </header>

        <main className={styles.dashMain}>
          {/* Tab Bar */}
          <div className={styles.tabBar}>
            {[
              { key: 'overview', label: 'OVERVIEW' },
              { key: 'talent', label: 'TALENT POOL' },
              { key: 'registrants', label: 'REGISTRANTS' },
              { key: 'analytics', label: 'ANALYTICS' },
              { key: 'leaderboard', label: 'LEADERBOARD' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div>
              {/* Hero */}
              <div className={styles.overviewHero}>
                <div className={styles.overviewHeroInner}>
                  {firmProfile?.firmName === 'Jane Street' && (
                    <div className={styles.coBrandLockup}>
                      <img src="/AMS_DERIVE_TEXT.svg" alt="AMS Derive" className={styles.coBrandLogo} />
                      <span className={styles.coBrandDivider} />
                      <img src="/Jane_Street.svg" alt="Jane Street" className={styles.coBrandLogo} />
                    </div>
                  )}
                  <h1 className={styles.welcomeTitle}>
                    Welcome,{' '}
                    <span className={styles.welcomeGold}>{firmProfile?.firmName}</span>
                  </h1>
                  <p className={styles.tierDescription}>
                    {TIER_DESCRIPTIONS[firmProfile?.tier] || ''}
                  </p>
                </div>
                <div className={styles.overviewHeroRule} />
              </div>

              {/* Metrics row */}
              {overviewStats && (
                <div className={styles.metricsRow}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricValue}>
                      {overviewStats.total.toLocaleString()}
                    </span>
                    <span className={styles.metricLabel}>Total Registrants</span>
                  </div>
                </div>
              )}

              {/* Action Center */}
              <p className={styles.sectionLabel} style={{ marginBottom: 16, marginTop: overviewStats ? 32 : 0 }}>Action Center</p>
              <div className={styles.quickActionGrid}>
                <button
                  className={styles.quickActionCard}
                  onClick={() => setActiveTab('registrants')}
                  disabled={firmProfile?.tier === 'derivation'}
                >
                  <span className={styles.quickActionIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span className={styles.quickActionTitle}>Newest Candidates</span>
                  {firmProfile?.tier === 'derivation' ? (
                    <span className={styles.quickActionDesc}>Convergence & Apex only</span>
                  ) : overviewStats?.recentNames?.length ? (
                    <span className={styles.quickActionRecentNames}>
                      {overviewStats.recentNames.map((name, i) => (
                        <span key={i} className={styles.quickActionRecentName}>{name}</span>
                      ))}
                    </span>
                  ) : (
                    <span className={styles.quickActionDesc}>Browse all registrant profiles</span>
                  )}
                  <span className={`${styles.quickActionArrow} ${firmProfile?.tier === 'derivation' ? styles.quickActionArrowLocked : ''}`}>→</span>
                </button>

                <button
                  className={styles.quickActionCard}
                  onClick={() => setActiveTab('analytics')}
                >
                  <span className={styles.quickActionIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </span>
                  <span className={styles.quickActionTitle}>Registration Velocity</span>
                  {overviewStats?.sparkline ? (
                    <span className={styles.sparklineWrap} aria-hidden="true">
                      {(() => {
                        const max = Math.max(...overviewStats.sparkline, 1);
                        return overviewStats.sparkline.map((v, i) => (
                          <span
                            key={i}
                            className={styles.sparklineBar}
                            style={{ height: `${Math.max(3, Math.round((v / max) * 32))}px` }}
                          />
                        ));
                      })()}
                    </span>
                  ) : (
                    <span className={styles.quickActionDesc}>8-week registration trend</span>
                  )}
                  <span className={styles.quickActionArrow}>→</span>
                </button>

                <button
                  className={styles.quickActionCard}
                  onClick={() => setActiveTab('leaderboard')}
                  disabled={firmProfile?.tier === 'derivation'}
                >
                  <span className={styles.quickActionIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="12" width="5" height="9" rx="1" /><rect x="10" y="4" width="5" height="17" rx="1" /><rect x="17" y="8" width="5" height="13" rx="1" />
                    </svg>
                  </span>
                  <span className={styles.quickActionTitle}>Live Leaderboard</span>
                  <span className={styles.quickActionDesc}>
                    {firmProfile?.tier === 'derivation'
                      ? 'Convergence & Apex only'
                      : 'Real-time PRIOR standings · Live 23 May'}
                  </span>
                  <span className={`${styles.quickActionArrow} ${firmProfile?.tier === 'derivation' ? styles.quickActionArrowLocked : ''}`}>→</span>
                </button>
              </div>

              {/* Shortlist banner */}
              <button
                className={styles.shortlistBanner}
                onClick={() => { setShowStarredOnly(true); setActiveTab('registrants'); }}
                disabled={firmProfile?.tier === 'derivation'}
              >
                <span className={styles.shortlistBannerLeft}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={starred.size > 0 ? '#D4AF37' : 'none'} stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className={styles.shortlistBannerTitle}>Starred</span>
                  <span className={styles.shortlistBannerCount}>
                    {starred.size} candidate{starred.size !== 1 ? 's' : ''} starred
                  </span>
                </span>
                <span className={styles.shortlistBannerArrow}>→</span>
              </button>

              {/* Contest Timeline */}
              <p className={styles.sectionLabel} style={{ marginTop: 40, marginBottom: 32 }}>Contest Timeline</p>
              <FirmTimeline />

              {/* Access Matrix */}
              <p className={styles.sectionLabel} style={{ marginTop: 40, marginBottom: 0 }}>Your Access</p>
              <div className={styles.accessMatrix}>
                {ACCESS_MATRIX.map((item) => {
                  const granted = firmProfile?.access?.[item.key];
                  const isActive = item.status === 'active' && granted;
                  return (
                    <div key={item.key} className={styles.accessMatrixRow}>
                      <span className={styles.accessMatrixLabel}>{item.label}</span>
                      {isActive ? (
                        <span className={styles.accessBadgeActive}>
                          <span className={styles.accessBadgeDot} />
                          Active
                        </span>
                      ) : (
                        <span className={styles.accessBadgeLocked}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          {item.unlockLabel || 'Locked'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Contact line */}
              <p className={styles.overviewContact}>
                Dedicated Partner Support —{' '}
                <a href="mailto:partnership@amsociety.in" className={styles.overviewContactLink}>
                  partnership@amsociety.in
                </a>
              </p>
            </div>
          )}

          {/* ── TALENT POOL TAB ── */}
          {activeTab === 'talent' && (
            <div>
              {/* Derivation tier — no talent pool access */}
              {firmProfile?.tier === 'derivation' ? (
                <div className={styles.accessDenied}>
                  <div className={styles.accessDeniedIcon}>🔒</div>
                  <p className={styles.accessDeniedTitle}>Not Included in Derivation Tier</p>
                  <p className={styles.accessDeniedText}>
                    Talent Pool access is available to Convergence and Apex partners. Contact{' '}
                    <a href="mailto:partnership@amsociety.in" style={{ color: '#D4AF37' }}>
                      partnership@amsociety.in
                    </a>{' '}
                    to upgrade your partnership.
                  </p>
                </div>
              ) : finalistsLoading ? (
                <div className={styles.tableLoading}>Loading finalist data...</div>
              ) : finalistsAccess?.locked ? (
                /* Admin has not yet unlocked finalistProfiles */
                <div className={styles.lockedCard}>
                  <div className={styles.lockedCardIcon}>🔒</div>
                  <p className={styles.lockedCardTitle}>Finalist Profiles Locked</p>
                  <p className={styles.lockedCardText}>
                    Finalist profiles will be unlocked by the organizing team after the relevant round.
                    Check back soon, or reach out to{' '}
                    <a href="mailto:partnership@amsociety.in" style={{ color: '#D4AF37' }}>
                      partnership@amsociety.in
                    </a>
                    .
                  </p>
                </div>
              ) : (
                <>
                  {/* Filter bar */}
                  <div className={styles.talentFilterBar}>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search name or university..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select
                      className={styles.filterSelect}
                      value={filterUniversity}
                      onChange={(e) => setFilterUniversity(e.target.value)}
                    >
                      <option value="all">All Universities</option>
                      {uniqueUniversities.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <span className={styles.resultCount}>
                      {filteredFinalists.length}{finalistsCount !== null && finalistsCount !== filteredFinalists.length ? `/${finalistsCount}` : ''} finalist{filteredFinalists.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {filteredFinalists.length === 0 ? (
                    <div className={styles.accessDenied}>
                      <p className={styles.accessDeniedTitle}>
                        {finalistsCount === 0
                          ? 'No finalists designated yet'
                          : 'No results match your search'}
                      </p>
                      <p className={styles.accessDeniedText}>
                        {finalistsCount === 0
                          ? 'Finalist designations are updated by the organizing team as rounds complete.'
                          : 'Try adjusting your search or university filter.'}
                      </p>
                    </div>
                  ) : (
                    <div className={styles.candidateGrid}>
                      {filteredFinalists.map((finalist) => (
                        <div
                          key={finalist.id}
                          className={styles.candidateCard}
                          onClick={() => setSelectedFinalist(finalist)}
                        >
                          <p className={styles.candidateName}>{finalist.fullName}</p>
                          <p className={styles.candidateUniv}>{finalist.university}</p>
                          <div className={styles.candidateActions}>
                            {finalistsAccess?.resumeDownload && finalist.resumeUrl ? (
                              <button
                                className={styles.docBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewResume(finalist);
                                }}
                              >
                                RESUME
                              </button>
                            ) : (
                              <span
                                className={styles.docBtnLocked}
                                title="Available after Finals"
                              >
                                RESUME — AFTER FINALS
                              </span>
                            )}
                            {finalistsAccess?.linkedinAccess && finalist.linkedIn ? (
                              <button
                                className={styles.docBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewLinkedIn(finalist);
                                }}
                              >
                                LINKEDIN
                              </button>
                            ) : (
                              <span
                                className={styles.docBtnLocked}
                                title="Available after Finals"
                              >
                                LINKEDIN — AFTER FINALS
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── REGISTRANTS TAB ── */}
          {activeTab === 'registrants' && (
            <div className={selectedRegistrant ? styles.splitLayout : undefined}>
              {firmProfile?.tier === 'derivation' ? (
                <div className={styles.accessDenied}>
                  <div className={styles.accessDeniedIcon}>🔒</div>
                  <p className={styles.accessDeniedTitle}>Not Included in Derivation Tier</p>
                  <p className={styles.accessDeniedText}>
                    Registrant Profiles access is available to Convergence and Apex partners. Contact{' '}
                    <a href="mailto:partnership@amsociety.in" style={{ color: '#D4AF37' }}>
                      partnership@amsociety.in
                    </a>{' '}
                    to upgrade your partnership.
                  </p>
                </div>
              ) : registrantsAccessError ? (
                <div className={styles.lockedCard}>
                  <div className={styles.lockedCardIcon}>🔒</div>
                  <p className={styles.lockedCardTitle}>Registrant Profiles Locked</p>
                  <p className={styles.lockedCardText}>{registrantsAccessError}</p>
                </div>
              ) : registrantsLoading && registrants.length === 0 ? (
                <div className={styles.tableLoading}>Loading registrant data...</div>
              ) : (
                <>
                  <div className={styles.talentFilterBar}>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search name or institution..."
                      value={registrantsSearch}
                      onChange={(e) => setRegistrantsSearch(e.target.value)}
                    />
                    <select
                      className={styles.filterSelect}
                      value={registrantsFilterUniversity}
                      onChange={(e) => setRegistrantsFilterUniversity(e.target.value)}
                    >
                      <option value="all">All Universities</option>
                      {uniqueRegistrantUniversities.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <select
                      className={styles.filterSelect}
                      value={registrantsFilterBranch}
                      onChange={(e) => setRegistrantsFilterBranch(e.target.value)}
                    >
                      <option value="all">All Branches</option>
                      {uniqueRegistrantBranches.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <select
                      className={styles.filterSelect}
                      value={registrantsFilterGradYear}
                      onChange={(e) => setRegistrantsFilterGradYear(e.target.value)}
                    >
                      <option value="all">All Grad Years</option>
                      {[2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                    <button
                      className={`${styles.starredFilterPill} ${showStarredOnly ? styles.starredFilterPillActive : ''}`}
                      onClick={() => setShowStarredOnly((v) => !v)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill={showStarredOnly ? '#D4AF37' : 'none'} stroke={showStarredOnly ? '#D4AF37' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Starred{starred.size > 0 ? ` (${starred.size})` : ''}
                    </button>
                    {registrantsTotal !== null && (
                      <span className={styles.resultCount}>
                        {(registrantsSearch.trim() || registrantsFilterUniversity !== 'all' || registrantsFilterBranch !== 'all' || registrantsFilterGradYear !== 'all')
                          ? `${registrants.filter((r) => {
                              if (registrantsSearch.trim()) {
                                const q = registrantsSearch.toLowerCase();
                                if (!r.fullName?.toLowerCase().includes(q) && !r.university?.toLowerCase().includes(q)) return false;
                              }
                              if (registrantsFilterUniversity !== 'all' && r.university !== registrantsFilterUniversity) return false;
                              if (registrantsFilterBranch !== 'all' && r.branch !== registrantsFilterBranch) return false;
                              if (registrantsFilterGradYear !== 'all' && String(r.graduationYear) !== registrantsFilterGradYear) return false;
                              return true;
                            }).length} / `
                          : ''}
                        {registrantsTotal} registrant{registrantsTotal !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      className={styles.exportBtn}
                      onClick={handleExportCsv}
                      title="Export registrants as CSV"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      EXPORT CSV
                    </button>
                  </div>

                  <div className={styles.leaderboardTableWrap}>
                    <table className={styles.leaderboardTable}>
                      <thead>
                        <tr className={styles.leaderboardThead}>
                          <th className={styles.leaderboardTh}>#</th>
                          <th className={styles.leaderboardTh}>Name</th>
                          <th className={styles.leaderboardTh}>Institution</th>
                          <th className={styles.leaderboardTh}>Branch</th>
                          <th className={styles.leaderboardTh}>Grad Year</th>
                          <th className={styles.leaderboardTh}>Round</th>
                          <th className={styles.leaderboardTh}>CF Handle</th>
                          <th className={styles.leaderboardTh} style={{ width: 36 }}>
                            <button
                              className={`${styles.starFilterBtn} ${showStarredOnly ? styles.starFilterBtnActive : ''}`}
                              onClick={() => setShowStarredOnly((v) => !v)}
                              title={showStarredOnly ? 'Show all' : 'Show starred only'}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill={showStarredOnly ? '#D4AF37' : 'none'} stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrants
                          .filter((r) => {
                            if (showStarredOnly && !starred.has(r.id)) return false;
                            if (registrantsSearch.trim()) {
                              const q = registrantsSearch.toLowerCase();
                              if (
                                !r.fullName?.toLowerCase().includes(q) &&
                                !r.university?.toLowerCase().includes(q)
                              ) return false;
                            }
                            if (registrantsFilterUniversity !== 'all' && r.university !== registrantsFilterUniversity) return false;
                            if (registrantsFilterBranch !== 'all' && r.branch !== registrantsFilterBranch) return false;
                            if (registrantsFilterGradYear !== 'all' && String(r.graduationYear) !== registrantsFilterGradYear) return false;
                            return true;
                          })
                          .map((r, i) => (
                            <tr
                              key={r.id}
                              className={`${styles.leaderboardTr} ${selectedRegistrant?.id === r.id ? styles.leaderboardTrSelected : ''} ${starred.has(r.id) ? styles.leaderboardTrStarred : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedRegistrant(selectedRegistrant?.id === r.id ? null : r)}
                            >
                              <td className={styles.leaderboardTd}>
                                <span className={styles.rankMuted}>{i + 1}</span>
                              </td>
                              <td className={styles.leaderboardTd}>{r.fullName}</td>
                              <td className={styles.leaderboardTd}>{r.university}</td>
                              <td className={styles.leaderboardTd}>{r.branch || <span style={{ color: '#3a3a3a' }}>—</span>}</td>
                              <td className={styles.leaderboardTd}>{r.graduationYear || <span style={{ color: '#3a3a3a' }}>—</span>}</td>
                              <td className={styles.leaderboardTd}>
                                {r.round ? (
                                  <span style={{ textTransform: 'uppercase', color: '#D4AF37', fontSize: '0.75rem' }}>
                                    {r.round}
                                  </span>
                                ) : (
                                  <span style={{ color: '#3a3a3a' }}>—</span>
                                )}
                              </td>
                              <td className={styles.leaderboardTd}>
                                {r.codeforcesHandle ? (
                                  <a
                                    href={`https://codeforces.com/profile/${r.codeforcesHandle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.handleLink}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {r.codeforcesHandle}
                                  </a>
                                ) : (
                                  <span style={{ color: '#3a3a3a' }}>—</span>
                                )}
                              </td>
                              <td className={styles.leaderboardTd}>
                                <button
                                  className={`${styles.starBtn} ${starred.has(r.id) ? styles.starBtnActive : ''}`}
                                  onClick={(e) => toggleStar(r.id, e)}
                                  title={starred.has(r.id) ? 'Unstar' : 'Star'}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill={starred.has(r.id) ? '#D4AF37' : 'none'} stroke={starred.has(r.id) ? '#D4AF37' : '#3a3a3a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {registrantsHasMore && (
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <button
                        className={styles.refreshBtn}
                        onClick={() => fetchRegistrants(registrantsLastId)}
                        disabled={registrantsLoading}
                      >
                        {registrantsLoading ? 'Loading...' : 'LOAD MORE'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Detail panel — shown when a registrant row is selected */}
              {selectedRegistrant && (
                <aside className={styles.detailPanel}>
                  <div className={styles.panelHeader}>
                    <span className={styles.panelTitle}>{selectedRegistrant.fullName}</span>
                    <div className={styles.panelHeaderActions}>
                      <button
                        className={`${styles.panelStarBtn} ${starred.has(selectedRegistrant.id) ? styles.panelStarBtnActive : ''}`}
                        onClick={(e) => toggleStar(selectedRegistrant.id, e)}
                        title={starred.has(selectedRegistrant.id) ? 'Unstar' : 'Star'}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill={starred.has(selectedRegistrant.id) ? '#D4AF37' : 'none'} stroke={starred.has(selectedRegistrant.id) ? '#D4AF37' : '#6b6560'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                      <button
                        className={styles.panelClose}
                        onClick={() => setSelectedRegistrant(null)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className={styles.panelRow}>
                    <span className={styles.panelLabel}>Institution</span>
                    <span className={styles.panelValue}>{selectedRegistrant.university || '—'}</span>
                  </div>

                  <div className={styles.panelRow}>
                    <span className={styles.panelLabel}>Branch</span>
                    <span className={styles.panelValue}>{selectedRegistrant.branch || '—'}</span>
                  </div>

                  <div className={styles.panelRow}>
                    <span className={styles.panelLabel}>Graduation Year</span>
                    <span className={styles.panelValue}>{selectedRegistrant.graduationYear || '—'}</span>
                  </div>

                  <div className={styles.panelRow}>
                    <span className={styles.panelLabel}>Round</span>
                    <span className={styles.panelValue} style={{ textTransform: 'uppercase', color: '#D4AF37' }}>
                      {selectedRegistrant.round || '—'}
                    </span>
                  </div>

                  {selectedRegistrant.codeforcesHandle && (
                    <div className={styles.panelRow}>
                      <span className={styles.panelLabel}>CF Handle</span>
                      <a
                        href={`https://codeforces.com/profile/${selectedRegistrant.codeforcesHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.handleLink}
                      >
                        {selectedRegistrant.codeforcesHandle}
                      </a>
                    </div>
                  )}

                  {selectedRegistrant.gitHub && (
                    <div className={styles.panelRow}>
                      <span className={styles.panelLabel}>GitHub</span>
                      <a
                        href={selectedRegistrant.gitHub}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.handleLink}
                      >
                        {selectedRegistrant.gitHub.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                      </a>
                    </div>
                  )}

                  {registrantsAccess?.linkedinAccess && selectedRegistrant.linkedIn && (
                    <div className={styles.panelRow}>
                      <span className={styles.panelLabel}>LinkedIn</span>
                      <a
                        href={selectedRegistrant.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.handleLink}
                      >
                        View Profile
                      </a>
                    </div>
                  )}

                  <div className={styles.panelFileActions}>
                    {registrantsAccess?.resumeDownload ? (
                      <>
                        <button
                          className={styles.panelActionBtn}
                          disabled={!selectedRegistrant.resumeUrl}
                          onClick={() => handleViewFile(selectedRegistrant.resumeUrl)}
                        >
                          VIEW RESUME
                        </button>
                        <button
                          className={styles.panelActionBtn}
                          disabled={!selectedRegistrant.transcriptUrl}
                          onClick={() => handleViewFile(selectedRegistrant.transcriptUrl)}
                        >
                          VIEW TRANSCRIPT
                        </button>
                      </>
                    ) : (
                      <p className={styles.panelLockedNote}>
                        Resume &amp; transcript access not included in your tier.
                      </p>
                    )}
                  </div>
                </aside>
              )}
            </div>
          )}

          {/* ── LEADERBOARD TAB ── */}
          {activeTab === 'leaderboard' && (
            <div>
              {/* Derivation tier — no leaderboard access */}
              {firmProfile?.tier === 'derivation' ? (
                <div className={styles.accessDenied}>
                  <div className={styles.accessDeniedIcon}>🔒</div>
                  <p className={styles.accessDeniedTitle}>Not Included in Derivation Tier</p>
                  <p className={styles.accessDeniedText}>
                    Live Leaderboard access is available to Convergence and Apex partners. Contact{' '}
                    <a href="mailto:partnership@amsociety.in" style={{ color: '#D4AF37' }}>
                      partnership@amsociety.in
                    </a>{' '}
                    to upgrade your partnership.
                  </p>
                </div>
              ) : new Date() < new Date('2026-05-23') ? (
                <div className={styles.lockedCard}>
                  <div className={styles.lockedCardIcon}>◎</div>
                  <p className={styles.lockedCardTitle}>Live on 23 May 2026</p>
                  <p className={styles.lockedCardText}>
                    PRIOR begins on 23 May. Real-time Codeforces standings will appear here once the contest starts.
                  </p>
                </div>
              ) : leaderboardError ? (
                <div className={styles.lockedCard}>
                  <div className={styles.lockedCardIcon}>⚠</div>
                  <p className={styles.lockedCardTitle}>Codeforces Unavailable</p>
                  <p className={styles.lockedCardText}>
                    Codeforces is temporarily unreachable. Standings will load automatically when the service recovers.
                  </p>
                </div>
              ) : leaderboardLoading && !leaderboardData ? (
                <div className={styles.tableLoading}>Loading leaderboard...</div>
              ) : (
                <>
                  {/* Header bar */}
                  <div className={styles.leaderboardHeader}>
                    <div className={styles.leaderboardMeta}>
                      <span className={styles.liveIndicator} />
                      <span className={styles.leaderboardTitle}>PRIOR — LIVE STANDINGS</span>
                      {leaderboardData?.updatedAt && (
                        <span className={styles.leaderboardUpdated}>
                          Last updated:{' '}
                          {new Date(leaderboardData.updatedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {leaderboardData.stale && (
                            <span className={styles.staleTag}> (cached)</span>
                          )}
                        </span>
                      )}
                    </div>
                    <button
                      className={styles.refreshBtn}
                      onClick={fetchLeaderboard}
                      disabled={leaderboardLoading}
                    >
                      {leaderboardLoading ? '...' : 'REFRESH'}
                    </button>
                  </div>

                  {/* Standings table */}
                  {!leaderboardData || leaderboardData.standings.length === 0 ? (
                    <div className={styles.accessDenied}>
                      <p className={styles.accessDeniedTitle}>
                        {leaderboardData?.notStarted ? 'Contest has not started yet' : 'No standings yet'}
                      </p>
                      <p className={styles.accessDeniedText}>
                        {leaderboardData?.notStarted
                          ? 'PRIOR begins on 23 May 2026. Live standings will appear here once the contest starts.'
                          : 'No submissions recorded yet. Check back soon.'}
                      </p>
                    </div>
                  ) : (
                    <div className={styles.leaderboardTableWrap}>
                      <table className={styles.leaderboardTable}>
                        <thead>
                          <tr className={styles.leaderboardThead}>
                            <th className={styles.leaderboardTh}>Rank</th>
                            <th className={styles.leaderboardTh}>Handle</th>
                            <th className={styles.leaderboardTh}>Score</th>
                            <th className={styles.leaderboardTh}>Penalty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardData.standings.map((row, i) => (
                            <tr
                              key={row.handle}
                              className={`${styles.leaderboardTr} ${i < 3 ? styles.leaderboardTrTop : ''}`}
                            >
                              <td className={styles.leaderboardTd}>
                                <span className={i < 3 ? styles.rankGold : styles.rankMuted}>
                                  {row.rank}
                                </span>
                              </td>
                              <td className={styles.leaderboardTd}>
                                <a
                                  href={`https://codeforces.com/profile/${row.handle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.handleLink}
                                >
                                  {row.handle}
                                </a>
                              </td>
                              <td className={styles.leaderboardTd}>{row.points}</td>
                              <td className={styles.leaderboardTd}>{row.penalty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === 'analytics' && (
            <div>
              {analyticsLoading ? (
                <div className={styles.tableLoading} style={{ minHeight: '300px' }}>
                  Loading analytics...
                </div>
              ) : analyticsData ? (
                <>
                  <div className={styles.statsGrid} style={{ marginBottom: 28 }}>
                    {[
                      {
                        label: 'Total Registrants',
                        value: (analyticsData.institutions || []).reduce((a, b) => a + b.count, 0),
                      },
                      {
                        label: 'Participating Institutions',
                        value: (analyticsData.institutions || []).length,
                      },
                    ].map((s) => (
                      <div key={s.label} className={styles.statCard}>
                        <span className={styles.statLabel}>{s.label}</span>
                        <span className={styles.statValue}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {chartData.length > 0 && (
                    <div className={styles.chartCard}>
                      <p className={styles.chartTitle}>Registrations by Institution (Top 15)</p>
                      <RechartsComponents>
                        {({ BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid }) => (
                          <div className={styles.chartWrap}>
                            <ResponsiveContainer width="100%" height={320}>
                              <BarChart
                                data={chartData}
                                margin={{ top: 4, right: 16, left: -12, bottom: 80 }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="rgba(255,255,255,0.04)"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="name"
                                  tick={{ fill: LABEL_COLOR, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                  tickLine={false}
                                  axisLine={false}
                                  angle={-40}
                                  textAnchor="end"
                                  interval={0}
                                />
                                <YAxis
                                  tick={{ fill: LABEL_COLOR, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(212,175,55,0.04)' }} />
                                <Bar dataKey="count" fill={GOLD} radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </RechartsComponents>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.accessDenied}>
                  <p className={styles.accessDeniedTitle}>Analytics unavailable</p>
                  <p className={styles.accessDeniedText}>
                    Could not load analytics data. Please try refreshing.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Finalist side panel */}
      {selectedFinalist && (
        <>
          <div
            className={styles.panelBackdrop}
            onClick={() => setSelectedFinalist(null)}
          />
          <aside className={styles.sidePanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelName}>{selectedFinalist.fullName}</span>
              <button
                className={styles.panelClose}
                onClick={() => setSelectedFinalist(null)}
              >
                CLOSE ✕
              </button>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>University</p>
                <p className={styles.panelValue}>{selectedFinalist.university || '—'}</p>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Round</p>
                <p className={styles.panelValue} style={{ textTransform: 'uppercase' }}>
                  {selectedFinalist.round || '—'}
                </p>
              </div>
              <div className={styles.panelDivider} />
              {finalistsAccess?.linkedinAccess && selectedFinalist.linkedIn && (
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>LinkedIn</p>
                  <a
                    href={selectedFinalist.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.panelLink}
                  >
                    {selectedFinalist.linkedIn}
                  </a>
                </div>
              )}
              {!finalistsAccess?.linkedinAccess && (
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>LinkedIn</p>
                  <p className={styles.panelValue} style={{ color: '#3a3a3a' }}>
                    Unlocked after Finals
                  </p>
                </div>
              )}
              <div className={styles.panelDivider} />
              {finalistsAccess?.resumeDownload && selectedFinalist.resumeUrl ? (
                <button
                  className={styles.docBtn}
                  style={{ width: '100%' }}
                  onClick={() => handleViewResume(selectedFinalist)}
                >
                  VIEW RESUME
                </button>
              ) : (
                <span className={styles.docBtnLocked} style={{ display: 'block', textAlign: 'center' }}>
                  RESUME — AVAILABLE AFTER FINALS
                </span>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
