import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = process.env.DB_DIR || path.join(__dirname, '../db');
const dbPath = path.join(dbDir, 'campushire.db');
const backupDir = path.join(dbDir, 'backups');

// 1. Guarantee Backup
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `campushire_backup_before_clean_${timestamp}.db`);

if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`📦 [Data Safety]: Created pre-cleanup backup snapshot at:\n   ${backupPath}`);
}

// 2. Open DB Connection
const db = new Database(dbPath);
db.pragma('foreign_keys = OFF');

console.log('🧹 [Production Cleanup]: Starting safe deletion of all demo/test/mock records...');

const tablesToClean = [
  'applications',
  'document_authenticity_reports',
  'requirements',
  'company_subscriptions',
  'payment_transactions',
  'company_profiles',
  'student_profiles',
  'authorized_students',
  'alumni_profiles',
  'mentorship_comments',
  'mentorship_posts',
  'alumni_mentorship_slots',
  'alumni_mentor_reviews',
  'qa_replies',
  'qa_threads',
  'job_fairs',
  'job_fair_companies',
  'job_fair_registrations',
  'faculty_profiles',
  'user_login_history',
  'user_activity_timeline',
  'meeting_violations',
  'meeting_participants',
  'meeting_chat_messages',
  'meetings',
  'internships',
  'placement_calendar_events',
  'placement_rag_documents',
  'placement_risk_alerts',
  'company_student_mails',
  'entry_logs',
  'pass_tokens',
  'external_candidates',
  'events',
  'security_staff_profiles',
  'student_bookmarks',
  'student_activity_history',
  'student_assessments',
  'student_documents',
  'student_notifications',
  'student_resumes',
  'student_preparation_plans',
  'student_coding_submissions',
  'student_communication_practices',
  'student_study_materials',
  'notifications_log',
  'admin_audit_logs',
  'mock_interview_sessions',
  'interview_evaluations',
  'users'
];


let cleanedCountSummary = {};

const cleanTransaction = db.transaction(() => {
  for (const table of tablesToClean) {
    const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
    if (tableExists) {
      const countBefore = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      db.prepare(`DELETE FROM ${table}`).run();
      cleanedCountSummary[table] = countBefore;
    }
  }

  // Bootstrap Clean TPC Administrators
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@GSFC2026!';
  const passHash = bcrypt.hashSync(adminPassword, 10);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run('u_admin_gsfc_prod', 'admin@gsfcuniversity.ac.in', passHash, 'admin');

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run('u_superadmin_gsfc_prod', 'superadmin@gsfcuniversity.ac.in', passHash, 'superadmin');
});

cleanTransaction();

db.pragma('foreign_keys = ON');
db.exec('VACUUM;');

console.log('\n📊 [Summary of Demo Records Removed]:');
for (const [tbl, count] of Object.entries(cleanedCountSummary)) {
  if (count > 0) {
    console.log(`   - ${tbl}: ${count} demo records removed`);
  }
}

console.log('\n🏛️ [Production Administrators Bootstrapped]:');
console.log('   - TPC Admin:       admin@gsfcuniversity.ac.in');
console.log('   - TPC Superadmin:  superadmin@gsfcuniversity.ac.in');
console.log('   - Initial Password: ' + (process.env.INITIAL_ADMIN_PASSWORD ? '[Configured via .env]' : 'Admin@GSFC2026!'));
console.log('\n✅ [Production Readiness]: Database is completely clean, zero fake records remain, ready for real GSFC University data!\n');

db.close();
