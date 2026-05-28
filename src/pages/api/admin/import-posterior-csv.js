import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';

const FIRESTORE_IN_CHUNK = 30;
const FIRESTORE_GET_ALL_CHUNK = 300;
const FIRESTORE_BATCH_LIMIT = 500;
const MAX_ROWS = 5000;
const EMAIL_HEADER_ALIASES = new Set(['email', 'emailaddress', 'emailid', 'e-mail', 'e-mailaddress', 'e-mailid']);

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
  return String(value || '').replace(/^\uFEFF/, '').trim().toLowerCase();
}

function normalizeHeaderKey(value) {
  return normalizeHeader(value).replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]+/g, '');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function findEmailColumn(headers) {
  return headers.findIndex((header) => {
    const normalized = normalizeHeader(header);
    const compact = normalizeHeaderKey(header);
    return EMAIL_HEADER_ALIASES.has(normalized) || EMAIL_HEADER_ALIASES.has(compact);
  });
}

async function findByDocId(emails) {
  const matches = new Map();

  for (let i = 0; i < emails.length; i += FIRESTORE_GET_ALL_CHUNK) {
    const chunk = emails.slice(i, i + FIRESTORE_GET_ALL_CHUNK);
    const refs = chunk.map((email) => db.collection('registrants').doc(email));
    const snaps = await db.getAll(...refs);

    snaps.forEach((doc) => {
      if (!doc.exists) return;
      const data = doc.data();
      const email = normalizeEmail(data.emailLower || data.email || doc.id);
      if (email && !matches.has(email)) {
        matches.set(email, { doc, data, matchedBy: 'docId' });
      }
    });
  }

  return matches;
}

