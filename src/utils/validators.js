/**
 * Validate a participant name.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateName(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'Name is required' };
  if (trimmed.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  if (trimmed.length > 100) return { valid: false, error: 'Name must be under 100 characters' };
  return { valid: true };
}

/**
 * Validate an institution name.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateInstitution(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'Institution is required' };
  if (trimmed.length < 2) return { valid: false, error: 'Institution must be at least 2 characters' };
  if (trimmed.length > 150) return { valid: false, error: 'Institution must be under 150 characters' };
  return { valid: true };
}

/**
 * Validate a competitive programming handle.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateHandle(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'Handle is required' };
  if (trimmed.length < 2) return { valid: false, error: 'Handle must be at least 2 characters' };
  if (trimmed.length > 50) return { valid: false, error: 'Handle must be under 50 characters' };
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return { valid: false, error: 'Handle can only contain letters, numbers, underscores, dots, and hyphens' };
  }
  return { valid: true };
}
