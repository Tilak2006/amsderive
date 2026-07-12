/**
 * POST /api/firm/get-leaderboard
 *
 * Returns standings from the uploaded AMS Derive'26 PRIOR Ranklist.csv,
 * matching them against approved and consented registrant profiles for authenticated firm partners.
 * Access gating:
 *   - derivation tier: 403 (no leaderboard access)
 *   - firmData.access.leaderboard !== true: 403 locked
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
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth
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
  const handlerStart = Date.now();

  // Firm lookup + access check
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

  if (firmData.tier === 'derivation') {
    logger.warn('firms', 'leaderboard_access_denied', {
      reqId,
      actorId: uid,
      entityId: uid,
      detail: { reason: 'derivation_tier' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Leaderboard access is not included in the Derivation tier.',
    });
  }

  if (!firmData.access?.leaderboard) {
    logger.warn('firms', 'leaderboard_access_denied', {
      reqId,
      actorId: uid,
      entityId: uid,
      detail: { reason: 'flag_locked' },
      status: 'blocked',
    });
    return res.status(403).json({
      error: 'ACCESS_LOCKED',
      message: 'Leaderboard access has not been unlocked for your account yet.',
    });
  }

  // Which round's standings to return. 'prior' (default) reads the PRIOR ranklist;
  // 'posterior' reads the POSTERIOR ranklist (order = rank, enriched from registrants);
  // 'convergence' reads the finals winners ranklist (top 10, enriched from registrants).
  const requestedRound = req.body?.round;
  const round = requestedRound === 'posterior' || requestedRound === 'convergence' ? requestedRound : 'prior';

  try {
    // Fetch all approved registrants who consented to share data (shared by both rounds)
    const registrantsSnap = await db.collection('registrants')
      .where('status', '==', 'approved')
      .where('dataConsent', '==', true)
      .get();

    // Build a map of lowercase name -> authorized registrant profile details
    const registrantsMap = new Map();
    const { resumeDownload, linkedinAccess, emailAccess, finalistProfiles } = firmData.access || {};
    const resumeUnlocked = Date.now() >= new Date('2026-05-23').getTime();
    const assessmentMaps = loadAssessmentMaps();

    registrantsSnap.forEach((doc) => {
      const d = doc.data();
      const nameKey = (d.fullName || '').trim().toLowerCase();
      const advancedRound = d.round === 'posterior' || d.round === 'convergence';

      const entry = {
        id: createFirmCandidateToken(doc.id),
        fullName: d.fullName,
        university: d.university,
        branch: d.branch || null,
        graduationYear: d.graduationYear || null,
        round: d.round || null,
        codeforcesHandle: d.codeforcesHandle || null,
        gitHub: d.gitHub || null,
      };

      if (resumeDownload && finalistProfiles && resumeUnlocked && advancedRound) {
        entry.resumeUrl = d.resumeUrl || null;
        entry.resumeFileName = d.resumeFileName || null;
      }
      if (linkedinAccess) {
        entry.linkedIn = d.linkedIn || null;
      }
      if (resumeDownload && finalistProfiles && resumeUnlocked && advancedRound && d.transcriptUrl) {
        entry.transcriptUrl = d.transcriptUrl;
        entry.transcriptFileName = d.transcriptFileName || null;
      }
      if (emailAccess) {
        entry.email = d.email || null;
      }

      const assessment = getAssessment(assessmentMaps, d.fullName, d.email);
      if (assessment) entry.assessment = assessment;

      registrantsMap.set(nameKey, entry);
    });

    const standingsRaw = [];

    if (round === 'convergence') {
      // CONVERGENCE winners ranklist: 'Rank,Name,CF Handle' with a header row.
      // University / grad year are pulled from the matched registrant record.
      const csvPath = path.join(process.cwd(), 'convergence-ranklist', 'winners-2026.csv');
      if (!fs.existsSync(csvPath)) {
        throw new Error('CONVERGENCE winners CSV file not found on server.');
      }
      const csvContent = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length && parseCsvLine(lines[0])[0].trim().toLowerCase() === 'rank') {
        lines.shift();
      }

      lines.forEach((line, idx) => {
        const parts = parseCsvLine(line);
        const name = parts[1];
        if (!name) return;
        const parsedRank = parseInt(parts[0], 10);
        const csvHandle = (parts[2] || '').trim().toLowerCase();
        let match = registrantsMap.get(name.trim().toLowerCase()) || null;
        // A name can collide across registrants; the winners CSV carries the CF
        // handle, so when both sides have one, they must agree or we attach no
        // profile at all rather than risk another person's gated data.
        const matchHandle = (match?.codeforcesHandle || '').trim().toLowerCase();
        if (match && csvHandle && matchHandle && matchHandle !== csvHandle) {
          match = null;
        }
        standingsRaw.push({
          rank: Number.isFinite(parsedRank) ? parsedRank : idx + 1,
          name,
          university: match?.university || '',
          graduationYear: match?.graduationYear || null,
          registrant: match,
        });
      });
    } else if (round === 'posterior') {
      // POSTERIOR ranklist: 'Name,CodeforcesHandle' rows, order = final rank.
      // Tolerate an optional header line: data rows never have 'Name' in column 0.
      // University / grad year are pulled from the matched registrant record.
      const csvPath = path.join(process.cwd(), 'posterior-ranklist', 'posterior-ranklist-v1.1.csv');
      if (!fs.existsSync(csvPath)) {
        throw new Error('POSTERIOR Ranklist CSV file not found on server.');
      }
      const csvContent = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length && parseCsvLine(lines[0])[0].trim().toLowerCase() === 'name') {
        lines.shift();
      }

      lines.forEach((line, idx) => {
        const parts = parseCsvLine(line);
        const name = parts[0];
        if (!name) return;
        const match = registrantsMap.get(name.trim().toLowerCase()) || null;
        standingsRaw.push({
          rank: idx + 1,
          name,
          university: match?.university || '',
          graduationYear: match?.graduationYear || null,
        });
      });
    } else {
      // PRIOR ranklist: 'Rank,Name,University,GraduationYear' with a header row.
      const csvPath = path.join(process.cwd(), "AMS Derive'26 PRIOR Ranklist.csv");
      if (!fs.existsSync(csvPath)) {
        throw new Error('PRIOR Ranklist CSV file not found on server.');
      }

      const csvContent = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

      if (lines.length <= 1) {
        throw new Error('CSV file is empty or missing headers.');
      }

      for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        if (parts.length >= 4) {
          standingsRaw.push({
            rank: parseInt(parts[0], 10),
            name: parts[1],
            university: parts[2],
            graduationYear: parseInt(parts[3], 10)
          });
        }
      }

      // Manually add Rakshit Ranka at rank 151 — not present in the PRIOR CSV.
      // University / grad year / profile are pulled from his registrant record,
      // matched by name exactly like every other standings row below.
      const RAKSHIT_NAME = 'Rakshit Ranka';
      const rakshitMatch = registrantsMap.get(RAKSHIT_NAME.toLowerCase());
      standingsRaw.push({
        rank: 151,
        name: RAKSHIT_NAME,
        university: rakshitMatch?.university || '',
        graduationYear: rakshitMatch?.graduationYear || null,
      });
    }

    // Map each standings row to its registrant details (if available)
    const standings = standingsRaw.map(row => {
      const nameKey = (row.name || '').trim().toLowerCase();
      const registrant = row.registrant !== undefined ? row.registrant : (registrantsMap.get(nameKey) || null);
      return {
        rank: row.rank,
        name: row.name,
        university: row.university,
        graduationYear: row.graduationYear,
        registrant
      };
    });

    logger.info('firms', 'leaderboard_fetched_csv', {
      reqId,
      actorId: uid,
      detail: { round, rowCount: standings.length, matchedCount: standings.filter(s => s.registrant !== null).length },
      status: 'ok',
      durationMs: Date.now() - handlerStart,
    });

    return res.status(200).json({
      standings,
      round,
      updatedAt: new Date().toISOString(),
      access: {
        resumeDownload: !!resumeDownload,
        finalistProfiles: !!finalistProfiles,
        linkedinAccess: !!linkedinAccess,
        emailAccess: !!emailAccess,
      }
    });
  } catch (err) {
    logger.error('firms', 'leaderboard_csv_error', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
