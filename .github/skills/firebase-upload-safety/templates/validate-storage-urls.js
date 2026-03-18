// Template: Validate Storage URLs Before Firestore
// Use in: src/firebase/storageService.js
// Rule 5: Validate storage URLs before storing to Firestore

async function uploadFile(file, uploadPath) {
  try {
    // Upload file first
    const ref = firebase.storage().ref(uploadPath);
    const snapshot = await ref.put(file, {
      contentType: 'application/pdf',
    });

    // Get download URL
    const downloadUrl = await snapshot.ref.getDownloadURL();

    // ✓ VALIDATE URL before returning/storing
    validateStorageUrl(downloadUrl);

    // Safe to return and store in Firestore
    return downloadUrl;

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Validate that storage URL is safe to store in Firestore
 * @param {string} url - Storage download URL from Firebase
 * @throws {Error} if URL is invalid or malicious
 */
function validateStorageUrl(url) {
  // Must be HTTPS
  if (!url.startsWith('https://')) {
    throw new Error('Storage URL must use HTTPS.');
  }

  // Must contain Firebase storage domain
  const validDomains = [
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
  ];
  
  if (!validDomains.some(domain => url.includes(domain))) {
    throw new Error('Invalid storage URL domain.');
  }

  // Must contain bucket name (no path traversal)
  if (url.includes('..') || url.includes('\\')) {
    throw new Error('URL contains invalid path characters.');
  }

  // Optional: URL must contain expected bucket
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'amsderive.appspot.com';
  if (!url.includes(bucketName)) {
    console.warn('Storage URL bucket mismatch; verify bucket configuration');
    // Could throw, or just warn depending on policy
  }

  // URL must be reasonably short (not excessive query params)
  if (url.length > 2000) {
    throw new Error('Storage URL exceeds maximum length.');
  }

  return true; // Valid
}

// When storing in Firestore
async function updateUserFile(userId, fileType, storageUrl) {
  try {
    // validateStorageUrl is called by uploadFile before this point,
    // so we can trust the URL here
    
    await db.collection('users').doc(userId).update({
      [`${fileType}DownloadUrl`]: storageUrl,
      [`${fileType}UploadedAt`]: new Date(),
    });

  } catch (error) {
    console.error('Firestore update error:', error);
    throw error;
  }
}
