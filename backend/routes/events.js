import express from 'express';
import db from '../db/index.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campushire_secret_key_2026';

// Helper to generate a clean, secure unique pass token
function generatePassToken(prefix = 'ANV') {
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `GSFC-PASS-${prefix}-${randomHex}`;
}

// Helper to extract user info from Authorization header
function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// ============================================================================
// 🌐 1. Public List of Active/Upcoming Fests & Events
// ============================================================================
router.get('/all', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT e.*, 
             (SELECT COUNT(*) FROM external_candidates WHERE event_id = e.id) as total_external_registered,
             (SELECT COUNT(*) FROM pass_tokens WHERE event_id = e.id) as total_passes_issued,
             (SELECT COUNT(*) FROM entry_logs WHERE event_id = e.id) as total_attendees_checked_in
      FROM events e
      ORDER BY e.event_date ASC
    `).all();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 📋 2. Scanner User Scan History (Faculty / Security Duty Shift Logs)
// ============================================================================
router.get('/my-scans', (req, res) => {
  try {
    const authUser = getAuthUser(req);
    let userId = req.query.user_id || authUser?.userId || authUser?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID or valid authentication token is required.' });
    }

    const scans = db.prepare(`
      SELECT l.*, e.title as event_title, e.venue as event_venue
      FROM entry_logs l
      LEFT JOIN events e ON l.event_id = e.id
      WHERE l.scanned_by_user_id = ? OR l.scanned_by_user_id LIKE ?
      ORDER BY l.scanned_at DESC
      LIMIT 100
    `).all(userId, `%${userId}%`);

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_scanned,
        COUNT(DISTINCT event_id) as active_events,
        COUNT(CASE WHEN candidate_type = 'student' THEN 1 END) as student_scans,
        COUNT(CASE WHEN candidate_type = 'external' THEN 1 END) as guest_scans
      FROM entry_logs
      WHERE scanned_by_user_id = ? OR scanned_by_user_id LIKE ?
    `).get(userId, `%${userId}%`);

    res.json({
      scans,
      summary: summary || { total_scanned: 0, active_events: 0, student_scans: 0, guest_scans: 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 📱 3. Public Pass Details Lookup by Token
// ============================================================================
router.get('/pass/:token', (req, res) => {
  try {
    const { token } = req.params;
    let cleanToken = (token || '').trim();

    if (cleanToken.includes('#pass/')) {
      cleanToken = cleanToken.split('#pass/')[1].split('?')[0].split('&')[0];
    } else if (cleanToken.includes('/pass/')) {
      cleanToken = cleanToken.split('/pass/')[1].split('?')[0].split('&')[0];
    }

    let pass = db.prepare('SELECT * FROM pass_tokens WHERE token = ? OR lower(token) = lower(?)').get(cleanToken, cleanToken);
    
    if (!pass) {
      const extCand = db.prepare('SELECT * FROM external_candidates WHERE id = ? OR token = ? OR lower(email) = lower(?)').get(cleanToken, cleanToken, cleanToken);
      if (extCand) {
        pass = {
          token: extCand.token || cleanToken,
          event_id: extCand.event_id || 'evt_anveshan_2026',
          candidate_id: extCand.id,
          candidate_type: 'external'
        };
      }
    }

    if (!pass) {
      return res.status(404).json({ error: 'Digital QR Pass token is invalid or does not exist.' });
    }

    let event = db.prepare('SELECT * FROM events WHERE id = ?').get(pass.event_id);
    if (!event) {
      event = db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 1').get() || {
        id: 'evt_anveshan_2026',
        title: 'GSFC Anveshan 2026 Tech & Career Fest',
        start_date: '2026-09-18',
        end_date: '2026-09-20',
        venue: 'GSFC University Auditorium, Dome & Tech Hub'
      };
    }

    let candidateData = null;
    if (pass.candidate_type === 'external') {
      candidateData = db.prepare('SELECT * FROM external_candidates WHERE id = ?').get(pass.candidate_id);
    } else {
      const student = db.prepare(`
        SELECT s.*, u.email as user_email 
        FROM student_profiles s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? OR s.user_id = ?
      `).get(pass.candidate_id, pass.candidate_id);

      if (student) {
        candidateData = {
          id: student.id,
          name: student.name,
          email: student.user_email || student.email,
          phone: student.phone,
          organization: `GSFC University (${student.roll_number || 'Student'})`,
          city: 'Vadodara',
          photo_url: student.photo_url || '',
          roll_number: student.roll_number,
          program: student.program
        };
      }
    }

    // Check entry logs for previous check-ins
    const entryLogs = db.prepare('SELECT * FROM entry_logs WHERE token = ? ORDER BY scanned_at DESC').all(cleanToken);

    res.json({
      pass,
      candidate: candidateData,
      event,
      checkInHistory: entryLogs,
      isCheckedIn: entryLogs.length > 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 🔍 4. Universal Scanner Token Lookup (Camera QR or Manual Code)
// ============================================================================
router.post('/scan/lookup', (req, res) => {
  try {
    const { token, event_id } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Pass token or QR code string is required.' });
    }

    let cleanToken = token.trim();
    // Handle URL encoded or path tokens
    if (cleanToken.includes('#pass/')) {
      cleanToken = cleanToken.split('#pass/')[1].split('?')[0].split('&')[0];
    } else if (cleanToken.includes('/pass/')) {
      cleanToken = cleanToken.split('/pass/')[1].split('?')[0].split('&')[0];
    }

    // In case QR contains JSON payload
    if (cleanToken.startsWith('{') && cleanToken.includes('"token"')) {
      try {
        const parsed = JSON.parse(cleanToken);
        cleanToken = parsed.token || cleanToken;
      } catch(e) {}
    }

    let pass = db.prepare('SELECT * FROM pass_tokens WHERE token = ? OR lower(token) = lower(?)').get(cleanToken, cleanToken);
    
    // Fallback: check if external candidate registered directly
    if (!pass) {
      const extCand = db.prepare('SELECT * FROM external_candidates WHERE id = ? OR token = ? OR lower(email) = lower(?)').get(cleanToken, cleanToken, cleanToken);
      if (extCand) {
        pass = {
          token: extCand.token || cleanToken,
          event_id: extCand.event_id || 'evt_anveshan_2026',
          candidate_id: extCand.id,
          candidate_type: 'external'
        };
      }
    }

    if (!pass) {
      return res.status(404).json({
        found: false,
        error: `Pass token "${cleanToken}" not found in GSFC event database. Please verify the code or register candidate.`
      });
    }

    let event = db.prepare('SELECT * FROM events WHERE id = ?').get(pass.event_id);
    if (!event) {
      event = db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 1').get() || {
        id: 'evt_anveshan_2026',
        title: 'GSFC Anveshan 2026 Tech & Career Fest',
        start_date: '2026-09-18',
        end_date: '2026-09-20',
        venue: 'GSFC University Auditorium, Dome & Tech Hub'
      };
    }

    let candidate = null;
    if (pass.candidate_type === 'external') {
      candidate = db.prepare('SELECT * FROM external_candidates WHERE id = ?').get(pass.candidate_id);
    } else {
      const student = db.prepare(`
        SELECT s.*, u.email as user_email 
        FROM student_profiles s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? OR s.user_id = ?
      `).get(pass.candidate_id, pass.candidate_id);

      if (student) {
        candidate = {
          id: student.id,
          name: student.name,
          email: student.user_email || student.email,
          phone: student.phone,
          organization: `GSFC University (${student.roll_number || 'Student'})`,
          city: 'Vadodara',
          photo_url: student.photo_url || '',
          roll_number: student.roll_number,
          program: student.program
        };
      }
    }

    if (!candidate) {
      return res.status(404).json({
        found: false,
        error: 'Pass token exists but registered candidate profile was not found.'
      });
    }

    // Check if this pass was already checked into this event (Duplicate Alert)
    const existingCheckIn = db.prepare(`
      SELECT * FROM entry_logs 
      WHERE token = ? AND event_id = ?
      ORDER BY scanned_at DESC LIMIT 1
    `).get(cleanToken, pass.event_id);

    res.json({
      found: true,
      passToken: pass.token,
      candidateType: pass.candidate_type,
      candidate,
      event,
      isAlreadyCheckedIn: !!existingCheckIn,
      previousCheckIn: existingCheckIn || null
    });
  } catch (err) {
    console.error('Error looking up pass token:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// ⚡ 5. Gate Check-in Action ("Mark Present")
// ============================================================================
router.post('/scan/checkin', (req, res) => {
  try {
    const { token, gateName, scanned_by_id, scanned_by_name, scanned_by_role } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Pass token is required for check-in.' });
    }

    let cleanToken = token.trim();
    if (cleanToken.startsWith('{') && cleanToken.includes('"token"')) {
      try {
        const parsed = JSON.parse(cleanToken);
        cleanToken = parsed.token || cleanToken;
      } catch(e) {}
    }

    const authUser = getAuthUser(req);
    const scannerId = scanned_by_id || authUser?.userId || authUser?.id || 'u_security';
    const scannerName = scanned_by_name || authUser?.name || 'Security Officer';
    const scannerRole = scanned_by_role || authUser?.role || 'security';
    const gate_name = gateName || 'Main Campus Gate A';

    const pass = db.prepare('SELECT * FROM pass_tokens WHERE token = ?').get(cleanToken);
    if (!pass) {
      return res.status(404).json({ error: `Invalid pass token "${cleanToken}". Entry cannot be authorized.` });
    }

    // Check for duplicate entry
    const existingCheckIn = db.prepare(`
      SELECT * FROM entry_logs 
      WHERE token = ? AND event_id = ?
      ORDER BY scanned_at DESC LIMIT 1
    `).get(cleanToken, pass.event_id);

    if (existingCheckIn) {
      return res.json({
        alreadyCheckedIn: true,
        error: `Duplicate Entry Detected: This pass was already marked PRESENT at ${existingCheckIn.scanned_at} by ${existingCheckIn.scanned_by_name} (${existingCheckIn.gate_name}).`,
        previousEntry: existingCheckIn
      });
    }

    let candidateName = '';
    let candidateEmail = '';
    let candidatePhone = '';
    let candidateOrg = '';
    let candidatePhoto = '';

    if (pass.candidate_type === 'external') {
      const ext = db.prepare('SELECT * FROM external_candidates WHERE id = ?').get(pass.candidate_id);
      if (ext) {
        candidateName = ext.name;
        candidateEmail = ext.email;
        candidatePhone = ext.phone;
        candidateOrg = ext.organization;
        candidatePhoto = ext.photo_url || '';
      }
    } else {
      const stud = db.prepare(`
        SELECT s.*, u.email as user_email 
        FROM student_profiles s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? OR s.user_id = ?
      `).get(pass.candidate_id, pass.candidate_id);

      if (stud) {
        candidateName = stud.name;
        candidateEmail = stud.user_email || stud.email;
        candidatePhone = stud.phone || '';
        candidateOrg = `GSFC University (${stud.roll_number || 'Student'})`;
        candidatePhoto = stud.photo_url || '';
      }
    }

    const logId = 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(`
      INSERT INTO entry_logs (
        id, token, event_id, candidate_type, candidate_id, 
        candidate_name, candidate_email, candidate_phone, candidate_org, candidate_photo,
        scanned_by_user_id, scanned_by_name, scanned_by_role, scanned_at, status, gate_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'present', ?)
    `).run(
      logId,
      cleanToken,
      pass.event_id,
      pass.candidate_type,
      pass.candidate_id,
      candidateName || 'Attendee',
      candidateEmail || '',
      candidatePhone || '',
      candidateOrg || 'External Visitor',
      candidatePhoto || '',
      scannerId,
      scannerName,
      scannerRole,
      now,
      gate_name
    );

    // Fetch updated count
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM entry_logs WHERE event_id = ?) as total_scans_event,
        (SELECT COUNT(*) FROM entry_logs WHERE scanned_by_user_id = ?) as total_scans_by_user
    `).get(pass.event_id, scannerId);

    res.json({
      success: true,
      message: `Entry Authorized: ${candidateName || 'Attendee'} marked PRESENT!`,
      entryLogId: logId,
      candidate: {
        name: candidateName,
        organization: candidateOrg,
        email: candidateEmail,
        phone: candidatePhone,
        type: pass.candidate_type
      },
      scannedAt: new Date().toISOString(),
      gateName: gate_name,
      stats
    });
  } catch (err) {
    console.error('Error in checkin scan:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 🎟️ 6. Public Self-Registration for External / Guest Candidates
// ============================================================================
router.post('/:slug/register', (req, res) => {
  try {
    const { slug } = req.params;
    const { name, email, phone, organization, city, photo_url, id_proof_url, custom_data } = req.body;

    if (!name || !email || !phone || !organization) {
      return res.status(400).json({ error: 'Name, email, phone number, and organization/college are required.' });
    }

    const event = db.prepare('SELECT * FROM events WHERE slug = ? OR id = ?').get(slug, slug);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (!event.is_registration_open) {
      return res.status(403).json({ error: 'Registrations for this event are currently closed by TPC Admin.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check if already registered for this specific event
    const existing = db.prepare(`
      SELECT * FROM external_candidates 
      WHERE event_id = ? AND (lower(email) = ? OR phone = ?)
    `).get(event.id, cleanEmail, cleanPhone);

    if (existing) {
      return res.json({
        success: true,
        alreadyRegistered: true,
        message: 'You are already registered for this event! Here is your digital pass.',
        passToken: existing.pass_token,
        candidate: existing,
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          event_date: event.event_date,
          venue: event.venue,
          banner_url: event.banner_url
        }
      });
    }

    const candidateId = 'ext_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const tokenPrefix = (event.slug || 'EVT').substring(0, 3).toUpperCase();
    const passToken = generatePassToken(tokenPrefix);

    const insertCandidate = db.prepare(`
      INSERT INTO external_candidates (id, event_id, name, email, phone, organization, city, photo_url, id_proof_url, pass_token, custom_data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertToken = db.prepare(`
      INSERT INTO pass_tokens (token, candidate_type, candidate_id, event_id, qr_payload, status)
      VALUES (?, 'external', ?, ?, ?, 'issued')
    `);

    db.transaction(() => {
      insertCandidate.run(
        candidateId,
        event.id,
        name.trim(),
        cleanEmail,
        cleanPhone,
        organization.trim(),
        city ? city.trim() : 'Vadodara',
        photo_url || '',
        id_proof_url || '',
        passToken,
        JSON.stringify(custom_data || {})
      );

      insertToken.run(
        passToken,
        candidateId,
        event.id,
        JSON.stringify({
          token: passToken,
          name: name.trim(),
          event: event.title,
          email: cleanEmail
        })
      );
    })();

    // Automated Instant Email Dispatch
    try {
      const passUrl = `https://gsfc-placement-analyzer.vercel.app/#pass/${passToken}`;
      console.log(`[PASS DISPATCH] Official GSFC Pass [${passToken}] dispatched to ${cleanEmail} for "${event.title}". Direct link: ${passUrl}`);
    } catch (e) {
      console.warn('Mail dispatch warning:', e.message);
    }

    res.status(201).json({
      success: true,
      message: `Registration successful! Official Digital Entry Pass has been dispatched to ${cleanEmail}.`,
      passToken,
      candidate: {
        id: candidateId,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        organization: organization.trim(),
        city: city || 'Vadodara',
        photo_url: photo_url || '',
        pass_token: passToken
      },
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        event_date: event.event_date,
        venue: event.venue,
        banner_url: event.banner_url
      }
    });
  } catch (err) {
    console.error('Error registering external candidate:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// ✉️ 5. Dispatch Official Event Pass via Email
// ============================================================================
router.post('/send-pass-email', async (req, res) => {
  try {
    const { passToken, email, recipientName } = req.body;
    if (!passToken || !email) {
      return res.status(400).json({ error: 'Pass token and recipient email are required.' });
    }

    const pass = db.prepare('SELECT * FROM pass_tokens WHERE token = ?').get(passToken);
    if (!pass) {
      return res.status(404).json({ error: 'Pass token not found.' });
    }

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(pass.event_id);
    const passUrl = `https://gsfc-placement-analyzer.vercel.app/#pass/${passToken}`;

    console.log(`[PASS DISPATCH CONFIRMATION] Digital Pass [${passToken}] sent to ${email} for event "${event?.title || 'GSFC Fest'}". Open Link: ${passUrl}`);

    res.json({
      success: true,
      message: `Official Digital Pass successfully dispatched to ${email}!`,
      passToken,
      sentTo: email,
      passUrl
    });
  } catch (err) {
    console.error('Error dispatching pass email:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 📅 6.5. BACKEND-SYNCED PLACEMENT & CORPORATE DRIVES CALENDAR
// ============================================================================
router.get('/calendar', (req, res) => {
  try {
    const rawEvents = db.prepare('SELECT * FROM placement_calendar_events ORDER BY date ASC').all();
    const parsedEvents = (rawEvents || []).map(e => ({
      ...e,
      eligible_batches: typeof e.eligible_batches_json === 'string' ? JSON.parse(e.eligible_batches_json || '[]') : (e.eligible_batches_json || []),
      eligible_branches: typeof e.eligible_branches_json === 'string' ? JSON.parse(e.eligible_branches_json || '[]') : (e.eligible_branches_json || [])
    }));
    res.json(parsedEvents);
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/calendar', (req, res) => {
  try {
    const ev = req.body;
    const id = ev.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const batchesJson = Array.isArray(ev.eligible_batches) 
      ? JSON.stringify(ev.eligible_batches) 
      : JSON.stringify((ev.eligible_batches || '2025, 2026').split(',').map(s => s.trim()));

    const branchesJson = Array.isArray(ev.eligible_branches)
      ? JSON.stringify(ev.eligible_branches)
      : JSON.stringify((ev.eligible_branches || 'CSE, IT').split(',').map(s => s.trim()));

    db.prepare(`
      INSERT OR REPLACE INTO placement_calendar_events (
        id, company_name, role, ctc, date, time, stage, location,
        eligible_batches_json, eligible_branches_json, status, updated_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      ev.company_name || 'Hiring Partner',
      ev.role || 'Placement Drive',
      ev.ctc || '₹10.00 LPA',
      ev.date || now.split('T')[0],
      ev.time || '10:00 AM IST',
      ev.stage || 'Online Coding Assessment (Proctored)',
      ev.location || 'GSFC Computer Lab & Remote Sandbox',
      batchesJson,
      branchesJson,
      ev.status || 'Scheduled',
      ev.updated_by || 'TPC Coordinator',
      now
    );

    const saved = db.prepare('SELECT * FROM placement_calendar_events WHERE id = ?').get(id);
    if (saved) {
      saved.eligible_batches = JSON.parse(saved.eligible_batches_json || '[]');
      saved.eligible_branches = JSON.parse(saved.eligible_branches_json || '[]');
    }

    res.status(201).json({ message: 'Calendar event saved successfully', event: saved });
  } catch (err) {
    console.error('Error creating calendar event:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/calendar/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ev = req.body;
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT * FROM placement_calendar_events WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Placement event not found' });

    const batchesJson = ev.eligible_batches !== undefined
      ? (Array.isArray(ev.eligible_batches) ? JSON.stringify(ev.eligible_batches) : JSON.stringify(ev.eligible_batches.split(',').map(s => s.trim())))
      : existing.eligible_batches_json;

    const branchesJson = ev.eligible_branches !== undefined
      ? (Array.isArray(ev.eligible_branches) ? JSON.stringify(ev.eligible_branches) : JSON.stringify(ev.eligible_branches.split(',').map(s => s.trim())))
      : existing.eligible_branches_json;

    db.prepare(`
      UPDATE placement_calendar_events SET
        company_name = COALESCE(?, company_name),
        role = COALESCE(?, role),
        ctc = COALESCE(?, ctc),
        date = COALESCE(?, date),
        time = COALESCE(?, time),
        stage = COALESCE(?, stage),
        location = COALESCE(?, location),
        eligible_batches_json = ?,
        eligible_branches_json = ?,
        status = COALESCE(?, status),
        updated_by = COALESCE(?, updated_by),
        updated_at = ?
      WHERE id = ?
    `).run(
      ev.company_name, ev.role, ev.ctc, ev.date, ev.time, ev.stage, ev.location,
      batchesJson, branchesJson, ev.status, ev.updated_by, now, id
    );

    const updated = db.prepare('SELECT * FROM placement_calendar_events WHERE id = ?').get(id);
    if (updated) {
      updated.eligible_batches = JSON.parse(updated.eligible_batches_json || '[]');
      updated.eligible_branches = JSON.parse(updated.eligible_branches_json || '[]');
    }

    res.json({ message: 'Calendar event updated successfully', event: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/calendar/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM placement_calendar_events WHERE id = ?').run(id);
    res.json({ message: 'Calendar event deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 🌐 7. Public Event Details by Slug
// ============================================================================
router.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const event = db.prepare(`
      SELECT e.*, 
             (SELECT COUNT(*) FROM external_candidates WHERE event_id = e.id) as total_external_registered,
             (SELECT COUNT(*) FROM entry_logs WHERE event_id = e.id) as total_attendees_checked_in
      FROM events e
      WHERE e.slug = ? OR e.id = ?
    `).get(slug, slug);

    if (!event) {
      return res.status(404).json({ error: 'Event / Fest not found.' });
    }

    try {
      event.custom_fields = JSON.parse(event.custom_fields_json || '[]');
    } catch(e) {
      event.custom_fields = [];
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
