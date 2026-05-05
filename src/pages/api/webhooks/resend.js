import { createHmac, timingSafeEqual } from 'crypto';
import * as admin from 'firebase-admin';
import logger from '../../../utils/logger';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Resend uses Svix for webhook delivery. We verify the signature without adding
// the svix package — the algorithm is HMAC-SHA256 over "{svix-id}.{svix-timestamp}.{body}",
// with the base64-decoded webhook secret as the key.
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySvixSignature(rawBody, headers, secret) {
  const msgId = headers['svix-id'];
  const msgTimestamp = headers['svix-timestamp'];
  const msgSignature = headers['svix-signature'];

  if (!msgId || !msgTimestamp || !msgSignature) return false;

  // Replay-attack protection — reject if timestamp is > 5 min old
  const tsNum = parseInt(msgTimestamp, 10);
  if (isNaN(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const toSign = `${msgId}.${msgTimestamp}.${rawBody.toString('utf8')}`;
  const computed = 'v1,' + createHmac('sha256', secretBytes).update(toSign).digest('base64');

  // svix-signature may contain multiple space-separated candidate signatures
  return msgSignature.split(' ').some((sig) => {
    try {
      const a = Buffer.from(computed);
      const b = Buffer.from(sig);
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

// Terminal states are never overwritten — a bounced approval email stays bounced
// even if a later broadcast email delivers successfully.
const TERMINAL_STATUSES = new Set(['bounced', 'complained']);

const EVENT_TO_STATUS = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'delayed',
};

function isTerminalStatus(status) {
  return TERMINAL_STATUSES.has(String(status || '').toLowerCase());
}

async function updateDeliveryStatus(docRef, currentData, newStatus) {
  if (isTerminalStatus(currentData.deliveryStatus)) {
    return false;
  }

  await docRef.update({
    deliveryStatus: newStatus,
    deliveryStatusAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('webhook', 'missing_webhook_secret', { status: 'misconfigured' });
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const rawBody = await getRawBody(req);

  if (!verifySvixSignature(rawBody, req.headers, secret)) {
    logger.warn('webhook', 'signature_verification_failed', { status: 'blocked' });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Idempotency — Resend retries failed deliveries. A second delivery of the same event
  // would overwrite deliveryStatus with an older state. Store svix-id to deduplicate.
  const svixId = req.headers['svix-id'];
  if (svixId) {
    try {
      const idRef = db.collection('_webhook_ids').doc(svixId);
      const already = await idRef.get();
      if (already.exists) {
        logger.info('webhook', 'duplicate_ignored', { detail: { svixId }, status: 'ok' });
        return res.status(200).json({ ok: true, duplicate: true });
      }
      // Mark as processed — TTL 7 days (enable TTL on _webhook_ids.expiresAt in Firebase Console)
      await idRef.set({
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    } catch (err) {
      // Fail open — a dedup miss is far less harmful than dropping a real event
      logger.warn('webhook', 'dedup_check_failed', { detail: { svixId, message: err.message }, status: 'degraded' });
    }
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const eventType = event.type;
  const newStatus = EVENT_TO_STATUS[eventType];

  if (!newStatus) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const emailAddress = Array.isArray(event.data?.to) ? event.data.to[0] : event.data?.to;
  const resendEmailId = event.data?.email_id || null;

  if (!emailAddress) {
    return res.status(400).json({ error: 'Missing to address in event' });
  }

  const normalizedEmail = emailAddress.trim().toLowerCase();

  try {
    const registrantSnapshot = await db.collection('registrants')
      .where('emailLower', '==', normalizedEmail)
      .limit(1)
      .get();

    const outreachSnapshot = await db.collection('outreach_contacts')
      .where('emailLower', '==', normalizedEmail)
      .limit(1)
      .get();

    if (registrantSnapshot.empty && outreachSnapshot.empty) {
      return res.status(200).json({ ok: true, notFound: true });
    }

    const updated = [];

    if (!registrantSnapshot.empty) {
      const doc = registrantSnapshot.docs[0];
      const data = doc.data();
      if (data.status === 'approved' && await updateDeliveryStatus(doc.ref, data, newStatus)) {
        updated.push({ collectionName: 'registrants', docId: doc.id });
      }
    }

    if (!outreachSnapshot.empty) {
      const doc = outreachSnapshot.docs[0];
      const data = doc.data();
      const currentStatus = String(data.deliveryStatus || '').toLowerCase();
      // If a registrant with the same email exists, only update outreach when
      // this contact was actually sent through outreach. This avoids a normal
      // registrant broadcast turning a never-contacted outreach row green.
      const shouldUpdateOutreach = registrantSnapshot.empty || currentStatus === 'sent' || currentStatus === 'delayed';
      if (shouldUpdateOutreach && await updateDeliveryStatus(doc.ref, data, newStatus)) {
        updated.push({ collectionName: 'outreach_contacts', docId: doc.id });
      }
    }

    if (updated.length === 0) {
      return res.status(200).json({ ok: true, skipped: 'no_eligible_document' });
    }

    logger.info('webhook', 'delivery_status_updated', {
      actorId: 'resend',
      detail: { eventType, newStatus, resendEmailId, updated },
      status: 'ok',
    });

    // Persist permanent failures to audit log so they outlive Vercel log retention.
    if (newStatus === 'bounced' || newStatus === 'complained') {
      await Promise.all(updated.map((u) => db.collection('_audit_log').add({
        type: newStatus === 'bounced' ? 'email_bounced' : 'email_complained',
        actorId: 'resend_webhook',
        entityId: u.docId,
        collectionName: u.collectionName,
        resendEmailId,
        eventType,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {})));
    }

    return res.status(200).json({ ok: true, updated: newStatus, documents: updated.length });
  } catch (error) {
    logger.error('webhook', 'delivery_status_update_failed', { status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to update delivery status' });
  }
}
