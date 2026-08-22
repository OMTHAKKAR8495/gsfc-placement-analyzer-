import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// Initialize audit trail table if not exists
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_audit_logs (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action_type TEXT NOT NULL,
      entity_affected TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch (e) {}

// 1. Get System Audit Logs
router.get('/logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM system_audit_logs ORDER BY created_at DESC LIMIT 50').all();
    
    // Seed default sample log entries if empty
    if (logs.length === 0) {
      const sampleLogs = [
        { id: 'aud_1', user_email: 'admin@gsfcuniversity.ac.in', user_role: 'admin', action_type: 'REPORT_EXPORT', entity_affected: 'NIRF Master Placement Dossier', details: 'Exported certified placement roster PDF for Batch 2026', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'aud_2', user_email: 'recruiter@gsfclimited.com', user_role: 'company', action_type: 'SHORTLIST_CANDIDATES', entity_affected: 'Requirement #req_google_swe', details: 'Shortlisted 5 candidates for technical interview round', created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 'aud_3', user_email: 'superadmin@gsfc.ac.in', user_role: 'superadmin', action_type: 'USER_ROLE_PROVISION', entity_affected: 'Faculty Coordinator BTech', details: 'Granted departmental analytics view permissions', created_at: new Date(Date.now() - 14400000).toISOString() }
      ];
      return res.json(sampleLogs);
    }

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Record New Audit Log
router.post('/record', (req, res) => {
  try {
    const { userEmail, userRole, actionType, entityAffected, details } = req.body;
    const logId = `aud_${Date.now()}`;

    db.prepare(`
      INSERT INTO system_audit_logs (id, user_email, user_role, action_type, entity_affected, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      userEmail || 'system@gsfcuniversity.ac.in',
      userRole || 'admin',
      actionType || 'GENERIC_ACTION',
      entityAffected || 'System',
      details || 'Action completed successfully'
    );

    res.json({ success: true, log_id: logId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
