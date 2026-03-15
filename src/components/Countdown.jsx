import { useState, useEffect } from 'react';
import styles from './Countdown.module.css';

const REGISTRATION_DATE = new Date('2026-04-19T18:30:00Z'); // March 20 2026, 00:00 IST

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

const Countdown = () => {
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
};

export default Countdown;
