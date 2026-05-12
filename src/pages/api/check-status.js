import { createHash } from 'crypto';
import { admin, db } from '../../lib/firebaseAdmin';
import logger, { genReqId } from '../../utils/logger';

function hashFingerprint(ip) {
  return createHash('sha256').update(ip || 'unknown').digest('hex');
}

const MAX_CHECKS_PER_WINDOW = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, fullName } = req.body;

  // Input validation
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email.' });
  }
  if (!fullName || typeof fullName !== 'string') {
    return res.status(400).json({ error: 'Invalid name.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = fullName.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    return res.status(400).json({ error: 'Invalid name.' });
  }

  // Rate limiting by IP only (UA is spoofable)
  const forwarded = req.headers['x-forwarded-for'];
  const raw = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  const ip = /^[\d.:[\]a-fA-F]+$/.test(raw ?? '') ? raw : 'unknown';
  const fingerprint = hashFingerprint(ip);

  if (fingerprint) {
    try {
      const rateLimitRef = db.collection('_rate_limits').doc(`check_${fingerprint}`);
      const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;

      const allowed = await db.runTransaction(async (tx) => {
        const doc = await tx.get(rateLimitRef);
        const timestamps = doc.exists ? (doc.data().timestamps || []) : [];
        const recent = timestamps.filter(ts => ts > twelveHoursAgo);
        if (recent.length >= MAX_CHECKS_PER_WINDOW) return false;
        recent.push(Date.now());
        tx.set(rateLimitRef, {
          timestamps: recent,
          expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 4 * 60 * 60 * 1000),
        });
        return true;
      });

      if (!allowed) {
        return res.status(429).json({ error: 'Too many attempts. Try again in 12 hours.' });
      }
    } catch {
      // Rate limit check failed — fail open, don't block user
    }
  }

  try {
    const snapshot = await db.collection('registrants')
      .where('emailLower', '==', normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // Generic not found — don't reveal which field failed
      return res.status(200).json({ found: false });
    }

    const data = snapshot.docs[0].data();

    // Second factor — name must match (case-insensitive)
    const storedName = (data.fullName || '').trim().toLowerCase();
    if (storedName !== normalizedName) {
      // Generic not found — don't reveal which field failed
      return res.status(200).json({ found: false });
    }

    // Return only safe fields — no URLs, no IP hash, no internal IDs
    return res.status(200).json({
      found: true,
      registration: {
        fullName: data.fullName || '',
        university: data.university || '',
        status: data.status || 'pending',
        round: data.round || 'prior',
        submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : null,
      },
    });
  } catch (error) {
    logger.error('registration', 'check_status_error', { reqId: genReqId(), status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to check registration. Please try again.' });
  }
}