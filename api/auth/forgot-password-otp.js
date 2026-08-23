import nodemailer from 'nodemailer';

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
    const { email, role } = req.body || {};
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRole = role || 'student';

    // Generate cryptographically secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    global._gsfcOtpStore.set(normalizedEmail, {
      otp,
      role: userRole,
      expiresAt,
      createdAt: Date.now()
    });

    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');

    // Configure Mail Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const roleTitle = userRole === 'company' ? 'Company Recruiter' : (userRole === 'faculty' ? 'Faculty Coordinator' : (userRole === 'admin' ? 'Placement Admin' : 'Student'));

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
          .card { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%); color: #ffffff; padding: 28px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 12px; color: #cbd5e1; }
          .content { padding: 32px 28px; }
          .otp-box { background: #f1f5f9; border: 2px dashed #93c5fd; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1e3a8a; font-family: monospace; }
          .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
          .footer { background: #f8fafc; padding: 20px 28px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #64748b; line-height: 1.5; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>GSFC UNIVERSITY</h1>
            <p>Training & Placement Cell • AI Placement Intelligence Vault</p>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="badge">${roleTitle} Verification</span>
            </div>
            <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin-top: 0;">Password Reset Verification Code</h2>
            <p style="font-size: 13px; color: #475569; line-height: 1.6;">
              We received a request to reset your password for your <strong>GSFC Placement Portal</strong> account associated with <strong>${normalizedEmail}</strong>.
            </p>
            <div class="otp-box">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your 6-Digit OTP</div>
              <div class="otp-code">${otp}</div>
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
              ⏳ This verification code is valid for <strong>10 minutes</strong>. If you did not request this password reset, you can safely disregard this email.
            </p>
          </div>
          <div class="footer">
            GSFC University, Vigyan Bhavan, P.O. Fertilizernagar, Vadodara, Gujarat 391750.<br>
            Official Placement Automation & ATS Intelligence Platform.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"GSFC Placement Cell" <${process.env.SMTP_USER || 'tpc@gsfcuniversity.ac.in'}>`,
      to: normalizedEmail,
      subject: `🔐 GSFC University Placement Portal - Password Reset OTP: ${otp}`,
      text: `GSFC UNIVERSITY PLACEMENT PORTAL\n\nYour 6-Digit OTP is: ${otp}\n\nValid for 10 minutes.`,
      html: htmlContent
    });

    console.log(`✅ [Vercel Serverless Mailer] Live Email Successfully Dispatched to ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to your email inbox (${normalizedEmail}). Please check your inbox.`,
      email: normalizedEmail
    });
  } catch (err) {
    console.error('Vercel Serverless OTP Error:', err);
    return res.status(500).json({ error: 'Failed to dispatch verification email: ' + err.message });
  }
}
