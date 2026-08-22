import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'campushire.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');
db.pragma('cache_size = -64000');
db.pragma('busy_timeout = 10000');
db.pragma('foreign_keys = ON');

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
    `);
    // Migrate users.role check constraint if 'alumni' is missing
    const userTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get()?.sql || '';
    if (userTableSql && !userTableSql.includes("'alumni'")) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE users_migrated (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT CHECK(role IN ('student', 'company', 'admin', 'alumni')) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO users_migrated (id, email, password_hash, role, created_at)
        SELECT id, email, password_hash, role, created_at FROM users;
        DROP TABLE users;
        ALTER TABLE users_migrated RENAME TO users;
      `);
      db.pragma('foreign_keys = ON');
    }

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
    `);

    // 8. Community Q&A Replies Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS qa_replies (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL REFERENCES qa_threads(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL,
        author_name TEXT,
        author_role TEXT CHECK(author_role IN ('student', 'alumni', 'admin', 'company', 'tpo')),
        body TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Demo Alumni, Job Fairs & Q&A if not already present
    seedAlumniAndCommunityData();

    // Ensure GSFC Admin accounts exist
    const adminUser = db.prepare("SELECT * FROM users WHERE email = 'admin@gsfcuniversity.ac.in'").get();
    if (!adminUser) {
      const passHash = bcrypt.hashSync('password123', 10);
      db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)").run('u_admin_gsfc', 'admin@gsfcuniversity.ac.in', passHash, 'admin');
    }
  } catch (err) {
    console.error('Migration notice:', err.message);
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

  for (const st of multiYearDataset) {
    db.prepare(`INSERT OR REPLACE INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'student')`)
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
      INSERT OR REPLACE INTO student_profiles 
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

  console.log('✅ CampusHire AI Database successfully initialized and seeded!');
}

export default db;
