import { db } from './firebaseConfig';

/**
 * Submit a registration entry to Firestore.
 * @param {Object} data - Registration form data.
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function submitRegistration(data) {
  try {
    // TODO: implement Firestore write
    return { success: true, id: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Check whether the given hashed IP has exceeded the rate limit.
 * @param {string} hashedIp - SHA-256 hex hash of the client IP.
 * @returns {Promise<{allowed: boolean, error?: string}>}
 */
export async function checkRateLimit(hashedIp) {
  try {
    // TODO: implement Firestore rate-limit check
    return { allowed: true };
  } catch (error) {
    return { allowed: false, error: error.message };
  }
}
