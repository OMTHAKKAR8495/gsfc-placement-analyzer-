import bcrypt from 'bcryptjs';
import db, { initDatabase } from '../db/index.js';

/**
 * Isolated Local Development Account Seeding Script
 * Run with: ALLOW_DEV_SEED=true node backend/scripts/seedDevAccounts.js
 * 
 * PRODUCTION SAFETY GUARD: This script must NEVER be executed in production environments.
 * It is strictly gated behind NODE_ENV !== 'production' AND ALLOW_DEV_SEED === 'true'.
 */

if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEV_SEED !== 'true') {
  console.error('🚫 [SECURITY BLOCK]: Refusing to execute dev account seeder in production mode or without explicit ALLOW_DEV_SEED=true.');
  console.error('👉 To create a real administrator in production, run: node backend/scripts/createRealAdmin.js');
  process.exit(1);
}

console.log('🌱 Initializing GSFC Placement Portal Local Development Seeder...\n');

initDatabase();

const DEV_ACCOUNTS = [
  {
    userId: 'u_dev_admin',
    email: 'admin@gsfcuniversity.ac.in',
    password: process.env.DEV_ADMIN_PASSWORD || 'password123',
    role: 'admin',
    name: 'Dr. Neeshu Chaudhary (TPC Director)'
  },
  {
    userId: 'u_dev_superadmin',
    email: 'superadmin@gsfcuniversity.ac.in',
    password: process.env.DEV_SUPERADMIN_PASSWORD || 'password123',
    role: 'superadmin',
    name: 'GSFC Super Administrator'
  },
  {
    userId: 'u_dev_student',
    email: '24bt04171@gsfcuniversity.ac.in',
    password: process.env.DEV_STUDENT_PASSWORD || 'password123',
    role: 'student',
    name: 'Om Thakkar',
    rollNumber: '24BT04171',
    program: 'B.Tech',
    branch: 'Computer Science & Engineering',
    cgpa: 9.2,
    atsScore: 94
  },
  {
    userId: 'u_dev_gsfc_ltd',
    email: 'gsfclimited@gmail.com',
    password: process.env.DEV_GSFC_PASSWORD || 'password123',
    role: 'company',
    companyName: 'GSFC Limited',
    industry: 'Chemicals & Fertilizers'
  },
  {
    userId: 'u_dev_recruiter',
    email: 'recruiter.google@company.com',
    password: process.env.DEV_RECRUITER_PASSWORD || 'password123',
    role: 'company',
    companyName: 'Google Cloud India',
    industry: 'Cloud & Artificial Intelligence'
  },
  {
    userId: 'u_dev_alumni',
    email: 'priya.patel@alumni.gsfc.ac.in',
    password: process.env.DEV_ALUMNI_PASSWORD || 'password123',
    role: 'alumni',
    name: 'Priya Patel',
    company: 'Amazon AWS',
    designation: 'Senior Cloud Solutions Architect',
    batchYear: '2019-2023'
  },
  {
    userId: 'u_dev_faculty',
    email: 'faculty.cse@gsfcuniversity.ac.in',
    password: process.env.DEV_FACULTY_PASSWORD || 'password123',
    role: 'faculty',
    name: 'Dr. Neeshu Chaudhary',
    department: 'School of Technology'
  },
  {
    userId: 'u_dev_security',
    email: 'security@gsfcuniversity.ac.in',
    password: process.env.DEV_SECURITY_PASSWORD || 'password123',
    role: 'security',
    name: 'GSFC Campus Security Officer',
    gate: 'Main Gate 1'
  },
  {
    userId: 'u_dev_fest',
    email: 'fest_attendee@msu.ac.in',
    password: process.env.DEV_FEST_PASSWORD || 'password123',
    role: 'student',
    name: 'Fest Guest Attendee',
    rollNumber: 'FEST-2026-001',
    program: 'B.Tech Inter-College',
    branch: 'Computer Engineering',
    cgpa: 8.5,
    atsScore: 85
  }
];

