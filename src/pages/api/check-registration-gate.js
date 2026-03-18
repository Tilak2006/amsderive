/**
 * Server-side registration date gate check.
 * Validates whether registration is open OR if admin bypass is active.
 * 
 * Admin bypass cookie (httpOnly) allows testing before registration date.
 * Bypass skips date gate only; cap and deduplication are always enforced.
 * 
 * Ref: firebase-upload-safety skill + admin bypass security pattern
 * 
 * Usage:
 * POST /api/check-registration-gate
 * 
 * Response:
 * - 200 OK: registration is open (or bypass active)
 * - 403 Forbidden: registration not open yet (no bypass)
 * - 404 Not Found: endpoint not available
 */

import { REGISTRATION_OPENS } from '../../lib/constants';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for admin bypass cookie (httpOnly, set by /api/test-registration)
    const cookies = req.headers.cookie || '';
    const hasAdminBypass = cookies
      .split(';')
      .some(c => c.trim() === 'admin_bypass=1');

    // Get current server time
    const now = Date.now();
    const registrationTime = REGISTRATION_OPENS.getTime();
    const isRegistrationOpen = now >= registrationTime;

    // If admin bypass is active, allow registration (skip date gate)
    if (hasAdminBypass) {
      return res.status(200).json({
        allowed: true,
        reason: 'admin-bypass-active',
      });
    }

    // If no bypass, check if registration date has passed
    if (isRegistrationOpen) {
      return res.status(200).json({
        allowed: true,
        reason: 'registration-open',
      });
    }

    // Registration not open and no bypass
    return res.status(403).json({
      error: 'Registration has not opened yet.',
      allowed: false,
    });

  } catch (error) {
    console.error('Registration gate check error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
