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
 * Create a device fingerprint from IP + User-Agent for rate limiting.
 * Ref: firebase-upload-safety skill (Rule 6: IP fingerprinting with user-agent)
 * 
 * Why not just IP?
 * - Same IP, different devices → wrong device gets rate limited
 * - Different IPs, same device (WiFi switch) → can re-register after limit
 * - This hashes both to create device-level rate limiting
 * 
 * @param {string} ip - The raw IP address string.
 * @param {string} userAgent - The User-Agent string from browser.
 * @returns {Promise<string>} Hex-encoded SHA-256 hash.
 */
export async function createRateLimitFingerprint(ip, userAgent) {
  // Combine IP and User-Agent for device-level fingerprinting
  const combined = `${ip}:${userAgent || 'unknown'}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
