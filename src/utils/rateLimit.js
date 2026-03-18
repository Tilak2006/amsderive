import { checkRateLimit as firestoreCheckRateLimit } from '../firebase/firestoreService';

/**
 * Check whether the hashed IP is rate-limited.
 * Wraps the Firestore rate-limit check with additional logic.
 * @param {string} hashedIp - SHA-256 hex hash of the client IP.
 * @returns {Promise<{allowed: boolean, error?: string}>}
 */
export async function checkRateLimit(hashedIp) {
  if (!hashedIp || hashedIp === 'unknown') {
    console.warn('[rateLimit] fingerprint unavailable — skipping rate limit check');
    return { allowed: true };
  }

  return firestoreCheckRateLimit(hashedIp);
}
