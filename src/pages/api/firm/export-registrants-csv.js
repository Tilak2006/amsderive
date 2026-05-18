/**
 * POST /api/firm/export-registrants-csv
 *
 * Returns approved registrants as a CSV download.
 * Gated by access.csvExport flag — firms without it get 403.
 * Columns included respect the same emailAccess / linkedinAccess flags.
 */

import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';


function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // Prevent CSV formula injection — prefix with ' so Excel/Sheets treat it as text
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
    if (!firmSnap.exists) return res.status(401).json({ error: 'Not a firm account' });
    firmData = firmSnap.data();
  } catch (err) {
    logger.error('firms', 'csv_export_firm_lookup', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (!firmData.access?.csvExport) {
    logger.warn('firms', 'csv_export_denied', { reqId, actorId: uid, status: 'blocked' });
    return res.status(403).json({ error: 'CSV export is not enabled for your account.' });
  }

  const { emailAccess, linkedinAccess } = firmData.access || {};

  try {
    const snapshot = await db
      .collection('registrants')
      .where('status', '==', 'approved')
      .where('dataConsent', '==', true)
      .get();

    const docs = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.submittedAt?.toMillis?.() ?? 0) - (a.submittedAt?.toMillis?.() ?? 0));

    const headers = ['Name'];
    if (emailAccess) headers.push('Email');
    headers.push('Institution', 'Branch', 'Graduation Year', 'CF Handle', 'GitHub', 'Round', 'Submitted');
    if (linkedinAccess) headers.push('LinkedIn');

    const rows = docs.map((d) => {
      const row = [d.fullName];
      if (emailAccess) row.push(d.email || '');
      row.push(
        d.university,
        d.branch || '',
        d.graduationYear ? String(d.graduationYear) : '',
        d.codeforcesHandle,
        d.gitHub || '',
        d.round || '',
        d.submittedAt?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? '',
      );
      if (linkedinAccess) row.push(d.linkedIn || '');
      return row.map(escapeCsv).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\r\n');

    logger.info('firms', 'csv_exported', { reqId, actorId: uid, detail: { rows: docs.length }, status: 'ok' });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ams-derive-registrants.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    logger.error('firms', 'csv_export_query', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
