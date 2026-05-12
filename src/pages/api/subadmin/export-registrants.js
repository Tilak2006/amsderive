import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireSubadmin } from '../../../lib/subadminAuth';
import {
  parseSubadminRegistrantFilters,
  queryAdminRegistrants,
  serializeSubadminRegistrantDoc,
} from '../../../lib/adminRegistrantFilters';


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireSubadmin(req, admin.auth(), db);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  try {
    const filters = parseSubadminRegistrantFilters(req.body || {});
    const { registrants } = await queryAdminRegistrants(db, filters, {
      exportAll: true,
      serializer: serializeSubadminRegistrantDoc,
    });

    logger.info('subadmin', 'export_registrants', { reqId: genReqId(), actorId: 'subadmin', detail: { count: registrants.length }, status: 'ok' });
    return res.status(200).json({ registrants });
  } catch (error) {
    logger.error('subadmin', 'export_registrants_error', { reqId: genReqId(), actorId: 'subadmin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to export registrants.' });
  }
}
