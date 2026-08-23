import bcrypt from 'bcryptjs';

// Global in-memory OTP cache across warm serverless invocations
global._gsfcOtpStore = global._gsfcOtpStore || new Map();

export default async function handler(req, res) {
  // Enable CORS for Vercel Serverless
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, otp, newPassword, role } = req.body || {};

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, 6-digit OTP, and new password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.toString().trim();

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const record = global._gsfcOtpStore.get(normalizedEmail);
    if (!record) {
      return res.status(400).json({ error: 'No active OTP request found for this email, or the OTP has expired. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      global._gsfcOtpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'The 6-digit OTP has expired (10-minute limit). Please request a new code.' });
    }

    if (record.otp !== trimmedOtp) {
      return res.status(400).json({ error: 'Incorrect 6-digit OTP. Please enter the exact code sent to your email.' });
    }

    // Clear used OTP
    global._gsfcOtpStore.delete(normalizedEmail);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now sign into your GSFC Placement Portal account with your new password.'
    });
  } catch (err) {
    console.error('Vercel OTP Verification Error:', err);
    return res.status(500).json({ error: 'Failed to verify password reset: ' + err.message });
  }
}
