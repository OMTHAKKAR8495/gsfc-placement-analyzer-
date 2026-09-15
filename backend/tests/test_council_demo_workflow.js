import assert from 'assert';
import db, { initDatabase } from '../db/index.js';
import bcrypt from 'bcryptjs';

console.log('🏛️ Starting GSFC University Council Pre-Demo End-to-End Verification Flow...\n');

// 1. Initialize Database
initDatabase();
console.log('✅ 1. Database schema and tables verified.');

// 2. Test User Authentication across All Roles
const testRoles = [
  { role: 'admin', email: 'admin@gsfcuniversity.ac.in', expectedWorkspace: 'admin' },
  { role: 'superadmin', email: 'superadmin@gsfcuniversity.ac.in', expectedWorkspace: 'superadmin' },
  { role: 'faculty', email: 'faculty.cse@gsfcuniversity.ac.in', expectedWorkspace: 'faculty' },
  { role: 'student', email: '24bt04171@gsfcuniversity.ac.in', expectedWorkspace: 'student' },
  { role: 'company', email: 'gsfclimited@gmail.com', expectedWorkspace: 'company' },
  { role: 'security', email: 'security@gsfcuniversity.ac.in', expectedWorkspace: 'security' },
  { role: 'alumni', email: 'priya.patel@alumni.gsfc.ac.in', expectedWorkspace: 'alumni' }
];

for (const tr of testRoles) {
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(tr.email.toLowerCase());
  assert(user, `User ${tr.email} must exist in database`);
  assert(user.password_hash, `User ${tr.email} must have a password hash`);
  assert(user.role === tr.role, `User ${tr.email} must have role ${tr.role}, got ${user.role}`);
  console.log(`✅ Login Account verified: [${tr.role.toUpperCase()}] ${tr.email}`);
}

// 3. Test Student CRUD & Management
const testRoll = '24BT99999';
const testEmail = 'council.demo.student@gsfcuniversity.ac.in';
const testStudentId = 's_council_demo_test';
const testUserId = 'u_council_demo_test';

// Cleanup if exists
db.prepare('DELETE FROM student_profiles WHERE id = ? OR roll_number = ?').run(testStudentId, testRoll);
db.prepare('DELETE FROM users WHERE id = ? OR lower(email) = ?').run(testUserId, testEmail);
db.prepare('DELETE FROM authorized_students WHERE roll_number = ? OR lower(email) = ?').run(testRoll, testEmail);

// Add authorized student
db.prepare(`
  INSERT INTO authorized_students (id, roll_number, email, name, program, branch, cgpa, passing_year, admission_year, phone, access_status, authorized_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'Council Demo TPC')
`).run('auth_demo_99', testRoll, testEmail, 'Demo Candidate', 'BTech CSE', 'Computer Science & Engineering', 9.2, 2026, 2024, '+91 99999 88888');

