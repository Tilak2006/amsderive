import { resend } from './resend';

export const RESEND_BATCH_LIMIT = 100;
export const RESEND_DEFAULT_RPS = 2;
export const RESEND_SAFE_RPS = 2;
export const EMAIL_SEND_TIMEOUT_MS = 15000;
export const EMAIL_RETRY_ATTEMPTS = 3;

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

function resendErrorFrom(result) {
  if (!result?.error) return null;
  const error = new Error(result.error.message || 'Resend API request failed');
  error.name = result.error.name || 'resend_error';
  error.statusCode = result.error.statusCode;
  error.headers = result.headers || null;
  return error;
}

function retryDelayMs(err, attempt) {
  const retryAfter = Number(err?.headers?.['retry-after']);
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.ceil(retryAfter * 1000);
  }
  return attempt * 1000;
}

export async function sendEmailBatchWithRetry(chunk, options = {}, attempt = 1) {
  const timeoutMs = options.timeoutMs || EMAIL_SEND_TIMEOUT_MS;
  const attempts = options.attempts || EMAIL_RETRY_ATTEMPTS;

  try {
    const result = await withTimeout(
      resend.batch.send(
        chunk,
        options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
      ),
      timeoutMs,
      'resend batch send timed out'
    );
    const resendError = resendErrorFrom(result);
    if (resendError) throw resendError;
    return { sent: chunk.length, failed: 0 };
  } catch (err) {
    if (attempt < attempts) {
      await delay(retryDelayMs(err, attempt));
      return sendEmailBatchWithRetry(chunk, options, attempt + 1);
    }
    return { sent: 0, failed: chunk.length, err };
  }
}

export async function sendSingleEmailWithRetry(message, options = {}, attempt = 1) {
  const timeoutMs = options.timeoutMs || EMAIL_SEND_TIMEOUT_MS;
  const attempts = options.attempts || EMAIL_RETRY_ATTEMPTS;

  try {
    const result = await withTimeout(
      resend.emails.send(
        message,
        options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined
      ),
      timeoutMs,
      'email send timed out'
    );
    const resendError = resendErrorFrom(result);
    if (resendError) throw resendError;
    return { sent: 1, failed: 0, result };
  } catch (err) {
    if (attempt < attempts) {
      await delay(retryDelayMs(err, attempt));
      return sendSingleEmailWithRetry(message, options, attempt + 1);
    }
    return { sent: 0, failed: 1, err };
  }
}

export function resendSafeDelayMs(rps = RESEND_SAFE_RPS) {
  return Math.ceil(1000 / Math.max(1, rps));
}
