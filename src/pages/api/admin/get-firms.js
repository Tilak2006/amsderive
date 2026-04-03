/**
 * POST /api/admin/get-firms
 *
 * Returns all firm accounts ordered by creation date (newest first).
 * Admin auth required.
 */

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
    const snapshot = await db.collection('firms').orderBy('createdAt', 'desc').get();
    const firms = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        firmName: d.firmName,
        firmSlug: d.firmSlug,
        tier: d.tier,
        primaryEmail: d.primaryEmail,
        logoUrl: d.logoUrl || null,
        access: d.access,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        lastLogin: d.lastLogin?.toDate?.()?.toISOString() || null,
        notes: d.notes || null,
      };
    });

    return res.status(200).json({ firms });
  } catch (err) {
    console.error('[get-firms] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
