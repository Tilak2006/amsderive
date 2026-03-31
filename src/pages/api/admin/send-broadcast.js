import * as admin from 'firebase-admin';
import { resend } from '../../../lib/resend';
import { broadcastEmail } from '../../../emails/templates';

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
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Disable response size limit — broadcast can take a while
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

  const { subject, body, roundFilter } = req.body;

  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Subject and body are required.' });
  }

  const validFilters = ['all', 'prior', 'posterior', 'convergence'];
  const filter = validFilters.includes(roundFilter) ? roundFilter : 'all';

  try {
    // Only fetch email + fullName fields to keep the payload lean
    let q = db.collection('registrants').select('email', 'fullName');
    if (filter !== 'all') {
      q = q.where('round', '==', filter);
    }
    const snapshot = await q.get();

    if (snapshot.empty) {
      return res.status(200).json({ success: true, sent: 0 });
    }

    const recipients = snapshot.docs
      .map((d) => ({ email: d.data().email, fullName: d.data().fullName }))
      .filter((r) => r.email);

    const template = broadcastEmail({ subject: subject.trim(), body: body.trim() });
    let sent = 0;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE).map((r) => ({
        from: template.from,
        to: r.email,
        subject: template.subject,
        html: template.html,
      }));

      try {
        await resend.batch.send(chunk);
        sent += chunk.length;
        console.info(`[send-broadcast] Batch ${Math.floor(i / BATCH_SIZE) + 1}: sent ${chunk.length} emails`);
      } catch (batchErr) {
        console.error(`[send-broadcast] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, batchErr.message);
      }

      // Delay between batches to respect rate limits (skip after final batch)
      if (i + BATCH_SIZE < recipients.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    console.info(`[send-broadcast] Complete: ${sent}/${recipients.length} emails sent`);
    return res.status(200).json({ success: true, sent });
  } catch (error) {
    console.error('[send-broadcast] Error:', error);
    return res.status(500).json({ error: 'Broadcast failed.' });
  }
}
