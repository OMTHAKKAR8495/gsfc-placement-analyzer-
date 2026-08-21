import express from 'express';
import db from '../db/index.js';
import { AuthRateLimiter, sanitizeXss } from '../middleware/security.js';

const router = express.Router();

// 1. Get All Job Fairs (Public / Student / Admin)
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        jf.*,
        (SELECT COUNT(*) FROM job_fair_registrations jfr WHERE jfr.job_fair_id = jf.id) as registrations_count,
        (SELECT COUNT(*) FROM job_fair_companies jfc WHERE jfc.job_fair_id = jf.id) as companies_count
      FROM job_fairs jf
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND jf.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY jf.event_date ASC, jf.created_at DESC`;

    const fairs = db.prepare(query).all(...params).map(fair => {
      // Get participating requirements / companies for each fair
      const companies = db.prepare(`
        SELECT 
          r.id as requirement_id,
          r.title as job_title,
          r.ctc_range,
          r.openings,
          r.job_type,
          r.min_cgpa,
          r.eligible_programs_json,
          c.id as company_id,
          c.company_name,
          c.logo_url,
          c.industry
        FROM job_fair_companies jfc
        JOIN requirements r ON jfc.requirement_id = r.id
        JOIN company_profiles c ON r.company_id = c.id
        WHERE jfc.job_fair_id = ?
      `).all(fair.id);

      return {
        ...fair,
        participating_companies: companies
      };
    });

    res.json(fairs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Single Job Fair Details
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const fair = db.prepare(`
      SELECT 
        jf.*,
        (SELECT COUNT(*) FROM job_fair_registrations jfr WHERE jfr.job_fair_id = jf.id) as registrations_count,
        (SELECT COUNT(*) FROM job_fair_companies jfc WHERE jfc.job_fair_id = jf.id) as companies_count
      FROM job_fairs jf
      WHERE jf.id = ?
    `).get(id);

    if (!fair) {
      return res.status(404).json({ error: 'Job fair event not found.' });
    }

    const companies = db.prepare(`
      SELECT 
        r.id as requirement_id,
        r.title as job_title,
        r.ctc_range,
        r.openings,
        r.job_type,
        r.min_cgpa,
        r.deadline,
        r.eligible_programs_json,
        r.required_skills_json,
        c.id as company_id,
        c.company_name,
        c.logo_url,
        c.industry
      FROM job_fair_companies jfc
      JOIN requirements r ON jfc.requirement_id = r.id
      JOIN company_profiles c ON r.company_id = c.id
      WHERE jfc.job_fair_id = ?
    `).all(id);

    const registeredStudents = db.prepare(`
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        s.program,
        s.branch,
        s.cgpa,
        s.ats_score,
        jfr.registered_at
      FROM job_fair_registrations jfr
      JOIN student_profiles s ON jfr.student_id = s.id
      WHERE jfr.job_fair_id = ?
      ORDER BY jfr.registered_at DESC
    `).all(id);

    res.json({
      ...fair,
      participating_companies: companies,
      registered_students: registeredStudents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Job Fair (Admin / TPC)
router.post('/', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { title, description, event_date, venue, mode, status, requirement_ids } = req.body;
    if (!title || !event_date) {
      return res.status(400).json({ error: 'Title and event_date are required.' });
    }

    const fairId = 'fair_' + Date.now();
    db.prepare(`
      INSERT INTO job_fairs (id, title, description, event_date, venue, mode, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      fairId,
      sanitizeXss(title),
      sanitizeXss(description || ''),
      event_date,
      sanitizeXss(venue || 'GSFC University Campus'),
      ['online', 'offline', 'hybrid'].includes(mode) ? mode : 'offline',
      ['upcoming', 'live', 'closed'].includes(status) ? status : 'upcoming'
    );

    // Attach initial requirements if provided
    if (Array.isArray(requirement_ids)) {
      for (const reqId of requirement_ids) {
        db.prepare(`
          INSERT OR IGNORE INTO job_fair_companies (id, job_fair_id, requirement_id)
          VALUES (?, ?, ?)
        `).run(`jfc_${fairId}_${reqId}`, fairId, reqId);
      }
    }

    const createdFair = db.prepare('SELECT * FROM job_fairs WHERE id = ?').get(fairId);
    res.status(201).json({ success: true, fair: createdFair, message: 'Job Fair created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update Job Fair (Admin / TPC)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, venue, mode, status } = req.body;

    const existing = db.prepare('SELECT id FROM job_fairs WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Job fair event not found.' });
    }

    db.prepare(`
      UPDATE job_fairs
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          event_date = COALESCE(?, event_date),
          venue = COALESCE(?, venue),
          mode = COALESCE(?, mode),
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      title ? sanitizeXss(title) : null,
      description !== undefined ? sanitizeXss(description) : null,
      event_date || null,
      venue ? sanitizeXss(venue) : null,
      mode || null,
      status || null,
      id
    );

    const updated = db.prepare('SELECT * FROM job_fairs WHERE id = ?').get(id);
    res.json({ success: true, fair: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete Job Fair (Admin / TPC)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM job_fairs WHERE id = ?').run(id);
    res.json({ success: true, message: 'Job fair event deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Attach Company Requirement to Job Fair
router.post('/:id/add-company', (req, res) => {
  try {
    const { id: fairId } = req.params;
    const { requirement_id } = req.body;

    if (!fairId || !requirement_id) {
      return res.status(400).json({ error: 'fairId and requirement_id are required.' });
    }

    db.prepare(`
      INSERT OR IGNORE INTO job_fair_companies (id, job_fair_id, requirement_id)
      VALUES (?, ?, ?)
    `).run(`jfc_${fairId}_${requirement_id}`, fairId, requirement_id);

    res.json({ success: true, message: 'Requirement attached to Job Fair.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Remove Company Requirement from Job Fair
router.delete('/:id/remove-company/:requirementId', (req, res) => {
  try {
    const { id: fairId, requirementId } = req.params;
    db.prepare(`
      DELETE FROM job_fair_companies 
      WHERE job_fair_id = ? AND requirement_id = ?
    `).run(fairId, requirementId);

    res.json({ success: true, message: 'Requirement removed from Job Fair.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Student 1-Click Registration for Job Fair
router.post('/:id/register', AuthRateLimiter.generalApiLimiter, (req, res) => {
  try {
    const { id: fairId } = req.params;
    const { student_id } = req.body;

    if (!fairId || !student_id) {
      return res.status(400).json({ error: 'fairId and student_id are required.' });
    }

    const fair = db.prepare('SELECT * FROM job_fairs WHERE id = ?').get(fairId);
    if (!fair) {
      return res.status(404).json({ error: 'Job fair event not found.' });
    }

    const regId = `reg_${fairId}_${student_id}`;
    db.prepare(`
      INSERT OR IGNORE INTO job_fair_registrations (id, job_fair_id, student_id)
      VALUES (?, ?, ?)
    `).run(regId, fairId, student_id);

    res.json({ success: true, message: `Successfully registered for ${fair.title}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Get Student's Registered Fairs
router.get('/student/registrations', (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required.' });
    }

    const registeredFairIds = db.prepare(`
      SELECT job_fair_id FROM job_fair_registrations WHERE student_id = ?
    `).all(studentId).map(r => r.job_fair_id);

    res.json(registeredFairIds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Get Fairs for Company Recruiter
router.get('/company/my-fairs', (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required.' });
    }

    const fairs = db.prepare(`
      SELECT DISTINCT jf.*
      FROM job_fairs jf
      JOIN job_fair_companies jfc ON jf.id = jfc.job_fair_id
      JOIN requirements r ON jfc.requirement_id = r.id
      WHERE r.company_id = ?
      ORDER BY jf.event_date ASC
    `).all(companyId);

    res.json(fairs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
