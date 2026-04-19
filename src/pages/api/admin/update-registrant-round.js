import * as admin from 'firebase-admin';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';

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
const VALID_ROUNDS = ['prior', 'posterior', 'convergence'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const { docId, round } = req.body;

  if (!docId || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid docId.' });
  }
  if (!VALID_ROUNDS.includes(round)) {
    return res.status(400).json({ error: 'Invalid round. Must be "prior", "posterior", or "convergence".' });
  }

  try {
    const docRef = db.collection('registrants').doc(docId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Registrant not found.' });
    }

    // Idempotency — same round already set, nothing to do
    if (snap.data().round === round) {
      return res.status(200).json({ success: true, skipped: true });
    }

    const prevRound = snap.data().round || null;

    await docRef.update({
      round,
      roundUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('admin', 'round_updated', {
      reqId,
      entityId: docId,
      actorId: 'admin',
      detail: { round, prevRound },
      status: 'ok',
    });

    try {
      await db.collection('_audit_log').add({
        type: 'round_update',
        actorId: 'admin',
        reqId,
        entityId: docId,
        prevRound,
        newRound: round,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditErr) {
      logger.error('admin', 'round_audit_log_failed', {
        reqId, entityId: docId, actorId: 'admin', detail: { round, prevRound }, status: 'degraded',
      }, auditErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('admin', 'round_update_error', { reqId, entityId: docId, actorId: 'admin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to update round.' });
  }
}
