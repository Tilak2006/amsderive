/**
 * Hash an IP address using SHA-256 via the Web Crypto API.
 * @param {string} ip - The raw IP address string.
 * @returns {Promise<string>} Hex-encoded SHA-256 hash.
 */
export async function hashIp(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a rate-limit fingerprint from IP only.
 *
 * User-Agent was deliberately removed: it is client-controlled and can be rotated
 * per-request to bypass rate limits entirely.
 *
 * @param {string} ip - The raw IP address string.
 * @returns {Promise<string>} Hex-encoded SHA-256 hash.
 */
export async function createRateLimitFingerprint(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip || 'unknown');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
