import { useState, useEffect } from 'react';
import { calculateTimeRemaining } from '../utils/countdownUtils';

/**
 * Custom hook that counts down to a target date.
 * @param {string|Date} targetDate - The target date to count down to.
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, isExpired: boolean }}
 */
export function useCountdown(targetDate) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    calculateTimeRemaining(targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeRemaining(remaining);

      if (remaining.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeRemaining;
}
