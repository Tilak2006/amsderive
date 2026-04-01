import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../../styles/leaderboard.module.css';

const RANK_COLORS = ['#D4AF37', '#C0C0C0', '#CD7F32'];

export default function InstitutionLeaderboard() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => {
    fetch('/api/public/inst-stats')
      .then((r) => r.json())
      .then((data) => {
        setInstitutions(data.institutions || []);
        setFetchedAt(new Date());
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const maxCount = institutions[0]?.count || 1;
  const total = institutions.reduce((sum, i) => sum + i.count, 0);

  return (
    <>
      <Head>
        <title>Institutions — AMS Derive 2026</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>AMS DERIVE 2026</p>
            <h1 className={styles.title}>INSTITUTIONS</h1>
            <p className={styles.subtitle}>
              Participating institutions, ranked by registration count
            </p>
            {!loading && (
              <p className={styles.totalBadge}>
                {total} registrant{total !== 1 ? 's' : ''} · {institutions.length} institution{institutions.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {loading ? (
            <div className={styles.state}>Loading...</div>
          ) : institutions.length === 0 ? (
            <div className={styles.state}>No registrations yet.</div>
          ) : (
            <div className={styles.list}>
              {institutions.map((inst, idx) => {
                const isTop3 = idx < 3;
                const rankColor = isTop3 ? RANK_COLORS[idx] : '#3a3a3a';
                const barPct = Math.max(4, Math.round((inst.count / maxCount) * 100));

                return (
                  <div key={inst.name} className={styles.row}>
                    <span className={styles.rank} style={{ color: rankColor }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className={styles.instCol}>
                      <span className={styles.instName}>{inst.name}</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{
                            width: `${barPct}%`,
                            background: isTop3 ? rankColor : '#2a2a2a',
                          }}
                        />
                      </div>
                    </div>
                    <span className={styles.count}>{inst.count}</span>
                  </div>
                );
              })}
            </div>
          )}

          <p className={styles.footer}>
            {fetchedAt
              ? `Last updated ${fetchedAt.toLocaleTimeString()} · `
              : ''}
            Data refreshes every 60 seconds
          </p>
        </div>
      </main>
    </>
  );
}
