import express from 'express';
import db from '../db/index.js';
import { calculateMatchScore } from '../ai/modules/matchingEngine.js';

const router = express.Router();

// Get Company Requirements
router.get('/requirements', (req, res) => {
  try {
    const { companyId } = req.query;
    let query = `
      SELECT r.*, c.company_name, c.logo_url, c.industry,
             (SELECT COUNT(*) FROM applications WHERE requirement_id = r.id) as applicant_count
      FROM requirements r
      JOIN company_profiles c ON r.company_id = c.id
    `;
    const params = [];
    if (companyId) {
      query += ` WHERE r.company_id = ?`;
      params.push(companyId);
    } else {
      query += ` WHERE c.approved = 1`;
    }
    query += ` ORDER BY r.created_at DESC`;

    const requirements = db.prepare(query).all(...params);
    res.json(requirements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post New Job Requirement (Admin Approval Check Enforced)
router.post('/requirements', (req, res) => {
  try {
    const { 
      company_id, title, eligible_programs, min_cgpa, 
      required_skills, preferred_skills, job_type, ctc_range, openings, deadline, job_description,
      application_type, external_apply_url, application_instructions,
      question_bank
    } = req.body;

    const company = db.prepare('SELECT * FROM company_profiles WHERE id = ?').get(company_id);
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found.' });
    }

    if (!company.approved) {
      return res.status(403).json({ 
        error: 'Your recruiter account is pending verification by TPC Admin. You cannot post job requirements until approved.' 
      });
    }

    const qBank = Array.isArray(question_bank) ? question_bank : [];
    if (qBank.length < 5) {
      return res.status(400).json({ error: 'Publishing Gated: Minimum 5 interview questions are required to publish a job drive.' });
    }

    const appType = application_type === 'external' ? 'external' : 'internal';
    let extUrl = external_apply_url ? String(external_apply_url).trim() : null;

    if (appType === 'external') {
      if (!extUrl || !extUrl.toLowerCase().startsWith('https://')) {
        return res.status(400).json({ error: 'External Application URL must be a valid link starting with https://' });
      }
    }

    const reqId = 'req_' + Date.now();
    const eligibleProgramsJson = JSON.stringify(Array.isArray(eligible_programs) ? eligible_programs : [eligible_programs]);
    const reqSkillsJson = JSON.stringify(Array.isArray(required_skills) ? required_skills : String(required_skills).split(',').map(s=>s.trim()));
    const prefSkillsJson = JSON.stringify(Array.isArray(preferred_skills) ? preferred_skills : String(preferred_skills || '').split(',').map(s=>s.trim()).filter(Boolean));
    const qBankJson = JSON.stringify(qBank);
    const qBankStatus = qBank.length >= 5 ? 'complete' : 'pending';

    db.prepare(`
      INSERT INTO requirements 
      (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, preferred_skills_json, job_type, ctc_range, openings, deadline, job_description, application_type, external_apply_url, application_instructions, question_bank_json, question_bank_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reqId, company_id, title, eligibleProgramsJson, parseFloat(min_cgpa || 0), 
      reqSkillsJson, prefSkillsJson, job_type || 'Full-time', ctc_range || 'Competitive CTC', 
      parseInt(openings || 1), deadline || '2026-12-31', job_description || '',
      appType, extUrl, application_instructions || null, qBankJson, qBankStatus
    );

    const createdReq = db.prepare('SELECT * FROM requirements WHERE id = ?').get(reqId);
    res.status(201).json({ message: 'Requirement posted successfully', requirement: createdReq });
  } catch (err) {
    console.error('Error posting requirement:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Question Bank for a Requirement (Edit / Add / Delete questions)
router.put('/requirements/:id/question-bank', (req, res) => {
  try {
    const { id } = req.params;
    const { question_bank } = req.body;

    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found.' });
    }

    const qBank = Array.isArray(question_bank) ? question_bank : [];
    const qBankJson = JSON.stringify(qBank);
    const qBankStatus = qBank.length >= 5 ? 'complete' : 'pending';

    db.prepare('UPDATE requirements SET question_bank_json = ?, question_bank_status = ? WHERE id = ?').run(qBankJson, qBankStatus, id);

    res.json({ message: 'Interview question bank updated successfully', questionBankCount: qBank.length, status: qBankStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View Ranked Shortlist of Applicants for a Requirement
router.get('/requirements/:id/applicants', (req, res) => {
  try {
    const { id } = req.params;
    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found.' });
    }

    const apps = db.prepare(`
      SELECT a.id as application_id, a.match_score, a.status, a.applied_at,
             s.id as student_id, s.name, s.program, s.branch, s.cgpa, s.resume_url, 
             s.parsed_resume_json, s.ats_score
      FROM applications a
      JOIN student_profiles s ON a.student_id = s.id
      WHERE a.requirement_id = ?
    `).all(id);

    // Compute live match score & parsed skill summaries
    const rankedApplicants = apps.map(app => {
      let parsedData = {};
      try { parsedData = JSON.parse(app.parsed_resume_json || '{}'); } catch(e){}

      const matchRes = calculateMatchScore(
        { program: app.program, cgpa: app.cgpa, name: app.name, parsed_resume_json: parsedData },
        requirement
      );

      return {
        ...app,
        matchScore: matchRes.matchScore,
        eligible: matchRes.eligible,
        reason: matchRes.reason,
        skillsSummary: parsedData.skills?.technical || [],
        parsedResume: parsedData
      };
    }).sort((a, b) => b.matchScore - a.matchScore); // Ranked highest first!

    res.json({
      requirement,
      totalApplicants: rankedApplicants.length,
      applicants: rankedApplicants
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Master Applied Candidates for a Company (Across all hiring requirements)
router.get('/all-applicants', (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required.' });
    }

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
      ORDER BY a.applied_at DESC
    `).all(companyId);

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Application Status (e.g. 'shortlisted', 'interview', 'selected', 'rejected')
router.post('/update-application-status', (req, res) => {
  try {
    const { application_id, status } = req.body;
    if (!application_id || !status) {
      return res.status(400).json({ error: 'application_id and status are required.' });
    }

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, application_id);
    res.json({ message: `Application status updated to '${status}' successfully!`, application_id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Requirement Drive
router.delete('/requirements/:id', (req, res) => {
  try {
    const reqId = req.params.id;
    // Delete associated applications first
    db.prepare('DELETE FROM applications WHERE requirement_id = ?').run(reqId);
    // Delete requirement
    db.prepare('DELETE FROM requirements WHERE id = ?').run(reqId);
    res.json({ message: 'Placement requirement drive deleted successfully.', id: reqId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Candidate Application
router.delete('/applications/:id', (req, res) => {
  try {
    const appId = req.params.id;
    db.prepare('DELETE FROM applications WHERE id = ?').run(appId);
    res.json({ message: 'Application deleted successfully.', id: appId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
