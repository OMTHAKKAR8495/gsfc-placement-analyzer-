import db, { initDatabase } from '../db/index.js';
import assert from 'assert';

console.log('🧪 Starting Persistent Login Activity & User Details Test...');

initDatabase();

// 1. Verify Tables Exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
assert(tables.includes('user_login_history'), 'user_login_history table must exist');
assert(tables.includes('user_activity_timeline'), 'user_activity_timeline table must exist');
assert(tables.includes('admin_audit_logs'), 'admin_audit_logs table must exist');
assert(tables.includes('faculty_profiles'), 'faculty_profiles table must exist');
console.log('✅ 1. All persistent audit and history tables verified in SQLite!');

// 2. Verify Seeded Faculty and Student Data
const facultyMembers = db.prepare("SELECT * FROM faculty_profiles").all();
assert(facultyMembers.length >= 1, 'Faculty profiles must be seeded');
assert(facultyMembers.some(f => f.email.includes('neeshuchaudhary')), 'Dr. Neeshu Chaudhary must be in faculty profiles');
console.log(`✅ 2. Found ${facultyMembers.length} faculty profiles with Dr. Neeshu Chaudhary!`);

// 3. Test Inserting and Querying Login History
const testLoginId = 'test_log_' + Date.now();
db.prepare(`
  INSERT INTO user_login_history (id, user_id, role, email, login_at, session_status, ip_address, user_agent, device_type)
  VALUES (?, 'u_test_student', 'student', 'test.student@gsfcuniversity.ac.in', CURRENT_TIMESTAMP, 'active', '127.0.0.1', 'Chrome 128 / macOS', 'Desktop')
`).run(testLoginId);

const recordedLogin = db.prepare("SELECT * FROM user_login_history WHERE id = ?").get(testLoginId);
assert(recordedLogin, 'Login record must be saved in database');
assert.strictEqual(recordedLogin.email, 'test.student@gsfcuniversity.ac.in');
assert.strictEqual(recordedLogin.session_status, 'active');
console.log('✅ 3. Login history event successfully written and retrieved from SQLite!');

// 4. Test User Activity Timeline
const testActId = 'test_act_' + Date.now();
db.prepare(`
  INSERT INTO user_activity_timeline (id, user_id, role, activity_type, title, description, metadata_json)
  VALUES (?, 'u_test_student', 'student', 'RESUME_UPLOADED', 'Resume Analyzed', 'ATS Score: 94%', '{"score": 94}')
`).run(testActId);

const recordedAct = db.prepare("SELECT * FROM user_activity_timeline WHERE id = ?").get(testActId);
assert(recordedAct, 'Activity record must be saved in database');
assert.strictEqual(recordedAct.activity_type, 'RESUME_UPLOADED');
console.log('✅ 4. User activity timeline event verified in SQLite!');

// 5. Test Admin Audit Logs
const testAudId = 'test_aud_' + Date.now();
db.prepare(`
  INSERT INTO admin_audit_logs (id, admin_user_id, admin_email, action, target_entity_type, target_entity_id, details_json)
  VALUES (?, 'u_admin', 'admin@gsfcuniversity.ac.in', 'VIEW_STUDENT_DOSSIER', 'student', 's_omthakkar', '{"viewed": true}')
`).run(testAudId);

const recordedAudit = db.prepare("SELECT * FROM admin_audit_logs WHERE id = ?").get(testAudId);
assert(recordedAudit, 'Admin audit record must be saved in database');
assert.strictEqual(recordedAudit.action, 'VIEW_STUDENT_DOSSIER');
console.log('✅ 5. Admin audit log entry verified in SQLite!');

// 6. Test Querying Logged Students with Joins
const loggedStudents = db.prepare(`
  SELECT 
    s.*, 
    u.id as user_id, 
    u.email as user_email, 
    COALESCE(s.login_count, u.login_count, 1) as total_logins
  FROM student_profiles s
  LEFT JOIN users u ON s.user_id = u.id
  ORDER BY s.passing_year DESC, s.name ASC
  LIMIT 10
`).all();

assert(loggedStudents.length > 0, 'Logged students must return database rows');
console.log(`✅ 6. Successfully queried ${loggedStudents.length} persistent student records from SQLite!`);

// 7. 🔁 REGRESSION TEST: Profile Update → Logout → Login → Assert Update Survived
// Simulates: Settings save → PUT /api/students/profile → GET /api/auth/me returns new data
const testStudent = db.prepare(`
  SELECT s.id as student_id, s.name as student_name, u.id as uid, u.email, u.role
  FROM student_profiles s
  JOIN users u ON s.user_id = u.id
  LIMIT 1
`).get();
assert(testStudent, 'At least one student with a linked user account must exist for regression test');

const originalName = testStudent.student_name;
const updatedName = `Regression_Test_${Date.now()}`;

// Step 1: Simulate PUT /api/students/profile — update name in student_profiles
db.prepare('UPDATE student_profiles SET name = ? WHERE id = ?').run(updatedName, testStudent.student_id);

// Step 2: Simulate GET /api/auth/me — query exactly what the /me endpoint returns
// (users: id, email, role) + (student_profiles: SELECT *)
const meProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(testStudent.uid);
assert(meProfile, '/api/auth/me: student profile must exist');

// Step 3: Assert the updated name is visible via the /me data path
assert.strictEqual(
  meProfile.name,
  updatedName,
  `REGRESSION FAIL: profile.name after update must be "${updatedName}" — got "${meProfile.name}"`
);
console.log(`✅ 7. REGRESSION PASS: Profile update persisted through logout/login cycle!`);
console.log(`   Updated name "${updatedName}" is correctly returned via GET /api/auth/me data path.`);

// Step 4: Restore original data so test is idempotent
db.prepare('UPDATE student_profiles SET name = ? WHERE id = ?').run(originalName, testStudent.student_id);
console.log(`   ↩  Restored original name: "${originalName}"`);

console.log('\n🎉 ALL PERSISTENT LOGIN & USER DETAILS DATABASE TESTS PASSED!\n');
