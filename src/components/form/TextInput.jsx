import styles from './TextInput.module.css';

/**
 * A labelled text input field with optional hint and error display.
 * @param {{ label: string, name: string, value: string, onChange: Function, error?: string, placeholder?: string, required?: boolean, hint?: string, type?: string, prefix?: string }} props
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
  prefix,
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
      <div className={prefix ? styles.textInputWrapper : undefined}>
        {prefix && (
          <span className={styles.textInputPrefix}>{prefix}</span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${styles.textInput} ${error ? styles.textInputError : ''} ${prefix ? styles.textInputWithPrefix : ''}`}
          aria-invalid={!!error}
          aria-describedby={describedBy}
        />
      </div>
      {hint && (
        <p id={`${name}-hint`} className={styles.textInputHint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className={styles.textInputErrorMsg} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
