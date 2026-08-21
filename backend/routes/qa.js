import express from 'express';
import db from '../db/index.js';
import { AuthRateLimiter, sanitizeXss } from '../middleware/security.js';

const router = express.Router();

// 1. Get All Q&A Threads (Filter by Category, Status, Search)
router.get('/threads', (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = `
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM qa_replies r WHERE r.thread_id = t.id) as replies_count,
        (SELECT r.created_at FROM qa_replies r WHERE r.thread_id = t.id ORDER BY r.created_at DESC LIMIT 1) as last_activity_at
      FROM qa_threads t
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ` AND t.category = ?`;
      params.push(category);
    }

    if (status && status !== 'all') {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(t.title) LIKE ? OR LOWER(t.body) LIKE ? OR LOWER(t.student_name) LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY CASE WHEN t.status = 'open' THEN 0 ELSE 1 END, t.created_at DESC`;

    const threads = db.prepare(query).all(...params);
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Single Thread with Full Replies
router.get('/threads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const thread = db.prepare(`
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM qa_replies r WHERE r.thread_id = t.id) as replies_count
      FROM qa_threads t
      WHERE t.id = ?
    `).get(id);

    if (!thread) {
      return res.status(404).json({ error: 'Question thread not found.' });
    }

    const replies = db.prepare(`
      SELECT * FROM qa_replies
      WHERE thread_id = ?
      ORDER BY created_at ASC
    `).all(id);

    res.json({
      ...thread,
      replies
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create New Question Thread
router.post('/threads', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { student_id, student_name, title, body, category } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }

    const threadId = 'thread_' + Date.now();
    db.prepare(`
      INSERT INTO qa_threads (id, student_id, student_name, title, body, category, status)
      VALUES (?, ?, ?, ?, ?, ?, 'open')
    `).run(
      threadId,
      student_id || 'guest_student',
      sanitizeXss(student_name || 'GSFC Student'),
      sanitizeXss(title),
      sanitizeXss(body),
      sanitizeXss(category || 'General Placement Query')
    );

    const created = db.prepare('SELECT * FROM qa_threads WHERE id = ?').get(threadId);
    res.status(201).json({ success: true, thread: created, message: 'Question posted to community!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Post Reply to Thread
router.post('/threads/:id/replies', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { id: threadId } = req.params;
    const { author_id, author_name, author_role, body } = req.body;

    if (!threadId || !body) {
      return res.status(400).json({ error: 'threadId and body are required.' });
    }

    const thread = db.prepare('SELECT id FROM qa_threads WHERE id = ?').get(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Question thread not found.' });
    }

    const replyId = 'reply_' + Date.now();
    db.prepare(`
      INSERT INTO qa_replies (id, thread_id, author_id, author_name, author_role, body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      replyId,
      threadId,
      author_id || 'u_anonymous',
      sanitizeXss(author_name || 'Community Member'),
      ['student', 'alumni', 'admin', 'company', 'tpo'].includes(author_role) ? author_role : 'student',
      sanitizeXss(body)
    );

    const created = db.prepare('SELECT * FROM qa_replies WHERE id = ?').get(replyId);
    res.status(201).json({ success: true, reply: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Mark Thread as Resolved / Reopen
router.put('/threads/:id/resolve', (req, res) => {
  try {
    const { id: threadId } = req.params;
    const { status } = req.body; // 'resolved' or 'open'

    const thread = db.prepare('SELECT * FROM qa_threads WHERE id = ?').get(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Question thread not found.' });
    }

    const newStatus = status === 'open' ? 'open' : 'resolved';
    db.prepare('UPDATE qa_threads SET status = ? WHERE id = ?').run(newStatus, threadId);

    res.json({ success: true, status: newStatus, message: `Thread marked as ${newStatus}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
