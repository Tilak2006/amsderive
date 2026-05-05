import crypto from 'crypto';
import * as admin from 'firebase-admin';

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

function unsubscribeSecret() {
  return process.env.OUTREACH_UNSUBSCRIBE_SECRET ||
    process.env.RESEND_WEBHOOK_SECRET ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    'missing-unsubscribe-secret';
}

function tokenFor(email) {
  return crypto.createHmac('sha256', unsubscribeSecret()).update(email.trim().toLowerCase()).digest('hex');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'hex');
  const right = Buffer.from(String(b || ''), 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const email = String(req.query.email || '').trim().toLowerCase();
  const token = String(req.query.token || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !safeEqual(token, tokenFor(email))) {
    return res.status(400).send('Invalid unsubscribe link.');
  }

  try {
    await db.collection('outreach_contacts').doc(email).set({
      unsubscribed: true,
      unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send('<!doctype html><html><head><title>Unsubscribed</title><meta name="robots" content="noindex,nofollow"></head><body style="font-family:system-ui,sans-serif;background:#0a0a0a;color:#f0ede6;padding:40px;"><h1>You are unsubscribed.</h1><p>You will no longer receive AMS Derive outreach emails at this address.</p></body></html>');
  } catch {
    return res.status(500).send('Could not unsubscribe. Please try again later.');
  }
}
