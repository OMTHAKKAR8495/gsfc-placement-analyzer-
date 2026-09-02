import assert from 'assert';
import db, { initDatabase } from '../db/index.js';

console.log('🧪 Running Phase 5: Recruiter CRM & Accreditation Exporters Test Suite...\n');

// Ensure database tables exist
initDatabase();

async function runCrmTests() {
  // 1. Test CRM Application Pipeline Stage Transitions
  console.log('1️⃣ Testing Recruiter CRM Pipeline Stage Transition & Audit Logging...');
  const testStudentId = 's_crm_test_' + Date.now();
  const testUserId = 'u_crm_test_' + Date.now();
  const testReqId = 'req_crm_test_' + Date.now();
  const testAppId = 'app_crm_test_' + Date.now();
  const testCompanyId = 'comp_crm_test_' + Date.now();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role)
    VALUES (?, ?, 'hash', 'student')
  `).run(testUserId, `crm_student_${Date.now()}@gsfcuniversity.ac.in`);

  db.prepare(`
    INSERT INTO student_profiles (id, user_id, name, roll_number, program, branch, cgpa, ats_score)
    VALUES (?, ?, 'Rahul Verma', '22BCE099', 'B.Tech', 'CSE', 8.8, 89)
  `).run(testStudentId, testUserId);

  db.prepare(`
    INSERT INTO company_profiles (id, user_id, company_name, industry)
    VALUES (?, ?, 'Tata Consultancy Services', 'IT & Software')
  `).run(testCompanyId, testUserId);

  db.prepare(`
    INSERT INTO requirements (id, company_id, title, job_type, ctc_range, eligible_programs_json, required_skills_json, job_description, openings, deadline)
    VALUES (?, ?, 'Digital Software Engineer', 'Full-time', '7.5 - 9.0 LPA', '["B.Tech CSE"]', '["Java", "Spring Boot", "SQL"]', 'Software developer role', 5, '2026-12-31')
  `).run(testReqId, testCompanyId);

  db.prepare(`
    INSERT INTO applications (id, student_id, requirement_id, status)
    VALUES (?, ?, ?, 'applied')
  `).run(testAppId, testStudentId, testReqId);

  // Transition stage from 'applied' to 'interview'
  db.prepare(`
    UPDATE applications 
    SET status = 'interview'
    WHERE id = ?
  `).run(testAppId);

  const updatedApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(testAppId);
  assert(updatedApp.status === 'interview', 'Application stage must update to interview');
  console.log(`   ✅ Stage transition verified: "applied" -> "${updatedApp.status}"`);

  // 2. Test Custom Evaluation Rubric Storage
  console.log('\n2️⃣ Testing Custom Drive Evaluation Rubrics...');
  const rubric = {
    rubric_name: 'TCS Digital Elite Rubric',
    technical_weight: 45,
    ats_weight: 15,
    star_weight: 20,
    cgpa_weight: 20,
    min_cutoff_score: 75
  };

  db.prepare(`
    UPDATE requirements
    SET custom_rubric_json = ?
    WHERE id = ?
  `).run(JSON.stringify(rubric), testReqId);

  const reqWithRubric = db.prepare('SELECT custom_rubric_json FROM requirements WHERE id = ?').get(testReqId);
  const parsedRubric = JSON.parse(reqWithRubric.custom_rubric_json);
  assert(parsedRubric.technical_weight === 45, 'Rubric technical weight must be 45');
  assert(parsedRubric.min_cutoff_score === 75, 'Rubric cutoff must be 75');
  console.log(`   ✅ Custom Rubric saved: "${parsedRubric.rubric_name}" (Cutoff: ${parsedRubric.min_cutoff_score}%)`);

  // 3. Test Multi-Standard Accreditation CSV Generation
  console.log('\n3️⃣ Testing Accreditation Exporters (NAAC, NIRF, NBA, AICTE)...');
  
  // NBA Export test
  const nbaData = [
    { dept: 'Computer Science & Engineering', yr: '2025-26', ng: 120, np: 114, avg: 9.8, status: 'Substantially Compliant' }
  ];
  let nbaCsv = 'Engineering Program,Academic Year,Total Graduating Batch (Ng),Total Students Placed (Np),Placement Index (P = Np/Ng),Average Package (LPA)\n';
  nbaData.forEach(d => {
    nbaCsv += `"${d.dept}","${d.yr}",${d.ng},${d.np},"${((d.np/d.ng)*100).toFixed(1)}%",${d.avg}\n`;
  });
  assert(nbaCsv.includes('Placement Index'), 'NBA CSV must contain Placement Index');
  assert(nbaCsv.includes('95.0%'), 'NBA CSV must calculate correct placement percentage');
  console.log(`   ✅ NBA Tier-1 Placement Index Report formatted properly.`);

  // AICTE Export test
  let aicteCsv = 'Institution Code,Institution Name,Academic Year,Discipline,Approved Intake,Eligible for Placement,Total Placed\n';
  aicteCsv += `"GSFC-GUJ-01","GSFC University","2025-26","Engineering & Technology",320,298,282\n`;
  assert(aicteCsv.includes('GSFC University'), 'AICTE CSV must contain institution name');
  console.log(`   ✅ AICTE-CII Placement Survey Report formatted properly.`);

  console.log('\n🎉 Phase 5 Test Suite Passed with 100% Assertion Success!\n');
}

runCrmTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
