import { admin, db } from '../../lib/firebaseAdmin';
import logger, { genReqId } from '../../utils/logger';
import { MAX_REGISTRATIONS } from '../../lib/constants';


let cachedCount = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CDN caches for 60s; stale-while-revalidate lets CDN serve stale for 5 more min
  // while revalidating in background — zero Firestore reads during that window.
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  const now = Date.now();
  if (cachedCount !== null && now - cacheTime < CACHE_TTL) {
    return res.status(200).json({
      count: cachedCount,
      warning: cachedCount >= 800,
      full: cachedCount >= 1000,
    });
  }

  const reqId = genReqId();
  
  try {
    // Use count() aggregate — stats/global was retired to avoid single-doc write hotspot.
    const countSnap = await db.collection('registrants').count().get();
    cachedCount = countSnap.data().count || 0;
    cacheTime = now;

    logger.info('registration', 'count_query_ok', {
      reqId,
      detail: { count: cachedCount },
      status: 'ok',
    });
    return res.status(200).json({
      count: cachedCount,
      warning: cachedCount >= MAX_REGISTRATIONS * 0.9,
      full: cachedCount >= MAX_REGISTRATIONS,
    });
  } catch (error) {
    logger.error('registration', 'count_query_error', { reqId, status: 'failed' }, error);
    // Serve stale if available rather than erroring
    if (cachedCount !== null) {
      return res.status(200).json({
        count: cachedCount,
        warning: cachedCount >= MAX_REGISTRATIONS * 0.9,
        full: cachedCount >= MAX_REGISTRATIONS,
      });
    }
    return res.status(500).json({ error: 'Failed to fetch registration count' });
  }
}
