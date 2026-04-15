import { useRef, useState, useEffect } from 'react';
import styles from './FileUpload.module.css';

/**
 * File upload with drag-and-drop, image preview, and file info display.
 * @param {{ label: string, name: string, accept: string, onFileSelect: Function, error?: string, file?: File|null, required?: boolean, hint?: string, infoTooltip?: string }} props
 */
export default function FileUpload({
  label,
  name,
  accept = '',
  onFileSelect,
  error = '',
  file = null,
  required = false,
  hint = '',
  infoTooltip = '',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
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

  const dropzoneClassArray = [
    styles.fileUploadDropzone,
    dragging ? styles.fileUploadDropzoneDragging : '',
    file ? styles.fileUploadDropzoneSelected : '',
    error ? styles.fileUploadDropzoneError : '',
  ].filter(Boolean);

  return (
    <div className={styles.fileUploadField}>
      <div className={styles.fileUploadHeader}>
        <label className={styles.fileUploadLabel}>
          {label}
          {required && <span className={styles.fileUploadRequired}> *</span>}
        </label>
        {infoTooltip && (
          <div
            className={styles.infoIconWrapper}
            tabIndex="0"
            onClick={() => setShowTooltip((prev) => !prev)}
            onBlur={() => setShowTooltip(false)}
          >
            <span className={styles.infoIcon}>ⓘ</span>
            <div className={`${styles.tooltipText} ${showTooltip ? styles.tooltipVisible : ''}`}>{infoTooltip}</div>
          </div>
        )}
      </div>
      <button
        type="button"
        className={dropzoneClassArray.join(' ')}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        {file ? (
          <div className={styles.fileUploadSelected}>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className={styles.fileUploadPreview}
              />
            )}
            <div className={styles.fileUploadInfo}>
              <span className={styles.fileUploadFileName}>{file.name}</span>
              <span className={styles.fileUploadFileSize}>{formatFileSize(file.size)}</span>
            </div>
            <span
              className={styles.fileUploadRemove}
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
          <div className={styles.fileUploadEmpty}>
            <span className={styles.fileUploadPrompt}>Click to upload or drag and drop</span>
            <span className={styles.fileUploadFormats}>PDF only &middot; Max 300KB</span>
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
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
      {hint && (
        <p className={styles.fileUploadHint}>{hint}</p>
      )}
      {error && (
        <p id={`${name}-error`} className={styles.fileUploadErrorMsg} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
