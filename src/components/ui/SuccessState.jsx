
/**
 * Displays a success confirmation after registration.
 * @param {{ heading?: string, message?: string }} props
 */
export default function SuccessState({
  heading = 'Registration Complete',
  message = 'You have been successfully registered for the contest.',
}) {
  return (
    <div className="success-state">
      <h2 className="success-state-heading">{heading}</h2>
      <p className="success-state-message">{message}</p>
    </div>
  );
}
