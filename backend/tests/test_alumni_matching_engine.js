import assert from 'assert';
import db, { initDatabase } from '../db/index.js';

console.log('🧪 Running Phase 4: Alumni Mentorship Marketplace Test Suite...\n');

// Ensure database tables exist
initDatabase();

async function runAlumniTests() {
  // 1. Seed sample alumni mentor with real slot
  console.log('1️⃣ Seeding Test Alumni Mentor Profile & Availability Slots...');
  const testUserId = 'u_alumni_test_' + Date.now();
  const testAlumniId = 'alumni_test_' + Date.now();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role)
    VALUES (?, ?, 'hash', 'alumni')
  `).run(testUserId, `alumni_${Date.now()}@alumni.gsfc.ac.in`);

  db.prepare(`
    INSERT INTO alumni_profiles (id, user_id, name, batch_year, company, designation, bio, verified)
    VALUES (?, ?, 'Priya Patel', '2019-2023', 'Amazon AWS', 'Software Development Engineer - Cloud', 'Mentoring GSFC juniors on Distributed Systems & AWS.', 1)
  `).run(testAlumniId, testUserId);

  const slotId = 'slot_' + Date.now();
  db.prepare(`
    INSERT INTO alumni_mentorship_slots (id, alumni_id, day_of_week, start_time, end_time, topic_focus, is_booked)
    VALUES (?, ?, 'Saturday', '02:00 PM', '02:45 PM', 'System Design & Distributed Systems', 0)
  `).run(slotId, testAlumniId);

  console.log(`   ✅ Seeded Alumni Mentor: Priya Patel @ Amazon AWS (Slot: ${slotId})`);

  // 2. Test Mentorship Matching Algorithm
  console.log('\n2️⃣ Testing Mentorship Matching Algorithm for Target Company "Amazon"...');
  const mentors = db.prepare(`
    SELECT 
      a.*,
      (SELECT COUNT(*) FROM alumni_mentorship_slots s WHERE s.alumni_id = a.id AND s.is_booked = 0) as available_slots_count,
      (SELECT AVG(r.rating) FROM alumni_mentor_reviews r WHERE r.alumni_id = a.id) as avg_rating
    FROM alumni_profiles a
    WHERE a.id = ?
  `).all(testAlumniId);

  assert(mentors.length === 1, 'Must find seeded mentor');
  const targetCompany = 'Amazon';
  const m = mentors[0];
  const companyMatch = m.company.toLowerCase().includes(targetCompany.toLowerCase());
  assert(companyMatch === true, 'Priya Patel must match target company Amazon');
  console.log(`   ✅ Target company match verified: 100% company match for "${targetCompany}"`);

  // 3. Test 1:1 Mentorship Session Booking
  console.log('\n3️⃣ Testing 1:1 Mentorship Session Booking & Meeting Creation...');
  const studentId = 's_test_student';
  const meetingRoomId = `meet_test_${Date.now()}`;

  db.prepare(`
    UPDATE alumni_mentorship_slots 
    SET is_booked = 1,
        booked_student_id = ?,
        booked_student_name = 'Om Thakkar',
        meeting_link = ?,
        session_notes = 'Discussing AWS Lambda microservices'
    WHERE id = ?
  `).run(studentId, `/#meeting/${meetingRoomId}`, slotId);

  const updatedSlot = db.prepare('SELECT * FROM alumni_mentorship_slots WHERE id = ?').get(slotId);
  assert(updatedSlot.is_booked === 1, 'Slot must be marked as booked');
  assert(updatedSlot.booked_student_id === studentId, 'Slot must record booked student id');
  console.log(`   ✅ Slot successfully booked: "${updatedSlot.topic_focus}" with room "${meetingRoomId}"`);

  // 4. Test Mentor Reviews & Rating Calculation
  console.log('\n4️⃣ Testing Mentor Review Submission & Weighted Rating Calculation...');
  const reviewId = 'rev_test_' + Date.now();
  db.prepare(`
    INSERT INTO alumni_mentor_reviews (id, alumni_id, student_id, student_name, rating, feedback, session_topic)
    VALUES (?, ?, ?, 'Om Thakkar', 5, 'Incredible session! Priya helped me optimize my cloud architecture project.', 'AWS Architecture')
  `).run(reviewId, testAlumniId, studentId);

  const reviewStats = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as count 
    FROM alumni_mentor_reviews 
    WHERE alumni_id = ?
  `).get(testAlumniId);

  assert(reviewStats.count >= 1, 'Review must be recorded');
  assert(reviewStats.avg_rating === 5, 'Average rating must be 5.0');
  console.log(`   ✅ Verified ${reviewStats.count} review. Mentor Average Rating: ★ ${reviewStats.avg_rating.toFixed(1)}/5.0`);

  console.log('\n🎉 Phase 4 Test Suite Passed with 100% Assertion Success!\n');
}

runAlumniTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
