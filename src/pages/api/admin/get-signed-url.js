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

  const { fileUrl } = req.body;

  if (!fileUrl || typeof fileUrl !== 'string') {
    return res.status(400).json({ error: 'Missing fileUrl.' });
  }

  const validDomains = ['firebasestorage.googleapis.com', 'storage.googleapis.com'];
  if (!validDomains.some(d => fileUrl.includes(d))) {
    return res.status(400).json({ error: 'Invalid file URL.' });
  }

  try {
    const urlObj = new URL(fileUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) {
      return res.status(400).json({ error: 'Could not parse file path.' });
    }
    const filePath = decodeURIComponent(pathMatch[1]);

    const bucket = admin.storage().bucket();
    const [signedUrl] = await bucket.file(filePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });

    return res.status(200).json({ signedUrl });
  } catch (error) {
    console.error('[get-signed-url] Error:', error);
    return res.status(500).json({ error: 'Failed to generate signed URL.' });
  }
}   