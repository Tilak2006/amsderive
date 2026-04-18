import { Client } from '@upstash/qstash';

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://amsderive.in';

/**
 * Publish a confirmation-email job to QStash.
 * Worker at /api/jobs/send-confirmation-email sends via Resend with automatic retry.
 */
export async function enqueueConfirmationEmail(payload) {
  return qstash.publishJSON({
    url: `${SITE_URL}/api/jobs/send-confirmation-email`,
    body: payload,
    retries: 3,
  });
}
