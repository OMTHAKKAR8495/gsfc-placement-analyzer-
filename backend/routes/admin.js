import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Pending Company Approval List
router.get('/pending-companies', (req, res) => {
  try {
    const pending = db.prepare(`
      SELECT c.*, u.email, u.created_at as user_registered_at
      FROM company_profiles c
      JOIN users u ON c.user_id = u.id
      WHERE c.approved = 0
      ORDER BY u.created_at DESC
    `).all();

    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All Student Candidate Profiles Database (Supports Year Range & Multi-Year Selection)
router.get('/students', (req, res) => {
  try {
    const { startYear, endYear, years, passingYear, admissionYear, program, search } = req.query;

    let query = `
      SELECT s.*, u.email
      FROM student_profiles s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (years) {
      const yearArr = years.split(',').map(y => parseInt(y.trim(), 10)).filter(y => !isNaN(y));
      if (yearArr.length > 0) {
        const placeholders = yearArr.map(() => '?').join(',');
        query += ` AND (s.passing_year IN (${placeholders}) OR s.admission_year IN (${placeholders}))`;
        params.push(...yearArr, ...yearArr);
      }
    } else {
      if (startYear) {
        query += ` AND (COALESCE(s.passing_year, 2026) >= ? OR COALESCE(s.admission_year, 2022) >= ?)`;
        params.push(parseInt(startYear, 10), parseInt(startYear, 10));
      }
      if (endYear) {
        query += ` AND (COALESCE(s.passing_year, 2026) <= ? OR COALESCE(s.admission_year, 2022) <= ?)`;
        params.push(parseInt(endYear, 10), parseInt(endYear, 10));
      }
      if (passingYear) {
        query += ` AND s.passing_year = ?`;
        params.push(parseInt(passingYear, 10));
      }
      if (admissionYear) {
        query += ` AND s.admission_year = ?`;
        params.push(parseInt(admissionYear, 10));
      }
    }

    if (program && program !== 'All') {
      query += ` AND s.program LIKE ?`;
      params.push(`%${program}%`);
    }

    if (search && search.trim()) {
      const sTerm = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(s.name) LIKE ? OR LOWER(s.roll_number) LIKE ? OR LOWER(s.program) LIKE ? OR LOWER(s.branch) LIKE ?)`;
      params.push(sTerm, sTerm, sTerm, sTerm);
    }

    query += ` ORDER BY s.passing_year DESC, s.cgpa DESC`;

    const students = db.prepare(query).all(...params);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve or Reject Company
router.post('/approve-company', (req, res) => {
  try {
    const { company_id, action } = req.body; // action: 'approve' or 'reject'
    if (!company_id || !action) {
      return res.status(400).json({ error: 'company_id and action required.' });
    }

    if (action === 'approve') {
      db.prepare('UPDATE company_profiles SET approved = 1 WHERE id = ?').run(company_id);
      return res.json({ message: 'Company account approved! Recruiter can now post hiring requirements.' });
    } else {
      const company = db.prepare('SELECT user_id FROM company_profiles WHERE id = ?').get(company_id);
      if (company) {
        db.prepare('DELETE FROM company_profiles WHERE id = ?').run(company_id);
        db.prepare('DELETE FROM users WHERE id = ?').run(company.user_id);
      }
      return res.json({ message: 'Company registration rejected and removed.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove / Delete Company Profile & Associated Drives (Admin Manager Authority)
router.delete('/companies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const company = db.prepare('SELECT user_id FROM company_profiles WHERE id = ?').get(id);
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found.' });
    }

    // Cascade delete associated applications and requirements
    const reqs = db.prepare('SELECT id FROM requirements WHERE company_id = ?').all(id);
    for (const r of reqs) {
      db.prepare('DELETE FROM applications WHERE requirement_id = ?').run(r.id);
    }
    db.prepare('DELETE FROM requirements WHERE company_id = ?').run(id);

    // Delete company profile and user account
    db.prepare('DELETE FROM company_profiles WHERE id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(company.user_id);

    res.json({ message: 'Company account and associated placement drives deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove / Delete Single Placement Drive Requirement (Admin Authority)
router.delete('/requirements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const reqItem = db.prepare('SELECT title, company_id FROM requirements WHERE id = ?').get(id);
    if (!reqItem) {
      return res.status(404).json({ error: 'Placement drive requirement not found.' });
    }

    // Cascade delete applications for this drive
    db.prepare('DELETE FROM applications WHERE requirement_id = ?').run(id);
    db.prepare('DELETE FROM requirements WHERE id = ?').run(id);

    res.json({ message: `Placement drive "${reqItem.title}" deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comprehensive TPC Placement Dashboard Analytics (With Year-Wise Batch Distribution)
router.get('/analytics', (req, res) => {
  try {
    const totalRequirements = db.prepare('SELECT COUNT(*) as count FROM requirements').get().count;
    const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM company_profiles WHERE approved = 1').get().count;
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM student_profiles').get().count;

    // Sector-wise breakdown
    const sectorStats = db.prepare(`
      SELECT industry, COUNT(*) as count 
      FROM company_profiles 
      WHERE approved = 1 
      GROUP BY industry
    `).all();

    // Application Status Funnel
    const funnelStats = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM applications 
      GROUP BY status
    `).all();

    // Program Placement Distribution
    const programStats = db.prepare(`
      SELECT s.program, COUNT(a.id) as total_applications,
             SUM(CASE WHEN a.status IN ('interview', 'selected') THEN 1 ELSE 0 END) as shortlisted_or_placed
      FROM student_profiles s
      LEFT JOIN applications a ON s.id = a.student_id
      GROUP BY s.program
    `).all();

    // Year-wise / Batch Placement Analytics Breakdown
    const yearStats = db.prepare(`
      SELECT 
        COALESCE(s.passing_year, 2026) as passing_year,
        COALESCE(s.batch_year, '2022-2026') as batch_year,
        COUNT(DISTINCT s.id) as total_students,
        ROUND(AVG(s.cgpa), 2) as avg_cgpa,
        ROUND(AVG(s.ats_score), 1) as avg_ats_score,
        COUNT(DISTINCT a.id) as total_applications,
        SUM(CASE WHEN a.status IN ('interview', 'selected') THEN 1 ELSE 0 END) as placed_or_interviewed
      FROM student_profiles s
      LEFT JOIN applications a ON s.id = a.student_id
      GROUP BY s.passing_year
      ORDER BY s.passing_year ASC
    `).all();

    // Top In-Demand Skills across postings
    const requirements = db.prepare('SELECT required_skills_json FROM requirements').all();
    const skillCounts = {};

    requirements.forEach(r => {
      let skills = [];
      try { skills = JSON.parse(r.required_skills_json || '[]'); } catch(e){}
      skills.forEach(s => {
        const cleanSkill = s.trim();
        if (cleanSkill) {
          skillCounts[cleanSkill] = (skillCounts[cleanSkill] || 0) + 1;
        }
      });
    });

    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      totalRequirements,
      totalApplications,
      totalCompanies,
      totalStudents,
      sectorStats,
      funnelStats,
      programStats,
      yearStats,
      topSkills
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Export for Placement Accreditation (Supports Year Range Filtering)
router.get('/export-report', (req, res) => {
  try {
    const { startYear, endYear, years } = req.query;

    let query = `
      SELECT a.id as application_id, s.roll_number, s.name as student_name, s.program, s.branch, s.cgpa,
             s.admission_year, s.passing_year, s.batch_year,
             c.company_name, r.title as job_title, r.ctc_range, a.match_score, a.status, a.applied_at
      FROM applications a
      JOIN student_profiles s ON a.student_id = s.id
      JOIN requirements r ON a.requirement_id = r.id
      JOIN company_profiles c ON r.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (years) {
      const yearArr = years.split(',').map(y => parseInt(y.trim(), 10)).filter(y => !isNaN(y));
      if (yearArr.length > 0) {
        const placeholders = yearArr.map(() => '?').join(',');
        query += ` AND (s.passing_year IN (${placeholders}) OR s.admission_year IN (${placeholders}))`;
        params.push(...yearArr, ...yearArr);
      }
    } else {
      if (startYear) {
        query += ` AND (COALESCE(s.passing_year, 2026) >= ? OR COALESCE(s.admission_year, 2022) >= ?)`;
        params.push(parseInt(startYear, 10), parseInt(startYear, 10));
      }
      if (endYear) {
        query += ` AND (COALESCE(s.passing_year, 2026) <= ? OR COALESCE(s.admission_year, 2022) <= ?)`;
        params.push(parseInt(endYear, 10), parseInt(endYear, 10));
      }
    }

    query += ` ORDER BY s.passing_year DESC, a.applied_at DESC`;

    const apps = db.prepare(query).all(...params);

    let csvContent = 'Application ID,Roll Number,Student Name,Batch,Passing Year,Program,Branch,CGPA,Company,Job Title,CTC,AI Match Score %,Status,Applied At\n';
    apps.forEach(a => {
      csvContent += `"${a.application_id}","${a.roll_number}","${a.student_name}","${a.batch_year || ''}",${a.passing_year || ''},"${a.program}","${a.branch}",${a.cgpa},"${a.company_name}","${a.job_title}","${a.ctc_range}",${a.match_score},"${a.status}","${a.applied_at}"\n`;
    });

    const fileSuffix = startYear && endYear ? `${startYear}_${endYear}` : 'All_Years';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="GSFC_Placement_Report_${fileSuffix}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global Search across Candidates, Companies, Requirements
router.get('/global-search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ students: [], companies: [], requirements: [] });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;

    const students = db.prepare(`
      SELECT s.*, u.email
      FROM student_profiles s
      JOIN users u ON s.user_id = u.id
      WHERE LOWER(s.name) LIKE ? OR LOWER(s.roll_number) LIKE ? OR LOWER(s.program) LIKE ?
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm);

    const companies = db.prepare(`
      SELECT c.*, u.email
      FROM company_profiles c
      JOIN users u ON c.user_id = u.id
      WHERE LOWER(c.company_name) LIKE ? OR LOWER(c.industry) LIKE ?
      LIMIT 10
    `).all(searchTerm, searchTerm);

    const requirements = db.prepare(`
      SELECT r.*, c.company_name
      FROM requirements r
      JOIN company_profiles c ON r.company_id = c.id
      WHERE LOWER(r.title) LIKE ? OR LOWER(c.company_name) LIKE ?
      LIMIT 10
    `).all(searchTerm, searchTerm);

    res.json({ students, companies, requirements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Inspection Audit Logging Endpoint (Section 2 Requirement)
router.post('/audit-log', (req, res) => {
  try {
    const { admin_id, viewed_entity_type, viewed_entity_id } = req.body;
    if (!viewed_entity_type || !viewed_entity_id) {
      return res.status(400).json({ error: 'viewed_entity_type and viewed_entity_id required.' });
    }

    const logId = 'log_' + Date.now();
    db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_id, viewed_entity_type, viewed_entity_id)
      VALUES (?, ?, ?, ?)
    `).run(logId, admin_id || 'u_admin_01', viewed_entity_type, viewed_entity_id);

    res.json({ success: true, logId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TPC Admin Cross-View: Get Any Company's Full Applicant Inbox with Audit Trail
router.get('/company-applicant-inbox', (req, res) => {
  try {
    const { companyId, adminId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required.' });

    // Audit Log
    const logId = 'log_' + Date.now();
    db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_id, viewed_entity_type, viewed_entity_id)
      VALUES (?, ?, 'company', ?)
    `).run(logId, adminId || 'u_admin_01', companyId);

    const apps = db.prepare(`
      SELECT a.id as application_id, a.match_score, a.status, a.applied_at, a.applied_via,
             r.id as requirement_id, r.title as job_title, r.ctc_range, r.job_type,
             s.id as student_id, s.name as candidate_name, s.program, s.branch, s.cgpa, 
             s.resume_url, s.parsed_resume_json, s.ats_score, u.email as candidate_email
      FROM applications a
      JOIN requirements r ON a.requirement_id = r.id
      JOIN student_profiles s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE r.company_id = ?
      ORDER BY a.match_score DESC, a.applied_at DESC
    `).all(companyId);

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TPC Admin Cross-View: Get Any Student's Full Applications across all Companies
router.get('/student-applications', (req, res) => {
  try {
    const { studentId, adminId } = req.query;
    if (!studentId) return res.status(400).json({ error: 'studentId is required.' });

    // Audit Log
    const logId = 'log_' + Date.now();
    db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_id, viewed_entity_type, viewed_entity_id)
      VALUES (?, ?, 'student', ?)
    `).run(logId, adminId || 'u_admin_01', studentId);

    const apps = db.prepare(`
      SELECT a.id as application_id, a.match_score, a.status, a.applied_at, a.applied_via,
             r.id as requirement_id, r.title as job_title, r.ctc_range, c.company_name, c.logo_url
      FROM applications a
      JOIN requirements r ON a.requirement_id = r.id
      JOIN company_profiles c ON r.company_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.applied_at DESC
    `).all(studentId);

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Master Visibility: Get All Registered Companies (Approved + Pending)
router.get('/all-companies', (req, res) => {
  try {
    const companies = db.prepare(`
      SELECT c.*, u.email,
             (SELECT COUNT(*) FROM requirements WHERE company_id = c.id) as posted_drives_count
      FROM company_profiles c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Master Visibility: Get All Posted Placement Requirements
router.get('/all-requirements', (req, res) => {
  try {
    const reqs = db.prepare(`
      SELECT r.*, c.company_name, c.logo_url, c.approved as company_approved,
             (SELECT COUNT(*) FROM applications WHERE requirement_id = r.id) as total_applicants
      FROM requirements r
      JOIN company_profiles c ON r.company_id = c.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(reqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Master Visibility: Get All Student Job Applications
router.get('/all-applications', (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT a.id as application_id, a.match_score, a.status, a.applied_at, a.applied_via,
             s.id as student_id, s.name as student_name, s.roll_number, s.program, s.branch, s.cgpa, s.ats_score,
             r.title as job_title, r.ctc_range, c.company_name, c.logo_url
      FROM applications a
      JOIN student_profiles s ON a.student_id = s.id
      JOIN requirements r ON a.requirement_id = r.id
      JOIN company_profiles c ON r.company_id = c.id
      ORDER BY a.applied_at DESC
    `).all();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
