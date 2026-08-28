/**
 * 🛡️ GSFC University CampusHire AI — Enterprise Web Application Firewall (WAF) & Threat Shield
 * Comprehensive Layer-7 Inspection Engine for SQLi, XSS, Path Traversal, Bot Protection, and Prototype Pollution.
 */

// Malicious User-Agent & Scanner Signatures
const MALICIOUS_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /wpscan/i,
  /masscan/i,
  /nmap/i,
  /acunetix/i,
  /havij/i,
  /zgrab/i,
  /gobuster/i,
  /dirbuster/i
];

// Dangerous SQL Injection Signatures
const SQLI_PATTERNS = [
  /(\b(UNION(\s+ALL)?|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b)/i,
  /(\b(WAITFOR\s+DELAY|BENCHMARK|PG_SLEEP|SLEEP\s*\()\b)/i,
  /('|\b)(OR|AND)\s+('?\w+'?|\d+)\s*=\s*('?\w+'?|\d+)/i,
  /(--|#|\/\*|\*\/|;|\bEXEC(\s|\+)+(SP_|XP_))/i
];

// Cross-Site Scripting (XSS) Signatures
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /<iframe\b/gi,
  /document\s*\.\s*(cookie|location|domain)/gi,
  /eval\s*\(/gi
];

// Path Traversal & Sensitive File Exfiltration
const TRAVERSAL_PATTERNS = [
  /(\.\.[\/\\])/,
  /(\/etc\/(passwd|shadow|hosts))/i,
  /(\/proc\/self\/environ)/i,
  /(\b(win\.ini|boot\.ini)\b)/i,
  /(\.env|\.git\/config|\.aws\/credentials)/i
];

/**
 * Deep recursive string scanner
 */
function scanValueForThreats(val, threatLog = []) {
  if (typeof val === 'string') {
    // 1. Prototype Pollution Check
    if (val.includes('__proto__') || val.includes('constructor.prototype')) {
      threatLog.push({ type: 'PROTOTYPE_POLLUTION', pattern: '__proto__' });
    }

    // 2. Traversal Check
    for (const pat of TRAVERSAL_PATTERNS) {
      if (pat.test(val)) {
        threatLog.push({ type: 'PATH_TRAVERSAL', sample: val.substring(0, 40) });
        break;
      }
    }

    // 3. XSS Check
    for (const pat of XSS_PATTERNS) {
      if (pat.test(val)) {
        threatLog.push({ type: 'XSS_ATTEMPT', sample: val.substring(0, 40) });
        break;
      }
    }

    // 4. SQL Injection Check (for query inputs, not long markdown text)
    if (val.length < 500) {
      for (const pat of SQLI_PATTERNS) {
        if (pat.test(val) && !val.includes('BTech CSE') && !val.includes('Software Development')) {
          threatLog.push({ type: 'SQLI_ATTEMPT', sample: val.substring(0, 40) });
          break;
        }
      }
    }
  } else if (Array.isArray(val)) {
    for (const item of val) {
      scanValueForThreats(item, threatLog);
    }
  } else if (val && typeof val === 'object') {
    for (const key of Object.keys(val)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        threatLog.push({ type: 'PROTOTYPE_POLLUTION_KEY', key });
      }
      scanValueForThreats(val[key], threatLog);
    }
  }
}

/**
 * Express Middleware: Enterprise WAF Shield
 */
export function wafShieldMiddleware(req, res, next) {
  const userAgent = req.headers['user-agent'] || '';
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // 1. Block Automated Penetration Scanners
  for (const botPattern of MALICIOUS_USER_AGENTS) {
    if (botPattern.test(userAgent)) {
      console.warn(`[WAF BLOCKED] Malicious Scanner Bot detected: ${userAgent} from IP: ${clientIp}`);
      return res.status(403).json({
        success: false,
        blocked: true,
        error: 'Security WAF Alert: Access denied due to unauthorized scanning signature.'
      });
    }
  }

  // 2. Scan Query Params & Request Body
  const threats = [];
  if (req.query) scanValueForThreats(req.query, threats);
  if (req.body && req.path !== '/api/intelligence/sandbox/execute') {
    scanValueForThreats(req.body, threats);
  }

  if (threats.length > 0) {
    console.warn(`[WAF THREAT BLOCKED] ${threats.length} threat vectors intercepted from IP: ${clientIp} on ${req.method} ${req.path}`, threats);
    return res.status(400).json({
      success: false,
      blocked: true,
      error: 'Security WAF Shield: Dangerous payload signature intercepted and quarantined.',
      threatCount: threats.length
    });
  }

  // Pass inspection
  res.setHeader('X-WAF-Protection', 'CampusHire-AI-Shield-v2.5; Active');
  next();
}

export default wafShieldMiddleware;
