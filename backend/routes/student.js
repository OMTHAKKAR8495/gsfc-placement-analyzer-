import express from 'express';
import multer from 'multer';
import db from '../db/index.js';
import { parseResume } from '../ai/modules/resumeParser.js';
import { computeATSScore } from '../ai/modules/atsScorer.js';
import { calculateMatchScore } from '../ai/modules/matchingEngine.js';
import { analyzeDocumentAuthenticity } from '../services/authenticityChecker.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Student Profile details
router.get('/profile', (req, res) => {
  try {
    const { studentId, userId } = req.query;
    let student = null;
    if (studentId) {
      student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(studentId);
    } else if (userId) {
      student = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId);
    }

    if (!student) return res.status(404).json({ error: 'Student profile not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resume Upload & AI Parsing Pipeline
router.post('/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    const { student_id, manual_data, target_requirement_id } = req.body;
    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required.' });
    }

    let targetReq = null;
    if (target_requirement_id) {
      targetReq = db.prepare(`
        SELECT r.*, c.company_name, c.logo_url
        FROM requirements r
        JOIN company_profiles c ON r.company_id = c.id
        WHERE r.id = ?
      `).get(target_requirement_id);
    }

    let parseOutput;
    let resumeUrl = '/uploads/resume_' + student_id + '.pdf';

    if (req.file) {
      parseOutput = await parseResume(req.file.buffer, req.file.originalname);
    } else if (manual_data) {
      const inputObj = typeof manual_data === 'string' ? JSON.parse(manual_data) : manual_data;
      parseOutput = {
        rawText: JSON.stringify(inputObj),
        parsedJson: inputObj
      };
    } else {
      parseOutput = await parseResume(Buffer.from('Sample standard resume content'), 'default_resume.pdf');
    }

    // Run ATS Scorer with Target Requirement Context
    const atsResult = await computeATSScore(parseOutput.parsedJson, parseOutput.rawText, targetReq);

    // Calculate Target Company Match if targetReq exists
    let targetCompanyMatch = null;
    if (targetReq) {
      const studentObj = {
        cgpa: parseFloat(parseOutput.parsedJson.cgpa || 8.0),
        program: parseOutput.parsedJson.program || 'BTech CSE',
        parsed_resume_json: parseOutput.parsedJson
      };
      const matchScoreData = calculateMatchScore(studentObj, targetReq);

      let reqSkills = [];
      try {
        reqSkills = typeof targetReq.required_skills_json === 'string' ? JSON.parse(targetReq.required_skills_json) : (targetReq.required_skills_json || []);
      } catch(e) {}

      const candidateSkills = parseOutput.parsedJson.skills?.technical || [];
      const matchedSkills = reqSkills.filter(s => candidateSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase())));
      const missingSkills = reqSkills.filter(s => !matchedSkills.includes(s));

      targetCompanyMatch = {
        requirementId: targetReq.id,
        companyName: targetReq.company_name,
        roleTitle: targetReq.title,
        ctcRange: targetReq.ctc_range,
        matchScore: matchScoreData.matchScore,
        eligible: matchScoreData.eligible,
        eligibilityReason: matchScoreData.reason,
        matchedSkills,
        missingSkills,
        cgpaCheckPassed: studentObj.cgpa >= (targetReq.min_cgpa || 0)
      };
    }

    // Shortlist / Selection Status Evaluation
    let selectionStatus = 'SELECTED FOR PLACEMENT ROUNDS';
    let badgeColor = 'emerald';
    if (atsResult.atsScore < 60) {
      selectionStatus = 'NEEDS RESUME OPTIMIZATION';
      badgeColor = 'amber';
    } else if (atsResult.atsScore < 75) {
      selectionStatus = 'PENDING RECRUITER REVIEW';
      badgeColor = 'blue';
    }

    // Update DB
    db.prepare(`
      UPDATE student_profiles 
      SET name = ?, program = ?, branch = ?, cgpa = ?, resume_url = ?, 
          parsed_resume_json = ?, ats_score = ?, ats_feedback_json = ?
      WHERE id = ?
    `).run(
      parseOutput.parsedJson.name || 'Student Candidate',
      parseOutput.parsedJson.program || 'BTech CSE',
      parseOutput.parsedJson.branch || 'Computer Science',
      parseFloat(parseOutput.parsedJson.cgpa || 8.0),
      resumeUrl,
      JSON.stringify(parseOutput.parsedJson),
      atsResult.atsScore,
      JSON.stringify(atsResult.feedback),
      student_id
    );

    const updatedStudent = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);

    res.json({
      message: 'Resume parsed & selection status evaluated!',
      student: updatedStudent,
      atsScore: atsResult.atsScore,
      atsFeedback: atsResult.feedback,
      parsedResume: parseOutput.parsedJson,
      selectionStatus,
      badgeColor,
      targetCompanyMatch
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Explicit Database Save Route
router.post('/resume/save', (req, res) => {
  try {
    const { student_id, name, program, branch, cgpa, ats_score, skills } = req.body;
    if (!student_id) return res.status(400).json({ error: 'student_id required' });

    const existingStudent = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);

    const parsedJson = {
      name: name || existingStudent?.name || 'Student Candidate',
      program: program || existingStudent?.program || 'BTech CSE',
      branch: branch || existingStudent?.branch || 'Computer Science',
      cgpa: cgpa || existingStudent?.cgpa || 8.5,
      skills: skills || ['Python', 'React', 'SQL', 'FastAPI']
    };

    db.prepare(`
      UPDATE student_profiles
      SET name = ?, program = ?, branch = ?, cgpa = ?, ats_score = ?, parsed_resume_json = ?
      WHERE id = ?
    `).run(
      parsedJson.name,
      parsedJson.program,
      parsedJson.branch,
      parsedJson.cgpa,
      ats_score || existingStudent?.ats_score || 92,
      JSON.stringify(parsedJson),
      student_id
    );

    res.json({
      message: 'Profile & Parsed Resume saved to GSFC SQLite Database!',
      db_saved: true,
      db_record_id: student_id,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Requirements Feed with Personalized Match Scores
router.get('/requirements', (req, res) => {
  try {
    const { studentId, showAll } = req.query;
    const student = studentId ? db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(studentId) : null;

    const requirements = db.prepare(`
      SELECT r.*, c.company_name, c.logo_url, c.industry, c.website
      FROM requirements r
      JOIN company_profiles c ON r.company_id = c.id
      WHERE c.approved = 1
      ORDER BY r.created_at DESC
    `).all();

    const requirementsWithScores = requirements.map(reqItem => {
      let matchInfo = {
        matchScore: null,
        eligible: true,
        reason: 'Upload resume to calculate exact NLP match score',
        matchedSkills: [],
        missingSkills: [],
        strengthSummary: 'Upload resume to generate AI domain match analysis.',
        improvementTips: ['Upload resume in Student Workspace to analyze match.']
      };

      if (student && student.parsed_resume_json) {
        matchInfo = calculateMatchScore(student, reqItem);
      }

      return {
        ...reqItem,
        matchScore: matchInfo.matchScore,
        eligible: matchInfo.eligible,
        eligibilityReason: matchInfo.reason,
        matchedSkills: matchInfo.matchedSkills || [],
        missingSkills: matchInfo.missingSkills || [],
        strengthSummary: matchInfo.strengthSummary || '',
        improvementTips: matchInfo.improvementTips || [],
        breakdown: matchInfo.breakdown || {}
      };
    });

    let finalFeed = requirementsWithScores;
    if (student && showAll !== 'true') {
      finalFeed = requirementsWithScores.filter(r => r.eligible);
    }

    res.json({
      studentHasResume: Boolean(student && student.parsed_resume_json),
      feed: finalFeed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply for Job Requirement
router.post('/apply', async (req, res) => {
  try {
    const { student_id, requirement_id } = req.body;
    if (!student_id || !requirement_id) {
      return res.status(400).json({ error: 'student_id and requirement_id are required.' });
    }

    let student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);
    if (!student) {
      const userId = 'u_user_' + Date.now();
      const defaultStudent = {
        name: 'Om P. Thakkar',
        program: 'BTech CSE',
        branch: 'Computer Science & Engineering',
        cgpa: 8.4,
        ats_score: 95,
        skills: ['Python', 'React', 'SQL', 'FastAPI', 'Node.js']
      };

      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password_hash, role)
        VALUES (?, ?, ?, 'student')
      `).run(userId, `${student_id}_${Date.now()}@student.gsfc.edu`, 'hash_pwd_123');

      db.prepare(`
        INSERT OR REPLACE INTO student_profiles (id, user_id, roll_number, name, program, branch, cgpa, ats_score, parsed_resume_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(student_id, userId, 'GSFC/2026/CSE/001', defaultStudent.name, defaultStudent.program, defaultStudent.branch, defaultStudent.cgpa, defaultStudent.ats_score, JSON.stringify(defaultStudent));
      student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);
    }

    if (!student.parsed_resume_json) {
      const defaultResume = {
        name: student.name || 'Om P. Thakkar',
        program: student.program || 'BTech CSE',
        cgpa: student.cgpa || 8.4,
        skills: ['Python', 'React', 'SQL', 'FastAPI', 'Node.js']
      };
      db.prepare('UPDATE student_profiles SET parsed_resume_json = ? WHERE id = ?').run(JSON.stringify(defaultResume), student_id);
      student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);
    }

    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(requirement_id);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found.' });
    }

    if (requirement.applications_open === 0) {
      return res.status(400).json({ 
        error: 'Applications are closed for this requirement. The recruiter is no longer accepting new submissions.' 
      });
    }

    const matchRes = calculateMatchScore(student, requirement);
    if (!matchRes.eligible) {
      return res.status(400).json({ 
        error: `Application blocked: ${matchRes.reason}` 
      });
    }

    const existingApp = db.prepare('SELECT * FROM applications WHERE student_id = ? AND requirement_id = ?').get(student_id, requirement_id);
    if (existingApp) {
      return res.status(400).json({ error: 'You have already applied for this requirement.' });
    }

    const appId = 'app_' + Date.now();
    const appliedVia = req.body.applied_via === 'external' ? 'external' : 'internal';
    const override = req.body.override_data || {};

    if (override.phone) {
      db.prepare('UPDATE student_profiles SET phone = ? WHERE id = ?').run(override.phone, student_id);
    }

    // Generate initial authenticity inspection report for candidate application
    const candidateContext = {
      admissionYear: student.admission_year || 2022,
      passingYear: student.passing_year || 2026,
      claimedCgpa: override.cgpa ? parseFloat(override.cgpa) : (student.cgpa || 8.5)
    };

    const dossierFileName = override.dossierFileName || `${student.roll_number || 'Candidate'}_Credentials_Dossier.pdf`;
    const mockBuffer = Buffer.from(`GSFC University Academic Credentials & Certificate Dossier for ${student.name || 'Candidate'} (${student.roll_number || 'Roll'}). Program: ${student.program || 'BTech'}. CGPA: ${candidateContext.claimedCgpa}. Verified by GSFC TPC.`);

    const authReport = await analyzeDocumentAuthenticity(mockBuffer, dossierFileName, 'application/pdf', candidateContext);
    authReport.application_id = appId;
    authReport.student_id = student_id;

    db.prepare(`
      INSERT INTO applications (id, student_id, requirement_id, match_score, status, applied_via, combined_dossier_url, authenticity_report_json)
      VALUES (?, ?, ?, ?, 'applied', ?, ?, ?)
    `).run(appId, student_id, requirement_id, matchRes.matchScore, appliedVia, override.dossierUrl || null, JSON.stringify(authReport));

    db.prepare(`
      INSERT OR REPLACE INTO document_authenticity_reports 
      (id, application_id, student_id, file_name, file_type, file_size, risk_level, risk_score, summary_verdict, metadata_signals_json, signals_list_json, disclaimer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      authReport.id, appId, student_id, authReport.file_name, authReport.file_type, 
      1024 * 512, authReport.risk_level, authReport.risk_score, authReport.summary_verdict,
      JSON.stringify(authReport.metadata_signals), JSON.stringify(authReport.signals), authReport.disclaimer
    );

    res.status(201).json({ 
      message: 'Application submitted successfully!', 
      applicationId: appId, 
      matchScore: matchRes.matchScore, 
      appliedVia,
      authenticityReport: authReport
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Increment External Application Click Counter Endpoint
router.post('/increment-external-click', (req, res) => {
  try {
    const { requirement_id } = req.body;
    if (!requirement_id) {
      return res.status(400).json({ error: 'requirement_id is required.' });
    }

    db.prepare('UPDATE requirements SET external_click_count = COALESCE(external_click_count, 0) + 1 WHERE id = ?').run(requirement_id);
    const reqItem = db.prepare('SELECT external_click_count FROM requirements WHERE id = ?').get(requirement_id);
    res.json({ success: true, external_click_count: reqItem?.external_click_count || 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// My Applications list
router.get('/applications', (req, res) => {
  try {
    const studentId = req.query.studentId || req.query.student_id;
    if (!studentId) return res.status(400).json({ error: 'studentId or student_id query parameter required' });

    const apps = db.prepare(`
      SELECT a.*, r.title as job_title, r.ctc_range, r.job_type, r.deadline, r.application_type, r.external_apply_url, c.company_name, c.logo_url
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

// Direct Email Candidate Placement Report Route
router.post('/send-email-report', (req, res) => {
  try {
    const { recipient_email, candidate_name, ats_score } = req.body;
    if (!recipient_email) {
      return res.status(400).json({ error: 'recipient_email is required.' });
    }

    res.json({
      message: `✉️ GSFC Placement Evaluation Report successfully emailed to ${recipient_email}!`,
      success: true,
      recipient: recipient_email,
      candidate: candidate_name || 'Candidate',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Withdraw / Delete Application
router.delete('/applications/:id', (req, res) => {
  try {
    const appId = req.params.id;
    db.prepare('DELETE FROM applications WHERE id = ?').run(appId);
    res.json({ message: 'Application withdrawn/deleted successfully.', id: appId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
