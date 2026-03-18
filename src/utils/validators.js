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

/**
 * Validate an email address.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmail(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true };
}

/**
 * Validate a phone number.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePhone(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'Phone number is required' };
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return { valid: false, error: 'Phone number must be at least 10 digits' };
  }
  return { valid: true };
}

/**
 * Validate a university/institution name.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUniversity(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'University is required' };
  if (trimmed.length < 3) return { valid: false, error: 'University name must be at least 3 characters' };
  if (trimmed.length > 200) return { valid: false, error: 'University name must be under 200 characters' };
  return { valid: true };
}

/**
 * Validate a Codeforces handle (alphanumeric + underscore only).
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCodeforcesHandleFormat(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, error: 'Codeforces handle is required' };
  if (trimmed.length > 24) return { valid: false, error: 'Codeforces handle must be under 24 characters' };
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Codeforces handle can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

/**
 * Validate CodeChef handle (optional, but if provided must be valid).
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCodechefHandleOptional(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: true }; // Optional field
  if (trimmed.length > 24) return { valid: false, error: 'CodeChef handle must be under 24 characters' };
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'CodeChef handle can only contain letters, numbers, underscores, and hyphens' };
  }
  return { valid: true };
}

/**
 * Validate a LinkedIn profile URL (optional, but if provided must be valid).
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateLinkedInOptional(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: true }; // Optional field
  
  // Accept various LinkedIn URL formats
  const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+\/?$/i;
  if (!linkedinRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/yourprofile)' };
  }
  return { valid: true };
}

/**
 * Validate a GitHub profile URL (optional, but if provided must be valid).
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateGitHubOptional(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: true }; // Optional field
  
  // Accept various GitHub URL formats
  const githubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/i;
  if (!githubRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid GitHub profile URL (e.g., github.com/yourprofile)' };
  }
  return { valid: true };
}
