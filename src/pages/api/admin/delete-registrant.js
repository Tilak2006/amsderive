import { admin, db, getStorageBucket } from '../../../lib/firebaseAdmin';
import { requireAdmin } from '../../../lib/adminAuth';
import logger, { genReqId, maskEmail } from '../../../utils/logger';

const CONFIRM_TEXT = 'Yes delete';

function parseOwnedRegistrantFilePath(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return null;

  let urlObj;
  try {
    urlObj = new URL(fileUrl);
  } catch {
    return null;
  }

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) return null;

  let filePath = null;

  if (urlObj.hostname === 'firebasestorage.googleapis.com') {
    const match = urlObj.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
    if (!match || match[1] !== bucketName) return null;
    try {
      filePath = decodeURIComponent(match[2]);
    } catch {
      return null;
    }
  } else if (urlObj.hostname === 'storage.googleapis.com') {
    const prefix = `/${bucketName}/`;
    if (!urlObj.pathname.startsWith(prefix)) return null;
    try {
      filePath = decodeURIComponent(urlObj.pathname.slice(prefix.length));
    } catch {
      return null;
    }
  } else {
    return null;
  }

  return filePath.startsWith('registrants/') ? filePath : null;
}

async function deleteStorageFiles(fileUrls, reqId, actorId) {
  const presentUrls = fileUrls.filter(Boolean);
  if (presentUrls.length > 0 && !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    throw new Error('Firebase Storage bucket is not configured.');
  }

  const paths = Array.from(new Set(presentUrls.map(parseOwnedRegistrantFilePath).filter(Boolean)));
  if (paths.length === 0) return { deleted: 0, missing: 0, skipped: presentUrls.length };

  const bucket = getStorageBucket();
  let deleted = 0;
  let missing = 0;

  for (const filePath of paths) {
    try {
      await bucket.file(filePath).delete();
      deleted += 1;
    } catch (error) {
      if (error?.code === 404) {
        missing += 1;
        continue;
      }
      logger.error('admin', 'registrant_file_delete_failed', {
        reqId,
        actorId,
        detail: { filePath },
        status: 'failed',
      }, error);
      throw error;
    }
  }

  return { deleted, missing, skipped: presentUrls.length - paths.length };
}

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
  const { docId, confirmText } = req.body || {};

  if (!docId || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid docId.' });
  }
  if (confirmText !== CONFIRM_TEXT) {
    return res.status(400).json({ error: `Type "${CONFIRM_TEXT}" to confirm deletion.` });
  }

  const docRef = db.collection('registrants').doc(docId);

  try {
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Registrant not found.' });
    }

    const data = snap.data() || {};
    let storageResult;
    try {
      storageResult = await deleteStorageFiles([data.resumeUrl, data.transcriptUrl], reqId, decoded.uid);
    } catch {
      return res.status(500).json({ error: 'Failed to delete participant files. No database records were deleted.' });
    }

    const handleKey = String(data.codeforcesHandle || '').trim().toLowerCase();
    const emailKey = String(data.emailLower || data.email || docId).trim().toLowerCase();
    const cfHandleRef = handleKey ? db.collection('cfHandles').doc(handleKey) : null;
    let cfHandleDeleted = false;

    await db.runTransaction(async (tx) => {
      const liveSnap = await tx.get(docRef);
      if (!liveSnap.exists) {
        throw Object.assign(new Error('Registrant not found.'), { statusCode: 404 });
      }

      if (cfHandleRef) {
        const cfSnap = await tx.get(cfHandleRef);
        if (cfSnap.exists) {
          const emailRef = String(cfSnap.data()?.emailRef || '').trim().toLowerCase();
          if (emailRef === emailKey || emailRef === docId.toLowerCase()) {
            tx.delete(cfHandleRef);
            cfHandleDeleted = true;
          }
        }
      }

      tx.delete(docRef);
    });

    logger.info('admin', 'registrant_deleted', {
      reqId,
      actorId: decoded.uid,
      detail: {
        emailMasked: maskEmail(emailKey),
        cfHandleDeleted,
        storageDeleted: storageResult.deleted,
        storageMissing: storageResult.missing,
        storageSkipped: storageResult.skipped,
      },
      status: 'ok',
    });

    return res.status(200).json({ success: true, storage: storageResult });
  } catch (error) {
    if (error?.statusCode === 404) {
      return res.status(404).json({ error: 'Registrant not found.' });
    }
    logger.error('admin', 'registrant_delete_error', { reqId, actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to delete registrant.' });
  }
}
