import * as admin from 'firebase-admin';
import crypto from 'crypto';
import { resend } from '../../lib/resend';
import { registrationConfirmationEmail } from '../../emails/templates';

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
const MAX_REGISTRATIONS = 3000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      return res.status(429).json({ success: false, error: rateResult.error });
    }
  } catch (error) {
    console.error('[submit-registration] Rate limit error:', error);
    return res.status(500).json({ success: false, error: 'Rate limit check failed.' });
  }

  const {
    fullName, email, university, codeforcesHandle, phoneNumber,
    linkedIn, gitHub, dataConsent, resumeUrl, resumeFileName,
    transcriptUrl, transcriptFileName, refCode,
  } = req.body;

  // Server-side validation — never trust client
  if (!fullName || !email || !university || !codeforcesHandle || !phoneNumber ||
    !resumeUrl || !transcriptUrl || !linkedIn || dataConsent !== true) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
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

  // Run cap check and Codeforces validation in parallel
  const capCheckPromise = db.collection('registrants').count().get()
    .then((snap) => snap.data().count)
    .catch((err) => {
      console.error('[submit-registration] Cap check failed:', err);
      return null; // Continue if count fails — don't block registration on metadata failure
    });

  const cfCheckPromise = (async () => {
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
      console.warn(`[submit-registration] Codeforces API check failed for handle '${cfHandle}':`, error.message);
    }
    return { valid: true };
  })();

  const [registrantCount, cfResult] = await Promise.all([capCheckPromise, cfCheckPromise]);

  if (registrantCount !== null && registrantCount >= MAX_REGISTRATIONS) {
    return res.status(403).json({ success: false, error: 'Registrations are now closed.' });
  }

  if (!cfResult.valid) {
    return res.status(400).json({
      success: false,
      error: 'Codeforces handle not found. Please check your handle and try again.',
    });
  }

  try {
    const docRef = await db.collection('registrants').add({
      fullName: fullName.trim(),
      email: normalizedEmail,
      emailLower: normalizedEmail,
      university: university.trim(),
      resumeUrl,
      resumeFileName: resumeFileName || null,
      transcriptUrl,
      transcriptFileName: transcriptFileName || null,
      codeforcesHandle: codeforcesHandle.trim(),
      phoneNumber: phoneNumber.trim(),
      linkedIn: linkedIn?.trim() || null,
      gitHub: gitHub?.trim() || null,
      dataConsent: true,
      ipHash,
      refCode: refCode?.trim() || null,
      round: 'prior',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Fire off stats update and confirmation email concurrently — failures must NOT fail the registration
    await Promise.allSettled([
      db.collection('stats').doc('leaderboard').set(
        { [university.trim()]: admin.firestore.FieldValue.increment(1) },
        { merge: true }
      ).catch((statsErr) => {
        console.error('[submit-registration] Leaderboard stats update failed:', statsErr.message);
      }),
      (async () => {
        try {
          const { from, subject, html } = registrationConfirmationEmail({
            fullName: fullName.trim(),
            codeforcesHandle: codeforcesHandle.trim(),
            university: university.trim(),
          });
          await resend.emails.send({ from, to: normalizedEmail, subject, html });
          console.info(`[submit-registration] Confirmation email sent: ${normalizedEmail}`);
        } catch (emailErr) {
          console.error(`[submit-registration] Confirmation email failed: ${normalizedEmail}`, emailErr.message);
        }
      })(),
    ]);

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('[submit-registration] Error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
}
