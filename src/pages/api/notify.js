/**
 * API route to subscribe an email to Brevo contact list
 * POST /api/notify
 * Body: { email: string }
 */

import * as admin from 'firebase-admin';
import crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, refCode } = req.body;
  const sanitizedRefCode = (refCode && typeof refCode === 'string') ? refCode.trim().toLowerCase() : null;

  // Validate email format
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Rate Limiting
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  const ip = /^[\d.:\[\]a-fA-F]+$/.test(rawIp ?? '') ? rawIp : 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  const combined = `${ip}:${userAgent}`;
  const ipHash = crypto.createHash('sha256').update(combined).digest('hex');

  try {
    const rateLimitRef = db.collection('_rate_limits').doc(`notify_${ipHash}`);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const MAX_PER_HOUR = 3;

    const rateResult = await db.runTransaction(async (transaction) => {
      const rateLimitDoc = await transaction.get(rateLimitRef);

      let timestamps = [];
      if (rateLimitDoc.exists) {
        timestamps = rateLimitDoc.data().timestamps || [];
      }

      const recent = timestamps.filter((ts) => ts > oneHourAgo);

      if (recent.length >= MAX_PER_HOUR) {
        return { allowed: false, error: 'Too many requests. Please try again in an hour.' };
      }

      recent.push(Date.now());
      transaction.set(rateLimitRef, { timestamps: recent });

      return { allowed: true };
    });

    if (!rateResult.allowed) {
      return res.status(429).json({ error: rateResult.error });
    }
  } catch (error) {
    console.error('[notify] Rate limit check failed:', error);
    return res.status(500).json({ error: 'Rate limit check failed. Please try again.' });
  }

  // Get Brevo API key from environment
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoListId = process.env.BREVO_LIST_ID;

  if (!brevoApiKey || !brevoListId) {
    console.error('Missing Brevo configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Build Brevo contact payload — include AMBASSADOR_REF attribute if ref code present
    const brevoBody = {
      email: normalizedEmail,
      listIds: [parseInt(brevoListId, 10)],
    };
    if (sanitizedRefCode) {
      brevoBody.attributes = { AMBASSADOR_REF: sanitizedRefCode };
    }

    // Call Brevo API to add contact to list
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brevoBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let isDuplicate = false;

    // Handle Brevo API response
    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.json();
      console.error('Brevo API error:', errorData);

      // Check if it's a duplicate contact error (which is acceptable)
      if (
        brevoResponse.status === 400
        && (errorData.code === 'duplicate_parameter' || (errorData.message && errorData.message.toLowerCase().includes('duplicate')))
      ) {
        isDuplicate = true;

        // For duplicates, update the existing contact with AMBASSADOR_REF if present
        if (sanitizedRefCode) {
          try {
            await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(normalizedEmail)}`, {
              method: 'PUT',
              headers: {
                'api-key': brevoApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ attributes: { AMBASSADOR_REF: sanitizedRefCode } }),
            });
          } catch (updateErr) {
            console.warn('[notify] Brevo attribute update failed:', updateErr.message);
          }
        }
      } else {
        return res.status(500).json({
          error: 'Failed to subscribe email. Please try again later.',
        });
      }
    }

    // Store pre-registration in Firestore (regardless of Brevo new/duplicate)
    try {
      await db.collection('pre_registrations').add({
        email: normalizedEmail,
        refCode: sanitizedRefCode,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (firestoreErr) {
      console.error('[notify] Firestore pre_registrations write failed:', firestoreErr);
      // Don't fail the request — Brevo subscription already succeeded
    }

    // Success
    return res.status(200).json({
      success: true,
      message: isDuplicate ? 'already_subscribed' : 'Email subscribed successfully',
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out. Please try again.' });
    }
    console.error('Error calling Brevo API:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again later.',
    });
  }
}
