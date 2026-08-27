import nodemailer from 'nodemailer';

// Shared in-memory OTP store (persists across warm Lambda invocations)
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
    const { email, role } = req.body || {};
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRole = role || 'student';

    // Generate a 6-digit OTP (valid for 10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    global._gsfcEmailVerifyOtpStore.set(normalizedEmail, {
      otp,
      role: userRole,
      expiresAt,
      createdAt: Date.now()
    });

    const smtpUser = process.env.SMTP_USER || 'omthakkar168@gmail.com';
    const smtpPass = (process.env.SMTP_PASS || 'rsfkhokjkgvtfxld').replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass }
    });

    const roleLabel =
      userRole === 'gsfc_company' ? 'GSFC Placed Company'
      : userRole === 'company' ? 'Outside Recruiter'
      : userRole === 'faculty' ? 'Faculty Coordinator'
      : userRole === 'admin' ? 'TPC Admin'
      : userRole === 'alumni' ? 'Alumni Mentor'
      : 'Student';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
          .card { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%); color: #ffffff; padding: 28px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 12px; color: #cbd5e1; }
          .content { padding: 32px 28px; }
          .otp-box { background: #f0fdf4; border: 2px dashed #4ade80; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #166534; font-family: 'Courier New', monospace; }
          .badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 14px; letter-spacing: 1px; }
          .footer { background: #f8fafc; padding: 18px 28px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center; }
          .warning { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #9a3412; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>🏛️ GSFC UNIVERSITY</h1>
            <p>Training &amp; Placement Cell • AI Placement Intelligence Vault</p>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="badge">✅ ${roleLabel} — Email Verification</span>
            </div>
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 8px; margin-bottom: 4px;">Account Registration Verification Code</h2>
            <p style="font-size: 13px; color: #475569; line-height: 1.7; margin-top: 0;">
              You're creating a new <strong>GSFC Placement Portal</strong> account as a <strong>${roleLabel}</strong>.<br>
              Use the 6-digit code below to verify your email address: <strong>${normalizedEmail}</strong>
            </p>
            <div class="otp-box">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Email Verification OTP</div>
              <div class="otp-code">${otp}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 10px; font-weight: 600;">⏳ Valid for 10 minutes only</div>
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.6;">
              Enter this code in the registration form to complete your email verification and activate your account.
            </p>
            <div class="warning">
              🔒 <strong>Security Notice:</strong> Never share this OTP with anyone. GSFC TPC will never ask you for this code. If you didn't initiate this registration, please ignore this email.
            </div>
          </div>
          <div class="footer">
            GSFC University, Vigyan Bhavan, P.O. Fertilizernagar, Vadodara, Gujarat 391750.<br>
            Official Placement Automation &amp; ATS Intelligence Platform &nbsp;•&nbsp; Do not reply to this email.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"GSFC Placement Cell" <${smtpUser}>`,
      to: normalizedEmail,
      subject: `✅ GSFC University Placement Portal – Email Verification OTP: ${otp}`,
      text: `GSFC UNIVERSITY PLACEMENT PORTAL\n\nEmail Verification OTP for ${roleLabel} Registration\n\nYour 6-Digit OTP: ${otp}\n\nThis code is valid for 10 minutes.\nIf you didn't initiate this, please ignore this email.\n\nGSFC University Training & Placement Cell`,
      html: htmlContent
    });

    console.log(`✅ [GSFC Email Verify Mailer] OTP dispatched to ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to your email inbox (${normalizedEmail}). Please check your inbox and spam folder.`,
      email: normalizedEmail
    });
  } catch (err) {
    console.error('[GSFC Email Verify OTP Error]', err);
    return res.status(500).json({ error: 'Failed to send verification email: ' + err.message });
  }
}
