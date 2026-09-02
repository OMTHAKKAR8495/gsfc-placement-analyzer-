import bcrypt from 'bcryptjs';
import db, { initDatabase } from '../db/index.js';

/**
 * Isolated Local Development Account Seeding Script
 * Run with: node backend/scripts/seedDevAccounts.js
 * 
 * Safely creates or updates local test development accounts for all supported user roles
 * with high-entropy bcrypt password hashing.
 */

console.log('🌱 Initializing GSFC Placement Portal Local Development Seeder...\n');

initDatabase();

const DEV_ACCOUNTS = [
  {
    userId: 'u_dev_admin',
    email: 'admin@gsfcuniversity.ac.in',
    password: process.env.DEV_ADMIN_PASSWORD || 'GSFC@Admin2026!',
    role: 'admin',
    name: 'Dr. Neeshu Chaudhary (TPC Director)'
  },
  {
    userId: 'u_dev_student',
    email: 'student.om@gsfcuniversity.ac.in',
    password: process.env.DEV_STUDENT_PASSWORD || 'GSFC@Student2026!',
    role: 'student',
    name: 'Om Thakkar',
    rollNumber: '24BT04171',
    program: 'B.Tech',
    branch: 'Computer Science & Engineering',
    cgpa: 9.2,
    atsScore: 94
  },
  {
    userId: 'u_dev_recruiter',
    email: 'recruiter.google@company.com',
    password: process.env.DEV_RECRUITER_PASSWORD || 'GSFC@Recruiter2026!',
    role: 'company',
    companyName: 'Google Cloud India',
    industry: 'Cloud & Artificial Intelligence'
  },
  {
    userId: 'u_dev_alumni',
    email: 'alumni.priya@alumni.gsfc.ac.in',
    password: process.env.DEV_ALUMNI_PASSWORD || 'GSFC@Alumni2026!',
    role: 'alumni',
    name: 'Priya Patel',
    company: 'Amazon AWS',
    designation: 'Senior Cloud Solutions Architect',
    batchYear: '2019-2023'
  },
  {
    userId: 'u_dev_faculty',
    email: 'faculty.neeshu@gsfcuniversity.ac.in',
    password: process.env.DEV_FACULTY_PASSWORD || 'GSFC@Faculty2026!',
    role: 'faculty',
    name: 'Dr. Neeshu Chaudhary',
    department: 'School of Technology'
  }
];

async function seedAccounts() {
  for (const acc of DEV_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.password, 10);

    // 1. Insert or update User
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role
    `).run(acc.userId, acc.email.toLowerCase(), passwordHash, acc.role);

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(acc.email.toLowerCase());
    const realUserId = user?.id || acc.userId;

    // 2. Role-specific profile record
    if (acc.role === 'student') {
      const existingProfile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(realUserId);
      const profileId = existingProfile?.id || ('s_dev_' + realUserId);
      db.prepare(`
        INSERT OR REPLACE INTO student_profiles (id, user_id, name, roll_number, program, branch, cgpa, ats_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        profileId,
        realUserId,
        acc.name,
        acc.rollNumber,
        acc.program,
        acc.branch,
        acc.cgpa,
        acc.atsScore
      );
    } else if (acc.role === 'company') {
      const existingComp = db.prepare('SELECT id FROM company_profiles WHERE user_id = ?').get(realUserId);
      const compId = existingComp?.id || ('c_dev_' + realUserId);
      db.prepare(`
        INSERT OR REPLACE INTO company_profiles (id, user_id, company_name, industry, approved, website, contact_email)
        VALUES (?, ?, ?, ?, 1, 'https://cloud.google.com', ?)
      `).run(compId, realUserId, acc.companyName, acc.industry, acc.email);
    } else if (acc.role === 'alumni') {
      const existingAlumni = db.prepare('SELECT id FROM alumni_profiles WHERE user_id = ?').get(realUserId);
      const alumniId = existingAlumni?.id || ('alumni_dev_' + realUserId);
      db.prepare(`
        INSERT OR REPLACE INTO alumni_profiles (id, user_id, name, batch_year, company, designation, bio, verified)
        VALUES (?, ?, ?, ?, ?, ?, 'Guiding GSFC engineering students in Cloud and Distributed Systems.', 1)
      `).run(alumniId, realUserId, acc.name, acc.batchYear, acc.company, acc.designation);
    } else if (acc.role === 'faculty') {
      const existingFac = db.prepare('SELECT id FROM faculty_profiles WHERE user_id = ?').get(realUserId);
      const facId = existingFac?.id || ('fac_dev_' + realUserId);
      db.prepare(`
        INSERT OR REPLACE INTO faculty_profiles (id, user_id, name, email, department, designation)
        VALUES (?, ?, ?, ?, ?, 'Associate Professor & Placement Coordinator')
      `).run(facId, realUserId, acc.name, acc.email, acc.department);
    }

    console.log(`   ✅ Seeded ${acc.role.toUpperCase().padEnd(9)}: ${acc.email} (${acc.name || acc.companyName})`);
  }

  console.log('\n🎉 Local development accounts seeded successfully with secure bcrypt hashes!\n');
}

seedAccounts().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
