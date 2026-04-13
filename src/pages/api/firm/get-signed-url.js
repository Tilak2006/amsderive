/**
 * POST /api/firm/get-signed-url
 *
 * Generates a 15-minute signed URL for a registrant file (resume/transcript).
 * Requires the firm to have resumeDownload access enabled.
 */

import * as admin from 'firebase-admin';
import logger, { genReqId } from '../../../utils/logger';

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

  const reqId = genReqId();

  // Verify firm exists and has resumeDownload access
  let firmData;
  try {
    const firmSnap = await db.collection('firms').doc(uid).get();
    if (!firmSnap.exists) {
      return res.status(401).json({ error: 'Not a firm account' });
    }
    firmData = firmSnap.data();
  } catch (err) {
    logger.error('firms', 'firm_lookup_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (!firmData.access?.resumeDownload) {
    logger.warn('firms', 'signed_url_access_denied', {
      reqId,
      actorId: uid,
      detail: { reason: 'no_resume_download' },
      status: 'blocked',
    });
    return res.status(403).json({ error: 'Resume download access not enabled for this account.' });
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
    const filePath = decodeURIComponent(pathMatch[1].split('?')[0]);

    // Only allow files under the registrants/ folder
    if (!filePath.startsWith('registrants/')) {
      return res.status(400).json({ error: 'Invalid file path.' });
    }

    const bucket = admin.storage().bucket();
    const [signedUrl] = await bucket.file(filePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });

    logger.info('firms', 'signed_url_generated', {
      reqId,
      actorId: uid,
      detail: { filePath },
      status: 'ok',
    });
    return res.status(200).json({ signedUrl });
  } catch (err) {
    logger.error('firms', 'signed_url_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Failed to generate signed URL.' });
  }
}
