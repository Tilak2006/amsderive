import { admin, db } from '../../../lib/firebaseAdmin';
import { requireAdmin } from '../../../lib/adminAuth';


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  try {
    const snapshot = await db
      .collection('ambassadors')
      .orderBy('createdAt', 'desc')
      .get();

    const ambassadors = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        code: d.code,
        institution: d.institution,
        label: d.label,
        registrationCount: d.registrationCount || 0,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return res.status(200).json({ success: true, ambassadors });
  } catch (err) {
    console.error('[get-ambassadors] error:', err);
    return res.status(500).json({ error: 'Failed to fetch ambassadors.' });
  }
}
