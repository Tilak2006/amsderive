import styles from './SuccessState.module.css';

/**
 * Displays a success confirmation after registration.
 * @param {{ heading?: string, message?: string }} props
 */
export default function SuccessState({
  heading = 'Registration Complete',
  message = 'You have been successfully registered for the contest.',
}) {
  return (
    <div className={styles.successState}>
      <h2 className={styles.successStateHeading}>{heading}</h2>
      <p className={styles.successStateMessage}>{message}</p>
    </div>
  );
}