async function seedAccounts() {
  for (const acc of DEV_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.password, 10);

    // 1. Insert or update User
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, role)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role
    `).run(acc.userId, acc.email.toLowerCase(), passwordHash, acc.role);

    const user = await db.prepare('SELECT id FROM users WHERE email = ?').get(acc.email.toLowerCase());
    const realUserId = user?.id || acc.userId;

    // 2. Role-specific profile record
    if (acc.role === 'student') {
      const existingProfile = await db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(realUserId);
      const profileId = existingProfile?.id || ('s_dev_' + realUserId);
      await db.prepare(`
        INSERT INTO student_profiles (id, user_id, name, roll_number, program, branch, cgpa, ats_score, university_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name, roll_number = EXCLUDED.roll_number, cgpa = EXCLUDED.cgpa, university_email = EXCLUDED.university_email
      `).run(
        profileId,
        realUserId,
        acc.name,
        acc.rollNumber,
        acc.program,
        acc.branch,
        acc.cgpa,
        acc.atsScore,
        acc.email.toLowerCase()
      );
    } else if (acc.role === 'company') {
      const existingComp = await db.prepare('SELECT id FROM company_profiles WHERE user_id = ?').get(realUserId);
      const compId = existingComp?.id || ('c_dev_' + realUserId);
      await db.prepare(`
        INSERT INTO company_profiles (id, user_id, company_name, industry, approved, website, contact_email)
        VALUES (?, ?, ?, ?, 1, 'https://cloud.google.com', ?)
        ON CONFLICT(id) DO UPDATE SET company_name = EXCLUDED.company_name, approved = EXCLUDED.approved
      `).run(compId, realUserId, acc.companyName, acc.industry, acc.email);
    } else if (acc.role === 'alumni') {
      const existingAlumni = await db.prepare('SELECT id FROM alumni_profiles WHERE user_id = ?').get(realUserId);
      const alumniId = existingAlumni?.id || ('alumni_dev_' + realUserId);
      await db.prepare(`
        INSERT INTO alumni_profiles (id, user_id, name, batch_year, company, designation, bio, verified)
        VALUES (?, ?, ?, ?, ?, ?, 'Guiding GSFC engineering students in Cloud and Distributed Systems.', 1)
        ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name, company = EXCLUDED.company, designation = EXCLUDED.designation
      `).run(alumniId, realUserId, acc.name, acc.batchYear, acc.company, acc.designation);
    } else if (acc.role === 'faculty') {
      const existingFac = await db.prepare('SELECT id FROM faculty_profiles WHERE user_id = ?').get(realUserId);
      const facId = existingFac?.id || ('fac_dev_' + realUserId);
      await db.prepare(`
        INSERT INTO faculty_profiles (id, user_id, name, email, department, designation)
        VALUES (?, ?, ?, ?, ?, 'Associate Professor & Placement Coordinator')
        ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
      `).run(facId, realUserId, acc.name, acc.email, acc.department);
    } else if (acc.role === 'security') {
      const existingSec = await db.prepare('SELECT id FROM security_staff_profiles WHERE user_id = ?').get(realUserId);
      const secId = existingSec?.id || ('sec_dev_' + realUserId);
      await db.prepare(`
        INSERT INTO security_staff_profiles (id, user_id, name, gate_assigned, active_status)
        VALUES (?, ?, ?, ?, 'active')
        ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name, gate_assigned = EXCLUDED.gate_assigned
      `).run(secId, realUserId, acc.name, acc.gate || 'Main Campus Gate A');
    }

    if (acc.role === 'student' && acc.rollNumber) {
      await db.prepare(`
        INSERT INTO authorized_students (id, email, roll_number, name, access_status)
        VALUES (?, ?, ?, ?, 'active')
        ON CONFLICT(id) DO UPDATE SET email = EXCLUDED.email, roll_number = EXCLUDED.roll_number
      `).run('auth_' + acc.rollNumber.toLowerCase(), acc.email, acc.rollNumber, acc.name);
    }

    console.log(`   ✅ Seeded ${acc.role.toUpperCase().padEnd(9)}: ${acc.email} (${acc.name || acc.companyName})`);
  }

  console.log('\n🎉 Local development accounts seeded successfully with secure bcrypt hashes!\n');
}

seedAccounts().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
