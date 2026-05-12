import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';


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

  try {
    const registrants = [];
    let lastDoc = null;
    let hasMoreDocs = true;

    while (hasMoreDocs) {
      let query = db.collection('registrants')
        .orderBy('submittedAt', 'desc')
        .limit(500);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        break;
      }

      for (const d of snapshot.docs) {
        const data = d.data();
        registrants.push({
          id: d.id,
          fullName: data.fullName || '',
          email: data.email || '',
          university: data.university || '',
          codeforcesHandle: data.codeforcesHandle || '',
          phoneNumber: data.phoneNumber || '',
          linkedIn: data.linkedIn || '',
          gitHub: data.gitHub || '',
          dataConsent: data.dataConsent ? 'Yes' : 'No',
          submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : '',
          refCode: data.refCode || '',
        });
      }

      if (snapshot.docs.length < 500) {
        hasMoreDocs = false;
      } else {
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
      }
    }

    return res.status(200).json({ registrants });
  } catch (error) {
    logger.error('admin', 'export_registrants_error', { reqId: genReqId(), actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to export registrants.' });
  }
}
