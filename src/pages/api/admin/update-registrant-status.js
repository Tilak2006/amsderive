import * as admin from 'firebase-admin';
import { resend } from '../../../lib/resend';
import { statusUpdateEmail } from '../../../emails/templates';
import logger, { genReqId, maskEmail } from '../../../utils/logger';
import { requireAdmin } from '../../../lib/adminAuth';

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
const VALID_STATUSES = ['approved', 'rejected'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let decoded;
  try {
    decoded = await requireAdmin(req, admin.auth());
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const reqId = genReqId();
  const { docId, status } = req.body;

  if (!docId || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid docId.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected".' });
  }

  try {
    const docRef = db.collection('registrants').doc(docId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Registrant not found.' });
    }

    const data = snap.data();

    // Idempotency — same status already set, nothing to do
    if (data.status === status) {
      return res.status(200).json({ success: true, skipped: true });
    }

    // Send email FIRST. Status flip only happens if email lands.
    // Rationale: a "approved" row in the DB with no confirmation email means
    // a participant has no idea they got in — strictly worse than staying pending.
    let emailSent = false;
    let emailError = null;
    let resendEmailId = null;
    try {
      const emailTemplate = statusUpdateEmail({ fullName: data.fullName || 'there', status });
      if (!emailTemplate || !emailTemplate.from || !emailTemplate.subject || !emailTemplate.html) {
        throw new Error('email template missing required fields');
      }
      const sendPromise = resend.emails.send({
        from: emailTemplate.from,
        to: data.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
      const sendResult = await Promise.race([
        sendPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('email send timed out')), 8000)),
      ]);
      emailSent = true;
      resendEmailId = sendResult?.data?.id || null;
      logger.info('admin', 'status_update_email_sent', {
        reqId,
        entityId: docId,
        actorId: decoded.uid,
        detail: { emailMasked: maskEmail(data.email), newStatus: status },
        status: 'ok',
      });
    } catch (emailErr) {
      emailError = emailErr?.message || 'Email send failed';
      logger.warn('admin', 'status_update_email_failed', {
        reqId,
        entityId: docId,
        actorId: decoded.uid,
        detail: { emailMasked: maskEmail(data.email), newStatus: status, message: emailError },
        status: 'degraded',
      });
      return res.status(502).json({
        success: false,
        emailSent: false,
        emailError,
        error: `Email send failed — status NOT changed. Reason: ${emailError}`,
      });
    }

    // Email landed — now flip Firestore
    await docRef.update({
      status,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(resendEmailId ? { lastApprovalEmailId: resendEmailId } : {}),
    });

    logger.info('admin', 'status_updated', {
      reqId,
      entityId: docId,
      actorId: decoded.uid,
      detail: { newStatus: status },
      status: 'ok',
    });

    // Persist to audit log — survives Vercel log expiry
    try {
      await db.collection('_audit_log').add({
        type: status === 'approved' ? 'approve' : 'reject',
        actorId: decoded.uid,
        reqId,
        entityId: docId,
        emailMasked: maskEmail(data.email),
        newStatus: status,
        emailSent: true,
        resendEmailId: resendEmailId || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditErr) {
      logger.error('admin', 'status_audit_log_failed', {
        reqId, entityId: docId, actorId: decoded.uid, detail: { newStatus: status, resendEmailId: resendEmailId || null }, status: 'degraded',
      }, auditErr);
    }

    return res.status(200).json({ success: true, emailSent, emailError });
  } catch (error) {
    logger.error('admin', 'status_update_error', { reqId, entityId: docId, actorId: decoded.uid, status: 'failed' }, error);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
}
