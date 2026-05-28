import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';

const VALID_ROUNDS = ['prior', 'posterior_tentative', 'posterior_tentative_2', 'posterior', 'convergence'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let decoded;
  try {
    decoded = await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const { docId, round } = req.body;

  if (!docId || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid docId.' });
  }
  if (!VALID_ROUNDS.includes(round)) {
    return res.status(400).json({ error: 'Invalid round. Must be "prior", "posterior_tentative", "posterior_tentative_2", "posterior", or "convergence".' });
  }

  try {
    const docRef = db.collection('registrants').doc(docId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Registrant not found.' });
    }

    const data = snap.data();

    // Idempotency — same round already set, nothing to do
    if (data.round === round) {
      return res.status(200).json({ success: true, skipped: true });
    }

    if ((round === 'posterior' || round === 'convergence') && (data.status !== 'approved' || data.dataConsent !== true)) {
      return res.status(400).json({ error: 'Only approved registrants with data consent can be moved to POSTERIOR or CONVERGENCE.' });
    }

    const prevRound = data.round || null;

    await docRef.update({
      round,
      roundUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('admin', 'round_updated', {
      reqId,
      entityId: docId,
      actorId: decoded.uid,
      detail: { round, prevRound },
      status: 'ok',
    });

    try {
      await db.collection('_audit_log').add({
        type: 'round_update',
        actorId: decoded.uid,
        reqId,
        entityId: docId,
        prevRound,
        newRound: round,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditErr) {
      logger.error('admin', 'round_audit_log_failed', {
        reqId, entityId: docId, actorId: decoded.uid, detail: { round, prevRound }, status: 'degraded',
      }, auditErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('admin', 'round_update_error', { reqId, entityId: docId, actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to update round.' });
  }
}
