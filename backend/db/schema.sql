CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'company', 'admin')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    industry TEXT,
    website TEXT,
    approved INTEGER DEFAULT 0, -- 0: false, 1: true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roll_number TEXT,
    name TEXT NOT NULL,
    program TEXT NOT NULL, -- e.g., BTech CSE, BTech Mechanical, MBA
    branch TEXT,
    cgpa REAL NOT NULL,
    resume_url TEXT,
    parsed_resume_json TEXT, -- Structured JSON from Module A
    ats_score INTEGER DEFAULT 0,
    ats_feedback_json TEXT, -- JSON array of actionable suggestions
    embedding_vector TEXT, -- JSON array of floats for semantic search
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requirements (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    eligible_programs_json TEXT NOT NULL, -- JSON array e.g., ["BTech CSE", "BTech IT"]
    min_cgpa REAL DEFAULT 0.0,
    required_skills_json TEXT NOT NULL, -- JSON array e.g., ["Python", "SQL"]
    preferred_skills_json TEXT, -- JSON array
    job_type TEXT DEFAULT 'Full-time', -- Full-time / Internship / PPO
    ctc_range TEXT NOT NULL,
    openings INTEGER DEFAULT 1,
    deadline TEXT NOT NULL,
    job_description TEXT NOT NULL,
    embedding_vector TEXT,
    application_type TEXT CHECK(application_type IN ('internal', 'external')) DEFAULT 'internal',
    external_apply_url TEXT,
    application_instructions TEXT,
    external_click_count INTEGER DEFAULT 0,
    question_bank_json TEXT DEFAULT '[]',
    question_bank_status TEXT CHECK(question_bank_status IN ('pending', 'complete')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    match_score REAL DEFAULT 0.0,
    status TEXT CHECK(status IN ('applied', 'shortlisted', 'interview', 'selected', 'rejected')) DEFAULT 'applied',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, requirement_id)
);

CREATE TABLE IF NOT EXISTS interview_question_sets (
    id TEXT PRIMARY KEY,
    requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES student_profiles(id) ON DELETE CASCADE,
    questions_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mock_interview_sessions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    qa_pairs_json TEXT DEFAULT '[]',
    feedback_json TEXT DEFAULT '{}',
    overall_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress', -- in_progress, completed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    viewed_entity_type TEXT CHECK(viewed_entity_type IN ('student', 'company', 'requirement', 'application', 'eval_result')) NOT NULL,
    viewed_entity_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

