-- ============================================================================
-- 🚀 GSFC UNIVERSITY DIGITAL CAMPUS & PLACEMENT ANALYZER
-- Complete Master PostgreSQL Schema for Supabase
-- Converted from SQLite schema.sql, indexes.sql, and active migrations
-- ============================================================================

-- Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. 🛡️ USERS & MASTER ACCOUNTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'company', 'admin', 'alumni', 'faculty', 'superadmin', 'security')) NOT NULL,
    google_id TEXT UNIQUE,
    auth_provider TEXT DEFAULT 'local', -- 'local', 'google', 'both'
    email_verified INTEGER DEFAULT 0,
    last_login TIMESTAMPTZ,
    profile_image TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'disabled', 'pending')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. 🏢 COMPANY PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    industry TEXT,
    website TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    location TEXT DEFAULT 'Vadodara, Gujarat',
    approved INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'Tier-1 Core Partner',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. 🎓 STUDENT CANDIDATE PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    roll_number TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    program TEXT NOT NULL,
    branch TEXT,
    cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.0,
    admission_year INTEGER DEFAULT 2022,
    passing_year INTEGER DEFAULT 2026,
    semester INTEGER DEFAULT 7,
    division TEXT DEFAULT 'A',
    profile_completion_pct INTEGER DEFAULT 80,
    profile_completion INTEGER DEFAULT 80,
    target_career_stream TEXT,
    access_status TEXT DEFAULT 'active' CHECK(access_status IN ('active', 'restricted', 'blocked')),
    is_authorized INTEGER DEFAULT 1,
    resume_url TEXT,
    photo_url TEXT,
    parsed_resume_json JSONB DEFAULT '{}'::jsonb,
    ats_score INTEGER DEFAULT 0,
    ats_feedback_json JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    embedding_vector TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. 🏛️ FACULTY COORDINATORS & MENTORS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faculty_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    school TEXT DEFAULT 'School of Technology (SOT)',
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    assigned_batches JSONB DEFAULT '["All Batches"]'::jsonb,
    photo_url TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. 💼 JOB DRIVES & REQUIREMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.requirements (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    eligible_programs_json JSONB NOT NULL DEFAULT '["BTech CSE"]'::jsonb,
    min_cgpa NUMERIC(4,2) DEFAULT 0.0,
    required_skills_json JSONB NOT NULL DEFAULT '["Python", "SQL"]'::jsonb,
    preferred_skills_json JSONB DEFAULT '[]'::jsonb,
    job_type TEXT DEFAULT 'Full-time',
    ctc_range TEXT NOT NULL,
    openings INTEGER DEFAULT 1,
    deadline TEXT NOT NULL,
    job_description TEXT NOT NULL,
    embedding_vector TEXT,
    application_type TEXT CHECK(application_type IN ('internal', 'external')) DEFAULT 'internal',
    external_apply_url TEXT,
    application_instructions TEXT,
    external_click_count INTEGER DEFAULT 0,
    question_bank_json JSONB DEFAULT '[]'::jsonb,
    question_bank_status TEXT CHECK(question_bank_status IN ('pending', 'complete')) DEFAULT 'pending',
    applications_open INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. 📝 STUDENT APPLICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    requirement_id TEXT NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
    match_score NUMERIC(5,2) DEFAULT 0.0,
    status TEXT CHECK(status IN ('applied', 'shortlisted', 'interview', 'selected', 'rejected')) DEFAULT 'applied',
    applied_via TEXT CHECK(applied_via IN ('internal', 'external')) DEFAULT 'internal',
    attendance_status TEXT DEFAULT 'pending' CHECK(attendance_status IN ('present', 'absent', 'pending')),
    evaluation_notes TEXT DEFAULT '',
    evaluation_score NUMERIC(5,2) DEFAULT 0.0,
    offer_letter_data_json JSONB,
    combined_dossier_url TEXT,
    authenticity_report_json JSONB,
    applied_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, requirement_id)
);

