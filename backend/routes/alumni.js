import express from 'express';
import db from '../db/index.js';
import { AuthRateLimiter, sanitizeXss } from '../middleware/security.js';

const router = express.Router();

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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      alumniId,
      user_id,
      sanitizeXss(name),
      sanitizeXss(batch_year || '2020-2024'),
      sanitizeXss(company || ''),
      sanitizeXss(designation || ''),
      sanitizeXss(linkedin_url || ''),
      sanitizeXss(bio || ''),
      0 // Awaiting TPO verification
    );

    const created = db.prepare('SELECT * FROM alumni_profiles WHERE id = ?').get(alumniId);
    res.status(201).json({ success: true, profile: created, message: 'Alumni profile created! Pending TPO verification.' });
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

// 4. Create Mentorship Post (Verified Alumni or Admin)
router.post('/posts', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { alumni_id, title, content, tags } = req.body;
    if (!alumni_id || !title || !content) {
      return res.status(400).json({ error: 'alumni_id, title, and content are required.' });
    }

    // Verify alumni profile exists
    const alumni = db.prepare('SELECT * FROM alumni_profiles WHERE id = ?').get(alumni_id);
    if (!alumni) {
      return res.status(404).json({ error: 'Alumni profile not found.' });
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

// 5. Get All Mentorship Posts (with comment counts and author metadata)
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

// 6. Add Comment on Mentorship Post
router.post('/posts/:id/comments', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { id: postId } = req.params;
    const { author_id, author_name, author_role, content } = req.body;

    if (!postId || !author_id || !content) {
      return res.status(400).json({ error: 'postId, author_id, and content are required.' });
    }

    const post = db.prepare('SELECT id FROM mentorship_posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Mentorship post not found.' });
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

// 7. Get Comments for a Mentorship Post
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
