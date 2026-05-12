import * as admin from 'firebase-admin';
import logger from '../utils/logger';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const missingConfig = [
  ['FIREBASE_ADMIN_PROJECT_ID', projectId],
  ['FIREBASE_ADMIN_CLIENT_EMAIL', clientEmail],
  ['FIREBASE_ADMIN_PRIVATE_KEY', privateKey],
].filter(([, value]) => !value).map(([name]) => name);

if (!admin.apps.length) {
  if (missingConfig.length) {
    logger.error('firebase_admin', 'missing_config', {
      status: 'failed',
      detail: { missing: missingConfig },
    });
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: storageBucketName,
  });
}

export const db = admin.firestore();

export function getStorageBucket() {
  if (!storageBucketName) {
    logger.error('firebase_admin', 'missing_storage_bucket', {
      status: 'failed',
      detail: { missing: ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] },
    });
    throw new Error('Firebase Storage bucket is not configured.');
  }

  return admin.storage().bucket(storageBucketName);
}

export { admin };
export default admin;
