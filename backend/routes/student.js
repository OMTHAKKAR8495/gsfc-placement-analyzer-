import express from 'express';
import multer from 'multer';
import db from '../db/index.js';
import { parseResume } from '../ai/modules/resumeParser.js';
import { computeATSScore } from '../ai/modules/atsScorer.js';
import { calculateMatchScore } from '../ai/modules/matchingEngine.js';

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
    const { student_id, manual_data } = req.body;
    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required.' });
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

    // Run ATS Scorer
    const atsResult = await computeATSScore(parseOutput.parsedJson, parseOutput.rawText);

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
      badgeColor
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
      ORDER BY r.created_at DESC
    `).all();

    const requirementsWithScores = requirements.map(reqItem => {
      let matchInfo = { matchScore: 75, eligible: true, reason: 'Upload resume to see exact match score' };

      if (student && student.parsed_resume_json) {
        matchInfo = calculateMatchScore(student, reqItem);
      }

      return {
        ...reqItem,
        matchScore: matchInfo.matchScore,
        eligible: matchInfo.eligible,
        eligibilityReason: matchInfo.reason,
        breakdown: matchInfo.breakdown
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
router.post('/apply', (req, res) => {
  try {
    const { student_id, requirement_id } = req.body;
    if (!student_id || !requirement_id) {
      return res.status(400).json({ error: 'student_id and requirement_id are required.' });
    }

    const student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);
    if (!student || !student.parsed_resume_json) {
      return res.status(400).json({ 
        error: 'Resume missing! You must upload or build your resume before applying to company requirements.' 
      });
    }

    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(requirement_id);
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found.' });
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
    db.prepare(`
      INSERT INTO applications (id, student_id, requirement_id, match_score, status)
      VALUES (?, ?, ?, ?, 'applied')
    `).run(appId, student_id, requirement_id, matchRes.matchScore);

    res.status(201).json({ message: 'Application submitted successfully!', applicationId: appId, matchScore: matchRes.matchScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// My Applications list
router.get('/applications', (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ error: 'studentId query required' });

    const apps = db.prepare(`
      SELECT a.*, r.title as job_title, r.ctc_range, r.job_type, r.deadline, c.company_name, c.logo_url
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

export default router;
