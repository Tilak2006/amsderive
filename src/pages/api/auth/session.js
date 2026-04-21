/**
 * POST /api/auth/session
 *
 * Exchanges a short-lived Firebase ID token for an HttpOnly server-managed
 * session cookie (Firebase session cookie, up to 14 days, default 8 hours).
 *
 * The client sends the ID token in the Authorization header.
 * The server mints a session cookie via admin.auth().createSessionCookie(),
 * sets it as HttpOnly; Secure; SameSite=Strict — JS cannot read it.
 *
 * Body: { type: 'admin' | 'firm' }
 *   type controls which cookie name is set and whether the firm Firestore
 *   doc check is performed.
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

const db = admin.firestore();
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  const { type } = req.body;

  if (type !== 'admin' && type !== 'firm' && type !== 'subadmin') {
    return res.status(400).json({ error: 'Invalid session type' });
  }

  const reqId = genReqId();

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // For firm sessions: verify the user has a firms document
  if (type === 'firm') {
    try {
      const firmSnap = await db.collection('firms').doc(decoded.uid).get();
      if (!firmSnap.exists) {
        return res.status(403).json({ error: 'Not a firm account' });
      }
    } catch (err) {
      logger.error('auth', 'session_firm_lookup_failed', { reqId, actorId: decoded.uid, status: 'failed' }, err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // For subadmin sessions: verify the user has a subadmins document
  if (type === 'subadmin') {
    try {
      const subSnap = await db.collection('subadmins').doc(decoded.uid).get();
      if (!subSnap.exists) {
        return res.status(403).json({ error: 'Not a subadmin account' });
      }
    } catch (err) {
      logger.error('auth', 'session_subadmin_lookup_failed', { reqId, actorId: decoded.uid, status: 'failed' }, err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // For admin sessions: verify the admin custom claim
  if (type === 'admin') {
    if (!decoded.admin) {
      logger.warn('auth', 'session_admin_claim_missing', { reqId, actorId: decoded.uid, status: 'blocked' });
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const cookieName = type === 'admin' ? '__session' : type === 'subadmin' ? '__subadminSession' : '__firmSession';
    const cookieOptions = [
      `${cookieName}=${sessionCookie}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/',
      `Max-Age=${SESSION_DURATION_MS / 1000}`,
    ].join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    logger.info('auth', 'session_created', {
      reqId,
      actorId: decoded.uid,
      detail: { type },
      status: 'ok',
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error('auth', 'session_create_failed', { reqId, actorId: decoded.uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Failed to create session' });
  }
}
