
/**
 * A labelled text input field with optional hint and error display.
 * @param {{ label: string, name: string, value: string, onChange: Function, error?: string, placeholder?: string, required?: boolean, hint?: string }} props
 */
export default function TextInput({
  label,
  name,
  value = '',
  onChange,
  error = '',
  placeholder = '',
  required = false,
  hint = '',
}) {
  const describedBy = error
    ? `${name}-error`
    : hint
      ? `${name}-hint`
      : undefined;

  return (
    <div className="text-input-field">
      <label htmlFor={name} className="text-input-label">
        {label}
        {required && <span className="text-input-required"> *</span>}
      </label>
      {hint && (
        <p id={`${name}-hint`} className="text-input-hint">
          {hint}
        </p>
      )}
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`text-input ${error ? 'text-input-error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={describedBy}
      />
      {error && (
        <p id={`${name}-error`} className="text-input-error-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
