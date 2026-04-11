/**
 * POST /api/firm/get-leaderboard
 *
 * Returns live Codeforces contest standings for authenticated firm partners.
 * Access gating:
 *   - derivation tier: 403 (no leaderboard access)
 *   - firmData.access.leaderboard !== true: 403 locked
 *
 * Standings are fetched from Codeforces contest.standings and cached in-memory
 * for 30 seconds. On Codeforces error, returns stale cache if available.
 *
 * Requires env vars:
 *   CODEFORCES_API_KEY
 *   CODEFORCES_API_SECRET
 *   CODEFORCES_CONTEST_ID
 */

import * as admin from 'firebase-admin';
import crypto from 'crypto';
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

// In-memory cache
let cachedStandings = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

async function fetchFromCodeforces() {
  const apiKey = process.env.CODEFORCES_API_KEY;
  const apiSecret = process.env.CODEFORCES_API_SECRET;
  const contestId = process.env.CODEFORCES_CONTEST_ID;

  if (!apiKey || !apiSecret || !contestId) {
    throw new Error('Codeforces credentials not configured');
  }

  const rand = crypto.randomBytes(3).toString('hex'); // 6-char hex string
  const time = Math.floor(Date.now() / 1000);

  // Params must be sorted alphabetically for signature
  const params = {
    apiKey,
    contestId,
    showUnofficial: 'false',
    time: String(time),
  };

  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
  const sigInput = `${rand}/contest.standings?${paramString}#${apiSecret}`;
  const apiSig = rand + crypto.createHash('sha512').update(sigInput).digest('hex');

  const url = `https://codeforces.com/api/contest.standings?${paramString}&apiSig=${apiSig}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const json = await res.json();

    if (json.status !== 'OK') {
      const comment = (json.comment || '').toLowerCase();
      if (comment.includes('not started') || comment.includes('has not started') || comment.includes('before contest start')) {
        const err = new Error('Contest has not started yet');
        err.code = 'NOT_STARTED';
        throw err;
      }
      throw new Error(`Codeforces API error: ${json.comment || `HTTP ${res.status}`}`);
    }

    return json.result;
  } finally {
    clearTimeout(timeout);
  }
}

function formatStandings(cfResult) {
  const rows = cfResult.rows || [];
  return rows.map((row) => ({
    rank: row.rank,
    handle: row.party?.members?.[0]?.handle || '—',
    points: row.points,
    penalty: row.penalty,
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const reqId = genReqId();
  const handlerStart = Date.now();

  // Firm lookup + access check
  let firmData;
  try {
    const firmSnap = await db.collection('firms').doc(uid).get();
    if (!firmSnap.exists) {
      return res.status(401).json({ error: 'Not a firm account' });
    }
    firmData = firmSnap.data();
  } catch (err) {
    logger.error('firms', 'firm_lookup_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (firmData.tier === 'derivation') {
    logger.warn('firms', 'leaderboard_access_denied', {
      reqId,
      actorId: uid,
      entityId: uid,
      detail: { reason: 'derivation_tier' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Leaderboard access is not included in the Derivation tier.',
    });
  }

  if (!firmData.access?.leaderboard) {
    logger.warn('firms', 'leaderboard_access_denied', {
      reqId,
      actorId: uid,
      entityId: uid,
      detail: { reason: 'flag_locked' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_LOCKED',
      message: 'Leaderboard access has not been unlocked for your account yet.',
    });
  }

  // Serve from cache if fresh
  const now = Date.now();
  if (cachedStandings !== null && now - cacheTime < CACHE_TTL) {
    logger.info('firms', 'leaderboard_served_cache', {
      reqId,
      actorId: uid,
      detail: { fromCache: true, rowCount: cachedStandings.standings.length },
      status: 'ok',
    });
    return res.status(200).json({
      standings: cachedStandings.standings,
      updatedAt: cachedStandings.updatedAt,
      fromCache: true,
    });
  }

  // Fetch from Codeforces
  try {
    const cfResult = await fetchFromCodeforces();
    const standings = formatStandings(cfResult);
    const updatedAt = new Date().toISOString();

    cachedStandings = { standings, updatedAt };
    cacheTime = now;

    logger.info('firms', 'leaderboard_fetched_cf', {
      reqId,
      actorId: uid,
      detail: { rowCount: standings.length },
      status: 'ok',
      durationMs: Date.now() - handlerStart,
    });
    return res.status(200).json({ standings, updatedAt });
  } catch (err) {
    // Contest hasn't started yet — return empty standings, not an error
    if (err.code === 'NOT_STARTED') {
      logger.warn('firms', 'leaderboard_cf_not_started', { reqId, actorId: uid, status: 'degraded' });
      return res.status(200).json({ standings: [], updatedAt: new Date().toISOString(), notStarted: true });
    }

    // Codeforces timed out — treat like a transient failure
    if (err.name === 'AbortError' || err.code === 20) {
      if (cachedStandings !== null) {
        logger.warn('firms', 'leaderboard_cf_timeout_stale', {
          reqId,
          actorId: uid,
          detail: { stale: true },
          status: 'degraded',
        });
        return res.status(200).json({
          standings: cachedStandings.standings,
          updatedAt: cachedStandings.updatedAt,
          fromCache: true,
          stale: true,
        });
      }
      logger.warn('firms', 'leaderboard_cf_timeout_no_cache', { reqId, actorId: uid, status: 'degraded' });
      return res.status(200).json({ standings: [], updatedAt: new Date().toISOString(), notStarted: false, timedOut: true });
    }

    // Graceful degrade: return stale cache if available
    if (cachedStandings !== null) {
      logger.warn('firms', 'leaderboard_served_cache', {
        reqId,
        actorId: uid,
        detail: { stale: true, message: err.message },
        status: 'degraded',
      });
      return res.status(200).json({
        standings: cachedStandings.standings,
        updatedAt: cachedStandings.updatedAt,
        fromCache: true,
        stale: true,
      });
    }

    logger.error('firms', 'leaderboard_cf_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(502).json({ error: 'Failed to fetch leaderboard' });
  }
}
