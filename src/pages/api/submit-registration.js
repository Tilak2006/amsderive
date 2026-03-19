import * as admin from 'firebase-admin';

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
    fullName, email, university, codeforcesHandle, codechefHandle,
    linkedIn, gitHub, dataConsent, resumeUrl, resumeFileName,
    idCardUrl, idCardFileName, ipHash,
  } = req.body;

  // Server-side validation — never trust client
  if (!fullName || !email || !university || !codeforcesHandle ||
    !resumeUrl || !idCardUrl || !linkedIn || !gitHub || dataConsent !== true) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }

  // Validate URL safety
  const validDomains = ['firebasestorage.googleapis.com', 'storage.googleapis.com'];
  if (!validDomains.some(d => resumeUrl.includes(d)) ||
    !validDomains.some(d => idCardUrl.includes(d))) {
    return res.status(400).json({ success: false, error: 'Invalid file URLs.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cfHandle = codeforcesHandle.trim();

  // Verify Codeforces handle
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

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
      idCardUrl,
      idCardFileName: idCardFileName || null,
      codeforcesHandle: codeforcesHandle.trim(),
      codechefHandle: codechefHandle?.trim() || null,
      linkedIn: linkedIn?.trim() || null,
      gitHub: gitHub?.trim() || null,
      dataConsent: true,
      ipHash: ipHash || null,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('[submit-registration] Error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
}
