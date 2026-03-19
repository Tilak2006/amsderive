import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import styles from '../../styles/admin.module.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';

const GOLD = '#D4AF37';
const DARK_RED = '#8B2020';
const CHART_BG = '#0e0e0e';
const LABEL_COLOR = '#6b6560';
const TEXT_COLOR = '#f0ede6';

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

async function getAuthHeader(currentUser) {
  const token = await currentUser?.getIdToken();
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

/* ── Shared Recharts tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>{label}</p>
      <p className={styles.chartTooltipValue}>{payload[0].value}</p>
    </div>
  );
}

export default function AdminAnalytics() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Auth guard */
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

  /* Fetch ALL registrants */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const headers = await getAuthHeader(user);
      const res = await fetch('/api/admin/export-registrants', {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setRegistrants(data.registrants || []);
      setLoading(false);
    })();
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
    router.push('/admin/login');
  }

  /* ── Derived analytics data ── */
  const analytics = useMemo(() => {
    const total = registrants.length;

    // Consent
    const consentGiven = registrants.filter((r) => r.dataConsent).length;
    const consentPct = total ? Math.round((consentGiven / total) * 100) : 0;

    // Today
    const todayStr = new Date().toISOString().slice(0, 10);
    const today = registrants.filter(
      (r) => r.submittedAt && r.submittedAt.slice(0, 10) === todayStr
    ).length;

    // Top university
    const uniCounts = {};
    registrants.forEach((r) => {
      const u = (r.university || 'Unknown').trim();
      uniCounts[u] = (uniCounts[u] || 0) + 1;
    });
    const topUni = Object.entries(uniCounts).sort((a, b) => b[1] - a[1])[0];

    // Registrations per day (last 30 days)
    const dayMap = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }
    registrants.forEach((r) => {
      if (!r.submittedAt) return;
      const key = r.submittedAt.slice(0, 10);
      if (key in dayMap) dayMap[key]++;
    });
    const dailyData = Object.entries(dayMap).map(([date, count]) => ({
      date: formatDate(date + 'T00:00:00'),
      count,
    }));

    // University distribution (top 15)
    const uniData = Object.entries(uniCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    // Consent pie
    const consentPie = [
      { name: 'Consented', value: consentGiven },
      { name: 'Not Consented', value: total - consentGiven },
    ];

    return { total, consentPct, today, topUni, dailyData, uniData, consentPie };
  }, [registrants]);

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
        <title>Analytics — AMS Derive Admin</title>
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
            <span className={`${styles.tab} ${styles.tabActive}`}>ANALYTICS</span>
          </div>

          {loading ? (
            <div className={styles.tableLoading}>Loading analytics...</div>
          ) : (
            <>
              {/* KPI cards */}
              <div className={styles.statsGrid}>
                {[
                  { label: 'Total Registrants', value: analytics.total },
                  { label: 'Data Consent %', value: `${analytics.consentPct}%` },
                  { label: "Today's Registrations", value: analytics.today },
                  { label: 'Top University', value: analytics.topUni ? analytics.topUni[0] : '—' },
                ].map((s) => (
                  <div key={s.label} className={styles.statCard}>
                    <span className={styles.statLabel}>{s.label}</span>
                    <span className={`${styles.statValue} ${s.label === 'Top University' ? styles.statValueSmall : ''}`}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Charts grid */}
              <div className={styles.chartsGrid}>
                {/* Registrations over time */}
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Registrations Over Time</h3>
                  <div className={styles.chartWrap}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.dailyData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: LABEL_COLOR, fontSize: 10, fontFamily: 'var(--font-mono)' }}
                          interval="preserveStartEnd"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          tick={{ fill: LABEL_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                          allowDecimals={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(212,175,55,0.06)' }} />
                        <Bar dataKey="count" fill={GOLD} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* University distribution */}
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>University Distribution (Top 15)</h3>
                  <div className={styles.chartWrap}>
                    <ResponsiveContainer width="100%" height={Math.max(300, analytics.uniData.length * 32)}>
                      <BarChart data={analytics.uniData} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fill: LABEL_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: TEXT_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }}
                          width={160}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(212,175,55,0.06)' }} />
                        <Bar dataKey="count" fill={GOLD} radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Consent pie */}
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Data Consent</h3>
                  <div className={styles.chartWrap} style={{ display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.consentPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          dataKey="value"
                          stroke="#0e0e0e"
                          strokeWidth={2}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill={GOLD} />
                          <Cell fill={DARK_RED} />
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
