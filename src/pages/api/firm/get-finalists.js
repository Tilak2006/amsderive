/**
 * POST /api/firm/get-finalists
 *
 * Returns finalist registrant data for the authenticated firm.
 * Access is gated by the firm's Firestore access flags:
 *   - access.finalistProfiles must be true to get any data
 *   - access.resumeDownload controls whether resumeUrl is included
 *   - access.linkedinAccess controls whether linkedIn is included
 *
 * Never returns: email, phoneNumber, ipHash, codeforcesHandle.
 */

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

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Fetch firm profile and check access flags
  let firmData;
  try {
    const firmSnap = await db.collection('firms').doc(uid).get();
    if (!firmSnap.exists) {
      return res.status(401).json({ error: 'Not a firm account' });
    }
    firmData = firmSnap.data();
  } catch (err) {
    console.error('[get-finalists] Firm lookup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  // Derivation tier has no talent pool access at all
  if (firmData.tier === 'derivation') {
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Talent Pool access is not included in the Derivation tier.',
    });
  }

  // finalistProfiles flag gates the entire dataset
  if (!firmData.access?.finalistProfiles) {
    return res.status(403).json({
      error: 'ACCESS_LOCKED',
      message: 'Finalist profiles have not been unlocked yet. Check back soon.',
    });
  }

  const { resumeDownload, linkedinAccess } = firmData.access;

  try {
    // Query registrants designated as Convergence finalists with data consent
    const snapshot = await db
      .collection('registrants')
      .where('round', '==', 'convergence')
      .where('dataConsent', '==', true)
      .where('status', '==', 'approved')
      .orderBy('submittedAt', 'desc')
      .get();

    const finalists = snapshot.docs.map((doc) => {
      const d = doc.data();
      const entry = {
        id: doc.id,
        fullName: d.fullName,
        university: d.university,
        round: d.round,
      };
      if (resumeDownload && d.resumeUrl) {
        entry.resumeUrl = d.resumeUrl;
      }
      if (linkedinAccess && d.linkedIn) {
        entry.linkedIn = d.linkedIn;
      }
      return entry;
    });

    return res.status(200).json({
      finalists,
      count: finalists.length,
      access: {
        resumeDownload: !!resumeDownload,
        linkedinAccess: !!linkedinAccess,
      },
    });
  } catch (err) {
    console.error('[get-finalists] Query error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
