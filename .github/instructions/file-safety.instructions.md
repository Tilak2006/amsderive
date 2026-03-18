---
name: file-safety
description: "Use when: implementing file uploads, storage services, or file validation. Enforce no-compression policy, strict MIME type detection, and anti-tampering measures to prevent security bypass attacks."
applyTo: ["src/firebase/storageService.js", "src/utils/fileValidation.js", "src/utils/fileCompression.js", "src/pages/api/**/*.js"]
---

# File Upload Safety Pattern

## Core Rules

1. **Never compress files before upload.** Always upload raw files.
   - File compression silently changes MIME type to `application/gzip`
   - This bypasses PDF validation checks (both client and storage rules)
   - Attacker can upload malicious file as `.gz`, bypass validation, repackage on server

2. **Strict MIME type detection** at multiple layers
   - Validate using `file.type` (browser API)
   - Validate using file magic bytes (server-side)
   - Never trust filename extension alone

3. **Anti-tampering measures**
   - Reject files that claim to be one type but have different structure
   - Reject archives or compressed formats in PDF upload flows
   - Check file headers/magic bytes before accepting

## Implementation

### Client-Side: Prevent Compression

```javascript
// DO NOT DO THIS:
const compressedFile = await compressFile(resumeFile); // ❌ WRONG
await uploadFile(compressedFile, 'resume');

// DO THIS INSTEAD:
await uploadFile(resumeFile, 'resume'); // ✓ CORRECT - raw file only
```

**Disable compression utilities** in upload forms:
- Remove calls to `compressFile()` or `compress-file-library`
- Use raw `FormData` with files as-is
- If file size is an issue, enforce size limits instead (400KB for resume, 100KB for ID)

### Client-Side: MIME Type Validation

```javascript
function validatePdfFile(file) {
  // Check browser MIME type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'File must be a PDF.' };
  }

  // Read first 4 bytes to check magic number for PDF
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result).subarray(0, 4);
      const header = arr.reduce((a, b) => a + String.fromCharCode(b), '');
      
      // PDF files start with %PDF
      if (header === '%PDF') {
        resolve({ valid: true });
      } else {
        resolve({ valid: false, error: 'File header does not match PDF format.' });
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}
```

### Server-Side: Storage Rules Enforcement

```
match /registrants/{userId}/{fileName} {
  // Reject compressed/archive files
  allow write: if request.resource.contentType.matches('application/pdf')
               && request.resource.contentType != 'application/gzip'
               && request.resource.contentType != 'application/zip'
               && request.resource.contentType != 'application/x-rar-compressed'
               && request.resource.size < 400 * 1024;
  allow read: if false;
}
```

### Server-Side: API Validation (if applicable)

```javascript
// In API endpoint that receives file uploads
async function validateUploadedFile(file) {
  const MAGIC_BYTES = {
    pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
    zip: [0x50, 0x4b, 0x03, 0x04],  // PK..
    gzip: [0x1f, 0x8b],             // ..
  };

  const buffer = await file.arrayBuffer();
  const view = new Uint8Array(buffer);

  // Check if file is actually a PDF
  if (JSON.stringify(view.slice(0, 4)) !== JSON.stringify(MAGIC_BYTES.pdf)) {
    throw new Error('File is not a valid PDF.');
  }

  // Reject archives
  if (JSON.stringify(view.slice(0, 2)) === JSON.stringify(MAGIC_BYTES.gzip)) {
    throw new Error('Compressed files are not allowed.');
  }
  if (JSON.stringify(view.slice(0, 4)) === JSON.stringify(MAGIC_BYTES.zip)) {
    throw new Error('Compressed files are not allowed.');
  }
}
```

## Complete Validation Chain

For registration file uploads, enforce this sequence:

```
1. Rate Limit Check (see register.instructions.md)
2. Prevent Compression (no compress() calls)
3. MIME Type Check (browser type property)
4. Magic Byte Verification (file header inspection)
5. Size Validation (400KB resume, 100KB ID)
6. Upload to Storage (Storage rules enforce server-side)
```

## Why This Matters

**Attack Scenario:**
1. Attacker crafts malicious PDF with embedded script
2. Attacker compresses it: `malicious.pdf` → `malicious.pdf.gz`
3. Browser reads MIME type as `application/gzip`
4. Client validation checks: `if (type === 'application/pdf')` → **FAILS** ✓
5. BUT if client code calls `compressFile()` on ANY file...
6. Result: `application/gzip` → recompressed again
7. Storage rule sees `application/gzip` → allows it (whoops!)
8. Server decompresses and gets the malicious PDF

**Solution:** Never compress in the first place. Always upload raw. Reject compressed files at every layer.

## Related Files
- Validation: `src/utils/fileValidation.js`
- Storage Service: `src/firebase/storageService.js`
- Compression Utilities: `src/utils/fileCompression.js` (audit for removal)
- Storage Rules: `storage-rules.txt`
