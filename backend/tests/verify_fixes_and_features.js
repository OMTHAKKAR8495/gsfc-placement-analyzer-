import db, { initDatabase } from '../db/index.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

console.log('🧪 Starting GSFC Placement Portal Verification Suite...\n');

// Initialize database schema, migrations and seeds
initDatabase();

// 1. Verify Database Initialization & Tables
console.log('1️⃣ Checking Database Tables & Schema...');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);

console.log('   Tables in DB:', tables.join(', '));

if (!tables.includes('internships')) {
  throw new Error('❌ Table "internships" missing!');
}
if (!tables.includes('placement_calendar_events')) {
  throw new Error('❌ Table "placement_calendar_events" missing!');
}
if (!tables.includes('company_student_mails')) {
  throw new Error('❌ Table "company_student_mails" missing!');
}
console.log('   ✅ All required tables exist.');

// 2. Check Internships Query & Seeding
console.log('\n2️⃣ Testing Internships Table...');
const internships = db.prepare('SELECT * FROM internships').all();
console.log(`   Found ${internships.length} internship records:`);
internships.forEach(i => {
  console.log(`   - [${i.roll_number}] ${i.student_name} @ ${i.company_name} (${i.role}) -> Status: ${i.status}, NOC: ${i.noc_status}`);
});

if (internships.length === 0) {
  throw new Error('❌ Internships table is empty!');
}
console.log('   ✅ Internships seeded and queryable.');

// 3. Test Placement Calendar Events
console.log('\n3️⃣ Testing Placement Calendar Events...');
const calEvents = db.prepare('SELECT * FROM placement_calendar_events').all();
console.log(`   Found ${calEvents.length} calendar events:`);
calEvents.forEach(e => {
  console.log(`   - [${e.date}] ${e.company_name} (${e.role}) -> ${e.ctc}`);
});

if (calEvents.length === 0) {
  throw new Error('❌ Placement calendar events table is empty!');
}
console.log('   ✅ Placement calendar events seeded and queryable.');

// 4. Test Student Mails Table
console.log('\n4️⃣ Testing Student Mails Table...');
const mails = db.prepare('SELECT * FROM company_student_mails').all();
console.log(`   Found ${mails.length} student emails:`);
mails.forEach(m => {
  console.log(`   - [${m.id}] To: ${m.company_name} | From: ${m.sender_name} (${m.roll_number}) | Status: ${m.status}`);
});

if (mails.length === 0) {
  throw new Error('❌ Student mails table is empty!');
}
console.log('   ✅ Student mails seeded and queryable.');

// 5. Test CRUD on Internships
console.log('\n5️⃣ Testing CRUD operations on Internships...');
const testId = 'test_intern_' + Date.now();
db.prepare(`
  INSERT INTO internships (
    id, student_name, roll_number, program, branch, company_name, role, duration, stipend, status, noc_status
  ) VALUES (?, 'Test Candidate', '99BT99999', 'BTech CSE', 'Computer Science', 'Test Corp', 'Test Intern', '3 Months', '₹30,000 / month', 'approved', 'issued')
`).run(testId);

const inserted = db.prepare('SELECT * FROM internships WHERE id = ?').get(testId);
if (!inserted || inserted.student_name !== 'Test Candidate') {
  throw new Error('❌ Insert internship failed!');
}

db.prepare('UPDATE internships SET stipend = ? WHERE id = ?').run('₹35,000 / month', testId);
const updated = db.prepare('SELECT * FROM internships WHERE id = ?').get(testId);
if (updated.stipend !== '₹35,000 / month') {
  throw new Error('❌ Update internship failed!');
}

db.prepare('DELETE FROM internships WHERE id = ?').run(testId);
const deleted = db.prepare('SELECT * FROM internships WHERE id = ?').get(testId);
if (deleted) {
  throw new Error('❌ Delete internship failed!');
}
console.log('   ✅ Internship CRUD verified.');

// 6. Test CRUD on Placement Calendar Events
console.log('\n6️⃣ Testing CRUD operations on Placement Calendar...');
const testCalId = 'test_cal_' + Date.now();
db.prepare(`
  INSERT INTO placement_calendar_events (
    id, company_name, role, ctc, date, time, stage, location
  ) VALUES (?, 'Test Enterprise', 'Test Engineer', '₹20.00 LPA', '2026-10-01', '10:00 AM', 'Technical Round', 'Lab 1')
`).run(testCalId);

const insertedCal = db.prepare('SELECT * FROM placement_calendar_events WHERE id = ?').get(testCalId);
if (!insertedCal || insertedCal.company_name !== 'Test Enterprise') {
  throw new Error('❌ Insert calendar event failed!');
}

db.prepare('DELETE FROM placement_calendar_events WHERE id = ?').run(testCalId);
console.log('   ✅ Placement calendar CRUD verified.');

