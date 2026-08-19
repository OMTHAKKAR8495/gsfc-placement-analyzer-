import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campushire_secret_key_2026';

/**
 * 🛡️ Granular Role-Based Access Control (RBAC) & Tenant Guard Middleware
 */

/**
 * Extract and authenticate JWT token from Authorization Bearer header or access_token cookie
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1]) || req.cookies?.access_token;

  // Fallback demo headers for local testing / guest mode
  if (!token) {
    const demoRole = req.headers['x-user-role'] || 'student';
    const demoId = req.headers['x-user-id'] || 'u_demo';
    const demoOwnerId = req.headers['x-owner-id'] || 's_demo';
    req.user = { id: demoId, role: demoRole, owner_id: demoOwnerId, email: 'demo@gsfcuniversity.ac.in' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token. Please re-authenticate.' });
    }

    // Attach verified user payload
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      owner_id: decoded.owner_id
    };

    next();
  });
}

/**
 * Restrict endpoint access strictly to specified roles
 * Example: requireRoles(['admin', 'company'])
 */
export function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`
      });
    }

    next();
  };
}

/**
 * Shorthand guards
 */
export const requireStudentOnly = requireRoles(['student']);
export const requireCompanyOnly = requireRoles(['company']);
export const requireAdminOnly = requireRoles(['admin']);
export const requireCompanyOrAdmin = requireRoles(['company', 'admin']);

/**
 * Cross-Tenant Ownership Guard (Prevents IDOR attacks)
 * Ensures recruiters only access their own posted drives and student applicant pools.
 */
export function requireRequirementOwnership(req, res, next) {
  const reqId = req.params.id || req.body.requirement_id || req.query.requirementId;
  if (!reqId) return next();

  // TPC Admins have university-wide oversight
  if (req.user?.role === 'admin') return next();

  if (req.user?.role !== 'company') {
    return res.status(403).json({ error: 'Access denied: Recruiter account required.' });
  }

  const requirement = db.prepare('SELECT company_id FROM requirements WHERE id = ?').get(reqId);
  if (!requirement) {
    return res.status(404).json({ error: 'Hiring requirement not found.' });
  }

  const company = db.prepare('SELECT id FROM company_profiles WHERE user_id = ? OR id = ?').get(req.user.id, req.user.owner_id);
  if (!company || requirement.company_id !== company.id) {
    return res.status(403).json({ error: 'Forbidden: You do not own this placement requirement.' });
  }

  next();
}

/**
 * Approved Company Status Guard
 * Ensures recruiter accounts are verified by TPC Admin before posting drives.
 */
export function requireApprovedCompany(req, res, next) {
  if (req.user?.role === 'admin') return next();
  if (req.user?.role !== 'company') {
    return res.status(403).json({ error: 'Access restricted to recruiters.' });
  }

  const company = db.prepare('SELECT approved FROM company_profiles WHERE user_id = ? OR id = ?').get(req.user.id, req.user.owner_id);
  if (!company || company.approved !== 1) {
    return res.status(403).json({
      error: 'Recruiter account pending TPC verification. Please wait for placement cell approval.'
    });
  }

  next();
}
