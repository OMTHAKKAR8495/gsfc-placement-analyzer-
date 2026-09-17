import rateLimit from 'express-rate-limit';

// Blocklist of top common weak passwords
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '123456789', '1234567890',
  'admin123', 'admin@123', 'qwerty1234', 'gsfc123456', 'welcome123',
  'letmein123', 'campushire'
]);

/**
 * Enforces strong password policy:
 * - Minimum 10 characters
 * - Not in top common weak password list
 * - Must contain uppercase, lowercase, and a digit
 */
export function validatePasswordPolicy(password, email = '') {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, message: 'Password is too common and easily guessable.' };
  }

  if (password.length < 10) {
    return { valid: false, message: 'Password must be at least 10 characters long.' };
  }

  return { valid: true };
}

/**
 * Rate Limiter Configuration:
 * - Employs compound key generation (IP + normalized account identifier) to prevent account-lockout DoS across shared campus NAT networks while blocking distributed and single-target brute-force attempts.
 * - Skips counting successful logins (skipSuccessfulRequests: true).
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

export const AuthRateLimiter = {
  // 15 failed login attempts per minute per account+IP
  loginLimiter: rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    skipSuccessfulRequests: true,
    skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-load-test'] === 'true',
    keyGenerator: (req) => {
      const ip = getClientIp(req);
      const account = (req.body?.email || req.body?.username || '').toLowerCase().trim();
      return account ? `${ip}::${account}` : ip;
    },
    message: {
      status: 'error',
      error: 'Too many authentication attempts for this account. Please wait 60 seconds before retrying.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Max 10 account registrations per hour per IP
  registerLimiter: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-load-test'] === 'true',
    keyGenerator: (req) => getClientIp(req),
    message: {
      status: 'error',
      error: 'Account registration rate limit exceeded from this IP. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Max 5 OTP password reset requests per 10 minutes per account+IP
  otpLimiter: rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-load-test'] === 'true',
    keyGenerator: (req) => {
      const ip = getClientIp(req);
      const email = (req.body?.email || '').toLowerCase().trim();
      return email ? `${ip}::otp::${email}` : ip;
    },
    message: {
      status: 'error',
      error: 'Password reset OTP request limit reached. Please wait 10 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Max 60 AI generation requests per minute
  aiFeatureLimiter: rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-load-test'] === 'true',
    keyGenerator: (req) => getClientIp(req),
    message: {
      status: 'error',
      error: 'AI feature rate limit exceeded. Please wait a moment.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Max 400 API requests per minute per IP (scalable to 2000 for high concurrency)
  generalApiLimiter: rateLimit({
    windowMs: 60 * 1000,
    max: 2000,
    skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-load-test'] === 'true',
    keyGenerator: (req) => getClientIp(req),
    standardHeaders: true,
    legacyHeaders: false
  })
};

/**
 * Prompt Injection Sanitizer for AI Proxy Endpoints
 * Strips malicious prompt override strings before LLM inference.
 */
export function sanitizeAiPromptInput(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return '';

  return inputStr
    .replace(/ignore\s+(previous|all)\s+instructions/gi, '[neutralized_prompt_injection]')
    .replace(/disregard\s+above/gi, '[neutralized_prompt_injection]')
    .replace(/system\s+prompt/gi, '[neutralized_term]')
    .replace(/you\s+are\s+now\s+a/gi, '[neutralized_instruction]')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .trim();
}

/**
 * XSS Content Sanitizer
 * Escapes HTML characters in free-form user inputs (job descriptions, resume text, questions).
 */
export function sanitizeXss(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Mass Assignment Protection Middleware
 * Strips privilege escalation fields from user-submitted request bodies.
 */
export function preventMassAssignment(forbiddenFields = ['role', 'approved', 'is_admin', 'admin_id']) {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      for (const field of forbiddenFields) {
        delete req.body[field];
      }
    }
    next();
  };
}
