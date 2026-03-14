import { checkRateLimit as firestoreCheckRateLimit } from '../firebase/firestoreService';

/**
 * Check whether the hashed IP is rate-limited.
 * Wraps the Firestore rate-limit check with additional logic.
 * @param {string} hashedIp - SHA-256 hex hash of the client IP.
 * @returns {Promise<{allowed: boolean, error?: string}>}
 */
export async function checkRateLimit(hashedIp) {
  if (!hashedIp) {
    return { allowed: false, error: 'Missing IP hash' };
  }

  return firestoreCheckRateLimit(hashedIp);
}
