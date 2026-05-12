import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';
import {
  getRegistrantUniversityOptions,
  parseRegistrantFilters,
  queryAdminRegistrants,
} from '../../../lib/adminRegistrantFilters';

const PAGE_SIZE = 50;

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
  const { lastDocId, includeOptions } = req.body || {};
  const filters = parseRegistrantFilters(req.body || {});

  try {
    const [result, universities] = await Promise.all([
      queryAdminRegistrants(db, filters, { lastDocId, pageSize: PAGE_SIZE }),
      includeOptions ? getRegistrantUniversityOptions(db) : Promise.resolve(null),
    ]);

    logger.info('admin', 'registrants_fetched', {
      reqId,
      actorId: decoded.uid,
      detail: { count: result.registrants.length, hasMore: result.hasMore, cursor: lastDocId || null, filters },
      status: 'ok',
    });
    return res.status(200).json({
      ...result,
      ...(universities ? { filterOptions: { universities } } : {}),
    });
  } catch (error) {
    if (error.code === 'cursor_gone') {
      return res.status(410).json({ error: 'cursor_gone', message: error.message });
    }
    logger.error('admin', 'registrants_fetch_error', { reqId, actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to fetch registrants.' });
  }
}
