
/**
 * The AMS-DERIVE wordmark / logo component.
 * @param {{ size?: 'sm'|'md'|'lg' }} props
 */
export default function Wordmark({ size = 'md' }) {
  return (
    <h1 className={`wordmark wordmark-${size}`}>
      <span className="wordmark-prefix">AMS</span>
      <span className="wordmark-separator">-</span>
      <span className="wordmark-suffix">DERIVE</span>
    </h1>
  );
}
