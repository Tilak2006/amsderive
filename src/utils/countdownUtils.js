/**
 * Calculate the time remaining until a target date.
 * @param {string|Date} targetDate
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, isExpired: boolean }}
 */
export function calculateTimeRemaining(targetDate) {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
  };
}

/**
 * Pad a number with a leading zero if less than 10.
 * @param {number} n
 * @returns {string}
 */
export function padNumber(n) {
  return String(n).padStart(2, '0');
}

/**
 * Format a time value with its label (e.g. "05 days").
 * @param {number} value
 * @param {string} label
 * @returns {string}
 */
export function formatTimeUnit(value, label) {
  return `${padNumber(value)} ${label}`;
}
