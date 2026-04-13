/**
 * POST /api/firm/get-registrants
 *
 * Returns all approved registrants for authenticated firm partners.
 * Access is gated by the firm's Firestore access flags:
 *   - derivation tier: 403 ACCESS_DENIED
 *   - access.registrantProfiles !== true: 403 ACCESS_LOCKED
 *   - access.resumeDownload: controls whether resumeUrl/transcriptUrl are included
 *   - access.linkedinAccess: controls whether linkedIn is included
 *
 * Never returns: email, phoneNumber, ipHash.
 *
 * Supports cursor-based pagination via `after` (last doc ID) and `limit` (default 50).
 */

import * as admin from 'firebase-admin';
import logger, { genReqId } from '../../../utils/logger';

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

  const reqId = genReqId();

  let firmData;
  try {
    const firmSnap = await db.collection('firms').doc(uid).get();
    if (!firmSnap.exists) {
      return res.status(401).json({ error: 'Not a firm account' });
    }
    firmData = firmSnap.data();
  } catch (err) {
    logger.error('firms', 'firm_lookup_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (firmData.tier === 'derivation') {
    logger.warn('firms', 'registrants_access_denied', {
      reqId,
      actorId: uid,
      detail: { reason: 'derivation_tier' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Registrant Profiles access is not included in the Derivation tier.',
    });
  }

  if (!firmData.access?.registrantProfiles) {
    logger.warn('firms', 'registrants_access_denied', {
      reqId,
      actorId: uid,
      detail: { reason: 'flag_locked' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_LOCKED',
      message: 'Registrant profiles have not been unlocked yet. Check back soon.',
    });
  }

  const { resumeDownload, linkedinAccess } = firmData.access || {};

  const { after, limit: limitParam } = req.body;
  const limit = Math.min(parseInt(limitParam, 10) || 50, 100);

  try {
    const snapshot = await db
      .collection('registrants')
      .where('status', '==', 'approved')
      .get();

    // Sort and filter in-process — avoids any composite index requirement
    const docs = snapshot.docs
      .filter((doc) => doc.data().dataConsent === true)
      .sort((a, b) => {
        const aT = a.data().submittedAt?.toMillis?.() ?? 0;
        const bT = b.data().submittedAt?.toMillis?.() ?? 0;
        return bT - aT;
      });

    // Apply cursor-based pagination in-process
    let startIdx = 0;
    if (after) {
      const idx = docs.findIndex((doc) => doc.id === after);
      if (idx !== -1) startIdx = idx + 1;
    }
    const page = docs.slice(startIdx, startIdx + limit);
    const hasMore = startIdx + limit < docs.length;

    const registrants = page.map((doc) => {
      const d = doc.data();
      const entry = {
        id: doc.id,
        fullName: d.fullName,
        university: d.university,
        round: d.round || null,
        codeforcesHandle: d.codeforcesHandle,
        gitHub: d.gitHub || null,
        submittedAt: d.submittedAt?.toDate?.()?.toISOString?.() ?? null,
      };
      if (resumeDownload) {
        entry.resumeUrl = d.resumeUrl || null;
        entry.resumeFileName = d.resumeFileName || null;
        entry.transcriptUrl = d.transcriptUrl || null;
        entry.transcriptFileName = d.transcriptFileName || null;
      }
      if (linkedinAccess) {
        entry.linkedIn = d.linkedIn || null;
      }
      return entry;
    });

    logger.info('firms', 'registrants_fetched', {
      reqId,
      actorId: uid,
      detail: { count: page.length, hasMore, total: docs.length },
      status: 'ok',
    });
    return res.status(200).json({
      registrants,
      count: docs.length,
      hasMore,
      lastId: page.length > 0 ? page[page.length - 1].id : null,
      access: {
        resumeDownload: !!resumeDownload,
        linkedinAccess: !!linkedinAccess,
      },
    });
  } catch (err) {
    logger.error('firms', 'registrants_query_error', {
      reqId,
      actorId: uid,
      detail: { code: err.code ?? null },
      status: 'failed',
    }, err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
