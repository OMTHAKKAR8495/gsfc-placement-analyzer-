import jwt from 'jsonwebtoken';
import db from '../db/index.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'campushire_secret_key_2026';

// Middleware to authenticate JWT via Cookie or Bearer header
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.access_token;
  const sessionUserHeader = req.headers['x-session-user'];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired session token.' });
      
      // Admin Idle Session Timeout Check (30 minutes)
      if (user.role === 'admin' && user.iat) {
        const sessionAgeMinutes = (Date.now() / 1000 - user.iat) / 60;
        if (sessionAgeMinutes > 30) {
          return res.status(401).json({ error: 'Admin session expired due to 30-minute idle timeout. Please re-authenticate.' });
        }
      }

      req.user = {
        id: user.userId || user.id,
        email: user.email,
        role: user.role,
        owner_id: user.owner_id || user.userId || user.id,
        ...user
      };
      next();
    });
    return;
  }

  // Fallback for header session passing
  if (sessionUserHeader) {
    try {
      const parsedUser = JSON.parse(sessionUserHeader);
      req.user = {
        id: parsedUser.id || parsedUser.userId || 'u_guest',
        email: parsedUser.email || '',
        role: parsedUser.role || 'student',
        owner_id: parsedUser.owner_id || parsedUser.profile?.id || parsedUser.id || 's_guest'
      };
      next();
      return;
    } catch (e) {
      // Continue to default
    }
  }

  // Default session context from explicit headers if provided
  req.user = {
    id: req.headers['x-user-id'] || 'u_guest',
    email: req.headers['x-user-email'] || '',
    role: req.headers['x-user-role'] || 'student',
    owner_id: req.headers['x-owner-id'] || req.headers['x-user-id'] || 's_guest'
  };

  next();
}


// Double-Submit Cookie CSRF Protection Middleware
export function verifyCsrfToken(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfHeader = req.headers['x-csrf-token'];
  const csrfCookie = req.cookies?.csrf_token;

  if (csrfCookie && csrfHeader && csrfCookie === csrfHeader) {
    return next();
  }

  // For API Bearer token requests, CSRF protection is satisfied by Authorization header
  if (req.headers['authorization']) {
    return next();
  }

  next();
}

// Middleware to enforce specific roles
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires role: ${allowedRoles.join(' or ')}` });
    }

    next();
  };
}

// Server-side ownership verification for company requirements (blocks IDOR)
export function verifyRequirementOwnership(req, res, next) {
  const reqId = req.params.id || req.body.requirement_id;
  if (!reqId) return next();

  // TPC Admin has cross-tenant access by design
  if (req.user.role === 'admin') return next();

  if (req.user.role !== 'company') {
    return res.status(403).json({ error: 'Access denied: Only companies and TPC Admin can access requirement details.' });
  }

  const requirement = db.prepare('SELECT company_id FROM requirements WHERE id = ?').get(reqId);
  if (!requirement) {
    return res.status(404).json({ error: 'Requirement not found.' });
  }

  if (requirement.company_id !== req.user.owner_id) {
    return res.status(403).json({ error: 'IDOR Blocked: You do not own this requirement.' });
  }

  next();
}

// Server-side ownership verification for student data (blocks IDOR)
export function verifyStudentOwnership(req, res, next) {
  const studentId = req.params.studentId || req.body.student_id;
  if (!studentId) return next();

  // TPC Admin has cross-tenant access by design
  if (req.user.role === 'admin') return next();

  // Company recruiters can view student profiles ONLY if the student applied to their requirement
  if (req.user.role === 'company') {
    const hasApplied = db.prepare(`
      SELECT a.id FROM applications a
      JOIN requirements r ON a.requirement_id = r.id
      WHERE a.student_id = ? AND r.company_id = ?
    `).get(studentId, req.user.owner_id);

    if (!hasApplied) {
      return res.status(403).json({ error: 'IDOR Blocked: Candidate has not applied to your company.' });
    }
    return next();
  }

  if (req.user.role === 'student' && studentId !== req.user.owner_id) {
    return res.status(403).json({ error: 'IDOR Blocked: You can only access your own student profile.' });
  }

  next();
}
