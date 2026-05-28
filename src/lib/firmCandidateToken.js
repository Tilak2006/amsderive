import crypto from 'crypto';

const TOKEN_VERSION = 'v1';

function base64Url(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(String(value || ''), 'base64url');
}

function tokenKey() {
  const secret = process.env.FIRM_CANDIDATE_TOKEN_SECRET
    || process.env.FIREBASE_ADMIN_PRIVATE_KEY
    || process.env.FIREBASE_ADMIN_PROJECT_ID
    || 'ams-derive-firm-candidate-token-dev';
  return crypto.createHash('sha256').update(secret).digest();
}

function deterministicIv(key, docId) {
  return crypto.createHmac('sha256', key).update(String(docId)).digest().subarray(0, 12);
}

export function createFirmCandidateToken(docId) {
  const key = tokenKey();
  const iv = deterministicIv(key, docId);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(docId), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [TOKEN_VERSION, base64Url(iv), base64Url(tag), base64Url(ciphertext)].join('.');
}

export function parseFirmCandidateToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return null;

  try {
    const [, ivRaw, tagRaw, ciphertextRaw] = parts;
    const key = tokenKey();
    const iv = fromBase64Url(ivRaw);
    const tag = fromBase64Url(tagRaw);
    const ciphertext = fromBase64Url(ciphertextRaw);
    if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) return null;

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
