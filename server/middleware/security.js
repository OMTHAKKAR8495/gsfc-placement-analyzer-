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

  if (password.length < 10) {
    return { valid: false, message: 'Password must be at least 10 characters long.' };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, message: 'Password is too common or easily guessable. Please choose a stronger password.' };
  }

  if (email && password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
    return { valid: false, message: 'Password cannot contain your email or username.' };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit) {
    return { valid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' };
  }

  return { valid: true };
}

/**
 * Auth Rate Limiter: Max 5 login/signup attempts per 15 minutes per IP
 */
export const AuthRateLimiter = {
  loginLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
  }),

  registerLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registration attempts from this IP. Please try again later.' }
  }),

  aiFeatureLimiter: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI request limit reached (10 requests/min). Please wait a moment before trying again.' }
  }),

  generalApiLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Rate limit exceeded. Please slow down your requests.' }
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
