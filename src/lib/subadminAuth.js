/**
 * Subadmin authentication helper.
 *
 * Verifies the Bearer token AND checks that a `subadmins/{uid}` Firestore
 * document exists. Add a team member by creating that document (any data,
 * even an empty object) and remove access by deleting it — no custom claims
 * or SDK scripts needed.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('firebase-admin/auth').Auth} adminAuth
 * @param {import('firebase-admin/firestore').Firestore} db
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 * @throws {{ status: number, error: string }}
 */
export async function requireSubadmin(req, adminAuth, db) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw { status: 401, error: 'Unauthorized' };
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    throw { status: 401, error: 'Unauthorized' };
  }

  const snap = await db.collection('subadmins').doc(decoded.uid).get();
  if (!snap.exists) {
    throw { status: 403, error: 'Forbidden' };
  }

  return decoded;
}
