/**
 * POST /api/firm/express-interest
 *
 * Lets an authenticated firm flag a candidate to the AMS organizers (since firms
 * cannot contact candidates directly before results). Writes one idempotent row
 * per (firm, candidate) into `firm_interest`, which the organizers review.
 *
 * Body: { candidateId: string (encrypted token), note?: string, withdraw?: boolean }
 *   - withdraw: true removes the firm's interest in that candidate.
 *
 * Requires a non-derivation tier with registrantProfiles access — the same gate
 * used to view registrants. Interest can only be expressed in approved,
 * data-consented candidates.
 */

import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { parseFirmCandidateToken } from '../../../lib/firmCandidateToken';

const MAX_NOTE_LEN = 1000;

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
    // checkRevoked = true: this is a write, so honour logout/disable immediately.
    const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1], true);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const reqId = genReqId();

  let firmData;
  try {
    const firmSnap = await db.collection('firms').doc(uid).get();
    if (!firmSnap.exists) {
      return res.status(401).json({ error: 'Not a firm account' });
    }
    firmData = firmSnap.data();
  } catch (err) {
    logger.error('firms', 'interest_firm_lookup', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (firmData.tier === 'derivation' || !firmData.access?.registrantProfiles) {
    logger.warn('firms', 'interest_access_denied', { reqId, actorId: uid, status: 'blocked' });
    return res.status(403).json({ error: 'ACCESS_DENIED' });
  }

  const { candidateId, note, withdraw } = req.body || {};
  if (!candidateId || typeof candidateId !== 'string') {
    return res.status(400).json({ error: 'Missing candidateId.' });
  }
  const registrantId = parseFirmCandidateToken(candidateId);
  if (!registrantId) {
    return res.status(400).json({ error: 'Invalid candidate token.' });
  }

  const interestRef = db.collection('firm_interest').doc(`${uid}_${registrantId}`);

  if (withdraw === true) {
    try {
      await interestRef.delete();
      logger.info('firms', 'interest_withdrawn', { reqId, actorId: uid, entityId: registrantId, status: 'ok' });
      return res.status(200).json({ ok: true, interested: false });
    } catch (err) {
      logger.error('firms', 'interest_withdraw_error', { reqId, actorId: uid, entityId: registrantId, status: 'failed' }, err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Only flag candidates the firm is actually allowed to see.
  let registrant;
  try {
    const rSnap = await db.collection('registrants').doc(registrantId).get();
    if (!rSnap.exists) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }
    registrant = rSnap.data();
  } catch (err) {
    logger.error('firms', 'interest_registrant_lookup', { reqId, actorId: uid, entityId: registrantId, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (registrant.status !== 'approved' || registrant.dataConsent !== true) {
    return res.status(403).json({ error: 'Candidate is not available.' });
  }

  const cleanNote = typeof note === 'string' ? note.trim().slice(0, MAX_NOTE_LEN) : '';

  try {
    const existing = await interestRef.get();
    await interestRef.set({
      firmUid: uid,
      firmName: firmData.firmName || null,
      firmSlug: firmData.firmSlug || null,
      registrantId,
      candidateName: registrant.fullName || null,
      candidateUniversity: registrant.university || null,
      note: cleanNote || null,
      status: 'new',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: existing.exists
        ? (existing.data().createdAt || admin.firestore.FieldValue.serverTimestamp())
        : admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info('firms', 'interest_expressed', { reqId, actorId: uid, entityId: registrantId, status: 'ok' });
    return res.status(200).json({ ok: true, interested: true });
  } catch (err) {
    logger.error('firms', 'interest_error', { reqId, actorId: uid, entityId: registrantId, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
