# Firebase Upload Safety: Audit Checklist

Use this checklist to manually audit the 4 target files against the 6 security rules.

## File: `src/firebase/storageService.js`

- [ ] **Rule 1 (Rate Limit)**: No direct file upload calls; rate limit is enforced by caller
- [ ] **Rule 2 (No Compression)**: No `compressFile()`, `gzip()`, or similar compression calls
- [ ] **Rule 3 (Admin 404)**: N/A for this file
- [ ] **Rule 5 (URL Validation)**: All returned storage URLs validated before passing to caller
- [ ] **Rule 6 (IP Fingerprint)**: N/A for this file
- [ ] **Additional**: Confirm Storage Rules match server-side constraints (PDF, 400KB max)

## File: `src/pages/register.jsx`

- [ ] **Rule 1 (Rate Limit)**: `checkUploadRateLimit()` called BEFORE `handleFileUpload()` or `uploadFile()`
- [ ] **Rule 2 (No Compression)**: No compression calls before passing file to storage service
- [ ] **Rule 3 (Admin 404)**: N/A for this file
- [ ] **Rule 4 (Email Lowercase)**: All email comparisons call `.toLowerCase()` on both sides
- [ ] **Rule 5 (URL Validation)**: N/A for this file (storage service handles)
- [ ] **Rule 6 (IP Fingerprint)**: N/A for this file
- [ ] **Additional**: Confirm form does not pre-compress files

## File: `src/components/form/FileUpload.jsx`

- [ ] **Rule 1 (Rate Limit)**: Rate limit check happens before `onChange` or `onSubmit` triggers upload
- [ ] **Rule 2 (No Compression)**: No compression utilities imported or called
- [ ] **Rule 3 (Admin 404)**: N/A for this file
- [ ] **Rule 4 (Email Lowercase)**: N/A for this file
- [ ] **Rule 5 (URL Validation)**: N/A for this file
- [ ] **Rule 6 (IP Fingerprint)**: N/A for this file
- [ ] **Additional**: File validation happens before upload attempt (magic bytes, MIME type)

## File: `src/lib/rateLimiter.js` (or equivalent)

- [ ] **Rule 1 (Rate Limit)**: Exports function that can be called before file operations
- [ ] **Rule 2 (No Compression)**: N/A for this file
- [ ] **Rule 3 (Admin 404)**: N/A for this file
- [ ] **Rule 4 (Email Lowercase)**: N/A for this file
- [ ] **Rule 5 (URL Validation)**: N/A for this file
- [ ] **Rule 6 (IP Fingerprint)**: IP rate limiting includes `User-Agent` header in fingerprint (not just IP)
- [ ] **Additional**: Rate limit persistence (Redis, Firestore, memory) is secure and consistent

## Summary

How many rules are:
- **Fully implemented**: ____/6
- **Partially implemented**: ____/6
- **Missing**: ____/6

High-risk violations (CRITICAL/HIGH): ____
Identified violations: ________________

Next step: Use templates/ to fix violations, then re-run validation script.
