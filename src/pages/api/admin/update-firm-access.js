/**
 * POST /api/admin/update-firm-access
 *
 * Toggles a single access flag on a firm's Firestore document.
 * Uses Firestore dot-notation to update only the specific nested field.
 * Admin auth required.
 *
 * Body: { uid: string, flag: string, value: boolean }
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

const VALID_FLAGS = [
  'leaderboard',
  'analytics',
  'finalistProfiles',
  'resumeDownload',
  'linkedinAccess',
  'psCoDesign',
  'namingRights',
];

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

  const { uid, flag, value } = req.body;

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid uid' });
  }
  if (!flag || !VALID_FLAGS.includes(flag)) {
    return res.status(400).json({ error: `Invalid flag. Must be one of: ${VALID_FLAGS.join(', ')}` });
  }
  if (typeof value !== 'boolean') {
    return res.status(400).json({ error: 'value must be a boolean' });
  }

  try {
    await db.collection('firms').doc(uid).update({
      [`access.${flag}`]: value,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[update-firm-access] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
