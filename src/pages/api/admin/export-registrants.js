import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';
import { parseRegistrantFilters, queryAdminRegistrants } from '../../../lib/adminRegistrantFilters';


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

  try {
    const filters = parseRegistrantFilters(req.body || {});
    const { registrants } = await queryAdminRegistrants(db, filters, { exportAll: true });

    return res.status(200).json({ registrants });
  } catch (error) {
    logger.error('admin', 'export_registrants_error', { reqId: genReqId(), actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to export registrants.' });
  }
}
