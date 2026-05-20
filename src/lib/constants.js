/**
 * Shared constants used across client and server
 */

// Registration opens at April 20, 2026 00:00 IST = April 19, 2026 18:30 UTC
export const REGISTRATION_OPENS = new Date('2026-04-19T18:30:00Z');

// Registration remains open through May 22, 2026 IST
export const REGISTRATION_CLOSES = new Date('2026-05-22T18:30:00Z');

// Hard cap on total registrants
export const MAX_REGISTRATIONS = 10000;

// Registration timeout for API calls
export const TIMEOUT_MS = 50000;
