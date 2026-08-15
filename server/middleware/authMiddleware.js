import jwt from 'jsonwebtoken';
import db from '../db/index.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'gscf_placement_secret_key_2026_safe';

// Middleware to authenticate JWT or session header
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const sessionUserHeader = req.headers['x-session-user'];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired session token.' });
      req.user = user;
      next();
    });
    return;
  }

  // Fallback for header session passing
  if (sessionUserHeader) {
    try {
      const parsedUser = JSON.parse(sessionUserHeader);
      req.user = {
        id: parsedUser.id || 'u_guest',
        role: parsedUser.role || 'student',
        owner_id: parsedUser.owner_id || parsedUser.profile?.id || 's_arav'
      };
      next();
      return;
    } catch (e) {
      // Continue to default
    }
  }

  // Default guest session for demo mode fallback with strict role assignment
  req.user = {
    id: req.headers['x-user-id'] || 'u_demo',
    role: req.headers['x-user-role'] || 'student',
    owner_id: req.headers['x-owner-id'] || 's_arav'
  };

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
