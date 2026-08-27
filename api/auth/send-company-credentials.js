import nodemailer from 'nodemailer';

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
    const { to_email, company_name, portal_email, portal_password } = req.body || {};
    if (!to_email || !portal_email || !portal_password) {
      return res.status(400).json({ error: 'Missing required credentials parameters.' });
    }

    const smtpUser = process.env.SMTP_USER || 'omthakkar168@gmail.com';
    const smtpPass = (process.env.SMTP_PASS || 'rsfkhokjkgvtfxld').replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass }
    });

    const compTitle = company_name || 'Official Recruitment Partner';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%); color: #ffffff; padding: 32px 28px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 12px; color: #cbd5e1; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 5px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 1px; }
          .cred-box { background: #f0fdf4; border: 2px dashed #86efac; border-radius: 18px; padding: 20px 24px; margin: 20px 0; }
          .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #dcfce7; font-size: 13px; }
          .cred-row:last-child { border-bottom: none; }
          .cred-label { font-weight: 700; color: #166534; }
          .cred-val { font-weight: 900; font-family: 'Courier New', monospace; color: #0f172a; font-size: 14px; }
          .role-highlight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 18px; margin-top: 16px; font-size: 12px; color: #1e40af; line-height: 1.6; }
          .footer { background: #f8fafc; padding: 20px 28px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>🏛️ GSFC UNIVERSITY</h1>
            <p>Training & Placement Cell • Official Recruiter Onboarding Vault</p>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="badge">🏢 Verified Placement Partner</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 900; color: #0f172a; margin-top: 4px; margin-bottom: 8px;">
              Welcome, ${compTitle}!
            </h2>
            <p style="font-size: 13px; color: #475569; line-height: 1.7; margin-top: 0;">
              Your company account has been officially registered by the GSFC University Placement Cell / Faculty Coordinator. Below are your portal login credentials:
            </p>

            <div class="cred-box">
              <div class="cred-row">
                <span class="cred-label">Portal Login Email:</span>
                <span class="cred-val">${portal_email}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Temporary Password:</span>
                <span class="cred-val">${portal_password}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Authorized Role:</span>
                <span class="cred-val" style="color: #1e3a8a;">🏢 GSFC Placed Company</span>
              </div>
            </div>

            <div class="role-highlight">
              <strong>⚠️ Important Login Instruction:</strong><br>
              When logging in to the GSFC Placement Portal, please select the role <strong>🏢 GSFC Placed Company (Official Partner / Recruiter)</strong>. No payment or subscription plan is required — your partner tier is fully pre-authorized with unlimited access to candidate applications, placement drives, and interview rooms.
            </div>
          </div>
          <div class="footer">
            GSFC University, Vigyan Bhavan, P.O. Fertilizernagar, Vadodara, Gujarat 391750.<br>
            Training & Placement Cell Automation Platform &bull; Do not reply directly to this automated email.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"GSFC Placement Cell" <${smtpUser}>`,
      to: to_email,
      subject: `🏢 GSFC University Placement Portal - Recruiter Login Credentials for ${compTitle}`,
      text: `GSFC UNIVERSITY PLACEMENT PORTAL\n\nLogin Credentials for ${compTitle}\n\nLogin Email: ${portal_email}\nPassword: ${portal_password}\nRole to select: GSFC Placed Company\n\nGSFC University Training & Placement Cell`,
      html: htmlContent
    });

    console.log(`✅ [GSFC Credentials Mailer] Dispatched credentials to ${to_email}`);
    return res.status(200).json({ success: true, message: `Credentials dispatched to ${to_email}` });
  } catch (err) {
    console.error('[GSFC Send Credentials Error]', err);
    return res.status(500).json({ error: 'Failed to send credentials: ' + err.message });
  }
}
