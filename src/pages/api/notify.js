/**
 * API route to subscribe an email to Brevo contact list
 * POST /api/notify
 * Body: { email: string }
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validate email format
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Get Brevo API key from environment
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoListId = process.env.BREVO_LIST_ID;

  if (!brevoApiKey || !brevoListId) {
    console.error('Missing Brevo configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Call Brevo API to add contact to list
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        listIds: [parseInt(brevoListId, 10)],
      }),
    });

    // Handle Brevo API response
    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json();
      console.error('Brevo API error:', errorData);

      // Check if it's a duplicate contact error (which is acceptable)
      if (
        brevoResponse.status === 400
        && (errorData.code === 'duplicate_parameter' || (errorData.message && errorData.message.toLowerCase().includes('duplicate')))
      ) {
        return res.status(200).json({ message: 'already_subscribed' });
      }

      return res.status(500).json({
        error: 'Failed to subscribe email. Please try again later.',
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      message: 'Email subscribed successfully',
    });
  } catch (error) {
    console.error('Error calling Brevo API:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again later.',
    });
  }
}
