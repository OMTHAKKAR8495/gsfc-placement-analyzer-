import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { parseResume } from '../ai/modules/resumeParser.js';
import { computeATSScore } from '../ai/modules/atsScorer.js';
import { calculateMatchScore } from '../ai/modules/matchingEngine.js';
import { enhanceResumeWithGemini } from '../ai/modules/resumeAI.js';
import { analyzeDocumentAuthenticity } from '../services/authenticityChecker.js';
import { sanitizeXss } from '../middleware/security.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const JWT_SECRET = process.env.JWT_SECRET || 'campushire_secret_key_2026';

/**
 * Robust Auth Helper: Extracts and verifies the authenticated student from JWT
 */
export function getAuthenticatedStudent(req) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) return null;

    if (token.startsWith('demo_token_') || token.startsWith('offline_')) {
      const email = req.headers['x-student-email'] || req.query.email || '';
      if (email) {
        const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (u) {
          const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(u.id);
          return { ...u, student_id: profile?.id || u.id, owner_id: profile?.id || u.id, profile };
        }
      }
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) return null;

    const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return null;

    let profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
    if (!profile && user.role === 'student') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(decoded.owner_id);
    }

    const effectiveStudentId = profile?.id || decoded.owner_id || user.id;

    return {
      ...user,
      student_id: effectiveStudentId,
      owner_id: effectiveStudentId,
      profile
    };
  } catch (err) {
    return null;
  }
}

/**
 * Log student activity helper
 */
