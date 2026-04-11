import * as admin from 'firebase-admin';
import { resend } from '../../../lib/resend';
import { statusUpdateEmail } from '../../../emails/templates';
import logger, { genReqId, maskEmail } from '../../../utils/logger';

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
const VALID_STATUSES = ['approved', 'rejected'];

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

  const reqId = genReqId();
  const { docId, status } = req.body;

  if (!docId || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid docId.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected".' });
  }

  try {
    const docRef = db.collection('registrants').doc(docId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Registrant not found.' });
    }

    const data = snap.data();

    // Idempotency — same status already set, nothing to do
    if (data.status === status) {
      return res.status(200).json({ success: true, skipped: true });
    }

    // Update Firestore
    await docRef.update({
      status,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('admin', 'status_updated', {
      reqId,
      entityId: docId,
      actorId: 'admin',
      detail: { newStatus: status },
      status: 'ok',
    });

    // Send email — failure must NOT fail the API response
    try {
      const { from, subject, html } = statusUpdateEmail({ fullName: data.fullName, status });
      await resend.emails.send({ from, to: data.email, subject, html });
      logger.info('admin', 'status_update_email_sent', {
        reqId,
        entityId: docId,
        actorId: 'admin',
        detail: { emailMasked: maskEmail(data.email), newStatus: status },
        status: 'ok',
      });
    } catch (emailErr) {
      logger.warn('admin', 'status_update_email_failed', {
        reqId,
        entityId: docId,
        actorId: 'admin',
        detail: { emailMasked: maskEmail(data.email), newStatus: status, message: emailErr.message },
        status: 'degraded',
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('admin', 'status_update_error', { reqId, entityId: docId, actorId: 'admin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
}
