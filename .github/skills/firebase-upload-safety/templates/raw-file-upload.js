// Template: Raw File Upload (No Compression)
// Use in: src/firebase/storageService.js or src/components/form/FileUpload.jsx
// Rule 2: Never compress files before upload — always upload raw files

// ❌ WRONG: Do NOT do this
async function uploadFile_WRONG(file) {
  // Compressing changes MIME type and bypasses validation
  const compressed = await compressFile(file); // ← WRONG
  const ref = firebase.storage().ref(`registrants/${compressed.name}`);
  return ref.put(compressed); // ← Bypasses PDF validation
}

// ✓ CORRECT: Always upload raw
async function uploadFile(file, uploadPath) {
  try {
    // Validate file BEFORE upload (client safety)
    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF.');
    }

    // Upload raw file — NO compression
    const ref = firebase.storage().ref(uploadPath);
    const snapshot = await ref.put(file, {
      contentType: 'application/pdf', // ← Explicit MIME type
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Validate returned URL before using
    const downloadUrl = await snapshot.ref.getDownloadURL();
    if (!downloadUrl.startsWith('https://')) {
      throw new Error('Invalid storage URL returned.');
    }

    return downloadUrl;

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// In form component, ensure NO compression:
export function FileUploadForm() {
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    // ✓ Pass file directly — raw
    uploadFile(file, `registrants/${userId}/resume.pdf`);
    
    // ❌ Never do this:
    // const compressed = compress(file);
    // uploadFile(compressed, ...);
  };

  return (
    <input
      type="file"
      accept=".pdf"
      onChange={handleFileSelect}
      // Disable browser-level compression (if any)
    />
  );
}
