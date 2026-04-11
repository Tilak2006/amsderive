/**
 * GET ambassador stats from pre_registrations collection.
 * POST /api/admin/get-ambassador-stats
 * Auth: Bearer token required
 *
 * Returns:
 * - totalWithRef: count of pre-registrations with a ref code
 * - totalWithoutRef: count without
 * - totalOverall: total pre-registrations
 * - refGroups: array of { code, emails: [{ email, submittedAt }] }
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
  try {
    await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const reqId = genReqId();

  try {
    // Paginated fetch of all pre_registrations
    const allDocs = [];
    let lastDoc = null;
    let hasMore = true;

    while (hasMore) {
      let query = db.collection('pre_registrations')
        .orderBy('submittedAt', 'desc')
        .limit(500);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) break;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        allDocs.push({
          email: data.email || '',
          refCode: data.refCode || null,
          submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : '',
        });
      }

      if (snapshot.docs.length < 500) {
        hasMore = false;
      } else {
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }
    }

    // Group by refCode
    const refMap = {};
    let totalWithRef = 0;
    let totalWithoutRef = 0;

    for (const doc of allDocs) {
      if (doc.refCode) {
        totalWithRef++;
        if (!refMap[doc.refCode]) {
          refMap[doc.refCode] = [];
        }
        refMap[doc.refCode].push({
          email: doc.email,
          submittedAt: doc.submittedAt,
        });
      } else {
        totalWithoutRef++;
      }
    }

    const refGroups = Object.entries(refMap)
      .map(([code, emails]) => ({
        code,
        emails,
      }))
      .sort((a, b) => b.emails.length - a.emails.length);

    logger.info('admin', 'ambassador_stats_fetched', {
      reqId,
      actorId: 'admin',
      detail: { totalOverall: allDocs.length, totalWithRef, refGroupCount: refGroups.length },
      status: 'ok',
    });
    return res.status(200).json({
      totalOverall: allDocs.length,
      totalWithRef,
      totalWithoutRef,
      refGroups,
    });
  } catch (error) {
    logger.error('admin', 'ambassador_stats_error', { reqId, actorId: 'admin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to fetch ambassador stats.' });
  }
}
