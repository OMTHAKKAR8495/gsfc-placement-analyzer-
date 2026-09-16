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

  // Stable local development key to prevent token invalidation across dev server restarts
  const devSecret = process.env.DEV_JWT_SECRET || 'gsfc_placement_local_dev_jwt_secret_key_32bytes_min';
  return devSecret;
}

export const JWT_SECRET = resolveJwtSecret();

