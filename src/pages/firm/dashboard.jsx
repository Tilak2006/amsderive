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
    'Apex Partner — Full access including problem set co-design in your firm\'s flavour, finalist resumes before Convergence partners, naming rights, and custom configuration across all communications.',
};

const ACCESS_FEATURES = [
  { key: 'leaderboard', label: 'Live Leaderboard' },
  { key: 'analytics', label: 'Performance Analytics' },
  { key: 'finalistProfiles', label: 'Finalist Profiles' },
  { key: 'resumeDownload', label: 'Resume Download' },
  { key: 'linkedinAccess', label: 'LinkedIn Access' },
  { key: 'psCoDesign', label: 'PS Co-Design' },
  { key: 'namingRights', label: 'Naming Rights' },
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

    if (activeTab === 'talent' && !tabDataLoaded.current.has('talent')) {
      tabDataLoaded.current.add('talent');
      fetchFinalists();
    }
    if (activeTab === 'analytics' && !tabDataLoaded.current.has('analytics')) {
      tabDataLoaded.current.add('analytics');
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, firmProfile]);

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

  const chartData = useMemo(() => {
    if (!analyticsData?.leaderboard) return [];
    return Object.entries(analyticsData.leaderboard)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [analyticsData]);

  async function handleLogout() {
    document.cookie = '__firmSession=; path=/; max-age=0; SameSite=Strict; Secure';
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
            {firmProfile?.logoUrl && (
              <img src={firmProfile.logoUrl} alt="" className={styles.firmLogo} />
            )}
            <span className={styles.topBarTitle}>{firmProfile?.firmName || 'PARTNER PORTAL'}</span>
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
              { key: 'analytics', label: 'ANALYTICS' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
            <span
              className={styles.tabDisabled}
              title="Coming soon — Codeforces private gym integration"
            >
              LEADERBOARD
            </span>
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div>
              <div className={styles.welcomeSection}>
                <p className={styles.welcomeEyebrow}>AMS DERIVE 2026 — PARTNER PORTAL</p>
                <h1 className={styles.welcomeTitle}>
                  Welcome,{' '}
                  <span className={styles.welcomeGold}>{firmProfile?.firmName}</span>
                </h1>
                <p className={styles.tierDescription}>
                  {TIER_DESCRIPTIONS[firmProfile?.tier] || ''}
                </p>
              </div>

              <p className={styles.sectionLabel}>Your Access</p>
              <div className={styles.accessGrid}>
                {ACCESS_FEATURES.map((feature) => {
                  const enabled = firmProfile?.access?.[feature.key];
                  return (
                    <div
                      key={feature.key}
                      className={`${styles.accessFeature} ${!enabled ? styles.accessFeatureLocked : ''}`}
                    >
                      <span
                        className={`${styles.accessFeatureIcon} ${!enabled ? styles.accessFeatureIconLocked : ''}`}
                      >
                        {enabled ? '✓' : '⎯'}
                      </span>
                      <span className={styles.accessFeatureLabel}>{feature.label}</span>
                    </div>
                  );
                })}
              </div>
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
                        value: analyticsData.total ?? Object.values(analyticsData.leaderboard || {}).reduce((a, b) => a + b, 0),
                      },
                      {
                        label: 'Participating Institutions',
                        value: Object.keys(analyticsData.leaderboard || {}).length,
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
