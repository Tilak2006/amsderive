// Template: IP Rate Limiting with User-Agent Fingerprinting
// Use in: src/lib/rateLimiter.js
// Rule 6: IP rate limiting must include user-agent fingerprint, not IP alone

const crypto = require('crypto');

class RateLimiter {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  /**
   * Create a unique fingerprint from IP + User-Agent
   * ✓ CORRECT: Includes both IP and User-Agent for device identification
   * ❌ WRONG: Just IP alone (devices change networks, IPs change devices)
   */
  createFingerprint(req) {
    const ip = this.extractIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Combine IP and User-Agent
    const combined = `${ip}:${userAgent}`;
    
    // Hash for consistency
    const fingerprint = crypto
      .createHash('sha256')
      .update(combined)
      .digest('hex');

    return fingerprint;
  }

  /**
   * Extract IP from request (proxy-aware)
   */
  extractIp(req) {
    // Check for forwarded IP (proxy/load balancer)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      // Take first IP if comma-separated
      return xForwardedFor.split(',')[0].trim();
    }

    // Fallback to direct connection
    return req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.ip ||
           'unknown';
  }

  /**
   * Check if user has exceeded upload rate limit
   * @param {object} req - Express request object
   * @param {string} userId - User ID (or null if anonymous)
   * @returns {boolean} true if rate limited, false if allowed
   */
  async checkUploadLimit(req, userId = null) {
    const fingerprint = this.createFingerprint(req);
    
    // Create rate limit key: user-based or fingerprint-based
    const rateLimitKey = userId 
      ? `rateLimit:user:${userId}` 
      : `rateLimit:fingerprint:${fingerprint}`;

    // Configuration
    const maxUploads = 3; // Allow 3 uploads
    const windowSeconds = 5 * 60; // Per 5 minutes

    try {
      // Get current count
      const current = await this.redis.incr(rateLimitKey);

      // Set expiration on first hit
      if (current === 1) {
        await this.redis.expire(rateLimitKey, windowSeconds);
      }

      // Check if exceeded
      return current > maxUploads;

    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open: allow on error (don't block users)
      return false;
    }
  }

  /**
   * Get remaining uploads for this client
   */
  async getRemainingUploads(req, userId = null) {
    const fingerprint = this.createFingerprint(req);
    const rateLimitKey = userId 
      ? `rateLimit:user:${userId}` 
      : `rateLimit:fingerprint:${fingerprint}`;

    const current = await this.redis.get(rateLimitKey) || 0;
    const maxUploads = 3;
    const remaining = Math.max(0, maxUploads - parseInt(current));

    return remaining;
  }
}

// Usage in API handler
export async function handleUploadRequest(req, res) {
  const rateLimiter = new RateLimiter(redisClient);
  const userId = getCurrentUserId(req); // or null

  const isRateLimited = await rateLimiter.checkUploadLimit(req, userId);
  
  if (isRateLimited) {
    const remaining = await rateLimiter.getRemainingUploads(req, userId);
    return res.status(429).json({
      error: 'Too many uploads. Try again later.',
      remaining,
    });
  }

  // Proceed with upload
  return processUpload(req, res);
}

/**
 * Why fingerprint + not just IP?
 * 
 * Fingerprint = hash(IP + User-Agent)
 * 
 * IP alone issues:
 * - Same IP, different devices → wrong device gets rate limited
 * - Different IPs, same device (WiFi switch) → can re-register after limit
 * - VPN/proxy changes → easily bypass limit
 * 
 * Fingerprint (IP + UA) benefits:
 * - Same device keeps same User-Agent → consistent fingerprint
 * - Device-level rate limiting (even across networks)
 * - Harder to spoof (requires matching IP and exact User-Agent)
 * 
 * Example:
 * - Device A: IP 192.168.1.100 + "Chrome 90... Win10"
 *   → fingerprint = hash("192.168.1.100:Chrome 90... Win10")
 * - Device A switches to mobile WiFi: IP 203.0.113.50 + "Chrome 90... Win10"
 *   → fingerprint = hash("203.0.113.50:Chrome 90... Win10") [DIFFERENT]
 *   → But if same device (same UA), can be identified across networks
 * 
 * Trade-off: Fingerprint is device-friendly but not IP-only;
 * Combine with user ID when available for maximum accuracy.
 */
