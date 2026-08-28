/**
 * 📬 CampusHire AI — Student Placement Mailbox & Direct Messaging Engine
 * Stores and dispatches official interview invitations, shortlist notices,
 * and direct recruiter/admin/faculty messages to students.
 */

import { dbVault } from '../services/dbVault';

export const INITIAL_STUDENT_INBOX_MESSAGES = [
  {
    id: 'msg_google_invitation_01',
    student_id: 's_candidate',
    student_email: '24bt04171@gsfcuniversity.ac.in',
    student_name: 'Om Thakkar',
    sender_type: 'company', // 'company' | 'admin' | 'faculty'
    sender_name: 'Google Cloud India Recruitment Team',
    sender_email: 'campus.hiring@google.com',
    sender_role: 'Technical Hiring Lead',
    company_name: 'Google Cloud India',
    subject: '🎉 Congratulations! Invitation for Technical Interview & System Design Round',
    body: `Dear Om Thakkar,\n\nBased on your exceptional ATS score (98%) and performance in the CampusHire AI Sandbox, we are delighted to invite you to the Technical Interview Round for the position of Software Engineer — AI & Cloud at Google Cloud India.\n\n📅 Date: September 04, 2026\n⏰ Time: 10:00 AM IST\n📍 Mode: GSFC University Innovation Lab / Google Meet\n🔗 Link: https://meet.google.com/goo-gsfc-int\n\nPlease confirm your availability by reviewing this notice.\n\nBest regards,\nCampus Talent Acquisition Team\nGoogle Cloud India`,
    event_stage: 'Technical Interview Round 1',
    scheduled_date: '2026-09-04',
    scheduled_time: '10:00 AM IST',
    meeting_link: 'https://meet.google.com/goo-gsfc-int',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
  },
  {
    id: 'msg_msft_assessment_02',
    student_id: 's_candidate',
    student_email: '24bt04171@gsfcuniversity.ac.in',
    student_name: 'Om Thakkar',
    sender_type: 'company',
    sender_name: 'Microsoft Azure University Relations',
    sender_email: 'campus.recruit@microsoft.com',
    sender_role: 'Senior Campus Recruiter',
    company_name: 'Microsoft Azure Systems',
    subject: '⚡ Microsoft Azure Graduate SDE — Online Assessment Test Instructions',
    body: `Hello Om,\n\nThank you for applying to Microsoft Azure Systems through GSFC Placement Portal. Your profile has been shortlisted for the Online Coding Assessment.\n\n📅 Assessment Window: September 08, 2026 (02:00 PM – 04:00 PM IST)\n📌 Topics: Dynamic Programming, Data Structures, Distributed Caching\n\nEnsure you have a stable network and webcam access ready for AI proctoring.\n\nRegards,\nMicrosoft University Hiring`,
    event_stage: 'Online Coding Assessment',
    scheduled_date: '2026-09-08',
    scheduled_time: '02:00 PM IST',
    meeting_link: 'https://microsoft.com/assessment/gsfc-2026',
    is_read: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString() // 1 day ago
  },
  {
    id: 'msg_admin_doc_verify_03',
    student_id: 's_candidate',
    student_email: '24bt04171@gsfcuniversity.ac.in',
    student_name: 'Om Thakkar',
    sender_type: 'admin',
    sender_name: 'TPC Admin & Placement Cell',
    sender_email: 'placement@gsfcuniversity.ac.in',
    sender_role: 'Chief Placement Officer',
    company_name: 'GSFC Placement Cell',
    subject: '📋 Mandatory Document Verification for Upcoming Dream Tier Companies',
    body: `Dear Om,\n\nThis is an official notice from the Training and Placement Cell (TPC). Please ensure your 7th Semester marksheets, Government ID proof, and updated ATS Resume are verified on your student dashboard before the Google and Microsoft drive dates.\n\nVenue for physical spot check: SOT Placement Office (Room 204).\n\nBest Wishes,\nGSFC University TPC`,
    event_stage: 'Document Verification',
    scheduled_date: '2026-09-02',
    scheduled_time: '11:00 AM IST',
    is_read: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const STORAGE_KEY = 'gsfc_student_inbox_messages';

export const studentInboxStorage = {
  getMessages: (studentEmailOrId) => {
    try {
      const fromVault = dbVault.getCollection(STORAGE_KEY, null);
      if (Array.isArray(fromVault) && fromVault.length > 0) {
        return fromVault;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error fetching student inbox messages:', e);
    }

    studentInboxStorage.saveMessages(INITIAL_STUDENT_INBOX_MESSAGES);
    return INITIAL_STUDENT_INBOX_MESSAGES;
  },

  saveMessages: (messages) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      dbVault.saveCollection(STORAGE_KEY, messages);
      window.dispatchEvent(new CustomEvent('student_inbox_updated', { detail: messages }));
    } catch (e) {
      console.error('Error saving student inbox messages:', e);
    }
  },

  sendMessage: (msgData, senderUser) => {
    const messages = studentInboxStorage.getMessages();
    const newMsg = {
      id: msgData.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      student_id: msgData.student_id || 's_candidate',
      student_email: msgData.student_email || '24bt04171@gsfcuniversity.ac.in',
      student_name: msgData.student_name || 'Om Thakkar',
      sender_type: msgData.sender_type || (senderUser?.role === 'faculty' ? 'faculty' : senderUser?.role === 'admin' ? 'admin' : 'company'),
      sender_name: msgData.sender_name || senderUser?.name || senderUser?.company_name || 'Official Placement Coordinator',
      sender_email: msgData.sender_email || senderUser?.email || 'recruitment@company.com',
      sender_role: msgData.sender_role || senderUser?.role || 'Campus Recruiter',
      company_name: msgData.company_name || senderUser?.company_name || 'Corporate Partner',
      subject: msgData.subject || 'Official Placement Communication',
      body: msgData.body || '',
      event_stage: msgData.event_stage || 'Interview Call',
      scheduled_date: msgData.scheduled_date || '',
      scheduled_time: msgData.scheduled_time || '',
      meeting_link: msgData.meeting_link || '',
      is_read: false,
      created_at: new Date().toISOString()
    };

    const updated = [newMsg, ...messages];
    studentInboxStorage.saveMessages(updated);

    // Non-blocking sync with backend
    try {
      fetch('/api/company/send-student-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      }).catch(() => {});
    } catch (e) {}

    return newMsg;
  },

  markAsRead: (messageId) => {
    const messages = studentInboxStorage.getMessages();
    const updated = messages.map(m => m.id === messageId ? { ...m, is_read: true } : m);
    studentInboxStorage.saveMessages(updated);
    return updated;
  },

  deleteMessage: (messageId) => {
    const messages = studentInboxStorage.getMessages();
    const updated = messages.filter(m => m.id !== messageId);
    studentInboxStorage.saveMessages(updated);
    return updated;
  }
};
