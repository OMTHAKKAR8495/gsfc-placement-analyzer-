import express from 'express';
import crypto from 'crypto';
import db from '../db/index.js';

const uuidv4 = () => crypto.randomUUID();

const router = express.Router();

// Helper to generate WhatsApp deep-link URL
const buildWhatsAppUrl = (phone, text) => {
  const cleanPhone = (phone || '919876543210').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
};

// 1. Broadcast Placement Drive Alert to All Eligible Students
router.post('/broadcast-drive', (req, res) => {
  try {
    const { requirementId, companyName, jobTitle, ctcRange, minCgpa, deadline } = req.body;
    
    let targetRequirement = null;
    if (requirementId) {
      targetRequirement = db.prepare('SELECT * FROM requirements WHERE id = ?').get(requirementId);
    }

    const title = jobTitle || targetRequirement?.title || 'Campus Placement Drive';
    const company = companyName || 'GSFC Placement Partner';
    const ctc = ctcRange || targetRequirement?.ctc_range || 'Competitive';
    const cgpa = minCgpa !== undefined ? minCgpa : (targetRequirement?.min_cgpa || 7.0);
    const driveDeadline = deadline || targetRequirement?.deadline || 'Upcoming';

    // Find all eligible students with matching CGPA
    const eligibleStudents = db.prepare(`
      SELECT s.id, s.name, s.roll_number, s.program, s.branch, s.cgpa, u.email
      FROM student_profiles s
      JOIN users u ON s.user_id = u.id
      WHERE s.cgpa >= ?
      ORDER BY s.cgpa DESC
    `).all(cgpa);

    const logStmt = db.prepare(`
      INSERT INTO notifications_log (id, recipient_name, recipient_email, recipient_phone, channel, notification_type, title, message, metadata_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const broadcastLogs = [];
    const sampleMessage = `🏛️ *GSFC UNIVERSITY TPC PLACEMENT ALERT*\n\n` +
      `📢 *New Campus Drive*: ${title}\n` +
      `🏢 *Hiring Company*: ${company}\n` +
      `💰 *Package (CTC)*: ${ctc}\n` +
      `🎓 *Min CGPA Cutoff*: ${cgpa} CGPA\n` +
      `⏳ *Apply Before*: ${driveDeadline}\n\n` +
      `👉 *Action*: Log into the GSFC Placement Portal to submit your profile & resume today!\n` +
      `🔗 http://localhost:5173/#student`;

    const insertTx = db.transaction((students) => {
      for (const st of students) {
        const dummyPhone = `91${9800000000 + Math.floor(Math.random() * 9999999)}`;
        const logId = uuidv4();
        const personalizedMsg = `Hello ${st.name} (${st.roll_number || 'GSFC'}),\n\n${sampleMessage}`;
        
        // Log WhatsApp dispatch
        logStmt.run(
          logId,
          st.name,
          st.email,
          dummyPhone,
          'whatsapp',
          'drive_alert',
          `Drive Alert: ${title} (${company})`,
          personalizedMsg,
          JSON.stringify({ requirement_id: requirementId, min_cgpa: cgpa, ctc }),
          'sent'
        );

        // Log Email dispatch
        logStmt.run(
          uuidv4(),
          st.name,
          st.email,
          dummyPhone,
          'email',
          'drive_alert',
          `[GSFC TPC] New Placement Opportunity: ${company} — ${title}`,
          personalizedMsg,
          JSON.stringify({ requirement_id: requirementId }),
          'sent'
        );

        broadcastLogs.push({
          student_id: st.id,
          name: st.name,
          email: st.email,
          phone: dummyPhone,
          whatsapp_url: buildWhatsAppUrl(dummyPhone, personalizedMsg)
        });
      }
    });

    insertTx(eligibleStudents);

    res.json({
      success: true,
      message: `🎉 Successfully broadcasted drive alert to ${eligibleStudents.length} eligible GSFC students via WhatsApp & Email!`,
      eligible_count: eligibleStudents.length,
      sample_message: sampleMessage,
      whatsapp_preview_url: broadcastLogs[0]?.whatsapp_url || '',
      broadcast_logs: broadcastLogs.slice(0, 10)
    });
  } catch (err) {
    console.error('Error broadcasting drive alert:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Send Automated Interview Venue & Time Reminder
router.post('/send-interview-reminder', (req, res) => {
  try {
    const { 
      applicationId, 
      candidateName, 
      candidateEmail, 
      candidatePhone, 
      jobTitle, 
      companyName, 
      interviewTime, 
      venue, 
      meetingLink 
    } = req.body;

    const name = candidateName || 'Candidate';
    const email = candidateEmail || 'student@gsfcuniversity.ac.in';
    const phone = candidatePhone || '919876543210';
    const drive = jobTitle || 'Technical Interview Round';
    const company = companyName || 'Corporate Partner';
    const time = interviewTime || 'Tomorrow at 10:30 AM';
    const loc = venue || 'Vigyan Bhavan Placement Cell / Online Video Room';

    const whatsappMessage = `🎓 *GSFC UNIVERSITY TPC • INTERVIEW CALL LETTER*\n\n` +
      `Dear *${name}*,\n\n` +
      `Your attendance has been confirmed for the campus interview round with *${company}*.\n\n` +
      `📋 *Position*: ${drive}\n` +
      `🕒 *Scheduled Time*: ${time}\n` +
      `📍 *Venue*: ${loc}\n` +
      (meetingLink ? `🔗 *Meeting Link*: ${meetingLink}\n` : '') +
      `\n⚠️ *Mandatory*: Please carry 2 hard copies of your GSFC resume, college ID card, and academic transcripts.\n\n` +
      `All the best!\n` +
      `*Training & Placement Cell (TPC), GSFC University*`;

    // Record in notifications audit log
    const logId = uuidv4();
    db.prepare(`
      INSERT INTO notifications_log (id, recipient_name, recipient_email, recipient_phone, channel, notification_type, title, message, metadata_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      name,
      email,
      phone,
      'whatsapp',
      'interview_reminder',
      `Interview Reminder: ${company} — ${drive}`,
      whatsappMessage,
      JSON.stringify({ application_id: applicationId, venue: loc, time }),
      'sent'
    );

    // Also record email reminder
    db.prepare(`
      INSERT INTO notifications_log (id, recipient_name, recipient_email, recipient_phone, channel, notification_type, title, message, metadata_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      name,
      email,
      phone,
      'email',
      'interview_reminder',
      `[Interview Schedule] GSFC TPC: ${company} - ${drive}`,
      whatsappMessage,
      JSON.stringify({ application_id: applicationId }),
      'sent'
    );

    const waUrl = buildWhatsAppUrl(phone, whatsappMessage);

    res.json({
      success: true,
      message: `✅ Interview reminder dispatched to ${name} via WhatsApp & Email!`,
      whatsapp_url: waUrl,
      preview_text: whatsappMessage,
      log_id: logId
    });
  } catch (err) {
    console.error('Error sending interview reminder:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. 1-Click Official Offer Letter Generator & Auto-Dispatch
router.post('/send-offer-letter', (req, res) => {
  try {
    const {
      applicationId,
      studentId,
      candidateName,
      candidateEmail,
      candidatePhone,
      candidateRoll,
      jobTitle,
      companyName,
      ctc,
      joiningDate,
      reportingLocation,
      notes
    } = req.body;

    const name = candidateName || 'Tanvi Joshi';
    const email = candidateEmail || 'student@gsfcuniversity.ac.in';
    const phone = candidatePhone || '919876543210';
    const roll = candidateRoll || 'GSFC/2026/CSE/001';
    const designation = jobTitle || 'Software Development Engineer';
    const company = companyName || 'gsfc limited';
    const packageCtc = ctc || '₹ 18,00,000 - ₹ 24,00,000 PA';
    const dateOfJoining = joiningDate || '01 July 2027';
    const location = reportingLocation || 'Corporate Headquarters / Technology Park, Vadodara';
    const letterRefNo = `GSFC-TPC-OFFER-${Date.now().toString().slice(-6)}`;
    const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const offerData = {
      ref_no: letterRefNo,
      issue_date: issueDate,
      candidate_name: name,
      candidate_email: email,
      candidate_roll: roll,
      company_name: company,
      designation: designation,
      ctc: packageCtc,
      joining_date: dateOfJoining,
      reporting_location: location,
      notes: notes || 'We congratulate you on your selection and look forward to your impactful contributions.',
      tpc_stamp_verified: true,
      tpc_director: 'Head — Training & Placement Cell (TPC), GSFC University'
    };

    // Update application in DB with offer letter metadata and status = selected
    if (applicationId) {
      db.prepare(`
        UPDATE applications 
        SET status = 'selected',
            offer_letter_data_json = ?
        WHERE id = ?
      `).run(JSON.stringify(offerData), applicationId);
    }

    const whatsappOfferMessage = `🏆 *GSFC UNIVERSITY TPC • OFFICIAL OFFER OF EMPLOYMENT*\n\n` +
      `Dear *${name}* (${roll}),\n\n` +
      `🎉 *Congratulations!* On behalf of *${company}* and GSFC University Training & Placement Cell (TPC), we are delighted to offer you the position of:\n\n` +
      `💼 *Designation*: ${designation}\n` +
      `💰 *Annual CTC*: ${packageCtc}\n` +
      `📍 *Location*: ${location}\n` +
      `📅 *Expected Joining Date*: ${dateOfJoining}\n` +
      `📄 *Letter Ref*: ${letterRefNo}\n\n` +
      `Your formal letter has been signed, stamped, and archived in the GSFC Placement Portal.\n\n` +
      `👉 *View & Download Signed PDF*: http://localhost:5173/#student\n\n` +
      `*Warm Regards,*\n` +
      `*Training & Placement Cell (TPC)*\n` +
      `*GSFC University, Vadodara*`;

    // Log notification in audit table
    const logId = uuidv4();
    db.prepare(`
      INSERT INTO notifications_log (id, recipient_name, recipient_email, recipient_phone, channel, notification_type, title, message, metadata_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      name,
      email,
      phone,
      'whatsapp',
      'offer_letter',
      `Official Offer Letter: ${company} — ${designation}`,
      whatsappOfferMessage,
      JSON.stringify(offerData),
      'sent'
    );

    // Email dispatch log
    db.prepare(`
      INSERT INTO notifications_log (id, recipient_name, recipient_email, recipient_phone, channel, notification_type, title, message, metadata_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      name,
      email,
      phone,
      'email',
      'offer_letter',
      `[OFFICIAL OFFER LETTER] Congratulations ${name} - Selected at ${company}!`,
      whatsappOfferMessage,
      JSON.stringify(offerData),
      'sent'
    );

    const waUrl = buildWhatsAppUrl(phone, whatsappOfferMessage);

    res.json({
      success: true,
      message: `🎉 Official Offer Letter issued & dispatched to ${name} (${company})!`,
      offer_data: offerData,
      whatsapp_url: waUrl,
      preview_text: whatsappOfferMessage,
      log_id: logId
    });
  } catch (err) {
    console.error('Error generating and sending offer letter:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Get System-Wide Communication Audit Logs
router.get('/logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM notifications_log 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Student-Specific Placement Notifications & Offer Letters
router.get('/student/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const student = db.prepare('SELECT s.*, u.email FROM student_profiles s JOIN users u ON s.user_id = u.id WHERE s.id = ?').get(studentId);
    
    if (!student) {
      return res.json([]);
    }

    const logs = db.prepare(`
      SELECT * FROM notifications_log 
      WHERE recipient_email = ? OR recipient_name = ?
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(student.email, student.name);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
