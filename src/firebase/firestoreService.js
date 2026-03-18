import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  getCountFromServer,
  orderBy,
  limit,
  startAfter,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// ── Hard cap ───────────────────────────────────────────────────────────────
const MAX_REGISTRATIONS = 2500;

export async function checkRegistrationCap() {
  try {
    const snapshot = await getCountFromServer(collection(db, 'registrants'));
    const count = snapshot.data().count;
    if (count >= MAX_REGISTRATIONS) {
      return { allowed: false, error: 'Registrations are now closed.' };
    }
    return { allowed: true };
  } catch (error) {
    return { allowed: true };
  }
}

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

export async function checkDuplicateRegistration(email, cfHandle) {
  try {
    // Ref: firebase-upload-safety skill (Rule 4: Email case-insensitive)
    // Normalize email to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase().trim();
    
    const registrationsRef = collection(db, 'registrants');
    // Query against emailLower field to ensure case-insensitive matching
    const emailQuery = query(registrationsRef, where('emailLower', '==', normalizedEmail));
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

export async function submitRegistration(data) {
  try {
    // Ref: firebase-upload-safety skill (Rule 4: Email case-insensitive)
    const normalizedEmail = data.email.toLowerCase().trim();
    
    const docRef = await addDoc(collection(db, 'registrants'), {
      fullName: data.fullName,
      email: normalizedEmail,                    // Primary email field
      emailLower: normalizedEmail,               // Index copy for case-insensitive queries
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

export async function checkRateLimit(hashedIp) {
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

      const recent = timestamps.filter((ts) => ts > oneHourAgo);

      if (recent.length >= MAX_PER_HOUR) {
        return { allowed: false };
      }

      recent.push(Date.now());
      transaction.set(rateLimitRef, { timestamps: recent });

      return { allowed: true };
    });

    return result;
  } catch (error) {
    return { allowed: false, error: 'Rate limit check failed. Please try again.' };
  }
}

// ── Admin Functions ────────────────────────────────────────────────────────

/**
 * Fetch paginated registrants ordered by submittedAt desc.
 * Costs 1 read per document returned.
 *
 * @param {DocumentSnapshot|null} lastDoc - cursor for pagination
 * @returns {Promise<{registrants: Array, lastDoc: DocumentSnapshot|null, hasMore: boolean}>}
 */
export async function getAllRegistrants(lastDoc = null) {
  try {
    const PAGE_SIZE = 50;
    const registrantsRef = collection(db, 'registrants');

    let q = query(registrantsRef, orderBy('submittedAt', 'desc'), limit(PAGE_SIZE + 1));
    if (lastDoc) {
      q = query(registrantsRef, orderBy('submittedAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE + 1));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > PAGE_SIZE;
    const pageDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs;

    const registrants = pageDocs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        fullName: data.fullName || '',
        email: data.email || '',
        university: data.university || '',
        codeforcesHandle: data.codeforcesHandle || '',
        codechefHandle: data.codechefHandle || null,
        dataConsent: data.dataConsent || false,
        submittedAt: data.submittedAt ? data.submittedAt.toDate().toISOString() : null,
        status: data.status || 'pending',
        resumeUrl: data.resumeUrl || null,
        resumeFileName: data.resumeFileName || null,
        idCardUrl: data.idCardUrl || null,
        idCardFileName: data.idCardFileName || null,
        // Mask IP hash — last 8 chars only
        ipHash: data.ipHash ? '••••••••' + data.ipHash.slice(-8) : '—',
      };
    });

    return {
      registrants,
      lastDoc: hasMore ? pageDocs[pageDocs.length - 1] : null,
      hasMore,
    };
  } catch (error) {
    return { registrants: [], lastDoc: null, hasMore: false, error: error.message };
  }
}

/**
 * Update only the status field of a registrant.
 * Firestore rules enforce that only 'status' can be updated by auth users.
 *
 * @param {string} docId
 * @param {'pending'|'approved'|'rejected'} status
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateRegistrantStatus(docId, status) {
  try {
    const docRef = doc(db, 'registrants', docId);
    await updateDoc(docRef, { status });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get aggregate stats for the admin dashboard.
 * Uses getCountFromServer() — 1 read per query, never a full scan.
 *
 * @returns {Promise<{total: number, consentGiven: number, pending: number, today: number}>}
 */
export async function getRegistrantStats() {
  try {
    const registrantsRef = collection(db, 'registrants');

    // Today at 00:00 IST = UTC+5:30 = subtract 5.5 hours from midnight IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(now.getTime() + istOffset);
    todayIST.setUTCHours(0, 0, 0, 0);
    const todayUTC = new Date(todayIST.getTime() - istOffset);
    const todayTimestamp = Timestamp.fromDate(todayUTC);

    const [totalSnap, consentSnap, pendingSnap, todaySnap] = await Promise.all([
      getCountFromServer(registrantsRef),
      getCountFromServer(query(registrantsRef, where('dataConsent', '==', true))),
      getCountFromServer(query(registrantsRef, where('status', '==', 'pending'))),
      getCountFromServer(query(registrantsRef, where('submittedAt', '>=', todayTimestamp))),
    ]);

    return {
      total: totalSnap.data().count,
      consentGiven: consentSnap.data().count,
      pending: pendingSnap.data().count,
      today: todaySnap.data().count,
    };
  } catch (error) {
    return { total: 0, consentGiven: 0, pending: 0, today: 0 };
  }
}