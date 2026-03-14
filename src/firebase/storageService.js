import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload a file to Firebase Storage.
 * @param {File} file - The file to upload.
 * @param {string} path - The storage path (e.g. "registrations/filename.pdf").
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadFile(file, path) {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get the download URL for a file in Firebase Storage.
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
