import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Three.js
const WireframeMesh = dynamic(
  () => import('../components/hero/WireframeMesh'),
  { ssr: false }
);

const REGISTRATION_DATE = new Date('2025-04-19T18:30:00Z'); // April 20, 00:00 IST

function pad(n) {
  return String(n).padStart(2, '0');
}

function getTimeRemaining() {
  const diff = REGISTRATION_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export default function LandingPage() {
  const [time, setTime] = useState(getTimeRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTime(remaining);
      if (remaining.expired) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <title>AMS-DERIVE — Competitive Programming Contest</title>
        <meta
          name="description"
          content="AMS-DERIVE is a premium competitive programming contest. Register now and test your skills."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="hero-main">
        <WireframeMesh />
        <div className="hero-overlay">
          <h1 className="hero-heading">REGISTRATIONS OPEN IN</h1>
          <div className="hero-countdown">
            <div className="hero-countdown-numbers">
              <span>{pad(time.days)}</span>
              <span className="hero-colon">:</span>
              <span>{pad(time.hours)}</span>
              <span className="hero-colon">:</span>
              <span>{pad(time.minutes)}</span>
              <span className="hero-colon">:</span>
              <span>{pad(time.seconds)}</span>
            </div>
            <div className="hero-countdown-divider" />
            <div className="hero-countdown-labels">
              <span>DAYS</span>
              <span>HOURS</span>
              <span>MINUTES</span>
              <span>SECONDS</span>
            </div>
          </div>
        </div>
        <span className="hero-topo-label">RISK_TOPOGRAPHY_VIEW</span>
      </main>
    </>
  );
}
