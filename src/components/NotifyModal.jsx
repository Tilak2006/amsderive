import { useState, useRef, useEffect } from 'react';
import styles from './NotifyModal.module.css';

const NotifyModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);
  const abortRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSuccess(false);
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  // Close on click outside
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Abort fetch and close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        abortRef.current?.abort();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      abortRef.current?.abort();
    };
  }, [isOpen, onClose]);

  // Abort fetch when modal closes
  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
    }
  }, [isOpen]);

  // Basic email validation
  const isValidEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    abortRef.current = new AbortController();
    setLoading(true);

    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to subscribe. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} ref={modalRef} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {success ? (
          <div className={styles.successContainer}>
            <h2 className={styles.successTitle}>Success!</h2>
            <p className={styles.successMessage}>
              You'll be notified when registrations open
            </p>
            <button
              type="button"
              className={styles.doneBtn}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className={styles.title}>Get Notified</h2>
            <p className={styles.subtitle}>
              We'll send you an email when registrations open
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                disabled={loading}
              />

              {error && <p className={styles.errorText}>{error}</p>}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? 'Subscribing...' : 'Notify Me'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default NotifyModal;
