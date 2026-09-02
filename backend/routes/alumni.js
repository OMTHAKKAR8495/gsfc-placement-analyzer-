import express from 'express';
import db from '../db/index.js';
import { AuthRateLimiter, sanitizeXss } from '../middleware/security.js';

const router = express.Router();

// Auto-initialize Mentorship Booking & Review Tables
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS alumni_mentorship_slots (
      id TEXT PRIMARY KEY,
      alumni_id TEXT NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      topic_focus TEXT DEFAULT 'General Career & Technical Mentorship',
      is_booked INTEGER DEFAULT 0,
      booked_student_id TEXT,
      booked_student_name TEXT,
      meeting_link TEXT,
      session_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alumni_mentor_reviews (
      id TEXT PRIMARY KEY,
      alumni_id TEXT NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      feedback TEXT NOT NULL,
      session_topic TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch(e) {
  console.warn('Alumni mentorship tables notice:', e.message);
}

// 1. Get Alumni Profile (by userId or alumniId)
router.get('/profile', (req, res) => {
  try {
    const { userId, alumniId } = req.query;
    let profile = null;

    if (alumniId) {
      profile = db.prepare(`
        SELECT a.*, u.email 
        FROM alumni_profiles a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
      `).get(alumniId);
    } else if (userId) {
      profile = db.prepare(`
        SELECT a.*, u.email 
        FROM alumni_profiles a
        JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ?
      `).get(userId);
    }

    if (!profile) {
      return res.status(404).json({ error: 'Alumni profile not found.' });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Register / Setup Alumni Profile
router.post('/register', AuthRateLimiter.registerLimiter, (req, res) => {
  try {
    const { user_id, name, batch_year, company, designation, linkedin_url, bio } = req.body;
    if (!user_id || !name) {
      return res.status(400).json({ error: 'user_id and name are required.' });
    }

    const existing = db.prepare('SELECT id FROM alumni_profiles WHERE user_id = ?').get(user_id);
    if (existing) {
      return res.status(400).json({ error: 'Alumni profile already exists for this user.' });
    }

    const alumniId = 'alumni_' + Date.now();
    db.prepare(`
      INSERT INTO alumni_profiles (id, user_id, name, batch_year, company, designation, linkedin_url, bio, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      alumniId,
      user_id,
      sanitizeXss(name),
      sanitizeXss(batch_year || '2020-2024'),
      sanitizeXss(company || ''),
      sanitizeXss(designation || ''),
      sanitizeXss(linkedin_url || ''),
      sanitizeXss(bio || ''),
      1
    );

    const created = db.prepare('SELECT * FROM alumni_profiles WHERE id = ?').get(alumniId);
    res.status(201).json({ success: true, profile: created, message: 'Alumni profile created!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Alumni Profile
router.put('/profile', (req, res) => {
  try {
    const { id, name, company, designation, linkedin_url, bio, batch_year } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Alumni profile id is required.' });
    }

    db.prepare(`
      UPDATE alumni_profiles
      SET name = COALESCE(?, name),
          company = COALESCE(?, company),
          designation = COALESCE(?, designation),
          linkedin_url = COALESCE(?, linkedin_url),
          bio = COALESCE(?, bio),
          batch_year = COALESCE(?, batch_year)
      WHERE id = ?
    `).run(
      name ? sanitizeXss(name) : null,
      company ? sanitizeXss(company) : null,
      designation ? sanitizeXss(designation) : null,
      linkedin_url ? sanitizeXss(linkedin_url) : null,
      bio ? sanitizeXss(bio) : null,
      batch_year ? sanitizeXss(batch_year) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM alumni_profiles WHERE id = ?').get(id);
    res.json({ success: true, profile: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------------
// 4. MENTORSHIP MATCHING ENGINE (Student-Mentor Semantic Scoring)
// ---------------------------------------------------------------------------------
router.get('/match-mentors', (req, res) => {
  try {
    const { student_id, target_company = '', branch = 'CSE' } = req.query;

    let student = null;
    if (student_id) {
      student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(student_id);
    }

    const cleanTargetCompany = (target_company || '').trim().toLowerCase();
    const cleanBranch = (branch || student?.program || student?.branch || 'CSE').toLowerCase();

    // Fetch all verified alumni mentors with average rating and available slots
    const mentors = db.prepare(`
      SELECT 
        a.*,
        u.email,
        (SELECT COUNT(*) FROM alumni_mentorship_slots s WHERE s.alumni_id = a.id AND s.is_booked = 0) as available_slots_count,
        (SELECT AVG(r.rating) FROM alumni_mentor_reviews r WHERE r.alumni_id = a.id) as avg_rating,
        (SELECT COUNT(*) FROM alumni_mentor_reviews r WHERE r.alumni_id = a.id) as reviews_count
      FROM alumni_profiles a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.verified DESC, a.created_at DESC
    `).all();

    const rankedMentors = mentors.map(m => {
      const mComp = (m.company || '').toLowerCase();
      const mBio = (m.bio || '').toLowerCase();
      const mDesig = (m.designation || '').toLowerCase();
      const avgRating = Number(m.avg_rating) || 4.8;
      const reviewsCount = Number(m.reviews_count) || 0;

      // Match Scoring Dimensions:
      // 1. Target Company Match (40% weight)
      let companyMatchScore = 35;
      if (cleanTargetCompany && mComp.includes(cleanTargetCompany)) {
        companyMatchScore = 100;
      } else if (cleanTargetCompany && (mBio.includes(cleanTargetCompany) || mDesig.includes(cleanTargetCompany))) {
        companyMatchScore = 80;
      } else if (mComp.includes('google') || mComp.includes('amazon') || mComp.includes('microsoft') || mComp.includes('gsfc')) {
        companyMatchScore = 70;
      }

      // 2. Branch & Domain Match (30% weight)
      let domainMatchScore = 50;
      if (cleanBranch.includes('cse') || cleanBranch.includes('computer') || cleanBranch.includes('it')) {
        if (mDesig.includes('software') || mDesig.includes('engineer') || mDesig.includes('cloud') || mDesig.includes('ai') || mDesig.includes('data')) {
          domainMatchScore = 95;
        }
      } else if (cleanBranch.includes('chemical') && (mComp.includes('gsfc') || mComp.includes('reliance') || mBio.includes('chemical'))) {
        domainMatchScore = 95;
      } else if (cleanBranch.includes('mechanical') && (mDesig.includes('cad') || mDesig.includes('manufacturing') || mBio.includes('mechanical'))) {
        domainMatchScore = 95;
      }

      // 3. Reputation & Review Score (20% weight)
      const reputationScore = Math.min(100, Math.round((avgRating / 5) * 100));

      // 4. Booking Availability (10% weight)
      const availabilityScore = m.available_slots_count > 0 ? 100 : 40;

      const totalMatchPct = Math.round(
        (companyMatchScore * 0.40) +
        (domainMatchScore * 0.30) +
        (reputationScore * 0.20) +
        (availabilityScore * 0.10)
      );

      const matchReasons = [];
      if (companyMatchScore >= 80) matchReasons.push(`Direct insider at ${m.company}`);
      if (domainMatchScore >= 80) matchReasons.push(`Specialist in ${m.designation || 'Engineering'}`);
      if (avgRating >= 4.7) matchReasons.push(`Top-Rated Mentor (★ ${avgRating.toFixed(1)})`);

      return {
        id: m.id,
        name: m.name,
        company: m.company || 'Industry Leader',
        designation: m.designation || 'Senior Software Engineer',
        batch_year: m.batch_year || '2020-2024',
        bio: m.bio || 'Passionate about guiding GSFC University juniors through campus recruitment and technical interviews.',
        linkedin_url: m.linkedin_url || '',
        verified: m.verified === 1,
        matchPercentage: totalMatchPct,
        matchReasons: matchReasons.slice(0, 3),
        averageRating: Number(avgRating.toFixed(1)),
        reviewsCount,
        availableSlotsCount: m.available_slots_count
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      totalMentors: rankedMentors.length,
      targetCompany: cleanTargetCompany || 'All Companies',
      branch: cleanBranch,
      mentors: rankedMentors
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------------
// 5. MENTORSHIP 1:1 SLOTS & BOOKING API
// ---------------------------------------------------------------------------------
router.get('/slots', (req, res) => {
  try {
    const { alumni_id } = req.query;
    if (!alumni_id) {
      return res.status(400).json({ error: 'alumni_id is required' });
    }

    let slots = db.prepare(`
      SELECT * FROM alumni_mentorship_slots 
      WHERE alumni_id = ? 
      ORDER BY is_booked ASC, created_at DESC
    `).all(alumni_id);

    // Auto-seed default availability if mentor has no slots
    if (slots.length === 0) {
      const defaultSlots = [
        { id: `slot_${alumni_id}_1`, day: 'Saturday', start: '10:00 AM', end: '10:45 AM', topic: 'Resume Architecture & ATS Review' },
        { id: `slot_${alumni_id}_2`, day: 'Saturday', start: '04:00 PM', end: '04:45 PM', topic: 'System Design & Coding Mock Interview' },
        { id: `slot_${alumni_id}_3`, day: 'Sunday', start: '11:00 AM', end: '11:45 AM', topic: 'Company Technical Round Deep-Dive' }
      ];

      for (const ds of defaultSlots) {
        db.prepare(`
          INSERT INTO alumni_mentorship_slots (id, alumni_id, day_of_week, start_time, end_time, topic_focus, is_booked)
          VALUES (?, ?, ?, ?, ?, ?, 0)
        `).run(ds.id, alumni_id, ds.day, ds.start, ds.end, ds.topic);
      }

      slots = db.prepare('SELECT * FROM alumni_mentorship_slots WHERE alumni_id = ?').all(alumni_id);
    }

    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/slots/book', (req, res) => {
  try {
    const { slot_id, student_id, student_name, topic, notes } = req.body;
    if (!slot_id || !student_id) {
      return res.status(400).json({ error: 'slot_id and student_id are required' });
    }

    const slot = db.prepare('SELECT * FROM alumni_mentorship_slots WHERE id = ?').get(slot_id);
    if (!slot) {
      return res.status(404).json({ error: 'Mentorship slot not found' });
    }
    if (slot.is_booked === 1) {
      return res.status(400).json({ error: 'This slot has already been booked by another student' });
    }

    const meetingRoomId = `meet_alumni_${Date.now()}`;
    const meetingLink = `/#meeting/${meetingRoomId}`;

    db.prepare(`
      UPDATE alumni_mentorship_slots 
      SET is_booked = 1,
          booked_student_id = ?,
          booked_student_name = ?,
          meeting_link = ?,
          session_notes = ?
      WHERE id = ?
    `).run(student_id, student_name || 'Candidate', meetingLink, notes || topic || '', slot_id);

    // Create unified meeting record
    try {
      db.prepare(`
        INSERT INTO meetings (id, title, host_name, host_role, participant_name, participant_id, status, scheduled_time, room_id)
        VALUES (?, ?, ?, 'alumni', ?, ?, 'scheduled', ?, ?)
      `).run(
        `m_${Date.now()}`,
        `1:1 Alumni Mentorship: ${topic || slot.topic_focus}`,
        'Alumni Mentor',
        student_name || 'Candidate',
        student_id,
        `${slot.day_of_week} ${slot.start_time}`,
        meetingRoomId
      );
    } catch(e) {}

    res.json({
      success: true,
      message: '1:1 Mentorship Session Confirmed!',
      slotId: slot_id,
      meetingLink,
      scheduledTime: `${slot.day_of_week} at ${slot.start_time}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------------
// 6. MENTOR REVIEWS & REPUTATION API
// ---------------------------------------------------------------------------------
router.post('/reviews', (req, res) => {
  try {
    const { alumni_id, student_id, student_name, rating, feedback, session_topic } = req.body;
    if (!alumni_id || !student_id || !rating || !feedback) {
      return res.status(400).json({ error: 'alumni_id, student_id, rating, and feedback are required' });
    }

    const reviewId = 'rev_' + Date.now();
    db.prepare(`
      INSERT INTO alumni_mentor_reviews (id, alumni_id, student_id, student_name, rating, feedback, session_topic)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId,
      alumni_id,
      student_id,
      sanitizeXss(student_name || 'Verified Student'),
      Math.min(5, Math.max(1, Number(rating))),
      sanitizeXss(feedback),
      sanitizeXss(session_topic || '1:1 Mentorship')
    );

    res.status(201).json({ success: true, message: 'Review submitted successfully!', reviewId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/reviews', (req, res) => {
  try {
    const { id } = req.params;
    const reviews = db.prepare(`
      SELECT * FROM alumni_mentor_reviews 
      WHERE alumni_id = ? 
      ORDER BY created_at DESC
    `).all(id);

    const avg = reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 5.0;

    res.json({
      alumniId: id,
      averageRating: avg,
      totalReviews: reviews.length,
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------------
// 7. MENTORSHIP COMMUNITY FEED POSTS
// ---------------------------------------------------------------------------------
router.post('/posts', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { alumni_id, title, content, tags } = req.body;
    if (!alumni_id || !title || !content) {
      return res.status(400).json({ error: 'alumni_id, title, and content are required.' });
    }

    const postId = 'post_' + Date.now();
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags.map(t => sanitizeXss(t)) : ['Mentorship', 'Career']);

    db.prepare(`
      INSERT INTO mentorship_posts (id, alumni_id, title, content, tags_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(postId, alumni_id, sanitizeXss(title), sanitizeXss(content), tagsJson);

    const createdPost = db.prepare(`
      SELECT p.*, a.name as author_name, a.company as author_company, a.designation as author_designation, a.verified as author_verified
      FROM mentorship_posts p
      JOIN alumni_profiles a ON p.alumni_id = a.id
      WHERE p.id = ?
    `).get(postId);

    res.status(201).json({ success: true, post: createdPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts', (req, res) => {
  try {
    const { search, tag } = req.query;
    let query = `
      SELECT 
        p.*,
        a.name as author_name,
        a.company as author_company,
        a.designation as author_designation,
        a.linkedin_url as author_linkedin,
        a.verified as author_verified,
        a.batch_year as author_batch,
        (SELECT COUNT(*) FROM mentorship_comments c WHERE c.post_id = p.id) as comments_count
      FROM mentorship_posts p
      JOIN alumni_profiles a ON p.alumni_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (LOWER(p.title) LIKE ? OR LOWER(p.content) LIKE ? OR LOWER(a.name) LIKE ? OR LOWER(a.company) LIKE ?)`;
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    if (tag && tag.trim()) {
      query += ` AND p.tags_json LIKE ?`;
      params.push(`%${tag.trim()}%`);
    }

    query += ` ORDER BY p.created_at DESC`;

    const posts = db.prepare(query).all(...params).map(p => ({
      ...p,
      tags: (() => {
        try { return JSON.parse(p.tags_json || '[]'); } catch (e) { return []; }
      })()
    }));

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts/:id/comments', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { id: postId } = req.params;
    const { author_id, author_name, author_role, content } = req.body;

    if (!postId || !author_id || !content) {
      return res.status(400).json({ error: 'postId, author_id, and content are required.' });
    }

    const commentId = 'comm_' + Date.now();
    db.prepare(`
      INSERT INTO mentorship_comments (id, post_id, author_id, author_name, author_role, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      commentId,
      postId,
      author_id,
      sanitizeXss(author_name || 'Community Member'),
      author_role || 'student',
      sanitizeXss(content)
    );

    const createdComment = db.prepare('SELECT * FROM mentorship_comments WHERE id = ?').get(commentId);
    res.status(201).json({ success: true, comment: createdComment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/posts/:id/comments', (req, res) => {
  try {
    const { id: postId } = req.params;
    const comments = db.prepare(`
      SELECT * FROM mentorship_comments
      WHERE post_id = ?
      ORDER BY created_at ASC
    `).all(postId);

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
