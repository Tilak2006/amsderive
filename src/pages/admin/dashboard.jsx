import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import styles from '../../styles/admin.module.css';

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins} IST`;
}

// Prefix a single quote on fields starting with =+-@ (and a couple of control chars) so
// Excel/Sheets render them as text instead of evaluating them as formulas.
function csvSafe(raw) {
  const str = raw == null ? '' : String(raw);
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

function exportCSV(data) {
  const headers = [
    'Full Name', 'Email', 'University', 'Branch', 'Graduation Year',
    'CF Handle', 'Phone Number', 'LinkedIn', 'GitHub', 'Data Consent',
    'Submitted At', 'Status', 'Round', 'Ref Code', 'Email Delivery',
    'Email Delivery At', 'Resume File', 'Resume URL', 'Transcript File', 'Transcript URL',
  ];
  const rows = data.map((r) => [
    `"${csvSafe(r.fullName).replace(/"/g, '""')}"`,
    `"${csvSafe(r.email).replace(/"/g, '""')}"`,
    `"${csvSafe(r.university).replace(/"/g, '""')}"`,
    `"${csvSafe(r.branch).replace(/"/g, '""')}"`,
    `"${csvSafe(r.graduationYear).replace(/"/g, '""')}"`,
    `"${csvSafe(r.codeforcesHandle).replace(/"/g, '""')}"`,
    `"${csvSafe(r.phoneNumber).replace(/"/g, '""')}"`,
    `"${csvSafe(r.linkedIn).replace(/"/g, '""')}"`,
    `"${csvSafe(r.gitHub).replace(/"/g, '""')}"`,
    r.dataConsent === true ? 'Yes' : 'No',
    `"${formatDate(r.submittedAt)}"`,
    r.status || 'pending',
    r.round || 'prior',
    `"${csvSafe(r.refCode).replace(/"/g, '""')}"`,
    r.deliveryStatus || 'pending',
    `"${formatDate(r.deliveryStatusAt)}"`,
    `"${csvSafe(r.resumeFileName).replace(/"/g, '""')}"`,
    `"${csvSafe(r.resumeUrl).replace(/"/g, '""')}"`,
    `"${csvSafe(r.transcriptFileName).replace(/"/g, '""')}"`,
    `"${csvSafe(r.transcriptUrl).replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ams-derive-registrants-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const CF_COPIED_STORAGE_KEY = 'amsderive.admin.copiedCodeforcesHandles.v1';
const BROADCAST_BATCH_SIZE = 100;

function normalizeCfHandle(handle) {
  return String(handle || '').trim().toLowerCase();
}

function getUniqueCfHandles(registrants) {
  const seen = new Set();
  const handles = [];

  registrants.forEach((r) => {
    const handle = String(r.codeforcesHandle || '').trim();
    const key = normalizeCfHandle(handle);
    if (!key || seen.has(key)) return;
    seen.add(key);
    handles.push(handle);
  });

  return handles;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = document.execCommand('copy');
    if (!copied) throw new Error('Clipboard copy failed');
  } finally {
    document.body.removeChild(textarea);
  }
}

// Attach a pre-parsed numeric timestamp to each registrant for fast sorting
function attachTs(registrants) {
  return registrants.map((r) => ({
    ...r,
    _ts: r.submittedAt ? new Date(r.submittedAt).getTime() : 0,
  }));
}

function attachOutreachTs(contacts) {
  return contacts.map((c) => ({
    ...c,
    _ts: c.createdAt ? new Date(c.createdAt).getTime() : 0,
  }));
}

function isSentLike(status) {
  return ['sent', 'delivered'].includes(String(status || '').toLowerCase());
}

function deliveryLabel(status, unsubscribed) {
  if (unsubscribed) return 'UNSUBSCRIBED';
  if (!status) return 'NOT SENT';
  return String(status).replace(/_/g, ' ').toUpperCase();
}

function registrantDeliveryLabel(status) {
  if (!status) return 'PENDING';
  if (status === 'complained') return 'SPAM COMPLAINT';
  return String(status).replace(/_/g, ' ').toUpperCase();
}

function statusBadgeClass(status) {
  if (status === 'approved') return styles.badgeGreen;
  if (status === 'rejected') return styles.badgeRed;
  return styles.badgeGrey;
}

function deliveryBadgeClass(status) {
  if (status === 'delivered') return styles.badgeGreen;
  if (status === 'bounced' || status === 'complained') return styles.badgeRed;
  if (status === 'delayed') return styles.badgeYellow;
  return styles.badgeGrey;
}

function buildRegistrantRequestBody(filters, lastDocId = null, includeOptions = false) {
  return {
    lastDocId,
    includeOptions,
    search: filters.search,
    status: filters.status,
    round: filters.round,
    deliveryStatus: filters.deliveryStatus,
    dateRange: filters.dateRange,
    startDate: filters.startDate,
    endDate: filters.endDate,
    graduationYear: filters.graduationYear,
    refCode: filters.refCode,
    transcript: filters.transcript,
    university: filters.university === 'all' ? '' : filters.university,
    branch: filters.branch === 'all' ? '' : filters.branch,
    consent: filters.consent,
    sortOrder: filters.sortOrder,
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [registrants, setRegistrants] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeList, setActiveList] = useState('registrants');
  const [outreachContacts, setOutreachContacts] = useState([]);
  const [outreachLastDoc, setOutreachLastDoc] = useState(null);
  const [outreachHasMore, setOutreachHasMore] = useState(false);
  const [loadingOutreach, setLoadingOutreach] = useState(true);
  const [loadingMoreOutreach, setLoadingMoreOutreach] = useState(false);
  const [outreachDeliveryFilter, setOutreachDeliveryFilter] = useState('all');

  const [stats, setStats] = useState({ total: 0, consentGiven: 0, today: 0, approved: 0, bounced: 0 });

  // Separate input state (changes on every keystroke) from filter state (debounced 200ms)
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRound, setFilterRound] = useState('all');
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterGraduationYear, setFilterGraduationYear] = useState('all');
  const [filterRefCode, setFilterRefCode] = useState('');
  const [filterTranscript, setFilterTranscript] = useState('all');
  const [filterConsent, setFilterConsent] = useState('all');
  const [filterUniversity, setFilterUniversity] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [universityOptions, setUniversityOptions] = useState([]);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastFilter, setBroadcastFilter] = useState('all');
  const [broadcastTargetType, setBroadcastTargetType] = useState('registrants');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState(null);
  const [broadcastProgress, setBroadcastProgress] = useState(null);
  const [broadcastConfirming, setBroadcastConfirming] = useState(false);
  const [broadcastRetryId, setBroadcastRetryId] = useState(null);
  const [outreachImportLoading, setOutreachImportLoading] = useState(false);
  const [outreachImportMsg, setOutreachImportMsg] = useState(null);
  const [roundLoading, setRoundLoading] = useState(false);
  const [roundMsg, setRoundMsg] = useState(null);
  const [approveAllConfirm, setApproveAllConfirm] = useState(false);
  const [approveAllLoading, setApproveAllLoading] = useState(false);
  const [approveAllMsg, setApproveAllMsg] = useState(null);
  const [copiedCfHandles, setCopiedCfHandles] = useState([]);
  const [cfCopyLoading, setCfCopyLoading] = useState(false);
  const [cfCopyMsg, setCfCopyMsg] = useState(null);

  // Refs: store current user for callbacks that don't need to re-create on user change,
  // and token cache to avoid repeated getIdToken() async calls.
  const userRef = useRef(null);
  const tokenCache = useRef({ token: null, expiry: 0 });
  const outreachFileInputRef = useRef(null);
  const lastUrlQueryRef = useRef('');

  // Returns a cached Firebase ID token. Firebase SDK already caches internally,
  // but this avoids the async overhead of calling getIdToken() on every request.
  async function getToken() {
    if (tokenCache.current.token && Date.now() < tokenCache.current.expiry) {
      return tokenCache.current.token;
    }
    const token = await userRef.current?.getIdToken();
    tokenCache.current = { token, expiry: Date.now() + 50 * 60 * 1000 }; // 50-min TTL
    return token;
  }

  async function authHeaders() {
    const token = await getToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  const registrantFilters = useMemo(() => ({
    search,
    status: filterStatus,
    round: filterRound,
    deliveryStatus: filterDeliveryStatus,
    dateRange: filterDateRange,
    startDate: filterStartDate,
    endDate: filterEndDate,
    graduationYear: filterGraduationYear,
    refCode: filterRefCode,
    transcript: filterTranscript,
    university: filterUniversity,
    branch: filterBranch,
    consent: filterConsent,
    sortOrder,
  }), [
    search,
    filterStatus,
    filterRound,
    filterDeliveryStatus,
    filterDateRange,
    filterStartDate,
    filterEndDate,
    filterGraduationYear,
    filterRefCode,
    filterTranscript,
    filterUniversity,
    filterBranch,
    filterConsent,
    sortOrder,
  ]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        userRef.current = u;
        setUser(u);
        setChecking(false);
      } else {
        router.replace('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ── Persist copied CF handles locally so repeated invites only include new registrants.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CF_COPIED_STORAGE_KEY) || '[]');
      setCopiedCfHandles(Array.isArray(saved) ? saved.map(normalizeCfHandle).filter(Boolean) : []);
    } catch {
      setCopiedCfHandles([]);
    }
  }, []);

  // ── Escape to close panel ────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSelectedRegistrant(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── URL-persisted registrant filters ────────────────────────────────────
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query || {};
    const get = (key, fallback = '') => {
      const value = q[key];
      return Array.isArray(value) ? (value[0] || fallback) : (value || fallback);
    };
    const urlState = {
      search: get('search'),
      status: get('status', 'all'),
      round: get('round', 'all'),
      deliveryStatus: get('deliveryStatus', 'all'),
      dateRange: get('dateRange', 'all'),
      startDate: get('startDate'),
      endDate: get('endDate'),
      graduationYear: get('graduationYear', 'all'),
      refCode: get('refCode'),
      transcript: get('transcript', 'all'),
      consent: get('consent', 'all'),
      university: get('university', 'all'),
      branch: get('branch', 'all'),
      sort: get('sort', 'newest'),
    };
    const compactQuery = {};
    if (urlState.search) compactQuery.search = urlState.search;
    if (urlState.status !== 'all') compactQuery.status = urlState.status;
    if (urlState.round !== 'all') compactQuery.round = urlState.round;
    if (urlState.deliveryStatus !== 'all') compactQuery.deliveryStatus = urlState.deliveryStatus;
    if (urlState.dateRange !== 'all') compactQuery.dateRange = urlState.dateRange;
    if (urlState.dateRange === 'custom' && urlState.startDate) compactQuery.startDate = urlState.startDate;
    if (urlState.dateRange === 'custom' && urlState.endDate) compactQuery.endDate = urlState.endDate;
    if (urlState.graduationYear !== 'all') compactQuery.graduationYear = urlState.graduationYear;
    if (urlState.refCode) compactQuery.refCode = urlState.refCode;
    if (urlState.transcript !== 'all') compactQuery.transcript = urlState.transcript;
    if (urlState.consent !== 'all') compactQuery.consent = urlState.consent;
    if (urlState.university !== 'all') compactQuery.university = urlState.university;
    if (urlState.branch !== 'all') compactQuery.branch = urlState.branch;
    if (urlState.sort !== 'newest') compactQuery.sort = urlState.sort;
    const serialized = JSON.stringify(compactQuery);
    if (filtersHydrated && serialized === lastUrlQueryRef.current) return;
    lastUrlQueryRef.current = serialized;

    const initialSearch = urlState.search;
    setSearchInput(initialSearch);
    setSearch(initialSearch);
    setFilterStatus(urlState.status);
    setFilterRound(urlState.round);
    setFilterDeliveryStatus(urlState.deliveryStatus);
    setFilterDateRange(urlState.dateRange);
    setFilterStartDate(urlState.startDate);
    setFilterEndDate(urlState.endDate);
    setFilterGraduationYear(urlState.graduationYear);
    setFilterRefCode(urlState.refCode);
    setFilterTranscript(urlState.transcript);
    setFilterConsent(urlState.consent);
    setFilterUniversity(urlState.university);
    setFilterBranch(urlState.branch);
    setSortOrder(urlState.sort);
    setFiltersHydrated(true);
  }, [router.isReady, router.query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!router.isReady || !filtersHydrated) return;

    const nextQuery = {};
    if (search) nextQuery.search = search;
    if (filterStatus !== 'all') nextQuery.status = filterStatus;
    if (filterRound !== 'all') nextQuery.round = filterRound;
    if (filterDeliveryStatus !== 'all') nextQuery.deliveryStatus = filterDeliveryStatus;
    if (filterDateRange !== 'all') nextQuery.dateRange = filterDateRange;
    if (filterDateRange === 'custom' && filterStartDate) nextQuery.startDate = filterStartDate;
    if (filterDateRange === 'custom' && filterEndDate) nextQuery.endDate = filterEndDate;
    if (filterGraduationYear !== 'all') nextQuery.graduationYear = filterGraduationYear;
    if (filterRefCode) nextQuery.refCode = filterRefCode;
    if (filterTranscript !== 'all') nextQuery.transcript = filterTranscript;
    if (filterConsent !== 'all') nextQuery.consent = filterConsent;
    if (filterUniversity !== 'all') nextQuery.university = filterUniversity;
    if (filterBranch !== 'all') nextQuery.branch = filterBranch;
    if (sortOrder !== 'newest') nextQuery.sort = sortOrder;

    const serialized = JSON.stringify(nextQuery);
    if (serialized === lastUrlQueryRef.current) return;
    lastUrlQueryRef.current = serialized;
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
  }, [
    router,
    filtersHydrated,
    search,
    filterStatus,
    filterRound,
    filterDeliveryStatus,
    filterDateRange,
    filterStartDate,
    filterEndDate,
    filterGraduationYear,
    filterRefCode,
    filterTranscript,
    filterConsent,
    filterUniversity,
    filterBranch,
    sortOrder,
  ]);

  // ── Search debounce (200ms) ──────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Initial outreach + stats load ────────────────────────────────────────
  // Depends on uid (stable string), not user object (Firebase may give a new
  // reference on token refresh). Registrants load in a separate filter-aware effect.
  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();

    async function loadAll() {
      setLoadingOutreach(true);
      try {
        const token = await getToken();
        const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

        const [outreachRes, statsRes] = await Promise.all([
          fetch('/api/admin/get-outreach-contacts', {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({ lastDocId: null }),
            signal: controller.signal,
          }),
          fetch('/api/admin/get-stats', {
            method: 'POST',
            headers: hdrs,
            body: JSON.stringify({}),
            signal: controller.signal,
          }),
        ]);

        if (!outreachRes.ok || !statsRes.ok) {
          throw new Error('Admin data load failed');
        }

        const [outreachData, statsData] = await Promise.all([outreachRes.json(), statsRes.json()]);

        setOutreachContacts(attachOutreachTs(outreachData.contacts || []));
        setOutreachLastDoc(outreachData.lastDocId);
        setOutreachHasMore(outreachData.hasMore);
        setStats(statsData);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[dashboard] loadAll error:', err);
      } finally {
        setLoadingOutreach(false);
      }
    }

    loadAll();
    return () => controller.abort();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter-aware registrant load ────────────────────────────────────────
  useEffect(() => {
    if (!user || !filtersHydrated) return;

    const controller = new AbortController();

    async function loadRegistrants() {
      setLoadingData(true);
      setSelectedRegistrant(null);
      try {
        const hdrs = await authHeaders();
        const res = await fetch('/api/admin/get-registrants', {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify(buildRegistrantRequestBody(registrantFilters, null, universityOptions.length === 0)),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Registrant load failed');
        const result = await res.json();
        setRegistrants(attachTs(result.registrants || []));
        setLastDoc(result.lastDocId);
        setHasMore(result.hasMore);
        if (result.filterOptions?.universities) {
          setUniversityOptions(result.filterOptions.universities);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[dashboard] loadRegistrants error:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadRegistrants();
    return () => controller.abort();
  }, [user?.uid, filtersHydrated, registrantFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stats poll — every 5 min, skips when tab is hidden ──────────────────
  useEffect(() => {
    if (!user) return;

    async function pollStats() {
      if (document.hidden) return; // Don't hit the API when the tab is backgrounded
      try {
        const hdrs = await authHeaders();
        const res = await fetch('/api/admin/get-stats', {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify({}),
        });
        const s = await res.json();
        setStats(s);
      } catch {
        // Silently ignore poll failures — stale stats are fine
      }
    }

    const interval = setInterval(pollStats, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pagination ────────────────────────────────────────────────────────────
  async function loadMore() {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/get-registrants', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify(buildRegistrantRequestBody(registrantFilters, lastDoc)),
      });
      if (res.status === 410) {
        setLastDoc(null);
        setHasMore(false);
        setStatusMsg({ type: 'error', text: 'Pagination cursor expired. Reload the page to continue.' });
        return;
      }
      const result = await res.json();
      setRegistrants((prev) => [...prev, ...attachTs(result.registrants || [])]);
      setLastDoc(result.lastDocId);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('[dashboard] loadMore error:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  async function refreshOutreachContacts() {
    setLoadingOutreach(true);
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/get-outreach-contacts', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ lastDocId: null }),
      });
      if (!res.ok) throw new Error('Outreach refresh failed');
      const result = await res.json();
      setOutreachContacts(attachOutreachTs(result.contacts || []));
      setOutreachLastDoc(result.lastDocId);
      setOutreachHasMore(result.hasMore);
    } catch (err) {
      console.error('[dashboard] refreshOutreachContacts error:', err);
    } finally {
      setLoadingOutreach(false);
    }
  }

  async function loadMoreOutreach() {
    if (!outreachLastDoc || loadingMoreOutreach) return;
    setLoadingMoreOutreach(true);
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/get-outreach-contacts', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ lastDocId: outreachLastDoc }),
      });
      if (res.status === 410) {
        setOutreachLastDoc(null);
        setOutreachHasMore(false);
        setOutreachImportMsg({ type: 'error', text: 'Outreach cursor expired. Reload the page to continue.' });
        return;
      }
      if (!res.ok) throw new Error('Outreach pagination failed');
      const result = await res.json();
      setOutreachContacts((prev) => [...prev, ...attachOutreachTs(result.contacts || [])]);
      setOutreachLastDoc(result.lastDocId);
      setOutreachHasMore(result.hasMore);
    } catch (err) {
      console.error('[dashboard] loadMoreOutreach error:', err);
    } finally {
      setLoadingMoreOutreach(false);
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'admin' }),
      });
    } catch {
      // Proceed with client-side logout even if server call fails
    }
    await signOut(auth);
    router.push('/admin/login');
  }

  async function handleViewFile(fileUrl) {
    const hdrs = await authHeaders();
    const res = await fetch('/api/admin/get-signed-url', {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({ fileUrl }),
    });
    const data = await res.json();
    if (data.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('File not found in storage. The stored URL may be stale — check Firebase Storage manually.');
    }
  }

  async function handleStatusUpdate(newStatus) {
    if (!selectedRegistrant || statusLoading) return;
    setStatusLoading(true);
    setStatusMsg(null);
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/update-registrant-status', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ docId: selectedRegistrant.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrants((prev) => prev.reduce((next, reg) => {
          if (reg.id !== selectedRegistrant.id) return [...next, reg];
          const updated = { ...reg, status: newStatus };
          if (filterStatus !== 'all' && filterStatus !== newStatus) return next;
          return [...next, updated];
        }, []));
        setSelectedRegistrant((prev) => {
          if (!prev) return prev;
          if (filterStatus !== 'all' && filterStatus !== newStatus) return null;
          return { ...prev, status: newStatus };
        });
        const emailPart = data.skipped
          ? 'no email sent (already set)'
          : 'email sent ✓';
        setStatusMsg({ type: 'success', text: `Marked as ${newStatus} · ${emailPart}` });
      } else {
        // Email failed → status NOT changed in DB; row stays pending
        const msg = data.emailError
          ? `Email failed — status NOT changed. ${data.emailError}`
          : (data.error || 'Update failed.');
        setStatusMsg({ type: 'error', text: msg });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleApproveAll() {
    if (approveAllLoading) return;
    setApproveAllConfirm(false);
    setApproveAllLoading(true);
    setApproveAllMsg(null);
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/approve-all', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        // Refetch is safest — we don't know which specific rows got approved
        // when some batches failed. For simplicity, optimistically update only
        // if everything succeeded; otherwise leave local state, admin can refresh.
        if (!data.emailsFailed && !data.skipped) {
          setRegistrants((prev) =>
            prev.map((reg) => reg.status === 'pending' || !reg.status ? { ...reg, status: 'approved' } : reg)
          );
        }
        const parts = [`Approved ${data.approved}`, `${data.emailsSent} emails sent`];
        if (data.emailsFailed) parts.push(`${data.emailsFailed} failed`);
        if (data.skipped) parts.push(`${data.skipped} NOT approved (email failed) — reload to see`);
        setApproveAllMsg({
          type: data.emailsFailed || data.skipped ? 'error' : 'success',
          text: parts.join(' · '),
        });
      } else {
        setApproveAllMsg({ type: 'error', text: data.error || 'Bulk approval failed.' });
      }
    } catch {
      setApproveAllMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setApproveAllLoading(false);
    }
  }

  async function fetchAllRegistrantsForCopy() {
    const hdrs = await authHeaders();
    const res = await fetch('/api/admin/export-registrants', {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok || !data.registrants) {
      throw new Error(data.error || 'Failed to fetch all registrants.');
    }
    return data.registrants;
  }

  async function handleCopyNewCfHandles() {
    if (cfCopyLoading) return;

    setCfCopyLoading(true);
    setCfCopyMsg(null);

    try {
      const allRegistrants = await fetchAllRegistrantsForCopy();
      const allHandles = getUniqueCfHandles(allRegistrants);
      const copiedSet = new Set(copiedCfHandles);
      const newHandles = allHandles.filter((handle) => !copiedSet.has(normalizeCfHandle(handle)));

      if (newHandles.length === 0) {
        setCfCopyMsg({ type: 'success', text: `No new CF handles · ${allHandles.length} already copied` });
        return;
      }

      await copyTextToClipboard(newHandles.join(' '));

      const nextCopied = Array.from(new Set([...copiedCfHandles, ...newHandles.map(normalizeCfHandle)]));
      try {
        localStorage.setItem(CF_COPIED_STORAGE_KEY, JSON.stringify(nextCopied));
      } catch {
        // The current session still tracks copied handles even if persistent storage is unavailable.
      }
      setCopiedCfHandles(nextCopied);
      setCfCopyMsg({
        type: 'success',
        text: `Copied ${newHandles.length} new CF handle${newHandles.length !== 1 ? 's' : ''}`,
      });
    } catch (err) {
      setCfCopyMsg({ type: 'error', text: err.message || 'Could not copy CF handles.' });
    } finally {
      setCfCopyLoading(false);
    }
  }

  async function handleRoundUpdate(docId, newRound) {
    if (roundLoading) return;
    setRoundLoading(true);
    setRoundMsg(null);
    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/update-registrant-round', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ docId, round: newRound }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrants((prev) => prev.reduce((next, reg) => {
          if (reg.id !== docId) return [...next, reg];
          const updated = { ...reg, round: newRound };
          if (filterRound !== 'all' && filterRound !== newRound) return next;
          return [...next, updated];
        }, []));
        setSelectedRegistrant((prev) => {
          if (!prev) return prev;
          if (filterRound !== 'all' && filterRound !== newRound) return null;
          return { ...prev, round: newRound };
        });
        setRoundMsg({ type: 'success', text: `→ ${newRound.toUpperCase()}` });
      } else {
        setRoundMsg({ type: 'error', text: data.error || 'Failed to update round.' });
      }
    } catch {
      setRoundMsg({ type: 'error', text: 'Network error.' });
    } finally {
      setRoundLoading(false);
    }
  }

  async function handleOutreachCsvImport(file) {
    if (!file || outreachImportLoading) return;
    setOutreachImportLoading(true);
    setOutreachImportMsg(null);

    try {
      const csv = await file.text();
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/import-outreach-contacts', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (data.success) {
        const parts = [`${data.imported} imported`, `${data.updated} updated`];
        if (data.invalid) parts.push(`${data.invalid} invalid`);
        setOutreachImportMsg({ type: 'success', text: parts.join(' · ') });
        setActiveList('outreach');
        await refreshOutreachContacts();
      } else {
        setOutreachImportMsg({ type: 'error', text: data.error || 'Import failed.' });
      }
    } catch {
      setOutreachImportMsg({ type: 'error', text: 'Could not read or import CSV.' });
    } finally {
      setOutreachImportLoading(false);
      if (outreachFileInputRef.current) outreachFileInputRef.current.value = '';
    }
  }

  async function handleBroadcast() {
    if (!broadcastSubject.trim() || !broadcastBody.trim() || broadcastLoading) return;
    setBroadcastConfirming(false);
    setBroadcastLoading(true);
    setBroadcastMsg(null);
    setBroadcastProgress({
      sent: 0,
      failed: 0,
      total: null,
      batchNumber: 0,
      totalBatches: null,
      processed: 0,
      skipped: 0,
      remaining: null,
    });
    // Reuse the same broadcastId after a retryable failure so successful queue rows
    // are not sent again.
    const broadcastId = broadcastRetryId || ((typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `b_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
    let sentTotal = 0;
    let failedTotal = 0;
    let skippedTotal = 0;
    let processedTotal = 0;
    let remainingTotal = null;
    let attemptedTotal = null;
    let finalTargetType = broadcastTargetType;

    try {
      const hdrs = await authHeaders();

      while (true) {
        const res = await fetch('/api/admin/send-broadcast', {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify({
            subject: broadcastSubject,
            body: broadcastBody,
            roundFilter: broadcastFilter,
            targetType: broadcastTargetType,
            broadcastId,
            batchSize: BROADCAST_BATCH_SIZE,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          if (res.status === 409) {
            throw new Error(data.error || 'This broadcast batch is already in progress.');
          }
          throw new Error(data.error || 'Broadcast failed.');
        }

        finalTargetType = data.targetType || finalTargetType;
        sentTotal = Number(data.sent ?? sentTotal);
        failedTotal = Number(data.failed ?? data.emailsFailed ?? failedTotal);
        skippedTotal = Number(data.skipped ?? skippedTotal);
        processedTotal = Number(data.processed ?? (sentTotal + failedTotal + skippedTotal));
        remainingTotal = Number.isFinite(Number(data.remaining)) ? Number(data.remaining) : remainingTotal;
        attemptedTotal = Number.isFinite(Number(data.total ?? data.attempted)) ? Number(data.total ?? data.attempted) : attemptedTotal;

        setBroadcastProgress({
          sent: sentTotal,
          failed: failedTotal,
          skipped: skippedTotal,
          processed: processedTotal,
          remaining: remainingTotal,
          total: attemptedTotal,
          batchNumber: data.batchNumber || 0,
          totalBatches: data.totalBatches || null,
        });

        if (data.done) break;
        if (!Number.isFinite(Number(data.remaining)) || Number(data.remaining) <= 0) {
          throw new Error('Broadcast queue did not advance.');
        }
      }

      const target = finalTargetType === 'outreach'
        ? 'outreach contact'
        : finalTargetType === 'both'
          ? 'recipient'
          : 'registrant';
      const skippedText = skippedTotal ? ` · ${skippedTotal} skipped because they were already sent/delivered/bounced/complained/unsubscribed` : '';
      setBroadcastMsg({ type: 'success', text: `Sent to ${sentTotal} ${target}${sentTotal !== 1 ? 's' : ''}${failedTotal ? ` · ${failedTotal} failed` : ''}${skippedText}` });
      setBroadcastSubject('');
      setBroadcastBody('');
      setBroadcastRetryId(null);
      if (['outreach', 'both'].includes(finalTargetType)) {
        await refreshOutreachContacts();
      }
    } catch (err) {
      setBroadcastRetryId(broadcastId);
      const stoppedText = sentTotal || failedTotal || skippedTotal
        ? ` Stopped after ${sentTotal} sent${failedTotal ? `, ${failedTotal} failed` : ''}${skippedTotal ? `, ${skippedTotal} skipped` : ''}. Retry will continue this same broadcast.`
        : '';
      setBroadcastMsg({ type: 'error', text: `${err.message || 'Network error. Please try again.'}${stoppedText}` });
    } finally {
      setBroadcastLoading(false);
      setBroadcastProgress(null);
    }
  }

  // Registrants are filtered and sorted by /api/admin/get-registrants.
  const filtered = registrants;

  const filteredOutreach = useMemo(() => {
    const q = search.toLowerCase();
    const list = outreachContacts.filter((c) => {
      const status = String(c.deliveryStatus || '').toLowerCase();
      if (q && !(
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.institution || '').toLowerCase().includes(q)
      )) return false;
      if (outreachDeliveryFilter === 'sent' && !isSentLike(status)) return false;
      if (outreachDeliveryFilter === 'not_sent' && status) return false;
      if (outreachDeliveryFilter === 'bounced' && status !== 'bounced') return false;
      if (outreachDeliveryFilter === 'complained' && status !== 'complained') return false;
      if (outreachDeliveryFilter === 'unsubscribed' && !c.unsubscribed) return false;
      return true;
    });

    if (sortOrder === 'newest') return list.sort((a, b) => b._ts - a._ts);
    if (sortOrder === 'oldest') return list.sort((a, b) => a._ts - b._ts);
    if (sortOrder === 'name')   return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    return list;
  }, [outreachContacts, search, outreachDeliveryFilter, sortOrder]);

  if (checking) {
    return (
      <div className={styles.checkingWrap}>
        <span className={styles.checkingDot} />
      </div>
    );
  }

  const r = selectedRegistrant;
  const broadcastTargetLabel = broadcastTargetType === 'outreach'
    ? 'external outreach contacts'
    : broadcastTargetType === 'both'
      ? 'approved registrants and external outreach contacts'
      : 'approved registrants';

  return (
    <>
      <Head>
        <title>Dashboard — AMS Derive Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.dashPage}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <span className={styles.topBarTitle}>
            AMS <span className={styles.topBarGold}>DERIVE</span>
            <span className={styles.topBarAdmin}> — ADMIN</span>
          </span>
          <div className={styles.topBarRight}>
            <span className={styles.topBarEmail}>{user?.email}</span>
            <button
              className={styles.broadcastBtn}
              onClick={() => { setBroadcastOpen((o) => !o); setBroadcastMsg(null); setBroadcastConfirming(false); }}
            >
              {broadcastOpen ? 'CLOSE' : 'BROADCAST'}
            </button>
            <button
              className={styles.exportBtn}
              onClick={async () => {
                const hdrs = await authHeaders();
                const res = await fetch('/api/admin/export-registrants', {
                  method: 'POST',
                  headers: hdrs,
                  body: JSON.stringify(buildRegistrantRequestBody(registrantFilters)),
                });
                const data = await res.json();
                if (data.registrants) exportCSV(data.registrants);
              }}
              title="Export the current filtered registrant view to CSV"
            >
              EXPORT CSV
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        </header>

        <main className={styles.dashMain}>
          {/* Broadcast panel */}
          {broadcastOpen && (
            <div className={styles.broadcastPanel}>
              <p className={styles.broadcastTitle}>BROADCAST EMAIL</p>
              <div className={styles.broadcastImportRow}>
                <input
                  ref={outreachFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className={styles.hiddenFileInput}
                  onChange={(e) => handleOutreachCsvImport(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className={styles.outreachImportBtn}
                  onClick={() => outreachFileInputRef.current?.click()}
                  disabled={outreachImportLoading}
                >
                  {outreachImportLoading ? 'IMPORTING...' : 'IMPORT OUTREACH CSV'}
                </button>
                {outreachImportMsg && (
                  <span className={outreachImportMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                    {outreachImportMsg.text}
                  </span>
                )}
              </div>
              <input
                className={styles.broadcastInput}
                type="text"
                placeholder="Subject"
                value={broadcastSubject}
                onChange={(e) => { setBroadcastSubject(e.target.value); setBroadcastRetryId(null); }}
                disabled={broadcastLoading}
              />
              <textarea
                className={styles.broadcastTextarea}
                placeholder="Message body..."
                value={broadcastBody}
                onChange={(e) => { setBroadcastBody(e.target.value); setBroadcastRetryId(null); }}
                rows={5}
                disabled={broadcastLoading}
              />
              <div className={styles.broadcastFooter}>
                <select
                  className={styles.filterSelect}
                  value={broadcastTargetType}
                  onChange={(e) => { setBroadcastTargetType(e.target.value); setBroadcastConfirming(false); setBroadcastRetryId(null); }}
                  disabled={broadcastLoading}
                >
                  <option value="registrants">Approved Registrants</option>
                  <option value="outreach">External Outreach Contacts</option>
                  <option value="both">Both</option>
                </select>
                <select
                  className={styles.filterSelect}
                  value={broadcastFilter}
                  onChange={(e) => { setBroadcastFilter(e.target.value); setBroadcastConfirming(false); setBroadcastRetryId(null); }}
                  disabled={broadcastLoading || broadcastTargetType === 'outreach'}
                >
                  <option value="all">All Registrants</option>
                  <option value="prior">PRIOR</option>
                  <option value="posterior">POSTERIOR</option>
                  <option value="convergence">CONVERGENCE</option>
                </select>
                {broadcastConfirming ? (
                  <div className={styles.broadcastConfirm}>
                    <span className={styles.broadcastConfirmText}>
                      Send &ldquo;{broadcastSubject}&rdquo; to{' '}
                      <strong>{broadcastTargetLabel}</strong>?
                    </span>
                    <button className={styles.confirmBtn} onClick={handleBroadcast} disabled={broadcastLoading}>
                      CONFIRM
                    </button>
                    <button className={styles.cancelBtn} onClick={() => setBroadcastConfirming(false)} disabled={broadcastLoading}>
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <button
                    className={styles.broadcastSendBtn}
                    onClick={() => setBroadcastConfirming(true)}
                    disabled={broadcastLoading || !broadcastSubject.trim() || !broadcastBody.trim()}
                  >
                    {broadcastLoading ? 'SENDING...' : broadcastRetryId ? 'RETRY' : 'SEND'}
                  </button>
                )}
                {broadcastProgress && (
                  <span className={styles.broadcastProgress}>
                    Batch {broadcastProgress.batchNumber || 1}
                    {broadcastProgress.totalBatches ? `/${broadcastProgress.totalBatches}` : ''}
                    {' · '}
                    {broadcastProgress.processed ?? broadcastProgress.sent} processed
                    {broadcastProgress.total != null ? ` of ${broadcastProgress.total}` : ''}
                    {` · ${broadcastProgress.sent} sent`}
                    {broadcastProgress.failed ? ` · ${broadcastProgress.failed} failed` : ''}
                    {broadcastProgress.skipped ? ` · ${broadcastProgress.skipped} skipped` : ''}
                  </span>
                )}
                {broadcastMsg && (
                  <span className={broadcastMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                    {broadcastMsg.text}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tab} ${activeList === 'registrants' ? styles.tabActive : ''}`}
              onClick={() => setActiveList('registrants')}
            >
              REGISTRANTS
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeList === 'outreach' ? styles.tabActive : ''}`}
              onClick={() => { setActiveList('outreach'); setSelectedRegistrant(null); }}
            >
              OUTREACH
            </button>
            <Link href="/admin/analytics" className={styles.tab}>ANALYTICS</Link>
            <Link href="/admin/firms" className={styles.tab}>FIRMS</Link>
            <Link href="/admin/ambassadors" className={styles.tab}>AMBASSADORS</Link>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            {[
              { label: 'Total Registrants', value: stats.total },
              { label: 'Approved', value: stats.approved },
              { label: "Today's Registrations", value: stats.today },
              { label: 'Data Consent', value: stats.consentGiven },
              { label: 'Bounced Emails', value: stats.bounced, alert: stats.bounced > 0 },
            ].map((s) => (
              <div key={s.label} className={`${styles.statCard} ${s.alert ? styles.statCardAlert : ''}`}>
                <span className={styles.statLabel}>{s.label}</span>
                <span className={`${styles.statValue} ${s.alert ? styles.statValueAlert : ''}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className={styles.filterBar}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder={activeList === 'outreach' ? 'Search name, email, institution...' : 'Search name, email, CF handle, university...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {activeList === 'registrants' ? (
              <>
                <select
                  className={styles.filterSelect}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  className={styles.filterSelect}
                  value={filterRound}
                  onChange={(e) => setFilterRound(e.target.value)}
                >
                  <option value="all">All Rounds</option>
                  <option value="prior">PRIOR</option>
                  <option value="posterior">POSTERIOR</option>
                  <option value="convergence">CONVERGENCE</option>
                </select>
                <select
                  className={styles.filterSelect}
                  value={filterDeliveryStatus}
                  onChange={(e) => setFilterDeliveryStatus(e.target.value)}
                >
                  <option value="all">All Delivery</option>
                  <option value="pending">Delivery Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="bounced">Bounced</option>
                  <option value="complained">Spam Complaint</option>
                  <option value="delayed">Delayed</option>
                </select>
                <select
                  className={styles.filterSelect}
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                >
                  <option value="all">Any Date</option>
                  <option value="today">Today</option>
                  <option value="last24h">Last 24h</option>
                  <option value="last7d">Last 7d</option>
                  <option value="custom">Custom Range</option>
                </select>
                {filterDateRange === 'custom' && (
                  <>
                    <input
                      className={styles.filterTextInput}
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                    <input
                      className={styles.filterTextInput}
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </>
                )}
                <select
                  className={styles.filterSelect}
                  value={filterGraduationYear}
                  onChange={(e) => setFilterGraduationYear(e.target.value)}
                >
                  <option value="all">All Grad Years</option>
                  {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map((year) => (
                    <option key={year} value={String(year)}>{year}</option>
                  ))}
                </select>
                <input
                  className={styles.filterTextInput}
                  type="text"
                  placeholder="Ref code..."
                  value={filterRefCode}
                  onChange={(e) => setFilterRefCode(e.target.value)}
                />
                <select
                  className={styles.filterSelect}
                  value={filterTranscript}
                  onChange={(e) => setFilterTranscript(e.target.value)}
                >
                  <option value="all">All Transcripts</option>
                  <option value="has">Has Transcript</option>
                  <option value="missing">Missing Transcript</option>
                </select>
                <select
                  className={styles.filterSelect}
                  value={filterConsent}
                  onChange={(e) => setFilterConsent(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="yes">Consent Given</option>
                  <option value="no">Consent Not Given</option>
                </select>
                <select
                  className={styles.filterSelect}
                  value={filterUniversity}
                  onChange={(e) => setFilterUniversity(e.target.value)}
                >
                  <option value="all">All Universities</option>
                  {[
                    ...(filterUniversity !== 'all' && !universityOptions.includes(filterUniversity) ? [filterUniversity] : []),
                    ...universityOptions,
                  ].map((university) => (
                    <option key={university} value={university}>{university}</option>
                  ))}
                </select>
                <select
                  className={styles.filterSelect}
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                >
                  <option value="all">All Branches</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="AI & Machine Learning">AI &amp; Machine Learning</option>
                  <option value="Electronics & Communication Engineering">Electronics &amp; Communication Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Engineering Physics">Engineering Physics</option>
                  <option value="Mathematics and Computing">Mathematics and Computing</option>
                  <option value="Data Science & Engineering">Data Science &amp; Engineering</option>
                  <option value="Biotechnology">Biotechnology</option>
                  <option value="Statistics">Statistics</option>
                  <option value="Other">Other</option>
                </select>
              </>
            ) : (
              <select
                className={styles.filterSelect}
                value={outreachDeliveryFilter}
                onChange={(e) => setOutreachDeliveryFilter(e.target.value)}
              >
                <option value="all">All Outreach</option>
                <option value="sent">Sent / Delivered</option>
                <option value="not_sent">Not Sent</option>
                <option value="bounced">Bounced</option>
                <option value="complained">Spam Complaint</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            )}
            <select
              className={styles.filterSelect}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A–Z</option>
            </select>
            <span className={styles.resultCount}>
              {activeList === 'outreach'
                ? `Showing ${filteredOutreach.length} of ${outreachContacts.length}`
                : `Showing ${filtered.length}${hasMore ? '+' : ''} result${filtered.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {/* Bulk actions */}
          {activeList === 'registrants' && (
          <div className={styles.bulkActions}>
            <button
              className={styles.copyCfBtn}
              onClick={handleCopyNewCfHandles}
              disabled={cfCopyLoading || loadingData}
              title="Fetch all registrants and copy only CF handles not copied before"
            >
              {cfCopyLoading ? 'COPYING...' : 'COPY NEW CF HANDLES'}
            </button>
            {approveAllConfirm ? (
              <div className={styles.bulkConfirm}>
                <span className={styles.bulkConfirmText}>
                  Approve ALL pending registrants and send approval emails to each?
                </span>
                <button className={styles.confirmBtn} onClick={handleApproveAll} disabled={approveAllLoading}>
                  CONFIRM
                </button>
                <button className={styles.cancelBtn} onClick={() => setApproveAllConfirm(false)} disabled={approveAllLoading}>
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                className={styles.approveAllBtn}
                onClick={() => { setApproveAllConfirm(true); setApproveAllMsg(null); }}
                disabled={approveAllLoading}
              >
                {approveAllLoading ? 'APPROVING...' : 'APPROVE ALL PENDING'}
              </button>
            )}
            {approveAllMsg && (
              <span className={approveAllMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                {approveAllMsg.text}
              </span>
            )}
            {cfCopyMsg && (
              <span className={cfCopyMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                {cfCopyMsg.text}
              </span>
            )}
          </div>
          )}

          {/* Table */}
          {activeList === 'registrants' && loadingData ? (
            <div className={styles.tableLoading}>Loading registrants...</div>
          ) : activeList === 'outreach' && loadingOutreach ? (
            <div className={styles.tableLoading}>Loading outreach contacts...</div>
          ) : activeList === 'registrants' ? (
            <div className={styles.tableWrap}>
              <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'auto', width: '100%' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {['#', 'Full Name', 'Email', 'Status', 'Round', 'Delivery', 'Ref Code', 'University', 'Branch', 'Grad Year', 'CF Handle', 'Phone Number', 'Consent', 'Submitted At'].map((h) => (
                        <th key={h} className={styles.th} style={{ position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={14} className={styles.emptyRow}>No registrants found.</td>
                      </tr>
                    ) : filtered.map((reg, i) => (
                      <tr
                        key={reg.id}
                        className={`${styles.tr} ${i % 2 === 1 ? styles.trAlt : ''} ${selectedRegistrant?.id === reg.id ? styles.trSelected : ''} ${reg.status === 'approved' ? styles.trApproved : ''}`}
                        onClick={() => { setSelectedRegistrant(selectedRegistrant?.id === reg.id ? null : reg); setStatusMsg(null); setRoundMsg(null); }}
                      >
                        <td className={styles.td}>{i + 1}</td>
                        <td className={styles.td}>{reg.fullName}</td>
                        <td className={`${styles.td} ${styles.mono}`}>{reg.email}</td>
                        <td className={styles.td}>
                          <span className={statusBadgeClass(reg.status)}>
                            {(reg.status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.badgeAmber}>
                            {(reg.round || 'prior').toUpperCase()}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={deliveryBadgeClass(reg.deliveryStatus)}>
                            {registrantDeliveryLabel(reg.deliveryStatus)}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.mono}`}>{reg.refCode || '—'}</td>
                        <td className={styles.td}>{reg.university}</td>
                        <td className={styles.td}>{reg.branch || '—'}</td>
                        <td className={`${styles.td} ${styles.mono}`}>{reg.graduationYear || '—'}</td>
                        <td className={`${styles.td} ${styles.mono}`}>
                          <a
                            href={`https://codeforces.com/profile/${reg.codeforcesHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.cfLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {reg.codeforcesHandle}
                          </a>
                        </td>
                        <td className={`${styles.td} ${styles.mono}`}>{reg.phoneNumber ? `+91 ${reg.phoneNumber}` : '—'}</td>
                        <td className={styles.td}>
                          <span className={reg.dataConsent ? styles.badgeGreen : styles.badgeRed}>
                            {reg.dataConsent ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.mono} ${styles.dateCell}`}>{formatDate(reg.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <div style={{ maxHeight: '65vh', overflowY: 'auto', overflowX: 'auto', width: '100%' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {['#', 'Full Name', 'Email', 'Institution', 'Delivery', 'Source', 'Imported At', 'Last Update'].map((h) => (
                        <th key={h} className={styles.th} style={{ position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutreach.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={styles.emptyRow}>No outreach contacts found.</td>
                      </tr>
                    ) : filteredOutreach.map((contact, i) => {
                      const status = String(contact.deliveryStatus || '').toLowerCase();
                      const sent = isSentLike(status);
                      const failed = status === 'bounced' || status === 'complained';
                      return (
                        <tr
                          key={contact.id}
                          className={`${styles.tr} ${i % 2 === 1 ? styles.trAlt : ''} ${sent ? styles.trApproved : ''}`}
                        >
                          <td className={styles.td}>{i + 1}</td>
                          <td className={styles.td}>{contact.fullName}</td>
                          <td className={`${styles.td} ${styles.mono}`}>{contact.email}</td>
                          <td className={styles.td}>{contact.institution || '—'}</td>
                          <td className={styles.td}>
                            <span className={contact.unsubscribed || failed ? styles.badgeRed : sent ? styles.badgeGreen : status === 'delayed' ? styles.badgeYellow : styles.badgeGrey}>
                              {deliveryLabel(contact.deliveryStatus, contact.unsubscribed)}
                            </span>
                          </td>
                          <td className={`${styles.td} ${styles.mono}`}>{contact.source || '—'}</td>
                          <td className={`${styles.td} ${styles.mono} ${styles.dateCell}`}>{formatDate(contact.createdAt)}</td>
                          <td className={`${styles.td} ${styles.mono} ${styles.dateCell}`}>{formatDate(contact.deliveryStatusAt || contact.lastBroadcastAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeList === 'registrants' && hasMore && (
            <div className={styles.loadMoreWrap}>
              <button className={styles.loadMoreBtn} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <span className={styles.loadingDots}>Loading</span> : 'LOAD MORE'}
              </button>
            </div>
          )}
          {activeList === 'outreach' && outreachHasMore && (
            <div className={styles.loadMoreWrap}>
              <button className={styles.loadMoreBtn} onClick={loadMoreOutreach} disabled={loadingMoreOutreach}>
                {loadingMoreOutreach ? <span className={styles.loadingDots}>Loading</span> : 'LOAD MORE'}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Side panel backdrop + panel */}
      {r && (
        <>
          <div
            className={styles.panelBackdrop}
            onClick={() => { setSelectedRegistrant(null); setStatusMsg(null); setRoundMsg(null); }}
          />
          <aside className={styles.sidePanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelName}>{r.fullName}</span>
              <button
                className={styles.panelClose}
                onClick={() => { setSelectedRegistrant(null); setStatusMsg(null); setRoundMsg(null); }}
              >
                CLOSE ✕
              </button>
            </div>

            <div className={styles.panelBody}>
              {/* Contact */}
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Email</p>
                <p className={`${styles.panelValue} ${styles.mono}`}>{r.email}</p>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>University</p>
                <p className={styles.panelValue}>{r.university}</p>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Branch</p>
                <p className={styles.panelValue}>{r.branch || '—'}</p>
              </div>

              <div className={styles.panelDivider} />

              {/* Competitive handles */}
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Codeforces Handle</p>
                <a
                  href={`https://codeforces.com/profile/${r.codeforcesHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.panelValue} ${styles.mono} ${styles.cfLink}`}
                >
                  {r.codeforcesHandle}
                </a>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Phone Number</p>
                <p className={`${styles.panelValue} ${styles.mono}`}>{r.phoneNumber ? `+91 ${r.phoneNumber}` : '—'}</p>
              </div>

              {/* LinkedIn / GitHub — only if present */}
              {(r.linkedIn || r.gitHub) && (
                <>
                  <div className={styles.panelDivider} />
                  {r.linkedIn && (
                    <div className={styles.panelSection}>
                      <p className={styles.panelLabel}>LinkedIn</p>
                      <a
                        href={r.linkedIn.startsWith('http') ? r.linkedIn : `https://${r.linkedIn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.panelValue} ${styles.mono} ${styles.cfLink}`}
                      >
                        {r.linkedIn}
                      </a>
                    </div>
                  )}
                  {r.gitHub && (
                    <div className={styles.panelSection}>
                      <p className={styles.panelLabel}>GitHub</p>
                      <a
                        href={r.gitHub.startsWith('http') ? r.gitHub : `https://${r.gitHub}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.panelValue} ${styles.mono} ${styles.cfLink}`}
                      >
                        {r.gitHub}
                      </a>
                    </div>
                  )}
                </>
              )}

              <div className={styles.panelDivider} />

              {/* Meta */}
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Data Consent</p>
                <span className={r.dataConsent ? styles.badgeGreen : styles.badgeRed}>
                  {r.dataConsent ? 'YES' : 'NO'}
                </span>
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Round</p>
                <select
                  className={styles.roundSelect}
                  value={r.round || 'prior'}
                  disabled={roundLoading}
                  onChange={(e) => handleRoundUpdate(r.id, e.target.value)}
                >
                  <option value="prior">PRIOR</option>
                  <option value="posterior">POSTERIOR</option>
                  <option value="convergence">CONVERGENCE</option>
                </select>
                {roundMsg && (
                  <p className={roundMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                    {roundMsg.text}
                  </p>
                )}
              </div>
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Submitted At</p>
                <p className={`${styles.panelValue} ${styles.mono}`}>{formatDate(r.submittedAt)}</p>
              </div>
              {r.status === 'approved' && (
                <div className={styles.panelSection}>
                  <p className={styles.panelLabel}>Email Delivery</p>
                  {!r.deliveryStatus ? (
                    <span className={styles.badgeGrey}>PENDING</span>
                  ) : r.deliveryStatus === 'delivered' ? (
                    <span className={styles.badgeGreen}>DELIVERED</span>
                  ) : r.deliveryStatus === 'bounced' ? (
                    <span className={styles.badgeRed}>BOUNCED</span>
                  ) : r.deliveryStatus === 'complained' ? (
                    <span className={styles.badgeRed}>SPAM COMPLAINT</span>
                  ) : r.deliveryStatus === 'delayed' ? (
                    <span className={styles.badgeYellow}>DELAYED</span>
                  ) : (
                    <span className={styles.badgeGrey}>{r.deliveryStatus.toUpperCase()}</span>
                  )}
                  {r.deliveryStatusAt && (
                    <p className={`${styles.panelValue} ${styles.mono}`} style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                      {formatDate(r.deliveryStatusAt)}
                    </p>
                  )}
                </div>
              )}
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>IP Hash</p>
                <p className={`${styles.panelValue} ${styles.mono}`}>{r.ipHash}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className={styles.panelActions}>
              {r.status === 'pending' ? (
                <div className={styles.panelStatusActions}>
                  <button className={styles.approveBtn} disabled={statusLoading} onClick={() => handleStatusUpdate('approved')}>
                    {statusLoading ? '...' : 'APPROVE'}
                  </button>
                  <button className={styles.rejectBtn} disabled={statusLoading} onClick={() => handleStatusUpdate('rejected')}>
                    {statusLoading ? '...' : 'REJECT'}
                  </button>
                </div>
              ) : (
                <div className={styles.panelStatusDisplay}>
                  <span className={styles.panelLabel}>Status</span>
                  <span className={r.status === 'approved' ? styles.badgeGreen : styles.badgeRed}>
                    {(r.status || 'pending').toUpperCase()}
                  </span>
                </div>
              )}
              {statusMsg && (
                <p className={statusMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                  {statusMsg.text}
                </p>
              )}
              <div className={styles.panelFileActions}>
                <button
                  className={styles.panelActionBtn}
                  disabled={!r.resumeUrl}
                  onClick={() => r.resumeUrl && handleViewFile(r.resumeUrl)}
                >
                  VIEW RESUME
                </button>
                <button
                  className={styles.panelActionBtn}
                  disabled={!r.transcriptUrl}
                  onClick={() => r.transcriptUrl && handleViewFile(r.transcriptUrl)}
                >
                  VIEW TRANSCRIPT
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
