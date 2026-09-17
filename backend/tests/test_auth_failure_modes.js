import http from 'http';
import app from '../index.js';

console.log('🧪 Running Comprehensive Auth Failure Modes & Fast Role Sign-In Test Suite...\n');

const rolesToTest = [
  { roleId: 'student_roll', role: 'student', email: '24bt04171@gsfcuniversity.ac.in', pass: 'password123', label: '🎓 Student Candidate' },
  { roleId: 'placed_company', role: 'company', email: 'gsfclimited@gmail.com', pass: 'password123', label: '🏢 GSFC Ltd Recruiter' },
  { roleId: 'outside_company', role: 'company', email: 'recruiter.google@company.com', pass: 'password123', label: '🌐 Outside Recruiter (Google)' },
  { roleId: 'faculty', role: 'faculty', email: 'faculty.cse@gsfcuniversity.ac.in', pass: 'password123', label: '🏛️ Faculty Coordinator' },
  { roleId: 'admin', role: 'admin', email: 'admin@gsfcuniversity.ac.in', pass: 'password123', label: '🛡️ TPC Admin' },
  { roleId: 'superadmin', role: 'superadmin', email: 'superadmin@gsfcuniversity.ac.in', pass: 'password123', label: '👑 Super Administrator' },
  { roleId: 'alumni', role: 'alumni', email: 'priya.patel@alumni.gsfc.ac.in', pass: 'password123', label: '🎓 Alumni Mentor' },
  { roleId: 'fest', role: 'fest', email: 'fest_attendee@msu.ac.in', pass: 'password123', label: '🎪 Campus Fest Visitor' },
  { roleId: 'security', role: 'security', email: 'security@gsfcuniversity.ac.in', pass: 'password123', label: '🛡️ Campus Security Officer' },
];

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  let passed = 0;
  let failed = 0;

  console.log('--- TEST GROUP 1: Real Credentials for All 1-Click Fast Sign-In Roles ---');
  for (const item of rolesToTest) {
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-load-test': 'true' },
        body: JSON.stringify({ email: item.email, password: item.pass, selectedRole: item.role })
      });
      const data = await res.json();
      if (res.status === 200 && data.user && data.token) {
        console.log(`✅ [PASS] ${item.label} (${item.email}) -> Logged in successfully`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${item.label} (${item.email}) -> Status ${res.status}: ${JSON.stringify(data)}`);
        failed++;
      }
    } catch (e) {
      console.error(`❌ [ERROR] ${item.label} -> ${e.message}`);
      failed++;
    }
  }

  console.log('\n--- TEST GROUP 2: Wrong Password Security Check ---');
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-load-test': 'true' },
      body: JSON.stringify({ email: '24bt04171@gsfcuniversity.ac.in', password: 'WrongPassword999!', selectedRole: 'student' })
    });
    const data = await res.json();
    if (res.status === 401 && (data.incorrectPassword || data.error?.includes('password') || data.error?.includes('Authentication failed'))) {
      console.log(`✅ [PASS] Wrong password correctly rejected with HTTP 401: "${data.error}"`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Wrong password check failed: HTTP ${res.status} ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (e) {
    console.error(`❌ [ERROR] Wrong password check -> ${e.message}`);
    failed++;
  }

  console.log('\n--- TEST GROUP 3: Non-Existent Account Check ---');
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-load-test': 'true' },
      body: JSON.stringify({ email: 'nonexistent.student.999@gsfcuniversity.ac.in', password: 'password123', selectedRole: 'student' })
    });
    const data = await res.json();
    if (res.status === 404 && data.accountNotFound) {
      console.log(`✅ [PASS] Non-existent account correctly rejected with HTTP 404: "${data.error}"`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Non-existent account check failed: HTTP ${res.status} ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (e) {
    console.error(`❌ [ERROR] Non-existent account check -> ${e.message}`);
    failed++;
  }

  console.log('\n--- TEST GROUP 4: Missing Fields Check ---');
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-load-test': 'true' },
      body: JSON.stringify({ email: '', password: '' })
    });
    const data = await res.json();
    if (res.status === 400) {
      console.log(`✅ [PASS] Empty credentials correctly rejected with HTTP 400: "${data.error}"`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Empty credentials check failed: HTTP ${res.status} ${JSON.stringify(data)}`);
      failed++;
    }
  } catch (e) {
    console.error(`❌ [ERROR] Empty credentials check -> ${e.message}`);
    failed++;
  }

  server.close(() => {
    console.log(`\n======================================================`);
    console.log(`📊 AUTH FAILURE MODES & FAST ROLE SIGN-IN RESULTS: ${passed} PASSED / ${failed} FAILED`);
    console.log(`======================================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  });
});
