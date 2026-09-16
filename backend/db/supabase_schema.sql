-- ==========================================================
-- 🚀 GSFC UNIVERSITY DIGITAL CAMPUS & PLACEMENT ANALYZER
-- Complete Supabase PostgreSQL Database Schema
-- Paste and run this script in Supabase Dashboard -> SQL Editor
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 🛡️ Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'company', 'admin', 'alumni', 'faculty', 'superadmin', 'security')) NOT NULL,
    google_id TEXT UNIQUE,
    auth_provider TEXT DEFAULT 'local',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    profile_image TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'disabled', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 🏢 Company Profiles Table
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
    approved INTEGER DEFAULT 1,
    tier TEXT DEFAULT 'Tier-1 Core Partner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 🎓 Student Profiles Table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    roll_number TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    program TEXT NOT NULL,
    branch TEXT,
    cgpa NUMERIC(4,2) DEFAULT 0.0,
    admission_year INTEGER DEFAULT 2022,
    passing_year INTEGER DEFAULT 2026,
    semester INTEGER DEFAULT 7,
    division TEXT DEFAULT 'A',
    profile_completion_pct INTEGER DEFAULT 85,
    target_career_stream TEXT,
    access_status TEXT DEFAULT 'active',
    is_authorized INTEGER DEFAULT 1,
    resume_url TEXT,
    photo_url TEXT,
    parsed_resume_json JSONB DEFAULT '{}'::jsonb,
    ats_score INTEGER DEFAULT 0,
    ats_feedback_json JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 🏛️ Faculty Profiles Table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. 💼 Job Drives & Requirements Table
CREATE TABLE IF NOT EXISTS public.requirements (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    eligible_programs_json JSONB DEFAULT '["BTech CSE"]'::jsonb,
    min_cgpa NUMERIC(4,2) DEFAULT 0.0,
    required_skills_json JSONB DEFAULT '["Python", "SQL"]'::jsonb,
    preferred_skills_json JSONB DEFAULT '[]'::jsonb,
    job_type TEXT DEFAULT 'Full-time',
    ctc_range TEXT NOT NULL,
    openings INTEGER DEFAULT 1,
    deadline TEXT NOT NULL,
    job_description TEXT NOT NULL,
    application_type TEXT DEFAULT 'internal',
    external_apply_url TEXT,
    applications_open INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. 📝 Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    requirement_id TEXT NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
    match_score NUMERIC(5,2) DEFAULT 0.0,
    status TEXT CHECK(status IN ('applied', 'shortlisted', 'interview', 'selected', 'rejected')) DEFAULT 'applied',
    applied_via TEXT DEFAULT 'internal',
    attendance_status TEXT DEFAULT 'pending',
    evaluation_notes TEXT DEFAULT '',
    evaluation_score NUMERIC(5,2) DEFAULT 0.0,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, requirement_id)
);

-- 7. 🎪 Fest & Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_type TEXT DEFAULT 'Tech Fest',
    date TEXT,
    venue TEXT,
    description TEXT,
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. 🎫 Event Visitor Passes Table
CREATE TABLE IF NOT EXISTS public.pass_tokens (
    id TEXT PRIMARY KEY,
    pass_code TEXT UNIQUE NOT NULL,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    college_or_org TEXT,
    entry_gate TEXT DEFAULT 'Main Gate 1',
    valid_date TEXT,
    status TEXT DEFAULT 'active',
    scanned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. 🛡️ Security Gate Check-in Logs Table
CREATE TABLE IF NOT EXISTS public.entry_logs (
    id TEXT PRIMARY KEY,
    gate_number TEXT DEFAULT 'Gate 1 (Main Entrance)',
    visitor_name TEXT NOT NULL,
    visitor_type TEXT NOT NULL,
    pass_or_drive_code TEXT,
    verified_by TEXT DEFAULT 'Security Officer',
    status TEXT DEFAULT 'Granted',
    entry_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. 🎓 Alumni Profiles & Mentorship Table
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    batch_year TEXT,
    company TEXT,
    designation TEXT,
    linkedin_url TEXT,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. 📬 Notifications Log Table
CREATE TABLE IF NOT EXISTS public.notifications_log (
    id TEXT PRIMARY KEY,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT,
    recipient_phone TEXT,
    channel TEXT DEFAULT 'in_app',
    notification_type TEXT DEFAULT 'general',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- ⚡ Performance Indexes
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_students_roll ON public.student_profiles(roll_number);
CREATE INDEX IF NOT EXISTS idx_faculty_email ON public.faculty_profiles(email);
CREATE INDEX IF NOT EXISTS idx_reqs_company ON public.requirements(company_id);
CREATE INDEX IF NOT EXISTS idx_apps_student ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_apps_req ON public.applications(requirement_id);
CREATE INDEX IF NOT EXISTS idx_passes_code ON public.pass_tokens(pass_code);

-- ==========================================================
-- Enable Row Level Security (RLS) & Public Access Policies
-- ==========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Allow full backend service access
CREATE POLICY "Service Access Users" ON public.users FOR ALL USING (true);
CREATE POLICY "Service Access Students" ON public.student_profiles FOR ALL USING (true);
CREATE POLICY "Service Access Companies" ON public.company_profiles FOR ALL USING (true);
CREATE POLICY "Service Access Faculty" ON public.faculty_profiles FOR ALL USING (true);
CREATE POLICY "Service Access Requirements" ON public.requirements FOR ALL USING (true);
CREATE POLICY "Service Access Applications" ON public.applications FOR ALL USING (true);
CREATE POLICY "Service Access Events" ON public.events FOR ALL USING (true);
CREATE POLICY "Service Access Passes" ON public.pass_tokens FOR ALL USING (true);
CREATE POLICY "Service Access Entry Logs" ON public.entry_logs FOR ALL USING (true);
CREATE POLICY "Service Access Alumni" ON public.alumni_profiles FOR ALL USING (true);
CREATE POLICY "Service Access Notifications" ON public.notifications_log FOR ALL USING (true);
