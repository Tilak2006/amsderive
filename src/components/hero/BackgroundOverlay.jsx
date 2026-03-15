import styles from './BackgroundOverlay.module.css';

/**
 * SVG decorative overlay.
 * Changes applied:
 *  - animateFloat removed from derivative curve (was a visible glitch)
 *  - Equation positions moved inward (away from UI chrome corners)
 *  - Stochastic price path opacity raised to be actually visible
 *  - Three faint horizontal scan lines added to upper region for texture
 *  - Equation letter-spacing added via className (see CSS)
 */
const BackgroundOverlay = () => {
  return (
    <div className={styles.overlayContainer}>
      <svg
        className={styles.svg}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── Coordinate Axes ─────────────────────────────────────────── */}
        <line x1="0" y1="500" x2="1000" y2="500" className={styles.element} />
        <line x1="500" y1="0" x2="500" y2="1000" className={styles.element} />

        {/* ── Geometric Construction Arcs ──────────────────────────────── */}
        <circle
          cx="500" cy="500" r="300"
          className={`${styles.element} ${styles.animatePulse}`}
        />
        <circle
          cx="500" cy="500" r="150"
          className={`${styles.element} ${styles.animatePulse}`}
          style={{ animationDelay: '2s' }}
        />

        {/* ── Stochastic Price Path ─────────────────────────────────────
            FIX: opacity raised to 0.22 (was effectively ~0.04 after
            container opacity multiplication — invisible) */}
        <path
          d="M 0 600 Q 100 550 200 620 T 400 580 T 600 650 T 800 600 T 1000 630"
          className={`${styles.element} ${styles.animatePath}`}
          style={{ stroke: '#D4AF37', opacity: 0.22 }}
        />

        {/* ── Derivative Curve ──────────────────────────────────────────
            FIX: animateFloat removed — translateX/Y on an SVG path
            inside a 1000×1000 viewBox reads as a jitter glitch, not motion */}
        <path
          d="M 200 800 C 400 800 400 200 600 200"
          className={styles.element}
          style={{ strokeWidth: 1 }}
        />

        {/* ── Tangent Line ──────────────────────────────────────────────── */}
        <line x1="300" y1="600" x2="500" y2="400" className={styles.element} />

        {/* ── Circular Arc ─────────────────────────────────────────────── */}
        <path
          d="M 400 400 A 100 100 0 0 1 600 400"
          className={`${styles.element} ${styles.animatePulse}`}
        />

        {/* ── Scan Lines (upper region texture) ────────────────────────
            Three 1px horizontal lines in the empty upper 40% of the
            viewport — give the dark area texture without competing
            with the title text. Animate slowly upward. */}
        <line
          x1="0" y1="120" x2="1000" y2="120"
          className={`${styles.element} ${styles.scanLine}`}
          style={{ animationDelay: '0s' }}
        />
        <line
          x1="0" y1="200" x2="1000" y2="200"
          className={`${styles.element} ${styles.scanLine}`}
          style={{ animationDelay: '2.7s' }}
        />
        <line
          x1="0" y1="270" x2="1000" y2="270"
          className={`${styles.element} ${styles.scanLine}`}
          style={{ animationDelay: '5.1s' }}
        />

        {/* ── Faint Equations ───────────────────────────────────────────
            FIX: moved inward from corners to avoid overlapping UI chrome
            (N logo bottom-left, AMS DERIVE top-right).
            FIX: className added for letter-spacing. */}
        <text x="130" y="185" className={`${styles.equation} ${styles.equationSpaced}`}>
          ∂V/∂t + ½σ²S²∂²V/∂S² + rS∂V/∂S − rV = 0
        </text>
        <text x="580" y="820" className={`${styles.equation} ${styles.equationSpaced}`}>
          dXt = σtXt dWt + μtXt dt
        </text>
        <text x="120" y="860" className={`${styles.equation} ${styles.equationSpaced}`}>
          E[Ri] = Rf + βi(E[Rm] − Rf)
        </text>
        <text x="660" y="145" className={`${styles.equation} ${styles.equationSpaced}`}>
          lim(n→∞) (1 + 1/n)ⁿ = e
        </text>
      </svg>
    </div>
  );
};

export default BackgroundOverlay;