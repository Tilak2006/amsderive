/**
 * Loads the Technical Candidate Assessment (quant screening) form responses and
 * exposes them keyed by candidate name and email, for enriching firm-facing
 * candidate data (leaderboard / talent pool / analytics drill-down).
 *
 * Source: placement/Technical Candidate Assessment ... Form Responses 1.csv
 * Never expose the respondent's email to firms — it's only used here for matching.
 */

import fs from 'fs';
import path from 'path';

// Full CSV parser: handles quoted fields, escaped quotes ("") and embedded newlines.
function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuotes) {
      if (c === '"') {
        if (content[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// Drop non-answers so they don't render as real signal.
function clean(v) {
  const s = (v || '').trim();
  if (!s) return null;
  if (/^(n\/?a|not applicable|none|nil|no|-+)$/i.test(s)) return null;
  return s;
}

function normName(s) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Manually-curated industry interview track record (not in any form CSV), keyed by name.
const INTERVIEW_INTEL = new Map([
  ['naveen pramod kulkarni', 'Jane Street: reached Superday (final round)'],
  ['aabhas singh', 'Jane Street: interviewed'],
]);

const CSV_FILE = 'Technical Candidate Assessment - Quantitative Research & Engineering (Responses) - Form Responses 1.csv';

// Returns { byName: Map, byEmail: Map } of name/email -> assessment object.
export function loadAssessmentMaps() {
  const result = { byName: new Map(), byEmail: new Map() };
  try {
    const p = path.join(process.cwd(), 'placement', CSV_FILE);
    if (!fs.existsSync(p)) return result;
    const content = fs.readFileSync(p, 'utf8').replace(/^﻿/, '');
    const rows = parseCsv(content).filter((r) => r.some((c) => (c || '').trim()));
    if (rows.length < 2) return result;

    const hdr = rows[0].map((h) => (h || '').trim().toLowerCase());
    const idx = (sub) => hdr.findIndex((h) => h.includes(sub));
    const col = {
      email: idx('email address'),
      name: idx('full name'),
      quant: idx('interested in quant'),
      olympiad: idx('olympiad'),
      jee: idx('jee advanced'),
      kvpy: idx('kvpy'),
      cp: idx('competitive programming'),
      research: idx('research work'),
      atcoder: idx('atcoder'),
      github: idx('github'),
    };

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const get = (k) => (col[k] >= 0 && col[k] < r.length ? clean(r[col[k]]) : null);
      const assessment = {
        jeeAdvRank: get('jee'),
        olympiad: get('olympiad'),
        kvpyNtse: get('kvpy'),
        cpQuant: get('cp'),
        research: get('research'),
        atcoder: get('atcoder'),
        github: get('github'),
        quantInterest: get('quant'),
      };
      if (!Object.values(assessment).some(Boolean)) continue;

      const nameKey = col.name >= 0 ? normName(r[col.name]) : '';
      const emailKey = col.email >= 0 ? (r[col.email] || '').trim().toLowerCase() : '';
      if (nameKey && !result.byName.has(nameKey)) result.byName.set(nameKey, assessment);
      if (emailKey && !result.byEmail.has(emailKey)) result.byEmail.set(emailKey, assessment);
    }
  } catch {
    // Missing/unreadable file -> empty maps; callers degrade gracefully.
  }
  return result;
}

// Match by full name first, then fall back to email; merge in manual interview intel.
export function getAssessment(maps, fullName, email) {
  if (!maps) return null;
  const nk = normName(fullName);
  let base = null;
  if (nk && maps.byName.has(nk)) base = maps.byName.get(nk);
  else {
    const ek = (email || '').trim().toLowerCase();
    if (ek && maps.byEmail.has(ek)) base = maps.byEmail.get(ek);
  }
  const interviews = nk ? (INTERVIEW_INTEL.get(nk) || null) : null;
  if (!base && !interviews) return null;
  return { ...(base || {}), interviews };
}
