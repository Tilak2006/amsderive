import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Check whether a Codeforces or CodeChef handle is already registered.
 * @param {string} cfHandle - Codeforces handle.
 * @param {string} ccHandle - CodeChef handle.
 * @returns {Promise<{duplicate: boolean, error?: string}>}
 */
export async function checkDuplicateHandle(cfHandle, ccHandle) {
  try {
    const registrationsRef = collection(db, 'registrants');

    const cfQuery = query(registrationsRef, where('codeforcesHandle', '==', cfHandle));
    const cfSnapshot = await getDocs(cfQuery);
    if (!cfSnapshot.empty) {
      return { duplicate: true, error: 'This Codeforces handle is already registered' };
    }

    const ccQuery = query(registrationsRef, where('codechefHandle', '==', ccHandle));
    const ccSnapshot = await getDocs(ccQuery);
    if (!ccSnapshot.empty) {
      return { duplicate: true, error: 'This CodeChef handle is already registered' };
    }

    return { duplicate: false };
  } catch (error) {
    return { duplicate: false, error: error.message };
  }
}

/**
 * Submit a registration entry to Firestore.
 * @param {Object} data - Registration form data.
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function submitRegistration(data) {
  try {
    const docRef = await addDoc(collection(db, 'registrants'), {
      name: data.name,
      institution: data.institution,
      codeforcesHandle: data.codeforcesHandle,
      codechefHandle: data.codechefHandle,
      idDocumentUrl: data.idDocumentUrl,
      idDocumentFileName: data.idDocumentFileName,
      ipHash: data.ipHash,
      submittedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Check whether the given hashed IP has exceeded the rate limit.
 * Allows max 3 submissions within a 1-hour window.
 * @param {string} hashedIp - SHA-256 hex hash of the client IP.
 * @returns {Promise<{allowed: boolean, error?: string}>}
 */
export async function checkRateLimit(hashedIp) {
  try {
    const rateLimitRef = doc(db, '_rate_limits', hashedIp);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const result = await runTransaction(db, async (transaction) => {
      const rateLimitDoc = await transaction.get(rateLimitRef);

      let timestamps = [];
      if (rateLimitDoc.exists()) {
        timestamps = rateLimitDoc.data().timestamps || [];
      }

      // Filter to only timestamps within the last hour
      const recentTimestamps = timestamps.filter((ts) => ts > oneHourAgo);

      if (recentTimestamps.length >= 3) {
        return { allowed: false };
      }

      // Add current timestamp and update
      recentTimestamps.push(Date.now());
      transaction.set(rateLimitRef, { timestamps: recentTimestamps });

      return { allowed: true };
    });

    return result;
  } catch (error) {
    return { allowed: false, error: error.message };
  }
}
