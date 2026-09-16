/**
 * Production Environment Configuration Validator
 * Validates critical environment variables at server boot and enforces secure defaults.
 */

export function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const warnings = [];
  const errors = [];

  // 1. Port Configuration
  const port = process.env.PORT || 5001;
  if (isNaN(Number(port))) {
    errors.push(`Invalid PORT specified: "${process.env.PORT}". Must be a valid integer.`);
  }

  // 2. JWT Secret Validation
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      errors.push('CRITICAL: JWT_SECRET environment variable is missing in production. Generate one with: openssl rand -base64 32');
    } else {
      warnings.push('JWT_SECRET is not set. Using local development fallback key.');
    }
  } else if (jwtSecret.length < 16) {
    if (isProduction) {
      errors.push('CRITICAL: JWT_SECRET must be at least 16 characters long in production (32+ recommended).');
    } else {
      warnings.push('JWT_SECRET is short (< 16 characters). Recommend using a 32+ character key.');
    }
  }

  // 3. Database Directory on Cloud Hosts
  if (isProduction && !process.env.DB_DIR && !process.env.VERCEL) {
    warnings.push('DB_DIR is not explicitly set in production. Ensure persistent disk volume (e.g. /data) is mounted to prevent data loss on restarts.');
  }

  // 4. AI / Gemini API Key
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!geminiKey) {
    warnings.push('GEMINI_API_KEY is not set. Platform AI endpoints will operate in high-availability deterministic offline mode.');
  }

  // 5. Transactional Email / SMTP Configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    warnings.push('SMTP configuration (SMTP_HOST/USER/PASS) is incomplete. Password reset OTPs will be printed to server console.');
  }

  // Log Startup Diagnostic Summary
  if (warnings.length > 0 && !isProduction) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  Environment Configuration Diagnostics:');
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Fatal Environment Configuration Errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    throw new Error(`Server startup aborted due to ${errors.length} fatal configuration error(s).`);
  }

  return {
    isValid: true,
    isProduction,
    port: Number(port),
    hasGeminiKey: Boolean(geminiKey)
  };
}
