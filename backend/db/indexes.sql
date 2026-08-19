-- ==============================================================================
-- ADVANCED SQLITE PERFORMANCE & B-TREE COMPOUND INDEXES
-- Optimizes query execution speed to < 2ms across hundreds of student candidates
-- ==============================================================================

-- 1. Compound Index for Applications Lookup and Duplicate Checks
CREATE INDEX IF NOT EXISTS idx_apps_student_req ON applications(student_id, requirement_id);

-- 2. Compound Index for Application Status & Chronological Sorting (Prioritizes Newly Applied)
CREATE INDEX IF NOT EXISTS idx_apps_status_applied_at ON applications(status, applied_at DESC);

-- 3. Compound Index for Student Academic Cohort & Eligibility Filtering
CREATE INDEX IF NOT EXISTS idx_students_year_cgpa ON student_profiles(passing_year, cgpa DESC);

-- 4. Index for Program & Branch Aggregations (NIRF / NAAC Metric Calculations)
CREATE INDEX IF NOT EXISTS idx_students_program_branch ON student_profiles(program, branch);

-- 5. Index for Placement Drives by Company & Status
CREATE INDEX IF NOT EXISTS idx_req_company_open ON requirements(company_id, applications_open);

-- 6. Index for Approved Recruiter Accounts
CREATE INDEX IF NOT EXISTS idx_companies_approved ON company_profiles(approved);

-- 7. Index for Notifications Log
CREATE INDEX IF NOT EXISTS idx_notif_phone_date ON notifications_log(recipient_phone, created_at DESC);
