// Shared in-memory OTP store (must match send-email-verification-otp.js)
global._gsfcEmailVerifyOtpStore = global._gsfcEmailVerifyOtpStore || new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = global._gsfcEmailVerifyOtpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ error: 'No OTP found for this email. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
      global._gsfcEmailVerifyOtpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'Your OTP has expired. Please request a new verification code.' });
    }

    if (otp.trim() !== record.otp) {
      return res.status(400).json({ error: 'Incorrect OTP. Please check your email and try again.' });
    }

    // OTP is valid — clear it
    global._gsfcEmailVerifyOtpStore.delete(normalizedEmail);

    return res.status(200).json({ success: true, message: 'Email address verified successfully.' });
  } catch (err) {
    console.error('[GSFC Email Verify OTP Check Error]', err);
    return res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
}
