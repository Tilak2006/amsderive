/**
 * Structured logger for AMS Derive.
 * Writes newline-delimited JSON to stdout — compatible with Vercel log drain.
 * Never import this in client-side (browser) code.
 *
 * Field schema per log line:
 *   ts, level, workflow, event, reqId, actorId, entityId, status, durationMs, detail, err
 */

/**
 * Mask an email address for safe log output.
 * "john.doe@gmail.com" → "joh***@gmail.com"
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[email]';
  const atIdx = email.indexOf('@');
  if (atIdx < 0) return '[email]';
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx); // includes the @
  const visible = local.slice(0, 3).padEnd(3, '*');
  return `${visible}***${domain}`;
}

/**
 * Generate a lightweight 8-character hex request ID.
 * Not cryptographically random — sufficient for log correlation within one serverless invocation.
 */
export function genReqId() {
  return Math.random().toString(16).slice(2, 10).padStart(8, '0');
}

function write(level, workflow, event, fields, err) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    workflow,
    event,
    ...fields,
  };
  if (err) {
    entry.err = {
      message: err.message || String(err),
      code: err.code || undefined,
      // In production, cap stack to 4 lines to keep Vercel logs readable.
      stack:
        process.env.NODE_ENV !== 'production'
          ? err.stack
          : err.stack?.split('\n').slice(0, 4).join('\n'),
    };
  }
  process.stdout.write(JSON.stringify(entry) + '\n');
}

const logger = {
  /** Normal operational events. */
  info(workflow, event, fields = {}) {
    write('info', workflow, event, fields, null);
  },
  /** Degraded-but-recoverable states (stale cache served, non-critical failure, fail-open path). */
  warn(workflow, event, fields = {}) {
    write('warn', workflow, event, fields, null);
  },
  /** Failures with stack traces. Always pass the caught Error as the 4th argument. */
  error(workflow, event, fields = {}, err = null) {
    write('error', workflow, event, fields, err);
  },
};

export default logger;
