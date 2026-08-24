import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campushire_secret_key_2026';
const uuidv4 = () => crypto.randomUUID();

// Ensure Tables Exist
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gamification_rules (
      action_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      points_reward INTEGER DEFAULT 25,
      badge_code TEXT,
      badge_name TEXT,
      badge_icon TEXT,
      badge_desc TEXT,
      threshold INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS student_gamification (
      student_id TEXT PRIMARY KEY,
      points_total INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      current_streak INTEGER DEFAULT 1,
      nickname TEXT,
      is_anonymous INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_badges (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      badge_code TEXT NOT NULL,
      badge_name TEXT NOT NULL,
      badge_icon TEXT NOT NULL,
      badge_desc TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, badge_code)
    );

    CREATE TABLE IF NOT EXISTS gamification_points_log (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      action_key TEXT NOT NULL,
      points_awarded INTEGER NOT NULL,
      description TEXT,
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch (e) {
  console.error('Gamification table creation error:', e.message);
}

// Default Gamification Action Rules

const DEFAULT_RULES = [
  { action_key: 'profile_complete', label: 'Complete Student Profile', points_reward: 50, badge_code: 'badge_profile_pro', badge_name: 'Profile Architect 🏛️', badge_icon: 'UserCheck', badge_desc: 'Completed all personal, academic, and contact profile fields.', threshold: 1 },
  { action_key: 'resume_upload', label: 'Upload & Parse ATS Resume', points_reward: 100, badge_code: 'badge_resume_ready', badge_name: 'Resume Ready 📄', badge_icon: 'FileText', badge_desc: 'Uploaded an ATS-compliant resume with extracted skills.', threshold: 1 },
  { action_key: 'ats_score_80', label: 'Achieve ATS Score ≥ 80%', points_reward: 75, badge_code: 'badge_ats_master', badge_name: 'ATS Champion 🎯', badge_icon: 'Award', badge_desc: 'Scored 80% or higher on the AI ATS resume matcher.', threshold: 1 },
  { action_key: 'job_application', label: 'Apply to Placement Drive', points_reward: 40, badge_code: 'badge_first_app', badge_name: 'First Application 🚀', badge_icon: 'Send', badge_desc: 'Submitted official application to a campus placement drive.', threshold: 1 },
  { action_key: 'mock_interview', label: 'Complete AI Mock Interview', points_reward: 80, badge_code: 'badge_interview_pro', badge_name: 'Interview Pro 🎙️', badge_icon: 'Cpu', badge_desc: 'Completed a full technical round with Gemini AI interview coach.', threshold: 1 },
  { action_key: 'qa_contribution', label: 'Ask or Answer on Q&A Board', points_reward: 30, badge_code: 'badge_community_star', badge_name: 'Community Star 💬', badge_icon: 'MessageSquare', badge_desc: 'Contributed knowledge and answered student queries on Q&A board.', threshold: 1 },
  { action_key: 'job_fair_attend', label: 'Register for Job Fair / Tech Fest', points_reward: 60, badge_code: 'badge_campus_explorer', badge_name: 'Campus Explorer 🎪', badge_icon: 'Compass', badge_desc: 'Obtained verified QR pass for university job fair / symposium.', threshold: 1 },
  { action_key: 'placement_ready', label: 'Placement Readiness ≥ 85%', points_reward: 150, badge_code: 'badge_placement_ready', badge_name: 'Placement Ready 🏆', badge_icon: 'Sparkles', badge_desc: 'Achieved complete placement readiness and top-tier score across all dimensions.', threshold: 1 }
];

// Seed default rules on startup
export function seedGamificationRules() {
  try {
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO gamification_rules (action_key, label, points_reward, badge_code, badge_name, badge_icon, badge_desc, threshold)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of DEFAULT_RULES) {
      insertStmt.run(r.action_key, r.label, r.points_reward, r.badge_code, r.badge_name, r.badge_icon, r.badge_desc, r.threshold);
    }
  } catch (e) {
    console.error('Gamification rules seed notice:', e.message);
  }
}
seedGamificationRules();

// Helper: Calculate Level from Total Points
export function calculateLevel(points) {
  if (points >= 900) return { level: 5, title: 'Placement Grandmaster', nextLevelPoints: 1200, progress: 100 };
  if (points >= 600) return { level: 4, title: 'Interview Pro', nextLevelPoints: 900, progress: Math.round(((points - 600) / 300) * 100) };
  if (points >= 350) return { level: 3, title: 'Career Candidate', nextLevelPoints: 600, progress: Math.round(((points - 350) / 250) * 100) };
  if (points >= 150) return { level: 2, title: 'Active Explorer', nextLevelPoints: 350, progress: Math.round(((points - 150) / 200) * 100) };
  return { level: 1, title: 'Campus Novice', nextLevelPoints: 150, progress: Math.round((points / 150) * 100) };
}

// Core Function: Award Points & Badges to a Student
export function awardGamificationPoints(studentId, actionKey, customDesc = null, metadata = {}) {
  try {
    if (!studentId) return null;

    // Resolve student record
    let student = db.prepare('SELECT id, name, roll_number, program, branch FROM student_profiles WHERE id = ? OR user_id = ?').get(studentId, studentId);
    if (!student) {
      student = db.prepare('SELECT id, name, roll_number, program, branch FROM student_profiles LIMIT 1').get();
    }
    if (!student) return null;

    const realStudentId = student.id;

    // Get rule definition
    const rule = db.prepare('SELECT * FROM gamification_rules WHERE action_key = ?').get(actionKey);
    const pointsAwarded = rule?.points_reward || 25;
    const desc = customDesc || rule?.label || `Earned points for ${actionKey}`;

    // 1. Log Points Transaction
    db.prepare(`
      INSERT INTO gamification_points_log (id, student_id, action_key, points_awarded, description, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('pt_' + uuidv4().slice(0, 8), realStudentId, actionKey, pointsAwarded, desc, JSON.stringify(metadata));

    // 2. Update or Insert student_gamification
    let gamRec = db.prepare('SELECT * FROM student_gamification WHERE student_id = ?').get(realStudentId);
    if (!gamRec) {
      db.prepare(`
        INSERT INTO student_gamification (student_id, points_total, level, current_streak, nickname)
        VALUES (?, ?, 1, 1, ?)
      `).run(realStudentId, pointsAwarded, student.name.split(' ')[0] + '_' + Math.floor(100 + Math.random() * 900));
      gamRec = { points_total: pointsAwarded, level: 1 };
    } else {
      const newTotal = (gamRec.points_total || 0) + pointsAwarded;
      const levelInfo = calculateLevel(newTotal);
      db.prepare(`
        UPDATE student_gamification 
        SET points_total = ?, level = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ?
      `).run(newTotal, levelInfo.level, realStudentId);
      gamRec.points_total = newTotal;
      gamRec.level = levelInfo.level;
    }

    // 3. Check & Unlock Badge if rule has associated badge
    let newlyUnlockedBadge = null;
    if (rule?.badge_code) {
      const existingBadge = db.prepare('SELECT id FROM student_badges WHERE student_id = ? AND badge_code = ?').get(realStudentId, rule.badge_code);
      if (!existingBadge) {
        const badgeId = 'bdg_' + uuidv4().slice(0, 8);
        db.prepare(`
          INSERT INTO student_badges (id, student_id, badge_code, badge_name, badge_icon, badge_desc, category)
          VALUES (?, ?, ?, ?, ?, ?, 'Achievements')
        `).run(badgeId, realStudentId, rule.badge_code, rule.badge_name || rule.label, rule.badge_icon || 'Award', rule.badge_desc || desc);
        newlyUnlockedBadge = { id: badgeId, code: rule.badge_code, name: rule.badge_name, icon: rule.badge_icon };
      }
    }

    return {
      pointsAwarded,
      newTotal: gamRec.points_total,
      level: gamRec.level,
      newlyUnlockedBadge
    };
  } catch (err) {
    console.error('Error awarding gamification points:', err);
    return null;
  }
}

// 1. Get Gamification Summary for a Student
router.get('/summary/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    
    let student = db.prepare('SELECT id, name, roll_number, program, branch, cgpa, ats_score FROM student_profiles WHERE id = ? OR user_id = ?').get(studentId, studentId);
    if (!student) {
      student = db.prepare('SELECT id, name, roll_number, program, branch, cgpa, ats_score FROM student_profiles LIMIT 1').get();
    }
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    let gamRec = db.prepare('SELECT * FROM student_gamification WHERE student_id = ?').get(student.id);
    if (!gamRec) {
      // Auto-calculate initial points based on student achievements
      let initialPoints = 150;
      if (student.ats_score && student.ats_score >= 80) initialPoints += 175;
      
      const appsCount = db.prepare('SELECT count(*) as count FROM applications WHERE student_id = ?').get(student.id)?.count || 0;
      initialPoints += appsCount * 40;

      const levelInfo = calculateLevel(initialPoints);
      db.prepare(`
        INSERT OR IGNORE INTO student_gamification (student_id, points_total, level, current_streak, nickname)
        VALUES (?, ?, ?, 3, ?)
      `).run(student.id, initialPoints, levelInfo.level, student.name.split(' ')[0] + '_Explorer');
      
      // Auto-grant initial badge
      db.prepare(`
        INSERT OR IGNORE INTO student_badges (id, student_id, badge_code, badge_name, badge_icon, badge_desc)
        VALUES (?, ?, 'badge_resume_ready', 'Resume Ready 📄', 'FileText', 'Uploaded an ATS-compliant resume with extracted skills.')
      `).run('bdg_init_' + student.id, student.id);

      if (appsCount > 0) {
        db.prepare(`
          INSERT OR IGNORE INTO student_badges (id, student_id, badge_code, badge_name, badge_icon, badge_desc)
          VALUES (?, ?, 'badge_first_app', 'First Application 🚀', 'Send', 'Submitted official application to a campus placement drive.')
        `).run('bdg_app_' + student.id, student.id);
      }

      gamRec = { student_id: student.id, points_total: initialPoints, level: levelInfo.level, current_streak: 3, is_anonymous: 0 };
    }

    const points = gamRec.points_total || 0;
    const levelInfo = calculateLevel(points);

    // Get all unlocked badges
    const badges = db.prepare('SELECT * FROM student_badges WHERE student_id = ? ORDER BY unlocked_at DESC').all(student.id);

    // Get all available system badges
    const allRules = db.prepare('SELECT * FROM gamification_rules ORDER BY points_reward ASC').all();
    const badgeCatalog = allRules.map(r => {
      const isUnlocked = badges.some(b => b.badge_code === r.badge_code);
      return {
        badge_code: r.badge_code,
        badge_name: r.badge_name || r.label,
        badge_icon: r.badge_icon || 'Award',
        badge_desc: r.badge_desc,
        points_reward: r.points_reward,
        is_unlocked: isUnlocked
      };
    });

    // Recent Activity Log
    const recentLogs = db.prepare('SELECT * FROM gamification_points_log WHERE student_id = ? ORDER BY created_at DESC LIMIT 8').all(student.id);

    // Leaderboard Rank
    const higherCount = db.prepare('SELECT count(*) as count FROM student_gamification WHERE points_total > ?').get(points)?.count || 0;
    const rank = higherCount + 1;

    res.json({
      student_id: student.id,
      student_name: student.name,
      points_total: points,
      level: levelInfo.level,
      level_title: levelInfo.title,
      next_level_points: levelInfo.nextLevelPoints,
      progress_pct: levelInfo.progress,
      current_streak: gamRec.current_streak || 1,
      rank,
      is_anonymous: gamRec.is_anonymous === 1,
      nickname: gamRec.nickname || (student.name.split(' ')[0] + '_Pro'),
      badges,
      badge_catalog: badgeCatalog,
      recent_logs: recentLogs
    });
  } catch (err) {
    console.error('Error fetching gamification summary:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Placement Readiness Leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const { department, year, limit = 50 } = req.query;

    let query = `
      SELECT 
        s.id as student_id,
        s.name as student_name,
        s.roll_number,
        s.program,
        s.branch,
        s.cgpa,
        s.ats_score,
        COALESCE(g.points_total, (s.ats_score * 5 + 150)) as points_total,
        COALESCE(g.level, 2) as level,
        COALESCE(g.current_streak, 2) as current_streak,
        COALESCE(g.is_anonymous, 0) as is_anonymous,
        COALESCE(g.nickname, SUBSTR(s.name, 1, 1) || '*** ' || s.branch) as nickname,
        (SELECT count(*) FROM student_badges b WHERE b.student_id = s.id) as badge_count
      FROM student_profiles s
      LEFT JOIN student_gamification g ON s.id = g.student_id
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'All') {
      query += ` AND (s.program LIKE ? OR s.branch LIKE ?)`;
      params.push(`%${department}%`, `%${department}%`);
    }

    if (year && year !== 'All') {
      query += ` AND (s.passing_year = ? OR s.admission_year = ?)`;
      params.push(year, year);
    }

    query += ` ORDER BY points_total DESC, s.cgpa DESC LIMIT ?`;
    params.push(parseInt(limit, 10) || 50);

    const rows = db.prepare(query).all(...params);

    const formatted = rows.map((r, idx) => {
      const levelInfo = calculateLevel(r.points_total);
      return {
        rank: idx + 1,
        student_id: r.student_id,
        display_name: r.is_anonymous === 1 ? (r.nickname || `Candidate #${idx + 1}`) : r.student_name,
        is_anonymous: r.is_anonymous === 1,
        roll_number: r.is_anonymous === 1 ? 'PROTECTED' : r.roll_number,
        program: r.program,
        branch: r.branch,
        cgpa: r.cgpa,
        ats_score: r.ats_score || 88,
        points_total: r.points_total,
        level: levelInfo.level,
        level_title: levelInfo.title,
        streak_days: r.current_streak || 1,
        badge_count: r.badge_count || 1
      };
    });

    res.json({
      leaderboard: formatted,
      total_candidates: formatted.length,
      top_performer: formatted[0] || null
    });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Trigger Points Award for Action
router.post('/award', (req, res) => {
  try {
    const { studentId, actionKey, customDesc, metadata } = req.body;
    if (!studentId || !actionKey) {
      return res.status(400).json({ error: 'studentId and actionKey are required.' });
    }

    const result = awardGamificationPoints(studentId, actionKey, customDesc, metadata);
    if (!result) {
      return res.status(400).json({ error: 'Could not award points. Invalid student or action.' });
    }

    res.json({
      success: true,
      message: `🎉 +${result.pointsAwarded} Placement Points Awarded!`,
      ...result
    });
  } catch (err) {
    console.error('Error triggering award:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Toggle Leaderboard Anonymity Setting
router.post('/toggle-anonymity', (req, res) => {
  try {
    const { studentId, isAnonymous, nickname } = req.body;
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required.' });
    }

    let student = db.prepare('SELECT id, name FROM student_profiles WHERE id = ? OR user_id = ?').get(studentId, studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const anonVal = isAnonymous ? 1 : 0;
    const nickVal = nickname || (student.name.split(' ')[0] + '_' + Math.floor(100 + Math.random() * 900));

    db.prepare(`
      INSERT INTO student_gamification (student_id, is_anonymous, nickname, points_total, level)
      VALUES (?, ?, ?, 150, 1)
      ON CONFLICT(student_id) DO UPDATE SET
        is_anonymous = excluded.is_anonymous,
        nickname = excluded.nickname,
        updated_at = CURRENT_TIMESTAMP
    `).run(student.id, anonVal, nickVal);

    res.json({
      success: true,
      is_anonymous: anonVal === 1,
      nickname: nickVal,
      message: anonVal === 1 ? '🎭 Leaderboard privacy enabled: your identity is protected by an avatar nickname.' : '🌟 Public display enabled: your verified name is visible on the leaderboard.'
    });
  } catch (err) {
    console.error('Error toggling anonymity:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Admin: Get all Gamification Rules
router.get('/admin/rules', (req, res) => {
  try {
    const rules = db.prepare('SELECT * FROM gamification_rules ORDER BY points_reward ASC').all();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Admin: Update Gamification Rule Points & Thresholds
router.put('/admin/rules/:actionKey', (req, res) => {
  try {
    const { actionKey } = req.params;
    const { points_reward, label, badge_name, badge_desc } = req.body;

    db.prepare(`
      UPDATE gamification_rules 
      SET points_reward = COALESCE(?, points_reward),
          label = COALESCE(?, label),
          badge_name = COALESCE(?, badge_name),
          badge_desc = COALESCE(?, badge_desc),
          updated_at = CURRENT_TIMESTAMP
      WHERE action_key = ?
    `).run(points_reward, label, badge_name, badge_desc, actionKey);

    res.json({ success: true, message: `Rule ${actionKey} updated successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
