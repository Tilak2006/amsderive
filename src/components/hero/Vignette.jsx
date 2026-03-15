import styles from './Vignette.module.css';

/**
 * Vignette — cinematic edition.
 *
 * Three-layer depth system:
 *   1. Primary radial vignette   — transparent center → rich dark edges
 *   2. Chromatic fringe          — very subtle warm tint at bottom edge
 *   3. Top/bottom linear bars    — letterbox gravity
 *
 * Mount order (z-indices must match parent):
 *
 *   <WireframeMesh />       z-index: 0
 *   <Vignette />            z-index: 1
 *   <BackgroundOverlay />   z-index: 2
 *   <HeroContent />         z-index: 3
 */
const Vignette = () => <div className={styles.vignette} />;

export default Vignette;