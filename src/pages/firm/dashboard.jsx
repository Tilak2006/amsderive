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
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } = mod;
      function RechartsProvider({ children }) {
        return children({ BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell });
      }
      return RechartsProvider;
    }),
  {
    ssr: false,
    loading: () => (
      <div className={styles.skeletonChartCard} aria-label="Loading chart">
        <span className={styles.skeletonLine} style={{ width: '220px', height: 10 }} aria-hidden="true" />
        <div className={styles.skeletonChartArea} />
      </div>
    ),
  }
);

const GOLD = '#D4AF37';
const LABEL_COLOR = '#6b6560';
// Gold-toned palette for pie/donut slices.
const PIE_COLORS = ['#D4AF37', '#b8932f', '#e6c862', '#9c7a26', '#cdb04a', '#7d621e', '#dec57a', '#5f4a16'];
const FIRM_PANEL_COUNT_OFFSET = 500;
const FIRM_COMMUNITY_PARTNERS_LABEL = '15+';
const TALENT_REFRESH_COOLDOWN_MS = 2 * 60 * 1000;
const TALENT_REFRESH_STORAGE_KEY = 'ams_derive_talent_refresh_available_at';

// Leaderboard entries hidden from the standings entirely.
// Exact full-name match (case- and whitespace-normalized only).
function normalizeHiddenName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
const HIDDEN_LEADERBOARD_NAMES = ['Aditya Sai Vemparala', 'Poorvansh Tiwari', 'Shatakshi Singh'];
const HIDDEN_LEADERBOARD_NAME_SET = new Set(HIDDEN_LEADERBOARD_NAMES.map(normalizeHiddenName));
function isHiddenLeaderboardName(name) {
  return HIDDEN_LEADERBOARD_NAME_SET.has(normalizeHiddenName(name));
}

function LockGlyph({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="11" width="15" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ClockGlyph({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.2V12l2.6 1.6" />
    </svg>
  );
}

function ResumeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function TranscriptIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function LinkedInIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 9.67H5.67V18h2.67V9.67zM7 6.02a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7zm11 6.07c0-2.28-1.4-3.07-2.87-3.07-1 0-1.78.42-2.18 1.09V9.67h-2.6V18h2.66v-4.13c0-.78.37-1.43 1.2-1.43.83 0 1.12.64 1.12 1.46V18H18v-5.91z" />
    </svg>
  );
}

// Private recruiting pipeline stages (stored per-device, not shared with organizers).
const PIPELINE_STAGES = [
  { key: 'interested', label: 'Interested' },
  { key: 'reaching_out', label: 'Reaching out' },
  { key: 'pass', label: 'Pass' },
];

// Sortable table column header.
function SortHeader({ label, sortKey, sort, onSort, className, style }) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      className={className}
      style={{ ...style, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className={styles.sortHeaderInner}>
        {label}
        <svg
          className={styles.sortCaret}
          width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ opacity: active ? 1 : 0.25, transform: active && sort.dir === 'desc' ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 15 12 9 18 15" />
        </svg>
      </span>
    </th>
  );
}

