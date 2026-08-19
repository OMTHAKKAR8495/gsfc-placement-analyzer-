import assert from 'assert';
import jwt from 'jsonwebtoken';
import { requireRoles } from '../middleware/rbac.js';

console.log('🧪 Running Suite 3: Unit Tests for Role-Based Access Control (RBAC) & Security...');

function runRbacSecurityTests() {
  const adminRoleGuard = requireRoles(['admin']);
  const studentRoleGuard = requireRoles(['student']);
  const recruiterRoleGuard = requireRoles(['company']);

  // Mock Request / Response helpers
  const createMockReqRes = (userRole) => {
    const req = { user: userRole ? { id: 'u_123', role: userRole } : null };
    let statusCode = 200;
    let jsonPayload = null;
    let nextCalled = false;

    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => { jsonPayload = data; }
        };
      }
    };

    const next = () => { nextCalled = true; };
    return { req, res, getStatus: () => statusCode, getPayload: () => jsonPayload, isNext: () => nextCalled, next };
  };

  // Test 1: Student trying to access Admin API (Should be 403 Forbidden)
  const studentAttempt = createMockReqRes('student');
  adminRoleGuard(studentAttempt.req, studentAttempt.res, studentAttempt.next);
  assert(studentAttempt.getStatus() === 403, 'Student should be blocked from Admin routes with 403');
  assert(!studentAttempt.isNext(), 'Next() should not be called for unauthorized role');
  console.log('   ✅ Unauthorized Role Blocked: Student blocked from Admin API with 403 Forbidden');

  // Test 2: Admin accessing Admin API (Should be 200 Next)
  const adminAttempt = createMockReqRes('admin');
  adminRoleGuard(adminAttempt.req, adminAttempt.res, adminAttempt.next);
  assert(adminAttempt.isNext(), 'Admin should be allowed through Admin guard');
  console.log('   ✅ Authorized Role Allowed: Admin permitted through Admin guard');

  // Test 3: Recruiter accessing Recruiter Guard
  const recruiterAttempt = createMockReqRes('company');
  recruiterRoleGuard(recruiterAttempt.req, recruiterAttempt.res, recruiterAttempt.next);
  assert(recruiterAttempt.isNext(), 'Recruiter permitted through Recruiter guard');
  console.log('   ✅ Recruiter permitted through Recruiter guard');

  // Test 4: Unauthenticated Request (Should be 401 Unauthorized)
  const unauthAttempt = createMockReqRes(null);
  studentRoleGuard(unauthAttempt.req, unauthAttempt.res, unauthAttempt.next);
  assert(unauthAttempt.getStatus() === 401, 'Unauthenticated request should return 401');
  console.log('   ✅ Unauthenticated request blocked with 401 Unauthorized');

  console.log('🎉 Suite 3 (RBAC Security & Role Isolation): ALL TESTS PASSED!\n');
}

runRbacSecurityTests();
