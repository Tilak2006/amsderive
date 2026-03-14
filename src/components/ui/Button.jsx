
/**
 * Primary action button with accent styling.
 * @param {{ children: React.ReactNode, type?: string, disabled?: boolean, onClick?: Function, variant?: 'primary'|'secondary' }} props
 */
export default function Button({
  children,
  type = 'button',
  disabled = false,
  onClick,
  variant = 'primary',
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}
