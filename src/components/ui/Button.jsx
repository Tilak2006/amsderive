import styles from './Button.module.css';

/**
 * Button component with primary, secondary, and ghost variants.
 * @param {{ children: React.ReactNode, type?: string, disabled?: boolean, onClick?: Function, variant?: 'primary'|'secondary'|'ghost' }} props
 */
export default function Button({
  children,
  type = 'button',
  disabled = false,
  onClick,
  variant = 'primary',
}) {
  const variantClass = variant === 'primary' ? 'btnPrimary' : variant === 'secondary' ? 'btnSecondary' : 'btnGhost';
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.btn} ${styles[variantClass]}`}
    >
      {children}
    </button>
  );
}
