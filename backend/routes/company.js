import express from 'express';
import db from '../db/index.js';
import { calculateMatchScore } from '../ai/modules/matchingEngine.js';
import NotificationService from '../services/notificationService.js';
import appCache from '../services/cacheService.js';

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

// Post New Job Requirement (With Compulsory Logo & Contact Verification)
router.post('/requirements', (req, res) => {
  try {
    const {
      company_id, title, eligible_programs, min_cgpa,
      required_skills, preferred_skills, job_type, ctc_range, openings, deadline, job_description,
      application_type, external_apply_url, application_instructions,
      question_bank,
      company_logo_url, company_website, company_email, company_phone
    } = req.body;

    let company = db.prepare('SELECT * FROM company_profiles WHERE id = ? OR user_id = ?').get(company_id, company_id);
    if (!company) {
      const compProfileId = 'c_' + Date.now();
      db.prepare(`
        INSERT INTO company_profiles (id, user_id, company_name, logo_url, industry, website, approved, contact_email, contact_phone)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(compProfileId, company_id, 'Corporate Recruiter', company_logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100', 'Technology & Engineering', company_website || 'https://company.com', company_email || 'hr@company.com', company_phone || '+91 98765 43210');
      company = db.prepare('SELECT * FROM company_profiles WHERE id = ?').get(compProfileId);
    }

    // Validate Compulsory Fields
    if (!company_logo_url || String(company_logo_url).trim().length === 0) {
      return res.status(400).json({ error: 'Compulsory Field Required: Please upload your Official Company Logo file or logo image.' });
    }
    if (!company_website || !String(company_website).toLowerCase().startsWith('http')) {
      return res.status(400).json({ error: 'Compulsory Field Required: Valid Official Company Website URL (https://...) is required.' });
    }
    if (!company_email || !String(company_email).includes('@')) {
      return res.status(400).json({ error: 'Compulsory Field Required: Valid Corporate Recruiter Email Address is required.' });
    }
    if (!company_phone || String(company_phone).trim().length < 5) {
      return res.status(400).json({ error: 'Compulsory Field Required: Corporate Phone / Contact Number is required.' });
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

    // Update Company Master Profile with contact details
    db.prepare(`
      UPDATE company_profiles 
      SET logo_url = ?, website = ?, contact_email = ?, contact_phone = ?
      WHERE id = ?
    `).run(company_logo_url, company_website, company_email, company_phone, company.id);

    const reqId = 'req_' + Date.now();
    const eligibleProgramsJson = JSON.stringify(Array.isArray(eligible_programs) ? eligible_programs : [eligible_programs]);
    const reqSkillsJson = JSON.stringify(Array.isArray(required_skills) ? required_skills : String(required_skills).split(',').map(s => s.trim()));
    const prefSkillsJson = JSON.stringify(Array.isArray(preferred_skills) ? preferred_skills : String(preferred_skills || '').split(',').map(s => s.trim()).filter(Boolean));
    const qBankJson = JSON.stringify(qBank);
    const qBankStatus = qBank.length >= 5 ? 'complete' : 'pending';

    db.prepare(`
      INSERT INTO requirements 
      (id, company_id, title, eligible_programs_json, min_cgpa, required_skills_json, preferred_skills_json, job_type, ctc_range, openings, deadline, job_description, application_type, external_apply_url, application_instructions, question_bank_json, question_bank_status, company_logo_url, company_website, company_email, company_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reqId, company.id, title, eligibleProgramsJson, parseFloat(min_cgpa || 0),
      reqSkillsJson, prefSkillsJson, job_type || 'Full-time', ctc_range || 'Competitive CTC',
      parseInt(openings || 1), deadline || '2026-12-31', job_description || '',
      appType, extUrl, application_instructions || null, qBankJson, qBankStatus,
      company_logo_url, company_website, company_email, company_phone
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
  const { id } = req.params;
  const { question_bank } = req.body;
  const qBank = Array.isArray(question_bank) ? question_bank : [];
  const qBankJson = JSON.stringify(qBank);
  const qBankStatus = qBank.length >= 5 ? 'complete' : 'pending';

  db.prepare('UPDATE requirements SET question_bank_json = ?, question_bank_status = ? WHERE id = ?').run(qBankJson, qBankStatus, id);
  res.json({ message: 'Question bank updated', id });
});

// Edit / Update Existing Requirement Drive (Recruiter Authority)
router.put('/requirements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, eligible_programs, min_cgpa,
      required_skills, preferred_skills, job_type, ctc_range, openings, deadline, job_description,
      application_type, external_apply_url, application_instructions,
      question_bank,
      company_logo_url, company_website, company_email, company_phone
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
          question_bank_json = ?, question_bank_status = ?,
          company_logo_url = COALESCE(?, company_logo_url),
          company_website = COALESCE(?, company_website),
          company_email = COALESCE(?, company_email),
          company_phone = COALESCE(?, company_phone)
      WHERE id = ?
    `).run(
      title, eligibleProgramsJson, parseFloat(min_cgpa || 0),
      reqSkillsJson, prefSkillsJson, job_type, ctc_range, parseInt(openings || 1),
      deadline, job_description, appType, extUrl, application_instructions || '',
      qBankJson, qBankStatus,
      company_logo_url || null, company_website || null, company_email || null, company_phone || null,
      id
    );

    const updated = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
    res.json({ message: 'Requirement drive updated successfully!', requirement: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Accepting Applications on a Requirement (Stop / Reopen)
router.all('/requirements/:id/toggle-applications', (req, res) => {
  try {
    const { id } = req.params;
    const reqItem = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
    if (!reqItem) {
      return res.status(404).json({ error: 'Requirement drive not found.' });
    }

    const currentOpen = reqItem.applications_open !== undefined ? reqItem.applications_open : 1;
    const newStatus = currentOpen === 1 ? 0 : 1;

    db.prepare('UPDATE requirements SET applications_open = ? WHERE id = ?').run(newStatus, id);

    const updated = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
    res.json({
      message: newStatus === 1 ? 'Applications reopened successfully!' : 'Applications closed successfully! Students can no longer apply.',
      requirement: updated,
      applications_open: newStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Candidate Attendance Status (Present / Absent / Pending)
router.all('/applications/:id/attendance', (req, res) => {
  try {
    const { id } = req.params;
    const { attendance_status } = req.body || req.query;

    if (!attendance_status || !['present', 'absent', 'pending'].includes(attendance_status)) {
      return res.status(400).json({ error: "Invalid attendance_status. Must be 'present', 'absent', or 'pending'." });
    }

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    db.prepare('UPDATE applications SET attendance_status = ? WHERE id = ?').run(attendance_status, id);

    res.json({
      message: `Attendance marked as '${attendance_status}' successfully!`,
      application_id: id,
      attendance_status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Save All Candidate Attendance & Status Records
router.all(['/applications/bulk-save-attendance', '/bulk-save-attendance'], (req, res) => {
  try {
    const { updates } = req.body || {};
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required.' });
    }

    const updateStmt = db.prepare(`
      UPDATE applications 
      SET attendance_status = COALESCE(?, attendance_status),
          status = COALESCE(?, status),
          evaluation_notes = COALESCE(?, evaluation_notes),
          evaluation_score = COALESCE(?, evaluation_score)
      WHERE id = ?
    `);

    const saveTransaction = db.transaction((rows) => {
      for (const item of rows) {
        const appId = item.application_id || item.id;
        if (appId) {
          let cleanStatus = item.status || null;
          if (cleanStatus === 'newly_applied') cleanStatus = 'applied';
          updateStmt.run(item.attendance_status || null, cleanStatus, item.evaluation_notes || null, item.evaluation_score !== undefined ? item.evaluation_score : null, appId);
        }
      }
    });

    saveTransaction(updates);

    res.json({
      success: true,
      message: `Successfully saved all ${updates.length} candidate attendance and evaluation records to database!`,
      count: updates.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Single Candidate Evaluation (Attendance, Status, Notes, Interview Score)
router.post('/applications/:id/update-evaluation', (req, res) => {
  try {
    const { id } = req.params;
    const { attendance_status, status, evaluation_notes, evaluation_score } = req.body;

    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    if (!app) {
      return res.status(404).json({ error: 'Application record not found.' });
    }

    let cleanStatus = status || app.status;
    if (cleanStatus === 'newly_applied') cleanStatus = 'applied';

    db.prepare(`
      UPDATE applications 
      SET attendance_status = COALESCE(?, attendance_status),
          status = COALESCE(?, status),
          evaluation_notes = COALESCE(?, evaluation_notes),
          evaluation_score = COALESCE(?, evaluation_score)
      WHERE id = ?
    `).run(
      attendance_status || app.attendance_status,
      cleanStatus,
      evaluation_notes !== undefined ? evaluation_notes : app.evaluation_notes,
      evaluation_score !== undefined ? evaluation_score : app.evaluation_score,
      id
    );

    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Candidate evaluation and attendance updated successfully!',
      application: updated
    });
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
      SELECT a.id as application_id, a.match_score, a.status, a.applied_at, a.applied_via,
             COALESCE(a.attendance_status, 'pending') as attendance_status,
             COALESCE(a.evaluation_notes, '') as evaluation_notes,
             COALESCE(a.evaluation_score, 0) as evaluation_score,
             s.id as student_id, s.name, s.name as candidate_name, s.roll_number, s.program, s.branch, s.cgpa, 
             COALESCE(s.phone, '+91 98765 43210') as phone,
             COALESCE(s.phone, '+91 98765 43210') as candidate_phone,
             s.resume_url, s.parsed_resume_json, s.ats_score, u.email as candidate_email
      FROM applications a
      JOIN student_profiles s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
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
        matchScore: app.match_score || matchRes.matchScore,
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

    const rawApps = db.prepare(`
      SELECT a.id as application_id, a.match_score, a.status, a.applied_at, a.applied_via,
             COALESCE(a.attendance_status, 'pending') as attendance_status,
             COALESCE(a.evaluation_notes, '') as evaluation_notes,
             COALESCE(a.evaluation_score, 0) as evaluation_score,
             r.id as requirement_id, r.title as job_title, r.ctc_range, r.job_type, 
             r.eligible_programs_json, r.min_cgpa, r.required_skills_json, r.preferred_skills_json, 
             r.job_description, r.applications_open,
             s.id as student_id, s.name as candidate_name, s.roll_number, s.program, s.branch, s.cgpa, 
             COALESCE(s.phone, '+91 98765 43210') as phone,
             COALESCE(s.phone, '+91 98765 43210') as candidate_phone,
             s.resume_url, s.parsed_resume_json, s.ats_score, u.email as candidate_email
      FROM applications a
      JOIN requirements r ON a.requirement_id = r.id
      JOIN student_profiles s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE r.company_id = ?
      ORDER BY a.applied_at DESC
    `).all(companyId);

    const mappedApps = rawApps.map(app => {
      const requirement = {
        title: app.job_title,
        eligible_programs_json: app.eligible_programs_json,
        min_cgpa: app.min_cgpa,
        required_skills_json: app.required_skills_json,
        preferred_skills_json: app.preferred_skills_json,
        job_description: app.job_description
      };

      const student = {
        name: app.candidate_name,
        program: app.program,
        branch: app.branch,
        cgpa: app.cgpa,
        parsed_resume_json: app.parsed_resume_json
      };

      const matchRes = calculateMatchScore(student, requirement);

      return {
        ...app,
        matchScore: app.match_score || matchRes.matchScore,
        eligible: matchRes.eligible,
        matchedSkills: matchRes.matchedSkills,
        missingSkills: matchRes.missingSkills,
        strengthSummary: matchRes.strengthSummary,
        improvementTips: matchRes.improvementTips
      };
    });

    res.json(mappedApps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Application Status (e.g. 'applied', 'shortlisted', 'interview', 'selected', 'rejected')
router.post('/update-application-status', (req, res) => {
  try {
    let { application_id, status } = req.body;
    if (!application_id || !status) {
      return res.status(400).json({ error: 'application_id and status are required.' });
    }

    if (status === 'newly_applied') {
      status = 'applied';
    }

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, application_id);

    // Invalidate caches
    appCache.invalidate('accreditation');
    appCache.invalidate('analytics');

    // Fetch context for automated notification
    const appInfo = db.prepare(`
      SELECT r.title as job_title, c.company_name
      FROM applications a
      JOIN requirements r ON a.requirement_id = r.id
      JOIN company_profiles c ON r.company_id = c.id
      WHERE a.id = ?
    `).get(application_id);

    // Trigger Automated Email / WhatsApp Notification
    NotificationService.notifyApplicationStatusChange(
      application_id,
      status,
      appInfo?.company_name || 'Hiring Partner',
      appInfo?.job_title || 'Placement Drive'
    ).catch(err => console.error('Notification dispatch error:', err));

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
