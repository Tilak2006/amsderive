import * as admin from 'firebase-admin';
import crypto from 'crypto';
import { resend } from '../../lib/resend';
import { registrationConfirmationEmail } from '../../emails/templates';
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (Date.now() < REGISTRATION_OPENS.getTime()) {
    return res.status(403).json({ success: false, error: 'Registration has not opened yet.' });
  }

  const reqId = genReqId();
  const handlerStart = Date.now();

  // Generate IP hash server-side — never trust client-provided fingerprint
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString()
    .split(',')[0]
    .trim();
  const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');

  try {
    const rateLimitRef = db.collection('_rate_limits').doc(ipHash);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const MAX_PER_HOUR = 3;

    const rateResult = await db.runTransaction(async (transaction) => {
      const rateLimitDoc = await transaction.get(rateLimitRef);

      let timestamps = [];
      if (rateLimitDoc.exists) {
        timestamps = rateLimitDoc.data().timestamps || [];
      }

      const recent = timestamps.filter((ts) => ts > oneHourAgo);

      if (recent.length >= MAX_PER_HOUR) {
        return { allowed: false, error: 'Too many submissions. Please try again in an hour.' };
      }

      recent.push(Date.now());
      transaction.set(rateLimitRef, { timestamps: recent });

      return { allowed: true };
    });

    if (!rateResult.allowed) {
      logger.warn('registration', 'rate_limit_exceeded', { reqId, actorId: ipHash, status: 'blocked' });
      return res.status(429).json({ success: false, error: rateResult.error });
    }
    logger.info('registration', 'rate_limit_checked', { reqId, actorId: ipHash, status: 'ok' });
  } catch (error) {
    logger.error('registration', 'rate_limit_error', { reqId, actorId: ipHash, status: 'failed' }, error);
    return res.status(500).json({ success: false, error: 'Rate limit check failed.' });
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
  const statsRef = db.collection('stats').doc('global');

  // Atomic transaction: cap check + duplicate check + write — no TOCTOU window
  let transactionResult;
  try {
    transactionResult = await db.runTransaction(async (transaction) => {
      const [existing, statsDoc] = await Promise.all([
        transaction.get(docRef),
        transaction.get(statsRef),
      ]);

      const currentCount = statsDoc.exists ? (statsDoc.data().count || 0) : 0;
      if (currentCount >= MAX_REGISTRATIONS) {
        return { written: false, reason: 'cap_reached' };
      }

      if (existing.exists) {
        return { written: false, reason: 'duplicate_email' };
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

      transaction.set(statsRef, { count: currentCount + 1 }, { merge: true });

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
    if (transactionResult.reason === 'cap_reached') {
      logger.warn('registration', 'cap_reached', { reqId, actorId: ipHash, status: 'blocked' });
      return res.status(403).json({ success: false, error: 'Registrations are now closed.' });
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
    await Promise.allSettled([
      db.collection('stats').doc('leaderboard').set(
        { [university.trim()]: admin.firestore.FieldValue.increment(1) },
        { merge: true }
      ).catch((statsErr) => {
        logger.warn('registration', 'stats_update_failed', {
          reqId,
          entityId: docRef.id,
          actorId: ipHash,
          detail: { message: statsErr.message },
          status: 'degraded',
        });
      }),
      (async () => {
        try {
          const { from, subject, html } = registrationConfirmationEmail({
            fullName: fullName.trim(),
            codeforcesHandle: codeforcesHandle.trim(),
            university: university.trim(),
          });
          await resend.emails.send({ from, to: normalizedEmail, subject, html });
          logger.info('registration', 'confirmation_email_sent', {
            reqId,
            entityId: docRef.id,
            actorId: ipHash,
            detail: { emailMasked: maskEmail(normalizedEmail) },
            status: 'ok',
          });
        } catch (emailErr) {
          logger.warn('registration', 'confirmation_email_failed', {
            reqId,
            entityId: docRef.id,
            actorId: ipHash,
            detail: { emailMasked: maskEmail(normalizedEmail), message: emailErr.message },
            status: 'degraded',
          });
        }
      })(),
    ]);

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    logger.error('registration', 'registration_failed', { reqId, actorId: ipHash, status: 'failed' }, error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
}
