/**
 * Server-side rate limiter for login attempts.
 * POST /api/check-rate-limit
 * Body: { action: 'login' }
 *
 * Tracks attempts per IP using Firestore.
 * - Max 5 attempts per 15 minutes
 * - Returns 429 if exceeded
 */

import * as admin from 'firebase-admin';
import crypto from 'crypto';

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

const LIMITS = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },       // 5 attempts per 15 min
  'firm-login': { max: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  if (!action || !LIMITS[action]) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const { max, windowMs } = LIMITS[action];

  // Hash IP + user-agent for fingerprinting
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  const ip = /^[\d.:\[\]a-fA-F]+$/.test(rawIp ?? '') ? rawIp : 'unknown';
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

  const docId = `${action}_${ipHash}`;
  const cutoff = Date.now() - windowMs;

  try {
    const ref = db.collection('_rate_limits').doc(docId);
    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      let timestamps = [];
      if (doc.exists) {
        timestamps = doc.data().timestamps || [];
      }

      // Keep only recent timestamps
      const recent = timestamps.filter((ts) => ts > cutoff);

      if (recent.length >= max) {
        const oldestRecent = Math.min(...recent);
        const retryAfterSec = Math.ceil((oldestRecent + windowMs - Date.now()) / 1000);
        return {
          allowed: false,
          retryAfter: retryAfterSec,
          remaining: 0,
        };
      }

      recent.push(Date.now());
      tx.set(ref, { timestamps: recent });

      return {
        allowed: true,
        remaining: max - recent.length,
      };
    });

    if (!result.allowed) {
      return res.status(429).json({
        error: `Too many login attempts. Try again in ${result.retryAfter}s.`,
        retryAfter: result.retryAfter,
      });
    }

    return res.status(200).json({
      allowed: true,
      remaining: result.remaining,
    });
  } catch (err) {
    console.error('[check-rate-limit] Error:', err);
    // Fail open — don't block legitimate users if rate limit check itself errors
    return res.status(200).json({ allowed: true });
  }
}
