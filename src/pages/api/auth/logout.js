/**
 * POST /api/auth/logout
 *
 * Revokes the user's Firebase refresh tokens server-side (so the session
 * cookie cannot be exchanged for new ID tokens) and clears the HttpOnly
 * session cookie.
 *
 * Body: { type: 'admin' | 'firm' }
 */

import { admin } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.body;
  if (type !== 'admin' && type !== 'firm' && type !== 'subadmin') {
    return res.status(400).json({ error: 'Invalid session type' });
  }

  const cookieName = type === 'admin' ? '__session' : type === 'subadmin' ? '__subadminSession' : '__firmSession';
  const sessionCookie = req.cookies?.[cookieName];
  const reqId = genReqId();

  // Clear the cookie immediately regardless of token validity
  res.setHeader('Set-Cookie', [
    `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
  ]);

  if (sessionCookie) {
    try {
      const decoded = await admin.auth().verifySessionCookie(sessionCookie);
      await admin.auth().revokeRefreshTokens(decoded.uid);
      logger.info('auth', 'session_revoked', { reqId, actorId: decoded.uid, detail: { type }, status: 'ok' });
    } catch (err) {
      // Cookie may already be expired or invalid — still a successful logout
      logger.warn('auth', 'session_revoke_skipped', { reqId, detail: { reason: err.message?.slice(0, 80), type }, status: 'degraded' });
    }
  }

  return res.status(200).json({ ok: true });
}
