import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campushire_secret_key_2026';
const router = express.Router();
const uuidv4 = () => crypto.randomUUID();

// Helper to authenticate user from token
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Check if demo token
    if (token.startsWith('demo_token_')) {
      const role = token.replace('demo_token_', '');
      let demoUserId = `u_${role}_demo`;
      if (role === 'admin') demoUserId = 'u_admin_01';
      else if (role === 'company') demoUserId = 'u_comp_google';
      else if (role === 'student') demoUserId = 'u_student_1';

      try {
        db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
          demoUserId,
          `${role}@gsfcuniversity.ac.in`,
          'demo_hash',
          role
        );
      } catch (e) {}

      req.user = { id: demoUserId, role: role, email: `${role}@gsfcuniversity.ac.in` };
      return next();
    }
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};


// 1. Schedule an Online Video Meeting (Company Recruiter or TPC Admin)
router.post('/schedule', authenticateUser, (req, res) => {
  try {
    const { driveId, companyId, title, description, scheduledAt, durationMinutes, studentIds } = req.body;

    if (!driveId || !scheduledAt || !title) {
      return res.status(400).json({ error: 'Drive, meeting title, and scheduled date/time are required.' });
    }

    // Verify Drive exists
    const drive = db.prepare('SELECT * FROM requirements WHERE id = ?').get(driveId);
    if (!drive) {
      return res.status(404).json({ error: 'Specified hiring drive was not found.' });
    }

    let targetCompanyId = companyId || drive.company_id;

    // Verify permission: Company recruiter must own the drive or user must be admin
    if (req.user.role === 'company') {
      const compProfile = db.prepare('SELECT id FROM company_profiles WHERE user_id = ?').get(req.user.id);
      if (compProfile) {
        targetCompanyId = compProfile.id;
      }
    }

    let validCompanyId = null;
    const compExists = db.prepare('SELECT id FROM company_profiles WHERE id = ?').get(targetCompanyId);
    if (compExists) {
      validCompanyId = compExists.id;
    }

    let validSchedulerUserId = null;
    const schedulerExists = db.prepare('SELECT id FROM users WHERE id = ?').get(req.user.id);
    if (schedulerExists) {
      validSchedulerUserId = schedulerExists.id;
    }

    const meetingId = 'meet_' + uuidv4().slice(0, 8);
    const roomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const drivePrefix = (drive.title || 'DRV').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const roomId = `GSFC-MEET-${drivePrefix}-${roomCode}`;

    const duration = parseInt(durationMinutes, 10) || 30;

    // Create Meeting
    db.prepare(`
      INSERT INTO meetings (id, room_id, drive_id, company_id, title, description, scheduled_at, duration_minutes, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `).run(meetingId, roomId, driveId, validCompanyId, title, description || '', scheduledAt, duration, validSchedulerUserId);

    // Add scheduling user as participant
    db.prepare(`
      INSERT INTO meeting_participants (id, meeting_id, user_id, role, join_status)
      VALUES (?, ?, ?, ?, 'invited')
    `).run('part_' + uuidv4().slice(0, 8), meetingId, validSchedulerUserId, req.user.role);

    // Add shortlisted student participants
    const invitedStudents = [];
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const insertPartStmt = db.prepare(`
        INSERT OR IGNORE INTO meeting_participants (id, meeting_id, user_id, student_id, role, join_status)
        VALUES (?, ?, ?, ?, 'student', 'invited')
      `);

      const notifyStmt = db.prepare(`
        INSERT INTO notifications_log (id, recipient_name, recipient_email, recipient_phone, channel, notification_type, title, message, metadata_json, status)
        VALUES (?, ?, ?, ?, 'in_app', 'interview_reminder', ?, ?, ?, 'sent')
      `);

      for (const stId of studentIds) {
        const student = db.prepare(`
          SELECT s.id, s.user_id, s.name, u.email, s.phone 
          FROM student_profiles s 
          LEFT JOIN users u ON s.user_id = u.id 
          WHERE s.id = ? OR s.user_id = ?
        `).get(stId, stId);

        let validUserId = null;
        let validStudentId = null;

        if (student) {
          if (student.user_id) {
            const uExists = db.prepare('SELECT id FROM users WHERE id = ?').get(student.user_id);
            if (uExists) validUserId = uExists.id;
          }
          if (student.id) {
            const sExists = db.prepare('SELECT id FROM student_profiles WHERE id = ?').get(student.id);
            if (sExists) validStudentId = sExists.id;
          }

          const partId = 'part_' + uuidv4().slice(0, 8);
          insertPartStmt.run(partId, meetingId, validUserId, validStudentId);
          invitedStudents.push({ id: student.id, name: student.name, email: student.email });

          // Send notification log to student
          const notifMsg = `📹 You have been invited to a live in-portal video interview for ${drive.title}. Scheduled for: ${new Date(scheduledAt).toLocaleString('en-IN')}. Join via your Student Dashboard.`;
          try {
            notifyStmt.run(
              uuidv4(),
              student.name || 'Candidate',
              student.email || '',
              student.phone || '',
              `Online Video Interview Call: ${drive.title}`,
              notifMsg,
              JSON.stringify({ meeting_id: meetingId, room_id: roomId, scheduled_at: scheduledAt })
            );
          } catch (e) {}
        }
      }
    }

    res.json({
      success: true,
      message: `🎉 Online Video Meeting scheduled successfully! Room ID: ${roomId}`,
      meeting: {
        id: meetingId,
        room_id: roomId,
        title,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        invited_count: invitedStudents.length,
        invited_students: invitedStudents
      }
    });
  } catch (err) {
    console.error('Error scheduling meeting:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Meetings (Admin Oversight)
router.get('/all', authenticateUser, (req, res) => {
  try {
    const meetings = db.prepare(`
      SELECT 
        m.*,
        r.title as drive_title,
        r.job_type,
        r.ctc_range,
        c.company_name,
        c.logo_url as company_logo,
        (SELECT COUNT(*) FROM meeting_participants mp WHERE mp.meeting_id = m.id AND mp.role = 'student') as student_count,
        (SELECT COUNT(*) FROM meeting_violations mv WHERE mv.meeting_id = m.id) as violation_count
      FROM meetings m
      LEFT JOIN requirements r ON m.drive_id = r.id
      LEFT JOIN company_profiles c ON m.company_id = c.id
      ORDER BY m.scheduled_at DESC
    `).all();

    res.json(meetings);
  } catch (err) {
    console.error('Error fetching all meetings:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Company Meetings
router.get('/company', authenticateUser, (req, res) => {
  try {
    let companyId = null;
    if (req.user.role === 'company') {
      const comp = db.prepare('SELECT id FROM company_profiles WHERE user_id = ?').get(req.user.id);
      companyId = comp?.id;
    } else if (req.query.company_id) {
      companyId = req.query.company_id;
    }

    let meetings = [];
    if (companyId) {
      meetings = db.prepare(`
        SELECT 
          m.*,
          r.title as drive_title,
          r.job_type,
          r.ctc_range,
          c.company_name,
          c.logo_url as company_logo,
          (SELECT COUNT(*) FROM meeting_participants mp WHERE mp.meeting_id = m.id AND mp.role = 'student') as student_count,
          (SELECT COUNT(*) FROM meeting_violations mv WHERE mv.meeting_id = m.id) as violation_count
        FROM meetings m
        LEFT JOIN requirements r ON m.drive_id = r.id
        LEFT JOIN company_profiles c ON m.company_id = c.id
        WHERE m.company_id = ?
        ORDER BY m.scheduled_at DESC
      `).all(companyId);
    } else {
      meetings = db.prepare(`
        SELECT 
          m.*,
          r.title as drive_title,
          r.job_type,
          c.company_name,
          (SELECT COUNT(*) FROM meeting_participants mp WHERE mp.meeting_id = m.id AND mp.role = 'student') as student_count,
          (SELECT COUNT(*) FROM meeting_violations mv WHERE mv.meeting_id = m.id) as violation_count
        FROM meetings m
        LEFT JOIN requirements r ON m.drive_id = r.id
        LEFT JOIN company_profiles c ON m.company_id = c.id
        ORDER BY m.scheduled_at DESC
      `).all();
    }

    res.json(meetings);
  } catch (err) {
    console.error('Error fetching company meetings:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Student Invited Meetings
router.get('/student', authenticateUser, (req, res) => {
  try {
    const student = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user.id);
    const studentId = student?.id;

    const meetings = db.prepare(`
      SELECT 
        m.*,
        mp.id as participant_id,
        mp.join_status,
        mp.outcome_status,
        mp.evaluation_score,
        r.title as drive_title,
        r.job_type,
        r.ctc_range,
        c.company_name,
        c.logo_url as company_logo,
        (SELECT COUNT(*) FROM meeting_violations mv WHERE mv.meeting_id = m.id AND mv.student_id = mp.student_id) as my_violation_count
      FROM meeting_participants mp
      JOIN meetings m ON mp.meeting_id = m.id
      LEFT JOIN requirements r ON m.drive_id = r.id
      LEFT JOIN company_profiles c ON m.company_id = c.id
      WHERE mp.user_id = ? OR (mp.student_id IS NOT NULL AND mp.student_id = ?)
      ORDER BY m.scheduled_at ASC
    `).all(req.user.id, studentId || '');

    res.json(meetings);
  } catch (err) {
    console.error('Error fetching student meetings:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Room Verification & State Lookup (Server-Side Access Control)
router.get('/room/:roomId', authenticateUser, (req, res) => {
  try {
    const { roomId } = req.params;

    const meeting = db.prepare(`
      SELECT 
        m.*,
        r.title as drive_title,
        r.job_type,
        r.ctc_range,
        r.required_skills_json,
        c.company_name,
        c.logo_url as company_logo
      FROM meetings m
      LEFT JOIN requirements r ON m.drive_id = r.id
      LEFT JOIN company_profiles c ON m.company_id = c.id
      WHERE m.room_id = ?
    `).get(roomId);

    if (!meeting) {
      return res.status(404).json({ error: 'Interview room not found. Please verify the Room ID.' });
    }

    // Load participants
    const participants = db.prepare(`
      SELECT 
        mp.*,
        u.email,
        s.name as student_name,
        s.roll_number as student_roll,
        s.program as student_program,
        s.cgpa as student_cgpa,
        s.resume_url as student_resume,
        s.photo_url as student_photo
      FROM meeting_participants mp
      LEFT JOIN users u ON mp.user_id = u.id
      LEFT JOIN student_profiles s ON mp.student_id = s.id
      WHERE mp.meeting_id = ?
    `).all(meeting.id);

    // Verify Access Permissions
    let isAllowed = false;
    let myRoleInRoom = req.user.role;
    let myParticipantRecord = null;

    if (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.role === 'faculty') {
      isAllowed = true;
    } else if (req.user.role === 'company') {
      const comp = db.prepare('SELECT id FROM company_profiles WHERE user_id = ?').get(req.user.id);
      if (comp && comp.id === meeting.company_id) {
        isAllowed = true;
      }
    } else if (req.user.role === 'student') {
      const student = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user.id);
      const studentId = student?.id;
      myParticipantRecord = participants.find(p => p.user_id === req.user.id || (studentId && p.student_id === studentId));
      if (myParticipantRecord) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return res.status(403).json({ error: 'Access Denied: You are not on the authorized attendee roster for this interview room.' });
    }

    // Load chat messages
    const chatMessages = db.prepare(`
      SELECT * FROM meeting_chat_messages
      WHERE meeting_id = ?
      ORDER BY created_at ASC
    `).all(meeting.id);

    // Load violations
    const violations = db.prepare(`
      SELECT * FROM meeting_violations
      WHERE meeting_id = ?
      ORDER BY occurred_at DESC
    `).all(meeting.id);

    res.json({
      meeting,
      participants,
      chatMessages,
      violations,
      myParticipantRecord,
      myRoleInRoom
    });
  } catch (err) {
    console.error('Error verifying room:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Anti-Cheating Violation Logger & Automatic Ejection
router.post('/:id/violation', authenticateUser, (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, violationType, details } = req.body;

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    // Resolve student info
    let targetStudentId = studentId;
    let validStudentProfileId = null;
    let sName = 'Candidate';
    let sEmail = req.user.email || 'candidate@gsfcuniversity.ac.in';

    if (targetStudentId) {
      const sp = db.prepare('SELECT id, name, user_id FROM student_profiles WHERE id = ?').get(targetStudentId);
      if (sp) {
        validStudentProfileId = sp.id;
        sName = sp.name;
        const u = db.prepare('SELECT email FROM users WHERE id = ?').get(sp.user_id);
        if (u?.email) sEmail = u.email;
      }
    }

    if (!validStudentProfileId && req.user.id) {
      const sp = db.prepare('SELECT id, name, user_id FROM student_profiles WHERE user_id = ?').get(req.user.id);
      if (sp) {
        validStudentProfileId = sp.id;
        sName = sp.name;
        const u = db.prepare('SELECT email FROM users WHERE id = ?').get(sp.user_id);
        if (u?.email) sEmail = u.email;
      } else {
        const anySp = db.prepare('SELECT id, name, user_id FROM student_profiles LIMIT 1').get();
        if (anySp) {
          validStudentProfileId = anySp.id;
          sName = anySp.name;
        }
      }
    }

    const vType = violationType || 'tab_switch';
    const vDetails = details || 'Candidate left meeting tab / minimized window.';
    const violationId = 'viol_' + uuidv4().slice(0, 8);

    db.prepare(`
      INSERT INTO meeting_violations (id, meeting_id, student_id, student_name, student_email, violation_type, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(violationId, id, validStudentProfileId, sName, sEmail, vType, vDetails);

    // Mark student participant as ejected
    db.prepare(`
      UPDATE meeting_participants
      SET join_status = 'ejected',
          left_at = CURRENT_TIMESTAMP,
          outcome_status = 'rejected',
          interviewer_notes = ?
      WHERE meeting_id = ? AND (student_id = ? OR user_id = ?)
    `).run(`[FLAGGED & DISQUALIFIED]: ${vType} - ${vDetails}`, id, validStudentProfileId, req.user.id);


    res.json({
      success: true,
      message: '🚨 Anti-cheating violation recorded and session terminated.',
      violation_id: violationId,
      violation_type: vType,
      student_name: sName,
      occurred_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error logging violation:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Save Recruiter Outcome Marks (Selected / Rejected / Hold / No-Show)
router.post('/:id/outcome', authenticateUser, (req, res) => {
  try {
    const { id } = req.params;
    const { outcomes, summaryNotes } = req.body;

    if (req.user.role !== 'company' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Unauthorized: Only recruiters or TPC Admin can record candidate outcomes.' });
    }

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    if (Array.isArray(outcomes)) {
      const updatePartStmt = db.prepare(`
        UPDATE meeting_participants
        SET outcome_status = ?,
            interviewer_notes = ?,
            evaluation_score = ?
        WHERE meeting_id = ? AND (student_id = ? OR user_id = ?)
      `);

      const updateAppStmt = db.prepare(`
        UPDATE applications
        SET status = ?,
            evaluation_notes = ?,
            evaluation_score = ?
        WHERE requirement_id = ? AND student_id = ?
      `);

      for (const item of outcomes) {
        const { studentId, outcomeStatus, notes, score } = item;
        if (studentId && outcomeStatus) {
          updatePartStmt.run(outcomeStatus, notes || '', score || 0, id, studentId, studentId);

          // If valid outcome status, sync back to applications table
          let appStatus = 'interview';
          if (outcomeStatus === 'selected') appStatus = 'selected';
          else if (outcomeStatus === 'rejected') appStatus = 'rejected';
          else if (outcomeStatus === 'hold') appStatus = 'shortlisted';

          updateAppStmt.run(appStatus, notes || `Interview Result: ${outcomeStatus}`, score || 0, meeting.drive_id, studentId);
        }
      }
    }

    if (summaryNotes) {
      db.prepare('UPDATE meetings SET summary_notes = ? WHERE id = ?').run(summaryNotes, id);
    }

    res.json({ success: true, message: 'Candidate interview outcomes successfully recorded and synchronized with applications.' });
  } catch (err) {
    console.error('Error saving outcomes:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. End Meeting for All
router.post('/:id/end', authenticateUser, (req, res) => {
  try {
    const { id } = req.params;
    const { summaryNotes, outcomes } = req.body;

    if (req.user.role !== 'company' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only interviewers or administrators can end the live meeting.' });
    }

    db.prepare(`
      UPDATE meetings 
      SET status = 'completed',
          ended_at = CURRENT_TIMESTAMP,
          summary_notes = COALESCE(?, summary_notes)
      WHERE id = ?
    `).run(summaryNotes || null, id);

    // Save final outcomes if provided
    if (Array.isArray(outcomes) && outcomes.length > 0) {
      const updatePartStmt = db.prepare(`
        UPDATE meeting_participants
        SET outcome_status = ?,
            interviewer_notes = ?,
            evaluation_score = ?
        WHERE meeting_id = ? AND (student_id = ? OR user_id = ?)
      `);

      const updateAppStmt = db.prepare(`
        UPDATE applications
        SET status = ?,
            evaluation_notes = ?,
            evaluation_score = ?
        WHERE requirement_id = (SELECT drive_id FROM meetings WHERE id = ?) AND student_id = ?
      `);

      for (const item of outcomes) {
        if (item.studentId && item.outcomeStatus) {
          updatePartStmt.run(item.outcomeStatus, item.notes || '', item.score || 0, id, item.studentId, item.studentId);
          let appStatus = item.outcomeStatus === 'selected' ? 'selected' : (item.outcomeStatus === 'rejected' ? 'rejected' : 'shortlisted');
          updateAppStmt.run(appStatus, item.notes || '', item.score || 0, id, item.studentId);
        }
      }
    }

    res.json({ success: true, message: 'Meeting has been concluded and archived.' });
  } catch (err) {
    console.error('Error ending meeting:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Fetch Violations Log for a Meeting
router.get('/:id/violations', authenticateUser, (req, res) => {
  try {
    const { id } = req.params;
    const violations = db.prepare(`
      SELECT * FROM meeting_violations
      WHERE meeting_id = ?
      ORDER BY occurred_at DESC
    `).all(id);

    res.json(violations);
  } catch (err) {
    console.error('Error fetching violations:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