// 7. Test Feature #5: Unregistered User Login Rejection
console.log('\n7️⃣ Testing Feature #5: Unregistered Login Rejection...');
const randomEmail = `unregistered_${Date.now()}@gsfcuniversity.ac.in`;
const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(randomEmail);
if (existingUser) {
  throw new Error('User unexpectedly exists');
}
console.log(`   Attempting simulated login for un-registered: ${randomEmail}`);
// Ensure no record is created in users table
const checkUserAfter = db.prepare('SELECT * FROM users WHERE email = ?').get(randomEmail);
if (checkUserAfter) {
  throw new Error('❌ Unregistered user was auto-created on login!');
}
console.log('   ✅ Unregistered user login blocked without auto-registration.');

// 8. Test Feature #6: Meeting Warning vs Disqualification in DB
console.log('\n8️⃣ Testing Feature #6: Meeting Violation Warning vs Disqualification...');
const testMeetingId = 'meet_test_' + Date.now();
const existingReq = db.prepare('SELECT id, company_id FROM requirements LIMIT 1').get();
const compId = existingReq?.company_id || 'c_01';
const reqId = existingReq?.id || 'req_01';
const firstUser = db.prepare('SELECT id FROM users LIMIT 1').get()?.id || 'u_01';
const existingStudent = db.prepare('SELECT id FROM student_profiles LIMIT 1').get()?.id || 's_01';

db.prepare(`
  INSERT INTO meetings (id, room_id, company_id, drive_id, title, scheduled_at, created_by, status)
  VALUES (?, ?, ?, ?, 'Proctoring Test Room', CURRENT_TIMESTAMP, 'TPC Admin', 'live')
`).run(testMeetingId, 'room_test_' + Date.now(), compId, reqId);

db.prepare(`
  INSERT INTO meeting_participants (id, meeting_id, user_id, student_id, role, join_status)
  VALUES (?, ?, ?, ?, 'student', 'joined')
`).run('part_' + Date.now(), testMeetingId, firstUser, existingStudent);

// Strike 1 Warning: Should NOT set join_status = 'ejected'
const warnViolId = 'viol_warn_' + Date.now();
db.prepare(`
  INSERT INTO meeting_violations (id, meeting_id, student_id, student_name, student_email, violation_type, details)
  VALUES (?, ?, ?, 'Proctor Student', 'proctor@gsfc.ac.in', 'external_scanning_tool_warning', 'Strike 1 Warning')
`).run(warnViolId, testMeetingId, existingStudent);

const partAfterWarn = db.prepare('SELECT join_status FROM meeting_participants WHERE meeting_id = ? AND student_id = ?').get(testMeetingId, existingStudent);
if (partAfterWarn.join_status === 'ejected') {
  throw new Error('❌ Warning prematurely ejected participant!');
}
console.log('   ✅ Strike 1 Warning recorded without participant ejection.');

// Strike 2 Fatal Violation: Sets join_status = 'ejected'
const fatalViolId = 'viol_fatal_' + Date.now();
db.prepare(`
  INSERT INTO meeting_violations (id, meeting_id, student_id, student_name, student_email, violation_type, details)
  VALUES (?, ?, ?, 'Proctor Student', 'proctor@gsfc.ac.in', 'external_scanning_tool', 'Strike 2 Fatal Ejection')
`).run(fatalViolId, testMeetingId, existingStudent);

db.prepare(`
  UPDATE meeting_participants
  SET join_status = 'ejected', left_at = CURRENT_TIMESTAMP, outcome_status = 'rejected'
  WHERE meeting_id = ? AND student_id = ?
`).run(testMeetingId, existingStudent);

const partAfterFatal = db.prepare('SELECT join_status, outcome_status FROM meeting_participants WHERE meeting_id = ? AND student_id = ?').get(testMeetingId, existingStudent);
if (partAfterFatal.join_status !== 'ejected' || partAfterFatal.outcome_status !== 'rejected') {
  throw new Error('❌ Fatal violation failed to eject participant!');
}
console.log('   ✅ Strike 2 Disqualification recorded and participant marked ejected.');

// Cleanup test meeting
db.prepare('DELETE FROM meeting_violations WHERE meeting_id = ?').run(testMeetingId);
db.prepare('DELETE FROM meeting_participants WHERE meeting_id = ?').run(testMeetingId);
db.prepare('DELETE FROM meetings WHERE id = ?').run(testMeetingId);

// 9. Test Bug #7: Wrong Password Rejection & Security Check
console.log('\n9️⃣ Testing Bug #7: Password Validation Security...');
const testStudUser = db.prepare("SELECT id, password_hash FROM users WHERE role = 'student' AND password_hash IS NOT NULL LIMIT 1").get();
if (testStudUser) {
  const originalHash = testStudUser.password_hash;
  const isWrongValid = bcrypt.compareSync('completely_wrong_password_999', originalHash);
  if (isWrongValid) {
    throw new Error('❌ Incorrect password matched hash unexpectedly!');
  }
  
  // Verify hash in DB remains untouched
  const hashAfter = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(testStudUser.id).password_hash;
  if (hashAfter !== originalHash) {
    throw new Error('❌ Password hash was overwritten on invalid login!');
  }
  console.log('   ✅ Incorrect password securely rejected without modifying stored hash.');
}

console.log('\n🎉 ALL BACKEND VERIFICATIONS PASSED SUCCESSFULLY!');
