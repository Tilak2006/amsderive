import { admin, getStorageBucket } from '../../../lib/firebaseAdmin';
import { requireAdmin } from '../../../lib/adminAuth';
import { IncomingForm } from 'formidable';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logger, { genReqId } from '../../../utils/logger';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME = 'application/pdf';
const PDF_MAGIC = '%PDF';

function sanitizeFileName(raw) {
  const base = path.basename(raw || 'broadcast.pdf').replace(/[^\w.\- ]+/g, '_').trim();
  return (base || 'broadcast.pdf').slice(0, 120);
}

function safeBroadcastId(raw) {
  const value = String(raw || '').trim();
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(value)) return null;
  return value;
}

async function parseForm(req) {
  const form = new IncomingForm({
    maxFileSize: MAX_ATTACHMENT_BYTES,
    keepExtensions: false,
    multiples: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
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
  let parsed;
  try {
    parsed = await parseForm(req);
  } catch (err) {
    if (err.message?.includes('maxFileSize')) {
      return res.status(400).json({ error: 'Attachment exceeds 3 MB limit.' });
    }
    return res.status(400).json({ error: 'Invalid attachment upload.' });
  }

  const { fields, files } = parsed;
  const broadcastId = safeBroadcastId(Array.isArray(fields.broadcastId) ? fields.broadcastId[0] : fields.broadcastId);
  if (!broadcastId) {
    return res.status(400).json({ error: 'Valid broadcastId is required.' });
  }

  const fileField = files.file;
  const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;
  if (!uploadedFile) {
    return res.status(400).json({ error: 'No attachment received.' });
  }

  const cleanup = () => fs.unlink(uploadedFile.filepath, () => {});

  if (uploadedFile.mimetype !== ALLOWED_MIME) {
    cleanup();
    return res.status(400).json({ error: 'Only PDF attachments are accepted.' });
  }

  if (uploadedFile.size > MAX_ATTACHMENT_BYTES) {
    cleanup();
    return res.status(400).json({ error: 'Attachment exceeds 3 MB limit.' });
  }

  let fileBuffer;
  try {
    fileBuffer = fs.readFileSync(uploadedFile.filepath);
  } catch {
    cleanup();
    return res.status(400).json({ error: 'Failed to read attachment.' });
  }

  if (fileBuffer.slice(0, 4).toString('ascii') !== PDF_MAGIC) {
    cleanup();
    return res.status(400).json({ error: 'Attachment is not a valid PDF.' });
  }

  const fileName = sanitizeFileName(uploadedFile.originalFilename || 'broadcast.pdf');
  const suffix = crypto.randomUUID();
  const storagePath = `broadcast_attachments/${broadcastId}/${Date.now()}_${suffix}.pdf`;

  try {
    const bucket = getStorageBucket();
    await bucket.file(storagePath).save(fileBuffer, {
      metadata: {
        contentType: ALLOWED_MIME,
        metadata: {
          originalName: fileName,
          uploadedBy: decoded.uid,
        },
      },
    });

    logger.info('admin', 'broadcast_attachment_uploaded', {
      reqId,
      actorId: decoded.uid,
      detail: { broadcastId, size: uploadedFile.size, fileName },
      status: 'ok',
    });

    return res.status(200).json({
      success: true,
      attachment: {
        storagePath,
        fileName,
        size: uploadedFile.size,
        contentType: ALLOWED_MIME,
      },
    });
  } catch (error) {
    logger.error('admin', 'broadcast_attachment_upload_failed', {
      reqId,
      actorId: decoded.uid,
      detail: { broadcastId },
      status: 'failed',
    }, error);
    return res.status(500).json({ error: 'Attachment upload failed.' });
  } finally {
    cleanup();
  }
}
