/**
 * POST /api/admin/refresh-ambassador-leaderboard
 * Auth: Bearer Firebase ID token required
 *
 * Recomputes the campus ambassador leaderboard from pre_registrations
 * and writes the result to stats/ambassador-leaderboard-cache.
 * The public endpoint reads from that cache doc (1 read, very fast).
 */

import * as admin from 'firebase-admin';
import { requireAdmin } from '../../../lib/adminAuth';
import { AMBASSADOR_REF_MAP } from '../../../lib/ambassador-codes';

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

function normalizeInstitution(name) {
  return name.replace(/\s*\(Ambassador \d+\)$/, '').trim();
}

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
    // Kick off offset fetch in parallel with pagination
    const offsetPromise = db.collection('stats').doc('ambassador-offsets').get();

    // Paginate all pre_registrations — only fetch refCode field
    const instMap = {};
    let lastDoc = null;
    let hasMore = true;

    while (hasMore) {
      let query = db.collection('pre_registrations')
        .orderBy('submittedAt', 'desc')
        .select('refCode')
        .limit(500);

      if (lastDoc) query = query.startAfter(lastDoc);

      const snapshot = await query.get();
      if (snapshot.empty) break;

      for (const doc of snapshot.docs) {
        const refCode = doc.data().refCode;
        if (!refCode) continue;
        const rawName = AMBASSADOR_REF_MAP[refCode.toLowerCase()];
        if (!rawName) continue;
        const inst = normalizeInstitution(rawName);
        instMap[inst] = (instMap[inst] || 0) + 1;
      }

      if (snapshot.docs.length < 500) hasMore = false;
      else lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    const offsetSnap = await offsetPromise;
    const offsets = offsetSnap.exists ? offsetSnap.data() : {};

    // Merge actual counts + offsets, include custom institutions
    const allNames = new Set([...Object.keys(instMap), ...Object.keys(offsets)]);
    const institutions = Array.from(allNames)
      .map((name) => ({
        name,
        count: (instMap[name] || 0) + (Number(offsets[name]) || 0),
      }))
      .filter((i) => i.count > 0)
      .sort((a, b) => b.count - a.count);

    // Write cache doc
    await db.collection('stats').doc('ambassador-leaderboard-cache').set({
      institutions,
      computedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true, institutionCount: institutions.length });
  } catch (err) {
    console.error('[refresh-ambassador-leaderboard] Error:', err.message);
    return res.status(500).json({ error: 'Failed to refresh leaderboard.' });
  }
}
