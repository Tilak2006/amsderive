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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check — verify Firebase ID token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const ref = db.collection('registrants');
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(now.getTime() + istOffset);
    todayIST.setUTCHours(0, 0, 0, 0);
    const todayUTC = new Date(todayIST.getTime() - istOffset);

    const [totalSnap, consentSnap, pendingSnap, todaySnap] = await Promise.all([
      ref.count().get(),
      ref.where('dataConsent', '==', true).count().get(),
      ref.where('status', '==', 'pending').count().get(),
      ref.where('submittedAt', '>=', admin.firestore.Timestamp.fromDate(todayUTC)).count().get(),
    ]);

    return res.status(200).json({
      total: totalSnap.data().count,
      consentGiven: consentSnap.data().count,
      pending: pendingSnap.data().count,
      today: todaySnap.data().count,
    });
  } catch (error) {
    console.error('[get-stats] Error:', error);
    return res.status(500).json({ total: 0, consentGiven: 0, pending: 0, today: 0 });
  }
}
