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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const { fileUrl } = req.body;

  if (!fileUrl || typeof fileUrl !== 'string') {
    return res.status(400).json({ error: 'Missing fileUrl.' });
  }

  const validDomains = ['firebasestorage.googleapis.com', 'storage.googleapis.com'];
  let urlObj;
  try {
    urlObj = new URL(fileUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid file URL.' });
  }
  if (!validDomains.includes(urlObj.hostname)) {
    return res.status(400).json({ error: 'Invalid file URL.' });
  }

  try {
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) {
      return res.status(400).json({ error: 'Could not parse file path.' });
    }
    // decodeURIComponent only the path segment — strip query params first
    const filePath = decodeURIComponent(pathMatch[1].split('?')[0]);

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