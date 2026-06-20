/**
 * POST /api/firm/get-interests
 *
 * Returns the candidates the authenticated firm has flagged to organizers, so the
 * dashboard can show which ones already carry interest. Registrant ids are
 * re-tokenized into the same encrypted candidate tokens the tables use.
 */

import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { createFirmCandidateToken } from '../../../lib/firmCandidateToken';

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
    const firmSnap = await db.collection('firms').doc(uid).get();
    if (!firmSnap.exists) {
      return res.status(401).json({ error: 'Not a firm account' });
    }
  } catch (err) {
    logger.error('firms', 'interests_firm_lookup', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  try {
    const snap = await db.collection('firm_interest').where('firmUid', '==', uid).get();
    const interests = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        candidateId: createFirmCandidateToken(d.registrantId),
        note: d.note || '',
      };
    });
    return res.status(200).json({ interests });
  } catch (err) {
    logger.error('firms', 'interests_query', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
