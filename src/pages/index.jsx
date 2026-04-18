import { memo, useCallback, useState, Suspense, useEffect, useRef } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Countdown from '../components/Countdown';
import FadeInSection from '../components/FadeInSection';
import Footer from '../components/Footer';
import styles from '../styles/hero.module.css';
import pageStyles from './index.module.css';

// ── Dynamic imports ────────────────────────────────────────────────────────
// Three.js — client-only, deferred until after initial paint so it doesn't
// compete with FCP. requestIdleCallback fires after the browser is idle
// (i.e., after first paint), drastically reducing TTI on slow mobile connections.
const WireframeMesh = dynamic(
  () => new Promise((resolve) => {
    const load = () => import('../components/hero/WireframeMesh').then(resolve);
    if (typeof window === 'undefined') { load(); return; }
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 2000 });
    } else {
      setTimeout(load, 200);
    }
  }),
  { ssr: false, loading: () => null }
);

// Pure decoration — defer same as WireframeMesh
const BackgroundOverlay = dynamic(
  () => new Promise((resolve) => {
    const load = () => import('../components/hero/BackgroundOverlay').then(resolve);
    if (typeof window === 'undefined') { load(); return; }
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 2000 });
    } else {
      setTimeout(load, 200);
    }
  }),
  { ssr: false }
);

// Below-the-fold sections — code-split but SSR'd for SEO and faster FCP.
// Only WireframeMesh/BackgroundOverlay stay ssr:false (Three.js, client-only).
const AboutSection = dynamic(() => import('../components/sections/AboutSection'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
});
const CompetitionSection = dynamic(() => import('../components/sections/CompetitionSection'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
});
const TimelineSection = dynamic(() => import('../components/sections/TimelineSection'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
});
const WhoSection = dynamic(() => import('../components/sections/WhoSection'), {
  loading: () => <div style={{ minHeight: '400px' }} />,
});
const SponsorsSection = dynamic(() => import('../components/sections/SponsorsSection'), {
  loading: () => <div style={{ minHeight: '200px' }} />,
});
// const SyllabusSection = dynamic(() => import('../components/sections/SyllabusSection'), {
//   loading: () => <div style={{ minHeight: '400px' }} />,
//   ssr: false,
// });
// const AMSAboutSection = dynamic(() => import('../components/sections/AMSAboutSection'), {
//   loading: () => <div style={{ minHeight: '400px' }} />,
//   ssr: false,
// });

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
          <p className={styles.eyebrow}>Algorithms &amp; Mathematics Society</p>
          <h1 className={styles.mainTitle}>AMS DERIVE</h1>
          <p className={styles.subTitle}>FIRST-PRINCIPLES THINKING × PROBABILISTIC REASONING</p>        </div>

        <p className={styles.signupLabel}>
          {expired ? 'REGISTRATIONS ARE OPEN NOW' : 'REGISTRATIONS OPEN IN'}
        </p>
        <Countdown onExpiredChange={handleExpired} />

        <a
          href="https://chat.whatsapp.com/D3OxCs0L1V8IodpRVzG6cw"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mobileNotifyBtn}
        >
          Join Community
        </a>
      </div>
    </div>
  );
});

// ── Page ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const sectionsRef = useRef(null);

  useEffect(() => {
    if (sectionsRef.current) {
      sectionsRef.current.dataset.hydrated = 'true';
    }
  }, []);

  return (
    <>
      <Head>
        <title>AMS Derive | High-Signal Evaluation of Quantitative Thinking</title>
        <meta name="description" content="AMS Derive 2026. Three-round quantitative evaluation circuit. Apex Partner: Jane Street. 600+ participants across 20+ institutions in the inaugural edition. PRIOR: May 23. POSTERIOR: June 21. CONVERGENCE: July 11 at one of the prestigious IITs." />
        <meta name="keywords" content="quant contest India, algorithmic trading competition, offline finals quant, quant finance contest, stochastic calculus competition, AMS Derive, quant internship, Jane Street India, Tower Research, quant aspirant" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        {/* Warm TLS early — /register uploads benefit from established connection */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="canonical" href="https://amsderive.in" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AMS Derive" />
        <meta property="og:url" content="https://amsderive.in" />
        <meta property="og:title" content="AMS Derive — High-Signal Evaluation of Quantitative Thinking" />
        <meta property="og:description" content="Three-round quantitative evaluation circuit. Apex Partner: Jane Street. 600+ participants across 20+ institutions. PRIOR: May 23 · POSTERIOR: June 21 · CONVERGENCE: July 11 at one of the prestigious IITs." />
        <meta property="og:image" content="https://amsderive.in/og-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="AMS Derive — High-Signal Evaluation System" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@amsderive" />
        <meta name="twitter:creator" content="@amsderive" />
        <meta name="twitter:title" content="AMS Derive — High-Signal Evaluation of Quantitative Thinking" />
        <meta name="twitter:description" content="Three-round quantitative evaluation circuit. Apex Partner: Jane Street. 600+ participants, 20+ institutions. PRIOR: May 23 · POSTERIOR: June 21 · CONVERGENCE: July 11 at one of the prestigious IITs." />
        <meta name="twitter:image" content="https://amsderive.in/og-image.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              "name": "AMS Derive 2026",
              "description": "A high-signal evaluation system identifying first-principles thinkers through three rounds of rigorous problem-solving. Final round offline at one of the IITs.",
              "startDate": "2026-05-23",
              "endDate": "2026-07-11",
              "eventStatus": "https://schema.org/EventScheduled",
              "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
              "location": {
                "@type": "VirtualLocation",
                "url": "https://amsderive.in"
              },
              "organizer": {
                "@type": "Organization",
                "name": "AMS Society",
                "url": "https://amsderive.in"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "validFrom": "2026-04-20",
                "url": "https://amsderive.in/register"
              },
              "sponsor": {
                "@type": "Organization",
                "name": "Jane Street",
                "url": "https://www.janestreet.com"
              },
              "image": "https://amsderive.in/og-image.jpg",
              "url": "https://amsderive.in"
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

      <div ref={sectionsRef} className={pageStyles.contentSections}>
        <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
          <FadeInSection><AboutSection /></FadeInSection>
          <FadeInSection><SponsorsSection /></FadeInSection>
          <FadeInSection><CompetitionSection /></FadeInSection>
          {/* <FadeInSection><SyllabusSection /></FadeInSection> */}
          <FadeInSection><TimelineSection /></FadeInSection>
          <FadeInSection><WhoSection /></FadeInSection>
          {/* <FadeInSection><AMSAboutSection /></FadeInSection> */}
        </Suspense>
      </div>

      <Footer />
    </>
  );
}