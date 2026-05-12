import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireSubadmin } from '../../../lib/subadminAuth';

const PAGE_SIZE = 50;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireSubadmin(req, admin.auth(), db);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const { lastDocId } = req.body;

  try {
    const ref = db.collection('registrants').orderBy('submittedAt', 'desc');
    let q = ref.limit(PAGE_SIZE + 1);

    if (lastDocId) {
      const lastSnap = await db.collection('registrants').doc(lastDocId).get();
      if (!lastSnap.exists) {
        return res.status(410).json({ error: 'cursor_gone', message: 'Pagination cursor no longer exists. Reload the list.' });
      }
      q = ref.startAfter(lastSnap).limit(PAGE_SIZE + 1);
    }

    const snapshot = await q.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > PAGE_SIZE;
    const pageDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs;

    // Deliberately omits: email, phoneNumber, resumeUrl, resumeFileName,
    // transcriptUrl, transcriptFileName, ipHash, deliveryStatus, linkedIn, gitHub
    const registrants = pageDocs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        fullName: data.fullName || '',
        university: data.university || '',
        branch: data.branch || '',
        graduationYear: data.graduationYear || null,
        codeforcesHandle: data.codeforcesHandle || '',
        dataConsent: data.dataConsent || false,
        submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : null,
        status: data.status || 'pending',
        round: data.round || 'prior',
        refCode: data.refCode || null,
      };
    });

    logger.info('subadmin', 'registrants_fetched', {
      reqId,
      actorId: 'subadmin',
      detail: { count: pageDocs.length, hasMore, cursor: lastDocId || null },
      status: 'ok',
    });
    return res.status(200).json({ registrants, lastDocId: hasMore ? pageDocs[pageDocs.length - 1].id : null, hasMore });
  } catch (error) {
    logger.error('subadmin', 'registrants_fetch_error', { reqId, actorId: 'subadmin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to fetch registrants.' });
  }
}
