/**
 * POST /api/auth/logout
 *
 * Revokes the user's Firebase refresh tokens server-side (so the session
 * cookie cannot be exchanged for new ID tokens) and clears the HttpOnly
 * session cookie.
 *
 * Body: { type: 'admin' | 'firm' }
 */

import * as admin from 'firebase-admin';
import logger, { genReqId } from '../../../utils/logger';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.body;
  if (type !== 'admin' && type !== 'firm') {
    return res.status(400).json({ error: 'Invalid session type' });
  }

  const cookieName = type === 'admin' ? '__session' : '__firmSession';
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
