/**
 * Server-side registration date gate check.
 * Validates whether registration is currently open.
 *
 * For admin testing before the registration date, use /api/test-registration
 * which requires ADMIN_KEY authorization.
 *
 * Usage:
 * POST /api/check-registration-gate
 *
 * Response:
 * - 200 OK: registration is open
 * - 403 Forbidden: registration not open yet
 */

import { REGISTRATION_OPENS } from '../../lib/constants';
import logger, { genReqId } from '../../utils/logger';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    const registrationTime = REGISTRATION_OPENS.getTime();
    const isRegistrationOpen = now >= registrationTime;

    if (isRegistrationOpen) {
      return res.status(200).json({
        allowed: true,
        reason: 'registration-open',
      });
    }

    return res.status(403).json({
      error: 'Registration has not opened yet.',
      allowed: false,
    });

  } catch (error) {
    logger.error('registration', 'gate_check_error', { reqId: genReqId(), status: 'failed' }, error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
