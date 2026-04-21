import * as admin from 'firebase-admin';
import logger, { genReqId } from '../../../utils/logger';
import { requireSubadmin } from '../../../lib/subadminAuth';

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

let cachedStats = null;
let cacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireSubadmin(req, admin.auth(), db);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  if (cachedStats && Date.now() - cacheTime < CACHE_TTL) {
    return res.status(200).json(cachedStats);
  }

  const reqId = genReqId();

  try {
    const ref = db.collection('registrants');
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(now.getTime() + istOffset);
    todayIST.setUTCHours(0, 0, 0, 0);
    const todayUTC = new Date(todayIST.getTime() - istOffset);

    const [totalSnap, consentSnap, todaySnap, approvedSnap] = await Promise.all([
      ref.count().get(),
      ref.where('dataConsent', '==', true).count().get(),
      ref.where('submittedAt', '>=', admin.firestore.Timestamp.fromDate(todayUTC)).count().get(),
      ref.where('status', '==', 'approved').count().get(),
    ]);

    cachedStats = {
      total: totalSnap.data().count,
      consentGiven: consentSnap.data().count,
      today: todaySnap.data().count,
      approved: approvedSnap.data().count,
    };
    cacheTime = Date.now();

    logger.info('subadmin', 'stats_fetched', {
      reqId,
      actorId: 'subadmin',
      detail: { total: cachedStats.total, today: cachedStats.today },
      status: 'ok',
    });
    return res.status(200).json(cachedStats);
  } catch (error) {
    logger.error('subadmin', 'stats_fetch_error', { reqId, actorId: 'subadmin', status: 'failed' }, error);
    if (cachedStats) return res.status(200).json(cachedStats);
    return res.status(500).json({ total: 0, consentGiven: 0, today: 0, approved: 0 });
  }
}
