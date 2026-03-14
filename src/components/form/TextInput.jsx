
/**
 * A labelled text input field with optional error display.
 * @param {{ label: string, name: string, value: string, onChange: Function, error?: string, placeholder?: string, required?: boolean }} props
 */
export default function TextInput({
  label,
  name,
  value = '',
  onChange,
  error = '',
  placeholder = '',
  required = false,
}) {
  return (
    <div className="text-input-field">
      <label htmlFor={name} className="text-input-label">
        {label}
        {required && <span className="text-input-required"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`text-input ${error ? 'text-input-error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="text-input-error-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
