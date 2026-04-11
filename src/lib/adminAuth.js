/**
 * Shared admin authentication helper.
 *
 * Verifies the Bearer token AND checks that the decoded token carries the
 * `admin: true` custom claim.  Every /api/admin/* route must call this
 * instead of calling admin.auth().verifyIdToken() directly.
 *
 * Set the claim once per admin account (run in a trusted script / Cloud Shell):
 *   admin.auth().setCustomUserClaims(uid, { admin: true })
 *
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>} decoded token
 * @throws {{ status: number, error: string }} plain object — catch and return res.status(e.status).json({ error: e.error })
 */
export async function requireAdmin(req, adminAuth) {
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

  if (!decoded.admin) {
    throw { status: 403, error: 'Forbidden' };
  }

  return decoded;
}
