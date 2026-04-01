import { useRef, useEffect } from 'react';
import styles from '../../styles/registrationCard.module.css';

const CARD_W = 1200;
const CARD_H = 630;

function drawCard(canvas, fullName, university) {
  const ctx = canvas.getContext('2d');

  canvas.width = CARD_W;
  canvas.height = CARD_H;

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Gold border
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(0, 0, CARD_W, 2);
  ctx.fillRect(0, CARD_H - 2, CARD_W, 2);
  ctx.fillRect(0, 0, 2, CARD_H);
  ctx.fillRect(CARD_W - 2, 0, 2, CARD_H);

  const cx = CARD_W / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Top label — "ALGORITHMS & MATHEMATICS SOCIETY"
  ctx.fillStyle = '#D4AF37';
  ctx.font = '500 13px "IBM Plex Mono", "Courier New", monospace';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
  ctx.fillText('ALGORITHMS & MATHEMATICS SOCIETY', cx, 78);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Thin top divider line
  ctx.fillStyle = 'rgba(212,175,55,0.25)';
  ctx.fillRect(cx - 200, 100, 400, 1);

  // Main title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 62px "PT Serif", Georgia, serif';
  ctx.fillText('AMS DERIVE 2026', cx, 200);

  // Middle divider + "OFFICIAL PARTICIPANT" badge
  const rulePad = 130;
  ctx.fillStyle = 'rgba(212,175,55,0.3)';
  ctx.fillRect(rulePad, 235, CARD_W - rulePad * 2, 1);

  ctx.fillStyle = '#D4AF37';
  ctx.font = '600 12px "IBM Plex Mono", "Courier New", monospace';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
  ctx.fillText('OFFICIAL PARTICIPANT', cx, 265);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  ctx.fillStyle = 'rgba(212,175,55,0.3)';
  ctx.fillRect(rulePad, 280, CARD_W - rulePad * 2, 1);

  // Participant name — hero element
  const name = fullName || 'Participant';
  // Scale down font if name is long
  const nameFontSize = name.length > 28 ? 38 : name.length > 20 ? 44 : 50;
  ctx.fillStyle = '#f0ede6';
  ctx.font = `700 ${nameFontSize}px "PT Serif", Georgia, serif`;
  ctx.fillText(name, cx, 375);

  // University
  const uni = university || '';
  ctx.fillStyle = '#888888';
  ctx.font = '400 22px Inter, -apple-system, Arial, sans-serif';
  ctx.fillText(uni, cx, 430);

  // Bottom accent dot row
  ctx.fillStyle = 'rgba(212,175,55,0.18)';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(cx - 90 + i * 30, 490, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Round tag
  ctx.fillStyle = '#444444';
  ctx.font = '400 13px "IBM Plex Mono", "Courier New", monospace';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.fillText('ROUND I · PRIOR', cx, 530);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Bottom label
  ctx.fillStyle = 'rgba(212,175,55,0.6)';
  ctx.font = '400 14px "IBM Plex Mono", "Courier New", monospace';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
  ctx.fillText('amsderive.in', cx, 590);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

export default function RegistrationCard({ fullName, university }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCard(canvas, fullName, university);
  }, [fullName, university]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AMS-Derive-2026-${(fullName || 'Participant').replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  const shareText = `I've registered for AMS Derive 2026 — India's first-principles mathematics & algorithms competition.`;
  const siteUrl = 'https://amsderive.in';

  function handleShareX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handleShareLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.cardLabel}>SHARE YOUR SPOT</p>
      <canvas ref={canvasRef} className={styles.canvas} aria-label="AMS Derive 2026 registration card" />
      <div className={styles.actions}>
        <button onClick={handleShareX} className={styles.actionBtn}>
          𝕏&nbsp;&nbsp;Share on X
        </button>
        <button onClick={handleShareLinkedIn} className={styles.actionBtn}>
          in&nbsp;&nbsp;Share on LinkedIn
        </button>
        <button onClick={handleDownload} className={`${styles.actionBtn} ${styles.downloadBtn}`}>
          ↓&nbsp;&nbsp;Download PNG
        </button>
      </div>
    </div>
  );
}
