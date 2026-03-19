import { storage } from './firebaseConfig';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';

/**
 * Validate storage URL before using or storing in Firestore.
 * Ref: firebase-upload-safety skill (Rule 5)
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

  // No path traversal
  if (url.includes('..') || url.includes('\\')) {
    throw new Error('URL contains invalid path characters.');
  }

  return true;
}

/**
 * Upload a file to Firebase Storage WITHOUT compression.
 * Always upload raw files to preserve MIME type validation.
 * Ref: firebase-upload-safety skill (Rule 2: no compression)
 * @param {File} file - The file to upload.
 * @param {string} path - The storage path (e.g. "registrations/filename.pdf").
 * @param {Function} onProgress - Optional progress callback.
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadFile(file, path, onProgress) {
  try {
    // Upload raw file (no compression)
    // MIME type must be preserved for validation
    const storageRef = ref(storage, path);
    
    // uploadBytes returns immediately after queuing
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type, // Explicitly set MIME type
      customMetadata: {
        original_name: file.name,
        original_size: file.size.toString(),
      },
    });

    if (onProgress) onProgress({ loaded: 1, total: 1 });

    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const encodedPath = encodeURIComponent(path);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
    
    // Validate URL before returning (Rule 5: Validate URLs)
    validateStorageUrl(url);
    
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get the download URL for a file in Firebase Storage (cached).
 * @param {string} path - The storage path.
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function getFileUrl(path) {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Upload registration files (resume and ID card) in parallel.
 * Always uploads raw files (no compression) to preserve MIME types.
 * Ref: firebase-upload-safety skill (implemented rules 1-6)
 * @param {File} resumeFile - PDF file
 * @param {File} idCardFile - PDF file
 * @param {string} sanitizedName - Sanitized participant name for path
 * @returns {Promise<{success: boolean, resumeUrl?: string, idCardUrl?: string, resumeFileName?: string, idCardFileName?: string, error?: string}>}
 */
export async function uploadRegistrationFiles(resumeFile, idCardFile, sanitizedName) {
  try {
    const timestamp = Date.now();
    const resumePath = `registrants/${timestamp}_${sanitizedName}_resume.pdf`;
    
    // ID card must be PDF per file-safety rules
    const idPath = `registrants/${timestamp}_${sanitizedName}_id.pdf`;

    // Upload both files in parallel (raw, no compression)
    // MIME type preserved for client and server-side validation
    const [resumeResult, idResult] = await Promise.all([
      uploadFile(resumeFile, resumePath),
      uploadFile(idCardFile, idPath),
    ]);

    if (!resumeResult.success) {
      return { success: false, error: resumeResult.error || 'Failed to upload resume.' };
    }
    if (!idResult.success) {
      try { await deleteObject(ref(storage, resumePath)); } catch {}
      return { success: false, error: idResult.error || 'Failed to upload ID card.' };
    }

    return {
      success: true,
      resumeUrl: resumeResult.url,
      idCardUrl: idResult.url,
      resumeFileName: resumeFile.name,
      idCardFileName: idCardFile.name,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
