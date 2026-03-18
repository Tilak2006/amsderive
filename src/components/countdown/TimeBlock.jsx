import { padNumber } from '../../utils/countdownUtils';
import styles from './TimeBlock.module.css';

/**
 * Displays a single time unit (e.g. "05" / "DAYS") in a styled block.
 * @param {{ value: number, label: string }} props
 */
export default function TimeBlock({ value = 0, label = '' }) {
  return (
    <div className={styles.timeblock}>
      <span className={styles.timeblockValue}>{padNumber(value)}</span>
      <span className={styles.timeblockLabel}>{label}</span>
    </div>
  );
}
