/**
 * Validate that a file's type is in the allowed list.
 * @param {File} file
 * @param {string[]} allowedTypes - e.g. ['image/png', 'image/jpeg', 'application/pdf']
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFileType(file, allowedTypes) {
  if (!file) return { valid: false, error: 'No file provided' };
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not allowed` };
  }
  return { valid: true };
}

/**
 * Validate that a file does not exceed the maximum size.
 * @param {File} file
 * @param {number} maxBytes - Maximum file size in bytes.
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFileSize(file, maxBytes) {
  if (!file) return { valid: false, error: 'No file provided' };
  if (file.size > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File exceeds maximum size of ${maxMB} MB` };
  }
  return { valid: true };
}
