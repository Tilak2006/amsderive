import * as admin from 'firebase-admin';

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

let cachedCount = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();
  if (cachedCount !== null && now - cacheTime < CACHE_TTL) {
    return res.status(200).json({
      count: cachedCount,
      warning: cachedCount >= 2000,
      full: cachedCount >= 3000,
    });
  }

  try {
    const snapshot = await db.collection('registrants').count().get();
    cachedCount = snapshot.data().count;
    cacheTime = now;

    return res.status(200).json({
      count: cachedCount,
      warning: cachedCount >= 2000,
      full: cachedCount >= 3000,
    });
  } catch (error) {
    console.error('[registration-count] Error fetching count:', error);
    return res.status(500).json({ error: 'Failed to fetch registration count' });
  }
}
