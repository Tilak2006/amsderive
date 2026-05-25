/**
 * POST /api/subadmin/get-signed-url
 *
 * Generates a 15-minute signed URL for a registrant resume file.
 * Requires a valid subadmin session.
 */

import { admin, db, getStorageBucket } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireSubadmin } from '../../../lib/subadminAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireSubadmin(req, admin.auth(), db);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const { fileUrl } = req.body;

  if (!fileUrl || typeof fileUrl !== 'string') {
    return res.status(400).json({ error: 'Missing fileUrl.' });
  }

  const validDomains = ['firebasestorage.googleapis.com', 'storage.googleapis.com'];
  let urlObj;
  try {
    urlObj = new URL(fileUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid file URL.' });
  }
  if (!validDomains.includes(urlObj.hostname)) {
    return res.status(400).json({ error: 'Invalid file URL.' });
  }

  try {
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) {
      return res.status(400).json({ error: 'Could not parse file path.' });
    }
    const filePath = decodeURIComponent(pathMatch[1].split('?')[0]);

    // Only allow files under the registrants/ folder
    if (!filePath.startsWith('registrants/')) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const bucket = getStorageBucket();
    const [signedUrl] = await bucket.file(filePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });

    logger.info('subadmin', 'signed_url_generated', {
      reqId,
      actorId: 'subadmin',
      detail: { filePath },
      status: 'ok',
    });
    return res.status(200).json({ signedUrl });
  } catch (error) {
    logger.error('subadmin', 'signed_url_error', { reqId, actorId: 'subadmin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to generate signed URL.' });
  }
}
