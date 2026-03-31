import * as admin from 'firebase-admin';
import { resend } from '../../../lib/resend';
import { statusUpdateEmail } from '../../../emails/templates';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const FIRESTORE_CHUNK = 500; // Firestore batch write limit
const EMAIL_CHUNK = 100;     // Resend batch send limit
const EMAIL_DELAY_MS = 200;  // Delay between email batches

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const config = { api: { responseLimit: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check — verify Firebase ID token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch all pending registrants (email + fullName only for efficiency)
    const snapshot = await db
      .collection('registrants')
      .where('status', '==', 'pending')
      .select('email', 'fullName')
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ success: true, approved: 0, emailsSent: 0 });
    }

    const pending = snapshot.docs.map((d) => ({
      id: d.id,
      email: d.data().email,
      fullName: d.data().fullName,
    }));

    // 2. Firestore batch updates — committed before any emails are sent
    for (let i = 0; i < pending.length; i += FIRESTORE_CHUNK) {
      const batch = db.batch();
      for (const reg of pending.slice(i, i + FIRESTORE_CHUNK)) {
        batch.update(db.collection('registrants').doc(reg.id), {
          status: 'approved',
          statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      console.info(`[approve-all] DB batch ${Math.floor(i / FIRESTORE_CHUNK) + 1} committed`);
    }

    // 3. Send approval emails in batches — failures are logged, not fatal
    let emailsSent = 0;
    for (let i = 0; i < pending.length; i += EMAIL_CHUNK) {
      const chunk = pending.slice(i, i + EMAIL_CHUNK).map((r) => {
        const { from, subject, html } = statusUpdateEmail({ fullName: r.fullName, status: 'approved' });
        return { from, to: r.email, subject, html };
      });

      try {
        await resend.batch.send(chunk);
        emailsSent += chunk.length;
        console.info(`[approve-all] Email batch ${Math.floor(i / EMAIL_CHUNK) + 1}: sent ${chunk.length}`);
      } catch (err) {
        console.error(`[approve-all] Email batch ${Math.floor(i / EMAIL_CHUNK) + 1} failed:`, err.message);
      }

      if (i + EMAIL_CHUNK < pending.length) {
        await delay(EMAIL_DELAY_MS);
      }
    }

    console.info(`[approve-all] Done. Approved: ${pending.length}, Emailed: ${emailsSent}`);
    return res.status(200).json({ success: true, approved: pending.length, emailsSent });
  } catch (error) {
    console.error('[approve-all] Error:', error);
    return res.status(500).json({ error: 'Bulk approval failed.' });
  }
}
