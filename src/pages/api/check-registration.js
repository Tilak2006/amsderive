import * as admin from 'firebase-admin';
import crypto from 'crypto';
import logger, { genReqId } from '../../utils/logger';

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
const MAX_REGISTRATIONS = 10000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const reqId = genReqId();

  // Rate limit — 10 checks/hour per IP. UA is spoofable and was removed to close a bypass.
  // clientId (from localStorage) is only used as an extra key to separate honest devices on shared NAT;
  // it is NEVER trusted as a security boundary.
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString().split(',')[0].trim();
  const rawClientId = typeof req.body.clientId === 'string' ? req.body.clientId.slice(0, 64) : '';
  const ipHash = crypto.createHash('sha256')
    .update(rawClientId ? `${clientIp}|${rawClientId}` : (clientIp || 'unknown'))
    .digest('hex');
  const rateLimitRef = db.collection('_rate_limits').doc(`check-reg_${ipHash}`);
  const oneHourAgo = Date.now() - RATE_LIMIT_WINDOW_MS;

  try {
    const rateResult = await db.runTransaction(async (tx) => {
      const doc = await tx.get(rateLimitRef);
      const recent = (doc.exists ? doc.data().timestamps || [] : []).filter((ts) => ts > oneHourAgo);
      if (recent.length >= RATE_LIMIT_MAX) return { allowed: false };
      recent.push(Date.now());
      tx.set(rateLimitRef, { timestamps: recent });
      return { allowed: true };
    });

    if (!rateResult.allowed) {
      return res.status(429).json({ allowed: false, error: 'Too many requests. Please try again later.' });
    }
  } catch {
    // Fail open — don't block legitimate users if rate limit check errors
  }

  const { email, codeforcesHandle } = req.body;

  // Validate inputs
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ allowed: false, error: 'Invalid email.' });
  }
  if (!codeforcesHandle || typeof codeforcesHandle !== 'string') {
    return res.status(400).json({ allowed: false, error: 'Invalid Codeforces handle.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedHandle = codeforcesHandle.trim();

  // Validate formats
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ allowed: false, error: 'Invalid email format.' });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(normalizedHandle) || normalizedHandle.length > 24) {
    return res.status(400).json({ allowed: false, error: 'Invalid Codeforces handle format.' });
  }

  try {
    const registrantsRef = db.collection('registrants');

    // Cap check + duplicate check in parallel
    const [countSnap, emailSnap, cfSnap] = await Promise.all([
      registrantsRef.count().get(),
      registrantsRef.where('emailLower', '==', normalizedEmail).limit(1).get(),
      registrantsRef.where('codeforcesHandle', '==', normalizedHandle).limit(1).get(),
    ]);

    // Cap check
    if (countSnap.data().count >= MAX_REGISTRATIONS) {
      return res.status(200).json({ allowed: false, error: 'Registrations are now closed.' });
    }

    // Evaluate both results before returning — prevents timing side-channel
    // (both queries already ran in parallel above; we just must not short-circuit here)
    const emailTaken = !emailSnap.empty;
    const cfTaken = !cfSnap.empty;

    if (emailTaken || cfTaken) {
      logger.warn('registration', 'duplicate_check_blocked', {
        reqId,
        detail: { reason: emailTaken ? 'email_exists' : 'cf_handle_exists' },
        status: 'blocked',
      });
      // Generic message — does not reveal which field matched
      return res.status(200).json({ allowed: false, error: 'These details are already registered.' });
    }

    return res.status(200).json({ allowed: true });
  } catch (error) {
    logger.error('registration', 'duplicate_check_error', { reqId, status: 'failed' }, error);
    return res.status(500).json({ allowed: false, error: 'Failed to verify registration. Please try again.' });
  }
}
