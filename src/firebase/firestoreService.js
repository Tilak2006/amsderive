import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  getDocs,
  getCountFromServer,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

// ── Hard cap ───────────────────────────────────────────────────────────────
// Maximum registrations accepted. Stops Firestore writes entirely once
// this number is hit — protects your Blaze quota during a burst and
// prevents runaway billing if registrations are flooded.
const MAX_REGISTRATIONS = 2500;

/**
 * Check whether total registrations have hit the hard cap.
 * Uses getCountFromServer() — a single aggregation read (not a full scan),
 * costs 1 Firestore read regardless of collection size.
 *
 * @returns {Promise<{allowed: boolean, error?: string}>}
 */
export async function checkRegistrationCap() {
  try {
    const snapshot = await getCountFromServer(collection(db, 'registrants'));
    const count = snapshot.data().count;
    if (count >= MAX_REGISTRATIONS) {
      return { allowed: false, error: 'Registrations are now closed.' };
    }
    return { allowed: true };
  } catch (error) {
    // Fail open — if the count check errors, don't block the user.
    // The Firestore rules are the real enforcement layer.
    return { allowed: true };
  }
}

/**
 * Check whether a Codeforces or CodeChef handle is already registered.
 * Queries run in parallel to minimize latency.
 *
 * @param {string} cfHandle
 * @param {string} ccHandle
 * @returns {Promise<{duplicate: boolean, error?: string}>}
 */
export async function checkDuplicateHandle(cfHandle, ccHandle) {
  try {
    const registrationsRef = collection(db, 'registrants');
    const cfQuery = query(registrationsRef, where('codeforcesHandle', '==', cfHandle));
    const ccQuery = query(registrationsRef, where('codechefHandle', '==', ccHandle));

    const [cfSnapshot, ccSnapshot] = await Promise.all([
      getDocs(cfQuery),
      getDocs(ccQuery),
    ]);

    if (!cfSnapshot.empty) {
      return { duplicate: true, error: 'This Codeforces handle is already registered.' };
    }
    if (!ccSnapshot.empty) {
      return { duplicate: true, error: 'This CodeChef handle is already registered.' };
    }

    return { duplicate: false };
  } catch (error) {
    return { duplicate: false, error: error.message };
  }
}

/**
 * Check whether an email or Codeforces handle is already registered.
 * Queries run in parallel to minimize latency.
 *
 * @param {string} email
 * @param {string} cfHandle
 * @returns {Promise<{duplicate: boolean, error?: string}>}
 */
export async function checkDuplicateRegistration(email, cfHandle) {
  try {
    const registrationsRef = collection(db, 'registrants');
    const emailQuery = query(registrationsRef, where('email', '==', email.toLowerCase().trim()));
    const cfQuery = query(registrationsRef, where('codeforcesHandle', '==', cfHandle));

    const [emailSnapshot, cfSnapshot] = await Promise.all([
      getDocs(emailQuery),
      getDocs(cfQuery),
    ]);

    if (!emailSnapshot.empty) {
      return { duplicate: true, error: 'This email is already registered.' };
    }
    if (!cfSnapshot.empty) {
      return { duplicate: true, error: 'This Codeforces handle is already registered.' };
    }

    return { duplicate: false };
  } catch (error) {
    return { duplicate: false, error: error.message };
  }
}

/**
 * Submit a registration entry to Firestore.
 * submittedAt uses serverTimestamp() — the Firestore rules enforce that
 * this equals request.time, so clients cannot fake a past/future timestamp.
 *
 * @param {Object} data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function submitRegistration(data) {
  try {
    const docRef = await addDoc(collection(db, 'registrants'), {
      fullName: data.fullName,
      email: data.email.toLowerCase().trim(),
      university: data.university,
      resumeUrl: data.resumeUrl,
      resumeFileName: data.resumeFileName,
      idCardUrl: data.idCardUrl,
      idCardFileName: data.idCardFileName,
      codeforcesHandle: data.codeforcesHandle,
      codechefHandle: data.codechefHandle || null,
      linkedIn: data.linkedIn || null,
      gitHub: data.gitHub || null,
      dataConsent: data.dataConsent,
      ipHash: data.ipHash,
      submittedAt: serverTimestamp(),
      status: 'pending',
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Check whether the given hashed IP has exceeded the rate limit.
 * Allows max 3 submissions per hour per IP hash.
 *
 * Security note:
 *   This runs as a client SDK transaction, which means a determined attacker
 *   who reads the Firestore rules could attempt to manipulate _rate_limits
 *   directly. The rules now prevent deletes and validate structure, making
 *   this significantly harder to bypass.
 *
 *   For bulletproof rate limiting, enable Firebase App Check:
 *   https://firebase.google.com/docs/app-check
 *   App Check uses reCAPTCHA v3 to verify requests come from your actual
 *   web app — not from bots, scripts, or direct API calls. It requires
 *   zero auth from the user and works transparently in the background.
 *   Setup takes ~30 minutes and is free on all Firebase plans.
 *
 * @param {string} hashedIp - SHA-256 hex hash of the client IP
 * @returns {Promise<{allowed: boolean, error?: string}>}
 */
export async function checkRateLimit(hashedIp) {
  // Client-side pre-check: if the hash doesn't look valid, reject immediately
  // without touching Firestore. Prevents garbage doc IDs in _rate_limits.
  if (!hashedIp || !/^[a-f0-9]{64}$/.test(hashedIp)) {
    return { allowed: false, error: 'Invalid request.' };
  }

  try {
    const rateLimitRef = doc(db, '_rate_limits', hashedIp);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const MAX_PER_HOUR = 3;

    const result = await runTransaction(db, async (transaction) => {
      const rateLimitDoc = await transaction.get(rateLimitRef);

      let timestamps = [];
      if (rateLimitDoc.exists()) {
        timestamps = rateLimitDoc.data().timestamps || [];
      }

      // Only keep timestamps from the last hour
      const recent = timestamps.filter((ts) => ts > oneHourAgo);

      if (recent.length >= MAX_PER_HOUR) {
        return { allowed: false };
      }

      // Append current timestamp — the rules enforce max 10 entries
      // and only allow the 'timestamps' field, so this is the only valid write.
      recent.push(Date.now());
      transaction.set(rateLimitRef, { timestamps: recent });

      return { allowed: true };
    });

    return result;
  } catch (error) {
    // If the transaction fails (e.g. rules block a malformed write),
    // fail closed — don't allow the submission.
    return { allowed: false, error: 'Rate limit check failed. Please try again.' };
  }
}