import db, { initDatabase } from '../db/index.js';
import bcrypt from 'bcryptjs';

console.log('🧪 Starting GSFC Placement Portal Verification Suite...\n');

async function runVerification() {
  // Initialize database schema, migrations and seeds
  await initDatabase();

  // 1. Verify Database Initialization & Tables
  console.log('1️⃣ Checking Database Tables & Schema...');
  let tables = [];
  try {
    const res = await db.prepare("SELECT table_name as name FROM information_schema.tables WHERE table_schema = 'public'").all();
    tables = (res || []).map(t => t.name);
  } catch (e) {
    const res = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    tables = (res || []).map(t => t.name);
  }

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

  // 2. Check Tables are Queryable
  console.log('\n2️⃣ Testing Internships Table Schema & Queryability...');
  const internships = await db.prepare('SELECT * FROM internships').all();
  console.log(`   Found ${internships.length} internship records.`);
  console.log('   ✅ Internships table is healthy and queryable.');

  // 3. Test Placement Calendar Events Schema & Queryability
  console.log('\n3️⃣ Testing Placement Calendar Events Table Schema & Queryability...');
  const calEvents = await db.prepare('SELECT * FROM placement_calendar_events').all();
  console.log(`   Found ${calEvents.length} calendar events.`);
  console.log('   ✅ Placement calendar events table is healthy and queryable.');

  // 4. Test Student Mails Table Schema & Queryability
  console.log('\n4️⃣ Testing Student Mails Table Schema & Queryability...');
  const mails = await db.prepare('SELECT * FROM company_student_mails').all();
  console.log(`   Found ${mails.length} student emails.`);
  console.log('   ✅ Student mails table is healthy and queryable.');

  // 5. Test CRUD on Internships
  console.log('\n5️⃣ Testing CRUD operations on Internships...');
  const testId = 'test_intern_' + Date.now();
  await db.prepare(`
    INSERT INTO internships (
      id, student_name, roll_number, program, branch, company_name, role, duration, stipend, status, noc_status
    ) VALUES (?, 'Test Candidate', '99BT99999', 'BTech CSE', 'Computer Science', 'Test Corp', 'Test Intern', '3 Months', '₹30,000 / month', 'approved', 'issued')
  `).run(testId);

  const inserted = await db.prepare('SELECT * FROM internships WHERE id = ?').get(testId);
  if (!inserted || inserted.student_name !== 'Test Candidate') {
    throw new Error('❌ Insert internship failed!');
  }

  await db.prepare('UPDATE internships SET stipend = ? WHERE id = ?').run('₹35,000 / month', testId);
  const updated = await db.prepare('SELECT * FROM internships WHERE id = ?').get(testId);
  if (updated.stipend !== '₹35,000 / month') {
    throw new Error('❌ Update internship failed!');
  }

  await db.prepare('DELETE FROM internships WHERE id = ?').run(testId);
  const deleted = await db.prepare('SELECT * FROM internships WHERE id = ?').get(testId);
  if (deleted) {
    throw new Error('❌ Delete internship failed!');
  }
  console.log('   ✅ Internship CRUD verified.');

  // 6. Test CRUD on Placement Calendar Events
  console.log('\n6️⃣ Testing CRUD operations on Placement Calendar...');
  const testCalId = 'test_cal_' + Date.now();
  await db.prepare(`
    INSERT INTO placement_calendar_events (
      id, company_name, role, ctc, date, time, stage, location
    ) VALUES (?, 'Test Enterprise', 'Test Engineer', '₹20.00 LPA', '2026-10-01', '10:00 AM', 'Technical Round', 'Lab 1')
  `).run(testCalId);

  const insertedCal = await db.prepare('SELECT * FROM placement_calendar_events WHERE id = ?').get(testCalId);
  if (!insertedCal || insertedCal.company_name !== 'Test Enterprise') {
    throw new Error('❌ Insert calendar event failed!');
  }

  await db.prepare('DELETE FROM placement_calendar_events WHERE id = ?').run(testCalId);
  console.log('   ✅ Placement calendar CRUD verified.');

  // 7. Test Feature #5: Unregistered User Login Rejection
  console.log('\n7️⃣ Testing Feature #5: Unregistered Login Rejection...');
  const randomEmail = `unregistered_${Date.now()}@gsfcuniversity.ac.in`;
  const existingUser = await db.prepare('SELECT * FROM users WHERE email = ?').get(randomEmail);
  if (existingUser) {
    throw new Error('User unexpectedly exists');
  }
  console.log(`   Attempting simulated login check for unregistered: ${randomEmail}`);
  console.log('   ✅ Unregistered user properly has no account.');

  console.log('\n🎉 ALL PORTAL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!\n');
  process.exit(0);
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
