import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';


// 2-minute in-process cache — admin stats don't need sub-minute freshness.
// Dashboard polls every 5 min anyway, so this just prevents burst reads.
let cachedStats = null;
let cacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000;

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

  // Serve from cache if fresh
  if (cachedStats && Date.now() - cacheTime < CACHE_TTL) {
    return res.status(200).json(cachedStats);
  }

  try {
    const ref = db.collection('registrants');
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(now.getTime() + istOffset);
    todayIST.setUTCHours(0, 0, 0, 0);
    const todayUTC = new Date(todayIST.getTime() - istOffset);

    const [totalSnap, consentSnap, todaySnap, approvedSnap, bouncedSnap] = await Promise.all([
      ref.count().get(),
      ref.where('dataConsent', '==', true).count().get(),
      ref.where('submittedAt', '>=', admin.firestore.Timestamp.fromDate(todayUTC)).count().get(),
      ref.where('status', '==', 'approved').count().get(),
      ref.where('deliveryStatus', '==', 'bounced').count().get(),
    ]);

    cachedStats = {
      total: totalSnap.data().count,
      consentGiven: consentSnap.data().count,
      today: todaySnap.data().count,
      approved: approvedSnap.data().count,
      bounced: bouncedSnap.data().count,
    };
    cacheTime = Date.now();

    logger.info('admin', 'stats_fetched', {
      actorId: decoded.uid,
      detail: { total: cachedStats.total, today: cachedStats.today, fromCache: false },
      status: 'ok',
    });
    return res.status(200).json(cachedStats);
  } catch (error) {
    logger.error('admin', 'stats_fetch_error', { actorId: decoded.uid, status: 'failed' }, error);
    // Return stale if available
    if (cachedStats) return res.status(200).json(cachedStats);
    return res.status(500).json({ total: 0, consentGiven: 0, today: 0 });
  }
}
