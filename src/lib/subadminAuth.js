/**
 * Subadmin authentication helper.
 *
 * Verifies the Bearer token, checks revocation, AND checks that a `subadmins/{uid}` Firestore
 * document exists. Add a team member by creating that document (any data,
 * even an empty object) and remove access by deleting it — no custom claims
 * or SDK scripts needed.
 *
 * Firestore membership results are cached in-process for 5 minutes to avoid
 * a Firestore read on every API call. Token revocation is checked every time.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('firebase-admin/auth').Auth} adminAuth
 * @param {import('firebase-admin/firestore').Firestore} db
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 * @throws {{ status: number, error: string }}
 */

// uid → expiry timestamp (ms). Module-level so it persists across requests
// within the same warm serverless instance.
const subadminCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function requireSubadmin(req, adminAuth, db) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw { status: 401, error: 'Unauthorized' };
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1], true);
  } catch {
    throw { status: 401, error: 'Unauthorized' };
  }

  // Cache hit — skip Firestore
  const cachedExpiry = subadminCache.get(decoded.uid);
  if (cachedExpiry && Date.now() < cachedExpiry) {
    return decoded;
  }

  const snap = await db.collection('subadmins').doc(decoded.uid).get();
  if (!snap.exists) {
    subadminCache.delete(decoded.uid);
    throw { status: 403, error: 'Forbidden' };
  }

  subadminCache.set(decoded.uid, Date.now() + CACHE_TTL);
  return decoded;
}
