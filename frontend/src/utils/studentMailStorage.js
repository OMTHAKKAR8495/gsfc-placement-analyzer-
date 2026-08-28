const STORAGE_KEY = 'gsfc_student_company_mails';

export const INITIAL_STUDENT_MAILS = [
  {
    id: 'mail_seed_1',
    company_name: 'Google Cloud India',
    company_id: 'c_google',
    sender_name: 'Thakkar Om',
    sender_email: 'thakkar_om@gmail.com',
    sender_phone: '+91 95584 13347',
    roll_number: '24BT04171',
    program: 'BTech CSE',
    branch: 'Computer Science & Engineering',
    cgpa: 8.9,
    type: 'meeting_absence',
    subject: '[Meeting Absence Explanation] Thakkar Om — Room gsfc-google-ai-101',
    message: 'Dear Google Cloud Hiring Team,\n\nDuring the live proctoring check for room gsfc-google-ai-101 (Software Development Engineer - AI & Cloud), I encountered an unexpected network glitch and temporary webcam permission refresh which triggered a security lock. I sincerely apologize for the inconvenience. I have retested my video/mic setup and would appreciate if my technical round can be rescheduled or re-evaluated.\n\nThank you,\nThakkar Om\nRoll No: 24BT04171',
    meeting_id: 'meet_google_ai_101',
    room_id: 'gsfc-google-ai-101',
    meeting_title: 'Google Cloud India — SDE Technical Interview & Live Coding',
    drive_title: 'Software Development Engineer - Cloud & AI',
    status: 'unread',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    recruiter_reply: null,
    replied_at: null,
    replied_by: null
  },
  {
    id: 'mail_seed_2',
    company_name: 'Tata Consultancy Services (TCS)',
    company_id: 'c_tcs',
    sender_name: 'Arav Sharma',
    sender_email: 'arav.sharma@student.gsfc.ac.in',
    sender_phone: '+91 98765 43212',
    roll_number: '22BCE115',
    program: 'BTech CSE',
    branch: 'Cybersecurity',
    cgpa: 8.6,
    type: 'leave_company',
    subject: '[Withdrawal Request] Arav Sharma — TCS Digital Prime',
    message: 'Respected TCS Recruitment Panel,\n\nI am writing to formally request withdrawal of my application from the TCS Digital recruitment process. I have accepted an offer from an earlier campus drive that aligns with my specialization in cybersecurity operations. I want to express my sincere gratitude for considering my profile.\n\nBest regards,\nArav Sharma',
    meeting_id: 'meet_tcs_digital_202',
    room_id: 'gsfc-tcs-digital-202',
    meeting_title: 'TCS Digital — Technical Assessment & System Design Review',
    drive_title: 'TCS Digital Prime (₹9.00 LPA)',
    status: 'replied',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    recruiter_reply: 'Dear Arav, We acknowledge your formal withdrawal request and have updated your application status accordingly. We wish you the very best in your future career endeavors.',
    replied_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    replied_by: 'TCS Campus Talent Acquisition Team'
  },
  {
    id: 'mail_seed_3',
    company_name: 'GSFC Limited',
    company_id: 'c_gsfc_limited',
    sender_name: 'Tanvi Joshi',
    sender_email: 'tanvi.j@gsfcuniversity.ac.in',
    sender_phone: '+91 98765 43211',
    roll_number: '22BCE108',
    program: 'BTech CSE',
    branch: 'AI & Data Science',
    cgpa: 8.8,
    type: 'meeting_absence',
    subject: '[Meeting Absence Explanation] Tanvi Joshi — Industrial Systems Interview',
    message: 'Respected GSFC Limited Placement Committee,\n\nI was unable to join the initial 10-minute briefing today due to mid-semester laboratory examination duties at GSFC University. I am now available and ready to present my technical portfolio for the Industrial Automation Systems Officer role at your earliest convenience.\n\nSincerely,\nTanvi Joshi',
    meeting_id: 'meet_gsfc_auto_01',
    room_id: 'GSFC-MEET-AUTO-771',
    meeting_title: 'GSFC Limited — Industrial Automation & Telemetry Panel',
    drive_title: 'IT & Industrial Automation Systems Officer',
    status: 'read',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    recruiter_reply: null,
    replied_at: null,
    replied_by: null
  },
  {
    id: 'mail_seed_4',
    company_name: 'Microsoft Azure Systems',
    company_id: 'c_microsoft',
    sender_name: 'Pooja Patel',
    sender_email: 'pooja.patel@student.gsfc.ac.in',
    sender_phone: '+91 98765 43213',
    roll_number: '22BCE124',
    program: 'BTech IT',
    branch: 'Information Technology',
    cgpa: 9.1,
    type: 'meeting_absence',
    subject: '[Meeting Absence Explanation] Pooja Patel — Azure Cloud Assessment',
    message: 'Dear Microsoft Recruiting Team,\n\nI encountered a brief power brownout in our campus area right at the scheduled interview start time. The backup power is restored now. Kindly permit me to rejoin the interview queue if possible.\n\nWarm regards,\nPooja Patel',
    meeting_id: 'meet_ms_azure_03',
    room_id: 'GSFC-MEET-AZURE-404',
    meeting_title: 'Microsoft Azure — Cloud Systems Interview',
    drive_title: 'Graduate Software Engineer (₹24.00 LPA)',
    status: 'unread',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    recruiter_reply: null,
    replied_at: null,
    replied_by: null
  }
];

