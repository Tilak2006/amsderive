import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './Countdown.module.css';

const REGISTRATION_DATE = new Date('2026-04-19T18:30:00Z'); // April 20 2026, 00:00 IST

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

/**
 * Countdown — memoized, SSR-safe.
 *
 * Hydration fix:
 *  - State is initialized as `null` on both server and client so the SSR
 *    HTML and the hydration pass always agree (both render nothing / a stable
 *    placeholder). The real Date.now()-based value is set in useEffect, which
 *    only runs on the client, so the two environments never diverge.
 *
 * Performance notes:
 *  - memo: prevents re-renders when parent re-renders with identical props.
 *  - callbackRef: stores onExpiredChange in a ref so the interval effect
 *    never needs to re-subscribe when the parent re-renders.
 *  - The interval is created only once and clears itself on expiry.
 */
const Countdown = memo(function Countdown({ onExpiredChange }) {
  // null on server AND initial client render → hydration always matches.
  // Real value is set immediately in the first useEffect (client-only).
  const [time, setTime] = useState(null);

  // Stable ref — always points to the latest callback without re-subscribing
  const callbackRef = useRef(onExpiredChange);
  useEffect(() => {
    callbackRef.current = onExpiredChange;
  }, [onExpiredChange]);

  useEffect(() => {
    // Compute real time now that we're on the client
    const initial = getTimeRemaining();
    setTime(initial);

    if (initial.expired) {
      callbackRef.current?.(true);
      return;
    }

    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTime(remaining);
      if (remaining.expired) {
        clearInterval(interval);
        callbackRef.current?.(true);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty: interval is set once, callback handled via ref

  // Render nothing during SSR / before first client effect — avoids any
  // mismatch between server HTML and client hydration.
  if (time === null) return null;

  if (time.expired) {
    return (
      <div className={styles.countdownContainer}>
        <Link href="/register" className={styles.registerBtn}>
          Register Now
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.countdownContainer}>
      <div className={styles.numbers}>
        <span className={styles.number}>{pad(time.days)}</span>
        <span className={styles.separator}>:</span>
        <span className={styles.number}>{pad(time.hours)}</span>
        <span className={styles.separator}>:</span>
        <span className={styles.number}>{pad(time.minutes)}</span>
        <span className={styles.separator}>:</span>
        <span className={styles.number}>{pad(time.seconds)}</span>
      </div>
      <div className={styles.labels}>
        <span className={styles.label}>DAYS</span>
        <span className={styles.label}>HOURS</span>
        <span className={styles.label}>MINUTES</span>
        <span className={styles.label}>SECONDS</span>
      </div>
    </div>
  );
});

export default Countdown;