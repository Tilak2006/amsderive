/**
 * API route that returns the client's IP address.
 * GET /api/get-ip → { ip: string }
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const raw = forwarded
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress;

  // Sanitize: only allow valid IPv4, IPv6, and bracket-notation IPv6
  const ip = /^[\d.:\[\]a-fA-F]+$/.test(raw ?? '') ? raw : 'unknown';

  res.status(200).json({ ip });
}
