import { admin, db, getStorageBucket } from '../../../lib/firebaseAdmin';
import crypto from 'crypto';
import { broadcastEmail, priorRankEmail } from '../../../emails/templates';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';
import {
  delay,
  resendSafeDelayMs,
  sendEmailBatchWithRetry as sendBatchWithRetry,
  sendSingleEmailWithRetry,
} from '../../../lib/emailSender';

const BATCH_SIZE = 100;
const ATTACHMENT_BATCH_SIZE = 4;
const ATTACHMENT_MAX_BYTES = 3 * 1024 * 1024;
const BATCH_DELAY_MS = 500;
const STALE_SENDING_MS = 10 * 60 * 1000;
const PROCESSING_LEASE_MS = 6 * 60 * 1000;
const FIRESTORE_WRITE_CHUNK = 450;
const OUTREACH_SKIP_STATUSES = new Set(['sent', 'delivered', 'delayed', 'bounced', 'complained']);
const REGISTRANT_SUPPRESS_STATUSES = new Set(['bounced', 'complained']);
const EMAIL_REGEX = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

function shortHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
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
      batch.set(db.collection('outreach_contacts').doc(r.email.trim().toLowerCase()), update, { merge: true });
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
          await ref.set(update, { merge: true });
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

function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

function isAlreadyContacted(status, unsubscribed) {
  return unsubscribed === true || OUTREACH_SKIP_STATUSES.has(String(status || '').toLowerCase());
}

function isSuppressedRegistrant(status) {
  return REGISTRANT_SUPPRESS_STATUSES.has(String(status || '').toLowerCase());
}

function isDuplicateCreate(err) {
  return err?.code === 6 || /ALREADY_EXISTS/i.test(err?.message || '');
}


function normalizeRankRecipients(rawRows) {
  if (!Array.isArray(rawRows)) return [];
  const byEmail = new Map();

  rawRows.forEach((row, index) => {
    const email = normalizeEmail(row?.email);
    const rank = String(row?.rank || '').trim();
    if (!isValidEmail(email) || !rank) return;

    if (byEmail.has(email)) return;

    byEmail.set(email, {
      email,
      emailLower: email,
      fullName: String(row?.name || row?.fullName || '').trim(),
      firstName: firstNameFrom(row?.name || row?.fullName),
      cfHandle: String(row?.cfHandle || row?.codeforcesHandle || '').trim(),
      rank,
      tag: 'PRIOR',
      targetKind: 'rankCsv',
      sortKey: index,
    });
  });

  return Array.from(byEmail.values()).sort((a, b) => Number(a.sortKey || 0) - Number(b.sortKey || 0));
}

function normalizeAttachment(raw) {
  if (!raw) return null;
  const storagePath = String(raw.storagePath || '').trim();
  const fileName = String(raw.fileName || 'attachment.pdf').trim().slice(0, 120);
  const size = Number(raw.size || 0);
  const contentType = String(raw.contentType || '').trim();

  if (!storagePath.startsWith('broadcast_attachments/')) {
    throw new Error('Invalid attachment path.');
  }
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error('Attachment must be a PDF.');
  }
  if (!Number.isFinite(size) || size <= 0 || size > ATTACHMENT_MAX_BYTES) {
    throw new Error('Attachment exceeds 3 MB limit.');
  }
  if (contentType !== 'application/pdf') {
    throw new Error('Attachment must be application/pdf.');
  }

  return { storagePath, fileName, size, contentType };
}

function attachmentsEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.storagePath === b.storagePath && a.fileName === b.fileName && Number(a.size) === Number(b.size);
}

async function signedAttachmentForResend(attachment) {
  if (!attachment) return null;
  const bucket = getStorageBucket();
  const [path] = await bucket.file(attachment.storagePath).getSignedUrl({
    action: 'read',
    expires: Date.now() + 30 * 60 * 1000,
  });
  return {
    path,
    filename: attachment.fileName,
  };
}

