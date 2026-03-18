/**
 * Server-side rate limit check using Firebase Admin SDK.
 * Bypasses Firestore security rules to enforce rate limiting server-side.
 * 
 * Sliding window: 3 submissions per hour per fingerprint.
 * 
 * Usage:
 * POST /api/check-rate-limit
 * Body: { fingerprint: string (64-char hex) }
 * 
 * Response:
 * - 200 OK: { allowed: true } or { allowed: false, error: '...' }
 * - 400 Bad Request: invalid fingerprint format
 * - 405 Method Not Allowed: not POST
 */

import * as admin from 'firebase-admin';

// Initialize Admin SDK with credential cert pattern
// Critical: privateKey.replace(/\\n/g, '\n') handles Vercel env var literal \n strings
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fingerprint } = req.body;

  if (!fingerprint || typeof fingerprint !== 'string') {
    return res.status(400).json({ error: 'Missing fingerprint' });
  }

  // Validate fingerprint format: 64-char hex (SHA-256)
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
    return res.status(400).json({ error: 'Invalid fingerprint format' });
  }

  try {
    const rateLimitRef = db.collection('_rate_limits').doc(fingerprint);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const MAX_PER_HOUR = 3;

    const result = await db.runTransaction(async (transaction) => {
      const rateLimitDoc = await transaction.get(rateLimitRef);

      let timestamps = [];
      if (rateLimitDoc.exists) {
        timestamps = rateLimitDoc.data().timestamps || [];
      }

      // Filter to submissions within the last hour
      const recent = timestamps.filter((ts) => ts > oneHourAgo);

      if (recent.length >= MAX_PER_HOUR) {
        return { allowed: false, error: 'Too many submissions. Please try again in an hour.' };
      }

      // Add current timestamp and update
      recent.push(Date.now());
      transaction.set(rateLimitRef, { timestamps: recent });

      return { allowed: true };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[check-rate-limit] Error:', error);
    return res.status(500).json({ 
      allowed: false, 
      error: 'Rate limit check failed. Please try again.' 
    });
  }
}
