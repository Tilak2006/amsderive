import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/leaderboard.module.css';

const RANK_COLORS = ['#D4AF37', '#C0C0C0', '#CD7F32'];
const ROW_ACCENT = [styles.rowFirst, styles.rowSecond, styles.rowThird];
const ANIMATION_DELAY_MS = 90;

export default function CampusAmbassadorLeaderboard() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [computedAt, setComputedAt] = useState(null);
  // `barsReady` flips true one tick after data arrives so CSS transitions animate
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    fetch('/api/campus-ambassador-leaderboard')
      .then((r) => r.json())
      .then((data) => {
        setInstitutions(data.institutions || []);
        setComputedAt(data.computedAt || null);
        setLoading(false);
        // Slight delay so the DOM renders at width:0 first, then transitions kick in
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setBarsReady(true));
        });
      })
      .catch(() => setLoading(false));
  }, []);

  const maxCount = institutions[0]?.count || 1;
  const top5 = institutions.slice(0, 5);

  function formatComputedAt(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  }

  return (
    <>
      <Head>
        <title>Campus Ambassadors — AMS Derive 2026</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>AMS DERIVE 2026</p>
            <h1 className={styles.title}>CAMPUS AMBASSADORS</h1>
            <p className={styles.subtitle}>
              Top 5 institutions competing through campus ambassador invitations
            </p>
          </div>

          {loading ? (
            <div className={styles.state}>Loading...</div>
          ) : top5.length === 0 ? (
            <div className={styles.state}>No pre-registrations yet.</div>
          ) : (
            <div className={styles.list}>
              {top5.map((inst, idx) => {
                const isTop3 = idx < 3;
                const rankColor = isTop3 ? RANK_COLORS[idx] : '#3a3a3a';
                const barPct = barsReady
                  ? Math.max(4, Math.round((inst.count / maxCount) * 100))
                  : 0;

                return (
                  <div
                    key={inst.name}
                    className={[
                      styles.row,
                      styles.rowAnimate,
                      isTop3 ? ROW_ACCENT[idx] : '',
                    ].join(' ')}
                    style={{ animationDelay: `${idx * ANIMATION_DELAY_MS}ms` }}
                  >
                    <span
                      className={[styles.rank, isTop3 ? styles.rankHero : ''].join(' ')}
                      style={{ color: rankColor }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <div className={styles.instCol}>
                      <span
                        className={[styles.instName, isTop3 ? styles.instNameHero : ''].join(' ')}
                      >
                        {inst.name}
                      </span>
                      <div className={idx === 0 ? styles.barTrackHero : styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{
                            width: `${barPct}%`,
                            background: isTop3 ? rankColor : '#2a2a2a',
                            transition: 'width 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                    </div>

                    <span
                      className={[styles.count, isTop3 ? styles.countHero : ''].join(' ')}
                      style={isTop3 ? { color: rankColor } : undefined}
                    >
                      {inst.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <p className={styles.footer}>
            {computedAt
              ? `Updated ${formatComputedAt(computedAt)} IST`
              : 'Refreshed by admin'}
          </p>
        </div>
      </main>
    </>
  );
}
