const DEFAULT_PAGE_SIZE = 50;
const SCAN_BATCH_SIZE = 200;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const VALID_STATUSES = new Set(['pending', 'approved', 'rejected']);
const VALID_ROUNDS = new Set(['prior', 'posterior', 'convergence']);
const VALID_DELIVERY_STATUSES = new Set(['pending', 'delivered', 'bounced', 'complained', 'delayed']);
const VALID_DATE_RANGES = new Set(['today', 'last24h', 'last7d', 'custom']);
const VALID_TRANSCRIPT_FILTERS = new Set(['has', 'missing']);
const VALID_CONSENT_FILTERS = new Set(['yes', 'no']);
const VALID_SORTS = new Set(['newest', 'oldest', 'name']);

function cleanString(value, maxLength = 160) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

function parseIstDateStart(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || '')) return null;
  return new Date(`${dateString}T00:00:00.000+05:30`).getTime();
}

function parseIstDateEnd(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || '')) return null;
  return new Date(`${dateString}T23:59:59.999+05:30`).getTime();
}

function todayIstStartMs(now = new Date()) {
  const todayIST = new Date(now.getTime() + IST_OFFSET_MS);
  todayIST.setUTCHours(0, 0, 0, 0);
  return todayIST.getTime() - IST_OFFSET_MS;
}

function timestampMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function timestampIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function parseRegistrantFilters(body = {}) {
  const status = lower(body.status);
  const round = lower(body.round);
  const deliveryStatus = lower(body.deliveryStatus);
  const dateRange = lower(body.dateRange);
  const transcript = lower(body.transcript);
  const consent = lower(body.consent);
  const sortOrder = lower(body.sortOrder);
  const graduationYearRaw = cleanString(body.graduationYear, 8);
  const graduationYear = /^\d{4}$/.test(graduationYearRaw) ? Number(graduationYearRaw) : null;
  const now = new Date();

  let dateStartMs = null;
  let dateEndMs = null;

  if (dateRange === 'today') {
    dateStartMs = todayIstStartMs(now);
  } else if (dateRange === 'last24h') {
    dateStartMs = now.getTime() - 24 * 60 * 60 * 1000;
  } else if (dateRange === 'last7d') {
    dateStartMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  } else if (dateRange === 'custom') {
    dateStartMs = parseIstDateStart(cleanString(body.startDate, 10));
    dateEndMs = parseIstDateEnd(cleanString(body.endDate, 10));
  }

  return {
    search: cleanString(body.search, 120).toLowerCase(),
    status: VALID_STATUSES.has(status) ? status : 'all',
    round: VALID_ROUNDS.has(round) ? round : 'all',
    deliveryStatus: VALID_DELIVERY_STATUSES.has(deliveryStatus) ? deliveryStatus : 'all',
    dateRange: VALID_DATE_RANGES.has(dateRange) ? dateRange : 'all',
    dateStartMs,
    dateEndMs,
    graduationYear,
    refCode: cleanString(body.refCode, 80).toLowerCase(),
    transcript: VALID_TRANSCRIPT_FILTERS.has(transcript) ? transcript : 'all',
    university: cleanString(body.university, 180),
    branch: cleanString(body.branch, 120),
    consent: VALID_CONSENT_FILTERS.has(consent) ? consent : 'all',
    sortOrder: VALID_SORTS.has(sortOrder) ? sortOrder : 'newest',
  };
}

export function serializeRegistrantDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    fullName: data.fullName || '',
    email: data.email || '',
    university: data.university || '',
    branch: data.branch || '',
    graduationYear: data.graduationYear || null,
    codeforcesHandle: data.codeforcesHandle || '',
    phoneNumber: data.phoneNumber || null,
    linkedIn: data.linkedIn || null,
    gitHub: data.gitHub || null,
    dataConsent: data.dataConsent || false,
    submittedAt: timestampIso(data.submittedAt),
    status: data.status || 'pending',
    round: data.round || 'prior',
    resumeUrl: data.resumeUrl || null,
    resumeFileName: data.resumeFileName || null,
    transcriptUrl: data.transcriptUrl || null,
    transcriptFileName: data.transcriptFileName || null,
    ipHash: data.ipHash ? `••••••••${data.ipHash.slice(-8)}` : '—',
    refCode: data.refCode || null,
    deliveryStatus: data.deliveryStatus || null,
    deliveryStatusAt: timestampIso(data.deliveryStatusAt),
  };
}

export function serializeSubadminRegistrantDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    fullName: data.fullName || '',
    university: data.university || '',
    branch: data.branch || '',
    graduationYear: data.graduationYear || null,
    codeforcesHandle: data.codeforcesHandle || '',
    dataConsent: data.dataConsent || false,
    submittedAt: timestampIso(data.submittedAt),
    status: data.status || 'pending',
    round: data.round || 'prior',
    refCode: data.refCode || null,
    linkedIn: data.linkedIn || null,
    resumeUrl: data.resumeUrl || null,
    resumeFileName: data.resumeFileName || null,
  };
}

export function parseSubadminRegistrantFilters(body = {}) {
  const filters = parseRegistrantFilters(body);
  return {
    ...filters,
    deliveryStatus: 'all',
    refCode: '',
    transcript: 'all',
    searchFields: ['fullName', 'university', 'codeforcesHandle'],
  };
}

