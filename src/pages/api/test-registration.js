/**
 * Admin-only endpoint to bypass date gate for testing.
 * Checks x-admin-key header against ADMIN_KEY environment variable.
 * If matched, sets admin_bypass cookie (httpOnly, maxAge 3600).
 * 
 * Usage:
 * curl -X POST http://localhost:3000/api/test-registration \
 *   -H "x-admin-key: your-secret-key" \
 *   -H "Content-Type: application/json"
 */
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey) {
    return res.status(500).json({ error: 'Admin key not configured' });
  }

  if (!adminKey || adminKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set httpOnly cookie with 1 hour expiration
  res.setHeader(
    'Set-Cookie',
    `admin_bypass=1; HttpOnly; Max-Age=3600; Path=/; SameSite=Strict`
  );

  return res.status(200).json({ success: true, message: 'Admin bypass enabled for 1 hour' });
}
