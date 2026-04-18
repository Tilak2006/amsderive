import Head from 'next/head';
import styles from './maintenance.module.css';

export default function Maintenance() {
  return (
    <>
      <Head>
        <title>AMS DERIVE — Under Maintenance</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className={styles.root}>
        <div className={styles.glow} />

        <div className={styles.card}>
          <p className={styles.eyebrow}>AMS DERIVE</p>

          <div className={styles.iconWrap}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="19" stroke="#D4AF37" strokeWidth="1.5" strokeOpacity="0.5" />
              <path d="M20 12v10l5 3" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className={styles.heading}>Under Maintenance</h1>

          <p className={styles.body}>
            We&apos;re making some updates. The site will be back on
          </p>
          <p className={styles.datetime}>19th April &mdash; 8:00 PM IST</p>

          <div className={styles.divider} />

          <p className={styles.footer}>
            Questions?&ensp;
            <a href="mailto:team@amsderive.in" className={styles.link}>team@amsderive.in</a>
          </p>
        </div>
      </main>
    </>
  );
}
