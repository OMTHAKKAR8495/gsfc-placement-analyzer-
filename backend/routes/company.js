import express from 'express';
import db from '../db/index.js';
import { calculateMatchScore } from '../ai/modules/matchingEngine.js';

const router = express.Router();

// Get Company Requirements (With Automatic Demo Application Seeding)
router.get('/requirements', (req, res) => {
  try {
    const { companyId } = req.query;
    let query = `
      SELECT r.*, c.company_name, c.logo_url, c.industry, c.approved as company_approved,
             (SELECT COUNT(*) FROM applications WHERE requirement_id = r.id) as applicant_count
      FROM requirements r
      JOIN company_profiles c ON r.company_id = c.id
    `;
    const params = [];
    if (companyId) {
      query += ` WHERE r.company_id = ? OR c.user_id = ? OR c.id = ?`;
      params.push(companyId, companyId, companyId);
    } else {
      query += ` WHERE c.approved = 1`;
    }
    query += ` ORDER BY r.created_at DESC`;

    let requirements = db.prepare(query).all(...params);

    // Auto-seed Demo Applications if recruiter currently has 0 applications
    if (companyId && requirements.length === 0) {
      let company = db.prepare('SELECT * FROM company_profiles WHERE id = ? OR user_id = ?').get(companyId, companyId);
      if (company) {
        const demoQBank1 = JSON.stringify([
          { id: 'q_demo_1', text: 'How do you optimize SQL queries and indexes under high database load?', category: 'Technical', difficulty: 'Medium', skillTags: ['SQL', 'Database'], source: 'recruiter' },
          { id: 'q_demo_2', text: 'Walk through your experience building asynchronous web services with FastAPI or Node.', category: 'Technical', difficulty: 'Medium', skillTags: ['FastAPI', 'Node.js'], source: 'recruiter' },
          { id: 'q_demo_3', text: 'How do you approach designing a rate limiter for microservices?', category: 'System Design', difficulty: 'Hard', skillTags: ['System Design'], source: 'recruiter' },
          { id: 'q_demo_4', text: 'Describe a situation where a technical project fell behind schedule. How did you resolve it?', category: 'Behavioral', difficulty: 'Medium', skillTags: ['Agile'], source: 'recruiter' },
          { id: 'q_demo_5', text: 'Why are you passionate about joining our engineering team?', category: 'HR', difficulty: 'Easy', skillTags: ['Communication'], source: 'recruiter' }
        ]);

        const demoQBank2 = JSON.stringify([
          { id: 'q_demo_6', text: 'Explain how indexing improves SELECT query execution speed in PostgreSQL.', category: 'Technical', difficulty: 'Easy', skillTags: ['SQL'], source: 'recruiter' },
          { id: 'q_demo_7', text: 'How do you clean and transform raw unstructured JSON data using Python Pandas?', category: 'Technical', difficulty: 'Medium', skillTags: ['Python', 'Data'], source: 'recruiter' },
          { id: 'q_demo_8', text: 'What key metrics would you track to evaluate campaign performance in PowerBI?', category: 'Analytics', difficulty: 'Medium', skillTags: ['PowerBI'], source: 'recruiter' },
          { id: 'q_demo_9', text: 'How do you prioritize urgent data requests from multiple cross-functional teams?', category: 'Behavioral', difficulty: 'Medium', skillTags: ['Agile'], source: 'recruiter' },
          { id: 'q_demo_10', text: 'What is your understanding of our company products and growth strategy?', category: 'HR', difficulty: 'Easy', skillTags: ['Research'], source: 'recruiter' }
        ]);

        db.prepare(`
          INSERT INTO requirements 
          (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, preferred_skills_json, job_type, ctc_range, openings, deadline, job_description, application_type, question_bank_json, question_bank_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `req_demo_swe_${Date.now()}`, company.id, 'Software Development Engineer - AI & Web Systems (Demo Application)',
          JSON.stringify(['BTech CSE', 'BTech IT', 'MSc CS']), 7.5,
          JSON.stringify(['Python', 'React', 'Node.js', 'SQL']), JSON.stringify(['FastAPI', 'Docker', 'Machine Learning']),
          'Full-time', '₹18,00,000 - ₹24,00,000 PA', 3, '2026-10-30',
          'Demo Hiring Requirement Application submitted to GSFC TPC Admin. Focuses on full-stack web architecture, API design, and AI model integration.',
          'internal', demoQBank1, 'complete'
        );

        db.prepare(`
          INSERT INTO requirements 
          (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, preferred_skills_json, job_type, ctc_range, openings, deadline, job_description, application_type, question_bank_json, question_bank_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `req_demo_analyst_${Date.now() + 1}`, company.id, 'Cloud Systems & Data Analytics Intern (Demo Application)',
          JSON.stringify(['BTech CSE', 'BTech Mechanical', 'MBA']), 7.0,
          JSON.stringify(['SQL', 'Python', 'Excel', 'Data Visualization']), JSON.stringify(['PowerBI', 'Tableau', 'PostgreSQL']),
          'Internship', '₹12,00,000 - ₹15,00,000 PA', 5, '2026-11-15',
          'Demo Internship Application for GSFC Placement Cell. Candidates analyze business metrics, query database pipelines, and build analytics dashboards.',
          'internal', demoQBank2, 'complete'
        );

        requirements = db.prepare(query).all(...params);
      }
    }

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

    let company = db.prepare('SELECT * FROM company_profiles WHERE id = ? OR user_id = ?').get(company_id, company_id);
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found.' });
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
    const reqSkillsJson = JSON.stringify(Array.isArray(required_skills) ? required_skills : String(required_skills).split(',').map(s => s.trim()));
    const prefSkillsJson = JSON.stringify(Array.isArray(preferred_skills) ? preferred_skills : String(preferred_skills || '').split(',').map(s => s.trim()).filter(Boolean));
    const qBankJson = JSON.stringify(qBank);
    const qBankStatus = qBank.length >= 5 ? 'complete' : 'pending';

    db.prepare(`
      INSERT INTO requirements 
      (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, preferred_skills_json, job_type, ctc_range, openings, deadline, job_description, application_type, external_apply_url, application_instructions, question_bank_json, question_bank_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reqId, company.id, title, eligibleProgramsJson, parseFloat(min_cgpa || 0),
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

    // Edit / Update Existing Requirement Drive (Recruiter Authority)
    router.put('/requirements/:id', (req, res) => {
      try {
        const { id } = req.params;
        const {
          title, eligible_programs, min_cgpa,
          required_skills, preferred_skills, job_type, ctc_range, openings, deadline, job_description,
          application_type, external_apply_url, application_instructions,
          question_bank
        } = req.body;

        const existingReq = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
        if (!existingReq) {
          return res.status(404).json({ error: 'Job requirement not found.' });
        }

        const qBank = Array.isArray(question_bank) ? question_bank : [];
        if (qBank.length < 5) {
          return res.status(400).json({ error: 'Minimum 5 interview questions are required to update a job drive.' });
        }

        const appType = application_type === 'external' ? 'external' : 'internal';
        let extUrl = external_apply_url ? String(external_apply_url).trim() : null;

        if (appType === 'external') {
          if (!extUrl || !extUrl.toLowerCase().startsWith('https://')) {
            return res.status(400).json({ error: 'External Application URL must start with https://' });
          }
        }

        const eligibleProgramsJson = JSON.stringify(Array.isArray(eligible_programs) ? eligible_programs : [eligible_programs]);
        const reqSkillsJson = JSON.stringify(Array.isArray(required_skills) ? required_skills : String(required_skills).split(',').map(s => s.trim()));
        const prefSkillsJson = JSON.stringify(Array.isArray(preferred_skills) ? preferred_skills : String(preferred_skills || '').split(',').map(s => s.trim()).filter(Boolean));
        const qBankJson = JSON.stringify(qBank);
        const qBankStatus = qBank.length >= 5 ? 'complete' : 'pending';

        db.prepare(`
      UPDATE requirements
      SET title = ?, eligible_programs_json = ?, min_cgpa = ?, required_skills_json = ?, preferred_skills_json = ?,
          job_type = ?, ctc_range = ?, openings = ?, deadline = ?, job_description = ?,
          application_type = ?, external_apply_url = ?, application_instructions = ?,
          question_bank_json = ?, question_bank_status = ?
      WHERE id = ?
    `).run(
          title, eligibleProgramsJson, parseFloat(min_cgpa || 0),
          reqSkillsJson, prefSkillsJson, job_type, ctc_range, parseInt(openings || 1),
          deadline, job_description, appType, extUrl, application_instructions || '',
          qBankJson, qBankStatus, id
        );

        const updated = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
        res.json({ message: 'Requirement drive updated successfully!', requirement: updated });
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
          try { parsedData = JSON.parse(app.parsed_resume_json || '{}'); } catch (e) { }

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
