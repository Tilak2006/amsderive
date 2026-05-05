import * as admin from 'firebase-admin';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';

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
const PAGE_SIZE = 50;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let decoded;
  try {
    decoded = await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const { lastDocId } = req.body || {};

  try {
    const ref = db.collection('outreach_contacts').orderBy('createdAt', 'desc');
    let q = ref.limit(PAGE_SIZE + 1);

    if (lastDocId) {
      const lastSnap = await db.collection('outreach_contacts').doc(lastDocId).get();
      if (!lastSnap.exists) {
        return res.status(410).json({ error: 'cursor_gone', message: 'Pagination cursor no longer exists. Reload the list.' });
      }
      q = ref.startAfter(lastSnap).limit(PAGE_SIZE + 1);
    }

    const snapshot = await q.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > PAGE_SIZE;
    const pageDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs;

    const contacts = pageDocs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: data.email || '',
        emailLower: data.emailLower || '',
        fullName: data.fullName || '',
        firstName: data.firstName || '',
        institution: data.institution || '',
        source: data.source || '',
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        unsubscribed: data.unsubscribed === true,
        deliveryStatus: data.deliveryStatus || null,
        deliveryStatusAt: data.deliveryStatusAt ? data.deliveryStatusAt.toDate().toISOString() : null,
        lastBroadcastAt: data.lastBroadcastAt ? data.lastBroadcastAt.toDate().toISOString() : null,
        lastBroadcastId: data.lastBroadcastId || null,
      };
    });

    logger.info('admin', 'outreach_contacts_fetched', {
      reqId,
      actorId: decoded.uid,
      detail: { count: pageDocs.length, hasMore, cursor: lastDocId || null },
      status: 'ok',
    });

    return res.status(200).json({
      contacts,
      lastDocId: hasMore ? pageDocs[pageDocs.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    logger.error('admin', 'outreach_contacts_fetch_error', { reqId, actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to fetch outreach contacts.' });
  }
}
