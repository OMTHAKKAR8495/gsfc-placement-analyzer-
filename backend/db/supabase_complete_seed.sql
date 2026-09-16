-- =========================================================================
-- 🎓 GSFC UNIVERSITY DIGITAL CAMPUS & PLACEMENT ANALYZER
-- Complete Database Script: Creates Tables & Stores Data in Respective Folders
-- Copy and paste this directly into Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. 🛡️ USERS TABLE (All Platform Logins & Role Accounts)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 2. 🏢 COMPANIES TABLE (Recruitment Partners & Industry Folders)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 3. 🎓 STUDENTS TABLE (Student Candidates, Enrollments & CGPA)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 4. 🏛️ FACULTY TABLE (Placement Coordinators & Mentors)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 5. 💼 JOB DRIVES TABLE (Recruitment Drives & Openings)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 6. 📝 APPLICATIONS TABLE (Student Placement Applications)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 7. 🎪 FEST & EVENTS TABLE (Campus Fests & Events)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 8. 🎫 FEST PASSES TABLE (Visitor Entry Passes & QR Badges)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 9. 🛡️ SECURITY GATE LOGS TABLE (Gate Scans & Visitor Verification)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 10. 🎓 ALUMNI NETWORK TABLE (Alumni Mentors & Career Advisory)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 11. 📬 NOTIFICATIONS TABLE (System Mailbox & Broadcast Alerts)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 🔓 Row Level Security & Open Access Policies
-- -------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Users Access" ON public.users;
    DROP POLICY IF EXISTS "Public Students Access" ON public.student_profiles;
    DROP POLICY IF EXISTS "Public Companies Access" ON public.company_profiles;
    DROP POLICY IF EXISTS "Public Faculty Access" ON public.faculty_profiles;
    DROP POLICY IF EXISTS "Public Reqs Access" ON public.requirements;
    DROP POLICY IF EXISTS "Public Apps Access" ON public.applications;
    DROP POLICY IF EXISTS "Public Events Access" ON public.events;
    DROP POLICY IF EXISTS "Public Passes Access" ON public.pass_tokens;
    DROP POLICY IF EXISTS "Public Logs Access" ON public.entry_logs;
    DROP POLICY IF EXISTS "Public Alumni Access" ON public.alumni_profiles;
    DROP POLICY IF EXISTS "Public Notifs Access" ON public.notifications_log;

    CREATE POLICY "Public Users Access" ON public.users FOR ALL USING (true);
    CREATE POLICY "Public Students Access" ON public.student_profiles FOR ALL USING (true);
    CREATE POLICY "Public Companies Access" ON public.company_profiles FOR ALL USING (true);
    CREATE POLICY "Public Faculty Access" ON public.faculty_profiles FOR ALL USING (true);
    CREATE POLICY "Public Reqs Access" ON public.requirements FOR ALL USING (true);
    CREATE POLICY "Public Apps Access" ON public.applications FOR ALL USING (true);
    CREATE POLICY "Public Events Access" ON public.events FOR ALL USING (true);
    CREATE POLICY "Public Passes Access" ON public.pass_tokens FOR ALL USING (true);
    CREATE POLICY "Public Logs Access" ON public.entry_logs FOR ALL USING (true);
    CREATE POLICY "Public Alumni Access" ON public.alumni_profiles FOR ALL USING (true);
    CREATE POLICY "Public Notifs Access" ON public.notifications_log FOR ALL USING (true);
END $$;

-- =========================================================================
-- 📥 STORE RESPECTIVE DATA DIRECTLY INTO EACH TABLE
-- =========================================================================

