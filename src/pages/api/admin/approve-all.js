import * as admin from 'firebase-admin';
import { resend } from '../../../lib/resend';
import { statusUpdateEmail } from '../../../emails/templates';
import logger, { genReqId } from '../../../utils/logger';
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
const FIRESTORE_CHUNK = 500; // Firestore batch write limit
const EMAIL_CHUNK = 100;     // Resend batch send limit
const EMAIL_DELAY_MS = 200;  // Delay between email batches

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const handlerStart = Date.now();

  try {
    // 1. Fetch all pending registrants (email + fullName only for efficiency)
    const snapshot = await db
      .collection('registrants')
      .where('status', '==', 'pending')
      .select('email', 'fullName')
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ success: true, approved: 0, emailsSent: 0 });
    }

    const pending = snapshot.docs.map((d) => ({
      id: d.id,
      email: d.data().email,
      fullName: d.data().fullName,
    }));

    // 2. Firestore batch updates — committed before any emails are sent
    for (let i = 0; i < pending.length; i += FIRESTORE_CHUNK) {
      const batch = db.batch();
      for (const reg of pending.slice(i, i + FIRESTORE_CHUNK)) {
        batch.update(db.collection('registrants').doc(reg.id), {
          status: 'approved',
          statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      logger.info('admin', 'bulk_approve_db_batch_committed', {
        reqId,
        actorId: 'admin',
        detail: { batchNumber: Math.floor(i / FIRESTORE_CHUNK) + 1, count: pending.slice(i, i + FIRESTORE_CHUNK).length },
        status: 'ok',
      });
    }

    // 3. Send approval emails in batches — failures are logged, not fatal
    let emailsSent = 0;
    for (let i = 0; i < pending.length; i += EMAIL_CHUNK) {
      const chunk = pending.slice(i, i + EMAIL_CHUNK).map((r) => {
        const { from, subject, html } = statusUpdateEmail({ fullName: r.fullName, status: 'approved' });
        return { from, to: r.email, subject, html };
      });

      try {
        await resend.batch.send(chunk);
        emailsSent += chunk.length;
        logger.info('admin', 'bulk_approve_email_batch_sent', {
          reqId,
          actorId: 'admin',
          detail: { batchNumber: Math.floor(i / EMAIL_CHUNK) + 1, count: chunk.length },
          status: 'ok',
        });
      } catch (err) {
        logger.warn('admin', 'bulk_approve_email_batch_failed', {
          reqId,
          actorId: 'admin',
          detail: { batchNumber: Math.floor(i / EMAIL_CHUNK) + 1, message: err.message },
          status: 'degraded',
        });
      }

      if (i + EMAIL_CHUNK < pending.length) {
        await delay(EMAIL_DELAY_MS);
      }
    }

    logger.info('admin', 'bulk_approve_complete', {
      reqId,
      actorId: 'admin',
      detail: { approved: pending.length, emailsSent },
      status: 'ok',
      durationMs: Date.now() - handlerStart,
    });
    return res.status(200).json({ success: true, approved: pending.length, emailsSent });
  } catch (error) {
    logger.error('admin', 'bulk_approve_error', { reqId, actorId: 'admin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Bulk approval failed.' });
  }
}
