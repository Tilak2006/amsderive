import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const MAX_REGISTRATIONS = 2500;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, codeforcesHandle } = req.body;

  // Validate inputs
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ allowed: false, error: 'Invalid email.' });
  }
  if (!codeforcesHandle || typeof codeforcesHandle !== 'string') {
    return res.status(400).json({ allowed: false, error: 'Invalid Codeforces handle.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedHandle = codeforcesHandle.trim();

  // Validate formats
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ allowed: false, error: 'Invalid email format.' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(normalizedHandle) || normalizedHandle.length > 24) {
    return res.status(400).json({ allowed: false, error: 'Invalid Codeforces handle format.' });
  }

  try {
    const registrantsRef = db.collection('registrants');

    // Cap check + duplicate check in parallel
    const [countSnap, emailSnap, cfSnap] = await Promise.all([
      registrantsRef.count().get(),
      registrantsRef.where('emailLower', '==', normalizedEmail).limit(1).get(),
      registrantsRef.where('codeforcesHandle', '==', normalizedHandle).limit(1).get(),
    ]);

    // Cap check
    if (countSnap.data().count >= MAX_REGISTRATIONS) {
      return res.status(200).json({ allowed: false, error: 'Registrations are now closed.' });
    }

    // Duplicate checks
    if (!emailSnap.empty) {
      return res.status(200).json({ allowed: false, error: 'This email is already registered.' });
    }
    if (!cfSnap.empty) {
      return res.status(200).json({ allowed: false, error: 'This Codeforces handle is already registered.' });
    }

    return res.status(200).json({ allowed: true });
  } catch (error) {
    console.error('[check-registration] Error:', error);
    return res.status(500).json({ allowed: false, error: 'Failed to verify registration. Please try again.' });
  }
}
