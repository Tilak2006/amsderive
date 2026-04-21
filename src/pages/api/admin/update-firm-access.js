/**
 * POST /api/admin/update-firm-access
 *
 * Toggles a single access flag on a firm's Firestore document.
 * Uses Firestore dot-notation to update only the specific nested field.
 * Admin auth required.
 *
 * Body: { uid: string, flag: string, value: boolean }
 */

import * as admin from 'firebase-admin';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';

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

const VALID_FLAGS = [
  'leaderboard',
  'analytics',
  'registrantProfiles',
  'finalistProfiles',
  'resumeDownload',
  'linkedinAccess',
  'emailAccess',
  'csvExport',
  'psCoDesign',
  'namingRights',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let decoded;
  try {
    decoded = await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const { uid, flag, value } = req.body;

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid uid' });
  }
  if (!flag || !VALID_FLAGS.includes(flag)) {
    return res.status(400).json({ error: `Invalid flag. Must be one of: ${VALID_FLAGS.join(', ')}` });
  }
  if (typeof value !== 'boolean') {
    return res.status(400).json({ error: 'value must be a boolean' });
  }

  try {
    await db.collection('firms').doc(uid).update({
      [`access.${flag}`]: value,
    });
    logger.info('admin', 'firm_access_updated', {
      reqId,
      entityId: uid,
      actorId: decoded.uid,
      detail: { flag, value },
      status: 'ok',
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('admin', 'firm_access_update_error', { reqId, entityId: uid, actorId: decoded.uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
