import { useRef, useState, useEffect } from 'react';

/**
 * File upload with drag-and-drop, image preview, and file info display.
 * @param {{ label: string, name: string, accept: string, onFileSelect: Function, error?: string, file?: File|null, required?: boolean }} props
 */
export default function FileUpload({
  label,
  name,
  accept = '',
  onFileSelect,
  error = '',
  file = null,
  required = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e) {
    const selected = e.target.files?.[0] || null;
    if (selected && onFileSelect) {
      onFileSelect(selected);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0] || null;
    if (dropped && onFileSelect) {
      onFileSelect(dropped);
    }
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const dropzoneClasses = [
    'file-upload-dropzone',
    dragging ? 'file-upload-dropzone-dragging' : '',
    file ? 'file-upload-dropzone-selected' : '',
    error ? 'file-upload-dropzone-error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="file-upload-field">
      <label className="file-upload-label">
        {label}
        {required && <span className="file-upload-required"> *</span>}
      </label>
      <p className="file-upload-subtext">to verify institution</p>
      <button
        type="button"
        className={dropzoneClasses}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        {file ? (
          <div className="file-upload-selected">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="file-upload-preview"
              />
            )}
            <div className="file-upload-info">
              <span className="file-upload-filename">{file.name}</span>
              <span className="file-upload-filesize">{formatFileSize(file.size)}</span>
            </div>
            <span
              className="file-upload-remove"
              role="button"
              tabIndex={0}
              aria-label="Remove file"
              onClick={(e) => {
                e.stopPropagation();
                if (onFileSelect) onFileSelect(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  if (onFileSelect) onFileSelect(null);
                  if (inputRef.current) inputRef.current.value = '';
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        ) : (
          <div className="file-upload-empty">
            <span className="file-upload-prompt">Click to upload or drag and drop</span>
            <span className="file-upload-formats">JPG, PNG or PDF &middot; Max 5MB</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept={accept}
        onChange={handleChange}
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
