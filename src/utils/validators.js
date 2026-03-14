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
  if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters and spaces' };
  }
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
  if (trimmed.length < 3) return { valid: false, error: 'Institution must be at least 3 characters' };
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

/**
 * Validate a Codeforces handle.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCodeforcesHandle(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'Codeforces handle is required' };
  if (trimmed.length > 24) return { valid: false, error: 'Codeforces handle must be under 24 characters' };
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Codeforces handle can only contain letters, numbers, underscores, and hyphens' };
  }
  return { valid: true };
}

/**
 * Validate a CodeChef handle.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCodechefHandle(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'CodeChef handle is required' };
  if (trimmed.length > 24) return { valid: false, error: 'CodeChef handle must be under 24 characters' };
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'CodeChef handle can only contain letters, numbers, underscores, and hyphens' };
  }
  return { valid: true };
}