function matchesRegistrantFilters(data, filters) {
  const searchFields = filters.searchFields || [
    'fullName',
    'email',
    'emailLower',
    'university',
    'codeforcesHandle',
    'phoneNumber',
    'refCode',
  ];
  const searchable = [
    ...searchFields.map((field) => data[field]),
  ].map(lower).join(' ');

  if (filters.search && !searchable.includes(filters.search)) return false;
  if (filters.status !== 'all' && lower(data.status || 'pending') !== filters.status) return false;
  if (filters.round !== 'all' && lower(data.round || 'prior') !== filters.round) return false;

  const deliveryStatus = lower(data.deliveryStatus);
  if (filters.deliveryStatus === 'pending' && deliveryStatus) return false;
  if (filters.deliveryStatus !== 'all' && filters.deliveryStatus !== 'pending' && deliveryStatus !== filters.deliveryStatus) return false;

  const submittedAtMs = timestampMs(data.submittedAt);
  if (filters.dateStartMs && submittedAtMs < filters.dateStartMs) return false;
  if (filters.dateEndMs && submittedAtMs > filters.dateEndMs) return false;

  if (filters.graduationYear && Number(data.graduationYear) !== filters.graduationYear) return false;
  if (filters.refCode && !lower(data.refCode).includes(filters.refCode)) return false;
  if (filters.university && lower(data.university) !== lower(filters.university)) return false;
  if (filters.branch && lower(data.branch) !== lower(filters.branch)) return false;
  if (filters.consent === 'yes' && data.dataConsent !== true) return false;
  if (filters.consent === 'no' && data.dataConsent === true) return false;

  const hasTranscript = Boolean(data.transcriptUrl || data.transcriptFileName);
  if (filters.transcript === 'has' && !hasTranscript) return false;
  if (filters.transcript === 'missing' && hasTranscript) return false;

  return true;
}

function orderedRegistrantQuery(db, filters) {
  let query = db.collection('registrants');

  const pushedEquality = getPushedEqualityFilter(filters);
  if (pushedEquality) {
    query = query.where(pushedEquality.field, '==', pushedEquality.value);
  }

  if (filters.sortOrder !== 'name' && filters.dateStartMs) {
    query = query.where('submittedAt', '>=', timestampFromMillis(filters.dateStartMs));
  }
  if (filters.sortOrder !== 'name' && filters.dateEndMs) {
    query = query.where('submittedAt', '<=', timestampFromMillis(filters.dateEndMs));
  }

  if (filters.sortOrder === 'name') {
    return query.orderBy('fullName', 'asc');
  }
  return query.orderBy('submittedAt', filters.sortOrder === 'oldest' ? 'asc' : 'desc');
}

function timestampFromMillis(ms) {
  const Timestamp = globalThis?.FirebaseFirestore?.Timestamp;
  if (Timestamp?.fromMillis) return Timestamp.fromMillis(ms);
  return new Date(ms);
}

function getPushedEqualityFilter(filters) {
  // Keep admin list filtering index-tolerant. The live Firestore project can
  // lag behind firestore.indexes.json during event ops, so pushing equality
  // filters alongside orderBy(submittedAt) can hard-fail the dashboard.
  // matchesRegistrantFilters still applies every filter after each page scan.
  return null;
}

export async function queryAdminRegistrants(db, filters, {
  lastDocId = null,
  pageSize = DEFAULT_PAGE_SIZE,
  exportAll = false,
  serializer = serializeRegistrantDoc,
} = {}) {
  const matches = [];
  let cursorSnap = null;
  let exhausted = false;

  if (lastDocId && !exportAll) {
    cursorSnap = await db.collection('registrants').doc(lastDocId).get();
    if (!cursorSnap.exists) {
      const error = new Error('Pagination cursor no longer exists. Reload the list.');
      error.code = 'cursor_gone';
      throw error;
    }
  }

  while (exportAll || matches.length < pageSize + 1) {
    let query = orderedRegistrantQuery(db, filters).limit(exportAll ? 500 : SCAN_BATCH_SIZE);
    if (cursorSnap) query = query.startAfter(cursorSnap);

    const snapshot = await query.get();
    if (snapshot.empty) {
      exhausted = true;
      break;
    }

    for (const doc of snapshot.docs) {
      if (matchesRegistrantFilters(doc.data(), filters)) {
        matches.push(doc);
        if (!exportAll && matches.length >= pageSize + 1) break;
      }
    }

    cursorSnap = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.docs.length < (exportAll ? 500 : SCAN_BATCH_SIZE)) {
      exhausted = true;
      break;
    }
  }

  const pageDocs = exportAll ? matches : matches.slice(0, pageSize);
  const hasMore = !exportAll && (matches.length > pageSize || !exhausted);

  return {
    registrants: pageDocs.map(serializer),
    lastDocId: hasMore && pageDocs.length > 0 ? pageDocs[pageDocs.length - 1].id : null,
    hasMore,
  };
}

export async function getRegistrantUniversityOptions(db) {
  const snapshot = await db.collection('registrants').select('university').get();
  const universities = new Set();

  snapshot.docs.forEach((doc) => {
    const university = cleanString(doc.data().university, 180);
    if (university) universities.add(university);
  });

  return Array.from(universities).sort((a, b) => a.localeCompare(b));
}
