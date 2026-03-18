---
name: register-upload-validation
description: "Use when: implementing or modifying file upload logic in registration. Enforce rate limit checks before type/size validation and storage upload. Establishes client-side validation chain for Resume and ID Card uploads."
applyTo: ["src/pages/register.jsx", "src/components/form/RegistrationForm.jsx", "src/components/form/FileUpload.jsx"]
---

# Registration Upload Validation Pattern

## Core Rule
**Rate limit check must always happen BEFORE file upload.** Establish a strict validation chain on the client before any Firebase Storage operation:

```
Rate Limit Check → Type Validation → Size Check → Upload to Storage
```

## Implementation Order

1. **Rate Limit Check** (run first)
   - Check user's upload attempt count/throttle state
   - Return early with user-facing error if rate limit exceeded
   - Example: "Too many uploads. Please try again in 5 minutes."

2. **Type Validation**
   - Resume: must be `application/pdf`
   - ID Card: must be `application/pdf`
   - Error: "Resume must be a PDF." / "ID Card must be a PDF."

3. **Size Validation**
   - Resume: max 400KB (400 * 1024 bytes)
   - ID Card: max 100KB (100 * 1024 bytes)
   - Error: "Resume must be under 400KB." / "ID card must be under 100KB."

4. **Upload to Storage**
   - Only proceed if all checks pass
   - Storage rules will enforce same constraints server-side (defense-in-depth)

## Code Pattern

```javascript
// File upload handler with rate-limit-first validation
async function handleFileUpload(file, fileType) {
  try {
    // STEP 1: Rate limit check (FIRST)
    const isRateLimited = await checkUploadRateLimit(userId);
    if (isRateLimited) {
      setError("Too many uploads. Please try again in 5 minutes.");
      return;
    }

    // STEP 2: Type validation
    if (file.type !== 'application/pdf') {
      setError(`${fileType} must be a PDF.`);
      return;
    }

    // STEP 3: Size validation
    const maxSize = fileType === 'resume' ? 400 * 1024 : 100 * 1024;
    if (file.size > maxSize) {
      const maxMb = fileType === 'resume' ? '400KB' : '100KB';
      setError(`${fileType} must be under ${maxMb}.`);
      return;
    }

    // STEP 4: Upload to storage
    const uploadPath = `registrants/${userId}/${fileType}-${Date.now()}.pdf`;
    await storageService.uploadFile(file, uploadPath);
    
  } catch (error) {
    setError("Upload failed. Please try again.");
  }
}
```

## Rate Limit Implementation
- Use `rateLimit.js` utility for consistent rate limiting across upload endpoints
- Store rate limit state in component or hook (e.g., `useUploadRateLimit()`)
- Default: 3 uploads per 5 minutes per user
- Track by user ID or IP hash if anonymous

## Error Handling
- Show errors immediately after each validation step
- Use consistent error banner styling (ErrorBanner component with gold/red scheme)
- Clear errors on new file selection
- Do NOT retry rate-limited requests automatically

## Security Dependencies

This instruction works in conjunction with **file-safety.instructions.md**, which enforces:
- No file compression before upload
- MIME type detection with magic byte verification
- Anti-tampering measures at client and server layers

Ensure both patterns are applied together for defense-in-depth.

## Related Files
- Storage Rules: `storage-rules.txt` (server-side enforcement)
- File Safety: `.github/instructions/file-safety.instructions.md`
- Utilities: `src/utils/rateLimit.js`, `src/utils/fileValidation.js`, `src/utils/fileCompression.js`
- Services: `src/firebase/storageService.js`
