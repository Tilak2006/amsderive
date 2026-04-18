import * as admin from 'firebase-admin';
import crypto from 'crypto';
import logger, { genReqId, maskEmail } from '../../utils/logger';
import { REGISTRATION_OPENS } from '../../lib/constants';

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

function instSlug(university) {
  return university.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (Date.now() < REGISTRATION_OPENS.getTime()) {
    return res.status(403).json({ success: false, error: 'Registration has not opened yet.' });
  }

  const reqId = genReqId();
  const handlerStart = Date.now();

  // Rate-limit key is hashed from IP only. UA is trivially spoofable → including it lets
  // attackers rotate UA to bypass the limit entirely.
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString()
    .split(',')[0]
    .trim();
  const ipHash = crypto.createHash('sha256').update(clientIp || 'unknown').digest('hex');

  // IP soft throttle — 10/hour. Never hard-blocks alone; campus WiFi (many students,
  // one NAT IP) won't get locked out. Sets ipOverLimit flag for combined-abuse detection.
  let ipOverLimit = false;
  try {
    const rateLimitRef = db.collection('_rate_limits').doc(ipHash);
    const MAX_PER_HOUR = 10;

    ipOverLimit = await db.runTransaction(async (transaction) => {
      const rateLimitDoc = await transaction.get(rateLimitRef);
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const timestamps = rateLimitDoc.exists ? rateLimitDoc.data().timestamps || [] : [];
      const recent = timestamps.filter((ts) => ts > oneHourAgo);
      const over = recent.length >= MAX_PER_HOUR;
      recent.push(Date.now());
      transaction.set(rateLimitRef, { timestamps: recent });
      return over;
    });

    if (ipOverLimit) {
      logger.warn('registration', 'ip_soft_throttle', { reqId, actorId: ipHash, status: 'soft_throttle' });
    }
  } catch (error) {
    // Fail open — IP is informational only; don't reject legit users on Firestore blip
    logger.error('registration', 'ip_rate_limit_error', { reqId, actorId: ipHash, status: 'degraded' }, error);
  }

  const {
    fullName, email, university, branch, graduationYear, codeforcesHandle, phoneNumber,
    linkedIn, gitHub, dataConsent, resumeUrl, resumeFileName,
    transcriptUrl, transcriptFileName, refCode,
  } = req.body;

  // Server-side validation — never trust client
  // linkedIn is required but handled separately so we can return a field-level error
  if (!fullName || !email || !university || !branch || !graduationYear || !codeforcesHandle || !phoneNumber ||
    !resumeUrl || !transcriptUrl || dataConsent !== true) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }

  const parsedYear = parseInt(graduationYear, 10);
  if (isNaN(parsedYear) || parsedYear < 2025 || parsedYear > 2035) {
    return res.status(400).json({ success: false, error: 'Invalid graduation year.' });
  }

  if (!linkedIn || !linkedIn.trim()) {
    return res.status(400).json({
      success: false,
      error: 'LinkedIn profile is required.',
      field: 'linkedIn',
    });
  }
  try {
    const liUrl = new URL(linkedIn.trim());
    if (!liUrl.hostname.endsWith('linkedin.com')) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid LinkedIn profile URL.',
        field: 'linkedIn',
      });
    }
  } catch {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid LinkedIn profile URL.',
      field: 'linkedIn',
    });
  }

  // Validate URL safety — strict hostname check to prevent domain spoofing
  const validDomains = ['firebasestorage.googleapis.com', 'storage.googleapis.com'];
  try {
    const resumeHostname = new URL(resumeUrl).hostname;
    const transcriptHostname = new URL(transcriptUrl).hostname;
    if (!validDomains.includes(resumeHostname) || !validDomains.includes(transcriptHostname)) {
      return res.status(400).json({ success: false, error: 'Invalid file URLs.' });
    }
  } catch (e) {
    return res.status(400).json({ success: false, error: 'Invalid file URLs.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cfHandle = codeforcesHandle.trim();

  // Per-identifier rate limit — defense in depth against IP rotation and enumeration.
  // Sliding window: 3 attempts per 30 min per email AND per CF handle.
  // Single transaction covers both docs so bursts from different IPs serialize cleanly.
  try {
    const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');
    const handleHash = crypto.createHash('sha256').update(cfHandle.toLowerCase()).digest('hex');
    const emailRef = db.collection('_rate_limits_email').doc(emailHash);
    const handleRef = db.collection('_rate_limits_handle').doc(handleHash);
    const windowStart = Date.now() - 30 * 60 * 1000;
    const MAX_PER_IDENTIFIER = 3;

    const identResult = await db.runTransaction(async (transaction) => {
      const [emailDoc, handleDoc] = await Promise.all([
        transaction.get(emailRef),
        transaction.get(handleRef),
      ]);

      const emailRecent = (emailDoc.exists ? emailDoc.data().timestamps || [] : [])
        .filter((ts) => ts > windowStart);
      const handleRecent = (handleDoc.exists ? handleDoc.data().timestamps || [] : [])
        .filter((ts) => ts > windowStart);

      if (emailRecent.length >= MAX_PER_IDENTIFIER) {
        return { allowed: false, reason: 'email_limit' };
      }
      if (handleRecent.length >= MAX_PER_IDENTIFIER) {
        return { allowed: false, reason: 'handle_limit' };
      }

      const now = Date.now();
      emailRecent.push(now);
      handleRecent.push(now);
      transaction.set(emailRef, { timestamps: emailRecent });
      transaction.set(handleRef, { timestamps: handleRecent });
      return { allowed: true };
    });

    if (!identResult.allowed) {
      // combined: true means IP is also over threshold — high-confidence scripted abuse
      logger.warn('registration', 'identifier_rate_limit_exceeded', {
        reqId,
        actorId: ipHash,
        detail: { reason: identResult.reason, combined: ipOverLimit },
        status: 'blocked',
      });
      return res.status(429).json({
        success: false,
        error: 'Too many attempts for this email or handle. Please try again in 30 minutes.',
      });
    }
  } catch (error) {
    logger.error('registration', 'identifier_rate_limit_error', { reqId, actorId: ipHash, status: 'failed' }, error);
    return res.status(500).json({ success: false, error: 'Rate limit check failed.' });
  }

  // Validate CF handle before the write transaction — fail open if CF is down
  const cfResult = await (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

      const cfRes = await fetch(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(cfHandle)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (cfRes.status === 400 || cfRes.status === 404 || cfRes.ok) {
        const cfData = await cfRes.json();
        if (cfData.status === 'FAILED') {
          return { valid: false };
        }
      }
    } catch (error) {
      // Fail open — log warning and proceed if CF API is flaky, down, or times out
      logger.warn('registration', 'cf_check_skipped', {
        reqId,
        actorId: ipHash,
        detail: { reason: error.message?.slice(0, 100) },
        status: 'degraded',
      });
    }
    return { valid: true };
  })();

  if (!cfResult.valid) {
    return res.status(400).json({
      success: false,
      error: 'Codeforces handle not found. Please check your handle and try again.',
    });
  }

  const registrantsRef = db.collection('registrants');
  const docRef = registrantsRef.doc(normalizedEmail);
  const cfHandleRef = db.collection('cfHandles').doc(cfHandle.toLowerCase());

  // Soft cap pre-check using aggregate count() — avoids a single-doc hotspot in the write
  // transaction (Firestore throttles >1 write/sec/doc). Under burst the cap may overshoot
  // by a few; acceptable at 10k.
  try {
    const countSnap = await registrantsRef.count().get();
    if ((countSnap.data().count || 0) >= MAX_REGISTRATIONS) {
      logger.warn('registration', 'cap_reached', { reqId, actorId: ipHash, status: 'blocked' });
      return res.status(403).json({ success: false, error: 'Registrations are now closed.' });
    }
  } catch (error) {
    // If the cap check itself errors, fall through — the transaction will still enforce
    // uniqueness and we'd rather accept than reject a legitimate registrant on Firestore blip.
    logger.warn('registration', 'cap_check_degraded', { reqId, actorId: ipHash, detail: { message: error.message }, status: 'degraded' });
  }

  // Atomic transaction: duplicate check + write — no TOCTOU window on email/handle
  let transactionResult;
  try {
    transactionResult = await db.runTransaction(async (transaction) => {
      const [existing, cfHandleDoc] = await Promise.all([
        transaction.get(docRef),
        transaction.get(cfHandleRef),
      ]);

      if (existing.exists) {
        return { written: false, reason: 'duplicate_email' };
      }

      if (cfHandleDoc.exists) {
        return { written: false, reason: 'duplicate_cf' };
      }

      transaction.set(docRef, {
        fullName: fullName.trim(),
        email: normalizedEmail,
        emailLower: normalizedEmail,
        university: university.trim(),
        branch: branch.trim(),
        graduationYear: parsedYear,
        resumeUrl,
        resumeFileName: resumeFileName || null,
        transcriptUrl,
        transcriptFileName: transcriptFileName || null,
        codeforcesHandle: cfHandle,
        phoneNumber: phoneNumber.trim(),
        linkedIn: linkedIn?.trim() || null,
        gitHub: gitHub?.trim() || null,
        dataConsent: true,
        ipHash,
        refCode: refCode?.trim() || null,
        round: 'prior',
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Sentinel doc — presence = handle is taken
      transaction.set(cfHandleRef, {
        emailRef: normalizedEmail,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { written: true };
    });
  } catch (error) {
    logger.error('registration', 'registration_failed', { reqId, actorId: ipHash, status: 'failed' }, error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }

  if (!transactionResult.written) {
    if (transactionResult.reason === 'duplicate_email') {
      logger.warn('registration', 'duplicate_rejected', { reqId, actorId: ipHash, status: 'blocked' });
      return res.status(409).json({ success: false, error: 'This email is already registered.' });
    }
    if (transactionResult.reason === 'duplicate_cf') {
      logger.warn('registration', 'duplicate_cf_rejected', { reqId, actorId: ipHash, status: 'blocked' });
      return res.status(409).json({ success: false, error: 'This Codeforces handle is already registered.' });
    }
  }

  try {
    logger.info('registration', 'registration_submitted', {
      reqId,
      entityId: docRef.id,
      actorId: ipHash,
      detail: { emailMasked: maskEmail(normalizedEmail), university: university.trim() },
      status: 'ok',
      durationMs: Date.now() - handlerStart,
    });

    // Fire off stats update and confirmation email concurrently — failures must NOT fail the registration
    // Hard caps prevent slow external calls from dragging response time under burst
    const withTimeout = (promise, ms) =>
      Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms))]);

    await Promise.allSettled([
      withTimeout(
        db.collection('stats_inst').doc(instSlug(university.trim())).set(
          { name: university.trim(), count: admin.firestore.FieldValue.increment(1) },
          { merge: true }
        ),
        3000
      ).catch((statsErr) => {
        logger.warn('registration', 'stats_update_failed', {
          reqId,
          entityId: docRef.id,
          actorId: ipHash,
          detail: { message: statsErr.message },
          status: 'degraded',
        });
      }),
    ]);

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    logger.error('registration', 'registration_failed', { reqId, actorId: ipHash, status: 'failed' }, error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
}
