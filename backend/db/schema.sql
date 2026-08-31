CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'company', 'admin', 'alumni', 'faculty', 'superadmin', 'security')) NOT NULL,
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
    phone TEXT,
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
    applications_open INTEGER DEFAULT 1, -- 1: Open, 0: Closed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    match_score REAL DEFAULT 0.0,
    status TEXT CHECK(status IN ('applied', 'shortlisted', 'interview', 'selected', 'rejected')) DEFAULT 'applied',
    applied_via TEXT CHECK(applied_via IN ('internal', 'external')) DEFAULT 'internal',
    attendance_status TEXT DEFAULT 'pending' CHECK(attendance_status IN ('present', 'absent', 'pending')),
    evaluation_notes TEXT DEFAULT '',
    evaluation_score REAL DEFAULT 0.0,
    offer_letter_data_json TEXT,
    combined_dossier_url TEXT,
    authenticity_report_json TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, requirement_id)
);

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
);

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
    admin_user_id TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_entity_type TEXT,
    target_entity_id TEXT,
    details_json TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- In-Portal Company Video Meetings & Interviews
CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    room_id TEXT UNIQUE NOT NULL,
    drive_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at DATETIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT CHECK(status IN ('scheduled', 'live', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    summary_notes TEXT
);

-- Meeting Participants & Outcome Status
CREATE TABLE IF NOT EXISTS meeting_participants (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES student_profiles(id) ON DELETE SET NULL,
    role TEXT CHECK(role IN ('student', 'company', 'admin', 'faculty')) NOT NULL,
    join_status TEXT CHECK(join_status IN ('invited', 'joined', 'left', 'ejected', 'no_show')) DEFAULT 'invited',
    joined_at DATETIME,
    left_at DATETIME,
    outcome_status TEXT CHECK(outcome_status IN ('pending', 'selected', 'rejected', 'hold', 'no_show')) DEFAULT 'pending',
    interviewer_notes TEXT DEFAULT '',
    evaluation_score REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Anti-Cheating & Proctoring Violations Log
CREATE TABLE IF NOT EXISTS meeting_violations (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    details TEXT NOT NULL,
    occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- In-Meeting Text Chat Messages
CREATE TABLE IF NOT EXISTS meeting_chat_messages (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 🎮 GAMIFICATION LAYER: POINTS, BADGES & LEADERBOARD
-- ============================================================================
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

-- ============================================================================
-- ⛓️ BLOCKCHAIN-ANCHORED DOCUMENT VERIFICATION HASH-CHAIN LEDGER
-- ============================================================================
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

-- ============================================================================
-- 💬 WHATSAPP NOTIFICATION AUDIT LOGS & STUDENT OPT-IN
-- ============================================================================
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

-- ============================================================================
-- 💳 COMPANY SUBSCRIPTION PLANS & PAYMENT GATEWAY (RAZORPAY)
-- ============================================================================
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

-- ============================================================================
-- 🎓 FACULTY INTERNSHIP MODULE & PRAYAAS DCS TRACKER
-- ============================================================================
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

-- ============================================================================
-- 📅 BACKEND-SYNCED PLACEMENT & CORPORATE DRIVES CALENDAR
-- ============================================================================
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

