import * as admin from 'firebase-admin';

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

  // Auth check — verify Firebase ID token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { lastDocId } = req.body;

  try {
    const ref = db.collection('registrants').orderBy('submittedAt', 'desc');
    let q = ref.limit(PAGE_SIZE + 1);

    if (lastDocId) {
      const lastSnap = await db.collection('registrants').doc(lastDocId).get();
      if (lastSnap.exists) q = ref.startAfter(lastSnap).limit(PAGE_SIZE + 1);
    }

    const snapshot = await q.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > PAGE_SIZE;
    const pageDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs;

    const registrants = pageDocs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        fullName: data.fullName || '',
        email: data.email || '',
        university: data.university || '',
        codeforcesHandle: data.codeforcesHandle || '',
        codechefHandle: data.codechefHandle || null,
        linkedIn: data.linkedIn || null,
        gitHub: data.gitHub || null,
        dataConsent: data.dataConsent || false,
        submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : null,
        status: data.status || 'pending',
        resumeUrl: data.resumeUrl || null,
        resumeFileName: data.resumeFileName || null,
        idCardUrl: data.idCardUrl || null,
        idCardFileName: data.idCardFileName || null,
        ipHash: data.ipHash ? '••••••••' + data.ipHash.slice(-8) : '—',
      };
    });

    return res.status(200).json({
      registrants,
      lastDocId: hasMore ? pageDocs[pageDocs.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error('[get-registrants] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch registrants.' });
  }
}
