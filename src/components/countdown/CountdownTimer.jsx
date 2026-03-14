import { useCountdown } from '../../hooks/useCountdown';
import TimeBlock from './TimeBlock';

/**
 * Renders a countdown timer displaying days, hours, minutes, and seconds.
 * @param {{ targetDate: string|Date }} props
 */
export default function CountdownTimer({ targetDate }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className="countdown-container">
        <p className="countdown-expired">The contest has begun!</p>
      </div>
    );
  }

  return (
    <div className="countdown-container">
      <div className="countdown-blocks">
        <TimeBlock value={days} label="Days" />
        <span className="countdown-separator">:</span>
        <TimeBlock value={hours} label="Hours" />
        <span className="countdown-separator">:</span>
        <TimeBlock value={minutes} label="Minutes" />
        <span className="countdown-separator">:</span>
        <TimeBlock value={seconds} label="Seconds" />
      </div>
    </div>
  );
}
