/**
 * POST /api/firm/get-finalists
 *
 * Returns talent pool data for the authenticated firm.
 * Includes registrants who have advanced past PRIOR (round === posterior or convergence).
 * Access is gated by the firm's Firestore access flags:
 *   - access.finalistProfiles must be true to get any data
 *   - access.resumeDownload controls whether resumeUrl is included
 *   - access.linkedinAccess controls whether linkedIn is included
 *   - access.resumeDownload also controls whether transcriptUrl/transcriptFileName are included
 *
 * Never returns: email, phoneNumber, ipHash, codeforcesHandle.
 */

import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { createFirmCandidateToken } from '../../../lib/firmCandidateToken';
import { loadAssessmentMaps, getAssessment } from '../../../lib/assessmentData';
import fs from 'fs';
import path from 'path';

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += char;
  }
  result.push(current.trim());
  return result;
}

// name (lowercased) -> POSTERIOR rank. The talent pool is Round 2 oriented:
// rank = the candidate's position in the POSTERIOR ranklist (file order = rank).
function loadPosteriorRankMap() {
  const map = new Map();
  try {
    const csvPath = path.join(process.cwd(), 'posterior-ranklist', 'posterior-ranklist-v1.1.csv');
    if (!fs.existsSync(csvPath)) return map;
    const content = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    // Tolerate an optional header line; every other line is a ranked finalist (order = rank).
    if (lines.length && (parseCsvLine(lines[0])[0] || '').trim().toLowerCase() === 'name') lines.shift();
    lines.forEach((line, idx) => {
      const name = (parseCsvLine(line)[0] || '').trim().toLowerCase();
      if (name && !map.has(name)) map.set(name, idx + 1);
    });
  } catch {
    // Missing/unreadable ranklist — finalists just won't carry a rank.
  }
  return map;
}

// name (lowercased) -> CONVERGENCE finals rank, from the full finals standings
// ('Rank,Name,CF Handle' with a header row).
function loadConvergenceRankMap() {
  const map = new Map();
  try {
    const csvPath = path.join(process.cwd(), 'convergence-ranklist', 'standings-2026.csv');
    if (!fs.existsSync(csvPath)) return map;
    const content = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length && (parseCsvLine(lines[0])[0] || '').trim().toLowerCase() === 'rank') lines.shift();
    lines.forEach((line, idx) => {
      const parts = parseCsvLine(line);
      const name = (parts[1] || '').trim().toLowerCase();
      const rank = parseInt(parts[0], 10);
      const handle = (parts[2] || '').trim().toLowerCase();
      if (name && !map.has(name)) map.set(name, { rank: Number.isFinite(rank) ? rank : idx + 1, handle });
    });
  } catch {
    // Missing/unreadable standings — candidates just won't carry a finals rank.
  }
  return map;
}

// Sort key: real numeric ranks first (ascending), everything else (null) last.
function rankSortKey(rank) {
  return typeof rank === 'number' && Number.isFinite(rank) ? rank : Infinity;
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

  // Fetch firm profile and check access flags
  let firmData;
  try {
    const firmSnap = await db.collection('firms').doc(uid).get();
    if (!firmSnap.exists) {
      return res.status(401).json({ error: 'Not a firm account' });
    }
    firmData = firmSnap.data();
  } catch (err) {
    logger.error('firms', 'firm_lookup_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  // Derivation tier has no talent pool access at all
  if (firmData.tier === 'derivation') {
    logger.warn('firms', 'finalists_access_denied', {
      reqId,
      actorId: uid,
      detail: { reason: 'derivation_tier' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Talent Pool access is not included in the Derivation tier.',
    });
  }

  // finalistProfiles flag gates the entire dataset
  if (!firmData.access?.finalistProfiles) {
    logger.warn('firms', 'finalists_access_denied', {
      reqId,
      actorId: uid,
      detail: { reason: 'flag_locked' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_LOCKED',
      message: 'Finalist profiles have not been unlocked yet. Check back soon.',
    });
  }

  const { resumeDownload, linkedinAccess } = firmData.access;

  try {
    // Query registrants who have advanced past PRIOR (posterior or convergence round)
    const [posteriorSnap, convergenceSnap] = await Promise.all([
      db.collection('registrants')
        .where('round', '==', 'posterior')
        .where('dataConsent', '==', true)
        .where('status', '==', 'approved')
        .get(),
      db.collection('registrants')
        .where('round', '==', 'convergence')
        .where('dataConsent', '==', true)
        .where('status', '==', 'approved')
        .get(),
    ]);

    const allDocs = [...posteriorSnap.docs, ...convergenceSnap.docs]
      .sort((a, b) => {
        const aT = a.data().submittedAt?.toMillis?.() ?? 0;
        const bT = b.data().submittedAt?.toMillis?.() ?? 0;
        return bT - aT;
      });

    // Stub snapshot for the mapping below
    const snapshot = { docs: allDocs };

    const rankByName = loadPosteriorRankMap();
    const convRankByName = loadConvergenceRankMap();
    const assessmentMaps = loadAssessmentMaps();

    const finalists = snapshot.docs.map((doc) => {
      const d = doc.data();
      const nameKey = (d.fullName || '').trim().toLowerCase();
      const entry = {
        id: createFirmCandidateToken(doc.id),
        fullName: d.fullName,
        university: d.university,
        branch: d.branch || null,
        graduationYear: d.graduationYear || null,
        round: d.round,
        rank: rankByName.get(nameKey) ?? null,
        convergenceRank: (() => {
          // A name can collide across registrants; require CF handle agreement
          // (when both sides have one) before attaching a finals rank.
          const cr = convRankByName.get(nameKey);
          if (!cr) return null;
          const regHandle = (d.codeforcesHandle || '').trim().toLowerCase();
          if (cr.handle && regHandle && cr.handle !== regHandle) return null;
          return cr.rank;
        })(),
      };
      const assessment = getAssessment(assessmentMaps, d.fullName, d.email);
      if (assessment) entry.assessment = assessment;
      if (resumeDownload && d.resumeUrl) {
        entry.resumeUrl = d.resumeUrl;
        entry.resumeFileName = d.resumeFileName || null;
      }
      if (linkedinAccess && d.linkedIn) {
        entry.linkedIn = d.linkedIn;
      }
      if (resumeDownload && d.transcriptUrl) {
        entry.transcriptUrl = d.transcriptUrl;
        entry.transcriptFileName = d.transcriptFileName || null;
      }
      return entry;
    });

    // Rank ascending; non-numeric / unranked candidates fall to the end (recency order preserved).
    finalists.sort((a, b) => rankSortKey(a.rank) - rankSortKey(b.rank));

    logger.info('firms', 'finalists_fetched', {
      reqId,
      actorId: uid,
      detail: { count: finalists.length, resumeDownload: !!resumeDownload, linkedinAccess: !!linkedinAccess },
      status: 'ok',
    });
    return res.status(200).json({
      finalists,
      count: finalists.length,
      access: {
        resumeDownload: !!resumeDownload,
        linkedinAccess: !!linkedinAccess,
      },
    });
  } catch (err) {
    logger.error('firms', 'finalists_query_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
