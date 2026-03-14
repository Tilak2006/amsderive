import { useRef } from 'react';

/**
 * A file upload input with drag-and-drop styling.
 * @param {{ label: string, name: string, accept: string, onChange: Function, error?: string, fileName?: string, required?: boolean }} props
 */
export default function FileUpload({
  label,
  name,
  accept = '',
  onChange,
  error = '',
  fileName = '',
  required = false,
}) {
  const inputRef = useRef(null);

  function handleClick() {
    inputRef.current?.click();
  }

  return (
    <div className="file-upload-field">
      <label className="file-upload-label">
        {label}
        {required && <span className="file-upload-required"> *</span>}
      </label>
      <button
        type="button"
        className={`file-upload-dropzone ${error ? 'file-upload-dropzone-error' : ''}`}
        onClick={handleClick}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <span className="file-upload-prompt">
          {fileName || 'Click to select a file'}
        </span>
      </button>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept={accept}
        onChange={onChange}
        className="file-upload-hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      {error && (
        <p id={`${name}-error`} className="file-upload-error-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
