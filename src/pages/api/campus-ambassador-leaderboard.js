/**
 * GET /api/campus-ambassador-leaderboard
 *
 * Serves the pre-computed campus ambassador leaderboard from
 * stats/ambassador-leaderboard-cache (single Firestore doc read).
 *
 * Data is refreshed only when an admin triggers
 * POST /api/admin/refresh-ambassador-leaderboard.
 *
 * Falls back to live computation on first load if cache doesn't exist yet.
 */

import * as admin from 'firebase-admin';
import { AMBASSADOR_REF_MAP } from '../../lib/ambassador-codes';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (Object.keys(req.query).length > 0) {
    return res.status(400).json({ error: 'No query parameters accepted' });
  }

  // Data only changes when admin triggers /api/admin/refresh-ambassador-leaderboard.
  // Cache aggressively — CDN serves for 5 min, then stale-while-revalidate for 1 hr.
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');

  try {
    const cacheSnap = await db.collection('stats').doc('ambassador-leaderboard-cache').get();

    if (cacheSnap.exists) {
      const { institutions, computedAt } = cacheSnap.data();
      return res.status(200).json({
        institutions: institutions || [],
        computedAt: computedAt ? computedAt.toDate().toISOString() : null,
      });
    }

    // No cache yet — compute live and seed the cache (first-time only)
    const offsetPromise = db.collection('stats').doc('ambassador-offsets').get();

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

    const allNames = new Set([...Object.keys(instMap), ...Object.keys(offsets)]);
    const institutions = Array.from(allNames)
      .map((name) => ({
        name,
        count: (instMap[name] || 0) + (Number(offsets[name]) || 0),
      }))
      .filter((i) => i.count > 0)
      .sort((a, b) => b.count - a.count);

    // Seed cache in background — don't await so response isn't delayed
    db.collection('stats').doc('ambassador-leaderboard-cache').set({
      institutions,
      computedAt: admin.firestore.FieldValue.serverTimestamp(),
    }).catch((e) => console.error('[campus-ambassador-leaderboard] Cache seed failed:', e.message));

    return res.status(200).json({ institutions, computedAt: null });
  } catch (err) {
    console.error('[campus-ambassador-leaderboard] Error:', err.message);
    return res.status(200).json({ institutions: [], computedAt: null });
  }
}
