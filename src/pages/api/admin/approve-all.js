import { admin, db } from '../../../lib/firebaseAdmin';
import { resend } from '../../../lib/resend';
import { statusUpdateEmail } from '../../../emails/templates';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';

const FIRESTORE_CHUNK = 500; // Firestore batch write limit
const EMAIL_CHUNK = 100;     // Resend batch send limit
const EMAIL_DELAY_MS = 200;  // Delay between email batches
const EMAIL_RETRY_ATTEMPTS = 3;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendBatchWithRetry(chunk, attempt = 1) {
  try {
    await resend.batch.send(chunk);
    return { sent: chunk.length, failed: 0 };
  } catch (err) {
    if (attempt < EMAIL_RETRY_ATTEMPTS) {
      await delay(attempt * 1000); // 1s, 2s backoff
      return sendBatchWithRetry(chunk, attempt + 1);
    }
    return { sent: 0, failed: chunk.length, err };
  }
}

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

  try {
    // 1. Fetch all registrants not yet approved or rejected.
    //    Docs created before status field was added have no status field —
    //    Firestore equality queries exclude them, so we fetch all and filter in code.
    const snapshot = await db
      .collection('registrants')
      .select('email', 'fullName', 'status')
      .get();

    const pending = snapshot.docs
      .filter((d) => {
        const s = d.data().status;
        return !s || s === 'pending';
      })
      .map((d) => ({
        id: d.id,
        email: d.data().email,
        fullName: d.data().fullName,
      }));

    if (pending.length === 0) {
      return res.status(200).json({ success: true, approved: 0, emailsSent: 0, emailsFailed: 0 });
    }

    // Send emails FIRST, chunk by chunk. Only approve rows whose email landed.
    // A batch.send is all-or-nothing from Resend's side — a thrown error means
    // the entire chunk failed, so none of those rows get approved.
    const approvedIds = [];
    let emailsSent = 0;
    let emailsFailed = 0;
    const failedBatches = [];

    for (let i = 0; i < pending.length; i += EMAIL_CHUNK) {
      const chunkRegs = pending.slice(i, i + EMAIL_CHUNK);
      const chunk = chunkRegs.map((r) => {
        const { from, subject, html } = statusUpdateEmail({ fullName: r.fullName, status: 'approved' });
        return { from, to: r.email, subject, html };
      });

      const batchNumber = Math.floor(i / EMAIL_CHUNK) + 1;
      const result = await sendBatchWithRetry(chunk);
      emailsSent += result.sent;
      emailsFailed += result.failed;

      if (result.failed > 0) {
        failedBatches.push(batchNumber);
        logger.warn('admin', 'bulk_approve_email_batch_failed', {
          reqId,
          actorId: decoded.uid,
          detail: { batchNumber, failed: result.failed, message: result.err?.message, skippingDbUpdate: true },
          status: 'degraded',
        });
      } else {
        approvedIds.push(...chunkRegs.map((r) => r.id));
        logger.info('admin', 'bulk_approve_email_batch_sent', {
          reqId,
          actorId: decoded.uid,
          detail: { batchNumber, count: result.sent },
          status: 'ok',
        });
      }

      if (i + EMAIL_CHUNK < pending.length) {
        await delay(EMAIL_DELAY_MS);
      }
    }

    // Now flip Firestore only for rows whose email actually sent.
    for (let i = 0; i < approvedIds.length; i += FIRESTORE_CHUNK) {
      const batch = db.batch();
      for (const id of approvedIds.slice(i, i + FIRESTORE_CHUNK)) {
        batch.update(db.collection('registrants').doc(id), {
          status: 'approved',
          statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      logger.info('admin', 'bulk_approve_db_batch_committed', {
        reqId,
        actorId: decoded.uid,
        detail: { batchNumber: Math.floor(i / FIRESTORE_CHUNK) + 1, count: approvedIds.slice(i, i + FIRESTORE_CHUNK).length },
        status: 'ok',
      });
    }

    logger.info('admin', 'bulk_approve_complete', {
      reqId,
      actorId: decoded.uid,
      detail: { approved: approvedIds.length, emailsSent, emailsFailed, pendingTotal: pending.length, failedBatches },
      status: 'ok',
      durationMs: Date.now() - handlerStart,
    });

    try {
      await db.collection('_audit_log').add({
        type: 'approve_all',
        actorId: decoded.uid,
        reqId,
        approved: approvedIds.length,
        emailsSent,
        emailsFailed,
        skipped: pending.length - approvedIds.length,
        pendingTotal: pending.length,
        failedBatches,
        durationMs: Date.now() - handlerStart,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch { /* audit log must never fail the main path */ }

    return res.status(200).json({
      success: true,
      approved: approvedIds.length,
      emailsSent,
      emailsFailed,
      skipped: pending.length - approvedIds.length,
    });
  } catch (error) {
    logger.error('admin', 'bulk_approve_error', { reqId, actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Bulk approval failed.' });
  }
}
