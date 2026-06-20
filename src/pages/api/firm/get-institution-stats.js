/**
 * POST /api/firm/get-institution-stats
 *
 * Returns institution analytics for the firm dashboard using only talent pool
 * candidates: approved, data-consented, and advanced past PRIOR.
 */

import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';

function normalizeInstitution(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

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

  let firmData;
  try {
    const firmSnap = await db.collection('firms').doc(uid).get();
    if (!firmSnap.exists) return res.status(401).json({ error: 'Not a firm account' });
    firmData = firmSnap.data();
  } catch (err) {
    logger.error('firms', 'institution_stats_firm_lookup', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (!firmData.access?.analytics) {
    return res.status(403).json({ error: 'ACCESS_DENIED' });
  }

  try {
    const [posteriorSnap, convergenceSnap] = await Promise.all([
      db.collection('registrants')
        .where('round', '==', 'posterior')
        .where('status', '==', 'approved')
        .where('dataConsent', '==', true)
        .select('university', 'graduationYear', 'branch')
        .get(),
      db.collection('registrants')
        .where('round', '==', 'convergence')
        .where('status', '==', 'approved')
        .where('dataConsent', '==', true)
        .select('university', 'graduationYear', 'branch')
        .get(),
    ]);

    const counts = new Map();
    const gradYearCounts = new Map();
    const branchCounts = new Map();
    const docs = [...posteriorSnap.docs, ...convergenceSnap.docs];

    docs.forEach((doc) => {
      const data = doc.data();

      const name = normalizeInstitution(data.university);
      if (name) {
        const key = name.toLowerCase();
        const existing = counts.get(key);
        if (existing) existing.count += 1;
        else counts.set(key, { name, count: 1 });
      }

      const year = Number(data.graduationYear);
      if (Number.isInteger(year) && year > 0) {
        gradYearCounts.set(year, (gradYearCounts.get(year) || 0) + 1);
      }

      const branch = normalizeInstitution(data.branch);
      if (branch) {
        const key = branch.toLowerCase();
        const existing = branchCounts.get(key);
        if (existing) existing.count += 1;
        else branchCounts.set(key, { name: branch, count: 1 });
      }
    });

    const institutions = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    const gradYears = Array.from(gradYearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);
    const branches = Array.from(branchCounts.values()).sort((a, b) => b.count - a.count);

    logger.info('firms', 'institution_stats_fetched', {
      reqId,
      actorId: uid,
      detail: { institutions: institutions.length, gradYears: gradYears.length, branches: branches.length, talentPool: docs.length },
      status: 'ok',
    });

    return res.status(200).json({ institutions, gradYears, branches });
  } catch (err) {
    logger.error('firms', 'institution_stats_query', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
