/**
 * POST /api/firm/get-institution-stats
 *
 * Returns per-round analytics for the firm dashboard.
 * Body: { round: 'posterior' (default) | 'prior' }
 *
 * Cohort is the round's ranklist (same CSVs the leaderboard uses):
 *   - posterior -> posterior-ranklist/posterior-ranklist-v1.1.csv (the finalists)
 *   - prior     -> AMS Derive'26 PRIOR Ranklist.csv (+ manual Rakshit Ranka entry)
 * Each ranklist name is matched to an approved + consented registrant record;
 * matched registrants' university / branch / graduationYear are aggregated.
 */

import { admin, db } from '../../../lib/firebaseAdmin';
import logger, { genReqId } from '../../../utils/logger';
import { loadAssessmentMaps, getAssessment } from '../../../lib/assessmentData';
import fs from 'fs';
import path from 'path';

function normalizeInstitution(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

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

// Ordered competitor names for the round, read from the same ranklist CSVs as the leaderboard.
function loadRoundNames(round) {
  const names = [];
  try {
    if (round === 'prior') {
      const p = path.join(process.cwd(), "AMS Derive'26 PRIOR Ranklist.csv");
      if (!fs.existsSync(p)) return names;
      const lines = fs.readFileSync(p, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
      for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        if (parts[1]) names.push(parts[1]);
      }
      names.push('Rakshit Ranka'); // mirrors the leaderboard's manual rank-151 entry
    } else {
      const p = path.join(process.cwd(), 'posterior-ranklist', 'posterior-ranklist-v1.1.csv');
      if (!fs.existsSync(p)) return names;
      const lines = fs.readFileSync(p, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
      if (lines.length && (parseCsvLine(lines[0])[0] || '').trim().toLowerCase() === 'name') lines.shift();
      lines.forEach((line) => {
        const name = parseCsvLine(line)[0];
        if (name) names.push(name);
      });
    }
  } catch {
    // Missing/unreadable ranklist -> empty cohort.
  }
  return names;
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
    logger.error('firms', 'institution_stats_firm_lookup', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (!firmData.access?.analytics) {
    return res.status(403).json({ error: 'ACCESS_DENIED' });
  }

  // 'posterior' (round 2, the finalists) is the default cohort.
  const round = req.body?.round === 'prior' ? 'prior' : 'posterior';

  try {
    // Build a name-keyed map of approved + consented registrant profiles.
    const snap = await db.collection('registrants')
      .where('status', '==', 'approved')
      .where('dataConsent', '==', true)
      .select('fullName', 'university', 'graduationYear', 'branch', 'email')
      .get();

    const byName = new Map();
    snap.forEach((doc) => {
      const d = doc.data();
      const key = (d.fullName || '').trim().toLowerCase();
      if (key && !byName.has(key)) byName.set(key, d);
    });

    const assessmentMaps = loadAssessmentMaps();
    const names = loadRoundNames(round);

    const counts = new Map();
    const gradYearCounts = new Map();
    const branchCounts = new Map();
    const members = []; // matched cohort, for chart drill-down ("who's in this bucket")
    let matched = 0;

    names.forEach((rawName, idx) => {
      const d = byName.get((rawName || '').trim().toLowerCase());
      if (!d) return;
      matched += 1;

      const name = normalizeInstitution(d.university);
      if (name) {
        const key = name.toLowerCase();
        const existing = counts.get(key);
        if (existing) existing.count += 1;
        else counts.set(key, { name, count: 1 });
      }

      const year = Number(d.graduationYear);
      const validYear = Number.isInteger(year) && year > 0 ? year : null;
      if (validYear) {
        gradYearCounts.set(validYear, (gradYearCounts.get(validYear) || 0) + 1);
      }

      const branch = normalizeInstitution(d.branch);
      if (branch) {
        const key = branch.toLowerCase();
        const existing = branchCounts.get(key);
        if (existing) existing.count += 1;
        else branchCounts.set(key, { name: branch, count: 1 });
      }

      // Ranklist order = rank (idx 0 -> rank 1); matches the leaderboard.
      const assessment = getAssessment(assessmentMaps, d.fullName, d.email);
      members.push({
        name: d.fullName || rawName,
        rank: idx + 1,
        university: name || null,
        branch: branch || null,
        graduationYear: validYear,
        jeeAdvRank: assessment?.jeeAdvRank || null,
        olympiad: assessment?.olympiad || null,
      });
    });

    const institutions = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    const gradYears = Array.from(gradYearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);
    const branches = Array.from(branchCounts.values()).sort((a, b) => b.count - a.count);

    logger.info('firms', 'institution_stats_fetched', {
      reqId,
      actorId: uid,
      detail: { round, cohort: names.length, matched, institutions: institutions.length, gradYears: gradYears.length, branches: branches.length },
      status: 'ok',
    });

    return res.status(200).json({ round, institutions, gradYears, branches, members });
  } catch (err) {
    logger.error('firms', 'institution_stats_query', { reqId, actorId: uid, status: 'failed' }, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
