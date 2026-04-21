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
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 500;
const BATCH_RETRY_ATTEMPTS = 3;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendBatchWithRetry(chunk, attempt = 1) {
  try {
    await resend.batch.send(chunk);
    return { sent: chunk.length, failed: 0 };
  } catch (err) {
    if (attempt < BATCH_RETRY_ATTEMPTS) {
      await delay(attempt * 1000);
      return sendBatchWithRetry(chunk, attempt + 1);
    }
    return { sent: 0, failed: chunk.length, err };
  }
}

// Disable response size limit — broadcast can take a while
export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let decoded;
  try {
    decoded = await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const handlerStart = Date.now();
  const { subject, body, roundFilter, broadcastId } = req.body;

  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Subject and body are required.' });
  }

  if (!broadcastId || typeof broadcastId !== 'string' || broadcastId.length < 8 || broadcastId.length > 64) {
    return res.status(400).json({ error: 'broadcastId required (8–64 chars).' });
  }

  const validFilters = ['all', 'prior', 'posterior', 'convergence'];
  const filter = validFilters.includes(roundFilter) ? roundFilter : 'all';

  // Idempotency guard — atomic create prevents duplicate sends from double-clicks or retries.
  // Any concurrent second request hits ALREADY_EXISTS and is rejected before any email fires.
  const lockRef = db.collection('_broadcasts').doc(broadcastId);
  try {
    await lockRef.create({
      status: 'in_progress',
      subject: subject.trim(),
      filter,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    if (err.code === 6 || /ALREADY_EXISTS/i.test(err.message || '')) {
      logger.warn('admin', 'broadcast_duplicate_blocked', {
        reqId, actorId: decoded.uid, detail: { broadcastId, subject: subject.trim() }, status: 'blocked',
      });
      return res.status(409).json({ error: 'This broadcast was already submitted.' });
    }
    logger.error('admin', 'broadcast_lock_failed', { reqId, actorId: decoded.uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Broadcast failed.' });
  }

  try {
    // Only approved registrants receive broadcasts — pending/rejected are excluded
    let q = db.collection('registrants')
      .where('status', '==', 'approved')
      .select('email', 'fullName');
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
    let emailsFailed = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const chunk = recipients.slice(i, i + BATCH_SIZE).map((r) => ({
        from: template.from,
        to: r.email,
        subject: template.subject,
        html: template.html,
      }));

      const result = await sendBatchWithRetry(chunk);
      sent += result.sent;
      emailsFailed += result.failed;

      if (result.failed > 0) {
        logger.warn('admin', 'broadcast_batch_failed', {
          reqId,
          actorId: decoded.uid,
          detail: { batchNumber, failed: result.failed, message: result.err?.message, filter },
          status: 'degraded',
        });
      } else {
        logger.info('admin', 'broadcast_batch_sent', {
          reqId,
          actorId: decoded.uid,
          detail: { batchNumber, count: result.sent, filter },
          status: 'ok',
        });
      }

      if (i + BATCH_SIZE < recipients.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    logger.info('admin', 'broadcast_complete', {
      reqId,
      actorId: decoded.uid,
      detail: { sent, emailsFailed, total: recipients.length, filter },
      status: 'ok',
      durationMs: Date.now() - handlerStart,
    });

    try {
      await db.collection('_audit_log').add({
        type: 'broadcast',
        actorId: decoded.uid,
        reqId,
        broadcastId,
        subject: subject.trim(),
        sent,
        emailsFailed,
        total: recipients.length,
        filter,
        durationMs: Date.now() - handlerStart,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditErr) {
      logger.error('admin', 'broadcast_audit_log_failed', {
        reqId, actorId: decoded.uid, detail: { broadcastId, sent, emailsFailed }, status: 'degraded',
      }, auditErr);
    }

    await lockRef.update({
      status: 'complete',
      sent,
      emailsFailed,
      total: recipients.length,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});

    return res.status(200).json({ success: true, sent, emailsFailed });
  } catch (error) {
    logger.error('admin', 'broadcast_error', { reqId, actorId: decoded.uid, detail: { broadcastId }, status: 'failed' }, error);
    await lockRef.update({
      status: 'failed',
      error: error.message?.slice(0, 500) || 'unknown',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
    return res.status(500).json({ error: 'Broadcast failed.' });
  }
}
