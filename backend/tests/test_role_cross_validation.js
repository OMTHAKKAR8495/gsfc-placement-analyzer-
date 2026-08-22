import assert from 'assert';

const BASE_URL = 'http://localhost:5001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: res.status, json, text };
}

async function runRoleValidationTests() {
  console.log('================================================================================');
  console.log('🔒 RUNNING ROLE CROSS-VALIDATION & PORTAL ACCESS CONTROL TEST SUITE');
  console.log('================================================================================\n');

  let passed = 0;
  let total = 0;

  function check(desc, condition, detail = '') {
    total++;
    if (condition) {
      console.log(`✅ [TEST ${total}] ${desc} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [TEST ${total}] ${desc} FAILED! ${detail}`);
      throw new Error(`Test Failure: ${desc}`);
    }
  }

  // 1. Student legitimate login via student portal
  const s1 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'thakkar_om@gmail.com', password: 'password123', selectedRole: 'student' })
  });
  check('Student legitimate login via Student portal', s1.status === 200 && s1.json?.user?.role === 'student');

  // 2. Student unauthorized attempt via Faculty portal
  const s2 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'thakkar_om@gmail.com', password: 'password123', selectedRole: 'faculty' })
  });
  check('Student blocked from Faculty portal with 403', s2.status === 403 && s2.json?.error?.includes('registered as a student'), s2.json?.error);

  // 3. Student unauthorized attempt via Company Recruiter portal
  const s3 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'thakkar_om@gmail.com', password: 'password123', selectedRole: 'company' })
  });
  check('Student blocked from Recruiter portal with 403', s3.status === 403 && s3.json?.error?.includes('registered as a student'), s3.json?.error);

  // 4. Student unauthorized attempt via Admin portal
  const s4 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'thakkar_om@gmail.com', password: 'password123', selectedRole: 'admin' })
  });
  check('Student blocked from Admin portal with 403', s4.status === 403 && s4.json?.error?.includes('registered as a student'), s4.json?.error);

  // 5. Faculty legitimate login via Faculty portal
  const f1 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'faculty.cse@gsfcuniversity.ac.in', password: 'password123', selectedRole: 'faculty' })
  });
  check('Faculty legitimate login via Faculty portal', f1.status === 200 && f1.json?.user?.role === 'faculty');

  // 6. Faculty unauthorized attempt via Student portal
  const f2 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'faculty.cse@gsfcuniversity.ac.in', password: 'password123', selectedRole: 'student' })
  });
  check('Faculty blocked from Student portal with 403', f2.status === 403 && f2.json?.error?.includes('registered as a faculty'), f2.json?.error);

  // 7. Company Recruiter legitimate login via Recruiter portal
  const c1 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'gsfclimited@gmail.com', password: 'password123', selectedRole: 'company' })
  });
  check('Company Recruiter legitimate login via Recruiter portal', c1.status === 200 && c1.json?.user?.role === 'company');

  // 8. Company Recruiter unauthorized attempt via Faculty portal
  const c2 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'gsfclimited@gmail.com', password: 'password123', selectedRole: 'faculty' })
  });
  check('Company Recruiter blocked from Faculty portal with 403', c2.status === 403 && c2.json?.error?.includes('registered as a company recruiter'), c2.json?.error);

  // 9. Admin legitimate login via Admin portal
  const a1 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@gsfcuniversity.ac.in', password: 'password123', selectedRole: 'admin' })
  });
  check('Admin legitimate login via Admin portal', a1.status === 200 && a1.json?.user?.role === 'admin');

  // 10. Admin unauthorized attempt via Student portal
  const a2 = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@gsfcuniversity.ac.in', password: 'password123', selectedRole: 'student' })
  });
  check('Admin blocked from Student portal with 403', a2.status === 403 && a2.json?.error?.includes('registered as an admin'), a2.json?.error);

  // 11. Google Sign-In with Role Cross-Validation
  const g1 = await request('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ email: 'thakkar_om@gmail.com', name: 'Om Thakkar', selectedRole: 'faculty' })
  });
  check('Google Sign-In blocked when attempting wrong role (Student trying Faculty)', g1.status === 403 && g1.json?.error?.includes('registered as a student'), g1.json?.error);

  console.log('\n================================================================================');
  console.log(`🎉 ALL ${passed}/${total} ROLE CROSS-VALIDATION SECURITY TESTS PASSED!`);
  console.log('================================================================================\n');
}

runRoleValidationTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