-- 1. Insert Users
INSERT INTO public.users (id, email, password_hash, role, status, auth_provider, email_verified)
VALUES 
    ('u_admin_01', 'admin@gsfcuniversity.ac.in', '$2a$10$w1nEODoJjM5O1ZcR13oWl.z06m05yF2wXFkWwFsqw7hWc54k5X9q2', 'admin', 'active', 'local', true),
    ('u_student_01', '24bt04171@gsfcuniversity.ac.in', '$2a$10$w1nEODoJjM5O1ZcR13oWl.z06m05yF2wXFkWwFsqw7hWc54k5X9q2', 'student', 'active', 'both', true),
    ('u_student_02', 'omthakkar168@gsfcuniversity.ac.in', '$2a$10$w1nEODoJjM5O1ZcR13oWl.z06m05yF2wXFkWwFsqw7hWc54k5X9q2', 'student', 'active', 'google', true),
    ('u_student_03', '24bt041a1@gsfcuniversity.ac.in', '$2a$10$w1nEODoJjM5O1ZcR13oWl.z06m05yF2wXFkWwFsqw7hWc54k5X9q2', 'student', 'active', 'local', true),
    ('u_faculty_01', 'neeshuchaudhary@gsfcuniversityfaculty.ac.in', '$2a$10$w1nEODoJjM5O1ZcR13oWl.z06m05yF2wXFkWwFsqw7hWc54k5X9q2', 'faculty', 'active', 'local', true),
    ('u_company_01', 'recruiter.gsfc@gsfcuniversity.ac.in', '$2a$10$w1nEODoJjM5O1ZcR13oWl.z06m05yF2wXFkWwFsqw7hWc54k5X9q2', 'company', 'active', 'local', true),
    ('u_company_02', 'careers@tcs.com', '$2a$10$w1nEODoJjM5O1ZcR13oWl.z06m05yF2wXFkWwFsqw7hWc54k5X9q2', 'company', 'active', 'local', true),
    ('u_alumni_01', 'priya.patel@alumni.gsfc.ac.in', '$2a$10$w1nEODoJjM5O1ZcR13oWl.z06m05yF2wXFkWwFsqw7hWc54k5X9q2', 'alumni', 'active', 'local', true),
    ('u_security_01', 'security@gsfcuniversity.ac.in', '$2a$10$w1nEODoJjM5O1ZcR13oWl.z06m05yF2wXFkWwFsqw7hWc54k5X9q2', 'security', 'active', 'local', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Companies
INSERT INTO public.company_profiles (id, user_id, company_name, industry, website, contact_person, contact_email, contact_phone, location, approved, tier)
VALUES 
    ('comp_gsfc_ltd', 'u_company_01', 'Gujarat State Fertilizers & Chemicals Ltd (GSFC)', 'Chemicals & Petrochemicals', 'https://gsfclimited.com', 'HR Recruitment Team', 'recruiter.gsfc@gsfcuniversity.ac.in', '+91 265 2240240', 'Vadodara, Gujarat', 1, 'Tier-1 Core Partner'),
    ('comp_tcs_digital', 'u_company_02', 'Tata Consultancy Services (TCS)', 'Information Technology & Consulting', 'https://tcs.com', 'University Relations Desk', 'careers@tcs.com', '+91 22 67789999', 'Gandhinagar / Mumbai', 1, 'Strategic Corporate Partner')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Students
INSERT INTO public.student_profiles (id, user_id, roll_number, name, phone, program, branch, cgpa, admission_year, passing_year, semester, division, profile_completion_pct, target_career_stream, access_status, is_authorized, ats_score, skills)
VALUES 
    ('prof_om_01', 'u_student_01', '24BT04171', 'Om Thakkar', '+91 95584 13347', 'BTech CSE', 'Computer Science & Engineering', 8.85, 2022, 2026, 7, 'A', 95, 'Software Engineering & AI Systems', 'active', 1, 92, '["React", "Node.js", "Python", "MongoDB", "Supabase", "Cloud Architecture"]'::jsonb),
    ('prof_om_02', 'u_student_02', '24BT041A1', 'Om Thakkar (Campus Scholar)', '+91 95584 13347', 'BTech CSE', 'Computer Science & Engineering', 9.10, 2022, 2026, 7, 'A', 90, 'Full-Stack & Cloud Computing', 'active', 1, 88, '["JavaScript", "SQL", "PostgreSQL", "Docker"]'::jsonb),
    ('prof_rahul_01', 'u_student_03', '24BT04055', 'Rahul Sharma', '+91 98765 43210', 'BTech Mechanical', 'Mechanical Engineering', 8.20, 2022, 2026, 7, 'B', 80, 'Industrial Design & Automation', 'active', 1, 78, '["AutoCAD", "SolidWorks", "MATLAB"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Faculty
INSERT INTO public.faculty_profiles (id, user_id, name, email, phone, school, department, designation, assigned_batches, status)
VALUES 
    ('fac_neeshu_01', 'u_faculty_01', 'Dr. Neeshu Chaudhary', 'neeshuchaudhary@gsfcuniversityfaculty.ac.in', '+91 95584 13347', 'School of Technology (SOT)', 'Computer Science & Engineering', 'Faculty Placement Coordinator & Assistant Professor', '["BTech CSE (2022-2026)", "BTech IT (2023-2027)"]'::jsonb, 'Active')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Job Drives (Requirements)
INSERT INTO public.requirements (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, preferred_skills_json, job_type, ctc_range, openings, deadline, job_description, application_type, applications_open)
VALUES 
    ('req_gsfc_chem_01', 'comp_gsfc_ltd', 'Graduate Process Engineer (Chemical & Tech)', '["BTech Chemical", "BTech CSE"]'::jsonb, 7.50, '["Process Control", "Data Analysis", "Python"]'::jsonb, '["SCADA"]'::jsonb, 'Full-time / On-Campus', '6.5 LPA - 9.0 LPA', 15, '2026-10-30', 'Direct on-campus placement drive for Engineering graduates.', 'internal', 1),
    ('req_tcs_digital_01', 'comp_tcs_digital', 'Digital Systems Engineer & Cloud Developer', '["BTech CSE", "BTech IT"]'::jsonb, 7.00, '["React", "Node.js", "SQL", "Cloud"]'::jsonb, '["Docker", "Kubernetes"]'::jsonb, 'Full-time / Fast Track', '7.5 LPA - 11.5 LPA', 30, '2026-11-15', 'TCS Digital campus hiring for modern cloud, full-stack, and AI developers.', 'internal', 1)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Student Applications
INSERT INTO public.applications (id, student_id, requirement_id, match_score, status, applied_via, attendance_status, evaluation_score)
VALUES 
    ('app_om_tcs_01', 'prof_om_01', 'req_tcs_digital_01', 94.50, 'shortlisted', 'internal', 'present', 92.00),
    ('app_om_gsfc_01', 'prof_om_01', 'req_gsfc_chem_01', 88.00, 'applied', 'internal', 'pending', 0.00)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Fest & Campus Events
INSERT INTO public.events (id, title, event_type, date, venue, description)
VALUES 
    ('ev_anvesh_2026', 'Anvesh Tech Fest & Innovation Summit 2026', 'Technical Festival', '2026-09-25', 'GSFC University Central Auditorium & Campus Grounds', 'Annual university mega-fest featuring coding hackathons, robotics, tech expos, and cultural nights.'),
    ('ev_placement_summit', 'GSFC Annual HR & Industry Placement Summit', 'Recruitment Summit', '2026-10-10', 'School of Technology Convention Hall', 'Leadership conclave with top Fortune 500 recruiters and academic placement leadership.')
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Fest Passes
INSERT INTO public.pass_tokens (id, pass_code, event_id, guest_name, guest_email, guest_phone, college_or_org, entry_gate, valid_date, status)
VALUES 
    ('pass_guest_01', 'FEST-GSFC-2026-001', 'ev_anvesh_2026', 'Aakash Mehta', 'aakash.fest@gmail.com', '+91 98765 11223', 'MS University Baroda', 'Main Gate 1', '2026-09-25', 'active'),
    ('pass_guest_02', 'FEST-GSFC-2026-002', 'ev_anvesh_2026', 'Rhea Desai', 'rhea.d@nirmauni.ac.in', '+91 98220 55441', 'Nirma University', 'Main Gate 2', '2026-09-25', 'active')
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Security Desk Gate Logs
INSERT INTO public.entry_logs (id, gate_number, visitor_name, visitor_type, pass_or_drive_code, verified_by, status)
VALUES 
    ('log_scan_01', 'Gate 1 (Main Entrance)', 'Om Thakkar', 'Student Candidate', '24BT04171', 'Security Officer (Gate 1)', 'Granted'),
    ('log_scan_02', 'Gate 2 (Visitor Gate)', 'Aakash Mehta', 'Fest Guest Visitor', 'FEST-GSFC-2026-001', 'Security Officer (Gate 2)', 'Granted')
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Alumni Mentors
INSERT INTO public.alumni_profiles (id, user_id, name, email, batch_year, company, designation, linkedin_url, verified)
VALUES 
    ('alm_01', 'u_alumni_01', 'Priya Patel', 'priya.patel@alumni.gsfc.ac.in', '2019-2023', 'Amazon AWS', 'Senior Cloud Solutions Architect', 'https://linkedin.com/in/priya-patel', true),
    ('alm_02', NULL, 'Hardik Joshi', 'hardik.joshi@alumni.gsfc.ac.in', '2018-2022', 'Microsoft', 'Software Development Engineer II', 'https://linkedin.com/in/hardik-joshi', true)
ON CONFLICT (id) DO NOTHING;

-- 11. Insert System Notifications
INSERT INTO public.notifications_log (id, recipient_name, recipient_email, channel, notification_type, title, message, status, is_read)
VALUES 
    ('notif_01', 'Om Thakkar', '24bt04171@gsfcuniversity.ac.in', 'in_app', 'general', '🎓 Welcome to GSFC Digital Placement Portal', 'Your account credentials and student dashboard have been successfully activated.', 'sent', false),
    ('notif_02', 'Om Thakkar', '24bt04171@gsfcuniversity.ac.in', 'in_app', 'drive_alert', '💼 TCS Digital Drive Application Shortlisted', 'You have been shortlisted for the upcoming Technical Assessment round.', 'sent', false)
ON CONFLICT (id) DO NOTHING;
