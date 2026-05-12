import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { requireSubadmin } from '../../../lib/subadminAuth';
import {
  getRegistrantUniversityOptions,
  parseSubadminRegistrantFilters,
  queryAdminRegistrants,
  serializeSubadminRegistrantDoc,
} from '../../../lib/adminRegistrantFilters';

const PAGE_SIZE = 50;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireSubadmin(req, admin.auth(), db);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const { lastDocId, includeOptions } = req.body || {};
  const filters = parseSubadminRegistrantFilters(req.body || {});

  try {
    const [result, universities] = await Promise.all([
      queryAdminRegistrants(db, filters, {
        lastDocId,
        pageSize: PAGE_SIZE,
        serializer: serializeSubadminRegistrantDoc,
      }),
      includeOptions ? getRegistrantUniversityOptions(db) : Promise.resolve(null),
    ]);

    logger.info('subadmin', 'registrants_fetched', {
      reqId,
      actorId: 'subadmin',
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
    logger.error('subadmin', 'registrants_fetch_error', { reqId, actorId: 'subadmin', status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to fetch registrants.' });
  }
}
