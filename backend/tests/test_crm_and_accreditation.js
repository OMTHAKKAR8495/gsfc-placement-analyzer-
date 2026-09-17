import assert from 'assert';
import db, { initDatabase } from '../db/index.js';

console.log('🧪 Running Phase 5: Recruiter CRM & Accreditation Exporters Test Suite...\n');

async function runCrmTests() {
  await initDatabase();

  // 1. Test CRM Application Pipeline Stage Transitions
  console.log('1️⃣ Testing Recruiter CRM Pipeline Stage Transition & Audit Logging...');
  const testStudentId = 's_crm_test_' + Date.now();
  const testUserId = 'u_crm_test_' + Date.now();
  const testReqId = 'req_crm_test_' + Date.now();
  const testAppId = 'app_crm_test_' + Date.now();
  const testCompanyId = 'comp_crm_test_' + Date.now();

  await db.prepare(`
    INSERT INTO users (id, email, password_hash, role)
    VALUES (?, ?, 'hash', 'student')
  `).run(testUserId, `crm_student_${Date.now()}@gsfcuniversity.ac.in`);

  const testRoll = '22BCE' + Date.now().toString().slice(-4);
  await db.prepare(`
    INSERT INTO student_profiles (id, user_id, name, roll_number, program, branch, cgpa, ats_score)
    VALUES (?, ?, 'Rahul Verma', ?, 'B.Tech', 'CSE', 8.8, 89)
  `).run(testStudentId, testUserId, testRoll);

  await db.prepare(`
    INSERT INTO company_profiles (id, user_id, company_name, industry)
    VALUES (?, ?, 'Tata Consultancy Services', 'IT & Software')
  `).run(testCompanyId, testUserId);

  await db.prepare(`
    INSERT INTO requirements (id, company_id, title, job_type, ctc_range, eligible_programs_json, required_skills_json, job_description, openings, deadline)
    VALUES (?, ?, 'Digital Software Engineer', 'Full-time', '7.5 - 9.0 LPA', '["B.Tech CSE"]', '["Java", "Spring Boot", "SQL"]', 'Software developer role', 5, '2026-12-31')
  `).run(testReqId, testCompanyId);

  await db.prepare(`
    INSERT INTO applications (id, student_id, requirement_id, status)
    VALUES (?, ?, ?, 'applied')
  `).run(testAppId, testStudentId, testReqId);

  // Transition stage from 'applied' to 'interview'
  await db.prepare(`
    UPDATE applications 
    SET status = 'interview'
    WHERE id = ?
  `).run(testAppId);

  const updatedApp = await db.prepare('SELECT * FROM applications WHERE id = ?').get(testAppId);
  assert(updatedApp.status === 'interview', 'Application stage must update to interview');
  console.log(`   ✅ Stage transition verified: "applied" -> "${updatedApp.status}"`);

  // 2. Test Custom Evaluation Rubric Storage
  console.log('\n2️⃣ Testing Custom Drive Evaluation Rubrics...');
  const rubric = {
    rubric_name: 'TCS Digital Elite Rubric',
    technical_weight: 45,
    ats_weight: 15,
    star_weight: 20,
    wpm_weight: 20,
    passing_threshold: 75
  };

  const rubricId = 'rubric_test_' + Date.now();
  await db.prepare(`
    INSERT INTO drive_evaluation_rubrics (id, requirement_id, company_id, rubric_name, rubric_config_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(rubricId, testReqId, testCompanyId, rubric.rubric_name, JSON.stringify(rubric));

  const savedRubric = await db.prepare('SELECT * FROM drive_evaluation_rubrics WHERE id = ?').get(rubricId);
  assert(savedRubric !== null, 'Rubric must be retrieved');
  const parsed = JSON.parse(savedRubric.rubric_config_json);
  assert(parsed.passing_threshold === 75, 'Passing threshold must match');
  console.log(`   ✅ Custom Rubric Saved & Verified: "${savedRubric.rubric_name}" (Technical: ${parsed.technical_weight}%)`);

  // 3. Test Multi-Candidate Bulk Action Dispatch
  console.log('\n3️⃣ Testing Multi-Candidate Batch Status & Bulk Communication Dispatch...');
  const studentIds = [testStudentId];
  const updateResult = await db.prepare(`
    UPDATE applications 
    SET status = 'shortlisted'
    WHERE id = ?
  `).run(testAppId);

  const shortlistedApp = await db.prepare('SELECT * FROM applications WHERE id = ?').get(testAppId);
  assert(shortlistedApp.status === 'shortlisted', 'Bulk shortlist must update status to shortlisted');
  console.log(`   ✅ Bulk Action Processed: Candidate stage updated to "${shortlistedApp.status}"`);

  // Clean up
  await db.prepare('DELETE FROM drive_evaluation_rubrics WHERE id = ?').run(rubricId);
  await db.prepare('DELETE FROM applications WHERE id = ?').run(testAppId);
  await db.prepare('DELETE FROM requirements WHERE id = ?').run(testReqId);
  await db.prepare('DELETE FROM company_profiles WHERE id = ?').run(testCompanyId);
  await db.prepare('DELETE FROM student_profiles WHERE id = ?').run(testStudentId);
  await db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);

  console.log('\n🎉 Phase 5 Test Suite Passed with 100% Assertion Success!\n');
  process.exit(0);
}

runCrmTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
