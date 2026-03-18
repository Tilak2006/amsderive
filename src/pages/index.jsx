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
        <title>AMS Derive — India's Hardest Quant Contest | IIT Bombay Finals</title>
        <meta name="description" content="Only 6/200 solved the hardest problem. Quant competition with IIT Bombay finals. Compete in derivatives pricing, stochastic calculus, and algorithmic trading under live pressure." />
        <meta name="keywords" content="quant contest India, algorithmic trading competition, IIT Bombay quant, quant finance contest, stochastic calculus competition, AMS Derive, quant internship, Jane Street India, Tower Research, quant aspirant" />
        <link rel="canonical" href="https://amsociety.in" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AMS Derive" />
        <meta property="og:url" content="https://amsociety.in" />
        <meta property="og:title" content="AMS Derive — India's Hardest Quant Contest | IIT Bombay Finals" />
        <meta property="og:description" content="Only 6/200 solved the hardest problem. Quant competition with IIT Bombay finals. ₹15L+ prize pool. Open to IITs, BITS, and top engineering colleges." />
        <meta property="og:image" content="https://amsociety.in/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="AMS Derive — Quant Contest with IIT Bombay Finals" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@amsderive" />
        <meta name="twitter:creator" content="@amsderive" />
        <meta name="twitter:title" content="AMS Derive — India's Hardest Quant Contest | IIT Bombay Finals" />
        <meta name="twitter:description" content="Only 6/200 solved the hardest problem. Quant competition with IIT Bombay finals. ₹15L+ prize pool." />
        <meta name="twitter:image" content="https://amsociety.in/og-image.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              "name": "AMS Derive 2026",
              "description": "Three-round quant contest ending at IIT Bombay. Problems span derivatives pricing, stochastic calculus, Bayesian inference, and algorithmic trading. Only 6/200 solved the hardest problem in 2025.",
              "startDate": "2026-05-23",
              "endDate": "2026-07-11",
              "eventStatus": "https://schema.org/EventScheduled",
              "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
              "location": {
                "@type": "VirtualLocation",
                "url": "https://amsociety.in/ams-derive"
              },
              "organizer": {
                "@type": "Organization",
                "name": "AMS Society IIT Bombay",
                "url": "https://amsociety.in"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "validFrom": "2026-04-20",
                "url": "https://amsociety.in/register"
              },
              "image": "https://amsociety.in/og-image.png",
              "url": "https://amsociety.in/ams-derive"
            })
          }}
        />
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