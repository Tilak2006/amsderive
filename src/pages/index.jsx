import { memo, useCallback, useState, Suspense, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Countdown from '../components/Countdown';
import FadeInSection from '../components/FadeInSection';
import Footer from '../components/Footer';
import styles from '../styles/hero.module.css';
import pageStyles from './index.module.css';

// ── Dynamic imports ────────────────────────────────────────────────────────
// Three.js — must be client-only
const WireframeMesh = dynamic(
  () => import('../components/hero/WireframeMesh'),
  { ssr: false, loading: () => null }
);

// Pure decoration — no SSR value, keep out of initial bundle
const BackgroundOverlay = dynamic(
  () => import('../components/hero/BackgroundOverlay'),
  { ssr: false }
);

// Below-the-fold sections — loaded only when needed
const AboutSection = dynamic(() => import('../components/sections/AboutSection'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
  ssr: false,
});
const CompetitionSection = dynamic(() => import('../components/sections/CompetitionSection'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
  ssr: false,
});
const TimelineSection = dynamic(() => import('../components/sections/TimelineSection'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
  ssr: false,
});
const WhoSection = dynamic(() => import('../components/sections/WhoSection'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
  ssr: false,
});

// ── HeroContent ────────────────────────────────────────────────────────────
// Isolated into its own memoized component so that:
//  1. The `expired` state and Countdown's per-second ticks are fully
//     contained here — WireframeMesh, BackgroundOverlay, Navbar, and the
//     section list are siblings of <HeroContent> and will never re-render
//     due to countdown changes.
//  2. `handleExpired` is stable via useCallback — no prop reference churn.
const HeroContent = memo(function HeroContent() {
  const [expired, setExpired] = useState(false);
  const handleExpired = useCallback(() => setExpired(true), []);

  return (
    <div className={styles.heroOverlay}>
      <div className={styles.heroContent}>
        <div className={styles.titleGroup}>
          <h1 className={styles.mainTitle}>AMS DERIVE</h1>
          <p className={styles.subTitle}>QUANTITATIVE FINANCE × COMPETITIVE PROGRAMMING</p>
        </div>

        <p className={styles.signupLabel}>
          {expired ? 'REGISTRATIONS ARE OPEN NOW' : 'REGISTRATIONS OPEN IN'}
        </p>
        <Countdown onExpiredChange={handleExpired} />
      </div>
    </div>
  );
});

// ── Page ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <>
      <Head>
        <title>AMS-DERIVE — Selecting Quantitative Thinkers</title>
        <meta
          name="description"
          content="AMS DERIVE identifies first-principles thinkers in quantitative finance and algorithmic problem solving through a 3-round competition."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      <main className={styles.heroMain}>
        <WireframeMesh />
        <BackgroundOverlay />
        <HeroContent />
        <span className={styles.heroTopoLabel} />
      </main>

      {isHydrated && (
        <div className={pageStyles.contentSections}>
          <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
            <FadeInSection><AboutSection /></FadeInSection>
            <FadeInSection><CompetitionSection /></FadeInSection>
            <FadeInSection><TimelineSection /></FadeInSection>
            <FadeInSection><WhoSection /></FadeInSection>
          </Suspense>
        </div>
      )}

      <Footer />
    </>
  );
}