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
db.pragma('foreign_keys = ON');

export function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  applyMigrations();
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

    // High-Performance Database Indexes for Instant TPC Admin Login & Queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_company_profiles_approved ON company_profiles(approved);
      CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
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
