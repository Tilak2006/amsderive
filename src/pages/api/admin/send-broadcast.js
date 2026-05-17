import { admin, db } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { resend } from '../../../lib/resend';
import { broadcastEmail } from '../../../emails/templates';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 500;
const BATCH_RETRY_ATTEMPTS = 3;
const SEND_TIMEOUT_MS = 15000;
const FIRESTORE_WRITE_CHUNK = 450;
const OUTREACH_SKIP_STATUSES = new Set(['sent', 'delivered', 'bounced', 'complained']);
const QUEUEABLE_STATUSES = ['queued', 'failed'];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendBatchWithRetry(chunk, attempt = 1) {
  try {
    await Promise.race([
      resend.batch.send(chunk),
      new Promise((_, reject) => setTimeout(() => reject(new Error('resend batch send timed out')), SEND_TIMEOUT_MS)),
    ]);
    return { sent: chunk.length, failed: 0 };
  } catch (err) {
    if (attempt < BATCH_RETRY_ATTEMPTS) {
      await delay(attempt * 1000);
      return sendBatchWithRetry(chunk, attempt + 1);
    }
    return { sent: 0, failed: chunk.length, err };
  }
}

async function markOutreachSent(recipients, broadcastId) {
  if (recipients.length === 0) return { marked: 0, failed: 0 };

  const update = {
    deliveryStatus: 'sent',
    deliveryStatusAt: admin.firestore.FieldValue.serverTimestamp(),
    lastBroadcastAt: admin.firestore.FieldValue.serverTimestamp(),
    lastBroadcastId: broadcastId,
  };

  try {
    const batch = db.batch();
    recipients.forEach((r) => {
      batch.update(db.collection('outreach_contacts').doc(r.email.trim().toLowerCase()), update);
    });
    await batch.commit();
    return { marked: recipients.length, failed: 0 };
  } catch {
    let marked = 0;
    let failed = 0;
    await Promise.all(recipients.map(async (r) => {
      const ref = db.collection('outreach_contacts').doc(r.email.trim().toLowerCase());
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await ref.update(update);
          marked += 1;
          return;
        } catch {
          if (attempt < 3) await delay(attempt * 250);
        }
      }
      failed += 1;
    }));
    return { marked, failed };
  }
}

function firstNameFrom(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || '';
}

function renderBroadcastBody(body, recipient) {
  const variables = {
    firstName: recipient.firstName || firstNameFrom(recipient.fullName),
    fullName: recipient.fullName || '',
    institution: recipient.institution || recipient.university || '',
  };

  return body.replace(/{{\s*(firstName|fullName|institution)\s*}}/g, (_, key) => variables[key] || '');
}

function unsubscribeSecret() {
  return process.env.OUTREACH_UNSUBSCRIBE_SECRET ||
    process.env.RESEND_WEBHOOK_SECRET ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    'missing-unsubscribe-secret';
}

function outreachUnsubscribeToken(email) {
  return crypto.createHmac('sha256', unsubscribeSecret()).update(email.trim().toLowerCase()).digest('hex');
}

