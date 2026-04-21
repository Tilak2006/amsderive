import * as admin from 'firebase-admin';
import logger, { genReqId } from '../../../utils/logger';
import { requireSubadmin } from '../../../lib/subadminAuth';

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

  try {
    await requireSubadmin(req, admin.auth(), db);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  try {
    const registrants = [];
    let lastDoc = null;
    let hasMoreDocs = true;

    while (hasMoreDocs) {
      let query = db.collection('registrants')
        .select('fullName', 'university', 'branch', 'graduationYear', 'codeforcesHandle', 'dataConsent', 'submittedAt', 'status', 'round')
        .orderBy('submittedAt', 'desc')
        .limit(500);
      if (lastDoc) query = query.startAfter(lastDoc);

      const snapshot = await query.get();
      if (snapshot.empty) break;

      for (const d of snapshot.docs) {
        const data = d.data();
        // Deliberately omits: email, phoneNumber, resumeUrl, transcriptUrl, ipHash
        registrants.push({
          id: d.id,
          fullName: data.fullName || '',
          university: data.university || '',
          branch: data.branch || '',
          graduationYear: data.graduationYear || null,
          codeforcesHandle: data.codeforcesHandle || '',
          dataConsent: data.dataConsent || false,
          submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : '',
          status: data.status || 'pending',
          round: data.round || 'prior',
        });
      }

      hasMoreDocs = snapshot.docs.length === 500;
      if (hasMoreDocs) lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    logger.info('subadmin', 'export_registrants', { reqId: genReqId(), actorId: 'subadmin', detail: { count: registrants.length }, status: 'ok' });
    return res.status(200).json({ registrants });
  } catch (error) {
    logger.error('subadmin', 'export_registrants_error', { reqId: genReqId(), actorId: 'subadmin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to export registrants.' });
  }
}
