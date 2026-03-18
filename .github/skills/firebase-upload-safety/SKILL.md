---
name: firebase-upload-safety
description: "Audit and implement Firebase Storage upload safety for AMS DERIVE registration. Enforce rate limiting, no file compression, case-insensitive email deduplication, storage URL validation, and IP fingerprinting. Use when: reviewing registration upload flow, implementing file upload handlers, or securing registration endpoints."
argument-hint: "audit / implement / both (default: both)"
user-invocable: true
---

# Firebase Upload Safety for AMS DERIVE

## When to Use

- **Audit** existing registration upload code against 6 core security rules
- **Implement** fixes across registration and storage files
- **Verify** that all rules are applied and security audit passes

## The 6 Core Rules

1. **Rate limit check MUST happen before any file upload**
2. **Never compress files before upload** — raw files only
3. **Admin endpoints return 404** (not 500) when key is not configured
4. **Email duplicate checks must be case-insensitive** (normalize to lowercase)
5. **Validate storage URLs before storing to Firestore**
6. **IP rate limiting must include user-agent fingerprint**, not IP alone

## Affected Files

- `src/firebase/storageService.js`
- `src/pages/register.jsx`
- `src/components/form/FileUpload.jsx`
- `src/lib/rateLimiter.js` (or wherever rate limit logic lives)

## Procedure

### Phase 1: Audit Current Code (15-20 min)

Use the [audit checklist](./references/audit-checklist.md) to review all 4 files:

1. Check each file against the 6 rules
2. Log findings: which rules pass, which fail, which are missing
3. Identify high-risk violations (e.g., compression in upload flow)

Run the [validation script](./scripts/validate-upload-safety.js) to scan for common issues:
```bash
node .github/skills/firebase-upload-safety/scripts/validate-upload-safety.js
```

### Phase 2: Implement Fixes (30-45 min)

For each failing rule, follow the [implementation templates](./templates/):

1. **Rate Limit Check** → use `rate-limit-first.js` template
2. **No Compression** → use `raw-file-upload.js` template
3. **Admin 404 Response** → use `admin-404-response.js` template
4. **Case-Insensitive Email** → use `case-insensitive-email.js` template
5. **URL Validation** → use `validate-storage-urls.js` template
6. **IP + User-Agent** → use `ip-fingerprinting.js` template

Apply each template to the corresponding code section.

### Phase 3: Security Audit Sign-Off (10 min)

When all 6 rules are implemented:

1. ✓ Review [security audit checklist](./references/security-audit-checklist.md)
2. ✓ Verify no compression calls in upload flow
3. ✓ Confirm rate limit runs before any file operation
4. ✓ Check Storage Rules match URL validation logic
5. ✓ Test edge cases: duplicate emails, malformed URLs, rate limit boundaries
6. ✓ Document sign-off in code or commit message

## Quick Reference

| Rule | File(s) | Priority |
|------|---------|----------|
| Rate limit first | `register.jsx`, `FileUpload.jsx` | **CRITICAL** |
| No compression | `storageService.js`, `FileUpload.jsx` | **CRITICAL** |
| Admin 404 | `pages/api/admin/*.js` | HIGH |
| Email lowercase | `register.jsx`, backend validators | HIGH |
| URL validation | `storageService.js` | HIGH |
| IP fingerprint | `rateLimiter.js` | MEDIUM |

## Success Criteria

Task is complete when:
- [ ] All 6 rules are implemented in target files
- [ ] `validate-upload-safety.js` script reports zero violations
- [ ] All edge cases tested (compression, duplicates, rate limits)
- [ ] Security audit checklist signed off
- [ ] Code reviewed by team lead (security-critical features)

## Related Skills & Instructions

- `.github/instructions/register.instructions.md` - Rate limit pattern
- `.github/instructions/file-safety.instructions.md` - Compression and anti-tampering
- Storage Rules: `storage-rules.txt` (server-side enforcement)
