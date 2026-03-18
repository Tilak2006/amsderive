# Security Audit Sign-Off Checklist

Complete this checklist before marking the Firebase upload safety implementation as production-ready.

## Code Review Checklist

### Rate Limiting (Rule 1)
- [ ] `checkUploadRateLimit()` is called before EVERY `uploadFile()` invocation
- [ ] Rate limit check returns boolean or throws error; upload branch verifies success
- [ ] Rate limit state persists across requests (Redis/Firestore, not memory)
- [ ] Rate limit reset logic is configurable (e.g., 5 min window, 3 uploads/window)
- [ ] Edge case: Concurrent uploads from same user are throttled

### File Handling (Rule 2)
- [ ] Zero compression calls in upload codepath
- [ ] File passed raw to Storage service: `uploadFile(file, path)` not `uploadFile(compress(file), path)`
- [ ] Storage Rules reject `application/gzip` and other archives
- [ ] Client-side magic byte validation detects `%PDF` header
- [ ] Error message for compressed files is user-friendly: "Files must be uncompressed"

### Admin Endpoints (Rule 3)
- [ ] Admin config endpoints return 404 when API key is missing/empty
- [ ] No 500 errors from missing configuration
- [ ] Test case: Hit endpoint without API key → 404 (not 500)
- [ ] Logs do NOT expose API key or configuration details on 404

### Email Deduplication (Rule 4)
- [ ] All email lookups normalize: `email.toLowerCase()`
- [ ] Database query also lowercases (if stored): `db.where('emailLower', '==', email.toLowerCase())`
- [ ] Duplicate rejection is case-insensitive: user can't register "john@example.com" twice as "John@Example.com"
- [ ] Error message: "Email already registered"

### Storage URL Validation (Rule 5)
- [ ] All storage URLs returned from Firebase are validated before storing in Firestore
- [ ] Validation checks: URL starts with `https://`, contains bucket name, is properly formatted
- [ ] Invalid URLs raise error; upload is rejected
- [ ] Stored Firestore URLs can be directly used to fetch files (no path traversal risks)

### IP Fingerprinting (Rule 6)
- [ ] Rate limiter includes `User-Agent` header in fingerprint: `hash(ip + user-agent)`
- [ ] Not just IP alone: `hash(ip)` ← BAD
- [ ] IP extracted correctly: `req.ip` or `x-forwarded-for` (proxy-aware)
- [ ] User-Agent from `req.headers['user-agent']`
- [ ] Fingerprint consistent: same user/device gets same fingerprint across requests

## Edge Case Testing

- [ ] **Duplicate email**: Register with "john@example.com", then "John@Example.com" → rejected
- [ ] **Rate limit boundary**: 3 uploads allowed in 5 min, 4th blocked with error
- [ ] **Compression bypass**: User manually gzips a PDF, sends as `.gz` → rejected
- [ ] **Malformed URL**: Storage returns invalid path → error, not stored in Firestore
- [ ] **Admin without key**: Hit /api/admin/* without API_KEY env var → 404
- [ ] **User-Agent variation**: Same IP, different User-Agents → separate rate limit buckets

## Integration Testing

- [ ] Full registration flow: Rate limit → File upload → Email dedup → Success
- [ ] Failure flow: Rate limit exceeded → User sees error → Can retry after timeout
- [ ] Storage Rules enforce same constraints server-side (if client validation bypassed)
- [ ] Error messages are actionable and non-technical

## Security Review Sign-Off

**Reviewed by**: _________________  
**Date**: _________________  
**Status**: ☐ PASS ☐ PASS WITH EXCEPTIONS ☐ FAIL

**Exceptions** (if any):
_________________________________________________________________

**Notes**:
_________________________________________________________________

---

This implementation satisfies all 6 Firebase upload safety rules for AMS DERIVE registration.
