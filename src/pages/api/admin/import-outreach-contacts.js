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
const FIRESTORE_CHUNK = 500;
const MAX_ROWS = 25000;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const ch = csv[i];
    const next = csv[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += ch;
  }

  if (inQuotes) throw new Error('Unclosed quoted field');

  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function firstNameFrom(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
  const { csv } = req.body || {};

  if (!csv || typeof csv !== 'string') {
    return res.status(400).json({ error: 'CSV text is required.' });
  }

  let rows;
  try {
    rows = parseCsv(csv);
  } catch {
    return res.status(400).json({ error: 'Could not parse CSV.' });
  }

  if (rows.length < 2) {
    return res.status(400).json({ error: 'CSV must include a header row and at least one contact.' });
  }
  if (rows.length - 1 > MAX_ROWS) {
    return res.status(400).json({ error: `CSV exceeds ${MAX_ROWS} contacts.` });
  }

  const headers = rows[0].map(normalizeHeader);
  const nameIdx = headers.indexOf('fullname');
  const institutionIdx = headers.indexOf('institution');
  const emailIdx = headers.indexOf('email');

  if (nameIdx < 0 || institutionIdx < 0 || emailIdx < 0) {
    return res.status(400).json({ error: 'CSV headers must include Full Name, Institution, Email.' });
  }

  const contactsByEmail = new Map();
  let invalid = 0;

  for (const row of rows.slice(1)) {
    const fullName = String(row[nameIdx] || '').trim();
    const institution = String(row[institutionIdx] || '').trim();
    const email = String(row[emailIdx] || '').trim().toLowerCase();

    if (!fullName || !institution || !isValidEmail(email)) {
      invalid += 1;
      continue;
    }

    contactsByEmail.set(email, {
      email,
      emailLower: email,
      fullName,
      institution,
      firstName: firstNameFrom(fullName),
      source: 'cf_outreach',
    });
  }

  const contacts = Array.from(contactsByEmail.values());
  if (contacts.length === 0) {
    return res.status(400).json({ error: 'No valid contacts found.', invalid });
  }

  let imported = 0;
  let updated = 0;

  try {
    for (let i = 0; i < contacts.length; i += FIRESTORE_CHUNK) {
      const chunk = contacts.slice(i, i + FIRESTORE_CHUNK);
      const refs = chunk.map((contact) => db.collection('outreach_contacts').doc(contact.emailLower));
      const existingSnaps = await db.getAll(...refs);
      const batch = db.batch();

      chunk.forEach((contact, idx) => {
        const snap = existingSnaps[idx];
        const existing = snap.exists ? snap.data() : null;
        if (existing) updated += 1;
        else imported += 1;

        batch.set(refs[idx], {
          ...contact,
          createdAt: existing?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          unsubscribed: existing?.unsubscribed === true,
          deliveryStatus: existing?.deliveryStatus || null,
        }, { merge: true });
      });

      await batch.commit();
    }

    logger.info('admin', 'outreach_contacts_imported', {
      reqId,
      actorId: decoded.uid,
      detail: { imported, updated, invalid, attempted: rows.length - 1 },
      status: 'ok',
    });

    return res.status(200).json({
      success: true,
      attempted: rows.length - 1,
      imported,
      updated,
      invalid,
      totalValid: contacts.length,
    });
  } catch (error) {
    logger.error('admin', 'outreach_contacts_import_failed', { reqId, actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Import failed.' });
  }
}