export function getStudentMails() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDENT_MAILS));
      return INITIAL_STUDENT_MAILS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_STUDENT_MAILS;
  } catch (err) {
    console.error('Error reading student mails:', err);
    return INITIAL_STUDENT_MAILS;
  }
}

export function saveStudentMail(mailData) {
  try {
    const existing = getStudentMails();
    const newMail = {
      id: mailData.id || `mail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      company_name: mailData.company_name || 'Hiring Partner',
      company_id: mailData.company_id || '',
      sender_name: mailData.sender_name || 'Student Candidate',
      sender_email: mailData.sender_email || '',
      sender_phone: mailData.sender_phone || '',
      roll_number: mailData.roll_number || '',
      program: mailData.program || '',
      branch: mailData.branch || '',
      cgpa: mailData.cgpa || '',
      type: mailData.type || 'meeting_absence', // 'meeting_absence' | 'leave_company' | 'general'
      subject: mailData.subject || '[Candidate Communication]',
      message: mailData.message || mailData.note || '',
      meeting_id: mailData.meeting_id || '',
      room_id: mailData.room_id || '',
      meeting_title: mailData.meeting_title || '',
      drive_title: mailData.drive_title || '',
      status: mailData.status || 'unread',
      created_at: mailData.created_at || new Date().toISOString(),
      recruiter_reply: mailData.recruiter_reply || null,
      replied_at: mailData.replied_at || null,
      replied_by: mailData.replied_by || null
    };

    const updated = [newMail, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch custom event for real-time reactivity in open components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gsfc_student_mail_updated', { detail: { newMail, allMails: updated } }));
    }

    // Try posting to backend API asynchronously (non-blocking)
    try {
      fetch('/api/company/student-mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMail)
      }).catch(() => {});
    } catch (e) {}

    return newMail;
  } catch (err) {
    console.error('Error saving student mail:', err);
    return null;
  }
}

export function getMailsForCompany(companyNameOrId, isGsfcInternal = false) {
  const allMails = getStudentMails();
  if (!companyNameOrId || companyNameOrId === 'all') return allMails;

  const query = String(companyNameOrId).toLowerCase().trim();
  
  return allMails.filter(m => {
    const compName = (m.company_name || '').toLowerCase();
    const compId = (m.company_id || '').toLowerCase();
    
    if (isGsfcInternal) {
      // If GSFC Limited/Internal login, show GSFC mails by default, or all if viewing global
      return compName.includes('gsfc') || compId.includes('gsfc');
    }

    // Direct match by company name or id
    return compName.includes(query) || query.includes(compName) || compId === query;
  });
}

export function markMailStatus(mailId, status) {
  try {
    const mails = getStudentMails();
    const updated = mails.map(m => (m.id === mailId ? { ...m, status } : m));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gsfc_student_mail_updated', { detail: { mailId, status } }));
    }
    return updated;
  } catch (err) {
    console.error('Error updating mail status:', err);
    return getStudentMails();
  }
}

export function replyToStudentMail(mailId, replyText, recruiterName = 'Corporate Talent Acquisition') {
  try {
    const mails = getStudentMails();
    const repliedAt = new Date().toISOString();
    const updated = mails.map(m => {
      if (m.id === mailId) {
        return {
          ...m,
          status: 'replied',
          recruiter_reply: replyText,
          replied_by: recruiterName,
          replied_at: repliedAt
        };
      }
      return m;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gsfc_student_mail_updated', { detail: { mailId, replyText, repliedAt } }));
    }

    // Try posting to backend API asynchronously
    try {
      fetch(`/api/company/student-mails/${mailId}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText, recruiterName })
      }).catch(() => {});
    } catch (e) {}

    return updated;
  } catch (err) {
    console.error('Error replying to student mail:', err);
    return getStudentMails();
  }
}

export function deleteStudentMail(mailId) {
  try {
    const mails = getStudentMails();
    const updated = mails.filter(m => m.id !== mailId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gsfc_student_mail_updated', { detail: { deletedId: mailId } }));
    }
    return updated;
  } catch (err) {
    console.error('Error deleting student mail:', err);
    return getStudentMails();
  }
}

export function getUnreadCountForCompany(companyNameOrId, isGsfcInternal = false) {
  const compMails = getMailsForCompany(companyNameOrId, isGsfcInternal);
  return compMails.filter(m => m.status === 'unread').length;
}
