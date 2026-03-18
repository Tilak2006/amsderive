import styles from './Wordmark.module.css';

/**
 * The AMS-DERIVE wordmark / logo component.
 * @param {{ size?: 'sm'|'md'|'lg' }} props
 */
export default function Wordmark({ size = 'md' }) {
  const sizeClass = size === 'sm' ? styles.wordmarkSm : size === 'lg' ? styles.wordmarkLg : styles.wordmarkMd;
  return (
    <h1 className={`${styles.wordmark} ${sizeClass}`}>
      <span className={styles.wordmarkPrefix}>AMS</span>
      <span className={styles.wordmarkSeparator}>-</span>
      <span className={styles.wordmarkSuffix}>DERIVE</span>
    </h1>
  );
}
