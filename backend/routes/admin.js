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

// Comprehensive TPC Placement Dashboard Analytics
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
      topSkills
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Export for Placement Accreditation
router.get('/export-report', (req, res) => {
  try {
    const apps = db.prepare(`
      SELECT a.id as application_id, s.roll_number, s.name as student_name, s.program, s.branch, s.cgpa,
             c.company_name, r.title as job_title, r.ctc_range, a.match_score, a.status, a.applied_at
      FROM applications a
      JOIN student_profiles s ON a.student_id = s.id
      JOIN requirements r ON a.requirement_id = r.id
      JOIN company_profiles c ON r.company_id = c.id
      ORDER BY a.applied_at DESC
    `).all();

    let csvContent = 'Application ID,Roll Number,Student Name,Program,Branch,CGPA,Company,Job Title,CTC,AI Match Score %,Status,Applied At\n';
    apps.forEach(a => {
      csvContent += `"${a.application_id}","${a.roll_number}","${a.student_name}","${a.program}","${a.branch}",${a.cgpa},"${a.company_name}","${a.job_title}","${a.ctc_range}",${a.match_score},"${a.status}","${a.applied_at}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="CampusHire_Placement_Report_2026.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
