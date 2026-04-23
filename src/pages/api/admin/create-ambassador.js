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

const ALLOWED_INSTITUTIONS = ['iitbhu', 'bitspilani', 'iitkgp'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const { institution } = req.body;

  if (!institution || !ALLOWED_INSTITUTIONS.includes(institution)) {
    return res.status(400).json({ error: 'Invalid institution. Must be one of: iitbhu, bitspilani, iitkgp' });
  }

  // Generate: amsderive2026 + 6-digit random numeric suffix
  const suffix = Math.floor(100000 + Math.random() * 900000).toString();
  const code = `amsderive2026${suffix}`;

  const INSTITUTION_LABELS = {
    iitbhu: 'IIT BHU',
    bitspilani: 'BITS Pilani',
    iitkgp: 'IIT KGP',
  };

  const docRef = db.collection('ambassadors').doc(code);

  // Ensure uniqueness (collision is astronomically unlikely but guard anyway)
  const existing = await docRef.get();
  if (existing.exists) {
    return res.status(409).json({ error: 'Code collision — please retry.' });
  }

  await docRef.set({
    code,
    institution,
    label: INSTITUTION_LABELS[institution],
    registrationCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return res.status(200).json({ success: true, code });
}
