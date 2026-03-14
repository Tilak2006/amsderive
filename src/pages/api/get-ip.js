/**
 * API route that returns the client's IP address.
 * GET /api/get-ip → { ip: string }
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress;

  res.status(200).json({ ip });
}
