import db, { initDatabase } from '../db/index.js';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5001';

async function runProductionReadinessAudit() {
  await initDatabase();

  console.log('===========================================================');
  console.log('🏛️ GSFC UNIVERSITY PLACEMENT MANAGEMENT PORTAL');
  console.log('🚀 PRODUCTION READINESS & REAL-DATA INTEGRITY AUDIT SUITE');
  console.log('===========================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failCount++;
    }
  }

  // 1. Audit Database Tables for Zero Demo Data
  console.log('--- 1. DATABASE DEMO RECORD ZERO-TOLERANCE AUDIT ---');
  const countStudents = parseInt((await db.prepare('SELECT COUNT(*) as c FROM student_profiles').get())?.c || '0', 10);
  const countCompanies = parseInt((await db.prepare('SELECT COUNT(*) as c FROM company_profiles').get())?.c || '0', 10);
  const countRequirements = parseInt((await db.prepare('SELECT COUNT(*) as c FROM requirements').get())?.c || '0', 10);
  const countApplications = parseInt((await db.prepare('SELECT COUNT(*) as c FROM applications').get())?.c || '0', 10);
  const countAlumni = parseInt((await db.prepare('SELECT COUNT(*) as c FROM alumni_profiles').get())?.c || '0', 10);
  const countFaculty = parseInt((await db.prepare('SELECT COUNT(*) as c FROM faculty_profiles').get())?.c || '0', 10);
  const countMails = parseInt((await db.prepare('SELECT COUNT(*) as c FROM company_student_mails').get())?.c || '0', 10);
  const countPasses = parseInt((await db.prepare('SELECT COUNT(*) as c FROM pass_tokens').get())?.c || '0', 10);

  assert(countStudents === 0, `Zero demo students in database (Found: ${countStudents})`);
  assert(countCompanies === 0, `Zero demo companies in database (Found: ${countCompanies})`);
  assert(countRequirements === 0, `Zero demo requirements in database (Found: ${countRequirements})`);
  assert(countApplications === 0, `Zero demo applications in database (Found: ${countApplications})`);
  assert(countAlumni === 0, `Zero demo alumni in database (Found: ${countAlumni})`);
  assert(countFaculty === 0, `Zero demo faculty profiles in database (Found: ${countFaculty})`);
  assert(countMails === 0, `Zero demo student mails in database (Found: ${countMails})`);
  assert(countPasses === 0, `Zero demo event passes in database (Found: ${countPasses})`);

  // 2. Audit Admin Bootstrapping
  console.log('\n--- 2. OFFICIAL TPC ADMIN BOOTSTRAP VERIFICATION ---');
  const adminUsers = await db.prepare("SELECT email, role FROM users WHERE role IN ('admin', 'superadmin')").all();
  assert(adminUsers.length >= 2, `Production TPC administrative accounts exist (Count: ${adminUsers.length})`);
  
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gsfcuniversity.ac.in', password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@GSFC2026!' })
  });
  const adminLoginJson = await adminLoginRes.json();
  assert(adminLoginRes.status === 200 && adminLoginJson.token, 'TPC Admin authenticated successfully with official credentials');

  const superadminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@gsfcuniversity.ac.in', password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@GSFC2026!' })
  });
  const superadminLoginJson = await superadminLoginRes.json();
  assert(superadminLoginRes.status === 200 && superadminLoginJson.token, 'TPC Superadmin authenticated successfully with official credentials');

  const adminToken = adminLoginJson.token;

  // 3. Audit Empty-State API Resilience
  console.log('\n--- 3. EMPTY-DATABASE API RESILIENCE AUDIT ---');
  const emptyReqRes = await fetch(`${BASE_URL}/api/company/requirements`);
  const emptyReqJson = await emptyReqRes.json();
  assert(emptyReqRes.status === 200 && Array.isArray(emptyReqJson) && emptyReqJson.length === 0, 'Requirements API returns empty array [] on clean DB');

  const emptyCompRes = await fetch(`${BASE_URL}/api/admin/pending-companies`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const emptyCompJson = await emptyCompRes.json();
  assert(emptyCompRes.status === 200 && Array.isArray(emptyCompJson) && emptyCompJson.length === 0, 'Admin Pending Companies API returns empty array [] on clean DB');

  const adminMetricsRes = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminMetricsJson = await adminMetricsRes.json();
  assert(adminMetricsRes.status === 200 && (adminMetricsJson.totalStudents === 0 || adminMetricsJson.totalApplications === 0 || adminMetricsJson.totalCompanies === 0), 'Admin Dashboard analytics endpoint computes real 0 statistics gracefully without crashing');

  console.log('\n--- 4. END-TO-END REAL DATA LIFECYCLE VALIDATION ---');
  
  // A. Admin pre-authorizes student (Institutional TPC Governance policy)
  const testStudentEmail = `test_student_${Date.now()}@gsfcuniversity.ac.in`;
  const testRollNumber = `25BT${Math.floor(1000 + Math.random() * 9000)}`;

  const authStudentRes = await fetch(`${BASE_URL}/api/admin/authorized-students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      roll_number: testRollNumber,
      email: testStudentEmail,
      name: 'Real Test Student',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.75,
      passing_year: 2029,
      admission_year: 2025,
      access_status: 'active'
    })
  });
  assert(authStudentRes.status === 200, 'TPC Admin authorized verified student enrollment number in portal');

  // B. Student Registers Account
  const studentRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testStudentEmail,
      password: 'RealSecurePassword@2026',
      role: 'student',
      name: 'Real Test Student',
      phone: '+91 98980 12345',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.75,
      roll_number: testRollNumber
    })
  });
  const studentRegJson = await studentRegRes.json();
  assert(studentRegRes.status === 200 && studentRegJson.token, 'Real student registered with genuine credentials & structured profile');

  // C. Company Register
  const testCompanyEmail = `recruiter_${Date.now()}@tatachemicals.com`;
  const compRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testCompanyEmail,
      password: 'CompanyPass@2026',
      role: 'company',
      company_name: 'Tata Chemicals Ltd',
      industry: 'Chemical Engineering & Process Manufacturing',
      website: 'https://tatachemicals.com',
      phone: '+91 22 6665 8282'
    })
  });
  const compRegJson = await compRegRes.json();
  assert(compRegRes.status === 200 && compRegJson.token, 'Real recruiter registered company profile');

  const compProf = await db.prepare('SELECT id FROM company_profiles WHERE user_id = ?').get(compRegJson.user?.id);
  const compProfileId = compProf ? compProf.id : (compRegJson.user?.profile?.id || compRegJson.user?.owner_id);

  // D. Admin approves company & assigns Starter Subscription
  if (compProfileId) {
    const approveRes = await fetch(`${BASE_URL}/api/admin/approve-company`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}` 
      },
      body: JSON.stringify({ company_id: compProfileId, action: 'approve' })
    });
    assert(approveRes.status === 200, 'TPC Admin approved newly registered company');

    // Grant Active Subscription to Company
    await db.prepare(`
      INSERT INTO company_subscriptions (id, company_id, plan_id, plan_name, started_at, expires_at, postings_used, max_postings, status)
      VALUES (?, ?, 'plan_gold', 'Gold Enterprise Sovereign', now(), (now() + INTERVAL '60 days'), 0, -1, 'active')
      ON CONFLICT (id) DO UPDATE SET status = 'active'
    `).run('sub_' + compProfileId, compProfileId);
  }

  // E. Company Posts Requirement
  const postReqRes = await fetch(`${BASE_URL}/api/company/requirements`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      company_id: compProfileId,
      title: 'Graduate Chemical Process Engineer',
      eligible_programs: ['BTech Chemical', 'BTech Mechanical', 'BTech CSE'],
      min_cgpa: 7.0,
      required_skills: ['Thermodynamics', 'Process Simulation', 'Chemical Safety'],
      ctc_range: '₹7,50,000 - ₹9,00,000 PA',
      openings: 10,
      deadline: '2026-12-31',
      job_description: 'Official campus recruitment for Graduate Trainee Engineers at Mithapur / Vadodara plants.',
      company_logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120',
      company_website: 'https://tatachemicals.com',
      company_email: testCompanyEmail,
      company_phone: '+91 22 6665 8282',
      question_bank: [
        { question: 'Explain process heat transfer in shell and tube exchangers.', category: 'Technical' },
        { question: 'How do you handle distillation column pressure fluctuations?', category: 'Technical' },
        { question: 'What safety protocols apply to hazardous fluid transport?', category: 'Safety' },
        { question: 'Describe your final year chemical engineering project.', category: 'Project' },
        { question: 'Why do you want to join Tata Chemicals?', category: 'HR' }
      ]
    })
  });
  const postReqJson = await postReqRes.json();
  const requirementId = postReqJson.requirement?.id || postReqJson.id || postReqJson.requirementId;
  assert((postReqRes.status === 200 || postReqRes.status === 201) && requirementId, 'Recruiter posted legitimate placement requirement with 5-question bank');

  // F. Student Applies
  const studentToken = studentRegJson.token;
  const applyRes = await fetch(`${BASE_URL}/api/student/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ requirement_id: requirementId })
  });
  assert(applyRes.status === 200 || applyRes.status === 201, 'Student applied for active campus placement drive');

  // G. Verify Persistence & Database Linkage
  const appRecord = await db.prepare(`
    SELECT a.id, s.name as student_name, r.title as drive_title, c.company_name
    FROM applications a
    JOIN student_profiles s ON a.student_id = s.id
    JOIN requirements r ON a.requirement_id = r.id
    JOIN company_profiles c ON r.company_id = c.id
    WHERE a.requirement_id = ?
  `).get(requirementId);

  assert(appRecord && appRecord.student_name === 'Real Test Student', 'Real-data relationships persisted accurately across Users -> Profiles -> Requirements -> Applications');

  // H. Cleanup Temporary Validation Records
  console.log('\n--- 5. TEMPORARY VALIDATION RECORD TEARDOWN ---');
  await db.prepare('DELETE FROM applications WHERE requirement_id = ?').run(requirementId);
  await db.prepare('DELETE FROM requirements WHERE id = ?').run(requirementId);
  await db.prepare('DELETE FROM company_subscriptions WHERE company_id = ?').run(compProfileId);
  await db.prepare('DELETE FROM company_profiles WHERE user_id = ?').run(compRegJson.user?.id);
  await db.prepare('DELETE FROM student_profiles WHERE user_id = ?').run(studentRegJson.user?.id);
  await db.prepare('DELETE FROM authorized_students WHERE lower(roll_number) = ?').run(testRollNumber.toLowerCase());
  await db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(studentRegJson.user?.id, compRegJson.user?.id);

  const finalCheckStudents = parseInt((await db.prepare('SELECT COUNT(*) as c FROM student_profiles').get())?.c || '0', 10);
  const finalCheckCompanies = parseInt((await db.prepare('SELECT COUNT(*) as c FROM company_profiles').get())?.c || '0', 10);
  assert(finalCheckStudents === 0 && finalCheckCompanies === 0, 'Cleaned temporary validation records; database returned to pristine clean state');

  console.log('\n===========================================================');
  console.log(`📊 FINAL PRODUCTION AUDIT RESULTS: ${passCount} PASSED / ${failCount} FAILED`);
  console.log('===========================================================');

  if (failCount === 0) {
    console.log('🎉 PORTAL IS 100% READY FOR LIVE GSFC UNIVERSITY DATA ENTRY!');
  } else {
    console.error('⚠️ Some checks failed. Please review audit output.');
    process.exit(1);
  }
}

runProductionReadinessAudit().catch(err => {
  console.error('Unhandled audit error:', err);
  process.exit(1);
});