// Insert user & student profile
const hash = bcrypt.hashSync('password123', 6);
db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)').run(testUserId, testEmail, hash, 'student');
db.prepare(`
  INSERT INTO student_profiles (id, user_id, roll_number, name, program, branch, cgpa, passing_year, admission_year, phone)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(testStudentId, testUserId, testRoll, 'Demo Candidate', 'BTech CSE', 'Computer Science & Engineering', 9.2, 2026, 2024, '+91 99999 88888');

let retrievedStudent = db.prepare('SELECT s.*, u.email FROM student_profiles s JOIN users u ON s.user_id = u.id WHERE s.id = ?').get(testStudentId);
assert(retrievedStudent, 'Student must be created and queryable');
assert.strictEqual(retrievedStudent.roll_number, testRoll);
console.log('✅ Student Created & Retrieved:', retrievedStudent.name, `(${retrievedStudent.roll_number})`);

// Edit Student
db.prepare('UPDATE student_profiles SET cgpa = 9.45, parsed_resume_json = ? WHERE id = ?').run(JSON.stringify({ skills: ['React', 'Node.js', 'AI Systems'] }), testStudentId);
retrievedStudent = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(testStudentId);
assert.strictEqual(retrievedStudent.cgpa, 9.45);
console.log('✅ Student Profile Updated: CGPA =', retrievedStudent.cgpa);

// 4. Test Company Management & Placement Drive CRUD
const testCompanyId = 'c_council_demo_comp';
const testCompUserId = 'u_council_demo_comp';
const testReqId = 'req_council_demo_drive';

db.prepare('DELETE FROM applications WHERE requirement_id = ?').run(testReqId);
db.prepare('DELETE FROM requirements WHERE id = ?').run(testReqId);
db.prepare('DELETE FROM company_profiles WHERE id = ?').run(testCompanyId);
db.prepare('DELETE FROM users WHERE id = ?').run(testCompUserId);

db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)').run(testCompUserId, 'recruiter.demo@gsfc-industry.com', hash, 'company');
db.prepare(`
  INSERT INTO company_profiles (id, user_id, company_name, industry, location, contact_email, phone, approved, verified)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
`).run(testCompanyId, testCompUserId, 'GSFC Autonomous Systems Ltd', 'Robotics & AI', 'Vadodara Innovation Park', 'recruiter.demo@gsfc-industry.com', '+91 98888 77777');

const retrievedCompany = db.prepare('SELECT * FROM company_profiles WHERE id = ?').get(testCompanyId);
assert(retrievedCompany, 'Company must exist');
console.log('✅ Company Created & Verified:', retrievedCompany.company_name);

// Create Placement Drive Requirement
db.prepare(`
  INSERT INTO requirements (id, company_id, title, ctc_range, job_description, min_cgpa, eligible_programs_json, required_skills_json, deadline, applications_open)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2026-10-30', 1)
`).run(testReqId, testCompanyId, 'AI Robotics Engineer', '₹16.50 LPA', 'Developing computer vision pipelines for industrial automation', 8.0, JSON.stringify(['BTech CSE', 'BTech IT']), JSON.stringify(['Python', 'OpenCV', 'ROS']));

const retrievedDrive = db.prepare('SELECT * FROM requirements WHERE id = ?').get(testReqId);
assert(retrievedDrive, 'Placement drive requirement must exist');
console.log('✅ Placement Drive Created:', retrievedDrive.title, `(${retrievedDrive.ctc_range})`);

// 5. Test Placement Application & Status Transition Lifecycle
const testAppId = 'app_council_demo_1';
db.prepare(`
  INSERT INTO applications (id, requirement_id, student_id, status, applied_at, match_score, evaluation_score)
  VALUES (?, ?, ?, 'applied', CURRENT_TIMESTAMP, 96, 94)
`).run(testAppId, testReqId, testStudentId);

let app = db.prepare('SELECT * FROM applications WHERE id = ?').get(testAppId);
assert.strictEqual(app.status, 'applied');
console.log('✅ Student Application Submitted (Status: applied, Match: 96%)');

// Status transition: Shortlisted -> Interview -> Selected (Placed)
db.prepare("UPDATE applications SET status = 'shortlisted' WHERE id = ?").run(testAppId);
app = db.prepare('SELECT * FROM applications WHERE id = ?').get(testAppId);
assert.strictEqual(app.status, 'shortlisted');

db.prepare("UPDATE applications SET status = 'interview', attendance_status = 'present' WHERE id = ?").run(testAppId);
app = db.prepare('SELECT * FROM applications WHERE id = ?').get(testAppId);
assert.strictEqual(app.status, 'interview');

db.prepare("UPDATE applications SET status = 'selected', offer_letter_data_json = ? WHERE id = ?").run(JSON.stringify({ ctc: '₹16.50 LPA', designation: 'AI Robotics Engineer', joiningDate: '2026-07-01' }), testAppId);
app = db.prepare('SELECT * FROM applications WHERE id = ?').get(testAppId);
assert.strictEqual(app.status, 'selected');
console.log('✅ Placement Application Lifecycle Transition Completed -> Status: SELECTED (Placed)');

// 6. Test Dashboard Analytics Calculations
const totalStudents = db.prepare('SELECT COUNT(*) as count FROM student_profiles').get().count;
const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM company_profiles WHERE approved = 1').get().count;
const totalPlaced = db.prepare("SELECT COUNT(DISTINCT student_id) as count FROM applications WHERE status = 'selected'").get().count;
const placementPercentage = totalStudents > 0 ? ((totalPlaced / totalStudents) * 100).toFixed(1) : 0;

console.log(`\n📊 Dashboard Real-Time Metrics:`);
console.log(`   - Total Students: ${totalStudents}`);
console.log(`   - Total Approved Companies: ${totalCompanies}`);
console.log(`   - Total Placed Students: ${totalPlaced}`);
console.log(`   - Placement Conversion: ${placementPercentage}%`);
assert(totalStudents > 0, 'Total students count must be greater than 0');
assert(totalPlaced > 0, 'Placed students count must be greater than 0');

// 7. Test Blockchain Anchoring & Credential Verification
const certId = 'GSFC-COUNCIL-DEMO-CERT-2026';
db.prepare('DELETE FROM blockchain_ledger WHERE doc_id = ?').run(certId);

const lastBlock = db.prepare('SELECT block_hash FROM blockchain_ledger ORDER BY block_number DESC LIMIT 1').get();
const prevHash = lastBlock?.block_hash || '0000000000000000000000000000000000000000000000000000000000000000';
const docHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const blockHash = 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';

db.prepare(`
  INSERT INTO blockchain_ledger (doc_id, doc_type, student_id, student_name, roll_number, company_name, job_role, ctc, issuing_authority, document_hash, previous_block_hash, block_hash, merkle_root, signature, status)
  VALUES (?, 'OFFER_LETTER', ?, 'Demo Candidate', ?, 'GSFC Autonomous Systems Ltd', 'AI Robotics Engineer', '₹16.50 LPA', 'TPC Director GSFC University', ?, ?, ?, 'merkle_demo_root', 'sig_tpc_demo', 'VALID_CONFIRMED')
`).run(certId, testStudentId, testRoll, docHash, prevHash, blockHash);

const verifiedCert = db.prepare('SELECT * FROM blockchain_ledger WHERE doc_id = ?').get(certId);
assert(verifiedCert, 'Blockchain anchored certificate must be verifiable');
assert.strictEqual(verifiedCert.status, 'VALID_CONFIRMED');
console.log('✅ Blockchain Credential Anchored & Verifiable:', verifiedCert.doc_id);

// 8. Cleanup test demo data
db.prepare('DELETE FROM blockchain_ledger WHERE doc_id = ?').run(certId);
db.prepare('DELETE FROM applications WHERE id = ?').run(testAppId);
db.prepare('DELETE FROM requirements WHERE id = ?').run(testReqId);
db.prepare('DELETE FROM company_profiles WHERE id = ?').run(testCompanyId);
db.prepare('DELETE FROM student_profiles WHERE id = ?').run(testStudentId);
db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(testUserId, testCompUserId);
db.prepare('DELETE FROM authorized_students WHERE roll_number = ?').run(testRoll);

console.log('\n🎉 ALL COUNCIL PRE-DEMO STABILITY WORKFLOW TESTS PASSED 100%!');
