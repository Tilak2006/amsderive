/**
 * POST /api/firm/get-finalists
 *
 * Returns talent pool data for the authenticated firm.
 * Includes registrants who have advanced past PRIOR (round === posterior or convergence).
 * Access is gated by the firm's Firestore access flags:
 *   - access.finalistProfiles must be true to get any data
 *   - access.resumeDownload controls whether resumeUrl is included
 *   - access.linkedinAccess controls whether linkedIn is included
 *
 * Never returns: email, phoneNumber, ipHash, codeforcesHandle.
 */

import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';


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

  // Fetch firm profile and check access flags
  let firmData;
  try {
    const firmSnap = await db.collection('firms').doc(uid).get();
    if (!firmSnap.exists) {
      return res.status(401).json({ error: 'Not a firm account' });
    }
    firmData = firmSnap.data();
  } catch (err) {
    logger.error('firms', 'firm_lookup_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  // Derivation tier has no talent pool access at all
  if (firmData.tier === 'derivation') {
    logger.warn('firms', 'finalists_access_denied', {
      reqId,
      actorId: uid,
      detail: { reason: 'derivation_tier' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Talent Pool access is not included in the Derivation tier.',
    });
  }

  // finalistProfiles flag gates the entire dataset
  if (!firmData.access?.finalistProfiles) {
    logger.warn('firms', 'finalists_access_denied', {
      reqId,
      actorId: uid,
      detail: { reason: 'flag_locked' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_LOCKED',
      message: 'Finalist profiles have not been unlocked yet. Check back soon.',
    });
  }

  const { resumeDownload, linkedinAccess } = firmData.access;

  try {
    // Query registrants who have advanced past PRIOR (posterior or convergence round)
    const [posteriorSnap, convergenceSnap] = await Promise.all([
      db.collection('registrants')
        .where('round', '==', 'posterior')
        .where('dataConsent', '==', true)
        .where('status', '==', 'approved')
        .get(),
      db.collection('registrants')
        .where('round', '==', 'convergence')
        .where('dataConsent', '==', true)
        .where('status', '==', 'approved')
        .get(),
    ]);

    const allDocs = [...posteriorSnap.docs, ...convergenceSnap.docs]
      .sort((a, b) => {
        const aT = a.data().submittedAt?.toMillis?.() ?? 0;
        const bT = b.data().submittedAt?.toMillis?.() ?? 0;
        return bT - aT;
      });

    // Stub snapshot for the mapping below
    const snapshot = { docs: allDocs };

    const finalists = snapshot.docs.map((doc) => {
      const d = doc.data();
      const entry = {
        id: doc.id,
        fullName: d.fullName,
        university: d.university,
        round: d.round,
      };
      if (resumeDownload && d.resumeUrl) {
        entry.resumeUrl = d.resumeUrl;
      }
      if (linkedinAccess && d.linkedIn) {
        entry.linkedIn = d.linkedIn;
      }
      return entry;
    });

    logger.info('firms', 'finalists_fetched', {
      reqId,
      actorId: uid,
      detail: { count: finalists.length, resumeDownload: !!resumeDownload, linkedinAccess: !!linkedinAccess },
      status: 'ok',
    });
    return res.status(200).json({
      finalists,
      count: finalists.length,
      access: {
        resumeDownload: !!resumeDownload,
        linkedinAccess: !!linkedinAccess,
      },
    });
  } catch (err) {
    logger.error('firms', 'finalists_query_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