-- ----------------------------------------------------------------------------
-- 7. 🛡️ DOCUMENT AUTHENTICITY & FORENSIC REPORTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_authenticity_reports (
    id TEXT PRIMARY KEY,
    application_id TEXT,
    student_id TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size INTEGER,
    risk_level TEXT DEFAULT 'low' CHECK(risk_level IN ('low', 'medium', 'high')),
    risk_score INTEGER DEFAULT 15,
    summary_verdict TEXT,
    metadata_signals_json JSONB DEFAULT '{}'::jsonb,
    timeline_signals_json JSONB DEFAULT '{}'::jsonb,
    ai_text_signals_json JSONB DEFAULT '{}'::jsonb,
    tamper_signals_json JSONB DEFAULT '{}'::jsonb,
    signals_list_json JSONB DEFAULT '[]'::jsonb,
    disclaimer TEXT DEFAULT 'This tool surfaces signals for human review. It does not verify document authenticity with certainty.',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. 📬 NOTIFICATIONS DISPATCH LOG
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications_log (
    id TEXT PRIMARY KEY,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT,
    recipient_phone TEXT,
    channel TEXT CHECK(channel IN ('whatsapp', 'email', 'in_app')) NOT NULL,
    notification_type TEXT CHECK(notification_type IN ('drive_alert', 'interview_reminder', 'offer_letter', 'general')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'sent',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 9. 🎯 INTERVIEW QUESTION SETS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_question_sets (
    id TEXT PRIMARY KEY,
    requirement_id TEXT NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 10. 🎙️ MOCK INTERVIEW SESSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mock_interview_sessions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    requirement_id TEXT NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
    qa_pairs_json JSONB DEFAULT '[]'::jsonb,
    feedback_json JSONB DEFAULT '{}'::jsonb,
    overall_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 11. 📋 ADMIN AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_entity_type TEXT,
    target_entity_id TEXT,
    details_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 12. 📊 INTERVIEW EVALUATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_evaluations (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    requirement_id TEXT,
    question_text TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    verdict TEXT CHECK(verdict IN ('pass', 'needs_improvement', 'fail')) NOT NULL,
    score INTEGER NOT NULL,
    concepts_covered_json JSONB DEFAULT '[]'::jsonb,
    concepts_missing_json JSONB DEFAULT '[]'::jsonb,
    attempt_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 13. 🎓 AUTHORIZED STUDENTS ROSTER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.authorized_students (
    id TEXT PRIMARY KEY,
    roll_number TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    program TEXT DEFAULT 'BTech CSE',
    branch TEXT DEFAULT 'Computer Science & Engineering',
    cgpa NUMERIC(4,2) DEFAULT 8.0,
    passing_year INTEGER DEFAULT 2026,
    admission_year INTEGER DEFAULT 2022,
    phone TEXT DEFAULT '',
    access_status TEXT DEFAULT 'active' CHECK(access_status IN ('active', 'blocked', 'pending')),
    authorized_by TEXT DEFAULT 'TPC Admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 14. 🎪 CAMPUS EVENTS & FESTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    event_type TEXT DEFAULT 'Tech Fest',
    category TEXT DEFAULT 'Fest',
    event_date TEXT,
    date TEXT,
    end_date TEXT,
    venue TEXT DEFAULT 'GSFC University Auditorium',
    banner_url TEXT,
    is_registration_open INTEGER DEFAULT 1,
    max_registrations INTEGER DEFAULT 1000,
    custom_fields_json JSONB DEFAULT '[]'::jsonb,
    created_by TEXT DEFAULT 'TPC Admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 15. 👥 EXTERNAL FEST CANDIDATES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.external_candidates (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization TEXT NOT NULL,
    city TEXT DEFAULT 'Vadodara',
    photo_url TEXT,
    id_proof_url TEXT,
    pass_token TEXT UNIQUE NOT NULL,
    custom_data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 16. 🎫 FEST VISITOR PASS TOKENS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pass_tokens (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE,
    pass_code TEXT UNIQUE,
    candidate_type TEXT DEFAULT 'student',
    candidate_id TEXT,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    guest_name TEXT,
    guest_email TEXT,
    guest_phone TEXT,
    college_or_org TEXT,
    entry_gate TEXT DEFAULT 'Main Gate 1',
    valid_date TEXT,
    qr_payload TEXT,
    status TEXT DEFAULT 'issued' CHECK(status IN ('issued', 'active', 'checked_in', 'cancelled')),
    scanned_at TIMESTAMPTZ,
    issued_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 17. 🛡️ SECURITY ENTRY CHECK-IN LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entry_logs (
    id TEXT PRIMARY KEY,
    token TEXT,
    pass_or_drive_code TEXT,
    event_id TEXT,
    candidate_type TEXT,
    candidate_id TEXT,
    candidate_name TEXT,
    candidate_email TEXT,
    candidate_phone TEXT,
    candidate_org TEXT,
    visitor_name TEXT,
    visitor_type TEXT,
    gate_number TEXT DEFAULT 'Gate 1 (Main Entrance)',
    gate_name TEXT DEFAULT 'Main Campus Gate A',
    scanned_by_user_id TEXT,
    scanned_by_name TEXT,
    scanned_by_role TEXT,
    verified_by TEXT DEFAULT 'Security Officer',
    status TEXT DEFAULT 'Granted',
    scanned_at TIMESTAMPTZ DEFAULT now(),
    entry_timestamp TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 18. 🛡️ SECURITY STAFF PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.security_staff_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    gate_assigned TEXT DEFAULT 'Main Campus Gate A',
    shift TEXT DEFAULT 'Day Shift (08:00 AM - 04:00 PM)',
    active_status TEXT DEFAULT 'active' CHECK(active_status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 19. 📹 IN-PORTAL VIDEO MEETINGS & INTERVIEWS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY,
    room_id TEXT UNIQUE NOT NULL,
    drive_id TEXT NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT CHECK(status IN ('scheduled', 'live', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    summary_notes TEXT
);

-- ----------------------------------------------------------------------------
-- 20. 👥 MEETING PARTICIPANTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meeting_participants (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.student_profiles(id) ON DELETE SET NULL,
    role TEXT CHECK(role IN ('student', 'company', 'admin', 'faculty')) NOT NULL,
    join_status TEXT CHECK(join_status IN ('invited', 'joined', 'left', 'ejected', 'no_show')) DEFAULT 'invited',
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    outcome_status TEXT CHECK(outcome_status IN ('pending', 'selected', 'rejected', 'hold', 'no_show')) DEFAULT 'pending',
    interviewer_notes TEXT DEFAULT '',
    evaluation_score NUMERIC(5,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 21. 🚨 MEETING PROCTORING & VIOLATIONS LOG
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meeting_violations (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    details TEXT NOT NULL,
    occurred_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 22. 💬 MEETING CHAT MESSAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.meeting_chat_messages (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 23. 🎮 GAMIFICATION RULES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gamification_rules (
    action_key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    points_reward INTEGER DEFAULT 25,
    badge_code TEXT,
    badge_name TEXT,
    badge_icon TEXT,
    badge_desc TEXT,
    threshold INTEGER DEFAULT 1
);

-- ----------------------------------------------------------------------------
-- 24. 🏆 STUDENT GAMIFICATION STATUS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_gamification (
    student_id TEXT PRIMARY KEY REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    points_total INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 1,
    nickname TEXT,
    is_anonymous INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 25. 🎖️ STUDENT BADGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_badges (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    badge_code TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT NOT NULL,
    badge_desc TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, badge_code)
);

-- ----------------------------------------------------------------------------
-- 26. 📈 GAMIFICATION POINTS LOG
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gamification_points_log (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    action_key TEXT NOT NULL,
    points_awarded INTEGER NOT NULL,
    description TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 27. ⛓️ BLOCKCHAIN LEDGER (BIGSERIAL Identity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blockchain_ledger (
    block_number BIGSERIAL PRIMARY KEY,
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
    anchored_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'VALID_CONFIRMED'
);

-- ----------------------------------------------------------------------------
-- 28. 📱 WHATSAPP NOTIFICATIONS LOG
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_notification_logs (
    id TEXT PRIMARY KEY,
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    student_id TEXT,
    template_type TEXT NOT NULL,
    message_body TEXT NOT NULL,
    status TEXT DEFAULT 'SENT',
    whatsapp_url TEXT,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 29. 📱 WHATSAPP STUDENT OPT-IN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_student_opt_in (
    student_id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    opt_in INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 30. 💳 SUBSCRIPTION PLANS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    badge_title TEXT NOT NULL,
    price_inr INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    max_postings INTEGER NOT NULL,
    description TEXT NOT NULL,
    features_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 31. 🏢 COMPANY SUBSCRIPTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_subscriptions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    postings_used INTEGER DEFAULT 0,
    max_postings INTEGER NOT NULL,
    status TEXT CHECK(status IN ('active', 'expired', 'cancelled', 'grace_period')) DEFAULT 'active',
    last_payment_id TEXT,
    auto_renew INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 32. 💳 PAYMENT TRANSACTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
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
    invoice_data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    paid_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 33. ✉️ COMPANY STUDENT MAILS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_student_mails (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_id TEXT,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    sender_phone TEXT,
    roll_number TEXT,
    program TEXT,
    branch TEXT,
    cgpa NUMERIC(4,2),
    type TEXT DEFAULT 'meeting_absence',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    meeting_id TEXT,
    room_id TEXT,
    meeting_title TEXT,
    drive_title TEXT,
    status TEXT DEFAULT 'unread',
    recruiter_reply TEXT,
    replied_at TIMESTAMPTZ,
    replied_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 34. 🎓 FACULTY INTERNSHIPS & PRAYAAS DCS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internships (
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
    performance_rating NUMERIC(3,1) DEFAULT 4.5,
    evaluation_notes TEXT DEFAULT '',
    noc_status TEXT DEFAULT 'issued' CHECK(noc_status IN ('pending', 'issued', 'not_required')),
    offer_letter_url TEXT,
    completion_certificate_url TEXT,
    created_by TEXT DEFAULT 'TPC Faculty Coordinator',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 35. 📅 PLACEMENT CALENDAR EVENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_calendar_events (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    role TEXT NOT NULL,
    ctc TEXT,
    date TEXT NOT NULL,
    time TEXT,
    stage TEXT,
    location TEXT,
    eligible_batches_json JSONB DEFAULT '["2025", "2026"]'::jsonb,
    eligible_branches_json JSONB DEFAULT '["CSE", "IT", "AI & DS"]'::jsonb,
    status TEXT DEFAULT 'Scheduled',
    updated_by TEXT DEFAULT 'TPC Admin Coordinator',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 36. 🎓 ALUMNI PROFILES & DIRECTORY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    batch_year TEXT,
    company TEXT,
    designation TEXT,
    linkedin_url TEXT,
    bio TEXT,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 37. 💬 MENTORSHIP POSTS & COMMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentorship_posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags_json JSONB DEFAULT '[]'::jsonb,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mentorship_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES public.mentorship_posts(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 38. 🕒 ALUMNI MENTORSHIP SLOTS & REVIEWS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alumni_mentorship_slots (
    id TEXT PRIMARY KEY,
    alumni_id TEXT NOT NULL,
    alumni_name TEXT NOT NULL,
    slot_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    topic TEXT,
    booked_by_student_id TEXT,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'booked', 'completed', 'cancelled')),
    meeting_link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alumni_mentor_reviews (
    id TEXT PRIMARY KEY,
    slot_id TEXT REFERENCES public.alumni_mentorship_slots(id) ON DELETE SET NULL,
    student_id TEXT NOT NULL,
    alumni_id TEXT NOT NULL,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 39. 🎪 JOB FAIRS & REGISTRATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_fairs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    fair_date TEXT NOT NULL,
    venue TEXT NOT NULL,
    status TEXT DEFAULT 'upcoming',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_fair_companies (
    id TEXT PRIMARY KEY,
    fair_id TEXT NOT NULL REFERENCES public.job_fairs(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    booth_number TEXT,
    roles_offered_json JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.job_fair_registrations (
    id TEXT PRIMARY KEY,
    fair_id TEXT NOT NULL REFERENCES public.job_fairs(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(fair_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 40. ❓ Q&A COMMUNITY THREADS & REPLIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qa_threads (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.qa_replies (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES public.qa_threads(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 41. 🔖 STUDENT STUDY & ASSESSMENT EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_bookmarks (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS public.student_activity_history (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_assessments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    assessment_name TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    max_score NUMERIC(5,2) NOT NULL,
    topics_breakdown_json JSONB DEFAULT '{}'::jsonb,
    taken_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_documents (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    doc_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_notifications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_resumes (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    resume_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    parsed_json JSONB DEFAULT '{}'::jsonb,
    ats_score INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_preparation_plans (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    milestones_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_coding_submissions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    problem_slug TEXT NOT NULL,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL,
    passed_tests INTEGER DEFAULT 0,
    total_tests INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_communication_practices (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    transcript TEXT,
    clarity_score INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 0,
    feedback_json JSONB DEFAULT '{}'::jsonb,
    practiced_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_study_materials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 42. ⚠️ PLACEMENT RISK INTELLIGENCE & AUDITS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_risk_alerts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    risk_level TEXT DEFAULT 'medium' CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
    reason TEXT NOT NULL,
    suggested_actions_json JSONB DEFAULT '[]'::jsonb,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placement_rag_documents (
    id TEXT PRIMARY KEY,
    doc_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_login_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    login_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS public.user_activity_timeline (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    details_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 43. 🌐 ECOSYSTEM & POOL DRIVES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ecosystem_colleges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    city TEXT DEFAULT 'Vadodara',
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ecosystem_pool_drives (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    lead_college_id TEXT REFERENCES public.ecosystem_colleges(id),
    participating_colleges_json JSONB DEFAULT '[]'::jsonb,
    date TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ecosystem_assessments (
    id TEXT PRIMARY KEY,
    drive_id TEXT REFERENCES public.ecosystem_pool_drives(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ecosystem_assessment_submissions (
    id TEXT PRIMARY KEY,
    assessment_id TEXT REFERENCES public.ecosystem_assessments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    score NUMERIC(5,2) DEFAULT 0.0,
    answers_json JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ⚡ PERFORMANCE INDEXES (Converted from indexes.sql)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_students_roll ON public.student_profiles(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_passing_year ON public.student_profiles(passing_year);
CREATE INDEX IF NOT EXISTS idx_students_branch ON public.student_profiles(branch);
CREATE INDEX IF NOT EXISTS idx_company_user ON public.company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON public.faculty_profiles(email);
CREATE INDEX IF NOT EXISTS idx_reqs_company ON public.requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_apps_student ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_apps_req ON public.applications(requirement_id);
CREATE INDEX IF NOT EXISTS idx_passes_code ON public.pass_tokens(pass_code);
CREATE INDEX IF NOT EXISTS idx_entry_logs_event ON public.entry_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_meetings_drive ON public.meetings(drive_id);
CREATE INDEX IF NOT EXISTS idx_meetings_company ON public.meetings(company_id);
CREATE INDEX IF NOT EXISTS idx_meeting_parts_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_parts_user ON public.meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_doc ON public.blockchain_ledger(doc_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_block_hash ON public.blockchain_ledger(block_hash);

-- ============================================================================
-- 🔓 Row Level Security (RLS) & Access Configuration
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_authenticity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_student_opt_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_student_mails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_mentorship_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_mentor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_fairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_fair_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_fair_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preparation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_coding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_communication_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_pool_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_assessment_submissions ENABLE ROW LEVEL SECURITY;

-- Grant Full Service Role / API Access to all tables
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow All Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Allow All Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
