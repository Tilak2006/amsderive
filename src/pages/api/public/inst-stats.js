import { admin, db } from '../../../lib/firebaseAdmin';


export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  try {
    const snap = await db.collection('stats_inst').get();

    if (snap.empty) {
      return res.status(200).json({ institutions: [] });
    }

    const institutions = snap.docs
      .map((doc) => ({ name: doc.data().name, count: doc.data().count || 0 }))
      .filter((i) => i.name)
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({ institutions });
  } catch (err) {
    console.error('[inst-stats] Error reading stats_inst:', err.message);
    return res.status(200).json({ institutions: [] });
  }
}
