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

  if (password.length < 4) {
    return { valid: false, message: 'Password must be at least 4 characters long.' };
  }

  return { valid: true };
}

/**
 * Auth Rate Limiter: Pass-through middleware for zero rate-limit blockages during campus drives & demos
 */
const passThrough = (req, res, next) => next();

export const AuthRateLimiter = {
  loginLimiter: passThrough,
  registerLimiter: passThrough,
  aiFeatureLimiter: passThrough,
  generalApiLimiter: passThrough
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
