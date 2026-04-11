import * as admin from 'firebase-admin';
import { resend } from '../../../lib/resend';
import { broadcastEmail } from '../../../emails/templates';
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
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Disable response size limit — broadcast can take a while
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
  const { subject, body, roundFilter } = req.body;

  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Subject and body are required.' });
  }

  const validFilters = ['all', 'prior', 'posterior', 'convergence'];
  const filter = validFilters.includes(roundFilter) ? roundFilter : 'all';

  try {
    // Only fetch email + fullName fields to keep the payload lean
    let q = db.collection('registrants').select('email', 'fullName');
    if (filter !== 'all') {
      q = q.where('round', '==', filter);
    }
    const snapshot = await q.get();

    if (snapshot.empty) {
      return res.status(200).json({ success: true, sent: 0 });
    }

    const recipients = snapshot.docs
      .map((d) => ({ email: d.data().email, fullName: d.data().fullName }))
      .filter((r) => r.email);

    const template = broadcastEmail({ subject: subject.trim(), body: body.trim() });
    let sent = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE).map((r) => ({
        from: template.from,
        to: r.email,
        subject: template.subject,
        html: template.html,
      }));

      try {
        await resend.batch.send(chunk);
        sent += chunk.length;
        logger.info('admin', 'broadcast_batch_sent', {
          reqId,
          actorId: 'admin',
          detail: { batchNumber: Math.floor(i / BATCH_SIZE) + 1, count: chunk.length, filter },
          status: 'ok',
        });
      } catch (batchErr) {
        logger.warn('admin', 'broadcast_batch_failed', {
          reqId,
          actorId: 'admin',
          detail: { batchNumber: Math.floor(i / BATCH_SIZE) + 1, message: batchErr.message, filter },
          status: 'degraded',
        });
      }

      // Delay between batches to respect rate limits (skip after final batch)
      if (i + BATCH_SIZE < recipients.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    logger.info('admin', 'broadcast_complete', {
      reqId,
      actorId: 'admin',
      detail: { sent, total: recipients.length, filter },
      status: 'ok',
      durationMs: Date.now() - handlerStart,
    });
    return res.status(200).json({ success: true, sent });
  } catch (error) {
    logger.error('admin', 'broadcast_error', { reqId, actorId: 'admin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Broadcast failed.' });
  }
}
