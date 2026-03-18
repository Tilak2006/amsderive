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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    fullName, email, university, codeforcesHandle, codechefHandle,
    linkedIn, gitHub, dataConsent, resumeUrl, resumeFileName,
    idCardUrl, idCardFileName, ipHash,
  } = req.body;

  // Server-side validation — never trust client
  if (!fullName || !email || !university || !codeforcesHandle ||
      !resumeUrl || !idCardUrl || dataConsent !== true) {
    return res.status(400).json({ success: false, error: 'Missing required fields.' });
  }

  // Validate URL safety
  const validDomains = ['firebasestorage.googleapis.com', 'storage.googleapis.com'];
  if (!validDomains.some(d => resumeUrl.includes(d)) ||
      !validDomains.some(d => idCardUrl.includes(d))) {
    return res.status(400).json({ success: false, error: 'Invalid file URLs.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

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
      status: 'pending',
    });

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('[submit-registration] Error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
}