function siteBaseUrl(req) {
  return (process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host || 'amsderive.in'}`).replace(/\/$/, '');
}

function outreachFooterHtml(req, email) {
  const normalizedEmail = email.trim().toLowerCase();
  const url = `${siteBaseUrl(req)}/api/unsubscribe-outreach?email=${encodeURIComponent(normalizedEmail)}&token=${outreachUnsubscribeToken(normalizedEmail)}`;
  return `<p style="margin:28px 0 0;padding-top:16px;border-top:1px solid rgba(212,175,55,0.1);font-family:'Courier New',monospace;font-size:10px;line-height:1.6;color:#4a4540;">You are receiving this because AMS Derive identified your public competitive programming profile for contest outreach. <a href="${url}" style="color:#6b6560;text-decoration:underline;">Unsubscribe</a>.</p>`;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isAlreadyContacted(status, unsubscribed) {
  return unsubscribed === true || OUTREACH_SKIP_STATUSES.has(String(status || '').toLowerCase());
}

function isDuplicateCreate(err) {
  return err?.code === 6 || /ALREADY_EXISTS/i.test(err?.message || '');
}

async function buildRecipientSnapshot(resolvedTargetType, filter) {
  const recipientsByEmail = new Map();
  const suppressedOutreachEmails = new Set();
  let registrantAttempted = 0;
  let outreachAttempted = 0;
  let outreachSuppressed = 0;

  if (resolvedTargetType === 'outreach' || resolvedTargetType === 'both') {
    const snapshot = await db.collection('outreach_contacts')
      .select('email', 'fullName', 'firstName', 'institution', 'deliveryStatus', 'unsubscribed')
      .get();

    snapshot.docs
      .map((d) => ({
        email: d.data().email,
        fullName: d.data().fullName,
        firstName: d.data().firstName,
        institution: d.data().institution,
        deliveryStatus: d.data().deliveryStatus || null,
        unsubscribed: d.data().unsubscribed === true,
        targetKind: 'outreach',
      }))
      .filter((r) => r.email)
      .forEach((r) => {
        const key = normalizeEmail(r.email);
        if (isAlreadyContacted(r.deliveryStatus, r.unsubscribed)) {
          suppressedOutreachEmails.add(key);
          outreachSuppressed += 1;
          return;
        }
        outreachAttempted += 1;
        recipientsByEmail.set(key, { ...r, emailLower: key });
      });
  }

  if (resolvedTargetType === 'registrants' || resolvedTargetType === 'both') {
    let q = db.collection('registrants')
      .where('status', '==', 'approved')
      .select('email', 'fullName', 'university');
    if (filter !== 'all') {
      q = q.where('round', '==', filter);
    }
    const snapshot = await q.get();

    snapshot.docs
      .map((d) => ({
        email: d.data().email,
        fullName: d.data().fullName,
        firstName: firstNameFrom(d.data().fullName),
        institution: d.data().university,
        targetKind: 'registrant',
      }))
      .filter((r) => r.email)
      .forEach((r) => {
        const key = normalizeEmail(r.email);
        if (resolvedTargetType === 'both' && suppressedOutreachEmails.has(key)) return;
        registrantAttempted += 1;
        if (!recipientsByEmail.has(key)) {
          recipientsByEmail.set(key, { ...r, emailLower: key });
        }
      });
  }

  const recipients = Array.from(recipientsByEmail.values())
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')));

  return { recipients, registrantAttempted, outreachAttempted, outreachSuppressed };
}

async function writeRecipientQueue(queueRef, recipients) {
  for (let i = 0; i < recipients.length; i += FIRESTORE_WRITE_CHUNK) {
    const chunk = recipients.slice(i, i + FIRESTORE_WRITE_CHUNK);
    const batch = db.batch();
    chunk.forEach((r, idx) => {
      batch.set(queueRef.doc(r.emailLower), {
        email: r.email,
        emailLower: r.emailLower,
        targetKind: r.targetKind,
        fullName: r.fullName || '',
        firstName: r.firstName || '',
        institution: r.institution || '',
        status: 'queued',
        sortKey: i + idx,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: false });
    });
    await batch.commit();
  }
}

async function queueStats(queueRef) {
  const snapshot = await queueRef.get();
  const stats = {
    total: snapshot.size,
    sent: 0,
    failed: 0,
    skipped: 0,
    queued: 0,
    sending: 0,
    processed: 0,
    remaining: 0,
    outreachSent: 0,
    outreachFailed: 0,
    outreachSkipped: 0,
  };

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const status = String(data.status || 'queued').toLowerCase();
    if (stats[status] !== undefined) stats[status] += 1;
    if (data.targetKind === 'outreach' && status === 'sent') stats.outreachSent += 1;
    if (data.targetKind === 'outreach' && status === 'failed') stats.outreachFailed += 1;
    if (data.targetKind === 'outreach' && status === 'skipped') stats.outreachSkipped += 1;
  });

  stats.processed = stats.sent + stats.failed + stats.skipped;
  stats.remaining = stats.queued + stats.failed + stats.sending;
  return stats;
}

async function updateQueueStatus(items, update) {
  for (let i = 0; i < items.length; i += FIRESTORE_WRITE_CHUNK) {
    const chunk = items.slice(i, i + FIRESTORE_WRITE_CHUNK);
    const batch = db.batch();
    chunk.forEach(({ ref }) => batch.update(ref, update));
    await batch.commit();
  }
}

async function recheckOutreachRecipients(claimedDocs) {
  const sendable = [];
  const skipped = [];

  await Promise.all(claimedDocs.map(async ({ ref, data }) => {
    if (data.targetKind !== 'outreach') {
      sendable.push({ ref, data });
      return;
    }

    const live = await db.collection('outreach_contacts').doc(data.emailLower).get();
    const liveData = live.exists ? live.data() : {};
    if (!live.exists || isAlreadyContacted(liveData.deliveryStatus, liveData.unsubscribed)) {
      await ref.update({
        status: 'skipped',
        skippedReason: liveData.unsubscribed === true ? 'unsubscribed_or_suppressed' : 'already_contacted',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      skipped.push({ ref, data });
      return;
    }

    sendable.push({ ref, data });
  }));

  return { sendable, skipped };
}

async function initializeBroadcast({ lockRef, queueRef, broadcastId, subjectText, filter, resolvedTargetType, decoded, reqId, handlerStart }) {
  const { recipients, registrantAttempted, outreachAttempted, outreachSuppressed } =
    await buildRecipientSnapshot(resolvedTargetType, filter);

  try {
    await lockRef.create({
      status: recipients.length === 0 ? 'complete' : 'in_progress',
      mode: 'queued',
      subject: subjectText,
      filter,
      targetType: resolvedTargetType,
      total: recipients.length,
      sent: 0,
      emailsFailed: 0,
      skipped: 0,
      outreachAttempted,
      outreachSuppressed,
      outreachSent: 0,
      outreachFailed: 0,
      outreachSkipped: 0,
      outreachMarkFailed: 0,
      registrantAttempted,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(recipients.length === 0 ? { completedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
    });
  } catch (err) {
    if (isDuplicateCreate(err)) return false;
    throw err;
  }

  if (recipients.length > 0) {
    await writeRecipientQueue(queueRef, recipients);
  }

  if (recipients.length === 0) {
    await db.collection('_audit_log').add({
      type: 'broadcast',
      actorId: decoded.uid,
      reqId,
      broadcastId,
      subject: subjectText,
      sent: 0,
      emailsFailed: 0,
      skipped: 0,
      total: 0,
      filter,
      targetType: resolvedTargetType,
      attempted: 0,
      failed: 0,
      outreachAttempted,
      outreachSuppressed,
      outreachSent: 0,
      outreachFailed: 0,
      outreachSkipped: 0,
      outreachMarkFailed: 0,
      registrantAttempted,
      durationMs: Date.now() - handlerStart,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  }

  return true;
}

async function completeBroadcastIfDone({ lockRef, queueRef, decoded, reqId, broadcastId, subjectText, filter, resolvedTargetType, lockData, handlerStart }) {
  const stats = await queueStats(queueRef);
  const done = stats.queued === 0 && stats.sending === 0;
  const outreachTotal = lockData?.outreachAttempted || 0;
  const registrantTotal = lockData?.registrantAttempted || 0;

  await lockRef.update({
    status: done ? 'complete' : 'in_progress',
    total: stats.total,
    sent: stats.sent,
    emailsFailed: stats.failed,
    skipped: stats.skipped,
    outreachSent: stats.outreachSent,
    outreachFailed: stats.outreachFailed,
    outreachSkipped: stats.outreachSkipped,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(done ? { completedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
  });

  if (done && lockData?.auditLogged !== true) {
    await db.collection('_audit_log').add({
      type: 'broadcast',
      actorId: decoded.uid,
      reqId,
      broadcastId,
      subject: subjectText,
      sent: stats.sent,
      emailsFailed: stats.failed,
      skipped: stats.skipped,
      total: stats.total,
      filter,
      targetType: resolvedTargetType,
      attempted: stats.total,
      failed: stats.failed,
      outreachAttempted: outreachTotal,
      outreachSuppressed: lockData?.outreachSuppressed || 0,
      outreachSent: stats.outreachSent,
      outreachFailed: stats.outreachFailed,
      outreachSkipped: stats.outreachSkipped,
      outreachMarkFailed: lockData?.outreachMarkFailed || 0,
      registrantAttempted: registrantTotal,
      durationMs: Date.now() - handlerStart,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }).catch((auditErr) => {
      logger.error('admin', 'broadcast_audit_log_failed', {
        reqId, actorId: decoded.uid, detail: { broadcastId, sent: stats.sent, emailsFailed: stats.failed }, status: 'degraded',
      }, auditErr);
    });
    await lockRef.update({ auditLogged: true }).catch(() => {});
  }

  return { ...stats, done };
}

// Disable response size limit — broadcast can take a while
export const config = { api: { responseLimit: false } };

async function legacyOffsetBroadcastHandler(req, res) {
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
  const { subject, body, roundFilter, broadcastId, targetType, batchOffset, batchSize } = req.body;

  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Subject and body are required.' });
  }

  if (!broadcastId || typeof broadcastId !== 'string' || broadcastId.length < 8 || broadcastId.length > 64) {
    return res.status(400).json({ error: 'broadcastId required (8–64 chars).' });
  }

  const validFilters = ['all', 'prior', 'posterior', 'convergence'];
  const filter = validFilters.includes(roundFilter) ? roundFilter : 'all';
  const validTargetTypes = ['registrants', 'outreach', 'both'];
  const resolvedTargetType = validTargetTypes.includes(targetType) ? targetType : 'registrants';
  const isChunkedRequest = batchOffset !== undefined || batchSize !== undefined;
  const parsedBatchOffset = Number(batchOffset ?? 0);
  const parsedBatchSize = Number(batchSize ?? BATCH_SIZE);

  if (isChunkedRequest && (!Number.isInteger(parsedBatchOffset) || parsedBatchOffset < 0)) {
    return res.status(400).json({ error: 'batchOffset must be a non-negative integer.' });
  }

  if (isChunkedRequest && (!Number.isInteger(parsedBatchSize) || parsedBatchSize < 1)) {
    return res.status(400).json({ error: 'batchSize must be a positive integer.' });
  }

  const resolvedBatchOffset = isChunkedRequest ? parsedBatchOffset : 0;
  const resolvedBatchSize = Math.min(parsedBatchSize, BATCH_SIZE);

  // Idempotency guard — atomic create prevents duplicate sends from double-clicks or retries.
  // Any concurrent second request hits ALREADY_EXISTS and is rejected before any email fires.
  const lockRef = db.collection('_broadcasts').doc(broadcastId);
  try {
    await lockRef.create({
      status: 'in_progress',
      mode: isChunkedRequest ? 'chunked' : 'single_request',
      subject: subject.trim(),
      filter,
      targetType: resolvedTargetType,
      sent: 0,
      emailsFailed: 0,
      total: null,
      outreachSent: 0,
      outreachFailed: 0,
      outreachMarkFailed: 0,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    if (err.code === 6 || /ALREADY_EXISTS/i.test(err.message || '')) {
      if (isChunkedRequest) {
        const existing = await lockRef.get().catch(() => null);
        if (!existing?.exists) {
          return res.status(409).json({ error: 'This broadcast is already being prepared.' });
        }
      } else {
        logger.warn('admin', 'broadcast_duplicate_blocked', {
          reqId, actorId: decoded.uid, detail: { broadcastId, subject: subject.trim() }, status: 'blocked',
        });
        return res.status(409).json({ error: 'This broadcast was already submitted.' });
      }
    }
    if (!(err.code === 6 || /ALREADY_EXISTS/i.test(err.message || ''))) {
      logger.error('admin', 'broadcast_lock_failed', { reqId, actorId: decoded.uid, status: 'failed' }, err);
      return res.status(500).json({ error: 'Broadcast failed.' });
    }
  }

  try {
    const recipientsByEmail = new Map();
    let registrantAttempted = 0;
    let outreachAttempted = 0;
    let outreachMarkFailed = 0;
    const suppressedOutreachEmails = new Set();

    if (resolvedTargetType === 'outreach' || resolvedTargetType === 'both') {
      const snapshot = await db.collection('outreach_contacts')
        .select('email', 'fullName', 'firstName', 'institution', 'deliveryStatus', 'unsubscribed')
        .get();

      snapshot.docs
        .map((d) => ({
          email: d.data().email,
          fullName: d.data().fullName,
          firstName: d.data().firstName,
          institution: d.data().institution,
          deliveryStatus: d.data().deliveryStatus || null,
          unsubscribed: d.data().unsubscribed === true,
          targetKind: 'outreach',
        }))
        .filter((r) => r.email)
        .forEach((r) => {
          const key = r.email.trim().toLowerCase();
          const status = String(r.deliveryStatus || '').toLowerCase();
          if (r.unsubscribed || OUTREACH_SKIP_STATUSES.has(status)) {
            suppressedOutreachEmails.add(key);
            return;
          }
          outreachAttempted += 1;
          recipientsByEmail.set(key, r);
        });
    }

    if (resolvedTargetType === 'registrants' || resolvedTargetType === 'both') {
      // Only approved registrants receive broadcasts — pending/rejected are excluded
      let q = db.collection('registrants')
        .where('status', '==', 'approved')
        .select('email', 'fullName', 'university');
      if (filter !== 'all') {
        q = q.where('round', '==', filter);
      }
      const snapshot = await q.get();

      snapshot.docs
        .map((d) => ({
          email: d.data().email,
          fullName: d.data().fullName,
          firstName: firstNameFrom(d.data().fullName),
          institution: d.data().university,
          targetKind: 'registrant',
        }))
        .filter((r) => r.email)
        .forEach((r) => {
          const key = r.email.trim().toLowerCase();
          if (resolvedTargetType === 'both' && suppressedOutreachEmails.has(key)) return;
          registrantAttempted += 1;
          if (!recipientsByEmail.has(key)) {
            recipientsByEmail.set(key, r);
          }
        });
    }

    const recipients = Array.from(recipientsByEmail.values())
      .sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')));

    if (recipients.length === 0) {
      if (resolvedTargetType === 'outreach' || resolvedTargetType === 'both') {
        await db.collection('_audit_log').add({
          type: 'broadcast',
          actorId: decoded.uid,
          reqId,
          broadcastId,
          subject: subject.trim(),
          sent: 0,
          emailsFailed: 0,
          total: 0,
          filter,
          targetType: resolvedTargetType,
          attempted: 0,
          failed: 0,
          outreachAttempted: 0,
          outreachSent: 0,
          outreachFailed: 0,
          outreachMarkFailed: 0,
          registrantAttempted,
          durationMs: Date.now() - handlerStart,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
      }
      await lockRef.update({
        status: 'complete',
        sent: 0,
        emailsFailed: 0,
        total: 0,
        targetType: resolvedTargetType,
        outreachAttempted: 0,
        outreachSent: 0,
        outreachFailed: 0,
        outreachMarkFailed: 0,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {});
      return res.status(200).json({
        success: true,
        sent: 0,
        sentThisBatch: 0,
        emailsFailed: 0,
        failedThisBatch: 0,
        failed: 0,
        attempted: 0,
        batchAttempted: 0,
        nextOffset: null,
        done: true,
        targetType: resolvedTargetType,
        outreachAttempted: 0,
        outreachSent: 0,
        outreachFailed: 0,
        outreachMarkFailed: 0,
        registrantAttempted,
      });
    }

    const subjectText = subject.trim();
    const bodyText = body.trim();
    let sent = 0;
    let emailsFailed = 0;
    let outreachSent = 0;
    let outreachFailed = 0;

    if (isChunkedRequest) {
      const total = recipients.length;
      const totalBatches = Math.ceil(total / resolvedBatchSize);

      if (resolvedBatchOffset >= total) {
        await lockRef.update({
          status: 'complete',
          total,
          targetType: resolvedTargetType,
          outreachAttempted,
          registrantAttempted,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
        return res.status(200).json({
          success: true,
          sent: 0,
          sentThisBatch: 0,
          emailsFailed: 0,
          failedThisBatch: 0,
          failed: 0,
          attempted: total,
          batchAttempted: 0,
          targetType: resolvedTargetType,
          batchNumber: totalBatches,
          totalBatches,
          nextOffset: null,
          done: true,
          outreachAttempted,
          outreachSent: 0,
          outreachFailed: 0,
          outreachMarkFailed: 0,
          registrantAttempted,
        });
      }

      const batchNumber = Math.floor(resolvedBatchOffset / resolvedBatchSize) + 1;
      const batchId = `${resolvedBatchOffset}-${resolvedBatchSize}`;
      const batchRef = lockRef.collection('batches').doc(batchId);

      try {
        await batchRef.create({
          status: 'in_progress',
          batchNumber,
          batchOffset: resolvedBatchOffset,
          batchSize: resolvedBatchSize,
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (err) {
        if (err.code === 6 || /ALREADY_EXISTS/i.test(err.message || '')) {
          const existingBatch = await batchRef.get().catch(() => null);
          const batchData = existingBatch?.data();
          if (batchData?.status === 'complete') {
            return res.status(200).json({
              success: true,
              sent: batchData.sent || 0,
              sentThisBatch: batchData.sent || 0,
              emailsFailed: batchData.emailsFailed || 0,
              failedThisBatch: batchData.emailsFailed || 0,
              failed: batchData.emailsFailed || 0,
              attempted: total,
              batchAttempted: batchData.batchAttempted || 0,
              targetType: resolvedTargetType,
              batchNumber,
              totalBatches,
              nextOffset: batchData.nextOffset ?? null,
              done: batchData.done === true,
              alreadyProcessed: true,
              outreachAttempted,
              outreachSent: batchData.outreachSent || 0,
              outreachFailed: batchData.outreachFailed || 0,
              outreachMarkFailed: batchData.outreachMarkFailed || 0,
              registrantAttempted,
            });
          }
          return res.status(409).json({ error: 'This broadcast batch is already in progress.' });
        }
        throw err;
      }

      const chunkRecipients = recipients.slice(resolvedBatchOffset, resolvedBatchOffset + resolvedBatchSize);
      const chunk = chunkRecipients.map((r) => {
        const template = broadcastEmail({
          subject: subjectText,
          body: renderBroadcastBody(bodyText, r),
          footerHtml: r.targetKind === 'outreach' ? outreachFooterHtml(req, r.email) : '',
        });
        return {
          from: template.from,
          to: r.email,
          subject: template.subject,
          html: template.html,
        };
      });

      const result = await sendBatchWithRetry(chunk);
      sent = result.sent;
      emailsFailed = result.failed;

      const outreachRecipients = chunkRecipients.filter((r) => r.targetKind === 'outreach');
      const outreachCount = outreachRecipients.length;
      if (result.failed > 0) {
        outreachFailed = outreachCount;
      } else {
        outreachSent = outreachCount;
        if (outreachRecipients.length > 0) {
          const markResult = await markOutreachSent(outreachRecipients, broadcastId);
          outreachMarkFailed = markResult.failed;
          if (markResult.failed > 0) {
            logger.error('admin', 'outreach_sent_mark_failed', {
              reqId,
              actorId: decoded.uid,
              detail: { batchNumber, failed: markResult.failed, marked: markResult.marked, broadcastId },
              status: 'degraded',
            });
          }
        }
      }

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

      const nextOffset = resolvedBatchOffset + chunkRecipients.length;
      const done = nextOffset >= total;

      await batchRef.update({
        status: 'complete',
        sent,
        emailsFailed,
        batchAttempted: chunkRecipients.length,
        outreachSent,
        outreachFailed,
        outreachMarkFailed,
        nextOffset: done ? null : nextOffset,
        done,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await lockRef.update({
        total,
        targetType: resolvedTargetType,
        outreachAttempted,
        registrantAttempted,
        sent: admin.firestore.FieldValue.increment(sent),
        emailsFailed: admin.firestore.FieldValue.increment(emailsFailed),
        outreachSent: admin.firestore.FieldValue.increment(outreachSent),
        outreachFailed: admin.firestore.FieldValue.increment(outreachFailed),
        outreachMarkFailed: admin.firestore.FieldValue.increment(outreachMarkFailed),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(done ? {
          status: 'complete',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        } : {}),
      });

      if (done) {
        const finalLock = await lockRef.get().catch(() => null);
        const finalData = finalLock?.data() || {};
        const finalSent = finalData.sent ?? sent;
        const finalFailed = finalData.emailsFailed ?? emailsFailed;
        const finalOutreachSent = finalData.outreachSent ?? outreachSent;
        const finalOutreachFailed = finalData.outreachFailed ?? outreachFailed;
        const finalOutreachMarkFailed = finalData.outreachMarkFailed ?? outreachMarkFailed;

        logger.info('admin', 'broadcast_complete', {
          reqId,
          actorId: decoded.uid,
          detail: { sent: finalSent, emailsFailed: finalFailed, total, filter, targetType: resolvedTargetType },
          status: 'ok',
          durationMs: Date.now() - handlerStart,
        });

        await db.collection('_audit_log').add({
          type: 'broadcast',
          actorId: decoded.uid,
          reqId,
          broadcastId,
          subject: subject.trim(),
          sent: finalSent,
          emailsFailed: finalFailed,
          total,
          filter,
          targetType: resolvedTargetType,
          attempted: total,
          failed: finalFailed,
          outreachAttempted,
          outreachSent: finalOutreachSent,
          outreachFailed: finalOutreachFailed,
          outreachMarkFailed: finalOutreachMarkFailed,
          registrantAttempted,
          durationMs: Date.now() - handlerStart,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        }).catch((auditErr) => {
          logger.error('admin', 'broadcast_audit_log_failed', {
            reqId, actorId: decoded.uid, detail: { broadcastId, sent: finalSent, emailsFailed: finalFailed }, status: 'degraded',
          }, auditErr);
        });
      }

      return res.status(200).json({
        success: true,
        sent,
        sentThisBatch: sent,
        emailsFailed,
        failedThisBatch: emailsFailed,
        failed: emailsFailed,
        attempted: total,
        batchAttempted: chunkRecipients.length,
        targetType: resolvedTargetType,
        batchNumber,
        totalBatches,
        nextOffset: done ? null : nextOffset,
        done,
        outreachAttempted,
        outreachSent,
        outreachFailed,
        outreachMarkFailed,
        registrantAttempted,
      });
    }

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const chunkRecipients = recipients.slice(i, i + BATCH_SIZE);
      const chunk = chunkRecipients.map((r) => {
        const template = broadcastEmail({
          subject: subjectText,
          body: renderBroadcastBody(bodyText, r),
          footerHtml: r.targetKind === 'outreach' ? outreachFooterHtml(req, r.email) : '',
        });
        return {
          from: template.from,
          to: r.email,
          subject: template.subject,
          html: template.html,
        };
      });

      const result = await sendBatchWithRetry(chunk);
      sent += result.sent;
      emailsFailed += result.failed;
      const outreachRecipients = chunkRecipients.filter((r) => r.targetKind === 'outreach');
      const outreachCount = outreachRecipients.length;
      if (result.failed > 0) {
        outreachFailed += outreachCount;
      } else {
        outreachSent += outreachCount;
        if (outreachRecipients.length > 0) {
          const markResult = await markOutreachSent(outreachRecipients, broadcastId);
          outreachMarkFailed += markResult.failed;
          if (markResult.failed > 0) {
            logger.error('admin', 'outreach_sent_mark_failed', {
              reqId,
              actorId: decoded.uid,
              detail: { batchNumber, failed: markResult.failed, marked: markResult.marked, broadcastId },
              status: 'degraded',
            });
          }
        }
      }

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
      detail: { sent, emailsFailed, total: recipients.length, filter, targetType: resolvedTargetType },
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
        targetType: resolvedTargetType,
        attempted: recipients.length,
        failed: emailsFailed,
        outreachAttempted,
        outreachSent,
        outreachFailed,
        outreachMarkFailed,
        registrantAttempted,
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
      targetType: resolvedTargetType,
      outreachAttempted,
      outreachSent,
      outreachFailed,
      outreachMarkFailed,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      sent,
      emailsFailed,
      failed: emailsFailed,
      attempted: recipients.length,
      targetType: resolvedTargetType,
      outreachAttempted,
      outreachSent,
      outreachFailed,
      outreachMarkFailed,
      registrantAttempted,
    });
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
  const { subject, body, roundFilter, broadcastId, targetType, batchSize } = req.body;

  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Subject and body are required.' });
  }

  if (!broadcastId || typeof broadcastId !== 'string' || broadcastId.length < 8 || broadcastId.length > 64) {
    return res.status(400).json({ error: 'broadcastId required (8-64 chars).' });
  }

  const validFilters = ['all', 'prior', 'posterior', 'convergence'];
  const filter = validFilters.includes(roundFilter) ? roundFilter : 'all';
  const validTargetTypes = ['registrants', 'outreach', 'both'];
  const resolvedTargetType = validTargetTypes.includes(targetType) ? targetType : 'registrants';
  const parsedBatchSize = Number(batchSize ?? BATCH_SIZE);

  if (!Number.isInteger(parsedBatchSize) || parsedBatchSize < 1) {
    return res.status(400).json({ error: 'batchSize must be a positive integer.' });
  }

  const resolvedBatchSize = Math.min(parsedBatchSize, BATCH_SIZE);
  const subjectText = subject.trim();
  const bodyText = body.trim();
  const lockRef = db.collection('_broadcasts').doc(broadcastId);
  const queueRef = lockRef.collection('recipients');

  try {
    await initializeBroadcast({
      lockRef,
      queueRef,
      broadcastId,
      subjectText,
      filter,
      resolvedTargetType,
      decoded,
      reqId,
      handlerStart,
    });

    const lockSnap = await lockRef.get();
    if (!lockSnap.exists) {
      return res.status(409).json({ error: 'This broadcast is already being prepared.' });
    }
    const lockData = lockSnap.data() || {};

    if (lockData.subject !== subjectText || lockData.targetType !== resolvedTargetType || lockData.filter !== filter) {
      return res.status(409).json({ error: 'This broadcast ID belongs to a different message or target.' });
    }

    const preStats = await queueStats(queueRef);
    if (preStats.total === 0 && Number(lockData.total || 0) > 0 && lockData.status !== 'complete') {
      return res.status(409).json({ error: 'This broadcast queue is still being prepared. Try again in a moment.' });
    }

    if (preStats.total === 0 || (preStats.queued === 0 && preStats.failed === 0 && preStats.sending === 0)) {
      const finalStats = await completeBroadcastIfDone({
        lockRef,
        queueRef,
        decoded,
        reqId,
        broadcastId,
        subjectText,
        filter,
        resolvedTargetType,
        lockData,
        handlerStart,
      });

      return res.status(200).json({
        success: true,
        sent: finalStats.sent,
        sentThisBatch: 0,
        emailsFailed: finalStats.failed,
        failedThisBatch: 0,
        failed: finalStats.failed,
        skipped: finalStats.skipped,
        skippedThisBatch: 0,
        attempted: finalStats.total,
        total: finalStats.total,
        processed: finalStats.processed,
        remaining: 0,
        targetType: resolvedTargetType,
        batchAttempted: 0,
        batchNumber: Math.max(1, Math.ceil(finalStats.processed / resolvedBatchSize)),
        totalBatches: Math.ceil(finalStats.total / resolvedBatchSize),
        done: true,
        outreachAttempted: lockData.outreachAttempted || 0,
        outreachSuppressed: lockData.outreachSuppressed || 0,
        outreachSent: finalStats.outreachSent,
        outreachFailed: finalStats.outreachFailed,
        outreachSkipped: finalStats.outreachSkipped,
        outreachMarkFailed: lockData.outreachMarkFailed || 0,
        registrantAttempted: lockData.registrantAttempted || 0,
      });
    }

    const batchId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const claimSnap = await queueRef
      .where('status', 'in', QUEUEABLE_STATUSES)
      .limit(resolvedBatchSize)
      .get();

    if (claimSnap.empty) {
      return res.status(409).json({ error: 'Another broadcast batch is already in progress.' });
    }

    const claimedDocs = claimSnap.docs.map((doc) => ({ ref: doc.ref, data: doc.data() }));
    await updateQueueStatus(claimedDocs, {
      status: 'sending',
      batchId,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: admin.firestore.FieldValue.delete(),
    });

    const { sendable, skipped } = await recheckOutreachRecipients(claimedDocs);

    let sentThisBatch = 0;
    let failedThisBatch = 0;
    let outreachMarkFailed = 0;

    if (sendable.length > 0) {
      const chunk = sendable.map(({ data }) => {
        const template = broadcastEmail({
          subject: subjectText,
          body: renderBroadcastBody(bodyText, data),
          footerHtml: data.targetKind === 'outreach' ? outreachFooterHtml(req, data.email) : '',
        });
        return {
          from: template.from,
          to: data.email,
          subject: template.subject,
          html: template.html,
        };
      });

      const result = await sendBatchWithRetry(chunk);
      if (result.failed > 0) {
        failedThisBatch = sendable.length;
        await updateQueueStatus(sendable, {
          status: 'failed',
          error: (result.err?.message || 'resend batch send failed').slice(0, 500),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.warn('admin', 'broadcast_batch_failed', {
          reqId,
          actorId: decoded.uid,
          detail: { batchId, failed: failedThisBatch, message: result.err?.message, filter },
          status: 'degraded',
        });

        await lockRef.update({
          status: 'paused',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: (result.err?.message || 'resend batch send failed').slice(0, 500),
        }).catch(() => {});

        return res.status(502).json({
          success: false,
          error: 'Broadcast batch failed. Retry will continue this broadcast without resending successful batches.',
          retryable: true,
        });
      }

      sentThisBatch = sendable.length;
      await updateQueueStatus(sendable, {
        status: 'sent',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const outreachRecipients = sendable
        .map(({ data }) => data)
        .filter((r) => r.targetKind === 'outreach');
      if (outreachRecipients.length > 0) {
        const markResult = await markOutreachSent(outreachRecipients, broadcastId);
        outreachMarkFailed = markResult.failed;
        if (outreachMarkFailed > 0) {
          logger.error('admin', 'outreach_sent_mark_failed', {
            reqId,
            actorId: decoded.uid,
            detail: { batchId, failed: markResult.failed, marked: markResult.marked, broadcastId },
            status: 'degraded',
          });
        }
      }

      logger.info('admin', 'broadcast_batch_sent', {
        reqId,
        actorId: decoded.uid,
        detail: { batchId, count: sentThisBatch, skipped: skipped.length, filter },
        status: 'ok',
      });
    }

    if (outreachMarkFailed > 0) {
      await lockRef.update({
        outreachMarkFailed: admin.firestore.FieldValue.increment(outreachMarkFailed),
      }).catch(() => {});
    }

    const finalLock = await lockRef.get().catch(() => lockSnap);
    const finalStats = await completeBroadcastIfDone({
      lockRef,
      queueRef,
      decoded,
      reqId,
      broadcastId,
      subjectText,
      filter,
      resolvedTargetType,
      lockData: finalLock?.data() || lockData,
      handlerStart,
    });

    const batchNumber = Math.max(1, Math.ceil(finalStats.processed / resolvedBatchSize));
    const totalBatches = Math.ceil(finalStats.total / resolvedBatchSize);

    return res.status(200).json({
      success: true,
      sent: finalStats.sent,
      sentThisBatch,
      emailsFailed: finalStats.failed,
      failedThisBatch,
      failed: finalStats.failed,
      skipped: finalStats.skipped,
      skippedThisBatch: skipped.length,
      attempted: finalStats.total,
      total: finalStats.total,
      processed: finalStats.processed,
      remaining: finalStats.remaining,
      batchAttempted: claimedDocs.length,
      targetType: resolvedTargetType,
      batchNumber,
      totalBatches,
      nextOffset: finalStats.done ? null : finalStats.processed,
      done: finalStats.done,
      outreachAttempted: lockData.outreachAttempted || 0,
      outreachSuppressed: lockData.outreachSuppressed || 0,
      outreachSent: finalStats.outreachSent,
      outreachFailed: finalStats.outreachFailed,
      outreachSkipped: finalStats.outreachSkipped,
      outreachMarkFailed: (lockData.outreachMarkFailed || 0) + outreachMarkFailed,
      registrantAttempted: lockData.registrantAttempted || 0,
    });
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
