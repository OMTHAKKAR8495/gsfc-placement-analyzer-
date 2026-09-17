import db from '../db/index.js';
import bcrypt from 'bcryptjs';

async function verifyMigration() {
  console.log('🧪 Starting Supabase PostgreSQL End-to-End Migration Verification...\n');

  let passed = 0;
  let failed = 0;

  async function testStep(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Users Table
  const testEmail = `verify_${Date.now()}@gsfcuniversity.ac.in`;
  const testUserId = `u_verify_${Date.now()}`;
  const testHash = await bcrypt.hash('TestPass123!', 10);

  await testStep('1. Insert & Read User from Supabase "users"', async () => {
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status, auth_provider, email_verified)
      VALUES (?, ?, ?, 'student', 'active', 'local', 1)
    `).run(testUserId, testEmail, testHash);

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(testUserId);
    if (!user || user.email !== testEmail) throw new Error('User record mismatch or not found');
  });

  // 2. Student Profiles Table
  const testStudentId = `s_verify_${Date.now()}`;
  const testRoll = `VERIFY_${Date.now().toString().slice(-5)}`;

  await testStep('2. Insert & Read Student Profile from Supabase "student_profiles"', async () => {
    await db.prepare(`
      INSERT INTO student_profiles (id, user_id, roll_number, name, phone, program, branch, cgpa, admission_year, passing_year, is_authorized)
      VALUES (?, ?, ?, 'Verification Student', '+91 99999 88888', 'BTech CSE', 'Computer Science', 9.15, 2022, 2026, 1)
    `).run(testStudentId, testUserId, testRoll);

    const student = await db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(testStudentId);
    if (!student || student.roll_number !== testRoll) throw new Error('Student record mismatch or not found');
  });

  // 3. Company Profiles Table
  const testCompUserId = `u_comp_${Date.now()}`;
  const testCompId = `c_verify_${Date.now()}`;

  await testStep('3. Insert & Read Company Profile from Supabase "company_profiles"', async () => {
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status)
      VALUES (?, ?, ?, 'company', 'active')
    `).run(testCompUserId, `recruiter_${Date.now()}@corp.com`, testHash);

    await db.prepare(`
      INSERT INTO company_profiles (id, user_id, company_name, industry, website, approved)
      VALUES (?, ?, 'Acme Cloud Corp', 'Software & Cloud', 'https://acme.com', 1)
    `).run(testCompId, testCompUserId);

    const company = await db.prepare('SELECT * FROM company_profiles WHERE id = ?').get(testCompId);
    if (!company || company.company_name !== 'Acme Cloud Corp') throw new Error('Company record mismatch');
  });

  // 4. Requirements (Job Drives) Table
  const testReqId = `req_verify_${Date.now()}`;

  await testStep('4. Insert & Read Job Requirement from Supabase "requirements"', async () => {
    await db.prepare(`
      INSERT INTO requirements (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, ctc_range, openings, deadline, job_description)
      VALUES (?, ?, 'Cloud Solutions Architect', '["BTech CSE"]', 7.5, '["AWS", "Node.js"]', '12 LPA - 16 LPA', 5, '2026-12-31', 'End-to-end cloud platform engineering.')
    `).run(testReqId, testCompId);

    const req = await db.prepare('SELECT * FROM requirements WHERE id = ?').get(testReqId);
    if (!req || req.title !== 'Cloud Solutions Architect') throw new Error('Requirement record mismatch');
  });

  // 5. Applications Table
  const testAppId = `app_verify_${Date.now()}`;

  await testStep('5. Insert & Read Application from Supabase "applications"', async () => {
    await db.prepare(`
      INSERT INTO applications (id, student_id, requirement_id, match_score, status, applied_via)
      VALUES (?, ?, ?, 95.5, 'applied', 'internal')
    `).run(testAppId, testStudentId, testReqId);

    const app = await db.prepare('SELECT * FROM applications WHERE id = ?').get(testAppId);
    if (!app || app.student_id !== testStudentId) throw new Error('Application record mismatch');
  });

  // 6. Events Table
  const testEventId = `ev_verify_${Date.now()}`;

  await testStep('6. Insert & Read Campus Event from Supabase "events"', async () => {
    await db.prepare(`
      INSERT INTO events (id, title, slug, event_type, date, venue, description)
      VALUES (?, 'GSFC Hackathon 2026', ?, 'Hackathon', '2026-10-15', 'Campus Arena', '24-hour campus innovation hackathon.')
    `).run(testEventId, `slug-${Date.now()}`);

    const event = await db.prepare('SELECT * FROM events WHERE id = ?').get(testEventId);
    if (!event || event.title !== 'GSFC Hackathon 2026') throw new Error('Event record mismatch');
  });

  // 7. Pass Tokens Table
  const testPassCode = `PASS_${Date.now().toString().slice(-6)}`;

  await testStep('7. Insert & Read Pass Token from Supabase "pass_tokens"', async () => {
    await db.prepare(`
      INSERT INTO pass_tokens (id, pass_code, event_id, guest_name, guest_email, status)
      VALUES (?, ?, ?, 'Guest Visitor', 'guest@corp.com', 'active')
    `).run(`pass_${Date.now()}`, testPassCode, testEventId);

    const pass = await db.prepare('SELECT * FROM pass_tokens WHERE pass_code = ?').get(testPassCode);
    if (!pass || pass.pass_code !== testPassCode) throw new Error('Pass token record mismatch');
  });

  // 8. Faculty Profiles Table
  const testFacUserId = `u_fac_${Date.now()}`;
  const testFacId = `fac_verify_${Date.now()}`;
  const testFacEmail = `faculty_${Date.now()}@gsfcuniversityfaculty.ac.in`;

  await testStep('8. Insert & Read Faculty Profile from Supabase "faculty_profiles"', async () => {
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, role, status)
      VALUES (?, ?, ?, 'faculty', 'active')
    `).run(testFacUserId, testFacEmail, testHash);

    await db.prepare(`
      INSERT INTO faculty_profiles (id, user_id, name, email, department, designation)
      VALUES (?, ?, 'Dr. Verified Faculty', ?, 'Computer Science & Engineering', 'Associate Professor')
    `).run(testFacId, testFacUserId, testFacEmail);

    const fac = await db.prepare('SELECT * FROM faculty_profiles WHERE id = ?').get(testFacId);
    if (!fac || fac.email !== testFacEmail) throw new Error('Faculty record mismatch');
  });

  // 9. Admin Audit Logs Table
  await testStep('9. Insert & Read Admin Audit Log from Supabase "admin_audit_logs"', async () => {
    const logId = `log_${Date.now()}`;
    await db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_user_id, admin_email, action, target_entity_type, target_entity_id)
      VALUES (?, 'u_admin_master', 'admin@gsfcuniversity.ac.in', 'TEST_VERIFY_MIGRATION', 'system', 'sys_01')
    `).run(logId);

    const log = await db.prepare('SELECT * FROM admin_audit_logs WHERE id = ?').get(logId);
    if (!log || log.action !== 'TEST_VERIFY_MIGRATION') throw new Error('Audit log record mismatch');
  });

  // 10. Blockchain Ledger Table
  await testStep('10. Insert & Read Blockchain Ledger Entry (BIGSERIAL autoincrement)', async () => {
    const docId = `doc_${Date.now()}`;
    await db.prepare(`
      INSERT INTO blockchain_ledger (doc_id, doc_type, student_name, issuing_authority, document_hash, previous_block_hash, block_hash, merkle_root, signature)
      VALUES (?, 'OFFER_LETTER', 'Om Thakkar', 'TPC Director', 'hash_doc_123', 'hash_prev_000', 'hash_curr_999', 'merkle_root_root', 'sig_verify_ok')
    `).run(docId);

    const block = await db.prepare('SELECT * FROM blockchain_ledger WHERE doc_id = ?').get(docId);
    if (!block || block.doc_id !== docId) throw new Error('Blockchain ledger mismatch');
    console.log(`      ⛓️ Created Block Number: ${block.block_number}`);
  });

  console.log(`\n======================================================`);
  console.log(`🏁 Verification Finished: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL SUPABASE POSTGRES MIGRATION TESTS PASSED 100%!');
    process.exit(0);
  }
}

verifyMigration().catch(err => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
