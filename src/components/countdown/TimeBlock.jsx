import { padNumber } from '../../utils/countdownUtils';

/**
 * Displays a single time unit (e.g. "05" / "DAYS") in a styled block.
 * @param {{ value: number, label: string }} props
 */
export default function TimeBlock({ value = 0, label = '' }) {
  return (
    <div className="timeblock">
      <span className="timeblock-value">{padNumber(value)}</span>
      <span className="timeblock-label">{label}</span>
    </div>
  );
}
