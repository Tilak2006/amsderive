import { admin, db } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { statusUpdateEmail } from '../../../emails/templates';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';
import { sendEmailBatchWithRetry } from '../../../lib/emailSender';

const FIRESTORE_CHUNK = 450;
const EMAIL_CHUNK = 100;
const STALE_APPROVAL_MS = 10 * 60 * 1000;
const PROCESSING_LEASE_MS = 6 * 60 * 1000;
const CLAIM_STATUS_ORDER = ['email_sent', 'queued', 'failed'];

function shortHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
}

function isDuplicateCreate(err) {
  return err?.code === 6 || /ALREADY_EXISTS/i.test(err?.message || '');
}

async function writeApprovalQueue(queueRef, pending) {
  for (let i = 0; i < pending.length; i += FIRESTORE_CHUNK) {
    const batch = db.batch();
    pending.slice(i, i + FIRESTORE_CHUNK).forEach((r, idx) => {
      batch.create(queueRef.doc(r.id), {
        registrantId: r.id,
        email: r.email,
        fullName: r.fullName || '',
        status: 'queued',
        attemptCount: 0,
        sortKey: i + idx,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }
}

async function initializeRun({ runRef, queueRef, runId, decoded, reqId }) {
  const existingRun = await runRef.get();
  if (existingRun.exists) return false;

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
    }))
    .filter((r) => r.email);

  try {
    await runRef.create({
      status: pending.length === 0 ? 'complete' : 'initializing',
      total: pending.length,
      approved: 0,
      emailsSent: 0,
      emailsFailed: 0,
      startedBy: decoded.uid,
      reqId,
      runId,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(pending.length === 0 ? { completedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
    });
  } catch (err) {
    if (isDuplicateCreate(err)) return false;
    throw err;
  }

  if (pending.length > 0) {
    await writeApprovalQueue(queueRef, pending);
    await runRef.update({
      status: 'in_progress',
      queuedCount: pending.length,
      queueReadyAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return true;
}

async function approvalStats(queueRef) {
  const countFor = async (query) => {
    const snap = await query.count().get();
    return snap.data().count || 0;
  };

  const [total, queued, sending, emailSent, sent, failed] = await Promise.all([
    countFor(queueRef),
    countFor(queueRef.where('status', '==', 'queued')),
    countFor(queueRef.where('status', '==', 'sending')),
    countFor(queueRef.where('status', '==', 'email_sent')),
    countFor(queueRef.where('status', '==', 'sent')),
    countFor(queueRef.where('status', '==', 'failed')),
  ]);

  const stats = {
    total,
    queued,
    sending,
    email_sent: emailSent,
    sent,
    failed,
    processed: 0,
    remaining: 0,
  };

  stats.emailAccepted = stats.sent + stats.email_sent;
  stats.processed = stats.sent + stats.email_sent + stats.failed;
  stats.remaining = stats.queued + stats.failed + stats.sending + stats.email_sent;
  return stats;
}

async function resetStaleApprovals(queueRef) {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - STALE_APPROVAL_MS);
  const snap = await queueRef
    .where('status', '==', 'sending')
    .limit(FIRESTORE_CHUNK)
    .get();
  const stale = snap.docs
    .map((doc) => ({ ref: doc.ref, data: doc.data() }))
    .filter(({ data }) => {
      const lastAttemptMs = data.lastAttemptAt?.toMillis ? data.lastAttemptAt.toMillis() : 0;
      return lastAttemptMs > 0 && lastAttemptMs < cutoff.toMillis();
    });

  if (stale.length > 0) {
    await updateQueue(stale, {
      status: 'failed',
      error: 'Approval attempt became stale before completion. Retry may be needed.',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return stale.length;
}

async function claimQueueDocs(queueRef, limit) {
  const docs = [];
  for (const status of CLAIM_STATUS_ORDER) {
    if (docs.length >= limit) break;
    const snap = await queueRef
      .where('status', '==', status)
      .limit(limit - docs.length)
      .get();
    docs.push(...snap.docs);
  }
  return docs.sort((a, b) => Number(a.data().sortKey || 0) - Number(b.data().sortKey || 0));
}

async function acquireProcessingLease(runRef, leaseId) {
  const now = Date.now();
  const leaseUntil = admin.firestore.Timestamp.fromMillis(now + PROCESSING_LEASE_MS);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(runRef);
    if (!snap.exists) return false;
    const data = snap.data() || {};
    const currentLeaseUntil = data.processingLeaseUntil?.toMillis ? data.processingLeaseUntil.toMillis() : 0;
    const currentLeaseId = data.processingLeaseId || null;
    if (currentLeaseUntil > now && currentLeaseId && currentLeaseId !== leaseId) {
      return false;
    }
    tx.update(runRef, {
      processingLeaseId: leaseId,
      processingLeaseUntil: leaseUntil,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  });
}

async function releaseProcessingLease(runRef, leaseId) {
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(runRef);
      if (!snap.exists) return;
      const data = snap.data() || {};
      if (data.processingLeaseId !== leaseId) return;
      tx.update(runRef, {
        processingLeaseId: admin.firestore.FieldValue.delete(),
        processingLeaseUntil: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch {
    // Lease expiry is the fallback if cleanup fails.
  }
}

async function updateQueue(items, update) {
  for (let i = 0; i < items.length; i += FIRESTORE_CHUNK) {
    const batch = db.batch();
    items.slice(i, i + FIRESTORE_CHUNK).forEach(({ ref }) => batch.update(ref, update));
    await batch.commit();
  }
}

async function mergeQueue(items, update) {
  for (let i = 0; i < items.length; i += FIRESTORE_CHUNK) {
    const batch = db.batch();
    items.slice(i, i + FIRESTORE_CHUNK).forEach(({ ref }) => batch.set(ref, update, { merge: true }));
    await batch.commit();
  }
}

async function markQueueEmailAccepted(items, update) {
  try {
    await mergeQueue(items, update);
    return { marked: items.length, failed: 0 };
  } catch {
    let marked = 0;
    let failed = 0;
    await Promise.all(items.map(async ({ ref }) => {
      try {
        await ref.set(update, { merge: true });
        marked += 1;
      } catch {
        failed += 1;
      }
    }));
    return { marked, failed };
  }
}

async function completeIfDone({ runRef, queueRef, decoded, reqId, handlerStart }) {
  const stats = await approvalStats(queueRef);
  const done = stats.queued === 0 && stats.failed === 0 && stats.sending === 0 && stats.email_sent === 0;

  await runRef.update({
    status: done ? 'complete' : 'in_progress',
    total: stats.total,
    approved: stats.sent,
    emailsSent: stats.emailAccepted,
    emailsFailed: stats.failed,
    dbPending: stats.email_sent,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(done ? { completedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
  });

  const runSnap = await runRef.get().catch(() => null);
  const runData = runSnap?.data() || {};
  if (done && runData.auditLogged !== true) {
    await db.collection('_audit_log').add({
      type: 'approve_all',
      actorId: decoded.uid,
      reqId,
      approved: stats.sent,
      emailsSent: stats.emailAccepted,
      emailsFailed: stats.failed,
      dbPending: stats.email_sent,
      skipped: stats.total - stats.sent,
      pendingTotal: stats.total,
      durationMs: Date.now() - handlerStart,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
    await runRef.update({ auditLogged: true }).catch(() => {});
  }

  return { ...stats, done };
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
  const { runId, batchSize } = req.body || {};

  if (!runId || typeof runId !== 'string' || runId.length < 8 || runId.length > 64) {
    return res.status(400).json({ error: 'runId required (8-64 chars).' });
  }

  const parsedBatchSize = Number(batchSize ?? EMAIL_CHUNK);
  if (!Number.isInteger(parsedBatchSize) || parsedBatchSize < 1) {
    return res.status(400).json({ error: 'batchSize must be a positive integer.' });
  }
  const resolvedBatchSize = Math.min(parsedBatchSize, EMAIL_CHUNK);
  const runRef = db.collection('_bulk_approvals').doc(runId);
  const queueRef = runRef.collection('recipients');
  let activeLeaseId = null;

  try {
    await initializeRun({ runRef, queueRef, runId, decoded, reqId });

    const runSnap = await runRef.get();
    const runData = runSnap.data() || {};
    if (runData.status === 'initializing') {
      return res.status(409).json({ error: 'Approval queue is still being prepared. Try again in a moment.' });
    }

    const staleReset = await resetStaleApprovals(queueRef);
    if (staleReset > 0) {
      await runRef.update({
        status: 'paused',
        error: `${staleReset} stale approval row(s) were marked retryable.`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {});
    }

    const preStats = await approvalStats(queueRef);
    if (preStats.total === 0 || (preStats.queued === 0 && preStats.failed === 0 && preStats.sending === 0 && preStats.email_sent === 0)) {
      const finalStats = await completeIfDone({ runRef, queueRef, decoded, reqId, handlerStart });
      return res.status(200).json({
        success: true,
        approved: finalStats.sent,
        emailsSent: finalStats.emailAccepted,
        emailsFailed: finalStats.failed,
        dbPending: finalStats.email_sent,
        skipped: finalStats.total - finalStats.sent,
        total: finalStats.total,
        processed: finalStats.processed,
        remaining: 0,
        done: true,
      });
    }

    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const leaseAcquired = await acquireProcessingLease(runRef, batchId);
    if (!leaseAcquired) {
      return res.status(200).json({
        success: true,
        approved: preStats.sent,
        emailsSent: preStats.emailAccepted,
        emailsFailed: preStats.failed,
        dbPending: preStats.email_sent,
        skipped: preStats.total - preStats.sent,
        total: preStats.total,
        processed: preStats.processed,
        remaining: preStats.remaining,
        done: false,
        noClaim: true,
        inProgress: true,
        retryAfterMs: 1000,
      });
    }
    activeLeaseId = batchId;

    const claimDocs = await claimQueueDocs(queueRef, resolvedBatchSize);
    if (claimDocs.length === 0) {
      await releaseProcessingLease(runRef, batchId);
      const latestStats = await approvalStats(queueRef);
      if (latestStats.total === 0 || (latestStats.queued === 0 && latestStats.failed === 0 && latestStats.sending === 0 && latestStats.email_sent === 0)) {
        const finalStats = await completeIfDone({ runRef, queueRef, decoded, reqId, handlerStart });
        return res.status(200).json({
          success: true,
          approved: finalStats.sent,
          emailsSent: finalStats.emailAccepted,
          emailsFailed: finalStats.failed,
          dbPending: finalStats.email_sent,
          skipped: finalStats.total - finalStats.sent,
          total: finalStats.total,
          processed: finalStats.processed,
          remaining: 0,
          done: true,
        });
      }
      return res.status(200).json({
        success: true,
        approved: latestStats.sent,
        emailsSent: latestStats.emailAccepted,
        emailsFailed: latestStats.failed,
        dbPending: latestStats.email_sent,
        skipped: latestStats.total - latestStats.sent,
        total: latestStats.total,
        processed: latestStats.processed,
        remaining: latestStats.remaining,
        done: false,
        noClaim: true,
        inProgress: latestStats.sending > 0,
        retryAfterMs: 1000,
      });
    }

    const claimed = claimDocs.map((doc) => ({ ref: doc.ref, data: doc.data() }));
    await updateQueue(claimed, {
      status: 'sending',
      batchId,
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      attemptCount: admin.firestore.FieldValue.increment(1),
      error: admin.firestore.FieldValue.delete(),
    });

    const needsEmail = claimed.filter(({ data }) => String(data.status || 'queued') !== 'email_sent');
    const chunk = needsEmail.map(({ data }) => {
      const { from, subject, html } = statusUpdateEmail({ fullName: data.fullName, status: 'approved' });
      return { from, to: data.email, subject, html };
    });

    if (needsEmail.length > 0) {
      const result = await sendEmailBatchWithRetry(chunk, {
        idempotencyKey: `approve-all/${runId}/batch/${shortHash(needsEmail.map(({ data }) => data.registrantId).sort().join('|'))}`,
      });
      if (result.failed > 0) {
        await updateQueue(needsEmail, {
          status: 'failed',
          error: (result.err?.message || 'approval email batch failed').slice(0, 500),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await mergeQueue(claimed.filter(({ data }) => String(data.status || '') === 'email_sent'), {
          status: 'email_sent',
          error: 'DB approval write still pending.',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
        await runRef.update({
          status: 'paused',
          error: (result.err?.message || 'approval email batch failed').slice(0, 500),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
        logger.warn('admin', 'bulk_approve_email_batch_failed', {
          reqId,
          actorId: decoded.uid,
          detail: { batchId, failed: needsEmail.length, message: result.err?.message },
          status: 'degraded',
        });
        await releaseProcessingLease(runRef, batchId);
        return res.status(502).json({
          success: false,
          error: 'Approval email batch failed. Retry will continue without approving unsent rows.',
          retryable: true,
        });
      }

      const markResult = await markQueueEmailAccepted(needsEmail, {
        status: 'email_sent',
        emailAcceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: admin.firestore.FieldValue.delete(),
      });

      if (markResult.failed > 0) {
        await runRef.update({
          status: 'paused',
          error: `${markResult.failed} approval queue row(s) could not be marked email_sent after email acceptance.`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
        logger.error('admin', 'bulk_approve_email_accept_mark_failed', {
          reqId,
          actorId: decoded.uid,
          detail: { batchId, marked: markResult.marked, failed: markResult.failed },
          status: 'degraded',
        });
        await releaseProcessingLease(runRef, batchId);
        return res.status(502).json({
          success: false,
          error: 'Approval emails were accepted, but queue state could not be fully saved. Retry later; do not start a new run.',
          retryable: true,
        });
      }
    }

    try {
      for (let i = 0; i < claimed.length; i += FIRESTORE_CHUNK) {
        const batch = db.batch();
        claimed.slice(i, i + FIRESTORE_CHUNK).forEach(({ ref, data }) => {
          batch.update(db.collection('registrants').doc(data.registrantId), {
            status: 'approved',
            statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          batch.update(ref, {
            status: 'sent',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            error: admin.firestore.FieldValue.delete(),
          });
        });
        await batch.commit();
      }
    } catch (dbErr) {
      await markQueueEmailAccepted(claimed, {
        status: 'email_sent',
        error: (dbErr.message || 'approval db write failed after email acceptance').slice(0, 500),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await runRef.update({
        status: 'paused',
        error: (dbErr.message || 'approval db write failed after email acceptance').slice(0, 500),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {});
      logger.error('admin', 'bulk_approve_db_write_failed_after_email', {
        reqId,
        actorId: decoded.uid,
        detail: { batchId, count: claimed.length },
        status: 'degraded',
      }, dbErr);
      await releaseProcessingLease(runRef, batchId);
      return res.status(502).json({
        success: false,
        error: 'Approval emails were accepted, but database approval failed. Retry will approve these rows without resending email.',
        retryable: true,
      });
    }

    logger.info('admin', 'bulk_approve_batch_sent', {
      reqId,
      actorId: decoded.uid,
      detail: { batchId, count: claimed.length },
      status: 'ok',
    });

    await releaseProcessingLease(runRef, batchId);
    const finalStats = await completeIfDone({ runRef, queueRef, decoded, reqId, handlerStart });

    return res.status(200).json({
      success: true,
      approved: finalStats.sent,
      emailsSent: finalStats.emailAccepted,
      emailsFailed: finalStats.failed,
      dbPending: finalStats.email_sent,
      skipped: finalStats.total - finalStats.sent,
      total: finalStats.total,
      processed: finalStats.processed,
      remaining: finalStats.remaining,
      batchAttempted: claimed.length,
      done: finalStats.done,
    });
  } catch (error) {
    logger.error('admin', 'bulk_approve_error', { reqId, actorId: decoded.uid, status: 'failed' }, error);
    if (activeLeaseId) {
      await releaseProcessingLease(runRef, activeLeaseId);
    }
    return res.status(500).json({ error: 'Bulk approval failed.' });
  }
}
