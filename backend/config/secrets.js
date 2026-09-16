import crypto from 'crypto';

function resolveJwtSecret() {
  const envSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  if (isProduction) {
    throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing or shorter than 16 characters in production. Refusing to boot.');
  }

  const ephemeralSecret = crypto.randomBytes(48).toString('hex');
  console.warn('⚠️ [DEV SECURITY WARNING]: JWT_SECRET is not set or < 16 chars. Generated ephemeral random secret for this session. Issued tokens will invalidate on server restart.');
  return ephemeralSecret;
}

export const JWT_SECRET = resolveJwtSecret();
