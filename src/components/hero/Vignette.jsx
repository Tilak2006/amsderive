import styles from './Vignette.module.css';

/**
 * Vignette
 * ─────────
 * Pure CSS radial gradient overlay.
 * Transparent at center (where the timer lives) → dark at edges.
 * Creates natural focal gravity without any JS or GPU cost.
 *
 * Mount this BETWEEN WireframeMesh (z:0) and BackgroundOverlay (z:1):
 *
 *   <WireframeMesh />       z-index: 0
 *   <Vignette />            z-index: 1  ← here
 *   <BackgroundOverlay />   z-index: 2
 *   <HeroContent />         z-index: 3
 */
const Vignette = () => {
    return <div className={styles.vignette} />;
};

export default Vignette;