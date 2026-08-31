import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = process.env.DB_DIR || __dirname;
if (process.env.DB_DIR && !fs.existsSync(process.env.DB_DIR)) {
  try {
    fs.mkdirSync(process.env.DB_DIR, { recursive: true });
  } catch (e) {
    console.warn('DB_DIR directory creation notice:', e.message);
  }
}
const dbPath = path.join(dbDir, 'campushire.db');

let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('temp_store = MEMORY');
  db.pragma('cache_size = -64000');
  db.pragma('busy_timeout = 10000');
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error('Fatal Database initialization error on path:', dbPath, err);
  throw err;
}



export function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  applyMigrations();

  const indexesPath = path.join(__dirname, 'indexes.sql');
  if (fs.existsSync(indexesPath)) {
    const indexes = fs.readFileSync(indexesPath, 'utf8');
    db.exec(indexes);
  }

  seedInitialData();
}

function applyMigrations() {
  try {
    // Ensure users table check constraint supports security role
    const userTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get()?.sql || '';
    if (!userTableSql.includes('security')) {
      try {
        db.exec(`
          PRAGMA foreign_keys = OFF;
          CREATE TABLE IF NOT EXISTS users_temp (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('student', 'company', 'admin', 'alumni', 'faculty', 'superadmin', 'security')) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          INSERT OR IGNORE INTO users_temp (id, email, password_hash, role, created_at)
          SELECT id, email, password_hash, role, created_at FROM users;
          DROP TABLE users;
          ALTER TABLE users_temp RENAME TO users;
          PRAGMA foreign_keys = ON;
        `);
      } catch (e) {
        console.error('Users table migration notice:', e.message);
      }
    }

    const reqColumns = db.prepare("PRAGMA table_info(requirements)").all().map(c => c.name);
    if (!reqColumns.includes('application_type')) {
      db.exec("ALTER TABLE requirements ADD COLUMN application_type TEXT CHECK(application_type IN ('internal', 'external')) DEFAULT 'internal'");
    }
    if (!reqColumns.includes('external_apply_url')) {
      db.exec("ALTER TABLE requirements ADD COLUMN external_apply_url TEXT");
    }
    if (!reqColumns.includes('application_instructions')) {
      db.exec("ALTER TABLE requirements ADD COLUMN application_instructions TEXT");
    }
    if (!reqColumns.includes('external_click_count')) {
      db.exec("ALTER TABLE requirements ADD COLUMN external_click_count INTEGER DEFAULT 0");
    }
    if (!reqColumns.includes('question_bank_json')) {
      db.exec("ALTER TABLE requirements ADD COLUMN question_bank_json TEXT DEFAULT '[]'");
    }
    if (!reqColumns.includes('question_bank_status')) {
      db.exec("ALTER TABLE requirements ADD COLUMN question_bank_status TEXT CHECK(question_bank_status IN ('pending', 'complete')) DEFAULT 'pending'");
    }
    if (!reqColumns.includes('company_logo_url')) {
      db.exec("ALTER TABLE requirements ADD COLUMN company_logo_url TEXT");
    }
    if (!reqColumns.includes('company_website')) {
      db.exec("ALTER TABLE requirements ADD COLUMN company_website TEXT");
    }
    if (!reqColumns.includes('company_email')) {
      db.exec("ALTER TABLE requirements ADD COLUMN company_email TEXT");
    }
    if (!reqColumns.includes('company_phone')) {
      db.exec("ALTER TABLE requirements ADD COLUMN company_phone TEXT");
    }
    if (!reqColumns.includes('applications_open')) {
      db.exec("ALTER TABLE requirements ADD COLUMN applications_open INTEGER DEFAULT 1");
    }
    db.exec("UPDATE requirements SET applications_open = 1 WHERE applications_open IS NULL");

    const compColumns = db.prepare("PRAGMA table_info(company_profiles)").all().map(c => c.name);
    if (!compColumns.includes('contact_email')) {
      db.exec("ALTER TABLE company_profiles ADD COLUMN contact_email TEXT");
    }
    if (!compColumns.includes('contact_phone')) {
      db.exec("ALTER TABLE company_profiles ADD COLUMN contact_phone TEXT");
    }

    const appColumns = db.prepare("PRAGMA table_info(applications)").all().map(c => c.name);
    if (!appColumns.includes('applied_via')) {
      db.exec("ALTER TABLE applications ADD COLUMN applied_via TEXT CHECK(applied_via IN ('internal', 'external')) DEFAULT 'internal'");
    }
    if (!appColumns.includes('attendance_status')) {
      db.exec("ALTER TABLE applications ADD COLUMN attendance_status TEXT DEFAULT 'pending' CHECK(attendance_status IN ('present', 'absent', 'pending'))");
    }
    if (!appColumns.includes('evaluation_notes')) {
      db.exec("ALTER TABLE applications ADD COLUMN evaluation_notes TEXT DEFAULT ''");
    }
    if (!appColumns.includes('offer_letter_data_json')) {
      db.exec("ALTER TABLE applications ADD COLUMN offer_letter_data_json TEXT");
    }
    if (!appColumns.includes('combined_dossier_url')) {
      db.exec("ALTER TABLE applications ADD COLUMN combined_dossier_url TEXT");
    }
    if (!appColumns.includes('authenticity_report_json')) {
      db.exec("ALTER TABLE applications ADD COLUMN authenticity_report_json TEXT");
    }
    db.exec("UPDATE applications SET attendance_status = 'pending' WHERE attendance_status IS NULL");

    const studentColumns = db.prepare("PRAGMA table_info(student_profiles)").all().map(c => c.name);
    if (!studentColumns.includes('marksheets_url')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN marksheets_url TEXT");
    }
    if (!studentColumns.includes('certifications_url')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN certifications_url TEXT");
    }
    if (!studentColumns.includes('id_document_url')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN id_document_url TEXT");
    }
    if (!studentColumns.includes('linkedin_url')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN linkedin_url TEXT");
    }
    if (!studentColumns.includes('github_url')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN github_url TEXT");
    }
    if (!studentColumns.includes('photo_url')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN photo_url TEXT");
    }

    // Document Authenticity Checker & Forensics Reports Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS document_authenticity_reports (
        id TEXT PRIMARY KEY,
        application_id TEXT,
        student_id TEXT,
        file_name TEXT,
        file_type TEXT,
        file_size INTEGER,
        risk_level TEXT DEFAULT 'low' CHECK(risk_level IN ('low', 'medium', 'high')),
        risk_score INTEGER DEFAULT 15,
        summary_verdict TEXT,
        metadata_signals_json TEXT DEFAULT '{}',
        timeline_signals_json TEXT DEFAULT '{}',
        ai_text_signals_json TEXT DEFAULT '{}',
        tamper_signals_json TEXT DEFAULT '{}',
        signals_list_json TEXT DEFAULT '[]',
        disclaimer TEXT DEFAULT 'This tool surfaces signals for human review. It does not verify document authenticity with certainty.',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications and Communications Audit Log Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications_log (
        id TEXT PRIMARY KEY,
        recipient_name TEXT NOT NULL,
        recipient_email TEXT,
        recipient_phone TEXT,
        channel TEXT CHECK(channel IN ('whatsapp', 'email', 'in_app')) NOT NULL,
        notification_type TEXT CHECK(notification_type IN ('drive_alert', 'interview_reminder', 'offer_letter', 'general')) NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata_json TEXT DEFAULT '{}',
        status TEXT DEFAULT 'sent',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const studColumns = db.prepare("PRAGMA table_info(student_profiles)").all().map(c => c.name);
    if (!studColumns.includes('phone')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN phone TEXT");
    }
    if (!studColumns.includes('admission_year')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN admission_year INTEGER");
    }
    if (!studColumns.includes('passing_year')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN passing_year INTEGER");
    }
    if (!studColumns.includes('batch_year')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN batch_year TEXT");
    }
    if (!studColumns.includes('university_email')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN university_email TEXT");
    }
    if (!studColumns.includes('whatsapp_number')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN whatsapp_number TEXT");
    }
    if (!studColumns.includes('access_status')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN access_status TEXT DEFAULT 'active'");
    }
    if (!studColumns.includes('is_authorized')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN is_authorized INTEGER DEFAULT 1");
    }

    // TPC Admin Authorized Student Whitelist Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS authorized_students (
        id TEXT PRIMARY KEY,
        roll_number TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        program TEXT DEFAULT 'BTech CSE',
        branch TEXT DEFAULT 'Computer Science & Engineering',
        cgpa REAL DEFAULT 8.0,
        passing_year INTEGER DEFAULT 2026,
        admission_year INTEGER DEFAULT 2022,
        phone TEXT DEFAULT '',
        access_status TEXT DEFAULT 'active' CHECK(access_status IN ('active', 'blocked', 'pending')),
        authorized_by TEXT DEFAULT 'TPC Admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sync existing student profiles into authorized_students table so existing users have access
    const existingStudentsForAuth = db.prepare(`
      SELECT s.roll_number, u.email, s.name, s.program, s.branch, s.cgpa, s.passing_year, s.admission_year, s.phone
      FROM student_profiles s
      JOIN users u ON s.user_id = u.id
      WHERE s.roll_number IS NOT NULL AND u.email IS NOT NULL
    `).all();

    const insertAuthStudentStmt = db.prepare(`
      INSERT OR IGNORE INTO authorized_students (id, roll_number, email, name, program, branch, cgpa, passing_year, admission_year, phone, access_status, authorized_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'TPC Admin Governance')
    `);

    // Ensure core test students are pre-authorized
    const coreDefaultStudents = [
      { roll_number: '24BT04171', email: '24bt04171@gsfcuniversity.ac.in', name: 'Om Thakkar', program: 'BTech CSE', branch: 'Computer Science & Engineering', cgpa: 8.9, passing_year: 2026, admission_year: 2024, phone: '+91 98765 43210' },
      { roll_number: '21BCE045', email: 'thakkar_om@gmail.com', name: 'Thakkar Om', program: 'BTech CSE', branch: 'Computer Science & Engineering', cgpa: 8.8, passing_year: 2026, admission_year: 2022, phone: '+91 98765 43210' },
      { roll_number: '21BCE042', email: 'student@gsfcuniversity.ac.in', name: 'Priya Patel', program: 'BTech CSE', branch: 'Computer Science & Engineering', cgpa: 8.6, passing_year: 2026, admission_year: 2022, phone: '+91 98765 43210' },
      { roll_number: '22BCE108', email: 'tanvi.j@gsfcuniversity.ac.in', name: 'Tanvi Joshi', program: 'BTech CSE', branch: 'AI & Data Science', cgpa: 9.1, passing_year: 2026, admission_year: 2022, phone: '+91 98765 43210' },
      { roll_number: '22BCH012', email: 'arav.sharma@student.gsfc.ac.in', name: 'Arav Sharma', program: 'BTech Chemical', branch: 'Chemical Engineering', cgpa: 8.4, passing_year: 2026, admission_year: 2022, phone: '+91 98765 43210' },
      { roll_number: '21BME034', email: 'rahul.verma@gsfcuniversity.ac.in', name: 'Rahul Verma', program: 'BTech Mechanical', branch: 'Mechanical Engineering', cgpa: 8.2, passing_year: 2026, admission_year: 2022, phone: '+91 98765 43210' }
    ];

    for (const c of coreDefaultStudents) {
      insertAuthStudentStmt.run('auth_' + c.roll_number.toLowerCase(), c.roll_number, c.email.toLowerCase(), c.name, c.program, c.branch, c.cgpa, c.passing_year, c.admission_year, c.phone);
    }
    for (const st of existingStudentsForAuth) {
      insertAuthStudentStmt.run('auth_' + (st.roll_number || 'stud').toLowerCase(), st.roll_number, st.email.toLowerCase(), st.name, st.program || 'BTech CSE', st.branch || 'Engineering', st.cgpa || 8.0, st.passing_year || 2026, st.admission_year || 2022, st.phone || '');
    }

    // 📬 Inbound Student Mails Table & Pre-Seeding
    db.exec(`
      CREATE TABLE IF NOT EXISTS company_student_mails (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        company_id TEXT,
        sender_name TEXT NOT NULL,
        sender_email TEXT,
        sender_phone TEXT,
        roll_number TEXT,
        program TEXT,
        branch TEXT,
        cgpa REAL,
        type TEXT DEFAULT 'meeting_absence',
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        meeting_id TEXT,
        room_id TEXT,
        meeting_title TEXT,
        drive_title TEXT,
        status TEXT DEFAULT 'unread',
        recruiter_reply TEXT,
        replied_at DATETIME,
        replied_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      const mailCount = db.prepare('SELECT COUNT(*) as count FROM company_student_mails').get()?.count || 0;
      if (mailCount === 0) {
        const seedMailStmt = db.prepare(`
          INSERT OR IGNORE INTO company_student_mails 
          (id, company_name, company_id, sender_name, sender_email, sender_phone, roll_number, program, branch, cgpa, type, subject, message, meeting_id, room_id, meeting_title, drive_title, status, recruiter_reply, replied_at, replied_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        seedMailStmt.run(
          'mail_seed_1', 'Google Cloud India', 'c_google', 'Thakkar Om', 'thakkar_om@gmail.com', '+91 95584 13347',
          '24BT04171', 'BTech CSE', 'Computer Science & Engineering', 8.9, 'meeting_absence',
          '[Meeting Absence Explanation] Thakkar Om — Room gsfc-google-ai-101',
          'Dear Google Cloud Hiring Team,\n\nDuring the live proctoring check for room gsfc-google-ai-101 (Software Development Engineer - AI & Cloud), I encountered an unexpected network glitch and temporary webcam permission refresh which triggered a security lock. I sincerely apologize for the inconvenience. I have retested my video/mic setup and would appreciate if my technical round can be rescheduled or re-evaluated.\n\nThank you,\nThakkar Om\nRoll No: 24BT04171',
          'meet_google_ai_101', 'gsfc-google-ai-101', 'Google Cloud India — SDE Technical Interview & Live Coding',
          'Software Development Engineer - Cloud & AI', 'unread', null, null, null, new Date(Date.now() - 1000 * 60 * 45).toISOString()
        );

        seedMailStmt.run(
          'mail_seed_2', 'Tata Consultancy Services (TCS)', 'c_tcs', 'Arav Sharma', 'arav.sharma@student.gsfc.ac.in', '+91 98765 43212',
          '22BCE115', 'BTech CSE', 'Cybersecurity', 8.6, 'leave_company',
          '[Withdrawal Request] Arav Sharma — TCS Digital Prime',
          'Respected TCS Recruitment Panel,\n\nI am writing to formally request withdrawal of my application from the TCS Digital recruitment process. I have accepted an offer from an earlier campus drive that aligns with my specialization in cybersecurity operations. I want to express my sincere gratitude for considering my profile.\n\nBest regards,\nArav Sharma',
          'meet_tcs_digital_202', 'gsfc-tcs-digital-202', 'TCS Digital — Technical Assessment & System Design Review',
          'TCS Digital Prime (₹9.00 LPA)', 'replied',
          'Dear Arav, We acknowledge your formal withdrawal request and have updated your application status accordingly. We wish you the very best in your future career endeavors.',
          new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 'TCS Campus Talent Acquisition Team', new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
        );

        seedMailStmt.run(
          'mail_seed_3', 'GSFC Limited', 'c_gsfc_limited', 'Tanvi Joshi', 'tanvi.j@gsfcuniversity.ac.in', '+91 98765 43211',
          '22BCE108', 'BTech CSE', 'AI & Data Science', 8.8, 'meeting_absence',
          '[Meeting Absence Explanation] Tanvi Joshi — Industrial Systems Interview',
          'Respected GSFC Limited Placement Committee,\n\nI was unable to join the initial 10-minute briefing today due to mid-semester laboratory examination duties at GSFC University. I am now available and ready to present my technical portfolio for the Industrial Automation Systems Officer role at your earliest convenience.\n\nSincerely,\nTanvi Joshi',
          'meet_gsfc_auto_01', 'GSFC-MEET-AUTO-771', 'GSFC Limited — Industrial Automation & Telemetry Panel',
          'IT & Industrial Automation Systems Officer', 'read', null, null, null, new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
        );

        seedMailStmt.run(
          'mail_seed_4', 'Microsoft Azure Systems', 'c_microsoft', 'Pooja Patel', 'pooja.patel@student.gsfc.ac.in', '+91 98765 43213',
          '22BCE124', 'BTech IT', 'Information Technology', 9.1, 'meeting_absence',
          '[Meeting Absence Explanation] Pooja Patel — Azure Cloud Assessment',
          'Dear Microsoft Recruiting Team,\n\nI encountered a brief power brownout in our campus area right at the scheduled interview start time. The backup power is restored now. Kindly permit me to rejoin the interview queue if possible.\n\nWarm regards,\nPooja Patel',
          'meet_ms_azure_03', 'GSFC-MEET-AZURE-404', 'Microsoft Azure — Cloud Systems Interview',
          'Graduate Software Engineer (₹24.00 LPA)', 'unread', null, null, null, new Date(Date.now() - 1000 * 60 * 120).toISOString()
        );
      }
    } catch (e) {
      console.warn('Notice seeding student mails:', e.message);
    }

    // 🎮 Gamification, ⛓️ Blockchain, and 💬 WhatsApp Tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS gamification_rules (
        action_key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        points_reward INTEGER DEFAULT 25,
        badge_code TEXT,
        badge_name TEXT,
        badge_icon TEXT,
        badge_desc TEXT,
        threshold INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS student_gamification (
        student_id TEXT PRIMARY KEY REFERENCES student_profiles(id) ON DELETE CASCADE,
        points_total INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 1,
        nickname TEXT,
        is_anonymous INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure student_gamification has points_total, nickname, and is_anonymous columns
    const gamColumns = db.prepare("PRAGMA table_info(student_gamification)").all().map(c => c.name);
    if (!gamColumns.includes('points_total')) {
      db.exec("ALTER TABLE student_gamification ADD COLUMN points_total INTEGER DEFAULT 0");
      db.exec("UPDATE student_gamification SET points_total = COALESCE(total_xp, 150) WHERE points_total = 0 OR points_total IS NULL");
    }
    if (!gamColumns.includes('nickname')) {
      db.exec("ALTER TABLE student_gamification ADD COLUMN nickname TEXT");
    }
    if (!gamColumns.includes('is_anonymous')) {
      db.exec("ALTER TABLE student_gamification ADD COLUMN is_anonymous INTEGER DEFAULT 0");
    }

    db.exec(`


      CREATE TABLE IF NOT EXISTS student_badges (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        badge_code TEXT NOT NULL,
        badge_name TEXT NOT NULL,
        badge_icon TEXT NOT NULL,
        badge_desc TEXT NOT NULL,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, badge_code)
      );

      CREATE TABLE IF NOT EXISTS gamification_points_log (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        action_key TEXT NOT NULL,
        points_awarded INTEGER NOT NULL,
        description TEXT,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS blockchain_ledger (
        block_number INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id TEXT UNIQUE NOT NULL,
        doc_type TEXT NOT NULL,
        student_id TEXT,
        student_name TEXT NOT NULL,
        roll_number TEXT,
        department TEXT,
        company_name TEXT,
        job_role TEXT,
        ctc TEXT,
        issuing_authority TEXT NOT NULL,
        document_hash TEXT NOT NULL,
        previous_block_hash TEXT NOT NULL,
        block_hash TEXT NOT NULL,
        merkle_root TEXT NOT NULL,
        signature TEXT NOT NULL,
        anchored_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'VALID_CONFIRMED'
      );

      CREATE TABLE IF NOT EXISTS whatsapp_notification_logs (
        id TEXT PRIMARY KEY,
        recipient_phone TEXT NOT NULL,
        recipient_name TEXT,
        student_id TEXT,
        template_type TEXT NOT NULL,
        message_body TEXT NOT NULL,
        status TEXT DEFAULT 'SENT',
        whatsapp_url TEXT,
        metadata_json TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS whatsapp_student_opt_in (
        student_id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        opt_in INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscription_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        badge_title TEXT NOT NULL,
        price_inr INTEGER NOT NULL,
        duration_days INTEGER NOT NULL,
        max_postings INTEGER NOT NULL,
        description TEXT NOT NULL,
        features_json TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS company_subscriptions (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        started_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        postings_used INTEGER DEFAULT 0,
        max_postings INTEGER NOT NULL,
        status TEXT CHECK(status IN ('active', 'expired', 'cancelled', 'grace_period')) DEFAULT 'active',
        last_payment_id TEXT,
        auto_renew INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payment_transactions (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        amount_inr INTEGER NOT NULL,
        currency TEXT DEFAULT 'INR',
        gateway TEXT DEFAULT 'Razorpay',
        gateway_order_id TEXT UNIQUE NOT NULL,
        gateway_payment_id TEXT,
        gateway_signature TEXT,
        payment_method TEXT DEFAULT 'UPI / Cards / NetBanking',
        status TEXT CHECK(status IN ('created', 'paid', 'failed', 'refunded')) DEFAULT 'created',
        receipt_number TEXT UNIQUE NOT NULL,
        billing_email TEXT,
        billing_phone TEXT,
        gst_number TEXT,
        invoice_data_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME
      );
    `);

    // Seed default subscription plans
    const defaultPlans = [
      {
        id: 'plan_bronze',
        name: 'Bronze Recruiter Plan',
        badge_title: 'Bronze Tier',
        price_inr: 10000,
        duration_days: 15,
        max_postings: 3,
        description: 'Essential on-campus recruitment package with candidate search, shortlist view, and 3 campus placement drives.',
        features_json: JSON.stringify({
          max_postings: 3,
          resume_download: true,
          shortlist_view: true,
          ats_score_view: false,
          candidate_readiness: false,
          online_meetings: false,
          homepage_featured: false,
          direct_messaging: false,
          support_level: 'Standard TPC Listing & Email Support'
        }),
        display_order: 1
      },
      {
        id: 'plan_silver',
        name: 'Silver Pro Recruiter Plan',
        badge_title: 'Silver Tier',
        price_inr: 25000,
        duration_days: 30,
        max_postings: 10,
        description: 'High-growth hiring tier with full resume PDF downloads, AI ATS ranking, candidate screening, and 10 campus drives.',
        features_json: JSON.stringify({
          max_postings: 10,
          resume_download: true,
          shortlist_view: true,
          ats_score_view: true,
          candidate_readiness: true,
          online_meetings: false,
          homepage_featured: false,
          direct_messaging: true,
          support_level: 'Priority Placement Listing & WhatsApp TPC Support'
        }),
        display_order: 2
      },
      {
        id: 'plan_gold',
        name: 'Gold Enterprise Sovereign',
        badge_title: 'Gold Tier (Enterprise)',
        price_inr: 50000,
        duration_days: 60,
        max_postings: -1,
        description: 'Unlimited campus placement drives, AI predictive match score insights, in-portal video interviews, and dedicated TPC concierge.',
        features_json: JSON.stringify({
          max_postings: -1,
          resume_download: true,
          shortlist_view: true,
          ats_score_view: true,
          candidate_readiness: true,
          online_meetings: true,
          homepage_featured: true,
          direct_messaging: true,
          support_level: 'Dedicated TPC Account Manager, Priority Campus Interview Rooms'
        }),
        display_order: 3
      }
    ];

    const upsertPlanStmt = db.prepare(`
      INSERT INTO subscription_plans 
      (id, name, badge_title, price_inr, duration_days, max_postings, description, features_json, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        badge_title = excluded.badge_title,
        price_inr = excluded.price_inr,
        duration_days = excluded.duration_days,
        max_postings = excluded.max_postings,
        description = excluded.description,
        features_json = excluded.features_json,
        display_order = excluded.display_order
    `);

    for (const p of defaultPlans) {
      upsertPlanStmt.run(p.id, p.name, p.badge_title, p.price_inr, p.duration_days, p.max_postings, p.description, p.features_json, p.display_order);
    }



    // Auto-compute admission_year, passing_year, and batch_year for any records missing them
    const allStuds = db.prepare("SELECT id, roll_number, program, created_at FROM student_profiles").all();
    const updateBatchStmt = db.prepare(`
      UPDATE student_profiles 
      SET admission_year = ?, passing_year = ?, batch_year = ? 
      WHERE id = ?
    `);

    for (const st of allStuds) {
      let admYear = 2022;
      const rollMatch = (st.roll_number || '').match(/^(\d{2})/);
      if (rollMatch) {
        admYear = 2000 + parseInt(rollMatch[1], 10);
      } else if (st.created_at) {
        const d = new Date(st.created_at);
        if (!isNaN(d.getFullYear())) admYear = d.getFullYear() - 2;
      }
      
      const duration = (st.program || '').toLowerCase().includes('mba') || (st.program || '').toLowerCase().includes('msc') ? 2 : 4;
      const passYear = admYear + duration;
      const batchStr = `${admYear}-${passYear}`;

      updateBatchStmt.run(admYear, passYear, batchStr, st.id);
    }

    // Ensure multi-year diverse students exist across every batch (2020 through 2026)
    seedMultiYearStudents();

    // High-Performance Database Indexes for Instant TPC Admin Login & Queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_company_profiles_approved ON company_profiles(approved);
      CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_student_profiles_passing_year ON student_profiles(passing_year);
      CREATE INDEX IF NOT EXISTS idx_student_profiles_admission_year ON student_profiles(admission_year);
      CREATE INDEX IF NOT EXISTS idx_requirements_company_id ON requirements(company_id);
      CREATE INDEX IF NOT EXISTS idx_applications_req_id ON applications(requirement_id);
      CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
    `);

    // 🎪 Events, External Candidates, Pass Tokens, and Entry Logs Table Migrations
    db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'Fest',
        event_date TEXT NOT NULL,
        end_date TEXT,
        venue TEXT DEFAULT 'GSFC University Auditorium',
        banner_url TEXT,
        is_registration_open INTEGER DEFAULT 1,
        max_registrations INTEGER DEFAULT 1000,
        custom_fields_json TEXT DEFAULT '[]',
        created_by TEXT DEFAULT 'TPC Admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS external_candidates (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        organization TEXT NOT NULL,
        city TEXT DEFAULT 'Vadodara',
        photo_url TEXT,
        id_proof_url TEXT,
        pass_token TEXT UNIQUE NOT NULL,
        custom_data_json TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS pass_tokens (
        token TEXT PRIMARY KEY,
        candidate_type TEXT CHECK(candidate_type IN ('student', 'external')) NOT NULL,
        candidate_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        qr_payload TEXT,
        status TEXT DEFAULT 'issued' CHECK(status IN ('issued', 'checked_in', 'cancelled')),
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS entry_logs (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL,
        event_id TEXT NOT NULL,
        candidate_type TEXT NOT NULL,
        candidate_id TEXT NOT NULL,
        candidate_name TEXT NOT NULL,
        candidate_email TEXT NOT NULL,
        candidate_phone TEXT,
        candidate_org TEXT NOT NULL,
        candidate_photo TEXT,
        scanned_by_user_id TEXT NOT NULL,
        scanned_by_name TEXT NOT NULL,
        scanned_by_role TEXT NOT NULL,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'present',
        gate_name TEXT DEFAULT 'Main Campus Gate A'
      );

      CREATE TABLE IF NOT EXISTS security_staff_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        gate_assigned TEXT DEFAULT 'Main Campus Gate A',
        shift TEXT DEFAULT 'Day Shift (08:00 AM - 04:00 PM)',
        active_status TEXT DEFAULT 'active' CHECK(active_status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
      CREATE INDEX IF NOT EXISTS idx_external_candidates_event_id ON external_candidates(event_id);
      CREATE INDEX IF NOT EXISTS idx_pass_tokens_token ON pass_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_entry_logs_event_id ON entry_logs(event_id);
      CREATE INDEX IF NOT EXISTS idx_entry_logs_token ON entry_logs(token);
      CREATE INDEX IF NOT EXISTS idx_entry_logs_scanned_by ON entry_logs(scanned_by_user_id);
    `);

    // Seed Flagship Fests / Events
    try {
      const insertEventStmt = db.prepare(`
        INSERT OR IGNORE INTO events (id, title, slug, description, category, event_date, end_date, venue, banner_url, is_registration_open, max_registrations, custom_fields_json, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TPC Admin Governance')
      `);

      const sampleFests = [
        {
          id: 'evt_anveshan_2026',
          title: 'GSFC Anveshan 2026 Tech & Career Fest',
          slug: 'anveshan-2026',
          description: 'Annual Flagship National Technical & Placement Conclave featuring 50+ recruiting companies, competitive hackathons, industry keynotes, and career discovery pavilions.',
          category: 'Tech Fest & Career Fair',
          event_date: '2026-09-18',
          end_date: '2026-09-20',
          venue: 'GSFC University Auditorium, Dome & Tech Hub',
          banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
          is_registration_open: 1,
          max_registrations: 2500,
          custom_fields_json: JSON.stringify([
            { name: 'College / Institute Name', type: 'text', required: true },
            { name: 'Specialization / Domain', type: 'select', options: ['Computer Science', 'Chemical Engg', 'Mechanical Engg', 'Life Sciences', 'Management'], required: true },
            { name: 'Degree Year', type: 'select', options: ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Alumni / Graduate'], required: true }
          ])
        },
        {
          id: 'evt_chemcon_2026',
          title: 'GSFC ChemCon 2026 - Industrial Chemistry Summit',
          slug: 'chemcon-2026',
          description: 'Premier national conclave on sustainable green chemistry, industrial safety innovations, process optimization, and live industry recruiter interviews.',
          category: 'Industry Summit',
          event_date: '2026-10-05',
          end_date: '2026-10-06',
          venue: 'School of Science & Chemical Engineering Complex',
          banner_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80',
          is_registration_open: 1,
          max_registrations: 1200,
          custom_fields_json: JSON.stringify([
            { name: 'Institution / Company', type: 'text', required: true },
            { name: 'Research Interest', type: 'text', required: false }
          ])
        },
        {
          id: 'evt_hackathon_2026',
          title: 'GSFC HackInnovate 2026 - 36Hr AI Hackathon',
          slug: 'hackinnovate-2026',
          description: 'National 36-hour offline hackathon on Agentic AI, Sustainability & Smart Manufacturing with INR 3,00,000 cash prizes and direct interview opportunities.',
          category: 'Hackathon',
          event_date: '2026-11-12',
          end_date: '2026-11-13',
          venue: 'SOT Innovation & Computing Labs',
          banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
          is_registration_open: 1,
          max_registrations: 800,
          custom_fields_json: JSON.stringify([
            { name: 'Team Name', type: 'text', required: true },
            { name: 'GitHub Profile URL', type: 'url', required: true }
          ])
        }
      ];

      for (const f of sampleFests) {
        insertEventStmt.run(f.id, f.title, f.slug, f.description, f.category, f.event_date, f.end_date, f.venue, f.banner_url, f.is_registration_open, f.max_registrations, f.custom_fields_json);
      }
    } catch (e) {
      console.error('Event seed notice:', e.message);
    }

    // Seed Security Staff Users
    try {
      const defaultSecUsers = [
        { id: 'u_sec_01', email: 'security@gsfcuniversity.ac.in', name: 'Officer Vikram Singh', phone: '+91 98250 11223', gate: 'Main Campus Gate A', shift: 'Day Shift (08:00 AM - 04:00 PM)' },
        { id: 'u_sec_02', email: 'guard@gsfcuniversity.ac.in', name: 'Officer Rajesh Rawat', phone: '+91 98250 44556', gate: 'Dome Event Gate B', shift: 'Evening Shift (04:00 PM - 12:00 AM)' }
      ];

      for (const sec of defaultSecUsers) {
        db.prepare(`
          INSERT OR REPLACE INTO users (id, email, password_hash, role)
          VALUES (?, ?, ?, 'security')
        `).run(sec.id, sec.email, bcrypt.hashSync('password123', 6));

        db.prepare(`
          INSERT OR REPLACE INTO security_staff_profiles (id, user_id, name, phone, gate_assigned, shift, active_status)
          VALUES (?, ?, ?, ?, ?, ?, 'active')
        `).run('sec_prof_' + sec.id, sec.id, sec.name, sec.phone, sec.gate, sec.shift);
      }
    } catch (e) {
      console.error('Security staff seed notice:', e.message);
    }

    // Seed Sample External Candidates & Digital Pass Tokens
    try {
      const sampleExternalCandidates = [
        { id: 'ext_01', event_id: 'evt_anveshan_2026', name: 'Kavya Sharma', email: 'kavya.sharma@msu.ac.in', phone: '+91 98761 12233', organization: 'MS University Vadodara', city: 'Vadodara', photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', pass_token: 'GSFC-PASS-ANV-101' },
        { id: 'ext_02', event_id: 'evt_anveshan_2026', name: 'Harshil Patel', email: 'harshil.patel@parul.ac.in', phone: '+91 98762 23344', organization: 'Parul Institute of Technology', city: 'Vadodara', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', pass_token: 'GSFC-PASS-ANV-102' },
        { id: 'ext_03', event_id: 'evt_anveshan_2026', name: 'Riya Shah', email: 'riya.shah@nirma.ac.in', phone: '+91 98763 34455', organization: 'Nirma University', city: 'Ahmedabad', photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', pass_token: 'GSFC-PASS-ANV-103' },
        { id: 'ext_04', event_id: 'evt_chemcon_2026', name: 'Aniket Desai', email: 'aniket.desai@iitb.ac.in', phone: '+91 98764 45566', organization: 'IIT Bombay', city: 'Mumbai', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', pass_token: 'GSFC-PASS-CHM-201' }
      ];

      for (const ec of sampleExternalCandidates) {
        db.prepare(`
          INSERT OR IGNORE INTO external_candidates (id, event_id, name, email, phone, organization, city, photo_url, pass_token, custom_data_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(ec.id, ec.event_id, ec.name, ec.email, ec.phone, ec.organization, ec.city, ec.photo_url, ec.pass_token, JSON.stringify({ registeredVia: 'Public Poster QR' }));

        db.prepare(`
          INSERT OR IGNORE INTO pass_tokens (token, candidate_type, candidate_id, event_id, qr_payload, status)
          VALUES (?, 'external', ?, ?, ?, 'issued')
        `).run(ec.pass_token, ec.id, ec.event_id, JSON.stringify({ token: ec.pass_token, name: ec.name, eventId: ec.event_id }));
      }
    } catch (e) {
      console.error('External candidate seed notice:', e.message);
    }

    // Seed Sample Pass Tokens for GSFC Students
    try {
      const sampleStudentPasses = [
        { token: 'GSFC-PASS-STU-24BT04171', student_id: 's_omthakkar', event_id: 'evt_anveshan_2026', name: 'Om Thakkar' },
        { token: 'GSFC-PASS-STU-21BCE045', student_id: 's_21bce045', event_id: 'evt_anveshan_2026', name: 'Thakkar Om' },
        { token: 'GSFC-PASS-STU-21BCE042', student_id: 's_21bce042', event_id: 'evt_anveshan_2026', name: 'Priya Patel' },
        { token: 'GSFC-PASS-STU-22BCE108', student_id: 's_22bce108', event_id: 'evt_anveshan_2026', name: 'Tanvi Joshi' }
      ];

      for (const sp of sampleStudentPasses) {
        db.prepare(`
          INSERT OR IGNORE INTO pass_tokens (token, candidate_type, candidate_id, event_id, qr_payload, status)
          VALUES (?, 'student', ?, ?, ?, 'issued')
        `).run(sp.token, sp.student_id, sp.event_id, JSON.stringify({ token: sp.token, studentId: sp.student_id, name: sp.name }));
      }
    } catch (e) {
      console.error('Student pass seed notice:', e.message);
    }

    // Seed Initial Live Entry Logs
    try {
      const sampleLogs = [
        { id: 'log_01', token: 'GSFC-PASS-ANV-101', event_id: 'evt_anveshan_2026', candidate_type: 'external', candidate_id: 'ext_01', candidate_name: 'Kavya Sharma', candidate_email: 'kavya.sharma@msu.ac.in', candidate_phone: '+91 98761 12233', candidate_org: 'MS University Vadodara', candidate_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80', scanned_by_id: 'u_sec_01', scanned_by_name: 'Officer Vikram Singh', scanned_by_role: 'security', scanned_at: '2026-08-24 09:30:15', gate: 'Main Campus Gate A' },
        { id: 'log_02', token: 'GSFC-PASS-STU-24BT04171', event_id: 'evt_anveshan_2026', candidate_type: 'student', candidate_id: 's_omthakkar', candidate_name: 'Om Thakkar', candidate_email: '24bt04171@gsfcuniversity.ac.in', candidate_phone: '+91 95584 13347', candidate_org: 'GSFC University (24BT04171)', candidate_photo: '', scanned_by_id: 'u_sec_01', scanned_by_name: 'Officer Vikram Singh', scanned_by_role: 'security', scanned_at: '2026-08-24 09:45:22', gate: 'Main Campus Gate A' },
        { id: 'log_03', token: 'GSFC-PASS-ANV-102', event_id: 'evt_anveshan_2026', candidate_type: 'external', candidate_id: 'ext_02', candidate_name: 'Harshil Patel', candidate_email: 'harshil.patel@parul.ac.in', candidate_phone: '+91 98762 23344', candidate_org: 'Parul Institute of Technology', candidate_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', scanned_by_id: 'u_faculty_neeshu', scanned_by_name: 'Dr. Neeshu Chaudhary', scanned_by_role: 'faculty', scanned_at: '2026-08-24 10:12:08', gate: 'Auditorium Gate 1' }
      ];

      for (const l of sampleLogs) {
        db.prepare(`
          INSERT OR IGNORE INTO entry_logs (id, token, event_id, candidate_type, candidate_id, candidate_name, candidate_email, candidate_phone, candidate_org, candidate_photo, scanned_by_user_id, scanned_by_name, scanned_by_role, scanned_at, status, gate_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'present', ?)
        `).run(l.id, l.token, l.event_id, l.candidate_type, l.candidate_id, l.candidate_name, l.candidate_email, l.candidate_phone, l.candidate_org, l.candidate_photo, l.scanned_by_id, l.scanned_by_name, l.scanned_by_role, l.scanned_at, l.gate);
      }
    } catch (e) {
      console.error('Entry logs seed notice:', e.message);
    }

    // 📹 In-Portal Video Meetings & Proctoring Table Migrations
    db.exec(`
      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        room_id TEXT UNIQUE NOT NULL,
        drive_id TEXT NOT NULL,
        company_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        scheduled_at DATETIME NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        status TEXT CHECK(status IN ('scheduled', 'live', 'completed', 'cancelled')) DEFAULT 'scheduled',
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        summary_notes TEXT,
        FOREIGN KEY(drive_id) REFERENCES requirements(id) ON DELETE CASCADE,
        FOREIGN KEY(company_id) REFERENCES company_profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meeting_participants (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        student_id TEXT,
        role TEXT CHECK(role IN ('student', 'company', 'admin', 'faculty')) NOT NULL,
        join_status TEXT CHECK(join_status IN ('invited', 'joined', 'left', 'ejected', 'no_show')) DEFAULT 'invited',
        joined_at DATETIME,
        left_at DATETIME,
        outcome_status TEXT CHECK(outcome_status IN ('pending', 'selected', 'rejected', 'hold', 'no_show')) DEFAULT 'pending',
        interviewer_notes TEXT DEFAULT '',
        evaluation_score REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(student_id) REFERENCES student_profiles(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS meeting_violations (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_email TEXT NOT NULL,
        violation_type TEXT CHECK(violation_type IN ('tab_switch', 'window_blur', 'navigation_attempt', 'refresh_attempt', 'closed_tab', 'ejected')) NOT NULL,
        details TEXT NOT NULL,
        occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY(student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS meeting_chat_messages (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_role TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_meetings_room_id ON meetings(room_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_drive_id ON meetings(drive_id);
      CREATE INDEX IF NOT EXISTS idx_meetings_company_id ON meetings(company_id);
      CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
      CREATE INDEX IF NOT EXISTS idx_meeting_participants_user_id ON meeting_participants(user_id);
      CREATE INDEX IF NOT EXISTS idx_meeting_violations_meeting_id ON meeting_violations(meeting_id);
    `);

    seedMeetingData();


    // Auto-repair any hotlink-blocked or missing company logo URLs in SQLite database
    db.exec(`
      UPDATE company_profiles 
      SET logo_url = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80' 
      WHERE logo_url IS NULL OR logo_url = '' OR logo_url LIKE '%wikimedia%';

      UPDATE requirements 
      SET company_logo_url = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80' 
      WHERE company_logo_url IS NULL OR company_logo_url = '' OR company_logo_url LIKE '%wikimedia%';
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS interview_evaluations (
        id TEXT PRIMARY KEY,
        student_id TEXT,
        requirement_id TEXT,
        question_text TEXT NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        verdict TEXT CHECK(verdict IN ('pass', 'needs_improvement', 'fail')) NOT NULL,
        score INTEGER NOT NULL,
        concepts_covered_json TEXT DEFAULT '[]',
        concepts_missing_json TEXT DEFAULT '[]',
        attempt_count INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 🎮 Gamification Engine Tables
      CREATE TABLE IF NOT EXISTS student_gamification (
        student_id TEXT PRIMARY KEY,
        points_total INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 1,
        is_anonymous INTEGER DEFAULT 0,
        nickname TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS student_badges (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        badge_code TEXT NOT NULL,
        badge_name TEXT NOT NULL,
        badge_icon TEXT NOT NULL,
        badge_desc TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS gamification_rules (
        action_key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        points_reward INTEGER NOT NULL,
        badge_code TEXT,
        badge_name TEXT,
        badge_icon TEXT,
        badge_desc TEXT,
        threshold INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS gamification_points_log (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        action_key TEXT NOT NULL,
        points_awarded INTEGER NOT NULL,
        description TEXT NOT NULL,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- ⛓️ Blockchain-Anchored Document Verification Ledger
      CREATE TABLE IF NOT EXISTS blockchain_anchored_documents (
        id TEXT PRIMARY KEY,
        document_type TEXT NOT NULL, -- 'offer_letter', 'placement_certificate', 'eligibility_pass'
        document_title TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        roll_number TEXT NOT NULL,
        company_name TEXT,
        job_title TEXT,
        ctc_range TEXT,
        document_hash TEXT NOT NULL, -- SHA-256
        previous_block_hash TEXT NOT NULL,
        merkle_root TEXT,
        block_number INTEGER NOT NULL,
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        issuer_id TEXT,
        issuer_name TEXT,
        issuer_role TEXT,
        status TEXT DEFAULT 'anchored', -- 'anchored', 'revoked'
        metadata_json TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_blockchain_hash ON blockchain_anchored_documents(document_hash);
      CREATE INDEX IF NOT EXISTS idx_blockchain_student ON blockchain_anchored_documents(student_id);
    `);

    // Add 2FA columns to users table if not exists
    try {
      db.exec(`
        ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0;
      `);
    } catch(e) {}
    try {
      db.exec(`
        ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
      `);
    } catch(e) {}
    try {
      db.exec(`
        ALTER TABLE users ADD COLUMN two_factor_backup_codes_json TEXT;
      `);
    } catch(e) {}

    // Add WhatsApp columns to student_profiles table if not exists
    try {
      db.exec(`
        ALTER TABLE student_profiles ADD COLUMN whatsapp_opt_in INTEGER DEFAULT 1;
      `);
    } catch(e) {}
    try {
      db.exec(`
        ALTER TABLE student_profiles ADD COLUMN whatsapp_number TEXT;
      `);
    } catch(e) {}

    // Migrate users.role check constraint if 'faculty'/'superadmin'/'security' is missing
    const userTableCheckSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get()?.sql || '';
    if (userTableCheckSql && (!userTableCheckSql.includes("'faculty'") || !userTableCheckSql.includes("'superadmin'") || !userTableCheckSql.includes("'security'"))) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE IF NOT EXISTS users_migrated (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT CHECK(role IN ('student', 'company', 'admin', 'alumni', 'faculty', 'superadmin', 'security')) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT OR IGNORE INTO users_migrated (id, email, password_hash, role, created_at)
        SELECT id, email, password_hash,
          CASE 
            WHEN role NOT IN ('student', 'company', 'admin', 'alumni', 'faculty', 'superadmin', 'security') THEN 'student'
            ELSE role
          END,
          created_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_migrated RENAME TO users;
      `);
      db.pragma('foreign_keys = ON');
    }

    // Ensure qa_threads has correct schema (id, student_id, student_name, title, body, category, status, created_at)
    const qaThreadsCols = db.prepare("PRAGMA table_info(qa_threads)").all();
    const hasStudentId = qaThreadsCols.some(c => c.name === 'student_id');
    if (qaThreadsCols.length > 0 && !hasStudentId) {
      db.pragma('foreign_keys = OFF');
      try {
        db.exec(`DROP TABLE IF EXISTS qa_threads;`);
      } catch(e) { console.warn('Migration notice (qa_threads reset):', e.message); }
      db.pragma('foreign_keys = ON');
    }


    // Fix qa_replies author_role constraint to include 'faculty' and 'tpo'
    const qaRepliesSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='qa_replies'").get()?.sql || '';
    if (qaRepliesSql && !qaRepliesSql.includes("'faculty'")) {
      db.pragma('foreign_keys = OFF');
      try {
        // qa_replies uses 'body' column (not 'content')
        db.exec(`
          CREATE TABLE qa_replies_migrated AS SELECT id, thread_id, author_id, author_name, author_role, body, created_at FROM qa_replies;
          DROP TABLE qa_replies;
          CREATE TABLE qa_replies (
            id TEXT PRIMARY KEY,
            thread_id TEXT NOT NULL,
            author_id TEXT,
            author_name TEXT,
            author_role TEXT CHECK(author_role IN ('student', 'alumni', 'admin', 'company', 'faculty', 'tpo')),
            body TEXT NOT NULL DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO qa_replies (id, thread_id, author_id, author_name, author_role, body, created_at)
          SELECT id, thread_id, author_id, author_name, author_role, body, created_at FROM qa_replies_migrated;
          DROP TABLE qa_replies_migrated;
        `);
      } catch(e) { console.warn('Migration notice (qa_replies):', e.message); }
      db.pragma('foreign_keys = ON');
    }

    // Fix any existing faculty users that were wrongly stored as 'student' due to old constraint
    try {
      db.exec("UPDATE users SET role = 'faculty' WHERE email LIKE '%faculty%' AND role = 'student'");
    } catch(e) { /* ignore if constraint still being applied */ }

    // 1. Alumni Profiles Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS alumni_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        batch_year TEXT,
        company TEXT,
        designation TEXT,
        linkedin_url TEXT,
        bio TEXT,
        verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Mentorship Posts Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS mentorship_posts (
        id TEXT PRIMARY KEY,
        alumni_id TEXT NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags_json TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Mentorship Comments Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS mentorship_comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES mentorship_posts(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL,
        author_name TEXT,
        author_role TEXT CHECK(author_role IN ('student', 'alumni', 'admin', 'company')),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Job Fairs Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS job_fairs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        event_date TEXT NOT NULL,
        venue TEXT,
        mode TEXT CHECK(mode IN ('online','offline','hybrid')) DEFAULT 'offline',
        status TEXT CHECK(status IN ('upcoming','live','closed')) DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Job Fair Companies Join Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS job_fair_companies (
        id TEXT PRIMARY KEY,
        job_fair_id TEXT NOT NULL REFERENCES job_fairs(id) ON DELETE CASCADE,
        requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_fair_id, requirement_id)
      );
    `);

    // 6. Job Fair Registrations Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS job_fair_registrations (
        id TEXT PRIMARY KEY,
        job_fair_id TEXT NOT NULL REFERENCES job_fairs(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_fair_id, student_id)
      );
    `);

    // 7. Community Q&A Threads Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS qa_threads (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT CHECK(status IN ('open','resolved')) DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_qa_threads_student ON qa_threads(student_id);
      CREATE INDEX IF NOT EXISTS idx_qa_threads_created ON qa_threads(created_at);
    `);

    // 8. Community Q&A Replies Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS qa_replies (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL REFERENCES qa_threads(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL,
        author_name TEXT,
        author_role TEXT CHECK(author_role IN ('student', 'alumni', 'admin', 'company', 'tpo', 'faculty', 'superadmin')),
        body TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_qa_replies_thread ON qa_replies(thread_id);
    `);

    // 9. Student Bookmarks Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_bookmarks (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        entity_type TEXT CHECK(entity_type IN ('requirement', 'job_fair', 'company', 'question', 'resource')) NOT NULL,
        entity_id TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, entity_type, entity_id)
      );
      CREATE INDEX IF NOT EXISTS idx_student_bookmarks ON student_bookmarks(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_bookmarks_entity ON student_bookmarks(entity_type, entity_id);
    `);

    // 10. Student Activity History Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_activity_history (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        related_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_student_activity ON student_activity_history(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_activity_created ON student_activity_history(created_at);
    `);

    // 11. Student Assessments & Test History Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_assessments (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        assessment_title TEXT NOT NULL,
        assessment_type TEXT CHECK(assessment_type IN ('aptitude', 'technical', 'coding', 'mock_interview', 'general')) NOT NULL,
        requirement_id TEXT,
        score REAL NOT NULL,
        percentage REAL NOT NULL,
        questions_attempted INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        incorrect_answers INTEGER DEFAULT 0,
        time_taken_seconds INTEGER DEFAULT 0,
        status TEXT CHECK(status IN ('in_progress', 'completed', 'evaluated')) DEFAULT 'completed',
        feedback_json TEXT DEFAULT '{}',
        answers_json TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_student_assessments ON student_assessments(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_assessments_created ON student_assessments(created_at);
    `);

    // 12. Student Documents & Placement Dossier Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_documents (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        document_type TEXT CHECK(document_type IN ('resume', 'marksheets', 'certifications', 'id_document', 'offer_letter', 'other')) NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        version INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_student_documents ON student_documents(student_id);
    `);

    // 13. Student Notifications Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_notifications (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        notification_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        related_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_student_notifications ON student_notifications(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_notifications_unread ON student_notifications(student_id, is_read);
    `);

    // 14. Student Resumes & Version History Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_resumes (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        version_name TEXT NOT NULL,
        resume_url TEXT,
        parsed_json TEXT,
        ats_score INTEGER DEFAULT 0,
        ats_feedback_json TEXT DEFAULT '[]',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_student_resumes ON student_resumes(student_id);
    `);

    // 15. Student Placement Preparation Plans Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_preparation_plans (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        target_company TEXT NOT NULL,
        target_role TEXT NOT NULL,
        deadline_date TEXT,
        total_days INTEGER DEFAULT 30,
        days_json TEXT NOT NULL,
        progress_percentage INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_prep_plans_student ON student_preparation_plans(student_id);
    `);

    // 16. Student Coding Sandbox Submissions Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_coding_submissions (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        problem_id TEXT NOT NULL,
        problem_title TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        company TEXT,
        language TEXT DEFAULT 'javascript',
        code TEXT NOT NULL,
        test_cases_passed INTEGER DEFAULT 0,
        total_test_cases INTEGER DEFAULT 0,
        execution_time_ms INTEGER DEFAULT 0,
        complexity_analysis_json TEXT,
        status TEXT DEFAULT 'accepted',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_coding_sub_student ON student_coding_submissions(student_id);
    `);

    // 17. Student Communication & GD Practices Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_communication_practices (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        practice_type TEXT NOT NULL, -- 'hr_question', 'gd_topic', 'behavioral_star', 'technical_explanation'
        topic_or_question TEXT NOT NULL,
        student_response TEXT NOT NULL,
        feedback_json TEXT NOT NULL,
        score INTEGER DEFAULT 80,
        fluency_score INTEGER DEFAULT 80,
        structure_score INTEGER DEFAULT 80,
        clarity_score INTEGER DEFAULT 80,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_comm_practices_student ON student_communication_practices(student_id);
    `);

    // 18. Student AI Study Generator Materials Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_study_materials (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- 'mcq_quiz', 'flashcards', 'revision_notes', 'interview_cheat_sheet'
        company TEXT,
        difficulty TEXT DEFAULT 'Medium',
        content_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_study_materials_student ON student_study_materials(student_id);
    `);

    // 19. Student Placement Gamification (XP, Streaks & Badges) Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS student_gamification (
        student_id TEXT PRIMARY KEY REFERENCES student_profiles(id) ON DELETE CASCADE,
        total_xp INTEGER DEFAULT 120,
        level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 1,
        highest_streak INTEGER DEFAULT 1,
        last_active_date TEXT DEFAULT (DATE('now')),
        badges_json TEXT DEFAULT '[]',
        achievements_json TEXT DEFAULT '[]',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 20. Placement Risk Alerts Table (TPC Admin Monitored)
    db.exec(`
      CREATE TABLE IF NOT EXISTS placement_risk_alerts (
        id TEXT PRIMARY KEY,
        student_id TEXT REFERENCES student_profiles(id) ON DELETE SET NULL,
        risk_type TEXT NOT NULL, -- 'eligible_not_applied', 'incomplete_profile', 'missing_resume', 'low_assessment_score', 'approaching_deadline'
        severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        requirement_id TEXT REFERENCES requirements(id) ON DELETE SET NULL,
        is_resolved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_risk_alerts_unresolved ON placement_risk_alerts(is_resolved, severity);
    `);

    // 21. GSFC Placement Knowledge Base / RAG Documents Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS placement_rag_documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- 'policy', 'eligibility', 'dream_tier', 'tpc_guidelines', 'faq', 'company_policy'
        content TEXT NOT NULL,
        tags_json TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Demo Alumni, Job Fairs & Q&A if not already present
    seedAlumniAndCommunityData();
    seedPlacementIntelligenceData();

    // Ensure GSFC Admin accounts exist
    const adminUser = db.prepare("SELECT * FROM users WHERE email = 'admin@gsfcuniversity.ac.in'").get();
    if (!adminUser) {
      const passHash = bcrypt.hashSync('password123', 10);
      db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run('u_admin_gsfc', 'admin@gsfcuniversity.ac.in', passHash, 'admin');
    }

    // Ensure Official GSFC Faculty Account: Dr. Neeshu Chaudhary
    const facultyUser = db.prepare("SELECT * FROM users WHERE email = 'neeshuchaudhary@gsfcuniversityfaculty.ac.in'").get();
    const facultyPassHash = bcrypt.hashSync('NEESHUCHAUDHARY@8495', 10);
    if (!facultyUser) {
      db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
        'u_faculty_neeshu',
        'neeshuchaudhary@gsfcuniversityfaculty.ac.in',
        facultyPassHash,
        'faculty'
      );
    } else {
      db.prepare("UPDATE users SET password_hash = ?, role = 'faculty' WHERE email = 'neeshuchaudhary@gsfcuniversityfaculty.ac.in'").run(
        facultyPassHash
      );
    }

    // 18. Persistent User Login History & Audit Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_login_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT NOT NULL,
        login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        logout_at DATETIME,
        session_status TEXT DEFAULT 'active' CHECK(session_status IN ('active', 'ended', 'expired', 'unknown')),
        ip_address TEXT,
        user_agent TEXT,
        device_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_login_user_id ON user_login_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_login_role ON user_login_history(role);
      CREATE INDEX IF NOT EXISTS idx_login_timestamp ON user_login_history(login_at);
    `);

    // 19. Persistent User Activity Timeline Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_activity_timeline (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        metadata_json TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity_timeline(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_created_at ON user_activity_timeline(created_at);
    `);

    // 20. Comprehensive Admin Audit Logs Table Migration
    const auditCols = db.prepare("PRAGMA table_info(admin_audit_logs)").all().map(c => c.name);
    if (!auditCols.includes('admin_user_id')) {
      db.exec("DROP TABLE IF EXISTS admin_audit_logs");
      db.exec(`
        CREATE TABLE admin_audit_logs (
          id TEXT PRIMARY KEY,
          admin_user_id TEXT NOT NULL,
          admin_email TEXT NOT NULL,
          action TEXT NOT NULL,
          target_entity_type TEXT,
          target_entity_id TEXT,
          details_json TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_admin_id ON admin_audit_logs(admin_user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_logs(created_at);
    `);

    // 21. Faculty Profiles Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS faculty_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        department TEXT NOT NULL,
        designation TEXT NOT NULL,
        assigned_batches TEXT,
        photo_url TEXT,
        status TEXT DEFAULT 'Active Verified',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON faculty_profiles(user_id);
    `);

    // Ensure users table tracking columns
    const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
    if (!userCols.includes('last_login_at')) {
      db.exec("ALTER TABLE users ADD COLUMN last_login_at DATETIME");
    }
    if (!userCols.includes('login_count')) {
      db.exec("ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 1");
    }
    if (!userCols.includes('last_logout_at')) {
      db.exec("ALTER TABLE users ADD COLUMN last_logout_at DATETIME");
    }
    if (!userCols.includes('current_session_status')) {
      db.exec("ALTER TABLE users ADD COLUMN current_session_status TEXT DEFAULT 'active'");
    }
    if (!userCols.includes('last_seen_at')) {
      db.exec("ALTER TABLE users ADD COLUMN last_seen_at DATETIME");
    }

    // Ensure student_profiles table tracking columns
    const studProfileCols = db.prepare("PRAGMA table_info(student_profiles)").all().map(c => c.name);
    if (!studProfileCols.includes('semester')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN semester INTEGER DEFAULT 7");
    }
    if (!studProfileCols.includes('division')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN division TEXT DEFAULT 'A'");
    }
    if (!studProfileCols.includes('profile_completion_pct')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN profile_completion_pct INTEGER DEFAULT 85");
    }
    if (!studProfileCols.includes('last_login_at')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN last_login_at DATETIME");
    }
    if (!studProfileCols.includes('login_count')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN login_count INTEGER DEFAULT 1");
    }
    if (!studProfileCols.includes('last_logout_at')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN last_logout_at DATETIME");
    }
    if (!studProfileCols.includes('current_session_status')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN current_session_status TEXT DEFAULT 'active'");
    }
    if (!studProfileCols.includes('last_seen_at')) {
      db.exec("ALTER TABLE student_profiles ADD COLUMN last_seen_at DATETIME");
    }

    // Seed Faculty Profiles
    const facultyCount = db.prepare("SELECT count(*) as c FROM faculty_profiles").get()?.c || 0;
    if (facultyCount === 0) {
      db.prepare(`
        INSERT INTO faculty_profiles (id, user_id, name, email, phone, department, designation, assigned_batches, photo_url, status)
        VALUES 
        ('f_neeshu', 'u_faculty_neeshu', 'Dr. Neeshu Chaudhary', 'neeshuchaudhary@gsfcuniversityfaculty.ac.in', '+91 95584 13347', 'Computer Science & Engineering', 'Faculty Placement Coordinator & Assistant Professor', 'BTech CSE & IT (2022-2026, 2023-2027)', '', 'Active Verified'),
        ('f_rajesh', 'u_faculty_rajesh', 'Dr. Rajesh Sharma', 'rajesh.sharma@gsfcuniversityfaculty.ac.in', '+91 98888 77777', 'Chemical Engineering', 'Senior Faculty Placement Advisor', 'BTech Chemical & Mechanical (2022-2026)', '', 'Active Verified')
      `).run();
    }

    // Seed Initial Login History and Activity Timeline if empty
    const loginHistoryCount = db.prepare("SELECT count(*) as c FROM user_login_history").get()?.c || 0;
    if (loginHistoryCount === 0) {
      const initialLogins = [
        { id: 'log_stu_01', user_id: 'u_student_24bt04171', role: 'student', email: '24bt04171@gsfcuniversity.ac.in', login_at: '2026-08-23 11:45:00', session_status: 'active', ip_address: '192.168.1.42', user_agent: 'Chrome 128 / macOS', device_type: 'Desktop' },
        { id: 'log_stu_02', user_id: 'u_student_vedant', role: 'student', email: 'vedant@gmail.com', login_at: '2026-08-23 10:15:00', session_status: 'active', ip_address: '192.168.1.88', user_agent: 'Chrome 128 / Windows 11', device_type: 'Desktop' },
        { id: 'log_stu_03', user_id: 'u_student_arav', role: 'student', email: 'arav.sharma@gsfcuniversity.ac.in', login_at: '2026-08-23 09:30:00', session_status: 'ended', logout_at: '2026-08-23 10:45:00', ip_address: '192.168.1.105', user_agent: 'Safari / iPhone 15', device_type: 'Mobile' },
        { id: 'log_fac_01', user_id: 'u_faculty_neeshu', role: 'faculty', email: 'neeshuchaudhary@gsfcuniversityfaculty.ac.in', login_at: '2026-08-23 08:30:00', session_status: 'active', ip_address: '10.0.1.12', user_agent: 'Chrome 128 / macOS Sequoia', device_type: 'Desktop' },
        { id: 'log_fac_02', user_id: 'u_faculty_rajesh', role: 'faculty', email: 'rajesh.sharma@gsfcuniversityfaculty.ac.in', login_at: '2026-08-23 09:00:00', session_status: 'ended', logout_at: '2026-08-23 10:30:00', ip_address: '10.0.1.18', user_agent: 'Edge 128 / Windows 11', device_type: 'Desktop' }
      ];

      const insertLoginStmt = db.prepare(`
        INSERT INTO user_login_history (id, user_id, role, email, login_at, logout_at, session_status, ip_address, user_agent, device_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const lg of initialLogins) {
        insertLoginStmt.run(lg.id, lg.user_id, lg.role, lg.email, lg.login_at, lg.logout_at || null, lg.session_status, lg.ip_address, lg.user_agent, lg.device_type);
      }

      const initialActivities = [
        { id: 'act_01', user_id: 'u_student_24bt04171', role: 'student', activity_type: 'LOGIN', title: 'Student Portal Sign-In', description: 'Logged into GSFC Student Placement Workspace via University SSO', metadata_json: JSON.stringify({ ip: '192.168.1.42', client: 'Desktop' }) },
        { id: 'act_02', user_id: 'u_student_24bt04171', role: 'student', activity_type: 'RESUME_UPLOADED', title: 'Resume Uploaded & ATS Analyzed', description: 'Updated technical resume. ATS Match Score: 92%', metadata_json: JSON.stringify({ ats_score: 92, target_role: 'Software Engineer' }) },
        { id: 'act_03', user_id: 'u_student_24bt04171', role: 'student', activity_type: 'APPLICATION_SUBMITTED', title: 'Application Submitted', description: 'Applied for GSFC Limited - Graduate Engineer Trainee', metadata_json: JSON.stringify({ company: 'GSFC Limited', role: 'GET Software' }) },
        { id: 'act_04', user_id: 'u_faculty_neeshu', role: 'faculty', activity_type: 'LOGIN', title: 'Faculty Portal Sign-In', description: 'Logged into GSFC Faculty Placement Hub', metadata_json: JSON.stringify({ ip: '10.0.1.12', client: 'Desktop' }) },
        { id: 'act_05', user_id: 'u_faculty_neeshu', role: 'faculty', activity_type: 'STUDENT_VERIFICATION', title: 'Student Dossiers Verified', description: 'Endorsed 18 candidate profiles for BTech CSE 2026 Batch', metadata_json: JSON.stringify({ batch: '2022-2026', count: 18 }) }
      ];

      const insertActStmt = db.prepare(`
        INSERT INTO user_activity_timeline (id, user_id, role, activity_type, title, description, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const act of initialActivities) {
        insertActStmt.run(act.id, act.user_id, act.role, act.activity_type, act.title, act.description, act.metadata_json);
      }
    }

    // Seed Prayaas Faculty Internships and Placement Calendar Events
    seedInternshipAndCalendarData();
  } catch (err) {
    console.error('Migration notice:', err.message);
  }
}

function seedInternshipAndCalendarData() {
  try {
    // 1. Internships Table Migration
    const internTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='internships'").get()?.sql || '';
    if (internTableSql.includes('REFERENCES student_profiles')) {
      try {
        db.exec("DROP TABLE IF EXISTS internships");
      } catch (e) {}
    }

    // 2. meeting_violations check constraint migration
    const violTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='meeting_violations'").get()?.sql || '';
    if (violTableSql.includes('CHECK(violation_type IN')) {
      try {
        db.exec(`
          CREATE TABLE IF NOT EXISTS meeting_violations_temp (
            id TEXT PRIMARY KEY,
            meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
            student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
            student_name TEXT NOT NULL,
            student_email TEXT NOT NULL,
            violation_type TEXT NOT NULL,
            details TEXT NOT NULL,
            occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO meeting_violations_temp SELECT * FROM meeting_violations;
          DROP TABLE meeting_violations;
          ALTER TABLE meeting_violations_temp RENAME TO meeting_violations;
        `);
      } catch (e) {}
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS internships (
        id TEXT PRIMARY KEY,
        student_id TEXT,
        student_name TEXT NOT NULL,
        roll_number TEXT NOT NULL,
        program TEXT NOT NULL,
        branch TEXT,
        company_name TEXT NOT NULL,
        role TEXT NOT NULL,
        duration TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        stipend TEXT DEFAULT '₹25,000 / month',
        location TEXT DEFAULT 'Vadodara (On-site)',
        industry_mentor_name TEXT,
        industry_mentor_email TEXT,
        faculty_mentor_name TEXT,
        status TEXT CHECK(status IN ('applied', 'approved', 'in_progress', 'completed', 'rejected')) DEFAULT 'approved',
        completion_status TEXT CHECK(completion_status IN ('pending', 'ongoing', 'completed', 'terminated')) DEFAULT 'ongoing',
        performance_rating REAL DEFAULT 4.5,
        evaluation_notes TEXT DEFAULT '',
        noc_status TEXT DEFAULT 'issued' CHECK(noc_status IN ('pending', 'issued', 'not_required')),
        offer_letter_url TEXT,
        completion_certificate_url TEXT,
        created_by TEXT DEFAULT 'TPC Faculty Coordinator',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_internships_roll ON internships(roll_number);
      CREATE INDEX IF NOT EXISTS idx_internships_company ON internships(company_name);
      CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
    `);

    const internCount = db.prepare('SELECT count(*) as c FROM internships').get()?.c || 0;
    if (internCount === 0) {
      const sampleInternships = [
        {
          id: 'intern_01',
          student_id: 's_om_thakkar',
          student_name: 'Om Thakkar',
          roll_number: '24BT04171',
          program: 'BTech CSE',
          branch: 'Computer Science & Engineering',
          company_name: 'Google Cloud India',
          role: 'Cloud Architecture & AI Intern',
          duration: '6 Months (Jan 2026 - Jun 2026)',
          start_date: '2026-01-05',
          end_date: '2026-06-30',
          stipend: '₹45,000 / month',
          location: 'Bangalore (Hybrid)',
          industry_mentor_name: 'Rajesh Kannan (Staff Cloud Engineer)',
          industry_mentor_email: 'rajeshkannan@google.com',
          faculty_mentor_name: 'Dr. Neeshu Chaudhary',
          status: 'approved',
          completion_status: 'ongoing',
          performance_rating: 4.9,
          evaluation_notes: 'Exceptional performance on Gemini 1.5 multi-agent pipelines and Vertex AI microservices.',
          noc_status: 'issued',
          offer_letter_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
          completion_certificate_url: '',
          created_by: 'Dr. Neeshu Chaudhary'
        },
        {
          id: 'intern_02',
          student_id: 's_tanvi',
          student_name: 'Tanvi Joshi',
          roll_number: '22BCE108',
          program: 'BTech CSE',
          branch: 'AI & Data Science',
          company_name: 'GSFC Limited',
          role: 'Industrial Automation & SCADA Analytics Intern',
          duration: '6 Months (Jan 2026 - Jun 2026)',
          start_date: '2026-01-10',
          end_date: '2026-06-25',
          stipend: '₹25,000 / month',
          location: 'Fertilizernagar, Vadodara (On-site)',
          industry_mentor_name: 'Hitesh Bhatt (Chief General Manager - IT)',
          industry_mentor_email: 'hbhatt@gsfcltd.com',
          faculty_mentor_name: 'Dr. Neeshu Chaudhary',
          status: 'approved',
          completion_status: 'ongoing',
          performance_rating: 4.7,
          evaluation_notes: 'Developing real-time telemetry anomaly detection models for fertilizer plant IoT sensors.',
          noc_status: 'issued',
          offer_letter_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
          completion_certificate_url: '',
          created_by: 'TPC Faculty Placement Cell'
        },
        {
          id: 'intern_03',
          student_id: 's_arav',
          student_name: 'Arav Sharma',
          roll_number: '22BCH012',
          program: 'BTech Chemical',
          branch: 'Chemical Engineering',
          company_name: 'Deepak Nitrite Ltd',
          role: 'Chemical Process Optimization Trainee',
          duration: '6 Months (Jan 2026 - Jun 2026)',
          start_date: '2026-01-15',
          end_date: '2026-07-15',
          stipend: '₹22,000 / month',
          location: 'Nandesari GIDC, Vadodara',
          industry_mentor_name: 'Dr. M. P. Verma (VP Technical)',
          industry_mentor_email: 'mpverma@deepaknitrite.com',
          faculty_mentor_name: 'Dr. Rajesh Sharma',
          status: 'approved',
          completion_status: 'ongoing',
          performance_rating: 4.6,
          evaluation_notes: 'Analyzing distillation column energy efficiency and waste heat recovery cycles.',
          noc_status: 'issued',
          offer_letter_url: '',
          completion_certificate_url: '',
          created_by: 'Dr. Rajesh Sharma'
        },
        {
          id: 'intern_04',
          student_id: 's_priya',
          student_name: 'Priya Patel',
          roll_number: '21BCE088',
          program: 'BTech CSE',
          branch: 'Computer Science & Engineering',
          company_name: 'Microsoft India',
          role: 'Software Development Intern (Azure Core)',
          duration: '3 Months (Summer 2025)',
          start_date: '2025-05-15',
          end_date: '2025-08-15',
          stipend: '₹50,000 / month',
          location: 'Hyderabad (Remote)',
          industry_mentor_name: 'S. Sundaram (Principal Engineer)',
          industry_mentor_email: 'ssundaram@microsoft.com',
          faculty_mentor_name: 'Dr. Neeshu Chaudhary',
          status: 'approved',
          completion_status: 'completed',
          performance_rating: 4.9,
          evaluation_notes: 'PPO offer extended! Built distributed rate limiting middleware for Azure Cosmos DB proxies.',
          noc_status: 'issued',
          offer_letter_url: '',
          completion_certificate_url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=80',
          created_by: 'Dr. Neeshu Chaudhary'
        },
        {
          id: 'intern_05',
          student_id: 's_rahul',
          student_name: 'Rahul Verma',
          roll_number: '21BME034',
          program: 'BTech Mechanical',
          branch: 'Mechanical Engineering',
          company_name: 'L&T Heavy Engineering',
          role: 'Turbomachinery & CAD Design Intern',
          duration: '6 Months (Jan 2026 - Jun 2026)',
          start_date: '2026-01-08',
          end_date: '2026-06-30',
          stipend: '₹20,000 / month',
          location: 'Hazira, Surat',
          industry_mentor_name: 'V. K. Nair (Lead Design Engineer)',
          industry_mentor_email: 'vknair@larsentoubro.com',
          faculty_mentor_name: 'Prof. Jayesh Patel',
          status: 'approved',
          completion_status: 'ongoing',
          performance_rating: 4.4,
          evaluation_notes: 'Solidworks FEA stress simulation of high-pressure boiler piping headers.',
          noc_status: 'issued',
          offer_letter_url: '',
          completion_certificate_url: '',
          created_by: 'TPC Faculty Coordinator'
        }
      ];

      const insertInternStmt = db.prepare(`
        INSERT INTO internships (
          id, student_id, student_name, roll_number, program, branch,
          company_name, role, duration, start_date, end_date, stipend, location,
          industry_mentor_name, industry_mentor_email, faculty_mentor_name,
          status, completion_status, performance_rating, evaluation_notes,
          noc_status, offer_letter_url, completion_certificate_url, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of sampleInternships) {
        insertInternStmt.run(
          item.id, item.student_id, item.student_name, item.roll_number, item.program, item.branch,
          item.company_name, item.role, item.duration, item.start_date, item.end_date, item.stipend, item.location,
          item.industry_mentor_name, item.industry_mentor_email, item.faculty_mentor_name,
          item.status, item.completion_status, item.performance_rating, item.evaluation_notes,
          item.noc_status, item.offer_letter_url, item.completion_certificate_url, item.created_by
        );
      }
    }

    // 2. Placement Calendar Events Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS placement_calendar_events (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        role TEXT NOT NULL,
        ctc TEXT,
        date TEXT NOT NULL,
        time TEXT,
        stage TEXT,
        location TEXT,
        eligible_batches_json TEXT DEFAULT '["2025", "2026"]',
        eligible_branches_json TEXT DEFAULT '["CSE", "IT", "AI & DS"]',
        status TEXT DEFAULT 'Scheduled',
        updated_by TEXT DEFAULT 'TPC Admin Coordinator',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_placement_calendar_date ON placement_calendar_events(date);
    `);

    const calCount = db.prepare('SELECT count(*) as c FROM placement_calendar_events').get()?.c || 0;
    if (calCount === 0) {
      const defaultEvents = [
        {
          id: 'evt_google_01',
          company_name: 'Google Cloud India',
          role: 'Software Engineer — AI & Cloud',
          ctc: '₹28.00 LPA',
          date: '2026-09-04',
          time: '10:00 AM IST',
          stage: 'Online Coding Assessment (Proctored)',
          location: 'GSFC Computer Lab 4 & Remote AI Sandbox',
          eligible_batches_json: JSON.stringify(['2025', '2026']),
          eligible_branches_json: JSON.stringify(['CSE', 'IT', 'AI & DS']),
          status: 'Scheduled',
          updated_by: 'TPC Admin Coordinator'
        },
        {
          id: 'evt_microsoft_01',
          company_name: 'Microsoft Azure Systems',
          role: 'Graduate Software Engineer',
          ctc: '₹24.00 LPA',
          date: '2026-09-08',
          time: '02:00 PM IST',
          stage: 'Technical Interview Round 1 & DSA',
          location: 'Virtual Video Panel Room 3',
          eligible_batches_json: JSON.stringify(['2025', '2026']),
          eligible_branches_json: JSON.stringify(['CSE', 'IT', 'ECE']),
          status: 'Scheduled',
          updated_by: 'Dr. Neeshu Chaudhary (TPC)'
        },
        {
          id: 'evt_tcs_01',
          company_name: 'Tata Consultancy Services',
          role: 'Digital Systems & Data Analyst',
          ctc: '₹12.00 LPA',
          date: '2026-09-12',
          time: '09:30 AM IST',
          stage: 'Pre-Placement Talk (PPT) & Orientation',
          location: 'GSFC University Main Auditorium',
          eligible_batches_json: JSON.stringify(['2025', '2026', '2027']),
          eligible_branches_json: JSON.stringify(['All Departments']),
          status: 'Scheduled',
          updated_by: 'TPC Admin Coordinator'
        },
        {
          id: 'evt_reliance_01',
          company_name: 'Reliance Industries Limited',
          role: 'Software Development Engineer - Cloud',
          ctc: '₹10.20 LPA',
          date: '2026-09-18',
          time: '11:00 AM IST',
          stage: 'Core Technical & System Architecture Round',
          location: 'SOT Seminar Hall A',
          eligible_batches_json: JSON.stringify(['2025', '2026']),
          eligible_branches_json: JSON.stringify(['CSE', 'Chemical', 'Mechanical', 'IT']),
          status: 'Scheduled',
          updated_by: 'Faculty Placement Officer'
        },
        {
          id: 'evt_amazon_01',
          company_name: 'Amazon Web Services',
          role: 'SDE-1 Cloud Microservices',
          ctc: '₹32.00 LPA',
          date: '2026-09-24',
          time: '03:30 PM IST',
          stage: 'Bar Raiser & Behavioral Leadership Panel',
          location: 'Virtual Interview Studio',
          eligible_batches_json: JSON.stringify(['2025', '2026']),
          eligible_branches_json: JSON.stringify(['CSE', 'IT']),
          status: 'Scheduled',
          updated_by: 'TPC Admin Coordinator'
        }
      ];

      const insertCalStmt = db.prepare(`
        INSERT INTO placement_calendar_events (
          id, company_name, role, ctc, date, time, stage, location,
          eligible_batches_json, eligible_branches_json, status, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const ev of defaultEvents) {
        insertCalStmt.run(
          ev.id, ev.company_name, ev.role, ev.ctc, ev.date, ev.time, ev.stage, ev.location,
          ev.eligible_batches_json, ev.eligible_branches_json, ev.status, ev.updated_by
        );
      }
    }
  } catch (err) {
    console.error('Seed internship & calendar data notice:', err.message);
  }
}


function seedPlacementIntelligenceData() {
  try {
    // Seed GSFC RAG Documents if empty
    const docCount = db.prepare('SELECT count(*) as c FROM placement_rag_documents').get()?.c || 0;
    if (docCount === 0) {
      const docs = [
        {
          id: 'rag_policy_01',
          title: 'GSFC University Campus Placement Eligibility & One-Job Policy 2026',
          category: 'policy',
          content: 'According to GSFC University TPC Placement Policy 2026: 1. A student who secures an offer of CTC >= 6.0 LPA is considered Placed and may only apply for "Dream Tier" companies offering >= 12.0 LPA. 2. Minimum CGPA of 6.0 with zero active backlogs is required for university placement drive registration. 3. 80% attendance in placement training conclaves is mandatory.',
          tags: ['policy', 'eligibility', 'dream_tier', 'backlogs']
        },
        {
          id: 'rag_dream_tier_02',
          title: 'GSFC University Dream Tier & Super Dream Tier Categorization',
          category: 'dream_tier',
          content: 'Company tiers at GSFC University: Regular Tier (< 6.0 LPA), Core Engineering Tier (6.0 - 9.0 LPA), Dream Tier (9.0 - 14.0 LPA), Super Dream Tier (>= 15.0 LPA). Students with an existing Regular offer can sit for Dream and Super Dream drives.',
          tags: ['tiers', 'ctc', 'super_dream', 'rules']
        },
        {
          id: 'rag_tpc_process_03',
          title: 'Official Selection Process & Code of Conduct for Campus Drives',
          category: 'tpc_guidelines',
          content: 'Dress Code: Formal business attire with GSFC identity badge is mandatory for physical interviews at Vigyan Bhavan. Online Assessments: Anti-cheat proctoring rules enforce strict zero tab switches and single screen mode. Any candidate found impersonating or using unauthorized tools will be debarred from campus placements.',
          tags: ['conduct', 'dress_code', 'proctoring', 'vigyan_bhavan']
        },
        {
          id: 'rag_internship_04',
          title: 'Final Year 8th Semester Industry Internship Guidelines (PPO Policy)',
          category: 'policy',
          content: 'Students receiving a 6-month pre-placement internship offer (PPO) during the 8th semester are eligible for full academic credit transfer. Monthly progress reports endorsed by the corporate mentor must be submitted to the GSFC Faculty Coordinator.',
          tags: ['internship', 'ppo', 'credit_transfer', '8th_semester']
        },
        {
          id: 'rag_faqs_05',
          title: 'Frequently Asked Questions (FAQs) for Graduating Batches (2025-2026)',
          category: 'faq',
          content: 'Q: Can I apply for both IT and Core Chemical companies? A: Dual branch students or CSE/IT/Chemical students meeting the specific CGPA and branch matrix in the job post may apply. Q: When are offer letters stamped? A: Official GSFC University offer letters are stamped and issued by the TPC Dean after recruiter confirmation.',
          tags: ['faq', 'branch_eligibility', 'stamped_offer']
        }
      ];

      const insertDoc = db.prepare(`
        INSERT INTO placement_rag_documents (id, title, category, content, tags_json)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const d of docs) {
        insertDoc.run(d.id, d.title, d.category, d.content, JSON.stringify(d.tags));
      }
    }

    // Seed Initial Placement Risk Alerts if empty
    const alertCount = db.prepare('SELECT count(*) as c FROM placement_risk_alerts').get()?.c || 0;
    if (alertCount === 0) {
      const seedAlerts = [
        {
          id: 'risk_01',
          student_id: 's_arav',
          risk_type: 'eligible_not_applied',
          severity: 'high',
          title: 'High Match Candidate Has Not Applied: Google Cloud Conclave',
          description: 'Arav Sharma matches 92% of required skills for Google Cloud India (Cutoff: 8.0 CGPA, Arav: 8.8 CGPA) but has not submitted his application with 48h remaining.',
          requirement_id: 'req_google_sde_2026'
        },
        {
          id: 'risk_02',
          student_id: 's_rahul_verma',
          risk_type: 'missing_resume',
          severity: 'medium',
          title: 'Profile Missing Final Semester Marksheets Verification',
          description: 'Rahul Verma has a high ATS score but lacks verified semester 7 marksheets in his dossier vault.',
          requirement_id: null
        },
        {
          id: 'risk_03',
          student_id: 's_ananya',
          risk_type: 'low_assessment_score',
          severity: 'medium',
          title: 'DSA Coding Sandbox Score Below Cutoff: Ananya Deshmukh',
          description: 'Ananya scored 45% in Dynamic Programming mock evaluation. Recommended for Adaptive Remedial Assessment.',
          requirement_id: null
        }
      ];

      const insertAlert = db.prepare(`
        INSERT INTO placement_risk_alerts (id, student_id, risk_type, severity, title, description, requirement_id, is_resolved)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `);
      for (const a of seedAlerts) {
        try {
          insertAlert.run(a.id, a.student_id, a.risk_type, a.severity, a.title, a.description, a.requirement_id);
        } catch(e) {}
      }
    }
  } catch (err) {
    console.error('Seed placement intelligence data notice:', err.message);
  }
}

function seedAlumniAndCommunityData() {
  try {
    const passHash = bcrypt.hashSync('password123', 6);

    // Seed 2 verified alumni and 1 pending alumni
    const alumniData = [
        {
          userId: 'u_alumni_priya',
          profileId: 'alumni_priya',
          email: 'priya.patel@alumni.gsfc.ac.in',
          name: 'Priya Patel',
          batch: '2019-2023',
          company: 'Amazon AWS',
          designation: 'Cloud Solutions Architect',
          linkedin: 'https://linkedin.com/in/priya-patel-aws',
          bio: 'GSFC University 2023 BTech CSE Gold Medalist. Specializing in Distributed Cloud Architecture, Kubernetes, and System Design.',
          verified: 1
        },
        {
          userId: 'u_alumni_karan',
          profileId: 'alumni_karan',
          email: 'karan.mehta@alumni.gsfc.ac.in',
          name: 'Karan Mehta',
          batch: '2018-2022',
          company: 'GSFC Limited',
          designation: 'Senior Process Control Engineer',
          linkedin: 'https://linkedin.com/in/karan-mehta-gsfc',
          bio: 'Chemical Engineering Batch 2022. Expert in industrial DCS automation, safety instrumentation, and plant simulations.',
          verified: 1
        },
        {
          userId: 'u_alumni_neha',
          profileId: 'alumni_neha',
          email: 'neha.shah@alumni.gsfc.ac.in',
          name: 'Neha Shah',
          batch: '2020-2024',
          company: 'Reliance Industries (Jio)',
          designation: 'Full Stack Engineer',
          linkedin: 'https://linkedin.com/in/neha-shah-jio',
          bio: 'Recent graduate working on scalable microservices with React, Go, and Kafka.',
          verified: 0 // Pending TPO Verification
        }
      ];

      for (const a of alumniData) {
        db.prepare("INSERT OR IGNORE INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run(a.userId, a.email, passHash, 'alumni');
        db.prepare(`
          INSERT OR IGNORE INTO alumni_profiles (id, user_id, name, batch_year, company, designation, linkedin_url, bio, verified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(a.profileId, a.userId, a.name, a.batch, a.company, a.designation, a.linkedin, a.bio, a.verified);
      }

      // Seed Mentorship Posts
      db.prepare(`
        INSERT OR IGNORE INTO mentorship_posts (id, alumni_id, title, content, tags_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'post_aws_guide',
        'alumni_priya',
        'How to Crack Tier-1 Cloud & DevOps Campus Drives (From GSFC CSE to AWS)',
        'Here are the 3 key preparation pillars that helped me clear AWS technical rounds:\n\n1. Master Linux & Networking fundamentals (TCP/IP, DNS, Load Balancers).\n2. Build a live portfolio project deploying microservices with Docker and CI/CD.\n3. Practice explaining high-level system trade-offs (SQL vs NoSQL, Caching with Redis).\n\nFeel free to ask questions below!',
        JSON.stringify(['Cloud', 'AWS', 'System Design', 'Interview Tips'])
      );

      db.prepare(`
        INSERT OR IGNORE INTO mentorship_posts (id, alumni_id, title, content, tags_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'post_chem_psu',
        'alumni_karan',
        'Core Chemical & Petrochemical Placement Roadmap: What Industry Recruiters Look For',
        'Recruiters from GSFC Ltd, Deepak Nitrite, and Reliance look heavily into thermodynamic fundamentals, Aspen Plus simulations, and plant safety (HAZOP analysis). Make sure your final year capstone project addresses real-world industrial optimization.',
        JSON.stringify(['Chemical', 'Core Engineering', 'PSU', 'Process Safety'])
      );

      db.prepare(`
        INSERT OR IGNORE INTO mentorship_posts (id, alumni_id, title, content, tags_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'post_analytics_tips',
        'alumni_neha',
        'Transitioning from GSFC University to Business & Data Analytics Roles',
        'For students targeting roles in analytics consulting and product management: build strong SQL querying skills, become proficient in exploratory data analysis with Python/Pandas, and learn how to present actionable business insights.',
        JSON.stringify(['Data Analytics', 'SQL', 'Python', 'Consulting', 'Career Guide'])
      );

      // Seed Comments on Posts
      db.prepare(`
        INSERT OR IGNORE INTO mentorship_comments (id, post_id, author_id, author_name, author_role, content)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'comm_1',
        'post_aws_guide',
        's_arav',
        'Arav Sharma',
        'student',
        'Thank you Priya Di! Should we focus on AWS certifications during semester 7 or prioritize LeetCode coding problems?'
      );

      db.prepare(`
        INSERT OR IGNORE INTO mentorship_comments (id, post_id, author_id, author_name, author_role, content)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'comm_2',
        'post_aws_guide',
        'alumni_priya',
        'Priya Patel',
        'alumni',
        'Prioritize Problem Solving & Core DSA first! Certifications are a great bonus, but clean problem-solving and projects will land you the interview.'
      );

    // Seed Job Fairs
    const jobFairCount = db.prepare("SELECT COUNT(*) as c FROM job_fairs").get().c;
    if (jobFairCount === 0) {
      db.prepare(`
        INSERT OR IGNORE INTO job_fairs (id, title, description, event_date, venue, mode, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'fair_tech_mega_2026',
        'GSFC University Annual Mega Tech & Engineering Job Fair 2026',
        'Grand multi-employer campus recruitment event bringing top MNCs and high-growth technology startups. Over 100+ open positions across Software, Cloud, AI, and Chemical Process Engineering.',
        '2026-10-15',
        'GSFC University Convention Center & Innovation Grounds',
        'hybrid',
        'upcoming'
      );

      db.prepare(`
        INSERT OR IGNORE INTO job_fairs (id, title, description, event_date, venue, mode, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'fair_core_chem_2026',
        'National Petrochemical & Industrial Automation Placement Conclave',
        'Specialized recruitment drive focusing on Core Chemical, Petrochemical, Mechanical, and Industrial Automation engineering graduates.',
        '2026-11-20',
        'SOT Auditorium, GSFC University Campus',
        'offline',
        'upcoming'
      );

      // Attach existing requirements to the mega fair
      const existingReqs = db.prepare("SELECT id FROM requirements LIMIT 3").all();
      for (const r of existingReqs) {
        db.prepare(`
          INSERT OR IGNORE INTO job_fair_companies (id, job_fair_id, requirement_id)
          VALUES (?, ?, ?)
        `).run(`jfc_${r.id}`, 'fair_tech_mega_2026', r.id);
      }

      // Pre-register student Arav Sharma
      db.prepare(`
        INSERT OR IGNORE INTO job_fair_registrations (id, job_fair_id, student_id)
        VALUES (?, ?, ?)
      `).run('reg_arav_fair', 'fair_tech_mega_2026', 's_arav');
    }

    // Seed Community Q&A Threads
    const qaCount = db.prepare("SELECT COUNT(*) as c FROM qa_threads").get().c;
    if (qaCount === 0) {
      db.prepare(`
        INSERT OR IGNORE INTO qa_threads (id, student_id, student_name, title, body, category, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'thread_cgpa_policy',
        's_arav',
        'Arav Sharma',
        'What is the university policy for Tier-1 companies if someone has 1 active backlog?',
        'I have a CGPA of 8.9 in BTech CSE but had a backlog in Sem 4 mathematics that is cleared in re-eval. Will I be eligible for Google / Microsoft on-campus shortlist?',
        'Eligibility & Drive Rules',
        'resolved'
      );

      db.prepare(`
        INSERT OR IGNORE INTO qa_replies (id, thread_id, author_id, author_name, author_role, body)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'reply_tpo_cgpa',
        'thread_cgpa_policy',
        'u_admin_gsfc',
        'GSFC TPO Directorate',
        'tpo',
        'As per GSFC University Placement Policy: If the backlog has been officially cleared and your grade sheet reflects 0 active backlogs at the time of drive registration, you are 100% eligible for all Tier-1 drives with CGPA >= 8.0.'
      );

      db.prepare(`
        INSERT OR IGNORE INTO qa_threads (id, student_id, student_name, title, body, category, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'thread_resume_ats',
        's_rohan',
        'Rohan Patel',
        'How does CampusHire AI compute the ATS score for core mechanical design resumes?',
        'I added STAAD Pro and AutoCAD projects, but want to know if project metrics help improve the score above 90.',
        'Resume & ATS Optimization',
        'open'
      );

      db.prepare(`
        INSERT OR IGNORE INTO qa_replies (id, thread_id, author_id, author_name, author_role, body)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'reply_priya_resume',
        'thread_resume_ats',
        'alumni_priya',
        'Priya Patel (Amazon AWS)',
        'alumni',
        'Yes Rohan! Adding quantifiable metrics (e.g. "Reduced finite element analysis error margin by 18%") increases both the NLP semantic match and recruiter readability.'
      );
    }
  } catch (err) {
    console.error('Community seeding notice:', err.message);
  }
}

function seedMultiYearStudents() {
  const existingCount = db.prepare("SELECT COUNT(*) as c FROM student_profiles WHERE id LIKE 's_batch_%'").get().c;
  if (existingCount >= 14) return;

  const passwordHash = bcrypt.hashSync('password123', 6);

  const multiYearDataset = [
    // 2020 Batch (Passing 2024 - Alumni)
    {
      userId: 'u_batch_2020_01',
      profileId: 's_batch_2020_01',
      roll: '20BCE015',
      name: 'Tanvi Joshi',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 9.1,
      atsScore: 95,
      admYear: 2020,
      passYear: 2024,
      batch: '2020-2024',
      skills: ['Python', 'Django', 'React', 'PostgreSQL', 'AWS'],
      appStatus: 'selected'
    },
    {
      userId: 'u_batch_2020_02',
      profileId: 's_batch_2020_02',
      roll: '20BCH008',
      name: 'Dhruv Solanki',
      program: 'BTech Chemical',
      branch: 'Chemical Engineering',
      cgpa: 8.4,
      atsScore: 88,
      admYear: 2020,
      passYear: 2024,
      batch: '2020-2024',
      skills: ['Aspen Plus', 'MATLAB', 'Process Simulation', 'HAZOP'],
      appStatus: 'selected'
    },

    // 2021 Batch (Passing 2025 - Recent Grad)
    {
      userId: 'u_batch_2021_01',
      profileId: 's_batch_2021_01',
      roll: '21BCV019',
      name: 'Manish Varma',
      program: 'BTech Civil',
      branch: 'Civil Engineering',
      cgpa: 8.7,
      atsScore: 91,
      admYear: 2021,
      passYear: 2025,
      batch: '2021-2025',
      skills: ['STAAD Pro', 'AutoCAD', 'ETABS', 'Revit Structure', 'Primavera'],
      appStatus: 'interview'
    },
    {
      userId: 'u_batch_2021_02',
      profileId: 's_batch_2021_02',
      roll: '21BIT024',
      name: 'Sneha Dave',
      program: 'BTech IT',
      branch: 'Information Technology',
      cgpa: 8.8,
      atsScore: 89,
      admYear: 2021,
      passYear: 2025,
      batch: '2021-2025',
      skills: ['Java', 'Spring Boot', 'MySQL', 'Angular', 'Docker'],
      appStatus: 'selected'
    },

    // 2022 Batch (Passing 2026 - Current Final Year)
    {
      userId: 'u_batch_2022_01',
      profileId: 's_batch_2022_01',
      roll: '22BCE077',
      name: 'Kavya Trivedi',
      program: 'BTech CSE',
      branch: 'Computer Science & AI',
      cgpa: 9.3,
      atsScore: 96,
      admYear: 2022,
      passYear: 2026,
      batch: '2022-2026',
      skills: ['Python', 'PyTorch', 'FastAPI', 'React', 'Docker', 'NLP'],
      appStatus: 'interview'
    },
    {
      userId: 'u_batch_2022_02',
      profileId: 's_batch_2022_02',
      roll: '22BME031',
      name: 'Harshil Shah',
      program: 'BTech Mechanical',
      branch: 'Mechanical & Automation',
      cgpa: 8.5,
      atsScore: 84,
      admYear: 2022,
      passYear: 2026,
      batch: '2022-2026',
      skills: ['SolidWorks', 'ANSYS', 'AutoCAD', 'Robotics', 'C++'],
      appStatus: 'applied'
    },

    // 2023 Batch (Passing 2027 - Pre-Final Year / Internships)
    {
      userId: 'u_batch_2023_01',
      profileId: 's_batch_2023_01',
      roll: '23BCE094',
      name: 'Aditya Rajput',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.8,
      atsScore: 90,
      admYear: 2023,
      passYear: 2027,
      batch: '2023-2027',
      skills: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'Python'],
      appStatus: 'applied'
    },
    {
      userId: 'u_batch_2023_02',
      profileId: 's_batch_2023_02',
      roll: '23BEC012',
      name: 'Riya Parmar',
      program: 'BTech ECE',
      branch: 'Electronics & Communication',
      cgpa: 8.6,
      atsScore: 87,
      admYear: 2023,
      passYear: 2027,
      batch: '2023-2027',
      skills: ['Embedded C', 'MATLAB', 'VLSI', 'Verilog', 'IoT', 'PCB Design'],
      appStatus: 'applied'
    },

    // 2024 Batch (Passing 2028 - 2nd Year Sophomore)
    {
      userId: 'u_batch_2024_01',
      profileId: 's_batch_2024_01',
      roll: '24BT04171',
      name: 'Om Thakkar',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 9.4,
      atsScore: 98,
      admYear: 2024,
      passYear: 2028,
      batch: '2024-2028',
      skills: ['React', 'Node.js', 'Python', 'FastAPI', 'SQLite', 'Capacitor', 'AI Systems'],
      appStatus: 'selected'
    },
    {
      userId: 'u_batch_2024_02',
      profileId: 's_batch_2024_02',
      roll: '24BFS005',
      name: 'Vikas Choudhary',
      program: 'BTech Fire & Safety',
      branch: 'Fire & Safety Engineering',
      cgpa: 8.3,
      atsScore: 82,
      admYear: 2024,
      passYear: 2028,
      batch: '2024-2028',
      skills: ['Industrial Safety', 'Risk Assessment', 'Hazard Control', 'NFPA Standards', 'AutoCAD'],
      appStatus: 'applied'
    },

    // 2025 Batch (Passing 2029 - 1st Year Freshmen)
    {
      userId: 'u_batch_2025_01',
      profileId: 's_batch_2025_01',
      roll: '25BCE003',
      name: 'Ananya Iyer',
      program: 'BTech CSE',
      branch: 'Artificial Intelligence & Data Science',
      cgpa: 8.9,
      atsScore: 89,
      admYear: 2025,
      passYear: 2029,
      batch: '2025-2029',
      skills: ['Python', 'C Programming', 'Data Structures', 'Git', 'Machine Learning Basics'],
      appStatus: 'applied'
    },
    {
      userId: 'u_batch_2025_02',
      profileId: 's_batch_2025_02',
      roll: '25MBT011',
      name: 'Parth Shukla',
      program: 'BSc Biotechnology',
      branch: 'Biotechnology & Bioinformatics',
      cgpa: 8.5,
      atsScore: 86,
      admYear: 2025,
      passYear: 2029,
      batch: '2025-2029',
      skills: ['PCR', 'Bioinformatics', 'Python for Biology', 'Gel Electrophoresis', 'Microbiology'],
      appStatus: 'applied'
    },

    // 2026 Batch (Passing 2030 - Incoming Batch)
    {
      userId: 'u_batch_2026_01',
      profileId: 's_batch_2026_01',
      roll: '26BCE001',
      name: 'Siddharth Rao',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.7,
      atsScore: 85,
      admYear: 2026,
      passYear: 2030,
      batch: '2026-2030',
      skills: ['C++', 'Python', 'Algorithms', 'Web Development Basics'],
      appStatus: 'applied'
    }
  ];

  // Guard check: if multi-year students already exist, never re-seed or overwrite!
  try {
    const existingCount = db.prepare("SELECT COUNT(*) as c FROM student_profiles WHERE id LIKE 's_batch_%'").get()?.c || 0;
    if (existingCount > 0) {
      return;
    }
  } catch (e) {}

  for (const st of multiYearDataset) {
    db.prepare(`INSERT OR IGNORE INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'student')`)
      .run(st.userId, `${st.roll.toLowerCase()}@gsfcuniversity.ac.in`, passwordHash);

    const parsedJson = JSON.stringify({
      name: st.name,
      email: `${st.roll.toLowerCase()}@gsfcuniversity.ac.in`,
      phone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
      roll: st.roll,
      program: st.program,
      branch: st.branch,
      cgpa: st.cgpa,
      admission_year: st.admYear,
      passing_year: st.passYear,
      batch_year: st.batch,
      skills: { technical: st.skills, soft: ['Communication', 'Teamwork', 'Critical Thinking'] },
      projects: [{ title: `${st.branch} Innovation Project`, description: `Developed practical applications using ${st.skills.slice(0, 3).join(', ')}.` }]
    });

    db.prepare(`
      INSERT OR IGNORE INTO student_profiles 
      (id, user_id, roll_number, name, program, branch, cgpa, resume_url, parsed_resume_json, ats_score, ats_feedback_json, admission_year, passing_year, batch_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      st.profileId, st.userId, st.roll, st.name, st.program, st.branch, st.cgpa,
      '/uploads/sample_resume.pdf', parsedJson, st.atsScore,
      JSON.stringify(["Well structured profile.", "Strong alignment with core domain competencies."]),
      st.admYear, st.passYear, st.batch
    );

    // Also link application
    const req = db.prepare("SELECT id FROM requirements LIMIT 1").get();
    if (req) {
      db.prepare(`
        INSERT OR IGNORE INTO applications (id, student_id, requirement_id, match_score, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(`app_${st.profileId}`, st.profileId, req.id, Math.round(75 + Math.random() * 20), st.appStatus);
    }
  }
  console.log('✅ Seeded multi-year student dataset across all academic batches (2020-2030)!');
}

function seedInitialData() {
  // Check if seed needed
  const reqCount = db.prepare('SELECT COUNT(*) as count FROM requirements').get().count;
  if (reqCount > 0) {
    return;
  }

  console.log('🌱 Seeding initial database records for CampusHire AI...');

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. TPC Admin
  const adminId = 'u_admin_01';
  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run(adminId, 'tpc@university.edu', passwordHash, 'admin');

  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run('u_admin_gsfc', 'admin@gsfcuniversity.ac.in', passwordHash, 'admin');

  // 2. Approved Companies
  const companies = [
    {
      userId: 'u_comp_google',
      profileId: 'c_google',
      name: 'Google Cloud India',
      logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120&auto=format&fit=crop&q=80',
      industry: 'Cloud & Artificial Intelligence',
      website: 'https://cloud.google.com',
      approved: 1
    },
    {
      userId: 'u_comp_microsoft',
      profileId: 'c_microsoft',
      name: 'Microsoft Azure Systems',
      logo: 'https://images.unsplash.com/photo-1642132652859-3ef5a1048fd1?w=120&auto=format&fit=crop&q=80',
      industry: 'Software & Cloud Services',
      website: 'https://microsoft.com',
      approved: 1
    },
    {
      userId: 'u_comp_tcs',
      profileId: 'c_tcs',
      name: 'Tata Consultancy Services',
      logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80',
      industry: 'IT Services & Consulting',
      website: 'https://tcs.com',
      approved: 1
    },
    {
      userId: 'u_comp_pending',
      profileId: 'c_nexus',
      name: 'Nexus Quantum Labs (Startup)',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      industry: 'Quantum Tech / AI',
      website: 'https://nexusquantum.ai',
      approved: 1 // Official Verified Partner
    }
  ];

  for (const c of companies) {
    db.prepare(`INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)`).run(c.userId, `${c.profileId}@recruiter.com`, passwordHash, 'company');
    db.prepare(`INSERT INTO company_profiles (id, user_id, company_name, logo_url, industry, website, approved) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      c.profileId, c.userId, c.name, c.logo, c.industry, c.website, c.approved
    );
  }

  // 3. Students
  const students = [
    {
      userId: 'u_stud_arav',
      profileId: 's_arav',
      roll: '21BCE045',
      name: 'Arav Sharma',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      cgpa: 8.9,
      atsScore: 92,
      parsedJson: JSON.stringify({
        name: 'Arav Sharma',
        email: 'arav.sharma@student.edu',
        phone: '+91 9876543210',
        roll: '21BCE045',
        program: 'BTech CSE',
        branch: 'Computer Science',
        cgpa: 8.9,
        skills: {
          technical: ['Python', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Machine Learning', 'FastAPI'],
          soft: ['Problem Solving', 'Team Leadership', 'Agile Communication']
        },
        projects: [
          {
            title: 'Neural Placement Matcher',
            description: 'Built a vector-search career matching app using SentenceTransformers & FastAPI.'
          },
          {
            title: 'Realtime Code Collaboration Tool',
            description: 'Developed a WebSockets paired editor in React and Node.'
          }
        ],
        certifications: ['AWS Certified Cloud Practitioner', 'TensorFlow Developer Certificate'],
        internships: [
          {
            company: 'TechCorp Labs',
            role: 'Backend Engineering Intern',
            duration: '3 Months',
            summary: 'Optimized PostgreSQL query latency by 42% using index tuning.'
          }
        ]
      }),
      atsFeedback: JSON.stringify([
        "Great use of quantifiable achievements (e.g. 'Optimized query latency by 42%').",
        "Strong alignment with Full-Stack and AI engineering roles.",
        "Consider adding system design methodology keywords for senior tier eligibility."
      ])
    },
    {
      userId: 'u_stud_priya',
      profileId: 's_priya',
      roll: '21BME012',
      name: 'Priya Patel',
      program: 'BTech Mechanical',
      branch: 'Mechanical Engineering',
      cgpa: 8.2,
      atsScore: 78,
      parsedJson: JSON.stringify({
        name: 'Priya Patel',
        email: 'priya.p@student.edu',
        phone: '+91 9812345678',
        roll: '21BME012',
        program: 'BTech Mechanical',
        branch: 'Mechanical Engineering',
        cgpa: 8.2,
        skills: {
          technical: ['AutoCAD', 'SolidWorks', 'ANSYS', 'Python', 'MATLAB', 'Manufacturing Systems'],
          soft: ['Analytical Thinking', 'Project Management']
        },
        projects: [
          {
            title: 'Thermal Efficiency Simulation of EV Battery Packs',
            description: 'Modeled liquid cooling dynamics in ANSYS Fluent to improve battery lifecycle.'
          }
        ],
        certifications: ['Certified SolidWorks Associate (CSWA)'],
        internships: [
          {
            company: 'L&T Heavy Engineering',
            role: 'CAD Design Intern',
            duration: '2 Months',
            summary: 'Drafted 3D assembly models for turbine casings.'
          }
        ]
      }),
      atsFeedback: JSON.stringify([
        "Solid technical domain expertise in SolidWorks & ANSYS.",
        "Missing quantifiable impact metrics in project descriptions.",
        "Add cross-domain automation skills (e.g. Python scripting for CAD) to boost ATS index."
      ])
    },
    {
      userId: 'u_stud_rohan',
      profileId: 's_rohan',
      roll: '22MBA008',
      name: 'Rohan Mehta',
      program: 'MBA',
      branch: 'Marketing & Analytics',
      cgpa: 8.6,
      atsScore: 85,
      parsedJson: JSON.stringify({
        name: 'Rohan Mehta',
        email: 'rohan.m@student.edu',
        phone: '+91 9765432109',
        roll: '22MBA008',
        program: 'MBA',
        branch: 'Marketing & Analytics',
        cgpa: 8.6,
        skills: {
          technical: ['SQL', 'PowerBI', 'Tableau', 'Google Analytics', 'Excel VBA', 'Python for Business'],
          soft: ['Strategic Marketing', 'Client Stakeholder Management', 'Public Speaking']
        },
        projects: [
          {
            title: 'FMCG Market Expansion Campaign',
            description: 'Analyzed consumer sentiment datasets across 5 zones using PowerBI dashboarding.'
          }
        ],
        certifications: ['Google Data Analytics Professional Certificate'],
        internships: [
          {
            company: 'Hindustan Unilever',
            role: 'Product Marketing Intern',
            duration: '3 Months',
            summary: 'Increased brand survey response conversion rate by 18%.'
          }
        ]
      }),
      atsFeedback: JSON.stringify([
        "Clean, executive presentation layout.",
        "Excellent quantifiable business metrics.",
        "Include A/B testing methodology terms to match tech product manager JDs."
      ])
    }
  ];

  for (const s of students) {
    db.prepare(`INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)`).run(s.userId, `${s.profileId}@student.edu`, passwordHash, 'student');
    db.prepare(`
      INSERT INTO student_profiles 
      (id, user_id, roll_number, name, program, branch, cgpa, resume_url, parsed_resume_json, ats_score, ats_feedback_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      s.profileId, s.userId, s.roll, s.name, s.program, s.branch, s.cgpa,
      '/uploads/sample_resume.pdf', s.parsedJson, s.atsScore, s.atsFeedback
    );
  }

  // 4. Job Requirements
  const requirements = [
    {
      id: 'req_google_swe',
      companyId: 'c_google',
      title: 'Software Development Engineer - AI & Cloud',
      eligiblePrograms: JSON.stringify(['BTech CSE', 'BTech IT', 'MSc CS']),
      minCgpa: 8.0,
      requiredSkills: JSON.stringify(['Python', 'React', 'Node.js', 'PostgreSQL', 'Data Structures']),
      preferredSkills: JSON.stringify(['Docker', 'Kubernetes', 'Machine Learning', 'FastAPI']),
      jobType: 'Full-time',
      ctcRange: '₹28,00,000 - ₹34,00,000 PA',
      openings: 5,
      deadline: '2026-09-30',
      description: 'Join Google Cloud India team to build distributed microservices and LLM-powered enterprise developer tools. Looking for strong fundamentals in DSA, API architecture, full-stack JS/Python, and cloud systems.'
    },
    {
      id: 'req_microsoft_sde',
      companyId: 'c_microsoft',
      title: 'Graduate Software Engineer - Cloud Systems',
      eligiblePrograms: JSON.stringify(['BTech CSE', 'BTech IT', 'BTech ECE']),
      minCgpa: 7.5,
      requiredSkills: JSON.stringify(['C++', 'Python', 'SQL', 'Data Structures']),
      preferredSkills: JSON.stringify(['Azure', 'System Design', 'WebSockets']),
      jobType: 'Full-time',
      ctcRange: '₹24,00,000 - ₹30,00,000 PA',
      openings: 8,
      deadline: '2026-10-15',
      description: 'Engineering opportunity at Microsoft Azure. Focus on building high-concurrency cloud backend infrastructure, microservices monitoring, and scalable database engines.'
    },
    {
      id: 'req_tcs_analyst',
      companyId: 'c_tcs',
      title: 'Digital Systems & Data Analyst',
      eligiblePrograms: JSON.stringify(['BTech CSE', 'BTech Mechanical', 'BBA', 'MBA', 'MSc']),
      minCgpa: 6.5,
      requiredSkills: JSON.stringify(['SQL', 'Excel', 'Python', 'Communication']),
      preferredSkills: JSON.stringify(['PowerBI', 'Tableau', 'Agile']),
      jobType: 'Full-time',
      ctcRange: '₹9,00,000 - ₹12,00,000 PA',
      openings: 25,
      deadline: '2026-11-01',
      description: 'Cross-functional data analyst role supporting global enterprise clients. Analyze business KPIs, craft automated reporting dashboards, and build SQL query pipelines.'
    },
    {
      id: 'req_nexus_ai',
      companyId: 'c_nexus',
      title: 'AI & Quantum Systems Researcher',
      eligiblePrograms: JSON.stringify(['BTech CSE', 'BTech IT', 'BTech Mechanical', 'MSc CS']),
      minCgpa: 7.0,
      requiredSkills: JSON.stringify(['Python', 'PyTorch', 'Quantum Computing', 'FastAPI']),
      preferredSkills: JSON.stringify(['Qiskit', 'Docker', 'Machine Learning']),
      jobType: 'Full-time',
      ctcRange: '₹18,00,000 - ₹22,00,000 PA',
      openings: 4,
      deadline: '2026-11-15',
      description: 'Exciting opportunity at Nexus Quantum Labs to research and implement hybrid quantum-classical AI algorithms and high-performance neural computing frameworks.'
    }
  ];

  for (const r of requirements) {
    db.prepare(`
      INSERT INTO requirements 
      (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, preferred_skills_json, job_type, ctc_range, openings, deadline, job_description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      r.id, r.companyId, r.title, r.eligiblePrograms, r.minCgpa, r.requiredSkills,
      r.preferredSkills, r.jobType, r.ctcRange, r.openings, r.deadline, r.description
    );
  }

  // 5. Initial Applications
  db.prepare(`
    INSERT INTO applications (id, student_id, requirement_id, match_score, status)
    VALUES (?, ?, ?, ?, ?)
  `).run('app_arav_google', 's_arav', 'req_google_swe', 94.5, 'interview');

  db.prepare(`
    INSERT INTO applications (id, student_id, requirement_id, match_score, status)
    VALUES (?, ?, ?, ?, ?)
  `).run('app_rohan_tcs', 's_rohan', 'req_tcs_analyst', 89.0, 'applied');

  seedMeetingData();

  console.log('✅ CampusHire AI Database successfully initialized and seeded!');
}

function seedMeetingData() {
  try {
    // 1. Scheduled Meeting for Google Cloud SWE
    const googleMeetId = 'meet_google_01';
    const googleRoomId = 'GSFC-MEET-GOOG-2026';
    
    const googleReq = db.prepare("SELECT id, company_id FROM requirements WHERE id = 'req_google_swe'").get();
    const googleUser = db.prepare("SELECT id FROM users WHERE id = 'u_comp_google'").get();

    if (googleReq && googleUser) {
      const existingGoogleMeet = db.prepare('SELECT id FROM meetings WHERE id = ?').get(googleMeetId);
      if (!existingGoogleMeet) {
        db.prepare(`
          INSERT OR IGNORE INTO meetings (id, room_id, drive_id, company_id, title, description, scheduled_at, duration_minutes, status, created_by)
          VALUES (?, ?, 'req_google_swe', ?, 'Google Cloud — Technical Interview Round 1', 'Live technical interview and algorithmic discussion for shortlisted SDE candidates.', datetime('now', '+15 minutes'), 45, 'scheduled', 'u_comp_google')
        `).run(googleMeetId, googleRoomId, googleReq.company_id);

        db.prepare(`
          INSERT OR IGNORE INTO meeting_participants (id, meeting_id, user_id, role, join_status)
          VALUES ('part_goog_rec', ?, 'u_comp_google', 'company', 'invited')
        `).run(googleMeetId);

        const omStudent = db.prepare("SELECT id, user_id FROM student_profiles WHERE user_id = 'u_student_1' OR roll_number = '24BT04171'").get();
        if (omStudent) {
          db.prepare(`
            INSERT OR IGNORE INTO meeting_participants (id, meeting_id, user_id, student_id, role, join_status)
            VALUES ('part_goog_s1', ?, ?, ?, 'student', 'invited')
          `).run(googleMeetId, omStudent.user_id, omStudent.id);
        }

        const tanviStudent = db.prepare("SELECT id, user_id FROM student_profiles WHERE user_id = 'u_student_2' OR roll_number = '22BCE108'").get();
        if (tanviStudent) {
          db.prepare(`
            INSERT OR IGNORE INTO meeting_participants (id, meeting_id, user_id, student_id, role, join_status)
            VALUES ('part_goog_s2', ?, ?, ?, 'student', 'invited')
          `).run(googleMeetId, tanviStudent.user_id, tanviStudent.id);
        }
      }
    }

    // 2. Completed Meeting with Proctoring Anti-Cheating Violation Record
    const msftMeetId = 'meet_msft_02';
    const msftRoomId = 'GSFC-MEET-MSFT-8821';
    const msftReq = db.prepare("SELECT id, company_id FROM requirements WHERE id = 'req_microsoft_sde'").get();
    const msftUser = db.prepare("SELECT id FROM users WHERE id = 'u_comp_microsoft'").get();

    if (msftReq && msftUser) {
      const existingMsftMeet = db.prepare('SELECT id FROM meetings WHERE id = ?').get(msftMeetId);
      if (!existingMsftMeet) {
        db.prepare(`
          INSERT OR IGNORE INTO meetings (id, room_id, drive_id, company_id, title, description, scheduled_at, duration_minutes, status, created_by, ended_at, summary_notes)
          VALUES (?, ?, 'req_microsoft_sde', ?, 'Microsoft Azure — System Design & Live Coding', 'Final technical assessment round for Cloud Microservices engineering role.', datetime('now', '-2 hours'), 30, 'completed', 'u_comp_microsoft', datetime('now', '-90 minutes'), '1 candidate selected, 1 candidate disqualified for anti-cheating tab-switch violation.')
        `).run(msftMeetId, msftRoomId, msftReq.company_id);

        db.prepare(`
          INSERT OR IGNORE INTO meeting_participants (id, meeting_id, user_id, role, join_status, joined_at, left_at)
          VALUES ('part_msft_rec', ?, 'u_comp_microsoft', 'company', 'left', datetime('now', '-120 minutes'), datetime('now', '-90 minutes'))
        `).run(msftMeetId);

        const stud2 = db.prepare("SELECT s.id, s.user_id, s.name, u.email FROM student_profiles s JOIN users u ON s.user_id = u.id WHERE s.roll_number = '21BCE045' OR s.id = 's_21bce045'").get();
        if (stud2) {
          db.prepare(`
            INSERT OR IGNORE INTO meeting_participants (id, meeting_id, user_id, student_id, role, join_status, joined_at, left_at, outcome_status, interviewer_notes, evaluation_score)
            VALUES ('part_msft_s2', ?, ?, ?, 'student', 'ejected', datetime('now', '-120 minutes'), datetime('now', '-105 minutes'), 'rejected', 'Candidate session terminated due to detected tab-switching and window blur.', 2.0)
          `).run(msftMeetId, stud2.user_id, stud2.id);

          db.prepare(`
            INSERT OR IGNORE INTO meeting_violations (id, meeting_id, student_id, student_name, student_email, violation_type, details, occurred_at)
            VALUES ('viol_msft_01', ?, ?, ?, ?, 'tab_switch', 'Candidate switched browser tabs / minimized window during live coding round question 2.', datetime('now', '-105 minutes'))
          `).run(msftMeetId, stud2.id, stud2.name, stud2.email);
        }
      }
    }
  } catch (e) {
    console.error('Meetings seed notice:', e.message);
  }
}

function seedAppliedStudentApplications() {
  try {
    const passwordHash = '$2a$10$7Z2ZqQ3/Y2zO8WfH5x6i0.GgI0vY1U5y5zZ2ZqQ3/Y2zO8WfH5x6i'; // sample hash

    // 1. Ensure GSFC Limited user and company profile exist
    let compUser = db.prepare('SELECT id FROM users WHERE email = ?').get('recruiter@gsfclimited.com');
    if (!compUser) {
      try {
        db.prepare(`INSERT INTO users (id, email, password_hash, role) VALUES ('u_comp_gsfc', 'recruiter@gsfclimited.com', ?, 'company')`).run(passwordHash);
        compUser = { id: 'u_comp_gsfc' };
      } catch (e) {
        compUser = db.prepare('SELECT id FROM users WHERE role = "company" LIMIT 1').get();
      }
    }

    if (compUser) {
      db.prepare(`
        INSERT OR IGNORE INTO company_profiles (id, user_id, company_name, logo_url, industry, website, approved)
        VALUES ('c_gsfc', ?, 'GSFC Limited', 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80', 'Chemical & Industrial Engineering', 'https://gsfclimited.com', 1)
      `).run(compUser.id);
    }

    // 2. Ensure GSFC Limited Requirement exists
    db.prepare(`
      INSERT OR IGNORE INTO requirements (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, preferred_skills_json, job_type, ctc_range, openings, deadline, job_description)
      VALUES (
        'req_gsfc_plant_eng',
        'c_gsfc',
        'Process & Plant Operations Engineer',
        '["BTech CSE", "BTech IT", "BTech Chemical", "BTech Mechanical"]',
        7.0,
        '["Process Automation", "SCADA", "Python", "SQL", "Industrial IoT"]',
        '["Plant Operations", "Distributed Control Systems"]',
        'Full-time',
        '₹10,50,000 - ₹14,00,000 PA',
        12,
        '2026-10-30',
        'GSFC Limited hiring Process & Operations Engineers to lead plant automation, data telemetry, and SCADA infrastructure.'
      )
    `).run();

    // 3. Ensure Candidate Om Thakkar user exists
    let studUser = db.prepare('SELECT id FROM users WHERE email = ?').get('thakkar_om@gmail.com');
    if (!studUser) {
      try {
        db.prepare(`INSERT INTO users (id, email, password_hash, role) VALUES ('u_stud_omthakkar', 'thakkar_om@gmail.com', ?, 'student')`).run(passwordHash);
        studUser = { id: 'u_stud_omthakkar' };
      } catch (e) {
        studUser = db.prepare('SELECT id FROM users WHERE role = "student" LIMIT 1').get();
      }
    }

    if (studUser) {
      db.prepare(`
        INSERT OR IGNORE INTO student_profiles 
        (id, user_id, roll_number, name, program, branch, cgpa, resume_url, ats_score)
        VALUES ('s_omthakkar', ?, '24BT04171', 'Om Thakkar', 'BTech CSE', 'Computer Science & Engineering', 8.8, '/uploads/sample_resume.pdf', 94)
      `).run(studUser.id);
    }




    // 4. Seed Applications for Om Thakkar in master applications database
    const omApps = [
      { id: 'app_om_gsfc', reqId: 'req_gsfc_plant_eng', match: 88, status: 'applied', appliedAt: '2026-08-24 10:15:00' },
      { id: 'app_om_msft', reqId: 'req_microsoft_sde', match: 88, status: 'applied', appliedAt: '2026-08-23 14:30:00' },
      { id: 'app_om_goog', reqId: 'req_google_swe', match: 88, status: 'applied', appliedAt: '2026-08-23 11:20:00' }
    ];

    for (const app of omApps) {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO applications (id, student_id, requirement_id, match_score, status, applied_via, applied_at)
          VALUES (?, 's_omthakkar', ?, ?, ?, 'internal', ?)
        `).run(app.id, app.reqId, app.match, app.status, app.appliedAt);
      } catch (err) {}
    }

    // 5. Seed other student applications for rich Master TPC Applications table
    const otherApps = [
      { id: 'app_arav_goog_full', studentId: 's_arav', reqId: 'req_google_swe', match: 95, status: 'interview', appliedAt: '2026-08-22 09:00:00' },
      { id: 'app_arav_msft_full', studentId: 's_arav', reqId: 'req_microsoft_sde', match: 91, status: 'shortlisted', appliedAt: '2026-08-22 15:45:00' },
      { id: 'app_rohan_tcs_full', studentId: 's_rohan', reqId: 'req_tcs_analyst', match: 89, status: 'applied', appliedAt: '2026-08-21 11:00:00' }
    ];

    for (const app of otherApps) {
      try {
        db.prepare(`
          INSERT OR IGNORE INTO applications (id, student_id, requirement_id, match_score, status, applied_via, applied_at)
          VALUES (?, ?, ?, ?, ?, 'internal', ?)
        `).run(app.id, app.studentId, app.reqId, app.match, app.status, app.appliedAt);
      } catch (err) {}
    }
  } catch (e) {
    console.error('Applied student applications seed notice:', e.message);
  }
}



// Automatically seed applications on every startup
seedAppliedStudentApplications();

export default db;