async function buildRecipientSnapshot(resolvedTargetType, filter, rankRecipients = []) {
  const recipientsByEmail = new Map();
  const suppressedOutreachEmails = new Set();
  let registrantAttempted = 0;
  let outreachAttempted = 0;
  let outreachSuppressed = 0;

  if (resolvedTargetType === 'rankCsv') {
    const recipients = normalizeRankRecipients(rankRecipients);
    return { recipients, registrantAttempted: recipients.length, outreachAttempted: 0, outreachSuppressed: 0 };
  }

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
      .filter((r) => isValidEmail(r.email))
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
      .select('email', 'fullName', 'university', 'round', 'deliveryStatus');
    if (filter !== 'all' && filter !== 'prior') {
      q = q.where('round', '==', filter);
    }
    const snapshot = await q.get();

    snapshot.docs
      .map((d) => ({
        email: d.data().email,
        fullName: d.data().fullName,
        firstName: firstNameFrom(d.data().fullName),
        institution: d.data().university,
        round: d.data().round || 'prior',
        deliveryStatus: d.data().deliveryStatus || null,
        targetKind: 'registrant',
      }))
      .filter((r) => isValidEmail(r.email))
      .filter((r) => !isSuppressedRegistrant(r.deliveryStatus))
      .filter((r) => filter === 'all' || r.round === filter)
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
      batch.create(queueRef.doc(r.emailLower), {
        email: r.email,
        emailLower: r.emailLower,
        targetKind: r.targetKind,
        fullName: r.fullName || '',
        firstName: r.firstName || '',
        institution: r.institution || '',
        rank: r.rank || '',
        cfHandle: r.cfHandle || '',
        status: 'queued',
        attemptCount: 0,
        sortKey: i + idx,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }
}

async function queueStats(queueRef) {
  const countFor = async (query) => {
    const snap = await query.count().get();
    return snap.data().count || 0;
  };

  const [
    total,
    sent,
    failed,
    skipped,
    queued,
    sending,
    outreachSent,
    outreachFailed,
    outreachSkipped,
  ] = await Promise.all([
    countFor(queueRef),
    countFor(queueRef.where('status', '==', 'sent')),
    countFor(queueRef.where('status', '==', 'failed')),
    countFor(queueRef.where('status', '==', 'skipped')),
    countFor(queueRef.where('status', '==', 'queued')),
    countFor(queueRef.where('status', '==', 'sending')),
    countFor(queueRef.where('targetKind', '==', 'outreach').where('status', '==', 'sent')),
    countFor(queueRef.where('targetKind', '==', 'outreach').where('status', '==', 'failed')),
    countFor(queueRef.where('targetKind', '==', 'outreach').where('status', '==', 'skipped')),
  ]);

  const stats = {
    total,
    sent,
    failed,
    skipped,
    queued,
    sending,
    processed: 0,
    remaining: 0,
    outreachSent,
    outreachFailed,
    outreachSkipped,
  };

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

async function claimQueueDocs(queueRef, limit) {
  const queuedSnap = await queueRef
    .where('status', '==', 'queued')
    .limit(limit)
    .get();
  if (queuedSnap.docs.length >= limit) {
    return queuedSnap.docs.sort((a, b) => Number(a.data().sortKey || 0) - Number(b.data().sortKey || 0));
  }

  const failedSnap = await queueRef
    .where('status', '==', 'failed')
    .limit(limit - queuedSnap.docs.length)
    .get();
  return [...queuedSnap.docs, ...failedSnap.docs]
    .sort((a, b) => Number(a.data().sortKey || 0) - Number(b.data().sortKey || 0));
}

async function recheckOutreachRecipients(claimedDocs) {
  const sendable = [];
  const skipped = [];

  await Promise.all(claimedDocs.map(async ({ ref, data }) => {
    if (!isValidEmail(data.email)) {
      await ref.update({
        status: 'skipped',
        skippedReason: 'invalid_email',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      skipped.push({ ref, data });
      return;
    }

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

  const bySortKey = (a, b) => Number(a.data.sortKey || 0) - Number(b.data.sortKey || 0);
  return {
    sendable: sendable.sort(bySortKey),
    skipped: skipped.sort(bySortKey),
  };
}

async function resetStaleSending(queueRef) {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - STALE_SENDING_MS);
  const snap = await queueRef
    .where('status', '==', 'sending')
    .limit(FIRESTORE_WRITE_CHUNK)
    .get();
  const stale = snap.docs
    .map((doc) => ({ ref: doc.ref, data: doc.data() }))
    .filter(({ data }) => {
      const startedMs = data.startedAt?.toMillis ? data.startedAt.toMillis() : 0;
      return startedMs > 0 && startedMs < cutoff.toMillis();
    });

  if (stale.length > 0) {
    await updateQueueStatus(stale, {
      status: 'failed',
      error: 'Send attempt became stale before completion. Retry may be needed.',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return stale.length;
}

async function acquireProcessingLease(lockRef, leaseId) {
  const now = Date.now();
  const leaseUntil = admin.firestore.Timestamp.fromMillis(now + PROCESSING_LEASE_MS);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(lockRef);
    if (!snap.exists) return false;
    const data = snap.data() || {};
    const currentLeaseUntil = data.processingLeaseUntil?.toMillis ? data.processingLeaseUntil.toMillis() : 0;
    const currentLeaseId = data.processingLeaseId || null;
    if (currentLeaseUntil > now && currentLeaseId && currentLeaseId !== leaseId) {
      return false;
    }
    tx.update(lockRef, {
      processingLeaseId: leaseId,
      processingLeaseUntil: leaseUntil,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  });
}

async function releaseProcessingLease(lockRef, leaseId) {
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      if (!snap.exists) return;
      const data = snap.data() || {};
      if (data.processingLeaseId !== leaseId) return;
      tx.update(lockRef, {
        processingLeaseId: admin.firestore.FieldValue.delete(),
        processingLeaseUntil: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch {
    // Lease expiry is the fallback; do not fail a completed send path for cleanup.
  }
}

async function initializeBroadcast({ lockRef, queueRef, broadcastId, subjectText, bodyText, filter, resolvedTargetType, attachment, rankRecipients, decoded, reqId, handlerStart }) {
  const { recipients, registrantAttempted, outreachAttempted, outreachSuppressed } =
    await buildRecipientSnapshot(resolvedTargetType, filter, rankRecipients);
  const mode = attachment ? 'queued_attachment' : 'queued_batch';

  try {
    await lockRef.create({
      status: recipients.length === 0 ? 'complete' : 'initializing',
      mode,
      subject: subjectText,
      bodyHash: shortHash(bodyText),
      filter,
      targetType: resolvedTargetType,
      attachment: attachment || null,
      total: recipients.length,
      queuedCount: 0,
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
    await lockRef.update({
      status: 'in_progress',
      queuedCount: recipients.length,
      queueReadyAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
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
      attachment: attachment || null,
      mode,
      durationMs: Date.now() - handlerStart,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  }

  return true;
}

async function completeBroadcastIfDone({ lockRef, queueRef, decoded, reqId, broadcastId, subjectText, filter, resolvedTargetType, lockData, handlerStart }) {
  const stats = await queueStats(queueRef);
  const queueIncomplete = Number(lockData?.total || 0) > stats.total;
  const done = !queueIncomplete && stats.queued === 0 && stats.failed === 0 && stats.sending === 0;
  const outreachTotal = lockData?.outreachAttempted || 0;
  const registrantTotal = lockData?.registrantAttempted || 0;
  const expectedTotal = Math.max(Number(lockData?.total || 0), stats.total);

  await lockRef.update({
    status: queueIncomplete ? 'paused' : done ? 'complete' : 'in_progress',
    total: expectedTotal,
    sent: stats.sent,
    emailsFailed: stats.failed,
    skipped: stats.skipped,
    outreachSent: stats.outreachSent,
    outreachFailed: stats.outreachFailed,
    outreachSkipped: stats.outreachSkipped,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(queueIncomplete ? { error: `Broadcast queue incomplete: ${stats.total}/${expectedTotal} recipients queued.` } : {}),
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
      total: expectedTotal,
      filter,
      targetType: resolvedTargetType,
      attempted: expectedTotal,
      failed: stats.failed,
      outreachAttempted: outreachTotal,
      outreachSuppressed: lockData?.outreachSuppressed || 0,
      outreachSent: stats.outreachSent,
      outreachFailed: stats.outreachFailed,
      outreachSkipped: stats.outreachSkipped,
      outreachMarkFailed: lockData?.outreachMarkFailed || 0,
      registrantAttempted: registrantTotal,
      attachment: lockData?.attachment || null,
      mode: lockData?.mode || 'queued_batch',
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
export const config = { api: { responseLimit: false, bodyParser: { sizeLimit: '2mb' } } };

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
  const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
  const { subject, body, roundFilter, broadcastId, targetType, batchSize, attachment: rawAttachment, rankRecipients } = requestBody;

  const requestedTargetType = String(targetType || 'registrants');
  const isRankCsvBroadcast = requestedTargetType === 'rankCsv';

  if (!subject?.trim() || (!isRankCsvBroadcast && !body?.trim())) {
    return res.status(400).json({ error: isRankCsvBroadcast ? 'Subject is required.' : 'Subject and body are required.' });
  }
  if (isRankCsvBroadcast && normalizeRankRecipients(rankRecipients).length === 0) {
    return res.status(400).json({ error: 'Rank CSV broadcast needs valid rows with Email and Rank.' });
  }

  if (!broadcastId || typeof broadcastId !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(broadcastId)) {
    return res.status(400).json({ error: 'broadcastId required (8-64 URL-safe chars).' });
  }

  const validFilters = ['all', 'prior', 'posterior', 'convergence'];
  if (!validFilters.includes(roundFilter)) {
    return res.status(400).json({ error: 'Invalid roundFilter.' });
  }
  const filter = roundFilter;
  const validTargetTypes = ['registrants', 'outreach', 'both', 'rankCsv'];
  const resolvedTargetType = validTargetTypes.includes(requestedTargetType) ? requestedTargetType : 'registrants';
  let attachment = null;
  try {
    attachment = normalizeAttachment(rawAttachment);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Invalid attachment.' });
  }

  const parsedBatchSize = Number(batchSize ?? BATCH_SIZE);

  if (!Number.isInteger(parsedBatchSize) || parsedBatchSize < 1) {
    return res.status(400).json({ error: 'batchSize must be a positive integer.' });
  }

  const resolvedBatchSize = attachment
    ? Math.min(parsedBatchSize, ATTACHMENT_BATCH_SIZE)
    : Math.min(parsedBatchSize, BATCH_SIZE);
  const subjectText = subject.trim();
  const normalizedRankRecipients = isRankCsvBroadcast ? normalizeRankRecipients(rankRecipients) : [];
  const rankBodyHash = normalizedRankRecipients.map((r) => `${r.emailLower}:${r.rank}`).join('|');
  const bodyText = isRankCsvBroadcast ? `__PRIOR_RANK_CSV__:${shortHash(rankBodyHash)}` : body.trim();
  const lockRef = db.collection('_broadcasts').doc(broadcastId);
  const queueRef = lockRef.collection('recipients');
  let activeLeaseId = null;

  try {
    const initialized = await initializeBroadcast({
      lockRef,
      queueRef,
      broadcastId,
      subjectText,
      bodyText,
      filter,
      resolvedTargetType,
      attachment,
      rankRecipients,
      decoded,
      reqId,
      handlerStart,
    });
    const isRetryOrContinuation = initialized === false;

    const lockSnap = await lockRef.get();
    if (!lockSnap.exists) {
      return res.status(409).json({ error: 'This broadcast is already being prepared.' });
    }
    const lockData = lockSnap.data() || {};
    if (lockData.status === 'initializing') {
      return res.status(409).json({ error: 'This broadcast queue is still being prepared. Try again in a moment.' });
    }
    if (isRetryOrContinuation && !['in_progress', 'paused', 'complete', 'failed'].includes(String(lockData.status || ''))) {
      return res.status(409).json({ error: 'This broadcast is not in a resumable state.' });
    }

    if (lockData.subject !== subjectText || lockData.targetType !== resolvedTargetType || lockData.filter !== filter) {
      return res.status(409).json({ error: 'This broadcast ID belongs to a different message or target.' });
    }
    if (lockData.bodyHash && lockData.bodyHash !== shortHash(bodyText)) {
      return res.status(409).json({ error: 'This broadcast ID belongs to a different message body.' });
    }
    if (!attachmentsEqual(lockData.attachment || null, attachment)) {
      return res.status(409).json({ error: 'This broadcast ID belongs to a different attachment.' });
    }

    const staleReset = await resetStaleSending(queueRef);
    if (staleReset > 0) {
      await lockRef.update({
        status: 'paused',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: `${staleReset} stale in-flight recipient(s) were marked retryable.`,
      }).catch(() => {});
    }

    const preStats = await queueStats(queueRef);
    if (Number(lockData.total || 0) > 0 && preStats.total > 0 && preStats.total < Number(lockData.total || 0)) {
      await lockRef.update({
        status: 'paused',
        error: `Broadcast queue incomplete: ${preStats.total}/${Number(lockData.total || 0)} recipients queued.`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {});
      return res.status(409).json({
        error: 'Broadcast queue is incomplete. Start a new broadcast after checking Firestore, or rebuild the queue before continuing.',
      });
    }
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
        mode: lockData.mode || (attachment ? 'queued_attachment' : 'queued_batch'),
        attachment: lockData.attachment || null,
      });
    }

    const batchId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const leaseAcquired = await acquireProcessingLease(lockRef, batchId);
    if (!leaseAcquired) {
      return res.status(200).json({
        success: true,
        sent: preStats.sent,
        sentThisBatch: 0,
        emailsFailed: preStats.failed,
        failedThisBatch: 0,
        failed: preStats.failed,
        skipped: preStats.skipped,
        skippedThisBatch: 0,
        attempted: preStats.total,
        total: preStats.total,
        processed: preStats.processed,
        remaining: preStats.remaining,
        targetType: resolvedTargetType,
        batchAttempted: 0,
        batchNumber: Math.max(1, Math.ceil(preStats.processed / resolvedBatchSize)),
        totalBatches: Math.ceil(preStats.total / resolvedBatchSize),
        done: false,
        noClaim: true,
        inProgress: true,
        retryAfterMs: 1000,
        outreachAttempted: lockData.outreachAttempted || 0,
        outreachSuppressed: lockData.outreachSuppressed || 0,
        outreachSent: preStats.outreachSent,
        outreachFailed: preStats.outreachFailed,
        outreachSkipped: preStats.outreachSkipped,
        outreachMarkFailed: lockData.outreachMarkFailed || 0,
        registrantAttempted: lockData.registrantAttempted || 0,
        mode: lockData.mode || (attachment ? 'queued_attachment' : 'queued_batch'),
        attachment: lockData.attachment || null,
      });
    }
    activeLeaseId = batchId;

    const claimDocs = await claimQueueDocs(queueRef, resolvedBatchSize);

    if (claimDocs.length === 0) {
      await releaseProcessingLease(lockRef, batchId);
      const latestLock = await lockRef.get().catch(() => lockSnap);
      const latestLockData = latestLock?.data() || lockData;
      const latestStats = await queueStats(queueRef);
      if (latestStats.total === 0 || (latestStats.queued === 0 && latestStats.failed === 0 && latestStats.sending === 0)) {
        const finalStats = await completeBroadcastIfDone({
          lockRef,
          queueRef,
          decoded,
          reqId,
          broadcastId,
          subjectText,
          filter,
          resolvedTargetType,
          lockData: latestLockData,
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
          outreachAttempted: latestLockData.outreachAttempted || 0,
          outreachSuppressed: latestLockData.outreachSuppressed || 0,
          outreachSent: finalStats.outreachSent,
          outreachFailed: finalStats.outreachFailed,
          outreachSkipped: finalStats.outreachSkipped,
          outreachMarkFailed: latestLockData.outreachMarkFailed || 0,
          registrantAttempted: latestLockData.registrantAttempted || 0,
          mode: latestLockData.mode || (attachment ? 'queued_attachment' : 'queued_batch'),
          attachment: latestLockData.attachment || null,
        });
      }

      return res.status(200).json({
        success: true,
        sent: latestStats.sent,
        sentThisBatch: 0,
        emailsFailed: latestStats.failed,
        failedThisBatch: 0,
        failed: latestStats.failed,
        skipped: latestStats.skipped,
        skippedThisBatch: 0,
        attempted: latestStats.total,
        total: latestStats.total,
        processed: latestStats.processed,
        remaining: latestStats.remaining,
        targetType: resolvedTargetType,
        batchAttempted: 0,
        batchNumber: Math.max(1, Math.ceil(latestStats.processed / resolvedBatchSize)),
        totalBatches: Math.ceil(latestStats.total / resolvedBatchSize),
        done: false,
        noClaim: true,
        inProgress: latestStats.sending > 0,
        retryAfterMs: 1000,
        outreachAttempted: latestLockData.outreachAttempted || 0,
        outreachSuppressed: latestLockData.outreachSuppressed || 0,
        outreachSent: latestStats.outreachSent,
        outreachFailed: latestStats.outreachFailed,
        outreachSkipped: latestStats.outreachSkipped,
        outreachMarkFailed: latestLockData.outreachMarkFailed || 0,
        registrantAttempted: latestLockData.registrantAttempted || 0,
        mode: latestLockData.mode || (attachment ? 'queued_attachment' : 'queued_batch'),
        attachment: latestLockData.attachment || null,
      });
    }

    const claimedDocs = claimDocs.map((doc) => ({ ref: doc.ref, data: doc.data() }));
    await updateQueueStatus(claimedDocs, {
      status: 'sending',
      batchId,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      attemptCount: admin.firestore.FieldValue.increment(1),
      error: admin.firestore.FieldValue.delete(),
    });

    const { sendable, skipped } = await recheckOutreachRecipients(claimedDocs);

    let sentThisBatch = 0;
    let failedThisBatch = 0;
    let outreachMarkFailed = 0;
    let successfulSendable = [];

    if (sendable.length > 0) {
      const chunk = sendable.map(({ data }) => {
        const template = data.targetKind === 'rankCsv'
          ? priorRankEmail({ subject: subjectText, fullName: data.fullName, rank: data.rank })
          : broadcastEmail({
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

      if (attachment) {
        const signedAttachment = await signedAttachmentForResend(attachment);
        for (let i = 0; i < sendable.length; i += 1) {
          const item = sendable[i];
          const result = await sendSingleEmailWithRetry({
            ...chunk[i],
            attachments: [signedAttachment],
          }, {
            idempotencyKey: `broadcast/${broadcastId}/recipient/${shortHash(item.data.emailLower)}`,
          });

          if (result.failed > 0) {
            failedThisBatch += 1;
            await item.ref.update({
              status: 'failed',
              error: (result.err?.message || 'resend attachment send failed').slice(0, 500),
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            sentThisBatch += 1;
            successfulSendable.push(item);
            await item.ref.update({
              status: 'sent',
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          if (i + 1 < sendable.length) {
            await delay(resendSafeDelayMs());
          }
        }
      } else {
        const batchKey = shortHash(sendable.map(({ data }) => data.emailLower).sort().join('|'));
        const result = await sendBatchWithRetry(chunk, {
          idempotencyKey: `broadcast/${broadcastId}/batch/${batchKey}`,
        });
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
          await releaseProcessingLease(lockRef, batchId);

          return res.status(502).json({
            success: false,
            error: 'Broadcast batch failed. Retry will continue this broadcast without resending successful batches.',
            retryable: true,
          });
        }

        sentThisBatch = sendable.length;
        successfulSendable = sendable;
        await updateQueueStatus(sendable, {
          status: 'sent',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      if (failedThisBatch > 0) {
        logger.warn('admin', attachment ? 'broadcast_attachment_batch_partial_failed' : 'broadcast_batch_partial_failed', {
          reqId,
          actorId: decoded.uid,
          detail: { batchId, failed: failedThisBatch, sent: sentThisBatch, filter },
          status: 'degraded',
        });
      }

      const outreachRecipients = sendable
        .map(({ data }) => data)
        .filter((r) => r.targetKind === 'outreach');
      const successfulEmails = new Set(successfulSendable.map(({ data }) => data.emailLower));
      const successfulOutreachRecipients = outreachRecipients.filter((r) => successfulEmails.has(r.emailLower));
      if (successfulOutreachRecipients.length > 0) {
        const markResult = await markOutreachSent(successfulOutreachRecipients, broadcastId);
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
        detail: { batchId, count: sentThisBatch, failed: failedThisBatch, skipped: skipped.length, filter, mode: attachment ? 'attachment' : 'batch' },
        status: 'ok',
      });

      if (attachment && failedThisBatch > 0) {
        await lockRef.update({
          status: 'paused',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: `${failedThisBatch} attachment recipient(s) failed in this chunk.`,
        }).catch(() => {});
        await releaseProcessingLease(lockRef, batchId);

        return res.status(502).json({
          success: false,
          error: 'Attachment broadcast partially failed. Retry will continue this broadcast without resending successful recipients.',
          retryable: true,
        });
      }
    }

    if (outreachMarkFailed > 0) {
      await lockRef.update({
        outreachMarkFailed: admin.firestore.FieldValue.increment(outreachMarkFailed),
      }).catch(() => {});
    }
    await releaseProcessingLease(lockRef, batchId);

    const finalLock = await lockRef.get().catch(() => lockSnap);
    const finalLockData = finalLock?.data() || lockData;
    const finalStats = await completeBroadcastIfDone({
      lockRef,
      queueRef,
      decoded,
      reqId,
      broadcastId,
      subjectText,
      filter,
      resolvedTargetType,
      lockData: finalLockData,
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
      outreachMarkFailed: finalLockData.outreachMarkFailed || 0,
      registrantAttempted: lockData.registrantAttempted || 0,
      mode: lockData.mode || (attachment ? 'queued_attachment' : 'queued_batch'),
      attachment: lockData.attachment || null,
    });
  } catch (error) {
    logger.error('admin', 'broadcast_error', { reqId, actorId: decoded.uid, detail: { broadcastId }, status: 'failed' }, error);
    if (activeLeaseId) {
      await releaseProcessingLease(lockRef, activeLeaseId);
    }
    await lockRef.update({
      status: 'paused',
      error: error.message?.slice(0, 500) || 'unknown',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
    return res.status(500).json({ error: 'Broadcast failed.' });
  }
}
