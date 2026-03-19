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
    const snapshot = await db.collection('registrants')
      .orderBy('submittedAt', 'desc')
      .get();

    const registrants = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        fullName: data.fullName || '',
        email: data.email || '',
        university: data.university || '',
        codeforcesHandle: data.codeforcesHandle || '',
        codechefHandle: data.codechefHandle || '',
        linkedIn: data.linkedIn || '',
        gitHub: data.gitHub || '',
        dataConsent: data.dataConsent ? 'Yes' : 'No',
        submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : '',
      };
    });

    return res.status(200).json({ registrants });
  } catch (error) {
    console.error('[export-registrants] Error:', error);
    return res.status(500).json({ error: 'Failed to export registrants.' });
  }
}
