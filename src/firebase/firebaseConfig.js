import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable IndexedDB persistence for offline caching and improved performance
// Wrapped in try-catch because persistence can fail if tab quota is exceeded
try {
  enableIndexedDbPersistence(db);
} catch (err) {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence enabled in another tab
    if (process.env.NODE_ENV === 'development') console.warn('IndexedDB: Multiple tabs detected');
  } else if (err.code === 'unimplemented') {
    // IndexedDB not available in this environment
    if (process.env.NODE_ENV === 'development') console.warn('IndexedDB: Not available in this environment');
  }
}