// Per-candidate pipeline controls: private tag + note (local) and an interest
// flag sent to organizers (server). Shared by the registrants and leaderboard panels.
function CandidatePipelineSection({ candidateId, entry, onTag, onNote, canExpressInterest, interested, onToggleInterest, interestBusy, interestError }) {
  return (
    <div className={styles.pipelineSection}>
      <span className={styles.pipelineLabel}>Your pipeline</span>
      <div className={styles.pipelineTags}>
        {PIPELINE_STAGES.map((s) => (
          <button
            key={s.key}
            type="button"
            data-stage={s.key}
            className={`${styles.pipelineTag} ${entry?.tag === s.key ? styles.pipelineTagActive : ''}`}
            onClick={() => onTag(candidateId, entry?.tag === s.key ? null : s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <textarea
        className={styles.pipelineNote}
        placeholder="Private note, kept on this device only"
        value={entry?.note || ''}
        onChange={(e) => onNote(candidateId, e.target.value.slice(0, 1000))}
        rows={3}
      />
      {canExpressInterest && (
        <>
          <button
            type="button"
            className={`${styles.interestBtn} ${interested ? styles.interestBtnActive : ''}`}
            onClick={() => onToggleInterest(candidateId)}
            disabled={interestBusy}
          >
            {interestBusy ? 'Saving…' : interested ? 'Interest flagged · withdraw' : 'Express interest to AMS'}
          </button>
          {interestError && <span className={styles.pipelineError}>{interestError}</span>}
        </>
      )}
    </div>
  );
}

const TIER_DESCRIPTIONS = {
  derivation:
    'Derivation Partner: Live leaderboard access (coming soon), performance analytics, logo on the AMS Derive contest platform, and round sponsorship across PRIOR and POSTERIOR rounds.',
  convergence:
    'Convergence Partner: All Derivation benefits, plus finalist profile access, an evaluation panel seat at IIT Bombay finals, in-person attendance, and first access to finalist talent.',
  apex:
    'Priority access to contest-qualified quant and programming talent across PRIOR, POSTERIOR, and CONVERGENCE.',
};

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
  const fullLabel = payload?.[0]?.payload?.name || label;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>{fullLabel}</p>
      <p className={styles.chartTooltipValue}>{payload[0].value}</p>
    </div>
  );
}

function truncateInstitutionName(name, maxLength = 22) {
  if (!name) return '';
  return name.length > maxLength ? `${name.slice(0, maxLength - 1)}...` : name;
}

function getFirmPanelDisplayCount(value) {
  return (Number(value) || 0) + FIRM_PANEL_COUNT_OFFSET;
}

function formatFirmPanelDisplayCount(value) {
  return getFirmPanelDisplayCount(value).toLocaleString();
}

function isAdvancedCandidate(candidate) {
  return candidate?.round === 'posterior' || candidate?.round === 'convergence';
}

const rankTier = (rank) =>
  rank === 1
    ? 'r1'
    : rank === 2
      ? 'r2'
      : rank === 3
        ? 'r3'
        : rank != null
          ? 'rn'
          : null;

function signalChips(assessment) {
  if (!assessment) return { chips: [], more: 0 };
  const bits = [];
  if (assessment.jeeAdvRank) bits.push(`JEE Adv #${assessment.jeeAdvRank}`);
  if (assessment.olympiad) bits.push(assessment.olympiad);
  if (assessment.cpQuant) bits.push(assessment.cpQuant);
  const chips = bits
    .slice(0, 3)
    .map((b) => (b.length > 34 ? b.slice(0, 31) + '...' : b));
  return { chips, more: Math.max(0, bits.length - 3) };
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
    desc: 'Individual · Offline at a prestigious IIT. On-site Codeforces contest with partner firm evaluation.',
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

const ROUND_STATUS_LABEL = { past: 'Completed', active: 'Active', future: 'Upcoming' };

function FirmTimeline() {
  const phases = useMemo(() => CONTEST_ROUNDS.map((r) => getRoundPhase(r.timestamp)), []);

  return (
    <ol className={styles.timeline}>
      {CONTEST_ROUNDS.map((round, i) => {
        const phase = phases[i];
        const name = round.title.split('|').pop().trim();
        return (
          <li key={round.index} className={styles.timelineRow} data-phase={phase}>
            <span className={styles.timelineNode}>
              {phase === 'past' && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <div className={styles.timelineBody}>
              <div className={styles.timelineHead}>
                <span className={styles.timelineIndex}>Round {String(i + 1).padStart(2, '0')}</span>
                <span className={styles.timelineStatus}>
                  {phase === 'active' && <span className={styles.timelineStatusDot} />}
                  {ROUND_STATUS_LABEL[phase]}
                </span>
              </div>
              <p className={styles.timelineName}>{name}</p>
              <p className={styles.timelineDate}>{round.date}</p>
              <p className={styles.timelineDesc}>{round.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SkeletonLine({ className = '', style }) {
  return <span className={`${styles.skeletonLine} ${className}`.trim()} style={style} aria-hidden="true" />;
}

// One round's analytics body: cohort stats + college distribution bar + grad-year / branch donuts.
// Shared 2-line people list used by both the chart drill and the college drill.
function DrillPeopleList({ members }) {
  if (!members.length) {
    return <p className={styles.chartEmptyNote}>No named profiles in this bucket.</p>;
  }
  return (
    <ul className={styles.drillList}>
      {members.map((m) => {
        const meta = [m.branch, m.graduationYear].filter(Boolean);
        if (m.jeeAdvRank) meta.push(`JEE #${m.jeeAdvRank}`);
        const metaStr = meta.join(' · ');
        return (
          <li key={`${m.rank}-${m.name}`} className={styles.drillRow}>
            <div className={styles.drillRowTop}>
              <span className={styles.drillRank}>#{m.rank}</span>
              <span className={styles.drillName}>{m.name}</span>
            </div>
            {metaStr && <span className={styles.drillMeta} title={metaStr}>{metaStr}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function AnalyticsRoundPanel({ data, loading, showReservedPosterior }) {
  const chartData = useMemo(() => {
    if (!data?.institutions?.length) return [];
    return [...data.institutions].sort((a, b) => b.count - a.count).slice(0, 15);
  }, [data]);

  const gradYearChartData = useMemo(() => {
    if (!data?.gradYears?.length) return [];
    return data.gradYears.map((g) => ({ name: String(g.year), value: g.count }));
  }, [data]);

  const branchChartData = useMemo(() => {
    if (!data?.branches?.length) return [];
    return [...data.branches].sort((a, b) => b.count - a.count).slice(0, 8).map((b) => ({ name: b.name, value: b.count }));
  }, [data]);

  // One distribution view at a time, chosen from the dropdown.
  const [view, setView] = useState('college'); // 'college' | 'branch' | 'gradYear'

  // Chart drill-down: clicking a bar / pie slice lists the people in that bucket.
  const members = useMemo(() => data?.members || [], [data]);
  const [drill, setDrill] = useState(null); // { type: 'institution'|'branch'|'gradYear', value, label }

  const drillMembers = useMemo(() => {
    if (!drill) return [];
    const v = String(drill.value).toLowerCase();
    return members
      .filter((m) => {
        if (drill.type === 'institution') return (m.university || '').toLowerCase() === v;
        if (drill.type === 'branch') return (m.branch || '').toLowerCase() === v;
        if (drill.type === 'gradYear') return String(m.graduationYear) === String(drill.value);
        return false;
      })
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  }, [drill, members]);

  // Separate drill for the "Top Finalists by College" list (its own inline result).
  const [collegeDrill, setCollegeDrill] = useState(null); // college name
  const collegeDrillMembers = useMemo(() => {
    if (!collegeDrill) return [];
    const v = collegeDrill.toLowerCase();
    return members
      .filter((m) => (m.university || '').toLowerCase() === v)
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  }, [collegeDrill, members]);

  // Colleges ranked by their single best (lowest-numbered) finalist rank.
  const topByCollege = useMemo(() => {
    const map = new Map();
    members.forEach((m) => {
      if (!m.university) return;
      const key = m.university.toLowerCase();
      const rank = m.rank ?? Infinity;
      const cur = map.get(key);
      if (cur) {
        cur.count += 1;
        if (rank < cur.bestRank) cur.bestRank = rank;
      } else {
        map.set(key, { name: m.university, count: 1, bestRank: rank });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.bestRank - b.bestRank);
  }, [members]);

  if (loading && !data) {
    return (
      <div className={styles.skeletonAnalyticsWrap} aria-label="Loading analytics">
        <div className={styles.skeletonStatsGrid}>
          <div className={styles.skeletonStatCard}>
            <SkeletonLine className={styles.skeletonLineSub} style={{ width: '120px' }} />
            <SkeletonLine className={styles.skeletonLineTitle} style={{ width: '80px' }} />
          </div>
          <div className={styles.skeletonStatCard}>
            <SkeletonLine className={styles.skeletonLineSub} style={{ width: '150px' }} />
            <SkeletonLine className={styles.skeletonLineTitle} style={{ width: '60px' }} />
          </div>
        </div>
        <div className={styles.skeletonChartCard}>
          <SkeletonLine className={styles.skeletonLineSub} style={{ width: '240px' }} />
          <div className={styles.skeletonChartArea} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.accessDenied}>
        <p className={styles.accessDeniedTitle}>Analytics unavailable</p>
        <p className={styles.accessDeniedText}>Could not load analytics for this round. Try refreshing.</p>
      </div>
    );
  }

  const cohortSize = (data.institutions || []).reduce((a, b) => a + b.count, 0);
  const institutionsCount = (data.institutions || []).length;
  const avgPerInstitution = institutionsCount ? (cohortSize / institutionsCount).toFixed(1) : '0.0';

  return (
    <>
      <div className={styles.analyticsStatsGrid}>
        {[
          { label: 'Cohort Size', value: cohortSize },
          { label: 'Community Partners', value: FIRM_COMMUNITY_PARTNERS_LABEL },
          { label: 'Avg / Institution', value: avgPerInstitution },
        ].map((s) => (
          <div key={s.label} className={`${styles.statCard} ${styles.analyticsStatCard}`}>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className={styles.chartCard}>
        <div className={styles.analyticsViewHeader}>
          <p className={styles.chartTitle} style={{ margin: 0 }}>Distribution</p>
          <select
            className={styles.filterSelect}
            value={view}
            onChange={(e) => { setView(e.target.value); setDrill(null); }}
            aria-label="Choose distribution view"
            style={{ maxWidth: 210 }}
          >
            <option value="college">By College</option>
            <option value="branch">By Branch</option>
            <option value="gradYear">By Graduation Year</option>
          </select>
        </div>

        {view === 'college' && (
          chartData.length > 0 ? (
            <RechartsComponents>
              {({ BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid }) => (
                <div className={styles.chartWrap} style={{ cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={chartData} margin={{ top: 4, right: 16, left: -4, bottom: 110 }} barCategoryGap="35%">
                      <defs>
                        <linearGradient id="firmAnalyticsBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.22} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: LABEL_COLOR, fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} angle={-38} textAnchor="end" interval={0} height={92} tickFormatter={(value) => truncateInstitutionName(value)} />
                      <YAxis tick={{ fill: LABEL_COLOR, fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, 'auto']} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(212,175,55,0.04)' }} />
                      <Bar dataKey="count" fill="url(#firmAnalyticsBarGradient)" maxBarSize={52} radius={[4, 4, 0, 0]} cursor="pointer"
                        onClick={(d) => { const name = d?.payload?.name ?? d?.name; if (name) setDrill({ type: 'institution', value: name, label: name }); }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </RechartsComponents>
          ) : (<p className={styles.chartEmptyNote}>No college data yet.</p>)
        )}

        {view === 'gradYear' && (
          gradYearChartData.length > 0 ? (
            <>
              <RechartsComponents>
                {({ PieChart, Pie, Cell, Tooltip, ResponsiveContainer }) => (
                  <div className={styles.chartWrap} style={{ cursor: 'pointer' }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={gradYearChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} stroke="none" cursor="pointer"
                          onClick={(d) => { const name = d?.name ?? d?.payload?.name; if (name != null) setDrill({ type: 'gradYear', value: name, label: `Class of ${name}` }); }}
                        >
                          {gradYearChartData.map((entry, i) => (<Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </RechartsComponents>
              <div className={styles.chartLegend}>
                {gradYearChartData.map((entry, i) => (
                  <span key={entry.name} className={styles.legendItem}>
                    <span className={styles.legendSwatch} style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {entry.name} · {entry.value}
                  </span>
                ))}
              </div>
            </>
          ) : (<p className={styles.chartEmptyNote}>No graduation-year data yet.</p>)
        )}

        {view === 'branch' && (
          branchChartData.length > 0 ? (
            <>
              <RechartsComponents>
                {({ PieChart, Pie, Cell, Tooltip, ResponsiveContainer }) => (
                  <div className={styles.chartWrap} style={{ cursor: 'pointer' }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={branchChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} stroke="none" cursor="pointer"
                          onClick={(d) => { const name = d?.name ?? d?.payload?.name; if (name) setDrill({ type: 'branch', value: name, label: name }); }}
                        >
                          {branchChartData.map((entry, i) => (<Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </RechartsComponents>
              <div className={styles.chartLegend}>
                {branchChartData.map((entry, i) => (
                  <span key={entry.name} className={styles.legendItem}>
                    <span className={styles.legendSwatch} style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {entry.name} · {entry.value}
                  </span>
                ))}
              </div>
            </>
          ) : (<p className={styles.chartEmptyNote}>No branch data yet.</p>)
        )}

        {/* Drill result, directly under the chart it came from */}
        <div className={styles.drillInline}>
          {drill ? (
            <>
              <div className={styles.drillHeader}>
                <span className={styles.drillTitle}>{drill.label}</span>
                <span className={styles.drillCount}>{drillMembers.length} {drillMembers.length === 1 ? 'person' : 'people'}</span>
                <button className={styles.drillClose} onClick={() => setDrill(null)} aria-label="Clear selection">✕</button>
              </div>
              <DrillPeopleList members={drillMembers} />
            </>
          ) : (
            <p className={styles.drillHint}>Click a segment above to see who&apos;s in it.</p>
          )}
        </div>
      </div>

      {showReservedPosterior && (
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>Top Finalists by College</p>
          {topByCollege.length > 0 ? (
            <>
              <ol className={styles.collegeRankList}>
                {topByCollege.slice(0, 15).map((c) => {
                  const active = collegeDrill && collegeDrill.toLowerCase() === c.name.toLowerCase();
                  return (
                    <li key={c.name}>
                      <button
                        type="button"
                        className={`${styles.collegeRankRow} ${active ? styles.collegeRankRowActive : ''}`}
                        onClick={() => setCollegeDrill(active ? null : c.name)}
                      >
                        <span className={styles.collegeRankBest}>#{Number.isFinite(c.bestRank) ? c.bestRank : '—'}</span>
                        <span className={styles.collegeRankName}>{c.name}</span>
                        <span className={styles.collegeRankCount}>{c.count} finalist{c.count === 1 ? '' : 's'}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {collegeDrill && (
                <div className={styles.drillInline}>
                  <div className={styles.drillHeader}>
                    <span className={styles.drillTitle}>{collegeDrill}</span>
                    <span className={styles.drillCount}>{collegeDrillMembers.length} {collegeDrillMembers.length === 1 ? 'finalist' : 'finalists'}</span>
                    <button className={styles.drillClose} onClick={() => setCollegeDrill(null)} aria-label="Clear selection">✕</button>
                  </div>
                  <DrillPeopleList members={collegeDrillMembers} />
                </div>
              )}
            </>
          ) : (
            <p className={styles.chartEmptyNote}>No college data for finalists yet.</p>
          )}
        </div>
      )}

    </>
  );
}

// One-line "what this is / what to do" shown under the tab bar for each tab.
const TAB_INTRO = {
  overview: 'Your starting point: the finalists, where to look first, and what your partnership unlocks.',
  talent: 'The finalists: full profiles, quant signals and documents. Shortlist and export from here.',
  registrants: 'Everyone who registered and consented to share data. Use this for a broad search.',
  analytics: 'The cohort at a glance: colleges, branches and graduation years. Click any chart to see who.',
  leaderboard: 'Round-by-round rankings. Switch rounds to compare the screening field against the finalists.',
};

// Quant-assessment fields (from the placement form), in display order.
const ASSESSMENT_FIELDS = [
  ['interviews', 'Industry Track Record'],
  ['jeeAdvRank', 'JEE Advanced Rank', (v) => `#${v}`],
  ['olympiad', 'Olympiad / Math'],
  ['kvpyNtse', 'KVPY / NTSE'],
  ['cpQuant', 'CP & Quant Comps'],
  ['research', 'Research / Projects'],
  ['atcoder', 'AtCoder / TopCoder'],
  ['github', 'GitHub / Site'],
  ['quantInterest', 'Quant Interest'],
];

function AssessmentValue({ value }) {
  if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) {
    return <a href={value.trim()} target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37', wordBreak: 'break-all' }}>{value.trim()}</a>;
  }
  return <>{value}</>;
}

function AssessmentSection({ assessment, inset }) {
  if (!assessment) return null;
  const rows = ASSESSMENT_FIELDS
    .map(([key, label, fmt]) => [label, assessment[key] ? (fmt ? fmt(assessment[key]) : assessment[key]) : null])
    .filter(([, v]) => v);
  if (!rows.length) return null;
  return (
    <div className={`${styles.assessmentSection} ${inset ? styles.assessmentSectionInset : ''}`}>
      <p className={styles.assessmentHeading}>Quant Assessment</p>
      {rows.map(([label, value]) => (
        <div key={label} className={styles.assessmentRow}>
          <span className={styles.assessmentLabel}>{label}</span>
          <span className={styles.assessmentValue}><AssessmentValue value={value} /></span>
        </div>
      ))}
    </div>
  );
}

// Columns available for the finalist CSV export. `get` pulls the value off a finalist row.
const EXPORT_COLUMNS = [
  { key: 'rank', label: 'Rank', get: (f) => f.rank },
  { key: 'convergenceRank', label: 'Finals Rank', get: (f) => f.convergenceRank },
  { key: 'fullName', label: 'Name', get: (f) => f.fullName },
  { key: 'university', label: 'University', get: (f) => f.university },
  { key: 'branch', label: 'Branch', get: (f) => f.branch },
  { key: 'graduationYear', label: 'Graduation Year', get: (f) => f.graduationYear },
  { key: 'round', label: 'Round', get: (f) => f.round },
  { key: 'jeeAdvRank', label: 'JEE Advanced Rank', get: (f) => f.assessment?.jeeAdvRank },
  { key: 'olympiad', label: 'Olympiad / Math', get: (f) => f.assessment?.olympiad },
  { key: 'kvpyNtse', label: 'KVPY / NTSE', get: (f) => f.assessment?.kvpyNtse },
  { key: 'cpQuant', label: 'CP & Quant Comps', get: (f) => f.assessment?.cpQuant },
  { key: 'research', label: 'Research / Projects', get: (f) => f.assessment?.research },
  { key: 'atcoder', label: 'AtCoder / TopCoder', get: (f) => f.assessment?.atcoder },
  { key: 'github', label: 'GitHub / Site', get: (f) => f.assessment?.github },
  { key: 'interviews', label: 'Industry Track Record', get: (f) => f.assessment?.interviews },
  { key: 'linkedIn', label: 'LinkedIn', get: (f) => f.linkedIn },
];
const DEFAULT_EXPORT_KEYS = ['rank', 'convergenceRank', 'fullName', 'university', 'graduationYear', 'jeeAdvRank', 'olympiad', 'cpQuant'];

// Map a PRIOR leaderboard standings row into the finalist/export row shape.
function standingToExportRow(row) {
  return {
    rank: row.rank,
    fullName: row.name,
    university: row.university,
    branch: row.registrant?.branch ?? null,
    graduationYear: row.graduationYear ?? row.registrant?.graduationYear ?? null,
    round: row.registrant?.round ?? 'prior',
    assessment: row.registrant?.assessment ?? null,
    linkedIn: row.registrant?.linkedIn ?? null,
  };
}

function FinalistExport({ rows, allRows, user }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set(DEFAULT_EXPORT_KEYS));
  const [round, setRound] = useState('round2'); // 'view' (current view) | 'round3' (finals) | 'round2' | 'round1' | 'both'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const toggle = (k) => setSelected((s) => {
    const n = new Set(s);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });

  const download = async () => {
    const cols = EXPORT_COLUMNS.filter((c) => selected.has(c.key));
    if (!cols.length) return;
    setBusy(true);
    setError(null);
    try {
      let out = [];
      if (round === 'view') out = out.concat(rows);
      if (round === 'round3') {
        const headers = await getAuthHeader(user);
        const res = await fetch('/api/firm/get-leaderboard', { method: 'POST', headers, body: JSON.stringify({ round: 'convergence' }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Could not load Finals data.');
        out = out.concat((data.standings || []).map((s) => ({ ...standingToExportRow(s), round: 'convergence', convergenceRank: s.rank })));
      }
      if (round === 'round2' || round === 'both') out = out.concat(allRows ?? rows);
      if (round === 'round1' || round === 'both') {
        const headers = await getAuthHeader(user);
        const res = await fetch('/api/firm/get-leaderboard', { method: 'POST', headers, body: JSON.stringify({ round: 'prior' }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Could not load Round 1 data.');
        out = out.concat((data.standings || []).map(standingToExportRow));
      }
      if (!out.length) { setError('Nothing to export for this selection.'); return; }

      const esc = (v) => {
        const s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [
        cols.map((c) => esc(c.label)).join(','),
        ...out.map((f) => cols.map((c) => esc(c.get(f))).join(',')),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const tag = round === 'view' ? 'current-view' : round === 'round3' ? 'finals-winners' : round === 'both' ? 'round1-2' : round === 'round1' ? 'round1' : 'finalists';
      a.href = url;
      a.download = `ams-derive-${tag}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e) {
      setError(e.message || 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  const count = selected.size;
  return (
    <div className={styles.exportWrap}>
      <button type="button" className={styles.exportBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        EXPORT CSV
      </button>
      {open && (
        <div className={styles.exportPanel}>
          <p className={styles.exportPanelTitle}>Rounds to include</p>
          <select
            className={styles.filterSelect}
            value={round}
            onChange={(e) => { setRound(e.target.value); setError(null); }}
            aria-label="Rounds to export"
            style={{ width: '100%', marginBottom: 14 }}
          >
            <option value="view">Current view</option>
            <option value="round3">Finals · Winners (Top 10)</option>
            <option value="round2">Round 2 — Finalists</option>
            <option value="round1">Round 1 — Screening</option>
            <option value="both">Both rounds</option>
          </select>

          <p className={styles.exportPanelTitle}>Columns to export</p>
          <div className={styles.exportFields}>
            {EXPORT_COLUMNS.map((c) => (
              <label key={c.key} className={styles.exportField}>
                <input type="checkbox" checked={selected.has(c.key)} onChange={() => toggle(c.key)} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          {error && <p className={styles.exportErrorNote}>{error}</p>}
          <div className={styles.exportPanelFoot}>
            <span className={styles.exportMeta}>
              {round === 'round2' ? `${rows.length} row${rows.length === 1 ? '' : 's'} · ` : ''}{count} column{count === 1 ? '' : 's'}
            </span>
            <button type="button" className={styles.exportDownload} onClick={download} disabled={!count || busy}>
              {busy ? 'Preparing…' : 'Download'}
            </button>
          </div>
        </div>
      )}
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
  const [poolRound, setPoolRound] = useState('convergence'); // 'convergence' (finals cohort) | 'posterior' (everyone advanced)
  const [selectedFinalist, setSelectedFinalist] = useState(null);
  const [talentRefreshAvailableAt, setTalentRefreshAvailableAt] = useState(0);
  const [talentRefreshTick, setTalentRefreshTick] = useState(Date.now());
  const panelRef = useRef(null);
  const panelReturnFocusRef = useRef(null);
  useEffect(() => {
    if (!selectedFinalist || !panelRef.current) return undefined;
    panelReturnFocusRef.current = document.activeElement;
    const panel = panelRef.current;
    const focusables = () =>
      panel.querySelectorAll('button, a[href], [tabindex="0"]');
    (focusables()[0] || panel).focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedFinalist(null);
        setDocumentError(null);
        return;
      }
      if (e.key !== 'Tab') return;
      const f = [...focusables()];
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener('keydown', onKey);
    return () => {
      panel.removeEventListener('keydown', onKey);
      if (panelReturnFocusRef.current?.focus) panelReturnFocusRef.current.focus();
    };
  }, [selectedFinalist]);

  // Analytics state — per round ('posterior' = Round 2 finalists, 'prior' = Round 1)
  const [analyticsByRound, setAnalyticsByRound] = useState({ posterior: null, prior: null });
  const [analyticsLoadingRound, setAnalyticsLoadingRound] = useState({ posterior: false, prior: false });
  const [analyticsOpen, setAnalyticsOpen] = useState({ round2: true, round1: false });
  const analyticsRequestedRef = useRef(new Set());

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
  const [documentError, setDocumentError] = useState(null);
  const [exportError, setExportError] = useState(null);
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

  // ── Pipeline tags + private notes (per-device, like starring) ──
  const [pipeline, setPipeline] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('ams_derive_pipeline');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const updatePipelineEntry = useCallback((id, patch) => {
    setPipeline((prev) => {
      const next = { ...prev };
      const entry = { ...(next[id] || {}), ...patch };
      if (!entry.tag) delete entry.tag;
      if (!entry.note) delete entry.note;
      if (entry.tag || entry.note) next[id] = entry; else delete next[id];
      try { localStorage.setItem('ams_derive_pipeline', JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);

  const setPipelineTag = useCallback((id, tag) => updatePipelineEntry(id, { tag: tag || undefined }), [updatePipelineEntry]);
  const setPipelineNote = useCallback((id, note) => updatePipelineEntry(id, { note: note || undefined }), [updatePipelineEntry]);

  // ── Express interest to organizers (server-side, idempotent per candidate) ──
  const [interestedIds, setInterestedIds] = useState(() => new Set());
  const [interestBusyId, setInterestBusyId] = useState(null);
  const [interestError, setInterestError] = useState(null);

  const fetchInterests = useCallback(async () => {
    if (!user) return;
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/get-interests', { method: 'POST', headers });
      if (!res.ok) return;
      const data = await res.json();
      setInterestedIds(new Set((data.interests || []).map((i) => i.candidateId)));
    } catch {
      // Non-fatal — interest markers just stay empty until the next load.
    }
  }, [user]);

  const toggleInterest = useCallback(async (candidateId) => {
    if (!candidateId) return;
    const wasInterested = interestedIds.has(candidateId);
    setInterestError(null);
    setInterestBusyId(candidateId);
    setInterestedIds((prev) => {
      const n = new Set(prev);
      wasInterested ? n.delete(candidateId) : n.add(candidateId);
      return n;
    });
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/express-interest', {
        method: 'POST',
        headers,
        body: JSON.stringify({ candidateId, withdraw: wasInterested }),
      });
      if (!res.ok) throw new Error('request failed');
    } catch {
      // Roll back the optimistic toggle.
      setInterestedIds((prev) => {
        const n = new Set(prev);
        wasInterested ? n.add(candidateId) : n.delete(candidateId);
        return n;
      });
      setInterestError('Could not save. Check your connection and try again.');
    } finally {
      setInterestBusyId(null);
    }
  }, [interestedIds, user]);

  // ── Column sort + pipeline-stage filter ──
  const [registrantsSort, setRegistrantsSort] = useState({ key: null, dir: 'asc' });
  const [registrantsFilterStage, setRegistrantsFilterStage] = useState('all');
  const [leaderboardSort, setLeaderboardSort] = useState({ key: 'rank', dir: 'asc' });

  const handleRegistrantsSort = useCallback((key) => {
    setRegistrantsSort((p) => (p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }, []);
  const handleLeaderboardSort = useCallback((key) => {
    setLeaderboardSort((p) => (p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }, []);

  const canExpressInterest = firmProfile?.tier !== 'derivation' && Boolean(firmProfile?.access?.registrantProfiles);

  // Load the firm's existing interest flags once they're allowed to express interest.
  useEffect(() => {
    if (canExpressInterest) fetchInterests();
  }, [canExpressInterest, fetchInterests]);

  // Filtered + sorted view of the loaded registrants (search/filter/sort act on loaded rows).
  const visibleRegistrants = useMemo(() => {
    const ROUND_ORDER = { prior: 0, posterior: 1, convergence: 2 };
    let list = registrants.filter((r) => {
      if (showStarredOnly && !starred.has(r.id)) return false;
      if (registrantsFilterStage !== 'all' && (pipeline[r.id]?.tag || 'none') !== registrantsFilterStage) return false;
      if (registrantsSearch.trim()) {
        const q = registrantsSearch.toLowerCase();
        if (!r.fullName?.toLowerCase().includes(q) && !r.university?.toLowerCase().includes(q)) return false;
      }
      if (registrantsFilterUniversity !== 'all' && r.university !== registrantsFilterUniversity) return false;
      if (registrantsFilterBranch !== 'all' && r.branch !== registrantsFilterBranch) return false;
      if (registrantsFilterGradYear !== 'all' && String(r.graduationYear) !== registrantsFilterGradYear) return false;
      return true;
    });
    const { key, dir } = registrantsSort;
    if (key) {
      const m = dir === 'asc' ? 1 : -1;
      const str = (v) => String(v || '').toLowerCase();
      const cmp = (a, b) => (a < b ? -m : a > b ? m : 0);
      list = [...list].sort((a, b) => {
        switch (key) {
          case 'name': return cmp(str(a.fullName), str(b.fullName));
          case 'institution': return cmp(str(a.university), str(b.university));
          case 'branch': return cmp(str(a.branch), str(b.branch));
          case 'gradYear': return ((Number(a.graduationYear) || 0) - (Number(b.graduationYear) || 0)) * m;
          case 'round': return ((ROUND_ORDER[a.round] ?? -1) - (ROUND_ORDER[b.round] ?? -1)) * m;
          case 'cf': return cmp(str(a.codeforcesHandle), str(b.codeforcesHandle));
          default: return 0;
        }
      });
    }
    return list;
  }, [registrants, showStarredOnly, starred, registrantsFilterStage, pipeline, registrantsSearch, registrantsFilterUniversity, registrantsFilterBranch, registrantsFilterGradYear, registrantsSort]);

  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);
  const leaderboardIntervalRef = useRef(null);
  const [selectedLeaderboardRegistrant, setSelectedLeaderboardRegistrant] = useState(null);
  const [leaderboardSearchName, setLeaderboardSearchName] = useState('');
  const [leaderboardFilterUniversity, setLeaderboardFilterUniversity] = useState('');
  const [leaderboardFilterGradYear, setLeaderboardFilterGradYear] = useState('');
  // Which round's leaderboard to show: 'round3' (CONVERGENCE finals, default) | 'round2' (POSTERIOR) | 'round1' (PRIOR)
  const [leaderboardRound, setLeaderboardRound] = useState('round3');

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

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(TALENT_REFRESH_STORAGE_KEY) || 0);
      if (Number.isFinite(saved)) setTalentRefreshAvailableAt(saved);
    } catch {
      setTalentRefreshAvailableAt(0);
    }
  }, []);

  useEffect(() => {
    if (talentRefreshAvailableAt <= Date.now()) return undefined;
    const interval = setInterval(() => setTalentRefreshTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [talentRefreshAvailableAt]);

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
      analyticsRequestedRef.current.add('posterior'); // Round 2 is open by default
      fetchAnalytics('posterior');
    }
    if (activeTab === 'registrants' && !tabDataLoaded.current.has('registrants')) {
      tabDataLoaded.current.add('registrants');
      fetchRegistrants();
    }
    // Leaderboard fetch is handled by its own effect (keyed on the selected round).
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
      const nextRegistrants = data.registrants || [];
      setRegistrants((prev) => (after ? [...prev, ...nextRegistrants] : nextRegistrants));
      if (!after) {
        setSelectedRegistrant((selected) => {
          if (!selected) return selected;
          return nextRegistrants.find((candidate) => candidate.id === selected.id) || null;
        });
      }
      // Server only returns total count on first page to avoid a redundant aggregate per page.
      if (data.count != null) setRegistrantsTotal(data.count);
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
      const nextFinalists = data.finalists || [];
      setFinalists(nextFinalists);
      setSelectedFinalist((selected) => {
        if (!selected) return selected;
        return nextFinalists.find((candidate) => candidate.id === selected.id) || null;
      });
      setFinalistsAccess(data.access);
      setFinalistsCount(data.count);
    } catch {
      setFinalistsAccess({ locked: true, reason: 'Failed to load finalist data.' });
    } finally {
      setFinalistsLoading(false);
    }
  }, [user]);

  async function handleTalentRefresh() {
    const now = Date.now();
    if (finalistsLoading || talentRefreshAvailableAt > now) return;

    const nextAvailableAt = now + TALENT_REFRESH_COOLDOWN_MS;
    setTalentRefreshAvailableAt(nextAvailableAt);
    setTalentRefreshTick(now);
    try {
      localStorage.setItem(TALENT_REFRESH_STORAGE_KEY, String(nextAvailableAt));
    } catch {
      // Cooldown still applies for this session if persistent storage is unavailable.
    }

    await fetchFinalists();
  }

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const headers = await getAuthHeader(user);
      const round = leaderboardRound === 'round3' ? 'convergence' : leaderboardRound === 'round2' ? 'posterior' : 'prior';
      const res = await fetch('/api/firm/get-leaderboard', { method: 'POST', headers, body: JSON.stringify({ round }) });
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
      if (data.access) setRegistrantsAccess(data.access);
      setLeaderboardError(null);
    } catch {
      setLeaderboardError({ type: 'fetch', message: 'Failed to load leaderboard' });
    } finally {
      setLeaderboardLoading(false);
    }
  }, [user, leaderboardRound]);

  // Fetch on tab entry / round switch, then auto-refresh every 30s while on the tab.
  // fetchLeaderboard identity changes when leaderboardRound changes, so switching rounds
  // re-runs this effect and immediately refetches the selected round's standings.
  useEffect(() => {
    if (activeTab !== 'leaderboard' || !firmProfile) return;
    fetchLeaderboard();
    leaderboardIntervalRef.current = setInterval(fetchLeaderboard, 30000);
    return () => {
      if (leaderboardIntervalRef.current) clearInterval(leaderboardIntervalRef.current);
    };
  }, [activeTab, firmProfile, fetchLeaderboard]);

  const fetchAnalytics = useCallback(async (round = 'posterior') => {
    setAnalyticsLoadingRound((s) => ({ ...s, [round]: true }));
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/get-institution-stats', { method: 'POST', headers, body: JSON.stringify({ round }) });
      if (!res.ok) {
        setAnalyticsByRound((s) => ({ ...s, [round]: null }));
        return;
      }
      const data = await res.json();
      setAnalyticsByRound((s) => ({ ...s, [round]: data }));
    } catch {
      setAnalyticsByRound((s) => ({ ...s, [round]: null }));
    } finally {
      setAnalyticsLoadingRound((s) => ({ ...s, [round]: false }));
    }
  }, [user]);

  // Expand/collapse a round; lazily fetch its analytics the first time it opens.
  const toggleAnalyticsRound = useCallback((uiRound) => {
    const apiRound = uiRound === 'round1' ? 'prior' : 'posterior';
    setAnalyticsOpen((s) => ({ ...s, [uiRound]: !s[uiRound] }));
    if (!analyticsRequestedRef.current.has(apiRound)) {
      analyticsRequestedRef.current.add(apiRound);
      fetchAnalytics(apiRound);
    }
  }, [fetchAnalytics]);

  const fetchOverviewStats = useCallback(async () => {
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/get-overview-stats', { method: 'POST', headers, body: JSON.stringify({}) });
      setExportError(null);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportError(data.error || 'CSV export is not enabled for this account.');
        return;
      }
      const data = await res.json();
      setOverviewStats(data);
    } catch {
      // non-critical — overview still renders without stats
    }
  }, [user]);

  // If the finals cohort is empty (e.g. pre-finals), fall back to the full pool
  // so the default view is never a confusing blank.
  useEffect(() => {
    if (poolRound === 'convergence' && finalists.length > 0 && !finalists.some((f) => f.round === 'convergence')) {
      setPoolRound('posterior');
    }
  }, [finalists, poolRound]);

  const filteredFinalists = useMemo(() => {
    let list = finalists;
    if (poolRound === 'convergence') {
      list = list.filter((f) => f.round === 'convergence');
    }
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
    // Sort: finals rank in the Convergence view, POSTERIOR rank otherwise;
    // non-numeric / unranked candidates fall to the end, tie-broken by name.
    const key = (r) => (typeof r === 'number' && Number.isFinite(r) ? r : Infinity);
    const byRank = (ra, rb, a, b) => {
      const ka = key(ra);
      const kb = key(rb);
      if (ka !== kb) return ka - kb;
      return (a.fullName || '').localeCompare(b.fullName || '');
    };
    if (poolRound === 'convergence') {
      return [...list].sort((a, b) => byRank(a.convergenceRank, b.convergenceRank, a, b));
    }
    return [...list].sort((a, b) => byRank(a.rank, b.rank, a, b));
  }, [finalists, searchQuery, filterUniversity, poolRound]);

  const uniqueUniversities = useMemo(() => {
    const pool = poolRound === 'convergence' ? finalists.filter((f) => f.round === 'convergence') : finalists;
    const set = new Set(pool.map((f) => f.university).filter(Boolean));
    return Array.from(set).sort();
  }, [finalists, poolRound]);

  const uniqueRegistrantUniversities = useMemo(() => {
    const set = new Set(registrants.map((r) => r.university).filter(Boolean));
    return Array.from(set).sort();
  }, [registrants]);

  const uniqueRegistrantBranches = useMemo(() => {
    const set = new Set(registrants.map((r) => r.branch).filter(Boolean));
    return Array.from(set).sort();
  }, [registrants]);

  const uniqueLeaderboardUniversities = useMemo(() => {
    if (!leaderboardData?.standings) return [];
    const set = new Set(leaderboardData.standings.map((s) => s.university).filter(Boolean));
    return Array.from(set).sort();
  }, [leaderboardData]);

  const uniqueLeaderboardGradYears = useMemo(() => {
    if (!leaderboardData?.standings) return [];
    const set = new Set(leaderboardData.standings.map((s) => s.graduationYear).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [leaderboardData]);

  const filteredLeaderboardStandings = useMemo(() => {
    if (!leaderboardData?.standings) return [];
    const filtered = leaderboardData.standings.filter((row) => {
      if (isHiddenLeaderboardName(row.name)) return false;
      if (leaderboardSearchName.trim()) {
        const q = leaderboardSearchName.toLowerCase();
        if (!row.name?.toLowerCase().includes(q)) return false;
      }
      if (leaderboardFilterUniversity.trim()) {
        const q = leaderboardFilterUniversity.toLowerCase();
        if (!row.university?.toLowerCase().includes(q)) return false;
      }
      if (leaderboardFilterGradYear.trim()) {
        const q = leaderboardFilterGradYear.toLowerCase();
        if (!String(row.graduationYear).toLowerCase().includes(q)) return false;
      }
      return true;
    });
    const { key, dir } = leaderboardSort;
    const m = dir === 'asc' ? 1 : -1;
    const str = (v) => String(v || '').toLowerCase();
    const cmp = (a, b) => (a < b ? -m : a > b ? m : 0);
    return [...filtered].sort((a, b) => {
      switch (key) {
        case 'name': return cmp(str(a.name), str(b.name));
        case 'institution': return cmp(str(a.university), str(b.university));
        case 'gradYear': return ((Number(a.graduationYear) || 0) - (Number(b.graduationYear) || 0)) * m;
        case 'rank':
        default: return ((Number(a.rank) || 0) - (Number(b.rank) || 0)) * m;
      }
    });
  }, [leaderboardData, leaderboardSearchName, leaderboardFilterUniversity, leaderboardFilterGradYear, leaderboardSort]);

  const standingsCaption =
    leaderboardRound === 'round3'
      ? 'CONVERGENCE · FINAL STANDINGS'
      : leaderboardRound === 'round2'
        ? 'ROUND 2 · FINALIST STANDINGS'
        : 'ROUND 1 · SCREENING STANDINGS';

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

  async function handleViewResume(candidate) {
    if (!candidate.resumeUrl) return;
    await handleViewFile(candidate, 'resume');
  }

  async function handleViewTranscript(candidate) {
    if (!candidate.transcriptUrl) return;
    await handleViewFile(candidate, 'transcript');
  }

  async function handleExportCsv() {
    try {
      const headers = await getAuthHeader(user);
      setExportError(null);
      const res = await fetch('/api/firm/export-registrants-csv', { method: 'POST', headers, body: JSON.stringify({}) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportError(data.error || 'CSV export is not enabled for this account.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ams-derive-registrants-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Could not export CSV. Please try again.');
    }
  }

  async function handleViewFile(candidate, fileType) {
    if (!candidate?.id || !fileType) return;
    setDocumentError(null);
    const tab = window.open('', '_blank');
    try {
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/firm/get-signed-url', {
        method: 'POST',
        headers,
        body: JSON.stringify({ registrantId: candidate.id, fileType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.signedUrl) {
        throw new Error(data.error || 'Could not open document.');
      }
      if (tab) {
        tab.location.href = data.signedUrl;
      } else {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      if (tab) tab.close();
      setDocumentError(err.message || 'Could not open document.');
    }
  }

  function getTierBadgeClass(tier) {
    if (tier === 'apex') return `${styles.tierBadge} ${styles.tierApex}`;
    if (tier === 'convergence') return `${styles.tierBadge} ${styles.tierConvergence}`;
    return `${styles.tierBadge} ${styles.tierDerivation}`;
  }

  const talentRefreshOnCooldown = talentRefreshAvailableAt > talentRefreshTick;
  const talentRefreshLabel = finalistsLoading
    ? 'REFRESHING...'
    : talentRefreshOnCooldown
      ? `REFRESH IN ${Math.ceil((talentRefreshAvailableAt - talentRefreshTick) / 1000)}S`
      : 'REFRESH';

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
        <title>{firmProfile?.firmName || 'Partner Portal'} · AMS Derive</title>
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
              { key: 'registrants', label: 'ALL APPLICANTS' },
              { key: 'analytics', label: 'ANALYTICS' },
              { key: 'leaderboard', label: 'STANDINGS' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab(key);
                  setDocumentError(null);
                  setExportError(null);
                  setSelectedLeaderboardRegistrant(null);
                  setLeaderboardSearchName('');
                  setLeaderboardFilterUniversity('');
                  setLeaderboardFilterGradYear('');
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {TAB_INTRO[activeTab] && (
            <p className={styles.tabIntro}>{TAB_INTRO[activeTab]}</p>
          )}

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
                  <p className={styles.welcomeEyebrow}>AMS Derive 2026 Partner Portal</p>
                  <h1 className={styles.welcomeTitle}>
                    {firmProfile?.firmName === 'Jane Street' ? (
                      <>
                        Jane Street <span className={styles.welcomeGold}>Talent Overview</span>
                      </>
                    ) : (
                      <>
                        Welcome, <span className={styles.welcomeGold}>{firmProfile?.firmName}</span>
                      </>
                    )}
                  </h1>
                  <p className={styles.tierDescription}>
                    {TIER_DESCRIPTIONS[firmProfile?.tier] || ''}
                  </p>
                </div>
                <div className={styles.overviewHeroRule} />
              </div>

              {/* Lead — the single starting action */}
              {firmProfile?.tier !== 'derivation' && (
                <button className={styles.overviewLead} onClick={() => setActiveTab('talent')}>
                  <span className={styles.overviewLeadText}>
                    <span className={styles.overviewLeadTitle}>Start with the finalists</span>
                    <span className={styles.overviewLeadSub}>
                      The candidates who advanced, ranked, with quant signals, documents and one-click CSV export.
                    </span>
                  </span>
                  <span className={styles.overviewLeadCta}>View Talent Pool</span>
                </button>
              )}

              {/* Metrics row */}
              {overviewStats && (
                <>
                  <p className={styles.sectionLabel} style={{ marginBottom: 16 }}>Talent Snapshot</p>
                  <div className={styles.metricsRow}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricValue}>
                        {formatFirmPanelDisplayCount(overviewStats.total)}
                      </span>
                      <span className={styles.metricLabel}>Total Profiles</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricValue}>
                        {formatFirmPanelDisplayCount(overviewStats.newThisWeek)}
                      </span>
                      <span className={styles.metricLabel}>New Profiles This Week</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricValue}>
                        {formatFirmPanelDisplayCount(overviewStats.sparkline?.slice(-4).reduce((sum, count) => sum + count, 0) || 0)}
                      </span>
                      <span className={styles.metricLabel}>4-Week Profile Activity</span>
                    </div>
                  </div>
                </>
              )}

              {/* Recruiter questions — each routes to where it's answered */}
              <p className={styles.sectionLabel} style={{ marginBottom: 16, marginTop: overviewStats ? 32 : 0 }}>Where to Start</p>
              <div className={styles.quickActionGrid}>
                <button
                  className={styles.quickActionCard}
                  onClick={() => setActiveTab('talent')}
                  disabled={firmProfile?.tier === 'derivation'}
                >
                  <span className={styles.quickActionIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
                    </svg>
                  </span>
                  <span className={styles.quickActionTitle}>Who has elite math &amp; CP pedigree?</span>
                  <span className={styles.quickActionDesc}>
                    {firmProfile?.tier === 'derivation'
                      ? 'Convergence & Apex only'
                      : 'Finalists with JEE Advanced rank, olympiad honours and Codeforces signal.'}
                  </span>
                  <span className={styles.quickActionArrow}>Talent Pool</span>
                </button>

                <button
                  className={styles.quickActionCard}
                  onClick={() => setActiveTab('analytics')}
                >
                  <span className={styles.quickActionIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path d="M9 9h.01M9 13h.01M9 17h.01" />
                    </svg>
                  </span>
                  <span className={styles.quickActionTitle}>Where is the top talent concentrated?</span>
                  <span className={styles.quickActionDesc}>
                    Top colleges ranked by their best finalist, plus the full institution mix.
                  </span>
                  <span className={styles.quickActionArrow}>Analytics</span>
                </button>

                <button
                  className={styles.quickActionCard}
                  onClick={() => setActiveTab('analytics')}
                >
                  <span className={styles.quickActionIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
                    </svg>
                  </span>
                  <span className={styles.quickActionTitle}>Who&apos;s graduating soon?</span>
                  <span className={styles.quickActionDesc}>
                    Class-year breakdown: full-time hires now versus internship pipeline.
                  </span>
                  <span className={styles.quickActionArrow}>Analytics</span>
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
              </button>

              {/* Contest Timeline */}
              <p className={styles.sectionLabel} style={{ marginTop: 40, marginBottom: 32 }}>Contest Schedule</p>
              <FirmTimeline />

              {/* Contact line */}
              <p className={styles.overviewContact}>
                Dedicated Partner Support:{' '}
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
                  <div className={styles.accessDeniedIcon}><LockGlyph size={26} /></div>
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
                <div className={styles.skeletonTalentGrid} aria-label="Loading finalist data">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`talent-skeleton-${i}`} className={styles.skeletonTalentCard}>
                      <SkeletonLine className={styles.skeletonLineTitle} />
                      <SkeletonLine className={styles.skeletonLineSub} />
                      <div className={styles.skeletonTalentActions}>
                        <SkeletonLine className={styles.skeletonPill} />
                        <SkeletonLine className={styles.skeletonPill} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : finalistsAccess?.locked ? (
                /* Admin has not yet unlocked finalistProfiles */
                <div className={styles.lockedCard}>
                  <div className={styles.lockedCardIcon}><LockGlyph size={26} /></div>
                  <p className={styles.lockedCardTitle}>Talent Pool Locked</p>
                  <p className={styles.lockedCardText}>
                    Talent pool profiles will be unlocked by the organizing team after PRIOR results are published.
                    Check back soon, or reach out to{' '}
                    <a href="mailto:partnership@amsociety.in" style={{ color: '#D4AF37' }}>
                      partnership@amsociety.in
                    </a>
                    .
                  </p>
                  <button
                    type="button"
                    className={styles.refreshBtn}
                    onClick={handleTalentRefresh}
                    disabled={finalistsLoading || talentRefreshOnCooldown}
                  >
                    {talentRefreshLabel}
                  </button>
                </div>
              ) : (
                <>
                  {/* Filter bar */}
                  <div className={`${styles.talentFilterBar} ${styles.talentBarGrid}`}>
                    <select
                      className={styles.filterSelect}
                      value={poolRound}
                      onChange={(e) => { setPoolRound(e.target.value); setFilterUniversity('all'); }}
                      aria-label="Select talent pool round"
                    >
                      <option value="convergence">Convergence · Finals</option>
                      <option value="posterior">Posterior · All finalists</option>
                    </select>
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
                      {filteredFinalists.length}{finalistsCount !== null && finalistsCount !== filteredFinalists.length ? `/${finalistsCount}` : ''} candidate{filteredFinalists.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      className={styles.refreshBtn}
                      onClick={handleTalentRefresh}
                      disabled={finalistsLoading || talentRefreshOnCooldown}
                    >
                      {talentRefreshLabel}
                    </button>
                    <FinalistExport rows={filteredFinalists} allRows={finalists} user={user} />
                  </div>

                  <p className={styles.talentHint}>
                    ★ Star to shortlist · click a card for full profile, notes and interest
                  </p>

                  {filteredFinalists.length === 0 ? (
                    <div className={styles.accessDenied}>
                      <p className={styles.accessDeniedTitle}>
                        {finalistsCount === 0
                          ? 'No candidates in talent pool yet'
                          : 'No results match your search'}
                      </p>
                      <p className={styles.accessDeniedText}>
                        {finalistsCount === 0
                          ? 'Candidates who advance past PRIOR will appear here once results are published.'
                          : 'Try adjusting your search, the round dropdown, or the university filter.'}
                      </p>
                    </div>
                  ) : (
                    <div className={styles.candidateGrid}>
                      {filteredFinalists.map((finalist) => {
                        const activeRank = poolRound === 'convergence' ? finalist.convergenceRank : finalist.rank;
                        const tier = rankTier(activeRank);
                        const tierClass = tier && tier !== 'rn' ? styles['cardTier_' + tier] : '';
                        const chipTierClass = tier && tier !== 'rn' ? styles['rankChip_' + tier] : '';
                        const { chips: signalChipList, more: signalChipMore } = signalChips(finalist.assessment);
                        const lockedLabels = [];
                        if (!finalistsAccess?.resumeDownload) lockedLabels.push('DOCUMENTS');
                        if (!finalistsAccess?.linkedinAccess) lockedLabels.push('LINKEDIN');
                        return (
                        <div
                          key={finalist.id}
                          className={`${styles.candidateCard}${tierClass ? ' ' + tierClass : ''}`}
                          onClick={() => { setSelectedFinalist(finalist); setDocumentError(null); }}
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) { setSelectedFinalist(finalist); setDocumentError(null); } }}
                        >
                          <div className={styles.cardHead}>
                            {activeRank != null && (
                              <span className={`${styles.rankChip}${chipTierClass ? ' ' + chipTierClass : ''}`}>#{activeRank}</span>
                            )}
                            <button
                              className={`${styles.candidateStar} ${starred.has(finalist.id) ? styles.candidateStarActive : ''}`}
                              onClick={(e) => toggleStar(finalist.id, e)}
                              title={starred.has(finalist.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                              aria-label="Shortlist candidate"
                              aria-pressed={starred.has(finalist.id)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={starred.has(finalist.id) ? '#D4AF37' : 'none'} stroke={starred.has(finalist.id) ? '#D4AF37' : '#6b6560'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          </div>
                          <p className={styles.candidateName}>{finalist.fullName}</p>
                          <p className={styles.cardMeta}>{finalist.university}{finalist.graduationYear ? ` · ${finalist.graduationYear}` : ''}</p>
                          <div className={styles.chipRow}>
                            {finalist.round && (
                              <span className={styles.candidateRoundBadge} data-round={finalist.round}>
                                {finalist.round.toUpperCase()}
                              </span>
                            )}
                            {signalChipList.map((c) => (
                              <span key={c} className={styles.fpChip}>{c}</span>
                            ))}
                            {signalChipMore > 0 && (
                              <span className={styles.fpChip}>+{signalChipMore}</span>
                            )}
                          </div>
                          {finalist.assessment?.interviews && (
                            <span className={styles.candidateIntel} title={finalist.assessment.interviews}>
                              {finalist.assessment.interviews}
                            </span>
                          )}
                          <div className={styles.candidateActions}>
                            {isAdvancedCandidate(finalist) && (
                              <>
                                {finalistsAccess?.resumeDownload && (
                                  <>
                                    {finalist.resumeUrl && (
                                      <button
                                        className={`${styles.docBtn} ${styles.docBtnIcon}`}
                                        title="Resume"
                                        aria-label="View resume"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewResume(finalist);
                                        }}
                                      >
                                        <ResumeIcon />
                                      </button>
                                    )}
                                    {finalist.transcriptUrl && (
                                      <button
                                        className={`${styles.docBtn} ${styles.docBtnIcon}`}
                                        title="Transcript"
                                        aria-label="View transcript"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewTranscript(finalist);
                                        }}
                                      >
                                        <TranscriptIcon />
                                      </button>
                                    )}
                                    {!finalist.resumeUrl && !finalist.transcriptUrl && (
                                      <span className={styles.docBtnLocked}>DOCUMENTS · NOT PROVIDED</span>
                                    )}
                                  </>
                                )}
                                {finalistsAccess?.linkedinAccess && finalist.linkedIn && (
                                  <button
                                    className={`${styles.docBtn} ${styles.docBtnIcon}`}
                                    title="LinkedIn"
                                    aria-label="View LinkedIn profile"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewLinkedIn(finalist);
                                    }}
                                  >
                                    <LinkedInIcon />
                                  </button>
                                )}
                                {lockedLabels.length > 0 && (
                                  <p className={styles.fpAccessNote}>
                                    <LockGlyph size={12} /> {lockedLabels.join(' · ')} locked
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        );
                      })}
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
                  <div className={styles.accessDeniedIcon}><LockGlyph size={26} /></div>
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
                  <div className={styles.lockedCardIcon}><LockGlyph size={26} /></div>
                  <p className={styles.lockedCardTitle}>Registrant Profiles Locked</p>
                  <p className={styles.lockedCardText}>{registrantsAccessError}</p>
                </div>
              ) : registrantsLoading && registrants.length === 0 ? (
                <div className={styles.skeletonRegistrantsWrap} aria-label="Loading registrant data">
                  <div className={styles.skeletonFilterBar}>
                    <SkeletonLine className={styles.skeletonInput} />
                    <SkeletonLine className={styles.skeletonSelect} />
                    <SkeletonLine className={styles.skeletonSelect} />
                    <SkeletonLine className={styles.skeletonSelect} />
                    <SkeletonLine className={styles.skeletonPill} />
                  </div>
                  <div className={styles.skeletonTableBox}>
                    <div className={styles.skeletonTableHead}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonLine key={`reg-head-${i}`} className={styles.skeletonTableHeadCell} />
                      ))}
                    </div>
                    <div className={styles.skeletonTableBody}>
                      {Array.from({ length: 6 }).map((_, row) => (
                        <div key={`reg-row-${row}`} className={styles.skeletonTableRow}>
                          {Array.from({ length: 8 }).map((_, col) => (
                            <SkeletonLine key={`reg-row-${row}-col-${col}`} className={styles.skeletonTableCell} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.registrantsMain}>
                  <p className={styles.registrantsNotice}>
                    Only approved registrants who consented to partner data sharing are shown here and included in CSV exports.
                  </p>
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
                      {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                    <select
                      className={styles.filterSelect}
                      value={registrantsFilterStage}
                      onChange={(e) => setRegistrantsFilterStage(e.target.value)}
                      title="Filter by pipeline stage"
                    >
                      <option value="all">All Stages</option>
                      <option value="interested">Interested</option>
                      <option value="reaching_out">Reaching out</option>
                      <option value="pass">Pass</option>
                      <option value="none">Untagged</option>
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
                        {visibleRegistrants.length !== registrants.length
                          ? `${formatFirmPanelDisplayCount(visibleRegistrants.length)} shown / `
                          : ''}
                        {formatFirmPanelDisplayCount(registrantsTotal)} total registrants
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
                    {exportError && (
                      <span className={styles.feedbackError}>{exportError}</span>
                    )}
                  </div>

                  <div className={styles.leaderboardTableWrap}>
                    <table className={styles.leaderboardTable}>
                      <thead>
                        <tr className={styles.leaderboardThead}>
                          <th className={styles.leaderboardTh}>#</th>
                          <SortHeader label="Name" sortKey="name" sort={registrantsSort} onSort={handleRegistrantsSort} className={styles.leaderboardTh} />
                          <SortHeader label="Institution" sortKey="institution" sort={registrantsSort} onSort={handleRegistrantsSort} className={styles.leaderboardTh} />
                          <SortHeader label="Branch" sortKey="branch" sort={registrantsSort} onSort={handleRegistrantsSort} className={styles.leaderboardTh} />
                          <SortHeader label="Grad Year" sortKey="gradYear" sort={registrantsSort} onSort={handleRegistrantsSort} className={styles.leaderboardTh} />
                          <SortHeader label="Round" sortKey="round" sort={registrantsSort} onSort={handleRegistrantsSort} className={styles.leaderboardTh} />
                          <SortHeader label="CF Handle" sortKey="cf" sort={registrantsSort} onSort={handleRegistrantsSort} className={styles.leaderboardTh} />
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
                        {visibleRegistrants.map((r, i) => (
                            <tr
                              key={r.id}
                              className={`${styles.leaderboardTr} ${selectedRegistrant?.id === r.id ? styles.leaderboardTrSelected : ''} ${starred.has(r.id) ? styles.leaderboardTrStarred : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => { setSelectedRegistrant(selectedRegistrant?.id === r.id ? null : r); setDocumentError(null); }}
                            >
                              <td className={styles.leaderboardTd}>
                                <span className={styles.rankMuted}>{i + 1}</span>
                              </td>
                              <td className={styles.leaderboardTd}>
                                {r.fullName}
                                {pipeline[r.id]?.tag && (
                                  <span className={styles.stageChip} data-stage={pipeline[r.id].tag}>
                                    {pipeline[r.id].tag === 'reaching_out' ? 'Reaching' : pipeline[r.id].tag}
                                  </span>
                                )}
                                {interestedIds.has(r.id) && (
                                  <span className={styles.interestDot} title="Interest flagged to AMS" />
                                )}
                              </td>
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
                </div>
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
                        onClick={() => { setSelectedRegistrant(null); setDocumentError(null); }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {documentError && (
                    <div className={styles.documentError}>{documentError}</div>
                  )}

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

                  {isAdvancedCandidate(selectedRegistrant) && (
                    <>
                      {registrantsAccess?.resumeDownload && selectedRegistrant.resumeUrl && (
                        <div className={styles.panelRow}>
                          <span className={styles.panelLabel}>Resume</span>
                          <button
                            className={styles.docBtn}
                            onClick={() => handleViewResume(selectedRegistrant)}
                          >
                            View Resume
                          </button>
                        </div>
                      )}

                      {selectedRegistrant.transcriptUrl && (
                        <div className={styles.panelRow}>
                          <span className={styles.panelLabel}>Transcript</span>
                          <button
                            className={styles.docBtn}
                            onClick={() => handleViewTranscript(selectedRegistrant)}
                          >
                            View Transcript
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {registrantsAccess?.emailAccess && selectedRegistrant.email && (
                    <div className={styles.panelRow}>
                      <span className={styles.panelLabel}>Email</span>
                      <a
                        href={`mailto:${selectedRegistrant.email}`}
                        className={styles.handleLink}
                      >
                        {selectedRegistrant.email}
                      </a>
                    </div>
                  )}

                  <CandidatePipelineSection
                    candidateId={selectedRegistrant.id}
                    entry={pipeline[selectedRegistrant.id]}
                    onTag={setPipelineTag}
                    onNote={setPipelineNote}
                    canExpressInterest={canExpressInterest}
                    interested={interestedIds.has(selectedRegistrant.id)}
                    onToggleInterest={toggleInterest}
                    interestBusy={interestBusyId === selectedRegistrant.id}
                    interestError={interestError}
                  />
                </aside>
              )}
            </div>
          )}

          {/* ── LEADERBOARD TAB ── */}
          {activeTab === 'leaderboard' && (
            <div className={selectedLeaderboardRegistrant ? styles.splitLayout : undefined}>
              <div className={styles.registrantsMain}>
                {/* Derivation tier — no leaderboard access */}
                {firmProfile?.tier === 'derivation' ? (
                  <div className={styles.accessDenied}>
                    <div className={styles.accessDeniedIcon}><LockGlyph size={26} /></div>
                    <p className={styles.accessDeniedTitle}>Not Included in Derivation Tier</p>
                    <p className={styles.accessDeniedText}>
                      Live Leaderboard access is available to Convergence and Apex partners. Contact{' '}
                      <a href="mailto:partnership@amsociety.in" style={{ color: '#D4AF37' }}>
                        partnership@amsociety.in
                      </a>{' '}
                      to upgrade your partnership.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Round selector: Finals (CONVERGENCE, default), Round 2 (POSTERIOR), Round 1 (PRIOR) */}
                    <div className={styles.talentFilterBar} style={{ marginBottom: '16px' }}>
                      <select
                        className={styles.filterSelect}
                        value={leaderboardRound}
                        onChange={(e) => setLeaderboardRound(e.target.value)}
                        aria-label="Select leaderboard round"
                      >
                        <option value="round3">Finals · Winners (CONVERGENCE)</option>
                        <option value="round2">Round 2 · Finalists (POSTERIOR)</option>
                        <option value="round1">Round 1 · Screening (PRIOR)</option>
                      </select>
                    </div>

                    {leaderboardRound === 'round1' && new Date() < new Date('2026-05-23') ? (
                  <div className={styles.lockedCard}>
                    <div className={styles.lockedCardIcon}><ClockGlyph size={24} /></div>
                    <p className={styles.lockedCardTitle}>Live on 23 May 2026</p>
                    <p className={styles.lockedCardText}>
                      PRIOR begins on 23 May. Real-time standings will appear here once the contest starts.
                    </p>
                  </div>
                ) : leaderboardError ? (
                  <div className={styles.lockedCard}>
                    <div className={styles.lockedCardIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" />
                      </svg>
                    </div>
                    <p className={styles.lockedCardTitle}>Leaderboard Unavailable</p>
                    <p className={styles.lockedCardText}>
                      {leaderboardError.message || 'Failed to load leaderboard.'}
                    </p>
                  </div>
                ) : leaderboardLoading && !leaderboardData ? (
                  <div className={styles.skeletonLeaderboardWrap} aria-label="Loading leaderboard">
                    <div className={styles.skeletonLeaderboardHeader}>
                      <SkeletonLine className={styles.skeletonLineSub} style={{ width: '220px' }} />
                      <SkeletonLine className={styles.skeletonPill} />
                    </div>
                    <div className={styles.skeletonTableBox}>
                      <div className={styles.skeletonTableHead}>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <SkeletonLine key={`lb-head-${i}`} className={styles.skeletonTableHeadCell} />
                        ))}
                      </div>
                      <div className={styles.skeletonTableBody}>
                        {Array.from({ length: 8 }).map((_, row) => (
                          <div key={`lb-row-${row}`} className={styles.skeletonTableRow}>
                            {Array.from({ length: 4 }).map((_, col) => (
                              <SkeletonLine key={`lb-row-${row}-col-${col}`} className={styles.skeletonTableCell} />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header bar */}
                    <div className={styles.leaderboardHeader}>
                      <div className={styles.leaderboardMeta}>
                        {leaderboardRound !== 'round3' && <span className={styles.liveIndicator} />}
                        <span className={styles.leaderboardTitle}>
                          {standingsCaption}
                        </span>
                        {leaderboardRound !== 'round3' && leaderboardData?.updatedAt && (
                          <span className={styles.leaderboardUpdated}>
                            Last updated:{' '}
                            {new Date(leaderboardData.updatedAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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

                    {/* Filter bar */}
                    <div className={styles.talentFilterBar} style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search candidate name..."
                        value={leaderboardSearchName}
                        onChange={(e) => setLeaderboardSearchName(e.target.value)}
                      />
                      <input
                        type="text"
                        list="leaderboard-colleges"
                        className={styles.searchInput}
                        placeholder="Type/Select College..."
                        value={leaderboardFilterUniversity}
                        onChange={(e) => setLeaderboardFilterUniversity(e.target.value)}
                      />
                      <datalist id="leaderboard-colleges">
                        {uniqueLeaderboardUniversities.map((u) => (
                          <option key={u} value={u} />
                        ))}
                      </datalist>
                      <input
                        type="text"
                        list="leaderboard-grad-years"
                        className={styles.searchInput}
                        placeholder="Type/Select Grad Year..."
                        value={leaderboardFilterGradYear}
                        onChange={(e) => setLeaderboardFilterGradYear(e.target.value)}
                        style={{ maxWidth: '180px' }}
                      />
                      <datalist id="leaderboard-grad-years">
                        {uniqueLeaderboardGradYears.map((yr) => (
                          <option key={yr} value={String(yr)} />
                        ))}
                      </datalist>

                      {(leaderboardSearchName || leaderboardFilterUniversity || leaderboardFilterGradYear) && (
                        <button
                          className={styles.refreshBtn}
                          onClick={() => {
                            setLeaderboardSearchName('');
                            setLeaderboardFilterUniversity('');
                            setLeaderboardFilterGradYear('');
                          }}
                          style={{ borderColor: 'rgba(212, 175, 55, 0.35)', color: '#D4AF37' }}
                        >
                          CLEAR FILTERS
                        </button>
                      )}

                      <span className={styles.resultCount}>
                        {filteredLeaderboardStandings.length}/{leaderboardData?.standings?.length || 0} rank{filteredLeaderboardStandings.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Standings table */}
                    {!leaderboardData || filteredLeaderboardStandings.length === 0 ? (
                      <div className={styles.accessDenied}>
                        <p className={styles.accessDeniedTitle}>
                          {leaderboardData?.notStarted ? 'Contest has not started yet' : 'No matches found'}
                        </p>
                        <p className={styles.accessDeniedText}>
                          {leaderboardData?.notStarted
                            ? 'PRIOR begins on 23 May 2026. Live standings will appear here once the contest starts.'
                            : 'No rows match your current search filters. Try adjusting your input.'}
                        </p>
                      </div>
                    ) : (
                      <div className={styles.leaderboardTableWrap}>
                        <table className={styles.leaderboardTable}>
                          <caption className={styles.srOnly}>{standingsCaption}</caption>
                          <thead>
                            <tr className={styles.leaderboardThead}>
                              <SortHeader label="Rank" sortKey="rank" sort={leaderboardSort} onSort={handleLeaderboardSort} className={`${styles.leaderboardTh} ${styles.numCell}`} />
                              <SortHeader label="Name" sortKey="name" sort={leaderboardSort} onSort={handleLeaderboardSort} className={styles.leaderboardTh} />
                              <SortHeader label="Institution" sortKey="institution" sort={leaderboardSort} onSort={handleLeaderboardSort} className={styles.leaderboardTh} />
                              <SortHeader label="Grad Year" sortKey="gradYear" sort={leaderboardSort} onSort={handleLeaderboardSort} className={`${styles.leaderboardTh} ${styles.numCell}`} />
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLeaderboardStandings.map((row, i) => {
                              const hasProfile = Boolean(row.registrant);
                              const isSelected = selectedLeaderboardRegistrant?.id === row.registrant?.id;
                              const tier = rankTier(row.rank);
                              const handleRowActivate = hasProfile
                                ? () => {
                                    setSelectedLeaderboardRegistrant(isSelected ? null : row.registrant);
                                    setDocumentError(null);
                                  }
                                : undefined;
                              return (
                                <tr
                                  key={`${row.name}-${row.rank}`}
                                  className={`${styles.leaderboardTr} ${tier && tier !== 'rn' ? styles['rowTier_' + tier] : ''} ${isSelected ? styles.leaderboardTrSelected : ''}`}
                                  style={hasProfile ? { cursor: 'pointer' } : undefined}
                                  tabIndex={hasProfile ? 0 : undefined}
                                  onClick={handleRowActivate}
                                  onKeyDown={hasProfile ? (e) => {
                                    if (e.key === 'Enter' && e.target === e.currentTarget) {
                                      handleRowActivate();
                                    }
                                  } : undefined}
                                >
                                  <td className={`${styles.leaderboardTd} ${styles.numCell}`}>
                                    <span className={row.rank <= 3 ? styles.rankGold : styles.rankMuted}>
                                      {row.rank}
                                    </span>
                                  </td>
                                  <td className={styles.leaderboardTd} style={{ fontWeight: hasProfile ? 600 : 'normal' }}>
                                    {row.name}
                                    {hasProfile && (
                                      <span className={styles.rowChevron} aria-hidden="true">›</span>
                                    )}
                                  </td>
                                  <td className={styles.leaderboardTd}>{row.university}</td>
                                  <td className={`${styles.leaderboardTd} ${styles.numCell}`}>{row.graduationYear}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
                  </>
                )}
              </div>

              {/* Detail panel — shown when a leaderboard row is selected */}
              {selectedLeaderboardRegistrant && (
                <aside className={styles.detailPanel}>
                  <div className={styles.panelHeader}>
                    <span className={styles.panelTitle}>{selectedLeaderboardRegistrant.fullName}</span>
                    <div className={styles.panelHeaderActions}>
                      <button
                        className={`${styles.panelStarBtn} ${starred.has(selectedLeaderboardRegistrant.id) ? styles.panelStarBtnActive : ''}`}
                        onClick={(e) => toggleStar(selectedLeaderboardRegistrant.id, e)}
                        title={starred.has(selectedLeaderboardRegistrant.id) ? 'Unstar' : 'Star'}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill={starred.has(selectedLeaderboardRegistrant.id) ? '#D4AF37' : 'none'} stroke={starred.has(selectedLeaderboardRegistrant.id) ? '#D4AF37' : '#6b6560'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                      <button
                        className={styles.panelClose}
                        onClick={() => { setSelectedLeaderboardRegistrant(null); setDocumentError(null); }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {documentError && (
                    <div className={styles.documentError}>{documentError}</div>
                  )}

                  <div className={styles.panelRow}>
                    <span className={styles.panelLabel}>Institution</span>
                    <span className={styles.panelValue}>{selectedLeaderboardRegistrant.university || '—'}</span>
                  </div>

                  <div className={styles.panelRow}>
                    <span className={styles.panelLabel}>Branch</span>
                    <span className={styles.panelValue}>{selectedLeaderboardRegistrant.branch || '—'}</span>
                  </div>

                  <div className={styles.panelRow}>
                    <span className={styles.panelLabel}>Graduation Year</span>
                    <span className={styles.panelValue}>{selectedLeaderboardRegistrant.graduationYear || '—'}</span>
                  </div>

                  <div className={styles.panelRow}>
                    <span className={styles.panelLabel}>Round</span>
                    <span className={styles.panelValue} style={{ textTransform: 'uppercase', color: '#D4AF37' }}>
                      {selectedLeaderboardRegistrant.round || '—'}
                    </span>
                  </div>

                  {selectedLeaderboardRegistrant.codeforcesHandle && (
                    <div className={styles.panelRow}>
                      <span className={styles.panelLabel}>CF Handle</span>
                      <a
                        href={`https://codeforces.com/profile/${selectedLeaderboardRegistrant.codeforcesHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.handleLink}
                      >
                        {selectedLeaderboardRegistrant.codeforcesHandle}
                      </a>
                    </div>
                  )}

                  {selectedLeaderboardRegistrant.gitHub && (
                    <div className={styles.panelRow}>
                      <span className={styles.panelLabel}>GitHub</span>
                      <a
                        href={selectedLeaderboardRegistrant.gitHub}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.handleLink}
                      >
                        {selectedLeaderboardRegistrant.gitHub.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                      </a>
                    </div>
                  )}

                  {registrantsAccess?.linkedinAccess && selectedLeaderboardRegistrant.linkedIn && (
                    <div className={styles.panelRow}>
                      <span className={styles.panelLabel}>LinkedIn</span>
                      <a
                        href={selectedLeaderboardRegistrant.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.handleLink}
                      >
                        View Profile
                      </a>
                    </div>
                  )}

                  {isAdvancedCandidate(selectedLeaderboardRegistrant) && (
                    <>
                      {registrantsAccess?.resumeDownload && selectedLeaderboardRegistrant.resumeUrl && (
                        <div className={styles.panelRow}>
                          <span className={styles.panelLabel}>Resume</span>
                          <button
                            className={styles.docBtn}
                            onClick={() => handleViewResume(selectedLeaderboardRegistrant)}
                          >
                            View Resume
                          </button>
                        </div>
                      )}

                      {selectedLeaderboardRegistrant.transcriptUrl && (
                        <div className={styles.panelRow}>
                          <span className={styles.panelLabel}>Transcript</span>
                          <button
                            className={styles.docBtn}
                            onClick={() => handleViewTranscript(selectedLeaderboardRegistrant)}
                          >
                            View Transcript
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {registrantsAccess?.emailAccess && selectedLeaderboardRegistrant.email && (
                    <div className={styles.panelRow}>
                      <span className={styles.panelLabel}>Email</span>
                      <a
                        href={`mailto:${selectedLeaderboardRegistrant.email}`}
                        className={styles.handleLink}
                      >
                        {selectedLeaderboardRegistrant.email}
                      </a>
                    </div>
                  )}

                  <AssessmentSection assessment={selectedLeaderboardRegistrant.assessment} />

                  <CandidatePipelineSection
                    candidateId={selectedLeaderboardRegistrant.id}
                    entry={pipeline[selectedLeaderboardRegistrant.id]}
                    onTag={setPipelineTag}
                    onNote={setPipelineNote}
                    canExpressInterest={canExpressInterest}
                    interested={interestedIds.has(selectedLeaderboardRegistrant.id)}
                    onToggleInterest={toggleInterest}
                    interestBusy={interestBusyId === selectedLeaderboardRegistrant.id}
                    interestError={interestError}
                  />
                </aside>
              )}
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === 'analytics' && (
            <div className={styles.analyticsAccordion}>
              {[
                { ui: 'round2', api: 'posterior', label: 'Round 2 · Finalists', sub: 'The finalists who advanced (POSTERIOR), heading to Round 3', reserved: true },
                { ui: 'round1', api: 'prior', label: 'Round 1 · Screening', sub: 'The full opening applicant ranklist (PRIOR)', reserved: false },
              ].map((r) => {
                const open = analyticsOpen[r.ui];
                return (
                  <div key={r.ui} className={styles.analyticsRound}>
                    <button
                      type="button"
                      className={`${styles.analyticsRoundHeader} ${open ? styles.analyticsRoundHeaderOpen : ''}`}
                      onClick={() => toggleAnalyticsRound(r.ui)}
                      aria-expanded={open}
                    >
                      <span className={styles.analyticsRoundHeaderText}>
                        <span className={styles.analyticsRoundLabel}>{r.label}</span>
                        <span className={styles.analyticsRoundSub}>{r.sub}</span>
                      </span>
                      <svg className={`${styles.analyticsChevron} ${open ? styles.analyticsChevronOpen : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {open && (
                      <div className={styles.analyticsRoundBody}>
                        <AnalyticsRoundPanel
                          data={analyticsByRound[r.api]}
                          loading={analyticsLoadingRound[r.api]}
                          showReservedPosterior={r.reserved}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Finalist side panel */}
      {selectedFinalist && (
        <>
          <div
            className={styles.panelBackdrop}
            onClick={() => { setSelectedFinalist(null); setDocumentError(null); }}
          />
          <aside
            className={styles.sidePanel}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fpPanelName"
          >
            <div className={styles.panelHeader}>
              <div>
                <h3 id="fpPanelName" className={styles.panelName}>
                  {selectedFinalist.fullName}
                </h3>
                <p className={styles.cardMeta} style={{ margin: '2px 0 0' }}>
                  {selectedFinalist.university}
                  {selectedFinalist.graduationYear
                    ? ` · ${selectedFinalist.graduationYear}`
                    : ''}
                </p>
                <div className={styles.panelRankChips}>
                  {selectedFinalist.convergenceRank != null && (() => {
                    const tier = rankTier(selectedFinalist.convergenceRank);
                    const chipTierClass = tier && tier !== 'rn' ? styles['rankChip_' + tier] : '';
                    return (
                      <span className={`${styles.rankChip}${chipTierClass ? ' ' + chipTierClass : ''}`}>
                        FINALS #{selectedFinalist.convergenceRank}
                      </span>
                    );
                  })()}
                  {selectedFinalist.rank != null && (
                    <span className={styles.rankChip}>R2 #{selectedFinalist.rank}</span>
                  )}
                </div>
              </div>
              <button
                className={styles.panelClose}
                onClick={() => { setSelectedFinalist(null); setDocumentError(null); }}
              >
                CLOSE ✕
              </button>
            </div>
            <div className={styles.panelBody}>
              {documentError && (
                <div className={styles.documentError}>{documentError}</div>
              )}
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
                <p className={styles.fpAccessNote}>
                  <LockGlyph size={12} /> LinkedIn access locked
                </p>
              )}
              <AssessmentSection assessment={selectedFinalist.assessment} inset />
              <div className={styles.panelDivider} />
              {isAdvancedCandidate(selectedFinalist) && (() => {
                const resumeAvailable = finalistsAccess?.resumeDownload && selectedFinalist.resumeUrl;
                const transcriptAvailable = !!selectedFinalist.transcriptUrl;
                const docLockedLabels = [];
                if (!resumeAvailable) {
                  docLockedLabels.push(`RESUME · ${finalistsAccess?.resumeDownload ? 'NOT PROVIDED' : 'LOCKED'}`);
                }
                if (!transcriptAvailable) {
                  docLockedLabels.push('TRANSCRIPT · NOT PROVIDED');
                }
                return (
                  <>
                    {resumeAvailable && (
                      <button
                        className={styles.docBtn}
                        style={{ width: '100%' }}
                        onClick={() => handleViewResume(selectedFinalist)}
                      >
                        VIEW RESUME
                      </button>
                    )}
                    {transcriptAvailable && (
                      <button
                        className={styles.docBtn}
                        style={{ width: '100%', marginTop: resumeAvailable ? 8 : 0 }}
                        onClick={() => handleViewTranscript(selectedFinalist)}
                      >
                        VIEW TRANSCRIPT
                      </button>
                    )}
                    {docLockedLabels.length > 0 && (
                      <p
                        className={styles.fpAccessNote}
                        style={{ marginTop: resumeAvailable || transcriptAvailable ? 8 : 0 }}
                      >
                        <LockGlyph size={12} /> {docLockedLabels.join(' · ')}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
