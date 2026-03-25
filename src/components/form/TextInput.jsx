
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
      {hint && (
        <p id={`${name}-hint`} className={styles.textInputHint}>
          {hint}
        </p>
      )}
      <div style={prefix ? { display: 'flex', alignItems: 'center' } : {}}>
        {prefix && (
          <span style={{
            padding: '0 0.875rem',
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRight: 'none',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b6560',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            borderTopLeftRadius: '2px',
            borderBottomLeftRadius: '2px',
          }}>{prefix}</span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${styles.textInput} ${error ? styles.textInputError : ''}`}
          style={prefix ? { borderLeft: 'none', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, flex: 1, width: '100%' } : { width: '100%' }}
          aria-invalid={!!error}
          aria-describedby={describedBy}
        />
      </div>
      {error && (
        <p id={`${name}-error`} className={styles.textInputErrorMsg} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