async function findByEmailField(emails, field, existingMatches) {
  for (let i = 0; i < emails.length; i += FIRESTORE_IN_CHUNK) {
    const chunk = emails.slice(i, i + FIRESTORE_IN_CHUNK);
    const snap = await db.collection('registrants').where(field, 'in', chunk).get();

    snap.forEach((doc) => {
      const data = doc.data();
      const email = normalizeEmail(data.emailLower || data.email);
      if (email && !existingMatches.has(email)) {
        existingMatches.set(email, { doc, data, matchedBy: field });
      }
    });
  }
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
  const csvText = req.body?.csvText ?? req.body?.csv;
  const dryRun = req.body?.dryRun === true;

  if (!csvText || typeof csvText !== 'string') {
    return res.status(400).json({ error: 'CSV text is required.' });
  }

  let rows;
  try {
    rows = parseCsv(csvText);
  } catch {
    return res.status(400).json({ error: 'Could not parse CSV.' });
  }

  if (rows.length < 2) {
    return res.status(400).json({ error: 'CSV must include a header row and at least one registrant.' });
  }
  if (rows.length - 1 > MAX_ROWS) {
    return res.status(400).json({ error: `CSV exceeds ${MAX_ROWS} registrants. Split it into smaller imports.` });
  }

  const emailIdx = findEmailColumn(rows[0]);

  if (emailIdx < 0) {
    return res.status(400).json({
      error: 'CSV headers must include an email column.',
      acceptedHeaders: ['Email', 'Email Address', 'E-mail', 'Email ID'],
    });
  }

  const emails = [];
  const seenEmails = new Set();
  const duplicateEmails = [];
  const invalidEmails = [];

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const rawEmail = String(row[emailIdx] || '');
    const email = normalizeEmail(rawEmail);

    if (!email || !isValidEmail(email)) {
      invalidEmails.push({ row: rowNumber, email: rawEmail.trim() });
      return;
    }

    if (seenEmails.has(email)) {
      duplicateEmails.push({ row: rowNumber, email });
      return;
    }

    seenEmails.add(email);
    emails.push(email);
  });

  if (emails.length === 0) {
    return res.status(400).json({
      error: 'CSV did not contain any valid unique email rows.',
      duplicates: duplicateEmails.length,
      invalidEmails: invalidEmails.length,
      duplicateEmails,
      invalidEmailRows: invalidEmails,
    });
  }

  const summary = {
    matched: 0,
    updated: 0,
    alreadyPosterior: 0,
    skippedAdvanced: 0,
    unmatched: 0,
    duplicates: duplicateEmails.length,
    invalidEmails: invalidEmails.length,
    nonApproved: 0,
    failed: 0,
    duplicateEmails,
    invalidEmailRows: invalidEmails,
    unmatchedEmails: [],
    nonApprovedEmails: [],
    skippedAdvancedEmails: [],
    failedEmails: [],
  };

  try {
    const matches = await findByDocId(emails);
    let remaining = emails.filter((email) => !matches.has(email));
    await findByEmailField(remaining, 'emailLower', matches);
    remaining = emails.filter((email) => !matches.has(email));
    await findByEmailField(remaining, 'email', matches);

    const updates = [];

    emails.forEach((email) => {
      const match = matches.get(email);
      if (!match) {
        summary.unmatched += 1;
        summary.unmatchedEmails.push(email);
        return;
      }

      summary.matched += 1;
      const data = match.data;

      if (data.status !== 'approved') {
        summary.nonApproved += 1;
        summary.nonApprovedEmails.push({ email, status: data.status || 'pending', round: data.round || 'prior' });
        return;
      }

      if (data.round === 'posterior') {
        summary.alreadyPosterior += 1;
        return;
      }

      if (data.round === 'convergence') {
        summary.skippedAdvanced += 1;
        summary.skippedAdvancedEmails.push(email);
        return;
      }

      updates.push({ email, ref: match.doc.ref });
    });

    if (dryRun) {
      summary.updated = updates.length;
    } else {
      for (let i = 0; i < updates.length; i += FIRESTORE_BATCH_LIMIT) {
        const chunk = updates.slice(i, i + FIRESTORE_BATCH_LIMIT);
        const batch = db.batch();

        chunk.forEach(({ ref }) => {
          batch.update(ref, {
            round: 'posterior',
            roundUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        try {
          await batch.commit();
          summary.updated += chunk.length;
        } catch (batchErr) {
          summary.failed += chunk.length;
          summary.failedEmails.push(...chunk.map(({ email }) => email));
          logger.error('admin', 'posterior_csv_import_batch_failed', {
            reqId,
            actorId: decoded.uid,
            detail: { batchStart: i, count: chunk.length },
            status: 'degraded',
          }, batchErr);
        }
      }
    }

    const counts = {
      matched: summary.matched,
      updated: summary.updated,
      alreadyPosterior: summary.alreadyPosterior,
      skippedAdvanced: summary.skippedAdvanced,
      unmatched: summary.unmatched,
      duplicates: summary.duplicates,
      invalidEmails: summary.invalidEmails,
      nonApproved: summary.nonApproved,
      failed: summary.failed,
      attempted: rows.length - 1,
      validUnique: emails.length,
    };

    logger.info('admin', 'posterior_csv_imported', {
      reqId,
      actorId: decoded.uid,
      detail: counts,
      status: dryRun ? 'preview' : summary.failed > 0 ? 'degraded' : 'ok',
    });

    try {
      await db.collection('_audit_log').add({
        type: dryRun ? 'posterior_csv_import_preview' : 'posterior_csv_import',
        actorId: decoded.uid,
        reqId,
        counts,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditErr) {
      logger.error('admin', 'posterior_csv_import_audit_log_failed', {
        reqId,
        actorId: decoded.uid,
        detail: counts,
        status: 'degraded',
      }, auditErr);
    }

    return res.status(200).json({
      success: true,
      dryRun,
      partialFailure: summary.failed > 0,
      ...summary,
    });
  } catch (error) {
    logger.error('admin', 'posterior_csv_import_failed', { reqId, actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Import failed before any updates were attempted.' });
  }
}
