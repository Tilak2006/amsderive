/**
 * POST /api/firm/get-firm-profile
 *
 * Verifies the firm's Firebase ID token and returns their Firestore profile.
 * Called on every firm page mount — this is the authoritative access gate.
 * Also fires a fire-and-forget lastLogin timestamp update.
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const reqId = genReqId();

  try {
    const docRef = db.collection('firms').doc(uid);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Not a firm account' });
    }

    const data = snap.data();

    // Fire-and-forget lastLogin update — never blocks the response
    docRef
      .update({ lastLogin: admin.firestore.FieldValue.serverTimestamp() })
      .catch((err) => logger.warn('firms', 'firm_last_login_failed', {
        reqId,
        actorId: uid,
        entityId: uid,
        detail: { message: err.message },
        status: 'degraded',
      }));

    logger.info('firms', 'firm_profile_fetched', {
      reqId,
      actorId: uid,
      entityId: uid,
      detail: { tier: data.tier, firmSlug: data.firmSlug },
      status: 'ok',
    });
    return res.status(200).json({
      firmName: data.firmName,
      firmSlug: data.firmSlug,
      tier: data.tier,
      logoUrl: data.logoUrl || null,
      access: data.access,
    });
  } catch (err) {
    logger.error('firms', 'firm_profile_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
