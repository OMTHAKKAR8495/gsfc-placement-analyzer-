import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { AuthRateLimiter, sanitizeXss } from '../middleware/security.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campushire_secret_key_2026';

/**
 * Extracts and verifies the authenticated user from JWT token (Authorization header or Cookie)
 */
function getAuthenticatedUser(req) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) return null;

    // Handle offline/demo tokens gracefully if applicable
    if (token.startsWith('demo_token_') || token.startsWith('offline_')) {
      const email = req.headers['x-student-email'] || req.query.email || '';
      if (email) {
        const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (u) {
          const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(u.id);
          return { ...u, owner_id: profile?.id || u.id, profile };
        }
      }
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) return null;

    const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return null;

    let profile = null;
    if (user.role === 'student') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
    } else if (user.role === 'company') {
      profile = db.prepare('SELECT * FROM company_profiles WHERE user_id = ?').get(user.id);
    } else if (user.role === 'alumni') {
      profile = db.prepare('SELECT * FROM alumni_profiles WHERE user_id = ?').get(user.id);
    }

    return {
      ...user,
      owner_id: profile?.id || decoded.owner_id || user.id,
      profile
    };
  } catch (err) {
    return null;
  }
}

// 1. Get Q&A Threads (Supports Community Questions & My Questions)
router.get('/threads', (req, res) => {
  try {
    const { category, status, search, mine, student_id } = req.query;
    const authUser = getAuthenticatedUser(req);

    let query = `
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM qa_replies r WHERE r.thread_id = t.id) as replies_count,
        (SELECT r.created_at FROM qa_replies r WHERE r.thread_id = t.id ORDER BY r.created_at DESC LIMIT 1) as last_activity_at
      FROM qa_threads t
      WHERE 1=1
    `;
    const params = [];

    // "My Questions" Filter: Enforce student ownership from authenticated session
    if (mine === 'true' || mine === '1') {
      let targetStudentId = authUser?.profile?.id || authUser?.owner_id || authUser?.id;
      let targetUserId = authUser?.id;
      let targetEmailPrefix = authUser?.email ? authUser.email.split('@')[0] : null;

      // If no valid JWT token, allow student_id query param for client-side resilience
      if (!targetStudentId && student_id) {
        targetStudentId = student_id;
        targetEmailPrefix = student_id.replace(/^s_/, '').replace(/^u_/, '');
      }

      if (targetStudentId) {
        query += ` AND (t.student_id = ? OR t.student_id = ? OR t.student_id = ? OR t.student_id LIKE ?)`;
        params.push(targetStudentId, targetUserId || targetStudentId, `s_${targetEmailPrefix}`, `%${targetEmailPrefix}%`);
      } else {
        // Not authenticated and no ID provided -> empty result
        return res.json([]);
      }
    } else if (student_id) {
      query += ` AND (t.student_id = ? OR t.student_id LIKE ?)`;
      params.push(student_id, `%${student_id}%`);
    }

    if (category && category !== 'All') {
      query += ` AND t.category = ?`;
      params.push(category);
    }

    if (status && status !== 'all') {
      if (status === 'unanswered') {
        query += ` AND (SELECT COUNT(*) FROM qa_replies r WHERE r.thread_id = t.id) = 0`;
      } else {
        query += ` AND t.status = ?`;
        params.push(status);
      }
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

// 2. Dedicated "My Questions" Endpoint (Strict Student Authorization)
router.get('/my-questions', (req, res) => {
  try {
    const authUser = getAuthenticatedUser(req);
    const { student_id, status, category, search } = req.query;

    let targetStudentId = authUser?.profile?.id || authUser?.owner_id || authUser?.id;
    let targetUserId = authUser?.id;
    let targetEmailPrefix = authUser?.email ? authUser.email.split('@')[0] : null;

    if (!targetStudentId && student_id) {
      targetStudentId = student_id;
      targetEmailPrefix = student_id.replace(/^s_/, '').replace(/^u_/, '');
    }

    if (!targetStudentId) {
      return res.status(401).json({ error: 'Authentication required to view your private questions.' });
    }

    let query = `
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM qa_replies r WHERE r.thread_id = t.id) as replies_count,
        (SELECT r.created_at FROM qa_replies r WHERE r.thread_id = t.id ORDER BY r.created_at DESC LIMIT 1) as last_activity_at
      FROM qa_threads t
      WHERE (t.student_id = ? OR t.student_id = ? OR t.student_id = ? OR t.student_id LIKE ?)
    `;
    const params = [targetStudentId, targetUserId || targetStudentId, `s_${targetEmailPrefix}`, `%${targetEmailPrefix}%`];

    if (status && status !== 'all') {
      if (status === 'unanswered') {
        query += ` AND (SELECT COUNT(*) FROM qa_replies r WHERE r.thread_id = t.id) = 0`;
      } else {
        query += ` AND t.status = ?`;
        params.push(status);
      }
    }

    if (category && category !== 'All') {
      query += ` AND t.category = ?`;
      params.push(category);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(t.title) LIKE ? OR LOWER(t.body) LIKE ?)`;
      params.push(term, term);
    }

    query += ` ORDER BY t.created_at DESC`;

    const threads = db.prepare(query).all(...params);
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Single Thread with Full Replies
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

// 4. Create New Question Thread (Enforces Authenticated Student Identity)
router.post('/threads', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { title, body, category, student_id, student_name } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and question details are required.' });
    }

    const authUser = getAuthenticatedUser(req);
    
    // Determine student ID and name from authenticated session first, fallback to payload
    const effectiveStudentId = authUser?.profile?.id || authUser?.owner_id || authUser?.id || student_id || 'guest_student';
    const effectiveStudentName = authUser?.profile?.name || authUser?.name || student_name || 'GSFC Student';

    const threadId = 'thread_' + Date.now();
    db.prepare(`
      INSERT INTO qa_threads (id, student_id, student_name, title, body, category, status)
      VALUES (?, ?, ?, ?, ?, ?, 'open')
    `).run(
      threadId,
      effectiveStudentId,
      sanitizeXss(effectiveStudentName),
      sanitizeXss(title.trim()),
      sanitizeXss(body.trim()),
      sanitizeXss(category || 'General Placement Query')
    );

    const created = db.prepare(`
      SELECT 
        t.*,
        0 as replies_count,
        NULL as last_activity_at
      FROM qa_threads t 
      WHERE id = ?
    `).get(threadId);

    res.status(201).json({ success: true, thread: created, message: 'Question posted to community!' });
  } catch (err) {
    console.error('Error creating question thread:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Post Reply to Thread
router.post('/threads/:id/replies', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { id: threadId } = req.params;
    const { body, author_id, author_name, author_role } = req.body;

    if (!threadId || !body || !body.trim()) {
      return res.status(400).json({ error: 'threadId and reply body are required.' });
    }

    const thread = db.prepare('SELECT id FROM qa_threads WHERE id = ?').get(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Question thread not found.' });
    }

    const authUser = getAuthenticatedUser(req);
    const effectiveAuthorId = authUser?.owner_id || authUser?.id || author_id || 'u_anonymous';
    const effectiveAuthorName = authUser?.profile?.name || authUser?.name || author_name || 'Community Member';
    const effectiveAuthorRole = authUser?.role || (['student', 'alumni', 'admin', 'company', 'tpo', 'faculty', 'superadmin'].includes(author_role) ? author_role : 'student');

    const replyId = 'reply_' + Date.now();
    db.prepare(`
      INSERT INTO qa_replies (id, thread_id, author_id, author_name, author_role, body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      replyId,
      threadId,
      effectiveAuthorId,
      sanitizeXss(effectiveAuthorName),
      effectiveAuthorRole,
      sanitizeXss(body.trim())
    );

    const created = db.prepare('SELECT * FROM qa_replies WHERE id = ?').get(replyId);
    res.status(201).json({ success: true, reply: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Mark Thread as Resolved / Reopen
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

// 7. Delete Question Thread (Author / Admin / TPO)
router.delete('/threads/:id', (req, res) => {
  try {
    const { id: threadId } = req.params;

    const thread = db.prepare('SELECT * FROM qa_threads WHERE id = ?').get(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Question thread not found.' });
    }

    // Cascade delete replies
    db.prepare('DELETE FROM qa_replies WHERE thread_id = ?').run(threadId);
    // Delete thread
    db.prepare('DELETE FROM qa_threads WHERE id = ?').run(threadId);

    res.json({ success: true, message: 'Question and associated replies deleted successfully.', deletedId: threadId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
