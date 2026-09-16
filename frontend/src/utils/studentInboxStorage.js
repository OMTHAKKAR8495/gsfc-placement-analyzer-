/**
 * 📬 CampusHire AI — Student Placement Mailbox & Direct Messaging Engine
 * Stores and dispatches official interview invitations, shortlist notices,
 * and direct recruiter/admin/faculty messages to students.
 */

import { dbVault } from '../services/dbVault';

export const INITIAL_STUDENT_INBOX_MESSAGES = [];

const STORAGE_KEY = 'gsfc_student_inbox_messages';

export const studentInboxStorage = {
  getMessages: (studentEmailOrId) => {
    try {
      const fromVault = dbVault.getCollection(STORAGE_KEY, null);
      if (Array.isArray(fromVault)) {
        const cleanVault = fromVault.filter(m => !m.id?.includes('msg_google') && !m.id?.includes('msg_msft') && !m.id?.includes('msg_admin'));
        return cleanVault;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const cleanParsed = parsed.filter(m => !m.id?.includes('msg_google') && !m.id?.includes('msg_msft') && !m.id?.includes('msg_admin'));
          return cleanParsed;
        }
      }
    } catch (e) {
      console.warn('Error fetching student inbox messages:', e);
    }
    return [];
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
