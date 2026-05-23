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
const BROADCAST_ATTACHMENT_MAX_BYTES = 3 * 1024 * 1024;
const BROADCAST_ATTACHMENT_BATCH_SIZE = 4;

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function istDateKey(ms) {
  if (!Number.isFinite(ms)) return '';
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(ms + istOffset).toISOString().slice(0, 10);
}

function decrementStatsForDeletedRegistrant(stats, registrant) {
  const next = { ...stats };
  const dec = (key) => {
    next[key] = Math.max(0, Number(next[key] || 0) - 1);
  };

  dec('total');
  if (registrant?.dataConsent === true) dec('consentGiven');
  if (registrant?.status === 'approved') dec('approved');
  if (registrant?.deliveryStatus === 'bounced') dec('bounced');

  const submittedMs = Number.isFinite(registrant?._ts)
    ? registrant._ts
    : new Date(registrant?.submittedAt || '').getTime();
  if (istDateKey(submittedMs) === istDateKey(Date.now())) dec('today');

  return next;
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

function loadImageClean(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = new URL(src, window.location.href);
    if (url.origin !== window.location.origin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load certificate asset: ${src}`));
    img.src = url.href;
  });
}

function drawContain(ctx, img, x, y, w, h) {
  const ratio = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function measureTracked(ctx, text, tracking) {
  return Array.from(text).reduce((width, ch, i) => width + ctx.measureText(ch).width + (i ? tracking : 0), 0);
}

function drawTracked(ctx, text, x, y, tracking) {
  let cursor = x - measureTracked(ctx, text, tracking) / 2;
  Array.from(text).forEach((ch, i) => {
    if (i) cursor += tracking;
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width;
  });
}

function drawRule(ctx, x, y, w, color) {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, 'rgba(212,175,55,0)');
  g.addColorStop(0.3, color);
  g.addColorStop(0.7, color);
  g.addColorStop(1, 'rgba(212,175,55,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, 1);
}

async function renderCertificateToCanvas({ sourceCanvas, name, rank }) {
  if (document.fonts?.ready) await document.fonts.ready;
  const W = 1120, H = 792, scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(1.8, 1);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 260);
  glow.addColorStop(0, 'rgba(212,160,23,.11)');
  glow.addColorStop(0.68, 'rgba(212,160,23,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-500, -300, 1000, 600);
  ctx.restore();
  if (sourceCanvas) ctx.drawImage(sourceCanvas, 0, 0, W, H);

  ctx.strokeStyle = 'rgba(212,175,55,.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(20.5, 20.5, W - 41, H - 41);
  ctx.strokeStyle = 'rgba(212,175,55,.07)';
  ctx.strokeRect(28.5, 28.5, W - 57, H - 57);
  ctx.strokeStyle = 'rgba(212,175,55,.55)';
  ctx.lineWidth = 1.5;
  [[30, 30, 1, 1], [W - 52, 30, -1, 1], [30, H - 52, 1, -1], [W - 52, H - 52, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 22 * sx, y); ctx.moveTo(x, y); ctx.lineTo(x, y + 22 * sy); ctx.stroke();
  });

  const [amsIcon, amsText, jane, qrt] = await Promise.all([
    loadImageClean('/android-chrome-192x192.png'),
    loadImageClean('/AMS_DERIVE_TEXT.svg'),
    loadImageClean('/Jane_Street.svg'),
    loadImageClean('/QRT.png'),
  ]);
  ctx.drawImage(amsIcon, 52, 44, 22, 22);
  drawContain(ctx, amsText, W - 152, 48, 100, 14);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(212,175,55,.45)';
  ctx.font = '9px monospace';
  drawTracked(ctx, 'CERTIFICATE OF ACHIEVEMENT · AMS DERIVE 2026', W / 2, 84, 5);
  ctx.fillStyle = 'rgba(240,237,230,.3)';
  ctx.font = '9px monospace';
  drawTracked(ctx, 'THE ALGEBRAIC & MATHEMATICAL SCIENCES SOCIETY PRESENTS', W / 2, 111, 4);
  ctx.fillStyle = '#fff';
  ctx.font = '700 42px serif';
  drawTracked(ctx, 'CERTIFICATE', W / 2, 164, 5);
  drawTracked(ctx, 'OF EXCELLENCE', W / 2, 207, 5);
  ctx.fillStyle = 'rgba(212,175,55,.55)';
  ctx.font = 'italic 15px serif';
  drawTracked(ctx, 'in Mathematical Sciences & Quantitative Reasoning', W / 2, 238, 1.6);
  drawRule(ctx, W / 2 - 100, 272, 200, 'rgba(212,175,55,1)');
  ctx.fillStyle = 'rgba(212,175,55,.4)';
  ctx.font = '9px monospace';
  drawTracked(ctx, 'AWARDED TO', W / 2, 306, 5);
  ctx.fillStyle = '#f0ede6';
  ctx.font = '700 32px serif';
  ctx.fillText(name || 'Participant', W / 2, 354);
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(212,175,55,.38)';
  drawTracked(ctx, 'ACHIEVEMENT', W / 2 - 72, 386, 3);
  ctx.font = '600 13px monospace';
  ctx.fillStyle = '#D4AF37';
  drawTracked(ctx, rank || '—', W / 2 + 62, 386, 2);
  drawRule(ctx, W / 2 - 150, 420, 300, 'rgba(212,175,55,.28)');

  ctx.font = '7px monospace';
  ctx.fillStyle = 'rgba(212,175,55,.4)';
  drawTracked(ctx, 'APEX PARTNER', W / 2, 510, 2.4);
  drawContain(ctx, jane, W / 2 - 105, 528, 210, 34);
  drawTracked(ctx, 'CONVERGENCE PARTNER', W / 2, 586, 2.4);
  drawContain(ctx, qrt, W / 2 - 56, 600, 112, 66);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(240,237,230,.5)';
  ctx.font = '700 12px serif';
  ctx.fillText('AMS Core Team', 86, 695);
  ctx.fillStyle = 'rgba(212,175,55,.28)';
  ctx.fillRect(86, 707, 130, 1);
  ctx.fillStyle = 'rgba(212,175,55,.38)';
  ctx.font = '8px monospace';
  ctx.fillText('ORGANIZING COMMITTEE', 86, 724);
  return canvas;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Certificate Panel — rendered inside the CERTIFICATE tab of the admin dashboard.
   Self-contained: no external deps.
───────────────────────────────────────────────────────────────────────────── */
function CertificatePanel() {
  const [name, setName] = React.useState('Arjun Sharma');
  const [rank, setRank] = React.useState('Rank 7 · Top 3%');
  const [downloading, setDownloading] = React.useState(false);
  const canvasRef = React.useRef(null);
  const certRef = React.useRef(null);
  const previewHostRef = React.useRef(null);
  const [previewScale, setPreviewScale] = React.useState(0.72);

  // Draw math background on canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 1120, H = 792;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const gold = 'rgba(212,175,55,';

    // Fine grid
    ctx.strokeStyle = gold + '0.06)'; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Diagonal lines
    ctx.strokeStyle = gold + '0.04)'; ctx.lineWidth = 0.8;
    for (let i = -10; i < 20; i++) { const x = W * 0.6 + i * 60; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 240, H); ctx.stroke(); }

    // AMS Derive wireframe mesh — homepage-inspired mathematical terrain
    function meshPoint(x, t) {
      const scale = 24 + t * 34;
      const wave = Math.sin(x * 0.9 + t * 5.2) * (5 + t * 8)
        + Math.sin(x * 1.8 - t * 3.4) * (2 + t * 4);
      return {
        x: W / 2 + x * scale,
        y: H * 0.58 + t * 170 + wave,
      };
    }
    ctx.save();
    ctx.lineWidth = 0.85;
    ctx.shadowColor = 'rgba(212,175,55,0.18)';
    ctx.shadowBlur = 8;
    const meshCols = 18;
    const meshRows = 18;
    for (let r = 0; r <= meshRows; r++) {
      const t = r / meshRows;
      ctx.strokeStyle = gold + (0.08 + t * 0.28) + ')';
      ctx.beginPath();
      for (let c = 0; c <= meshCols; c++) {
        const x = -8 + (16 * c / meshCols);
        const p = meshPoint(x, t);
        c === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    for (let c = 0; c <= meshCols; c++) {
      const x = -8 + (16 * c / meshCols);
      ctx.beginPath();
      for (let r = 0; r <= meshRows; r++) {
        const t = r / meshRows;
        const p = meshPoint(x, t);
        r === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = gold + '0.14)';
      ctx.stroke();
    }
    for (let c = 2; c < meshCols; c += 4) {
      for (let r = 4; r < meshRows; r += 4) {
        const p = meshPoint(-8 + (16 * c / meshCols), r / meshRows);
        ctx.fillStyle = gold + '0.20)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.15, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    // Math symbols
    const symbols = ['∫','∑','∂','∇','∞','√','π','Δ','λ','ε','δ','φ','σ','μ','θ','ℝ','ℤ','ℕ','∀','∃','∈','⊂','⊕','≤','≥','≠','≡','∝','∮','⟨','⟩','α','β','γ','ω','Ω','Λ','Γ','Ψ'];
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    function rng(seed) { let s = seed % 2147483647; return () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
    const rand = rng(42);
    for (let i = 0; i < 55; i++) {
      ctx.fillStyle = gold + (0.04 + rand() * 0.09) + ')';
      ctx.font = (9 + rand() * 12) + 'px monospace';
      ctx.fillText(symbols[Math.floor(rand() * symbols.length)], rand() * W, rand() * H);
    }

    // Edge equations
    const eqs = ["f'(x) = lim_{h→0} [f(x+h)-f(x)]/h", "e^(iπ) + 1 = 0", "∫₋∞^∞ e^(-x²) dx = √π", "det(A) = Σ sgn(σ) ∏ aᵢσ(ᵢ)", "P(A|B) = P(B|A)·P(A)/P(B)", "∇²φ = 0", "V - E + F = 2"];
    const eqPos = [[80,H-100],[W-180,48],[48,H/2-60],[W-220,H-100],[80,60],[W-180,H/2],[W/2-180,H-100]];
    ctx.font = '9px monospace'; ctx.textAlign = 'center';
    eqPos.forEach(([ex, ey], i) => { if (i >= eqs.length) return; ctx.fillStyle = gold + '0.12)'; ctx.fillText(eqs[i], ex, ey); });

    // Axes + sine wave
    const ox = 100, oy = H - 110, len = 60;
    ctx.strokeStyle = gold + '0.16)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + len, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - len); ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = gold + '0.11)';
    for (let px = ox; px <= ox + len; px++) { const py2 = oy - 13 * Math.sin((px - ox) / len * Math.PI * 2); px === ox ? ctx.moveTo(px, py2) : ctx.lineTo(px, py2); }
    ctx.stroke();

    // Matrix
    ctx.fillStyle = gold + '0.13)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
    ['[a  b  c]', '[d  e  f]', '[g  h  i]'].forEach((row, ri) => ctx.fillText(row, W - 112, 88 + ri * 14));
  }, []);

  React.useEffect(() => {
    const node = previewHostRef.current;
    if (!node) return;

    const updateScale = () => {
      const availableWidth = node.clientWidth || 1120;
      const nextScale = Math.min(1, Math.max(0.34, (availableWidth - 2) / 1120));
      setPreviewScale(Number(nextScale.toFixed(4)));
    };

    updateScale();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateScale);
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  async function handleDownload() {
    if (downloading || !certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await renderCertificateToCanvas({
        sourceCanvas: canvasRef.current,
        name: name || 'Participant',
        rank: rank || '—',
      });
      const link = document.createElement('a');
      link.download = `AMS_Derive_2026_Certificate_${name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      const message = e?.message || String(e) || 'Unknown error while generating the certificate.';
      alert('Download failed: ' + message);
      console.error(e);
    }
    setDownloading(false);
  }

  const certStyles = {
    panel: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    controls: { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', width: '100%', maxWidth: 1120, marginBottom: 28 },
    previewHost: { width: '100%', maxWidth: 1120, margin: '0 auto', overflow: 'visible' },
    previewShell: { position: 'relative', margin: '0 auto' },
    previewScaler: { width: 1120, height: 792, transformOrigin: 'top left' },
    wrap: { border: '1px solid rgba(212,175,55,.2)', borderRadius: 2, overflow: 'hidden', boxShadow: '0 0 60px rgba(212,175,55,.07)', display: 'inline-block' },
    cert: { width: 1120, height: 792, background: '#050505', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    orb: { position: 'absolute', width: 900, height: 500, background: 'radial-gradient(ellipse at 50% 52%,rgba(212,160,23,.11) 0%,transparent 68%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' },
    frame: { position: 'absolute', inset: 20, border: '1px solid rgba(212,175,55,.2)', borderRadius: 1, pointerEvents: 'none' },
    frameInner: { position: 'absolute', inset: 28, border: '1px solid rgba(212,175,55,.07)', borderRadius: 1, pointerEvents: 'none' },
    corner: (t, l, b, r) => ({ position: 'absolute', width: 22, height: 22, top: t, left: l, bottom: b, right: r, borderColor: 'rgba(212,175,55,.55)', borderStyle: 'solid', borderWidth: t != null ? '1.5px 0 0 1.5px' : (b != null && l != null ? '0 0 1.5px 1.5px' : (b != null ? '0 1.5px 1.5px 0' : '1.5px 1.5px 0 0')) }),
    logoIcon: { position: 'absolute', top: 44, left: 52, width: 22, height: 22, zIndex: 3, pointerEvents: 'none' },
    logoText: { position: 'absolute', top: 48, right: 52, height: 14, width: 'auto', zIndex: 3, pointerEvents: 'none' },
    content: { position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 0, textAlign: 'center', width: '100%', height: '100%', boxSizing: 'border-box', padding: '76px 90px 48px' },
    eyebrow: { fontFamily: 'monospace', fontSize: '.56rem', letterSpacing: '.3em', color: 'rgba(212,175,55,.45)', textTransform: 'uppercase', marginBottom: 14 },
    presents: { fontFamily: 'monospace', fontSize: '.58rem', letterSpacing: '.2em', color: 'rgba(240,237,230,.3)', textTransform: 'uppercase', marginBottom: 14 },
    title: { fontFamily: 'serif', fontSize: '2.5rem', fontWeight: 700, color: '#fff', letterSpacing: '.12em', textTransform: 'uppercase', lineHeight: 1.05, marginBottom: 8, textShadow: '0 0 30px rgba(212,175,55,.18)' },
    subtitle: { fontFamily: 'serif', fontSize: '.95rem', color: 'rgba(212,175,55,.55)', letterSpacing: '.1em', marginBottom: 28, fontStyle: 'italic' },
    rule: { width: 200, height: 1, background: 'linear-gradient(90deg,transparent,#D4AF37 30%,#D4AF37 70%,transparent)', marginBottom: 22 },
    to: { fontFamily: 'monospace', fontSize: '.58rem', letterSpacing: '.25em', color: 'rgba(212,175,55,.4)', textTransform: 'uppercase', marginBottom: 10 },
    nameEl: { fontFamily: 'serif', fontSize: '2rem', fontWeight: 700, color: '#f0ede6', letterSpacing: '.04em', lineHeight: 1.05, maxWidth: 760, overflowWrap: 'anywhere', marginBottom: 8 },
    rankRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 18px', maxWidth: 760, marginBottom: 22 },
    rankLabel: { fontFamily: 'monospace', fontSize: '.56rem', letterSpacing: '.2em', color: 'rgba(212,175,55,.38)', textTransform: 'uppercase' },
    rankVal: { fontFamily: 'monospace', fontSize: '.82rem', fontWeight: 600, letterSpacing: '.14em', color: '#D4AF37', lineHeight: 1.35, maxWidth: 520, overflowWrap: 'anywhere', textAlign: 'center' },
    rule2: { width: 300, height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.28) 20%,rgba(212,175,55,.28) 80%,transparent)', marginBottom: 22 },
    footer: { position: 'absolute', left: 86, bottom: 64, zIndex: 3 },
    sigBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 },
    sigLine: { width: 130, height: 1, background: 'rgba(212,175,55,.28)' },
    sigLabel: { fontFamily: 'monospace', fontSize: '.50rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(212,175,55,.38)' },
    sigName: { fontFamily: 'serif', fontSize: '.72rem', fontWeight: 700, color: 'rgba(240,237,230,.5)', letterSpacing: '.05em' },
    partnersInline: { position: 'absolute', left: '50%', bottom: 172, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, width: 300 },
    partnerCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, width: '100%' },
    partnerLabelRow: { display: 'flex', alignItems: 'center', gap: 10, width: 260 },
    partnerRule: { flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.25))' },
    partnerRuleR: { flex: 1, height: 1, background: 'linear-gradient(270deg,transparent,rgba(212,175,55,.25))' },
    partnerTier: { fontFamily: 'monospace', fontSize: '.44rem', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(212,175,55,.4)', whiteSpace: 'nowrap' },
    partnerLogoJs: { height: 34, width: 'auto', maxWidth: 210, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: .92 },
    partnerLogoQrt: { height: 66, width: 'auto', maxWidth: 112, objectFit: 'contain', opacity: .86 },
  };

  return (
    <div style={certStyles.panel}>
      {/* Controls */}
      <div style={certStyles.controls}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
          <label style={{ fontFamily: 'monospace', fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,.6)' }}>Participant Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arjun Sharma"
            style={{ background: '#0e0e0e', border: '1px solid rgba(212,175,55,.25)', color: '#f0ede6', fontFamily: 'monospace', fontSize: '.9rem', padding: '10px 14px', borderRadius: 2, outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
          <label style={{ fontFamily: 'monospace', fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,.6)' }}>Rank / Position</label>
          <input
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            placeholder="e.g. Rank 7 · Top 3%"
            style={{ background: '#0e0e0e', border: '1px solid rgba(212,175,55,.25)', color: '#f0ede6', fontFamily: 'monospace', fontSize: '.9rem', padding: '10px 14px', borderRadius: 2, outline: 'none' }}
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{ fontFamily: 'monospace', fontSize: '.72rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', background: '#D4AF37', color: '#0a0a0a', border: 'none', padding: '12px 28px', borderRadius: 2, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? .7 : 1 }}
        >
          {downloading ? 'Generating…' : '↓ Download PNG'}
        </button>
      </div>

      {/* Certificate preview — scaled to fit admin panel */}
      <div ref={previewHostRef} style={certStyles.previewHost}>
        <div style={{ ...certStyles.previewShell, width: 1120 * previewScale, height: 792 * previewScale }}>
          <div style={{ ...certStyles.previewScaler, transform: `scale(${previewScale})` }}>
          <div style={certStyles.wrap}>
            <div ref={certRef} style={certStyles.cert}>
              {/* Orb */}
              <div style={certStyles.orb} />
              {/* Math canvas */}
              <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, opacity: .17, pointerEvents: 'none' }} />
              {/* Frames */}
              <div style={certStyles.frame} />
              <div style={certStyles.frameInner} />
              {/* Corners */}
              <div style={{ position: 'absolute', top: 30, left: 30, width: 22, height: 22, borderTop: '1.5px solid rgba(212,175,55,.55)', borderLeft: '1.5px solid rgba(212,175,55,.55)' }} />
              <div style={{ position: 'absolute', top: 30, right: 30, width: 22, height: 22, borderTop: '1.5px solid rgba(212,175,55,.55)', borderRight: '1.5px solid rgba(212,175,55,.55)' }} />
              <div style={{ position: 'absolute', bottom: 30, left: 30, width: 22, height: 22, borderBottom: '1.5px solid rgba(212,175,55,.55)', borderLeft: '1.5px solid rgba(212,175,55,.55)' }} />
              <div style={{ position: 'absolute', bottom: 30, right: 30, width: 22, height: 22, borderBottom: '1.5px solid rgba(212,175,55,.55)', borderRight: '1.5px solid rgba(212,175,55,.55)' }} />
              {/* Logos */}
              <img src="/android-chrome-192x192.png" alt="AMS" style={certStyles.logoIcon} />
              <img src="/AMS_DERIVE_TEXT.svg" alt="AMS Derive" style={certStyles.logoText} />
              {/* Content */}
              <div style={certStyles.content}>
                <div style={certStyles.eyebrow}>Certificate of Achievement · AMS Derive 2026</div>
                <div style={certStyles.presents}>The Algebraic &amp; Mathematical Sciences Society presents</div>
                <div style={certStyles.title}>Certificate<br />of Excellence</div>
                <div style={certStyles.subtitle}>in Mathematical Sciences &amp; Quantitative Reasoning</div>
                <div style={certStyles.rule} />
                <div style={certStyles.to}>Awarded to</div>
                <div style={certStyles.nameEl}>{name || 'Participant'}</div>
                <div style={certStyles.rankRow}>
                  <div style={certStyles.rankLabel}>Achievement</div>
                  <div style={certStyles.rankVal}>{rank || '—'}</div>
                </div>
                <div style={certStyles.rule2} />
                {/* Partners — centered stacked sponsor treatment */}
                <div style={certStyles.partnersInline}>
                  <div style={certStyles.partnerCol}>
                    <div style={certStyles.partnerLabelRow}>
                      <div style={certStyles.partnerRule} />
                      <div style={certStyles.partnerTier}>Apex Partner</div>
                      <div style={certStyles.partnerRuleR} />
                    </div>
                    <img src="/Jane_Street.svg" alt="Jane Street" style={certStyles.partnerLogoJs} />
                  </div>
                  <div style={certStyles.partnerCol}>
                    <div style={certStyles.partnerLabelRow}>
                      <div style={certStyles.partnerRule} />
                      <div style={certStyles.partnerTier}>Convergence Partner</div>
                      <div style={certStyles.partnerRuleR} />
                    </div>
                    <img src="/QRT.png" alt="QRT" style={certStyles.partnerLogoQrt} />
                  </div>
                </div>
                <div style={certStyles.footer}>
                  <div style={certStyles.sigBlock}>
                    <div style={certStyles.sigName}>AMS Core Team</div>
                    <div style={certStyles.sigLine} />
                    <div style={certStyles.sigLabel}>Organizing Committee</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastFilter, setBroadcastFilter] = useState('prior');
  const [broadcastTargetType, setBroadcastTargetType] = useState('registrants');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState(null);
  const [broadcastProgress, setBroadcastProgress] = useState(null);
  const [broadcastConfirming, setBroadcastConfirming] = useState(false);
  const [broadcastRetryId, setBroadcastRetryId] = useState(null);
  const [broadcastDraftId, setBroadcastDraftId] = useState(null);
  const [broadcastAttachment, setBroadcastAttachment] = useState(null);
  const [broadcastAttachmentLoading, setBroadcastAttachmentLoading] = useState(false);
  const [broadcastAttachmentMsg, setBroadcastAttachmentMsg] = useState(null);
  const [outreachImportLoading, setOutreachImportLoading] = useState(false);
  const [outreachImportMsg, setOutreachImportMsg] = useState(null);
  const [roundLoading, setRoundLoading] = useState(false);
  const [roundMsg, setRoundMsg] = useState(null);
  const [approveAllConfirm, setApproveAllConfirm] = useState(false);
  const [approveAllLoading, setApproveAllLoading] = useState(false);
  const [approveAllMsg, setApproveAllMsg] = useState(null);
  const [approveAllProgress, setApproveAllProgress] = useState(null);
  const [approveAllRetryId, setApproveAllRetryId] = useState(null);
  const [copiedCfHandles, setCopiedCfHandles] = useState([]);
  const [cfCopyLoading, setCfCopyLoading] = useState(false);
  const [cfCopyMsg, setCfCopyMsg] = useState(null);

  // Refs: store current user for callbacks that don't need to re-create on user change,
  // and token cache to avoid repeated getIdToken() async calls.
  const userRef = useRef(null);
  const tokenCache = useRef({ token: null, expiry: 0 });
  const outreachFileInputRef = useRef(null);
  const broadcastAttachmentInputRef = useRef(null);
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

  async function authOnlyHeaders() {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
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
      if (e.key === 'Escape') {
        setSelectedRegistrant(null);
        setDeleteMsg(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setDeleteConfirming(false);
    setDeleteConfirmText('');
  }, [selectedRegistrant?.id]);

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
      setDeleteMsg(null);
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

  async function handleDeleteRegistrant() {
    if (!selectedRegistrant || deleteLoading || deleteConfirmText !== 'Yes delete') return;

    const deletedRegistrant = selectedRegistrant;
    setDeleteLoading(true);
    setDeleteMsg(null);

    try {
      const hdrs = await authHeaders();
      const res = await fetch('/api/admin/delete-registrant', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({ docId: deletedRegistrant.id, confirmText: deleteConfirmText }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete participant.');
      }

      setRegistrants((prev) => prev.filter((reg) => reg.id !== deletedRegistrant.id));
      setStats((prev) => decrementStatsForDeletedRegistrant(prev, deletedRegistrant));
      setSelectedRegistrant(null);
      setDeleteConfirming(false);
      setDeleteConfirmText('');
      setDeleteMsg({ type: 'success', text: 'Participant deleted.' });
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err.message || 'Network error. Please try again.' });
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleApproveAll() {
    if (approveAllLoading) return;
    setApproveAllConfirm(false);
    setApproveAllLoading(true);
    setApproveAllMsg(null);
    setApproveAllProgress({ approved: 0, total: null, processed: 0, failed: 0 });
    const runId = approveAllRetryId || newBroadcastId();
    let latest = { approved: 0, emailsSent: 0, emailsFailed: 0, skipped: 0, total: null, processed: 0 };
    try {
      const hdrs = await authHeaders();
      while (true) {
        const res = await fetch('/api/admin/approve-all', {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify({ runId, batchSize: BROADCAST_BATCH_SIZE }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Bulk approval failed.');
        }

        latest = data;
        setApproveAllProgress({
          approved: data.approved || 0,
          total: Number.isFinite(Number(data.total)) ? Number(data.total) : null,
          processed: data.processed || data.approved || 0,
          failed: data.emailsFailed || 0,
        });

        if (data.done) break;
        if (data.noClaim) {
          await wait(Number(data.retryAfterMs) || 1000);
          continue;
        }
        if (!Number.isFinite(Number(data.remaining)) || Number(data.remaining) <= 0) {
          throw new Error('Approval queue did not advance.');
        }
        await wait(500);
      }

      if (!latest.emailsFailed && !latest.skipped) {
        setRegistrants((prev) =>
          prev.map((reg) => reg.status === 'pending' || !reg.status ? { ...reg, status: 'approved' } : reg)
        );
      }
      const parts = [`Approved ${latest.approved || 0}`, `${latest.emailsSent || 0} emails sent`];
      if (latest.emailsFailed) parts.push(`${latest.emailsFailed} failed`);
      if (latest.skipped) parts.push(`${latest.skipped} NOT approved`);
      setApproveAllMsg({
        type: latest.emailsFailed || latest.skipped ? 'error' : 'success',
        text: parts.join(' · '),
      });
      setApproveAllRetryId(null);
    } catch (err) {
      setApproveAllRetryId(runId);
      setApproveAllMsg({ type: 'error', text: `${err.message || 'Network error. Please try again.'} Approved ${latest.approved || 0} so far; click approve again to continue the same approval run.` });
    } finally {
      setApproveAllLoading(false);
      setApproveAllProgress(null);
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

  function newBroadcastId() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `b_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(Number(bytes))) return '';
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleBroadcastAttachmentUpload(file) {
    if (!file || broadcastAttachmentLoading || broadcastLoading || broadcastRetryId) return;
    setBroadcastAttachmentMsg(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setBroadcastAttachmentMsg({ type: 'error', text: 'Only PDF attachments are accepted.' });
      return;
    }
    if (file.size > BROADCAST_ATTACHMENT_MAX_BYTES) {
      setBroadcastAttachmentMsg({ type: 'error', text: 'PDF must be 3 MB or smaller.' });
      return;
    }

    const id = broadcastDraftId || newBroadcastId();
    setBroadcastDraftId(id);
    setBroadcastAttachmentLoading(true);

    try {
      const formData = new FormData();
      formData.append('broadcastId', id);
      formData.append('file', file);
      const hdrs = await authOnlyHeaders();
      const res = await fetch('/api/admin/upload-broadcast-attachment', {
        method: 'POST',
        headers: hdrs,
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Attachment upload failed.');
      }
      setBroadcastAttachment({ ...data.attachment, broadcastId: id });
      setBroadcastAttachmentMsg({ type: 'success', text: `Attached ${data.attachment.fileName}` });
    } catch (err) {
      setBroadcastAttachment(null);
      setBroadcastAttachmentMsg({ type: 'error', text: err.message || 'Attachment upload failed.' });
    } finally {
      setBroadcastAttachmentLoading(false);
      if (broadcastAttachmentInputRef.current) broadcastAttachmentInputRef.current.value = '';
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
      mode: broadcastAttachment ? 'Attachment' : 'Batch',
    });
    // Reuse the same broadcastId after a retryable failure so successful queue rows
    // are not sent again.
    const broadcastId = broadcastRetryId || broadcastAttachment?.broadcastId || broadcastDraftId || newBroadcastId();
    if (!broadcastDraftId) setBroadcastDraftId(broadcastId);
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
            batchSize: broadcastAttachment ? BROADCAST_ATTACHMENT_BATCH_SIZE : BROADCAST_BATCH_SIZE,
            attachment: broadcastAttachment ? {
              storagePath: broadcastAttachment.storagePath,
              fileName: broadcastAttachment.fileName,
              size: broadcastAttachment.size,
              contentType: broadcastAttachment.contentType,
            } : null,
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
          mode: data.mode === 'queued_attachment' ? 'Attachment' : 'Batch',
        });

        if (data.done) break;
        if (data.noClaim) {
          await wait(Number(data.retryAfterMs) || 1000);
          continue;
        }
        if (!Number.isFinite(Number(data.remaining)) || Number(data.remaining) <= 0) {
          throw new Error('Broadcast queue did not advance.');
        }
        await wait(500);
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
      setBroadcastDraftId(null);
      setBroadcastAttachment(null);
      setBroadcastAttachmentMsg(null);
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
  const broadcastRoundLabel = broadcastFilter === 'all' ? 'all rounds' : broadcastFilter.toUpperCase();
  const broadcastAudienceLabel = broadcastTargetType === 'outreach'
    ? broadcastTargetLabel
    : `${broadcastTargetLabel} · ${broadcastRoundLabel}`;

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
            {activeList !== 'certificates' && (
              <>
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
              </>
            )}
            <button className={styles.logoutBtn} onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        </header>

        <main className={styles.dashMain}>
          {/* Broadcast panel */}
          {activeList !== 'certificates' && broadcastOpen && (
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
              <div className={styles.broadcastImportRow}>
                <input
                  ref={broadcastAttachmentInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className={styles.hiddenFileInput}
                  onChange={(e) => handleBroadcastAttachmentUpload(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className={styles.attachmentBtn}
                  onClick={() => broadcastAttachmentInputRef.current?.click()}
                  disabled={broadcastAttachmentLoading || broadcastLoading || !!broadcastRetryId}
                  title={broadcastRetryId ? 'Finish or abandon the current retry before changing attachments.' : 'Attach a PDF to this broadcast'}
                >
                  {broadcastAttachmentLoading ? 'UPLOADING PDF...' : broadcastAttachment ? 'REPLACE PDF' : 'ATTACH PDF'}
                </button>
                {broadcastAttachment && (
                  <span className={styles.attachmentPill}>
                    {broadcastAttachment.fileName} · {formatBytes(broadcastAttachment.size)}
                    <button
                      type="button"
                      className={styles.attachmentRemoveBtn}
                      onClick={() => { setBroadcastAttachment(null); setBroadcastAttachmentMsg(null); }}
                      disabled={broadcastLoading || !!broadcastRetryId}
                      title="Remove attachment"
                    >
                      X
                    </button>
                  </span>
                )}
                {broadcastAttachmentMsg && (
                  <span className={broadcastAttachmentMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                    {broadcastAttachmentMsg.text}
                  </span>
                )}
              </div>
              <input
                className={styles.broadcastInput}
                type="text"
                placeholder="Subject"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                disabled={broadcastLoading || !!broadcastRetryId}
              />
              <textarea
                className={styles.broadcastTextarea}
                placeholder="Message body..."
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                rows={5}
                disabled={broadcastLoading || !!broadcastRetryId}
              />
              <div className={styles.broadcastFooter}>
                <select
                  className={styles.filterSelect}
                  value={broadcastTargetType}
                  onChange={(e) => { setBroadcastTargetType(e.target.value); setBroadcastConfirming(false); }}
                  disabled={broadcastLoading || !!broadcastRetryId}
                >
                  <option value="registrants">Approved Registrants</option>
                  <option value="outreach">External Outreach Contacts</option>
                  <option value="both">Both</option>
                </select>
                <select
                  className={styles.filterSelect}
                  value={broadcastFilter}
                  onChange={(e) => { setBroadcastFilter(e.target.value); setBroadcastConfirming(false); }}
                  disabled={broadcastLoading || !!broadcastRetryId || broadcastTargetType === 'outreach'}
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
                      <strong>{broadcastAudienceLabel}</strong>?
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
                    {broadcastProgress.mode || 'Batch'} {broadcastProgress.batchNumber || 1}
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
              onClick={() => { setActiveList('outreach'); setSelectedRegistrant(null); setDeleteMsg(null); }}
            >
              OUTREACH
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeList === 'certificates' ? styles.tabActive : ''}`}
              onClick={() => { setActiveList('certificates'); setSelectedRegistrant(null); setDeleteMsg(null); setBroadcastOpen(false); }}
            >
              CERTIFICATE
            </button>
            <Link href="/admin/analytics" className={styles.tab}>ANALYTICS</Link>
            <Link href="/admin/firms" className={styles.tab}>FIRMS</Link>
            <Link href="/admin/ambassadors" className={styles.tab}>AMBASSADORS</Link>
          </div>

          {/* Stats — hidden on certificate tab */}
          {activeList !== 'certificates' && (
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
          )}

          {/* Certificate tab panel */}
          {activeList === 'certificates' && <CertificatePanel />}

          {/* Filters — hidden on certificate tab */}
          {activeList !== 'certificates' && <div className={styles.filterBar}>
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
          </div>}

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
            {approveAllProgress && (
              <span className={styles.broadcastProgress}>
                Approval {approveAllProgress.processed}
                {approveAllProgress.total != null ? ` of ${approveAllProgress.total}` : ''}
                {` · ${approveAllProgress.approved} approved`}
                {approveAllProgress.failed ? ` · ${approveAllProgress.failed} failed` : ''}
              </span>
            )}
            {cfCopyMsg && (
              <span className={cfCopyMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                {cfCopyMsg.text}
              </span>
            )}
            {deleteMsg && !selectedRegistrant && (
              <span className={deleteMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                {deleteMsg.text}
              </span>
            )}
          </div>
          )}

          {/* Table */}
          {activeList === 'registrants' && (
            loadingData ? (
              <div className={styles.tableLoading}>Loading registrants...</div>
            ) : (
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
                          onClick={() => { setSelectedRegistrant(selectedRegistrant?.id === reg.id ? null : reg); setStatusMsg(null); setRoundMsg(null); setDeleteMsg(null); }}
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
            )
          )}

          {activeList === 'outreach' && (
            loadingOutreach ? (
              <div className={styles.tableLoading}>Loading outreach contacts...</div>
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
            )
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
            onClick={() => { setSelectedRegistrant(null); setStatusMsg(null); setRoundMsg(null); setDeleteMsg(null); }}
          />
          <aside className={styles.sidePanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelName}>{r.fullName}</span>
              <button
                className={styles.panelClose}
                onClick={() => { setSelectedRegistrant(null); setStatusMsg(null); setRoundMsg(null); setDeleteMsg(null); }}
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
                  disabled={roundLoading || deleteLoading}
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
                  <button className={styles.approveBtn} disabled={statusLoading || deleteLoading} onClick={() => handleStatusUpdate('approved')}>
                    {statusLoading ? '...' : 'APPROVE'}
                  </button>
                  <button className={styles.rejectBtn} disabled={statusLoading || deleteLoading} onClick={() => handleStatusUpdate('rejected')}>
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
                  disabled={!r.resumeUrl || deleteLoading}
                  onClick={() => r.resumeUrl && handleViewFile(r.resumeUrl)}
                >
                  VIEW RESUME
                </button>
                <button
                  className={styles.panelActionBtn}
                  disabled={!r.transcriptUrl || deleteLoading}
                  onClick={() => r.transcriptUrl && handleViewFile(r.transcriptUrl)}
                >
                  VIEW TRANSCRIPT
                </button>
              </div>
              <div className={styles.deleteZone}>
                {!deleteConfirming ? (
                  <button
                    className={styles.deleteParticipantBtn}
                    disabled={deleteLoading || statusLoading || roundLoading}
                    onClick={() => { setDeleteConfirming(true); setDeleteConfirmText(''); setDeleteMsg(null); }}
                  >
                    DELETE PARTICIPANT
                  </button>
                ) : (
                  <div className={styles.deleteConfirmBox}>
                    <p className={styles.deleteConfirmText}>
                      Delete {r.fullName} · {r.email}
                    </p>
                    <label className={styles.deleteConfirmLabel} htmlFor="delete-confirm-text">
                      Type Yes delete
                    </label>
                    <input
                      id="delete-confirm-text"
                      className={styles.deleteConfirmInput}
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      disabled={deleteLoading}
                      autoComplete="off"
                    />
                    <div className={styles.deleteConfirmActions}>
                      <button
                        className={styles.deleteConfirmBtn}
                        disabled={deleteLoading || deleteConfirmText !== 'Yes delete'}
                        onClick={handleDeleteRegistrant}
                      >
                        {deleteLoading ? 'DELETING...' : 'CONFIRM DELETE'}
                      </button>
                      <button
                        className={styles.cancelBtn}
                        disabled={deleteLoading}
                        onClick={() => { setDeleteConfirming(false); setDeleteConfirmText(''); setDeleteMsg(null); }}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}
                {deleteMsg && selectedRegistrant && (
                  <p className={deleteMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                    {deleteMsg.text}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
