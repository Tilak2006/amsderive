import { useCountdown } from '../../hooks/useCountdown';
import TimeBlock from './TimeBlock';
import styles from './CountdownTimer.module.css';

/**
 * Renders a countdown timer displaying days, hours, minutes, and seconds.
 * @param {{ targetDate: string|Date }} props
 */
export default function CountdownTimer({ targetDate }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className={styles.countdownContainer}>
        <p className={styles.countdownExpired}>The contest has begun!</p>
      </div>
    );
  }

  return (
    <div className={styles.countdownContainer}>
      <div className={styles.countdownBlocks}>
        <TimeBlock value={days} label="Days" />
        <span className={styles.countdownSeparator}>:</span>
        <TimeBlock value={hours} label="Hours" />
        <span className={styles.countdownSeparator}>:</span>
        <TimeBlock value={minutes} label="Minutes" />
        <span className={styles.countdownSeparator}>:</span>
        <TimeBlock value={seconds} label="Seconds" />
      </div>
    </div>
  );
}
