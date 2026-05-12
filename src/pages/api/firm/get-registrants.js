/**
 * POST /api/firm/get-registrants
 *
 * Returns all approved registrants for authenticated firm partners.
 * Access is gated by the firm's Firestore access flags:
 *   - derivation tier: 403 ACCESS_DENIED
 *   - access.registrantProfiles !== true: 403 ACCESS_LOCKED
 *   - access.resumeDownload: controls whether resumeUrl is included (only after May 23, only posterior/convergence round)
 *   - access.linkedinAccess: controls whether linkedIn is included
 *
 *   - access.emailAccess: controls whether email is included
 *
 * Never returns: phoneNumber, ipHash.
 *
 * Supports cursor-based pagination via `after` (last doc ID) and `limit` (default 50).
 */

import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';


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

  const { resumeDownload, linkedinAccess, emailAccess } = firmData.access || {};

  const { after, limit: limitParam } = req.body;
  const limit = Math.min(parseInt(limitParam, 10) || 50, 100);

  try {
    // Server-side cursor pagination using composite index
    // (status ASC, dataConsent ASC, submittedAt DESC)
    let query = db
      .collection('registrants')
      .where('status', '==', 'approved')
      .where('dataConsent', '==', true)
      .orderBy('submittedAt', 'desc');

    if (after) {
      const cursorSnap = await db.collection('registrants').doc(after).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    // Fetch limit + 1 to detect hasMore without a separate count query.
    // On first page, also fetch the total count (aggregate) in parallel for UI display.
    const baseQuery = db
      .collection('registrants')
      .where('status', '==', 'approved')
      .where('dataConsent', '==', true);

    const [snapshot, totalSnap] = await Promise.all([
      query.limit(limit + 1).get(),
      after ? Promise.resolve(null) : baseQuery.count().get(),
    ]);
    const page = snapshot.docs.slice(0, limit);
    const hasMore = snapshot.docs.length > limit;
    const total = totalSnap ? totalSnap.data().count : null;

    const registrants = page.map((doc) => {
      const d = doc.data();
      const entry = {
        id: doc.id,
        fullName: d.fullName,
        university: d.university,
        branch: d.branch || null,
        graduationYear: d.graduationYear || null,
        round: d.round || null,
        codeforcesHandle: d.codeforcesHandle,
        gitHub: d.gitHub || null,
        submittedAt: d.submittedAt?.toDate?.()?.toISOString?.() ?? null,
      };
      // Resume access: only after May 23, only for candidates who advanced past PRIOR
      const resumeUnlocked = Date.now() >= new Date('2026-05-23').getTime();
      const advancedRound = d.round === 'posterior' || d.round === 'convergence';
      if (resumeDownload && resumeUnlocked && advancedRound) {
        entry.resumeUrl = d.resumeUrl || null;
        entry.resumeFileName = d.resumeFileName || null;
      }
      if (linkedinAccess) {
        entry.linkedIn = d.linkedIn || null;
      }
      if (emailAccess) {
        entry.email = d.email || null;
      }
      return entry;
    });

    logger.info('firms', 'registrants_fetched', {
      reqId,
      actorId: uid,
      detail: { pageCount: page.length, hasMore, total },
      status: 'ok',
    });
    return res.status(200).json({
      registrants,
      count: total,
      hasMore,
      lastId: page.length > 0 ? page[page.length - 1].id : null,
      access: {
        resumeDownload: !!resumeDownload,
        linkedinAccess: !!linkedinAccess,
        emailAccess: !!emailAccess,
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
