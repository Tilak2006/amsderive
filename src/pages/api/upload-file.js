// src/pages/api/upload-file.js
import * as admin from 'firebase-admin';
import crypto from 'crypto';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import logger, { genReqId } from '../../utils/logger';

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

// Disable Next.js body parser — formidable needs the raw stream
export const config = { api: { bodyParser: false } };

const MAX_SIZE_BYTES = 500 * 1024; // 500 KB
const ALLOWED_MIME = 'application/pdf';
const PDF_MAGIC = '%PDF';

const ALLOWED_ORIGINS = [
  'https://amsderive.in',
  'https://www.amsderive.in',
  'http://localhost:3000',
  'http://localhost:3001',
];

// IP upload cap: 100/hr = ~50 students on shared college NAT (2 uploads each).
// Hard block above this threshold to prevent storage abuse.
const UPLOAD_RATE_LIMIT = 100;
const UPLOAD_RATE_WINDOW_MS = 60 * 60 * 1000;

const db = admin.firestore();

function sanitizeName(raw) {
  return (raw || 'file')
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase()
    .slice(0, 40);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Cross-origin upload guard — multipart/form-data is a "simple request" so browsers send it
  // without a preflight even cross-origin. Reject if Origin is present but not ours.
  const origin = req.headers['origin'];
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // IP rate limit — checked before parsing body (cheap Firestore read before expensive file buffer)
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString().split(',')[0].trim();
  const ipHash = crypto.createHash('sha256').update(clientIp || 'unknown').digest('hex');
  try {
    const rateLimitRef = db.collection('_rate_limits').doc(`upload_${ipHash}`);
    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(rateLimitRef);
      const cutoff = Date.now() - UPLOAD_RATE_WINDOW_MS;
      const recent = (doc.exists ? doc.data().timestamps || [] : []).filter((ts) => ts > cutoff);
      if (recent.length >= UPLOAD_RATE_LIMIT) return false;
      recent.push(Date.now());
      tx.set(rateLimitRef, {
        timestamps: recent,
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 2 * 60 * 60 * 1000),
      });
      return true;
    });
    if (!result) {
      return res.status(429).json({ error: 'Too many uploads from this network. Please try again later.' });
    }
  } catch {
    // Fail open — don't block legit users if rate limit check errors
  }

  // Parse multipart form — maxFileSize enforced here
  let fields, files;
  try {
    const form = new IncomingForm({
      maxFileSize: MAX_SIZE_BYTES,
      keepExtensions: false,
      multiples: false,
    });
    [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fi) => (err ? reject(err) : resolve([f, fi])));
    });
  } catch (err) {
    if (err.message?.includes('maxFileSize')) {
      return res.status(400).json({ error: 'File exceeds 500 KB limit.' });
    }
    return res.status(400).json({ error: 'Invalid upload request.' });
  }

  // Extract exactly one file
  const fileField = files.file;
  const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;

  if (!uploadedFile) {
    return res.status(400).json({ error: 'No file received.' });
  }

  // MIME type check (from multipart headers — client-declared)
  if (uploadedFile.mimetype !== ALLOWED_MIME) {
    fs.unlink(uploadedFile.filepath, () => {});
    return res.status(400).json({ error: 'Only PDF files are accepted.' });
  }

  // Size double-check (formidable may allow slightly over due to chunking)
  if (uploadedFile.size > MAX_SIZE_BYTES) {
    fs.unlink(uploadedFile.filepath, () => {});
    return res.status(400).json({ error: 'File exceeds 500 KB limit.' });
  }

  // Magic bytes check — read first 4 bytes to confirm actual PDF
  let fileBuffer;
  try {
    fileBuffer = fs.readFileSync(uploadedFile.filepath);
  } catch {
    fs.unlink(uploadedFile.filepath, () => {});
    return res.status(400).json({ error: 'Failed to read uploaded file.' });
  }

  const magic = fileBuffer.slice(0, 4).toString('ascii');
  if (magic !== PDF_MAGIC) {
    fs.unlink(uploadedFile.filepath, () => {});
    return res.status(400).json({ error: 'File is not a valid PDF.' });
  }

  // Build safe Storage path
  const nameField = Array.isArray(fields.name) ? fields.name[0] : fields.name;
  const typeField = Array.isArray(fields.type) ? fields.type[0] : fields.type;
  const safeName = sanitizeName(nameField);
  const safeType = ['resume', 'transcript'].includes(typeField) ? typeField : 'file';
  const timestamp = Date.now();
  // Append a random UUID so paths cannot be brute-forced by guessing timestamp+name
  const uniq = crypto.randomUUID();
  const storagePath = `registrants/${timestamp}_${safeName}_${safeType}_${uniq}.pdf`;

  // Upload via Admin SDK
  try {
    const bucket = admin.storage().bucket();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          originalName: path.basename(uploadedFile.originalFilename || 'upload.pdf').slice(0, 100),
        },
      },
    });
  } catch (err) {
    logger.error('registration', 'storage_write_failed', {
      reqId: genReqId(), status: 'failed',
    }, err);
    return res.status(500).json({ error: 'Upload failed. Please try again.' });
  } finally {
    fs.unlink(uploadedFile.filepath, () => {});
  }

  // Construct URL in same format storageService.js used
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const encodedPath = encodeURIComponent(storagePath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;

  const originalName = uploadedFile.originalFilename || `${safeType}.pdf`;

  return res.status(200).json({
    success: true,
    url,
    fileName: path.basename(originalName).slice(0, 200),
  });
}
