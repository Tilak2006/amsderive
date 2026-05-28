/**
 * POST /api/firm/get-signed-url
 *
 * Generates a 15-minute signed URL for an approved, consented advanced
 * registrant document that the authenticated firm is allowed to view.
 */

import { admin, db, getStorageBucket } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { parseFirmCandidateToken } from '../../../lib/firmCandidateToken';

const VALID_FILE_TYPES = new Set(['resume', 'transcript']);

function isAdvancedRound(round) {
  return round === 'posterior' || round === 'convergence';
}

function extractStoragePath(fileUrl, bucketName) {
  const validDomains = ['firebasestorage.googleapis.com', 'storage.googleapis.com'];
  let urlObj;
  try {
    urlObj = new URL(fileUrl);
  } catch {
    return null;
  }

  if (!validDomains.includes(urlObj.hostname)) return null;

  if (urlObj.hostname === 'firebasestorage.googleapis.com') {
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
  }

  const parts = urlObj.pathname.split('/').filter(Boolean);
  if (parts[0] === 'download' && parts[1] === 'storage' && parts[2] === 'v1') {
    const objectMarker = parts.indexOf('o');
    if (parts[3] === 'b' && parts[4] === bucketName && objectMarker >= 0 && parts[objectMarker + 1]) {
      return decodeURIComponent(parts.slice(objectMarker + 1).join('/'));
    }
    return null;
  }
  if (parts[0] === bucketName && parts.length > 1) {
    return decodeURIComponent(parts.slice(1).join('/'));
  }
  return decodeURIComponent(parts.join('/'));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  if (firmData.tier === 'derivation' || !firmData.access?.resumeDownload) {
    logger.warn('firms', 'signed_url_access_denied', {
      reqId,
      actorId: uid,
      detail: { reason: firmData.tier === 'derivation' ? 'derivation_tier' : 'no_document_download' },
      status: 'blocked',
    });
    return res.status(403).json({ error: 'Document download access is not enabled for this account.' });
  }

  if (!firmData.access?.finalistProfiles) {
    logger.warn('firms', 'signed_url_access_denied', {
      reqId,
      actorId: uid,
      detail: { reason: 'finalist_profiles_locked' },
      status: 'blocked',
    });
    return res.status(403).json({ error: 'Talent Pool document access is not enabled for this account.' });
  }

  const { registrantId, fileType } = req.body || {};
  if (!registrantId || typeof registrantId !== 'string') {
    return res.status(400).json({ error: 'Missing registrantId.' });
  }
  const resolvedRegistrantId = parseFirmCandidateToken(registrantId);
  if (!resolvedRegistrantId) {
    return res.status(400).json({ error: 'Invalid candidate token.' });
  }
  if (!VALID_FILE_TYPES.has(fileType)) {
    return res.status(400).json({ error: 'Invalid fileType.' });
  }

  try {
    const registrantSnap = await db.collection('registrants').doc(resolvedRegistrantId).get();
    if (!registrantSnap.exists) {
      return res.status(404).json({ error: 'Candidate document not found.' });
    }

    const registrant = registrantSnap.data();
    if (registrant.status !== 'approved' || registrant.dataConsent !== true || !isAdvancedRound(registrant.round)) {
      logger.warn('firms', 'signed_url_candidate_denied', {
        reqId,
        actorId: uid,
        entityId: resolvedRegistrantId,
        detail: { round: registrant.round || null, status: registrant.status || null, dataConsent: registrant.dataConsent === true },
        status: 'blocked',
      });
      return res.status(403).json({ error: 'Candidate document is not available.' });
    }

    const fileUrl = fileType === 'resume' ? registrant.resumeUrl : registrant.transcriptUrl;
    if (!fileUrl || typeof fileUrl !== 'string') {
      return res.status(404).json({ error: 'Requested document was not provided.' });
    }

    const bucket = getStorageBucket();
    const filePath = extractStoragePath(fileUrl, bucket.name);
    if (!filePath || !filePath.startsWith('registrants/')) {
      return res.status(400).json({ error: 'Invalid document path.' });
    }

    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'Requested document was not found in storage.' });
    }

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });

    logger.info('firms', 'signed_url_generated', {
      reqId,
      actorId: uid,
      entityId: resolvedRegistrantId,
      detail: { fileType, filePath },
      status: 'ok',
    });
    return res.status(200).json({ signedUrl });
  } catch (err) {
    logger.error('firms', 'signed_url_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Failed to generate signed URL.' });
  }
}
