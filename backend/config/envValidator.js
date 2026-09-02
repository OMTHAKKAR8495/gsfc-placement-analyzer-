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
      errors.push('CRITICAL: JWT_SECRET environment variable is missing in production.');
    } else {
      warnings.push('JWT_SECRET is not set. Using local development fallback key.');
    }
  } else if (jwtSecret.length < 16) {
    warnings.push('JWT_SECRET is short (< 16 characters). Recommend using a 32+ character high-entropy key.');
  }

  // 3. AI / Gemini API Key
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!geminiKey) {
    warnings.push('GEMINI_API_KEY is not set. Platform will operate in High-Availability Deterministic Fallback Mode.');
  }

  // Log Startup Diagnostic Summary
  if (warnings.length > 0 && !isProduction) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  Environment Configuration Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Fatal Environment Configuration Errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    throw new Error(`Server startup aborted due to ${errors.length} configuration error(s).`);
  }

  return {
    isValid: true,
    isProduction,
    port: Number(port),
    hasGeminiKey: Boolean(geminiKey)
  };
}
