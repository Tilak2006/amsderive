import { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Countdown from '../components/Countdown';
import BackgroundOverlay from '../components/hero/BackgroundOverlay';
import AboutSection from '../components/sections/AboutSection';
import CompetitionSection from '../components/sections/CompetitionSection';
import TimelineSection from '../components/sections/TimelineSection';
import WhoSection from '../components/sections/WhoSection';
import FadeInSection from '../components/FadeInSection';
import styles from '../styles/hero.module.css';

// Dynamic import to avoid SSR issues with Three.js
const WireframeMesh = dynamic(
  () => import('../components/hero/WireframeMesh'),
  { ssr: false }
);

export default function LandingPage() {
  const [expired, setExpired] = useState(false);

  return (
    <>
      <Head>
        <title>AMS-DERIVE — Quantitative Trading & Mathematical Competition</title>
        <meta
          name="description"
          content="AMS-DERIVE is a premium competitive programming and quantitative trading contest."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      <main className={styles.heroMain}>
        <WireframeMesh />
        <BackgroundOverlay />

        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <div className={styles.titleGroup}>
              <h1 className={styles.mainTitle}>AMS DERIVE</h1>
              <p className={styles.subTitle}>Quantitative Trading & Mathematical Competition</p>
            </div>

            <p className={styles.signupLabel}>
              {expired ? 'REGISTRATIONS ARE OPEN NOW' : 'REGISTRATIONS OPEN IN'}
            </p>
            <Countdown onExpiredChange={setExpired} />
          </div>
        </div>
        <span className={styles.heroTopoLabel}></span>
      </main>

      <div className="content-sections">
        <FadeInSection>
          <AboutSection />
        </FadeInSection>
        <FadeInSection>
          <CompetitionSection />
        </FadeInSection>
        <FadeInSection>
          <TimelineSection />
        </FadeInSection>
        <FadeInSection>
          <WhoSection />
        </FadeInSection>
      </div>
    </>
  );
}
