import * as admin from 'firebase-admin';
import { requireAdmin } from '../../../lib/adminAuth';

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

  try {
    await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const { institution, offset } = req.body;

  if (
    typeof institution !== 'string' ||
    institution.trim().length === 0 ||
    institution.length > 100 ||
    // reject control characters
    /[\x00-\x1f\x7f]/.test(institution)
  ) {
    return res.status(400).json({ error: 'Invalid institution name' });
  }

  if (
    typeof offset !== 'number' ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > 1_000_000
  ) {
    return res.status(400).json({ error: 'Offset must be a non-negative integer (max 1,000,000)' });
  }

  try {
    await db.collection('stats').doc('ambassador-offsets').set(
      { [institution.trim()]: offset },
      { merge: true }
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[update-ambassador-offset] Error:', err.message);
    return res.status(500).json({ error: 'Failed to update offset.' });
  }
}
