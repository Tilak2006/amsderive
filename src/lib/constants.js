/**
 * Shared constants used across client and server
 */

// Registration opens at April 20, 2026 00:00 IST = April 19, 2026 18:30 UTC
// TESTING: Set to past date to allow registration immediately for team testing
export const REGISTRATION_OPENS = new Date('2026-04-01T00:00:00Z');

// Registration timeout for API calls
export const TIMEOUT_MS = 50000;
