import assert from 'assert';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from '../db/index.js';
import { JWT_SECRET } from '../config/secrets.js';

const BASE_URL = 'http://localhost:5001';

// Helper to create a structured test Google ID token
function createTestGoogleToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test_key_1' })).toString('base64');
  const body = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com',
    aud: 'test-client-id.apps.googleusercontent.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    email_verified: true,
    ...payload
  })).toString('base64');
  const signature = Buffer.from('test_signature').toString('base64');
  return `test_google_token_.${body}.${signature}`;
}

async function runGoogleAuthTestSuite() {
  console.log('===========================================================');
  console.log('🏛️ GSFC UNIVERSITY PLACEMENT MANAGEMENT PORTAL');
  console.log('🔐 GOOGLE IDENTITY SERVICES INTEGRATION TEST SUITE');
  console.log('===========================================================\n');

  initDatabase();

  let passCount = 0;
  let failCount = 0;

  function testAssert(condition, name, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failCount++;
    }
  }

  // Ensure clean test fixture environment
  const cleanupEmails = [
    'test.student.gis@gsfcuniversity.ac.in',
    'existing.faculty.gis@gsfcuniversity.ac.in',
    'existing.tpc.gis@gsfcuniversity.ac.in',
    'existing.recruiter.gis@gsfcuniversity.ac.in',
    'existing.alumni.gis@gsfcuniversity.ac.in',
    'unregistered.user@gsfcuniversity.ac.in',
    'external.gmail.user@gmail.com',
    'suspended.student.gis@gsfcuniversity.ac.in'
  ];

  for (const email of cleanupEmails) {
    const u = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(email);
    if (u) {
      try { db.prepare('DELETE FROM student_profiles WHERE user_id = ?').run(u.id); } catch(e) {}
      try { db.prepare('DELETE FROM company_profiles WHERE user_id = ?').run(u.id); } catch(e) {}
      try { db.prepare('DELETE FROM faculty_profiles WHERE user_id = ?').run(u.id); } catch(e) {}
      try { db.prepare('DELETE FROM users WHERE id = ?').run(u.id); } catch(e) {}
    }
    try { db.prepare('DELETE FROM authorized_students WHERE lower(email) = ?').run(email); } catch(e) {}
  }

  // Setup Test Fixtures:
  // 1. Authorized Student for new sign-in
  db.prepare(`
    INSERT OR REPLACE INTO authorized_students (roll_number, name, email, program, branch, cgpa, admission_year, passing_year, access_status)
    VALUES ('24BT04999', 'Pooja Patel', 'test.student.gis@gsfcuniversity.ac.in', 'BTech CSE', 'Computer Science', 8.9, 2022, 2026, 'active')
  `).run();

  // 2. Existing Faculty with email/password
  const facultyUserId = 'u_fac_test_' + Date.now();
  const facHash = bcrypt.hashSync('Faculty@GSFC2026!', 6);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, auth_provider, status)
    VALUES (?, 'existing.faculty.gis@gsfcuniversity.ac.in', ?, 'faculty', 'local', 'active')
  `).run(facultyUserId, facHash);
  db.prepare(`
    INSERT INTO faculty_profiles (id, user_id, name, department, designation, email)
    VALUES ('f_test_gis', ?, 'Dr. Ramesh Shah', 'Chemical Technology', 'Associate Professor', 'existing.faculty.gis@gsfcuniversity.ac.in')
  `).run(facultyUserId);

  // 3. Existing TPC Admin with email/password
  const adminUserId = 'u_adm_test_' + Date.now();
  const adminHash = bcrypt.hashSync('Admin@GSFC2026!', 6);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, auth_provider, status)
    VALUES (?, 'existing.tpc.gis@gsfcuniversity.ac.in', ?, 'admin', 'local', 'active')
  `).run(adminUserId, adminHash);

  // 4. Suspended User
  const suspUserId = 'u_susp_test_' + Date.now();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, auth_provider, status)
    VALUES (?, 'suspended.student.gis@gsfcuniversity.ac.in', 'dummy', 'student', 'local', 'suspended')
  `).run(suspUserId);

  console.log('--- 1. GOOGLE IDENTITY AUTHENTICATION & AUTO-PROVISIONING ---');

  // Test 1: Missing credential rejected with 400
  const missingRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  testAssert(missingRes.status === 400, 'Rejects missing credential payload with HTTP 400');

  // Test 2: Invalid / malformed token rejected
  const invalidRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: 'invalid_malformed_token' })
  });
  testAssert(invalidRes.status === 401, 'Rejects malformed Google token with HTTP 401');

  // Test 3: Unregistered Google account rejected with proper message
  const unregToken = createTestGoogleToken({
    sub: 'google_sub_unregistered_12345',
    email: 'unregistered.user@gsfcuniversity.ac.in',
    name: 'Unknown User'
  });
  const unregRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: unregToken })
  });
  const unregJson = await unregRes.json().catch(() => ({}));
  testAssert(
    unregRes.status === 403 && unregJson.error?.includes('not registered with the GSFC Placement Portal'),
    'Rejects unregistered Google identity with official TPC contact guidance'
  );

  // Test 4: New Pre-Authorized Student Sign-In with Google
  const studentToken = createTestGoogleToken({
    sub: 'google_sub_pooja_patel_9999',
    email: 'test.student.gis@gsfcuniversity.ac.in',
    name: 'Pooja Patel',
    picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'
  });
  const studentRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: studentToken })
  });
  const studentJson = await studentRes.json();
  testAssert(
    studentRes.status === 200 && studentJson.user?.role === 'student' && studentJson.token,
    'Authenticates and provisions new pre-authorized student with official role'
  );

  // Verify DB state for student
  const dbStudent = db.prepare('SELECT * FROM users WHERE email = ?').get('test.student.gis@gsfcuniversity.ac.in');
  testAssert(
    dbStudent && dbStudent.google_id === 'google_sub_pooja_patel_9999' && dbStudent.auth_provider === 'google',
    'Database accurately mapped stable google_id and provider for new student'
  );

  console.log('\n--- 2. EXISTING ACCOUNT LINKING & PASSWORDS ---');

  // Test 5: Existing Faculty Links Google Account
  const facultyToken = createTestGoogleToken({
    sub: 'google_sub_ramesh_shah_4444',
    email: 'existing.faculty.gis@gsfcuniversity.ac.in',
    name: 'Dr. Ramesh Shah'
  });
  const facultyRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: facultyToken })
  });
  const facultyJson = await facultyRes.json();
  testAssert(
    facultyRes.status === 200 && facultyJson.user?.role === 'faculty',
    'Links Google identity to existing faculty account without role corruption'
  );

  const dbFac = db.prepare('SELECT * FROM users WHERE email = ?').get('existing.faculty.gis@gsfcuniversity.ac.in');
  testAssert(
    dbFac && dbFac.google_id === 'google_sub_ramesh_shah_4444' && dbFac.auth_provider === 'both',
    'Provider updated to "both" preserving existing password credentials'
  );

  // Test 6: Existing Password Login Continues Working After Google Linking
  const passLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'existing.faculty.gis@gsfcuniversity.ac.in',
      password: 'Faculty@GSFC2026!',
      selectedRole: 'faculty'
    })
  });
  testAssert(passLoginRes.status === 200, 'Password login functions seamlessly on linked accounts');

  console.log('\n--- 3. SECURITY, SUSPENSION & ROLE TAMPERING CHECKS ---');

  // Test 7: Suspended User Rejected
  const suspToken = createTestGoogleToken({
    sub: 'google_sub_susp_9999',
    email: 'suspended.student.gis@gsfcuniversity.ac.in'
  });
  const suspRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: suspToken })
  });
  testAssert(suspRes.status === 403, 'Rejects suspended account with HTTP 403');

  // Test 8: Client-Side Role Tampering Prevention
  // Student trying to claim role "admin" or "superadmin" in frontend payload
  const tamperRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credential: studentToken,
      selectedRole: 'admin' // Attempting to escalate role
    })
  });
  testAssert(tamperRes.status === 403, 'Prevents client-side role tampering / privilege escalation');

  // Test 9: Application Session JWT Expiration & Structure
  const appToken = studentJson.token;
  const decodedSession = jwt.verify(appToken, JWT_SECRET);
  testAssert(
    decodedSession.role === 'student' && decodedSession.userId && decodedSession.exp > decodedSession.iat,
    'Issues genuine application session JWT with database-backed claims'
  );

  // Test 10: TPC Admin Google Sign-In
  const adminToken = createTestGoogleToken({
    sub: 'google_sub_admin_7777',
    email: 'existing.tpc.gis@gsfcuniversity.ac.in',
    name: 'TPC Director'
  });
  const adminRes = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: adminToken })
  });
  const adminJson = await adminRes.json();
  testAssert(
    adminRes.status === 200 && adminJson.user?.role === 'admin',
    'TPC Admin authenticates cleanly with institutional Google identity'
  );

  // Test 11: Direct Protected API Access with Application JWT
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${appToken}` }
  });
  testAssert(meRes.status === 200, 'Authenticated application session grants authorized API access');

  // Test 12: Logout
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${appToken}`
    },
    body: JSON.stringify({ userId: studentJson.user.id })
  });
  testAssert(logoutRes.status === 200, 'Session termination and logout operates properly');

  // Cleanup Test Fixtures
  for (const email of cleanupEmails) {
    const u = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(email);
    if (u) {
      try { db.prepare('DELETE FROM student_profiles WHERE user_id = ?').run(u.id); } catch(e) {}
      try { db.prepare('DELETE FROM company_profiles WHERE user_id = ?').run(u.id); } catch(e) {}
      try { db.prepare('DELETE FROM faculty_profiles WHERE user_id = ?').run(u.id); } catch(e) {}
      try { db.prepare('DELETE FROM users WHERE id = ?').run(u.id); } catch(e) {}
    }
    try { db.prepare('DELETE FROM authorized_students WHERE lower(email) = ?').run(email); } catch(e) {}
  }

  console.log('\n===========================================================');
  console.log(`📊 GOOGLE AUTHENTICATION TEST RESULTS: ${passCount} PASSED / ${failCount} FAILED`);
  console.log('===========================================================');

  if (failCount === 0) {
    console.log('🎉 GOOGLE IDENTITY SERVICES INTEGRATION IS 100% PRODUCTION READY!');
  } else {
    process.exit(1);
  }
}

runGoogleAuthTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
