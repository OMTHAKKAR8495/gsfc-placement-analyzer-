import nodemailer from 'nodemailer';

/**
 * Configure Nodemailer SMTP Transporter
 * Strictly requires environment variables (SMTP_USER and SMTP_PASS).
 * NEVER falls back to hardcoded credentials.
 */
const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : null;

  if (!user || !pass) {
    console.error('🚫 [GSFC Mailer Error]: SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
};

/**
 * Dispatch Password Reset 6-Digit OTP to User's Email
 */
export async function sendPasswordResetEmail(recipientEmail, otp, role = 'student') {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { 
        success: false, 
        error: 'SMTP service unconfigured on server. Please set SMTP_USER and SMTP_PASS in backend environment.' 
      };
    }

    const roleTitle = role === 'company' ? 'Company Recruiter' : (role === 'faculty' ? 'Faculty Coordinator' : (role === 'admin' ? 'Placement Admin' : 'Student'));

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
              We received a request to reset your password for your <strong>GSFC Placement Portal</strong> account associated with <strong>${recipientEmail}</strong>.
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

    const textContent = `GSFC UNIVERSITY PLACEMENT PORTAL\nPassword Reset Verification\n\nYour 6-Digit OTP is: ${otp}\n\nThis verification code is valid for 10 minutes.\nIf you did not request this, please ignore this email.\n\nGSFC University Training & Placement Cell`;

    const info = await transporter.sendMail({
      from: `"GSFC Placement Cell" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `🔐 GSFC University Placement Portal - Password Reset OTP: ${otp}`,
      text: textContent,
      html: htmlContent
    });

    console.log(`✅ [GSFC Mailer] Live Email Successfully Dispatched to ${recipientEmail} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`⚠️ [GSFC Mailer Notice] Direct SMTP dispatch exception:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch Official Portal Login Credentials to Recruiter / Company HR Contact
 */
export async function sendCompanyCredentialsEmail(toEmail, companyName, portalEmail, portalPassword) {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { 
        success: false, 
        error: 'SMTP service is not configured on the server. Please set SMTP_USER and SMTP_PASS environment variables.' 
      };
    }

    const cleanTo = (toEmail || '').trim();
    if (!cleanTo || !cleanTo.includes('@')) {
      return { success: false, error: 'Invalid recipient email address provided.' };
    }

    const portalLoginUrl = process.env.CLIENT_URL || 'http://localhost:5173/#company';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #334155; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
          .header { background: linear-gradient(135deg, #0d47a1 0%, #1a237e 50%, #000051 100%); color: #ffffff; padding: 36px 32px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; }
          .header p { margin: 8px 0 0 0; font-size: 13px; color: #90caf9; font-weight: 500; }
          .badge { display: inline-block; background: rgba(255, 255, 255, 0.15); color: #e3f2fd; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25); }
          .content { padding: 36px 32px; background: #ffffff; }
          .greeting { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
          .message { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
          .cred-box { background: linear-gradient(145deg, #0f172a, #1e293b); border: 1px solid #334155; border-radius: 20px; padding: 24px; margin-bottom: 28px; color: #ffffff; box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
          .cred-title { font-size: 11px; font-weight: 800; color: #60a5fa; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
          .cred-row { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; }
          .cred-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .cred-value { font-size: 15px; font-weight: 800; color: #38bdf8; font-family: 'Courier New', Courier, monospace; word-break: break-all; }
          .role-highlight { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 16px; margin-top: 16px; }
          .role-title { font-size: 10px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 1px; }
          .role-name { font-size: 13px; font-weight: 800; color: #ffffff; margin-top: 2px; }
          .instructions-card { background: #fef3c7; border: 1px solid #fde68a; border-radius: 16px; padding: 20px 24px; margin-bottom: 28px; }
          .inst-title { font-size: 12px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; margin-bottom: 10px; }
          .inst-list { margin: 0; padding-left: 18px; color: #78350f; font-size: 13px; line-height: 1.6; font-weight: 600; }
          .inst-list li { margin-bottom: 6px; }
          .btn-container { text-align: center; margin: 32px 0 16px 0; }
          .btn-primary { display: inline-block; background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%); color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 800; padding: 16px 36px; border-radius: 14px; box-shadow: 0 8px 20px rgba(13, 71, 161, 0.35); letter-spacing: 0.5px; }
          .footer { background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center; }
          .footer strong { color: #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">Official Placement Partner Provisioning</div>
            <h1>GSFC UNIVERSITY</h1>
            <p>Training & Placement Cell (TPC) • Recruiter Enterprise Portal</p>
          </div>
          <div class="content">
            <h2 class="greeting">Welcome, ${companyName}!</h2>
            <p class="message">
              We are pleased to partner with <strong>${companyName}</strong> for our campus recruitment drives. Your official corporate recruiter portal access has been provisioned by the GSFC University Training & Placement Cell.
            </p>

            <div class="cred-box">
              <div class="cred-title">🔑 Your Official Recruiter Portal Credentials</div>
              
              <div class="cred-row">
                <div class="cred-label">Portal Login Email / Username</div>
                <div class="cred-value">${portalEmail}</div>
              </div>

              <div class="cred-row">
                <div class="cred-label">Temporary Password</div>
                <div class="cred-value">${portalPassword}</div>
              </div>

              <div class="role-highlight">
                <div class="role-title">Selected Role at Sign-In</div>
                <div class="role-name">🏢 GSFC Placed Company (Official Partner / Recruiter)</div>
              </div>
            </div>

            <div class="instructions-card">
              <div class="inst-title">📋 Getting Started — Step-by-Step Instructions</div>
              <ol class="inst-list">
                <li>Access the GSFC Placement Portal via the button below.</li>
                <li>On the login page, select the <strong>🏢 GSFC Placed Company</strong> role.</li>
                <li>Enter your <strong>Portal Login Email</strong> and <strong>Temporary Password</strong>.</li>
                <li>You have complete recruiter access: post hiring requirements, view matched candidate dossiers, and schedule video interviews.</li>
                <li>For institutional security, please update your temporary password from your profile settings after your initial sign-in.</li>
              </ol>
            </div>

            <div class="btn-container">
              <a href="${portalLoginUrl}" target="_blank" class="btn-primary">Access GSFC Recruiter Portal →</a>
            </div>
          </div>
          <div class="footer">
            <strong>Training & Placement Cell (TPC)</strong><br>
            GSFC University, Vigyan Bhavan, P.O. Fertilizernagar, Vadodara, Gujarat 391750.<br>
            Official Placement Automation & Campus Recruitment Management System.
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `GSFC UNIVERSITY — TRAINING & PLACEMENT CELL
Official Campus Recruitment Partner Account Provisioned

Dear HR Team at ${companyName},

Your official recruiter credentials for the GSFC University Placement Portal have been generated:

📋 OFFICIAL PORTAL CREDENTIALS:
--------------------------------------------------
• Company Name: ${companyName}
• Portal Login Email: ${portalEmail}
• Temporary Password: ${portalPassword}
• Selected Role at Login: GSFC Placed Company (Official Partner / Recruiter)
• Portal Access URL: ${portalLoginUrl}
--------------------------------------------------

INSTRUCTIONS:
1. Open the portal URL: ${portalLoginUrl}
2. Select "GSFC Placed Company" role.
3. Sign in using the credentials provided above.
4. Update your password from profile settings after your first login.

Best Regards,
Training & Placement Cell (TPC)
GSFC University, Vadodara`;

    const info = await transporter.sendMail({
      from: `"GSFC Placement Cell" <${process.env.SMTP_USER}>`,
      to: cleanTo,
      subject: `🏢 GSFC University Placement Portal — Recruiter Access Credentials for ${companyName}`,
      text: textContent,
      html: htmlContent
    });

    console.log(`✅ [GSFC Mailer] Company credentials successfully emailed to ${cleanTo} for ${companyName} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`⚠️ [GSFC Mailer Error] Exception dispatching company credentials email:`, err.message);
    return { success: false, error: err.message };
  }
}
