import * as admin from 'firebase-admin';
import crypto from 'crypto';
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
const SEND_TIMEOUT_MS = 15000;
const OUTREACH_SKIP_STATUSES = new Set(['sent', 'delivered', 'bounced', 'complained']);

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
  const { subject, body, roundFilter, broadcastId, targetType } = req.body;

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

  // Idempotency guard — atomic create prevents duplicate sends from double-clicks or retries.
  // Any concurrent second request hits ALREADY_EXISTS and is rejected before any email fires.
  const lockRef = db.collection('_broadcasts').doc(broadcastId);
  try {
    await lockRef.create({
      status: 'in_progress',
      subject: subject.trim(),
      filter,
      targetType: resolvedTargetType,
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

    const recipients = Array.from(recipientsByEmail.values());

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
        emailsFailed: 0,
        failed: 0,
        attempted: 0,
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
