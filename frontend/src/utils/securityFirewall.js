/**
 * 🛡️ CampusHire AI — Client-Side Security Firewall & Anti-Tamper Shield
 * Active real-time defense against XSS, Session Tampering, Script Injection, and Input Exploits.
 */

// HTML Entity Encoder
export function sanitizeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Deep Object Sanitizer
export function sanitizePayload(data) {
  if (typeof data === 'string') {
    // Strip dangerous script and event handler patterns
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/onerror\s*=/gi, '')
      .replace(/onload\s*=/gi, '');
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizePayload(item));
  }
  if (data && typeof data === 'object') {
    const cleaned = {};
    for (const key of Object.keys(data)) {
      // Prototype Pollution Prevention
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleaned[key] = sanitizePayload(data[key]);
    }
    return cleaned;
  }
  return data;
}

// Session Integrity & Anti-Spoofing Guardian
export const SecurityGuardian = {
  validateSession: () => {
    try {
      const userRaw = localStorage.getItem('campushire_user');
      const token = localStorage.getItem('campushire_token');
      if (userRaw && !token) {
        console.warn('[SECURITY GUARDIAN] Session anomaly detected: User object without valid token. Resetting unverified session.');
        localStorage.removeItem('campushire_user');
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  sanitizeInput: (inputStr) => {
    if (!inputStr || typeof inputStr !== 'string') return '';
    return inputStr
      .replace(/<[^>]*>?/gm, '') // Strip HTML tags
      .trim();
  }
};

export default SecurityGuardian;
