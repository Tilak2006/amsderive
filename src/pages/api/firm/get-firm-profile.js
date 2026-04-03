/**
 * POST /api/firm/get-firm-profile
 *
 * Verifies the firm's Firebase ID token and returns their Firestore profile.
 * Called on every firm page mount — this is the authoritative access gate.
 * Also fires a fire-and-forget lastLogin timestamp update.
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

  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const docRef = db.collection('firms').doc(uid);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Not a firm account' });
    }

    const data = snap.data();

    // Fire-and-forget lastLogin update — never blocks the response
    docRef
      .update({ lastLogin: admin.firestore.FieldValue.serverTimestamp() })
      .catch((err) => console.error('[get-firm-profile] lastLogin update failed:', err.message));

    return res.status(200).json({
      firmName: data.firmName,
      firmSlug: data.firmSlug,
      tier: data.tier,
      logoUrl: data.logoUrl || null,
      access: data.access,
    });
  } catch (err) {
    console.error('[get-firm-profile] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
