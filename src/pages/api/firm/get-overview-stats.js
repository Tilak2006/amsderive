/**
 * POST /api/firm/get-overview-stats
 *
 * Returns lightweight overview metrics for the firm dashboard:
 *   - total: total approved registrant count
 *   - newThisWeek: approved registrants submitted in the last 7 days
 *   - recentNames: last 3 approved registrant full names (newest first)
 *   - sparkline: approved registrant counts per week for last 8 weeks (oldest first)
 *
 * Requires registrantProfiles access flag (derivation tier always gets 403).
 * Cached in-memory for 60 seconds to avoid hammering Firestore on every overview load.
 */

import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';


let cache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000;

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
    logger.error('firms', 'overview_stats_firm_lookup', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (firmData.tier === 'derivation') {
    return res.status(403).json({ error: 'ACCESS_DENIED' });
  }

  if (!firmData.access?.registrantProfiles) {
    return res.status(403).json({ error: 'ACCESS_LOCKED' });
  }

  // Serve from cache if fresh
  const now = Date.now();
  if (cache !== null && now - cacheTime < CACHE_TTL) {
    return res.status(200).json(cache);
  }

  try {
    const snapshot = await db
      .collection('registrants')
      .where('status', '==', 'approved')
      .where('dataConsent', '==', true)
      .get();

    const docs = snapshot.docs
      .map((doc) => ({
        fullName: doc.data().fullName,
        submittedAt: doc.data().submittedAt?.toDate?.() ?? null,
      }))
      .filter((d) => d.submittedAt !== null)
      .sort((a, b) => b.submittedAt - a.submittedAt);

    const total = docs.length;

    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = docs.filter((d) => d.submittedAt >= weekAgo).length;

    const recentNames = docs.slice(0, 3).map((d) => d.fullName);

    // 8-week sparkline: bucket counts by calendar week (Mon–Sun), oldest first
    const sparkline = Array(8).fill(0);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(now - 8 * msPerWeek);
    docs.forEach(({ submittedAt }) => {
      if (submittedAt < cutoff) return;
      const weeksAgo = Math.floor((now - submittedAt.getTime()) / msPerWeek);
      const idx = 7 - Math.min(weeksAgo, 7);
      sparkline[idx] = (sparkline[idx] || 0) + 1;
    });

    const result = { total, newThisWeek, recentNames, sparkline };
    cache = result;
    cacheTime = now;

    logger.info('firms', 'overview_stats_fetched', {
      reqId, actorId: uid, detail: { total, newThisWeek }, status: 'ok',
    });
    return res.status(200).json(result);
  } catch (err) {
    logger.error('firms', 'overview_stats_query', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
