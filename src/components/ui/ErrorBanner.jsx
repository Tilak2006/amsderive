import styles from './ErrorBanner.module.css';

/**
 * Displays an error message in a prominent banner.
 * @param {{ message: string }} props
 */
export default function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className={styles.errorBanner} role="alert">
      <p className={styles.errorBannerMessage}>{message}</p>
    </div>
  );
}
