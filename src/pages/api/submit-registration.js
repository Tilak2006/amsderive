import * as admin from 'firebase-admin';
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

  const { ipHash } = req.body;

  if (!ipHash || typeof ipHash !== 'string' || !/^[a-f0-9]{64}$/.test(ipHash)) {
    return res.status(400).json({ success: false, error: 'Invalid or missing fingerprint' });
  }

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

  // Pre-fetch count for cap check
  try {
    const countSnap = await db.collection('registrants').count().get();
    if (countSnap.data().count >= MAX_REGISTRATIONS) {
      return res.status(403).json({ success: false, error: 'Registrations are now closed.' });
    }
  } catch (err) {
    console.error('[submit-registration] Cap check failed:', err);
    // Continue if count fails — don't block registration on metadata failure
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

  // Verify Codeforces handle
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const cfRes = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(cfHandle)}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Only fail if CF explicitly says user not found
    if (cfRes.status === 400 || cfRes.status === 404) {
      const cfData = await cfRes.json();
      if (cfData.status === 'FAILED') {
        return res.status(400).json({
          success: false,
          error: 'Codeforces handle not found. Please check your handle and try again.'
        });
      }
    } else if (cfRes.ok) {
      const cfData = await cfRes.json();
      if (cfData.status === 'FAILED') {
        return res.status(400).json({
          success: false,
          error: 'Codeforces handle not found. Please check your handle and try again.'
        });
      }
    }
  } catch (error) {
    // Fail open — log warning and proceed if CF API is flaky, down, or times out
    console.warn(`[submit-registration] Codeforces API check failed for handle '${cfHandle}':`, error.message);
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
      ipHash: ipHash || null,
      refCode: refCode?.trim() || null,
      round: 'prior',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send confirmation email — failure must NOT fail the registration
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

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('[submit-registration] Error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
}
