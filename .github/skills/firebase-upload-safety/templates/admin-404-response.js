// Template: Admin Endpoints Return 404 (Not 500)
// Use in: src/pages/api/admin/*.js
// Rule 3: Admin endpoints return 404 (not 500) when key is not configured

export default async function handler(req, res) {
  try {
    // Check for admin API key
    const adminKey = process.env.ADMIN_API_KEY;

    // ✓ CORRECT: Return 404 if key is not configured (not missing header)
    if (!adminKey) {
      // Key is not configured in this environment
      return res.status(404).json({
        error: 'Not Found',
      });
      // Log for debugging (don't expose in response)
      // console.warn('ADMIN_API_KEY not configured');
    }

    // Verify request header
    const providedKey = req.headers['x-admin-key'];
    
    if (!providedKey) {
      // Client didn't provide key
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    if (providedKey !== adminKey) {
      // Key is incorrect
      return res.status(403).json({
        error: 'Forbidden',
      });
    }

    // ✓ Key is valid, proceed with endpoint logic
    return res.status(200).json({
      success: true,
      data: await performAdminOperation(req),
    });

  } catch (error) {
    // Internal server error (not a 404)
    console.error('Admin API error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
}

async function performAdminOperation(req) {
  // Your admin logic here
  return {};
}

/**
 * Why 404 for missing configuration?
 * 
 * - 404 (Not Found): Endpoint doesn't exist / isn't available
 * - 500 (Server Error): Something internal broke
 * 
 * If ADMIN_API_KEY is not configured, the service can't authenticate
 * the admin endpoint. From client perspective, it's unavailable (404).
 * 
 * This also prevents information disclosure:
 * - 500 suggests there's a misconfiguration (attackers learn it exists)
 * - 404 suggests the endpoint doesn't exist (no sensitive info revealed)
 */
