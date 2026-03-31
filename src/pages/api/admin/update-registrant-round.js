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
const VALID_ROUNDS = ['prior', 'posterior', 'convergence'];

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

  const { docId, round } = req.body;

  if (!docId || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid docId.' });
  }
  if (!VALID_ROUNDS.includes(round)) {
    return res.status(400).json({ error: 'Invalid round. Must be "prior", "posterior", or "convergence".' });
  }

  try {
    const docRef = db.collection('registrants').doc(docId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Registrant not found.' });
    }

    // Idempotency — same round already set, nothing to do
    if (snap.data().round === round) {
      return res.status(200).json({ success: true, skipped: true });
    }

    await docRef.update({
      round,
      roundUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.info(`[update-registrant-round] ${docId} → ${round}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[update-registrant-round] Error:', error);
    return res.status(500).json({ error: 'Failed to update round.' });
  }
}