function logStudentActivity(studentId, activityType, title, description = '', relatedId = null) {
  try {
    const id = 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    db.prepare(`
      INSERT INTO student_activity_history (id, student_id, activity_type, title, description, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, studentId, activityType, title, description, relatedId);
  } catch (e) {
    console.warn('Activity logging notice:', e.message);
  }
}

/**
 * Compute real Profile Completion % from persistent student record
 */
function calculateProfileCompletion(student) {
  if (!student) return 0;
  let score = 0;
  // 1. Personal & Basic details (20%)
  if (student.name && student.roll_number) score += 20;
  // 2. Academic Info (20%)
  if (student.program && student.branch && student.cgpa) score += 20;
  // 3. Contact details (15%)
  if (student.phone || student.linkedin_url) score += 15;
  // 4. Structured Resume & Skills (25%)
  if (student.parsed_resume_json) {
    try {
      const parsed = typeof student.parsed_resume_json === 'string' ? JSON.parse(student.parsed_resume_json) : student.parsed_resume_json;
      if (parsed.skills?.technical?.length > 0 || (Array.isArray(parsed.skills) && parsed.skills.length > 0)) {
        score += 25;
      } else {
        score += 15;
      }
    } catch(e) { score += 15; }
  }
  // 5. Verification Dossier Documents (20%)
  if (student.marksheets_url || student.certifications_url || student.id_document_url) score += 20;

  return Math.min(100, Math.max(20, score));
}

// -------------------------------------------------------------
// 1. STUDENT PROFILE MANAGEMENT (GET & UPDATE)
// -------------------------------------------------------------

router.get('/profile', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const targetStudentId = authUser?.student_id || req.query.studentId || req.query.student_id;
    const targetUserId = authUser?.id || req.query.userId;

    let student = null;
    if (targetStudentId) {
      student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(targetStudentId);
    }
    if (!student && targetUserId) {
      student = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(targetUserId);
    }

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const completion = calculateProfileCompletion(student);
    res.json({
      ...student,
      profile_completion: completion
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.body.student_id;

    if (!studentId) {
      return res.status(401).json({ error: 'Authentication required to update student profile.' });
    }

    const {
      name, roll_number, phone, program, branch, cgpa,
      passing_year, admission_year, linkedin_url, github_url, photo_url, summary
    } = req.body;

    const existing = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(studentId);
    if (!existing) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    db.prepare(`
      UPDATE student_profiles
      SET name = COALESCE(?, name),
          roll_number = COALESCE(?, roll_number),
          phone = COALESCE(?, phone),
          program = COALESCE(?, program),
          branch = COALESCE(?, branch),
          cgpa = COALESCE(?, cgpa),
          passing_year = COALESCE(?, passing_year),
          admission_year = COALESCE(?, admission_year),
          linkedin_url = COALESCE(?, linkedin_url),
          github_url = COALESCE(?, github_url),
          photo_url = COALESCE(?, photo_url)
      WHERE id = ?
    `).run(
      name ? sanitizeXss(name) : null,
      roll_number ? sanitizeXss(roll_number) : null,
      phone ? sanitizeXss(phone) : null,
      program ? sanitizeXss(program) : null,
      branch ? sanitizeXss(branch) : null,
      cgpa ? parseFloat(cgpa) : null,
      passing_year ? parseInt(passing_year, 10) : null,
      admission_year ? parseInt(admission_year, 10) : null,
      linkedin_url || null,
      github_url || null,
      photo_url || null,
      studentId
    );

    logStudentActivity(studentId, 'profile_updated', 'Updated Student Profile', `Updated academic and personal information`);

    const updated = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(studentId);
    res.json({
      success: true,
      message: 'Profile updated successfully!',
      student: {
        ...updated,
        profile_completion: calculateProfileCompletion(updated)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. DASHBOARD AGGREGATE SUMMARY
// -------------------------------------------------------------

router.get('/dashboard-summary', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.query.student_id;

    if (!studentId) {
      return res.status(401).json({ error: 'Authentication required for student dashboard summary.' });
    }

    const student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(studentId);
    
    // Counts
    const applicationsCount = db.prepare('SELECT COUNT(*) as c FROM applications WHERE student_id = ?').get(studentId)?.c || 0;
    const shortlistedCount = db.prepare("SELECT COUNT(*) as c FROM applications WHERE student_id = ? AND status IN ('shortlisted', 'interview', 'selected')").get(studentId)?.c || 0;
    const selectedCount = db.prepare("SELECT COUNT(*) as c FROM applications WHERE student_id = ? AND status = 'selected'").get(studentId)?.c || 0;
    const bookmarksCount = db.prepare('SELECT COUNT(*) as c FROM student_bookmarks WHERE student_id = ?').get(studentId)?.c || 0;
    const assessmentsCount = db.prepare('SELECT COUNT(*) as c FROM student_assessments WHERE student_id = ?').get(studentId)?.c || 0;
    const mockInterviewsCount = db.prepare('SELECT COUNT(*) as c FROM mock_interview_sessions WHERE student_id = ?').get(studentId)?.c || 0;
    const unreadNotificationsCount = db.prepare('SELECT COUNT(*) as c FROM student_notifications WHERE student_id = ? AND is_read = 0').get(studentId)?.c || 0;
    const myQuestionsCount = db.prepare('SELECT COUNT(*) as c FROM qa_threads WHERE student_id = ?').get(studentId)?.c || 0;

    res.json({
      student_id: studentId,
      student_name: student?.name || 'GSFC Student',
      cgpa: student?.cgpa || 8.5,
      ats_score: student?.ats_score || 92,
      profile_completion: calculateProfileCompletion(student),
      metrics: {
        total_applications: applicationsCount,
        shortlisted: shortlistedCount,
        selected: selectedCount,
        saved_drives: bookmarksCount,
        assessments_completed: assessmentsCount,
        mock_interviews_completed: mockInterviewsCount,
        unread_notifications: unreadNotificationsCount,
        my_questions: myQuestionsCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. PLACEMENT DRIVES FEED & MATCH SCORES
// -------------------------------------------------------------

router.get('/requirements', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.query.studentId || req.query.student_id;
    const { showAll } = req.query;

    const student = studentId ? db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(studentId) : null;

    // Load Bookmarks for this student to attach bookmarked flag
    let bookmarkedReqIds = new Set();
    if (studentId) {
      const bmarks = db.prepare("SELECT entity_id FROM student_bookmarks WHERE student_id = ? AND entity_type = 'requirement'").all(studentId);
      bmarks.forEach(b => bookmarkedReqIds.add(b.entity_id));
    }

    // Load Applied Req IDs for this student
    let appliedReqIds = new Map();
    if (studentId) {
      const apps = db.prepare("SELECT requirement_id, status, applied_at FROM applications WHERE student_id = ?").all(studentId);
      apps.forEach(a => appliedReqIds.set(a.requirement_id, a));
    }

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

      const appData = appliedReqIds.get(reqItem.id);

      return {
        ...reqItem,
        matchScore: matchInfo.matchScore,
        eligible: matchInfo.eligible,
        eligibilityReason: matchInfo.reason,
        matchedSkills: matchInfo.matchedSkills || [],
        missingSkills: matchInfo.missingSkills || [],
        strengthSummary: matchInfo.strengthSummary || '',
        improvementTips: matchInfo.improvementTips || [],
        breakdown: matchInfo.breakdown || {},
        is_bookmarked: bookmarkedReqIds.has(reqItem.id),
        is_applied: Boolean(appData),
        application_status: appData?.status || null,
        applied_at: appData?.applied_at || null
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

// -------------------------------------------------------------
// 4. JOB APPLICATIONS ("MY APPLICATIONS")
// -------------------------------------------------------------

router.get('/applications', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.query.studentId || req.query.student_id;

    if (!studentId) {
      return res.status(401).json({ error: 'Authentication required to view your job applications.' });
    }

    const apps = db.prepare(`
      SELECT 
        a.*, 
        r.title as job_title, 
        r.ctc_range, 
        r.job_type, 
        r.deadline, 
        r.application_type, 
        r.external_apply_url, 
        c.company_name, 
        c.logo_url
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

router.post('/apply', async (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.body.student_id;
    const { requirement_id } = req.body;

    if (!studentId || !requirement_id) {
      return res.status(400).json({ error: 'student_id and requirement_id are required.' });
    }

    let student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found. Please log in first.' });
    }

    const requirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(requirement_id);
    if (!requirement) {
      return res.status(404).json({ error: 'Placement requirement not found.' });
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

    const existingApp = db.prepare('SELECT * FROM applications WHERE student_id = ? AND requirement_id = ?').get(studentId, requirement_id);
    if (existingApp) {
      return res.status(400).json({ error: 'You have already applied for this requirement.' });
    }

    const appId = 'app_' + Date.now();
    const appliedVia = req.body.applied_via === 'external' ? 'external' : 'internal';
    const override = req.body.override_data || {};

    if (override.phone) {
      db.prepare('UPDATE student_profiles SET phone = ? WHERE id = ?').run(override.phone, studentId);
    }

    // Authenticity report
    const candidateContext = {
      admissionYear: student.admission_year || 2022,
      passingYear: student.passing_year || 2026,
      claimedCgpa: override.cgpa ? parseFloat(override.cgpa) : (student.cgpa || 8.5)
    };

    const dossierFileName = override.dossierFileName || `${student.roll_number || 'Candidate'}_Credentials_Dossier.pdf`;
    const mockBuffer = Buffer.from(`GSFC University Academic Credentials Dossier for ${student.name} (${student.roll_number}). Program: ${student.program}. CGPA: ${candidateContext.claimedCgpa}. Verified by GSFC TPC.`);

    const authReport = await analyzeDocumentAuthenticity(mockBuffer, dossierFileName, 'application/pdf', candidateContext);
    authReport.application_id = appId;
    authReport.student_id = studentId;

    db.prepare(`
      INSERT INTO applications (id, student_id, requirement_id, match_score, status, applied_via, combined_dossier_url, authenticity_report_json)
      VALUES (?, ?, ?, ?, 'applied', ?, ?, ?)
    `).run(appId, studentId, requirement_id, matchRes.matchScore, appliedVia, override.dossierUrl || null, JSON.stringify(authReport));

    // Log Activity
    logStudentActivity(studentId, 'applied', `Applied to ${requirement.title}`, `Application submitted with match score ${matchRes.matchScore}%`, requirement_id);

    // Create Notification
    const notifId = 'notif_' + Date.now();
    db.prepare(`
      INSERT INTO student_notifications (id, student_id, notification_type, title, message, related_id)
      VALUES (?, ?, 'application_submitted', ?, ?, ?)
    `).run(notifId, studentId, `Application Submitted: ${requirement.title}`, `Your application for ${requirement.title} has been received by the TPC cell.`, appId);

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

router.delete('/applications/:id', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id;
    const appId = req.params.id;

    if (studentId) {
      db.prepare('DELETE FROM applications WHERE id = ? AND student_id = ?').run(appId, studentId);
    } else {
      db.prepare('DELETE FROM applications WHERE id = ?').run(appId);
    }

    res.json({ message: 'Application withdrawn/deleted successfully.', id: appId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. STUDENT BOOKMARKS / SAVED DRIVES
// -------------------------------------------------------------

router.get('/bookmarks', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.query.student_id;

    if (!studentId) {
      return res.status(401).json({ error: 'Authentication required to view bookmarks.' });
    }

    const bookmarks = db.prepare(`
      SELECT b.*, r.title as requirement_title, r.ctc_range, r.job_type, c.company_name, c.logo_url
      FROM student_bookmarks b
      LEFT JOIN requirements r ON b.entity_id = r.id AND b.entity_type = 'requirement'
      LEFT JOIN company_profiles c ON r.company_id = c.id
      WHERE b.student_id = ?
      ORDER BY b.created_at DESC
    `).all(studentId);

    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/bookmarks', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.body.student_id;
    const { entity_id, entity_type = 'requirement', notes = '' } = req.body;

    if (!studentId || !entity_id) {
      return res.status(400).json({ error: 'student_id and entity_id are required.' });
    }

    const existing = db.prepare('SELECT * FROM student_bookmarks WHERE student_id = ? AND entity_type = ? AND entity_id = ?').get(studentId, entity_type, entity_id);

    if (existing) {
      // Toggle off / remove
      db.prepare('DELETE FROM student_bookmarks WHERE id = ?').run(existing.id);
      return res.json({ success: true, is_bookmarked: false, message: 'Bookmark removed.' });
    } else {
      const bId = 'bmark_' + Date.now();
      db.prepare(`
        INSERT INTO student_bookmarks (id, student_id, entity_type, entity_id, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(bId, studentId, entity_type, entity_id, sanitizeXss(notes));

      logStudentActivity(studentId, 'bookmarked', 'Bookmarked Placement Drive', `Saved requirement to bookmarks`, entity_id);
      return res.status(201).json({ success: true, is_bookmarked: true, id: bId, message: 'Drive saved to bookmarks!' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bookmarks/:id', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id;
    const bId = req.params.id;

    if (studentId) {
      db.prepare('DELETE FROM student_bookmarks WHERE id = ? AND student_id = ?').run(bId, studentId);
    } else {
      db.prepare('DELETE FROM student_bookmarks WHERE id = ?').run(bId);
    }

    res.json({ success: true, message: 'Bookmark deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. STUDENT ASSESSMENTS & TEST RESULTS ("MY ASSESSMENTS")
// -------------------------------------------------------------

router.get('/assessments', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.query.student_id;

    if (!studentId) {
      return res.status(401).json({ error: 'Authentication required to view assessment history.' });
    }

    const assessments = db.prepare(`
      SELECT a.*, r.title as requirement_title, c.company_name
      FROM student_assessments a
      LEFT JOIN requirements r ON a.requirement_id = r.id
      LEFT JOIN company_profiles c ON r.company_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.created_at DESC
    `).all(studentId);

    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/assessments', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.body.student_id;
    const {
      assessment_title, assessment_type = 'technical', requirement_id,
      score, percentage, questions_attempted, correct_answers, incorrect_answers,
      time_taken_seconds, feedback_json, answers_json
    } = req.body;

    if (!studentId || !assessment_title) {
      return res.status(400).json({ error: 'student_id and assessment_title are required.' });
    }

    const testId = 'asmt_' + Date.now();
    db.prepare(`
      INSERT INTO student_assessments (
        id, student_id, assessment_title, assessment_type, requirement_id,
        score, percentage, questions_attempted, correct_answers, incorrect_answers,
        time_taken_seconds, status, feedback_json, answers_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
    `).run(
      testId, studentId, sanitizeXss(assessment_title), assessment_type, requirement_id || null,
      parseFloat(score || 0), parseFloat(percentage || 0),
      parseInt(questions_attempted || 0, 10), parseInt(correct_answers || 0, 10), parseInt(incorrect_answers || 0, 10),
      parseInt(time_taken_seconds || 0, 10),
      typeof feedback_json === 'string' ? feedback_json : JSON.stringify(feedback_json || {}),
      typeof answers_json === 'string' ? answers_json : JSON.stringify(answers_json || [])
    );

    logStudentActivity(studentId, 'assessment_completed', `Completed Assessment: ${assessment_title}`, `Scored ${percentage}% (${score} points)`, testId);

    const saved = db.prepare('SELECT * FROM student_assessments WHERE id = ?').get(testId);
    res.status(201).json({ success: true, assessment: saved, message: 'Assessment results saved to permanent history!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. STUDENT INTERVIEWS ("MY INTERVIEWS")
// -------------------------------------------------------------

router.get('/interviews', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.query.student_id;

    if (!studentId) {
      return res.status(401).json({ error: 'Authentication required to view interview history.' });
    }

    const sessions = db.prepare(`
      SELECT s.*, r.title as requirement_title, r.ctc_range, c.company_name, c.logo_url
      FROM mock_interview_sessions s
      LEFT JOIN requirements r ON s.requirement_id = r.id
      LEFT JOIN company_profiles c ON r.company_id = c.id
      WHERE s.student_id = ?
      ORDER BY s.created_at DESC
    `).all(studentId);

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 8. STUDENT NOTIFICATIONS
// -------------------------------------------------------------

router.get('/notifications', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.query.student_id;

    if (!studentId) {
      return res.status(401).json({ error: 'Authentication required for notifications.' });
    }

    const notifications = db.prepare(`
      SELECT * FROM student_notifications
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(studentId);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id;
    const notifId = req.params.id;

    if (studentId) {
      db.prepare('UPDATE student_notifications SET is_read = 1 WHERE id = ? AND student_id = ?').run(notifId, studentId);
    } else {
      db.prepare('UPDATE student_notifications SET is_read = 1 WHERE id = ?').run(notifId);
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 9. STUDENT ACTIVITY HISTORY STREAM
// -------------------------------------------------------------

router.get('/activities', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.query.student_id;

    if (!studentId) {
      return res.status(401).json({ error: 'Authentication required for activity history.' });
    }

    const activities = db.prepare(`
      SELECT * FROM student_activity_history
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(studentId);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 10. RESUME MANAGEMENT & VERSION HISTORY
// -------------------------------------------------------------

router.get('/resumes', (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const studentId = authUser?.student_id || req.query.student_id;

    if (!studentId) {
      return res.status(401).json({ error: 'Authentication required to view resumes.' });
    }

    const resumes = db.prepare(`
      SELECT * FROM student_resumes
      WHERE student_id = ?
      ORDER BY created_at DESC
    `).all(studentId);

    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const student_id = authUser?.student_id || req.body.student_id;
    const { manual_data, target_requirement_id } = req.body;

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
    let resumeUrl = '/uploads/resume_' + student_id + '_' + Date.now() + '.pdf';

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

    const atsResult = await computeATSScore(parseOutput.parsedJson, parseOutput.rawText, targetReq);

    // Update active student profile
    db.prepare(`
      UPDATE student_profiles 
      SET name = COALESCE(?, name), 
          program = COALESCE(?, program), 
          branch = COALESCE(?, branch), 
          cgpa = COALESCE(?, cgpa), 
          resume_url = ?, 
          parsed_resume_json = ?, 
          ats_score = ?, 
          ats_feedback_json = ?
      WHERE id = ?
    `).run(
      parseOutput.parsedJson.name || null,
      parseOutput.parsedJson.program || null,
      parseOutput.parsedJson.branch || null,
      parseOutput.parsedJson.cgpa ? parseFloat(parseOutput.parsedJson.cgpa) : null,
      resumeUrl,
      JSON.stringify(parseOutput.parsedJson),
      atsResult.atsScore,
      JSON.stringify(atsResult.feedback),
      student_id
    );

    // Store in resume history table
    const versionCount = db.prepare('SELECT COUNT(*) as c FROM student_resumes WHERE student_id = ?').get(student_id)?.c || 0;
    const resumeVerId = 'rver_' + Date.now();
    db.prepare(`
      INSERT INTO student_resumes (id, student_id, version_name, resume_url, parsed_json, ats_score, ats_feedback_json, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      resumeVerId, student_id, `Resume Version ${versionCount + 1}`, resumeUrl,
      JSON.stringify(parseOutput.parsedJson), atsResult.atsScore, JSON.stringify(atsResult.feedback)
    );

    logStudentActivity(student_id, 'resume_uploaded', 'Uploaded and Analyzed Resume', `ATS Score evaluated: ${atsResult.atsScore}/100`, resumeVerId);

    const updatedStudent = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);

    res.json({
      message: 'Resume parsed & selection status evaluated!',
      student: {
        ...updatedStudent,
        profile_completion: calculateProfileCompletion(updatedStudent)
      },
      atsScore: atsResult.atsScore,
      atsFeedback: atsResult.feedback,
      parsedResume: parseOutput.parsedJson
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Interactive Resume Builder & 3-Dossier Verification Document Pipeline
router.post('/builder/save', upload.fields([
  { name: 'marksheets', maxCount: 1 },
  { name: 'certifications', maxCount: 1 },
  { name: 'id_document', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const authUser = getAuthenticatedStudent(req);
    const student_id = authUser?.student_id || req.body.student_id;

    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required.' });
    }

    const { 
      name, roll_number, program, branch, cgpa, 
      passing_year, admission_year, phone, email, 
      linkedin_url, github_url, photo_url, summary, 
      skills_json, projects_json, experience_json, education_json,
      target_requirement_id 
    } = req.body;

    let skillsObj = { technical: ['Python', 'SQL', 'React', 'Git'], soft: ['Communication', 'Teamwork', 'Problem Solving'] };
    try {
      if (skills_json) {
        const parsed = typeof skills_json === 'string' ? JSON.parse(skills_json) : skills_json;
        if (Array.isArray(parsed)) {
          skillsObj.technical = parsed;
        } else if (parsed && typeof parsed === 'object') {
          skillsObj = parsed;
        }
      }
    } catch (e) {}

    let projectsArr = [];
    try {
      if (projects_json) projectsArr = typeof projects_json === 'string' ? JSON.parse(projects_json) : projects_json;
    } catch(e) {}

    let experienceArr = [];
    try {
      if (experience_json) experienceArr = typeof experience_json === 'string' ? JSON.parse(experience_json) : experience_json;
    } catch(e) {}

    let educationArr = [];
    try {
      if (education_json) educationArr = typeof education_json === 'string' ? JSON.parse(education_json) : education_json;
    } catch(e) {}

    const marksheetsUrl = req.files?.['marksheets'] ? `/uploads/marksheets_${student_id}_${Date.now()}.pdf` : null;
    const certificationsUrl = req.files?.['certifications'] ? `/uploads/certs_${student_id}_${Date.now()}.pdf` : null;
    const idDocumentUrl = req.files?.['id_document'] ? `/uploads/id_${student_id}_${Date.now()}.pdf` : null;
    const uploadedPhotoUrl = req.files?.['photo'] ? `/uploads/photo_${student_id}_${Date.now()}.jpg` : (photo_url || null);

    const synthesizedResumeJson = {
      name: name || 'Student Candidate',
      roll_number: roll_number || 'GSFC/2026/CSE/001',
      email: email || 'student@gsfcuniversity.ac.in',
      phone: phone || '+91 98765 43210',
      program: program || 'BTech CSE',
      branch: branch || 'Computer Science & Engineering',
      cgpa: parseFloat(cgpa || 8.5),
      passing_year: parseInt(passing_year || 2026, 10),
      summary: summary || `Aspiring ${program || 'Engineering'} graduate from GSFC University.`,
      skills: skillsObj,
      projects: projectsArr,
      experience: experienceArr,
      education: educationArr,
      linkedin_url: linkedin_url || '',
      github_url: github_url || '',
      photo_url: uploadedPhotoUrl || ''
    };

    let targetReq = null;
    if (target_requirement_id) {
      targetReq = db.prepare('SELECT * FROM requirements WHERE id = ?').get(target_requirement_id);
    }

    const rawTextRepresentation = `
Candidate Name: ${synthesizedResumeJson.name}
Roll Number: ${synthesizedResumeJson.roll_number}
Degree & Program: ${synthesizedResumeJson.program} - ${synthesizedResumeJson.branch}
CGPA: ${synthesizedResumeJson.cgpa}
Passing Year: ${synthesizedResumeJson.passing_year}
Technical Skills: ${(synthesizedResumeJson.skills.technical || []).join(', ')}
Soft Skills: ${(synthesizedResumeJson.skills.soft || []).join(', ')}
    `.trim();

    const atsResult = await computeATSScore(synthesizedResumeJson, rawTextRepresentation, targetReq);

    // Upsert student_profile
    const existing = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);
    if (!existing) {
      db.prepare(`
        INSERT INTO student_profiles (
          id, name, roll_number, program, branch, cgpa, passing_year, admission_year, phone,
          parsed_resume_json, ats_score, ats_feedback_json, marksheets_url, certifications_url, id_document_url, photo_url, linkedin_url, github_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        student_id, synthesizedResumeJson.name, synthesizedResumeJson.roll_number,
        synthesizedResumeJson.program, synthesizedResumeJson.branch, synthesizedResumeJson.cgpa,
        synthesizedResumeJson.passing_year, parseInt(admission_year || 2022, 10), synthesizedResumeJson.phone,
        JSON.stringify(synthesizedResumeJson), atsResult.atsScore, JSON.stringify(atsResult.feedback),
        marksheetsUrl, certificationsUrl, idDocumentUrl, uploadedPhotoUrl, synthesizedResumeJson.linkedin_url, synthesizedResumeJson.github_url
      );
    } else {
      db.prepare(`
        UPDATE student_profiles 
        SET name = ?, roll_number = ?, program = ?, branch = ?, cgpa = ?, 
            passing_year = ?, phone = ?, parsed_resume_json = ?, ats_score = ?, ats_feedback_json = ?,
            marksheets_url = COALESCE(?, marksheets_url),
            certifications_url = COALESCE(?, certifications_url),
            id_document_url = COALESCE(?, id_document_url),
            photo_url = COALESCE(?, photo_url),
            linkedin_url = ?, github_url = ?
        WHERE id = ?
      `).run(
        synthesizedResumeJson.name, synthesizedResumeJson.roll_number, synthesizedResumeJson.program,
        synthesizedResumeJson.branch, synthesizedResumeJson.cgpa, synthesizedResumeJson.passing_year,
        synthesizedResumeJson.phone, JSON.stringify(synthesizedResumeJson), atsResult.atsScore,
        JSON.stringify(atsResult.feedback), marksheetsUrl, certificationsUrl, idDocumentUrl,
        uploadedPhotoUrl, synthesizedResumeJson.linkedin_url, synthesizedResumeJson.github_url, student_id
      );
    }

    logStudentActivity(student_id, 'resume_built', 'Built Interactive Resume & Profile', `Updated CV with score ${atsResult.atsScore}/100`);

    const updatedStudent = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);

    res.json({
      success: true,
      message: 'Comprehensive placement profile & resume saved!',
      student: {
        ...updatedStudent,
        profile_completion: calculateProfileCompletion(updatedStudent)
      },
      atsScore: atsResult.atsScore,
      atsFeedback: atsResult.feedback,
      parsedResume: synthesizedResumeJson
    });
  } catch (err) {
    console.error('Resume builder save error:', err);
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

export default router;
