/**
 * POST /api/admin/create-firm
 *
 * Creates a Firebase Auth user and corresponding Firestore document for a new firm.
 * Admin auth required.
 *
 * Body: { firmName, tier, email, password, logoUrl?, notes? }
 *
 * Email must end in @firms.amsderive.in to enforce namespace separation.
 * Password must be at least 12 characters.
 *
 * Default access flags are set by tier:
 *   - derivation/convergence: leaderboard + analytics only
 *   - apex: above + psCoDesign + namingRights
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

const VALID_TIERS = ['derivation', 'convergence', 'apex'];
const FIRM_EMAIL_DOMAIN = '@firms.amsderive.in';

function buildDefaultAccess(tier) {
  const base = {
    leaderboard: true,
    analytics: true,
    finalistProfiles: false,
    resumeDownload: false,
    linkedinAccess: false,
    psCoDesign: false,
    namingRights: false,
  };
  if (tier === 'apex') {
    base.psCoDesign = true;
    base.namingRights = true;
  }
  return base;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { firmName, tier, email, password, logoUrl, notes } = req.body;

  // Validate inputs
  if (!firmName || typeof firmName !== 'string' || firmName.trim().length === 0 || firmName.trim().length > 80) {
    return res.status(400).json({ error: 'firmName must be a non-empty string (max 80 chars)' });
  }
  if (!tier || !VALID_TIERS.includes(tier)) {
    return res.status(400).json({ error: `tier must be one of: ${VALID_TIERS.join(', ')}` });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!email.endsWith(FIRM_EMAIL_DOMAIN)) {
    return res.status(400).json({
      error: `Firm emails must end in ${FIRM_EMAIL_DOMAIN} (e.g. jane-street${FIRM_EMAIL_DOMAIN})`,
    });
  }
  if (!password || typeof password !== 'string' || password.length < 12) {
    return res.status(400).json({ error: 'Password must be at least 12 characters' });
  }

  const trimmedName = firmName.trim();
  const firmSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const access = buildDefaultAccess(tier);

  let uid;
  try {
    const userRecord = await admin.auth().createUser({
      email: email.toLowerCase(),
      password,
      displayName: trimmedName,
    });
    uid = userRecord.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'A Firebase Auth account with this email already exists.' });
    }
    console.error('[create-firm] Auth createUser error:', err);
    return res.status(500).json({ error: 'Failed to create Firebase Auth account.' });
  }

  try {
    await db.collection('firms').doc(uid).set({
      firmName: trimmedName,
      firmSlug,
      tier,
      logoUrl: logoUrl || null,
      primaryEmail: email.toLowerCase(),
      access,
      notes: notes?.trim() || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    });

    return res.status(200).json({ success: true, uid, firmSlug, firmName: trimmedName });
  } catch (err) {
    console.error('[create-firm] Firestore write error:', err);
    // Attempt cleanup — Auth user was created but Firestore failed
    admin.auth().deleteUser(uid).catch((e) =>
      console.error('[create-firm] Cleanup deleteUser failed:', e.message)
    );
    return res.status(500).json({
      error: 'Firm created in Auth but Firestore write failed. Please retry or manually add the Firestore document.',
    });
  }
}
