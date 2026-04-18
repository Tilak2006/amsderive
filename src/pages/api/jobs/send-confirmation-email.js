/**
 * POST /api/jobs/send-confirmation-email
 *
 * Worker endpoint invoked by QStash. Verifies Upstash signature, then sends the
 * registration confirmation email via Resend. Returns 500 on Resend failure so
 * QStash retries with exponential backoff (3 attempts).
 */

import { Receiver } from '@upstash/qstash';
import { resend } from '../../../lib/resend';
import { registrationConfirmationEmail } from '../../../emails/templates';
import logger, { genReqId, maskEmail } from '../../../utils/logger';

// Raw body needed for signature verification
export const config = {
  api: { bodyParser: false },
};

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const reqId = genReqId();

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch {
    return res.status(400).json({ error: 'Bad body' });
  }

  const signature = req.headers['upstash-signature'];
  try {
    await receiver.verify({ signature, body: rawBody });
  } catch {
    logger.warn('jobs', 'email_job_signature_invalid', { reqId, status: 'blocked' });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Bad JSON' });
  }

  const { fullName, email, codeforcesHandle, university } = payload;
  if (!email || !fullName) {
    // Permanent failure — don't retry
    logger.warn('jobs', 'email_job_bad_payload', { reqId, status: 'blocked' });
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const { from, subject, html } = registrationConfirmationEmail({
      fullName,
      codeforcesHandle,
      university,
    });
    await resend.emails.send({ from, to: email, subject, html });
    logger.info('jobs', 'confirmation_email_sent', {
      reqId,
      detail: { emailMasked: maskEmail(email) },
      status: 'ok',
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    // 500 → QStash retries with backoff
    logger.error('jobs', 'confirmation_email_send_failed', {
      reqId,
      detail: { emailMasked: maskEmail(email), message: err.message },
      status: 'failed',
    }, err);
    return res.status(500).json({ error: 'Send failed' });
  }
}
