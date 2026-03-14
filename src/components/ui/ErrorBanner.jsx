
/**
 * Displays an error message in a prominent banner.
 * @param {{ message: string }} props
 */
export default function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <p className="error-banner-message">{message}</p>
    </div>
  );
}
