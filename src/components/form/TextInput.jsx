
import styles from './TextInput.module.css';

/**
 * A labelled text input field with optional hint and error display.
 * @param {{ label: string, name: string, value: string, onChange: Function, error?: string, placeholder?: string, required?: boolean, hint?: string, type?: string }} props
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
  type = 'text',
}) {
  const describedBy = error
    ? `${name}-error`
    : hint
      ? `${name}-hint`
      : undefined;

  return (
    <div className={styles.textInputField}>
      <label htmlFor={name} className={styles.textInputLabel}>
        {label}
        {required && <span className={styles.textInputRequired}> *</span>}
      </label>
      {hint && (
        <p id={`${name}-hint`} className={styles.textInputHint}>
          {hint}
        </p>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${styles.textInput} ${error ? styles.textInputError : ''}`}
        aria-invalid={!!error}
        aria-describedby={describedBy}
      />
      {error && (
        <p id={`${name}-error`} className={styles.textInputErrorMsg} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
