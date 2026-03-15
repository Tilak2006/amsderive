import { memo } from 'react';
import styles from './BackgroundOverlay.module.css';

/**
 * BackgroundOverlay — premium edition
 *
 * Enhancements over original:
 *  - Radial golden spotlight at center (SVG radialGradient)
 *  - Stochastic data point scatter (suggests live price data)
 *  - Second price-path curve for depth layering
 *  - Outer construction circle for framing
 *  - Mobile-responsive: equations hidden on narrow viewports via CSS,
 *    reduced animation complexity
 *  - Memoized: zero re-renders during countdown updates
 */
const BackgroundOverlay = memo(() => {
  // Pre-generated scatter: 28 faint data points suggesting a price cloud
  const scatter = [
    [80, 480], [145, 510], [210, 465], [275, 530], [340, 490], [400, 555],
    [460, 470], [520, 540], [580, 500], [640, 560], [700, 480], [755, 525],
    [820, 490], [880, 545], [935, 510], [970, 480],
    [100, 430], [190, 595], [310, 415], [430, 620], [560, 440], [670, 610],
    [790, 430], [900, 600], [250, 640], [480, 390], [720, 650], [850, 375],
  ];

  return (
    <div className={styles.overlayContainer}>
      <svg
        className={styles.svg}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* Subtle golden radial glow — warm center spotlight */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="35%">
            <stop offset="0%" stopColor="#D4A017" stopOpacity="0.07" />
            <stop offset="60%" stopColor="#D4A017" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#D4A017" stopOpacity="0" />
          </radialGradient>

          {/* Fade mask for price paths — fade out at edges */}
          <linearGradient id="pathFade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="12%" stopColor="white" stopOpacity="1" />
            <stop offset="88%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="edgeFade">
            <rect width="1000" height="1000" fill="url(#pathFade)" />
          </mask>
        </defs>

        {/* ── Center golden glow ────────────────────────────────────────── */}
        <rect width="1000" height="1000" fill="url(#centerGlow)" />

        {/* ── Outer construction ring (framing) ───────────────────────── */}
        <circle
          cx="500" cy="500" r="490"
          className={styles.element}
          style={{ opacity: 0.04 }}
        />

        {/* ── Coordinate axes ──────────────────────────────────────────── */}
        <line x1="0" y1="500" x2="1000" y2="500" className={styles.element} />
        <line x1="500" y1="0" x2="500" y2="1000" className={styles.element} />

        {/* ── Geometric construction circles ───────────────────────────── */}
        <circle
          cx="500" cy="500" r="300"
          className={`${styles.element} ${styles.animatePulse}`}
        />
        <circle
          cx="500" cy="500" r="150"
          className={`${styles.element} ${styles.animatePulse}`}
          style={{ animationDelay: '2s' }}
        />
        <circle
          cx="500" cy="500" r="60"
          className={`${styles.element} ${styles.animatePulse}`}
          style={{ animationDelay: '4s', opacity: 0.08 }}
        />

        {/* ── Primary stochastic price path ────────────────────────────── */}
        <path
          d="M 0 600 Q 100 550 200 620 T 400 580 T 600 650 T 800 600 T 1000 630"
          className={`${styles.element} ${styles.animatePath}`}
          style={{ stroke: '#D4AF37', opacity: 0.26 }}
          mask="url(#edgeFade)"
        />

        {/* ── Secondary price path (deeper, slower draw) ───────────────── */}
        <path
          d="M 0 540 Q 120 580 240 510 T 480 560 T 720 520 T 1000 555"
          className={`${styles.element} ${styles.animatePathSlow}`}
          style={{ stroke: '#D4AF37', opacity: 0.11, strokeWidth: 0.8 }}
          mask="url(#edgeFade)"
        />

        {/* ── Derivative / sigmoid curve ───────────────────────────────── */}
        <path
          d="M 200 800 C 400 800 400 200 600 200"
          className={styles.element}
          style={{ strokeWidth: 1 }}
        />

        {/* ── Tangent line at inflection ───────────────────────────────── */}
        <line x1="300" y1="600" x2="500" y2="400" className={styles.element} />

        {/* ── Arc above tangent ────────────────────────────────────────── */}
        <path
          d="M 400 400 A 100 100 0 0 1 600 400"
          className={`${styles.element} ${styles.animatePulse}`}
          style={{ animationDelay: '1.5s' }}
        />

        {/* ── Data point scatter (price cloud) ─────────────────────────── */}
        <g className={styles.scatterGroup}>
          {scatter.map(([x, y], i) => (
            <circle
              key={i}
              cx={x} cy={y} r="2.2"
              className={styles.scatterDot}
              style={{ animationDelay: `${(i * 0.37) % 5}s` }}
            />
          ))}
        </g>

        {/* ── Scan lines ───────────────────────────────────────────────── */}
        {[
          { y: 120, delay: '0s' },
          { y: 200, delay: '2.7s' },
          { y: 270, delay: '5.1s' },
          { y: 740, delay: '1.4s' },
          { y: 810, delay: '3.8s' },
        ].map(({ y, delay }, i) => (
          <line
            key={i}
            x1="0" y1={y} x2="1000" y2={y}
            className={`${styles.element} ${styles.scanLine}`}
            style={{ animationDelay: delay }}
          />
        ))}

        {/* ── Quant equations ──────────────────────────────────────────── */}
        <text x="130" y="185" className={`${styles.equation} ${styles.equationSpaced} ${styles.eqDesktop}`}>
          ∂V/∂t + ½σ²S²∂²V/∂S² + rS∂V/∂S − rV = 0
        </text>
        <text x="580" y="820" className={`${styles.equation} ${styles.equationSpaced} ${styles.eqDesktop}`}>
          dXt = σtXt dWt + μtXt dt
        </text>
        <text x="120" y="860" className={`${styles.equation} ${styles.equationSpaced} ${styles.eqAll}`}>
          E[Ri] = Rf + βi(E[Rm] − Rf)
        </text>
        <text x="660" y="145" className={`${styles.equation} ${styles.equationSpaced} ${styles.eqDesktop}`}>
          lim(n→∞) (1 + 1/n)ⁿ = e
        </text>
        <text x="700" y="680" className={`${styles.equation} ${styles.equationSpaced} ${styles.eqDesktop}`}>
          Cov(Ri, Rj) / σiσj = ρij
        </text>
      </svg>
    </div>
  );
});

BackgroundOverlay.displayName = 'BackgroundOverlay';

export default BackgroundOverlay;