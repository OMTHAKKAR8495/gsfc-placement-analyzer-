import { dbVault } from '../services/dbVault';

const STORAGE_KEY = 'gsfc_student_company_mails';

export const INITIAL_STUDENT_MAILS = [];

let inMemoryMailCache = null;
let isFetchingMails = false;

// Background initial sync with Backend SQLite API
async function syncMailsFromBackend() {
  if (isFetchingMails || typeof window === 'undefined') return;
  isFetchingMails = true;
  try {
    const res = await fetch('/api/company/student-mails');
    if (res.ok) {
      const serverMails = await res.json();
      if (Array.isArray(serverMails)) {
        inMemoryMailCache = serverMails;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverMails));
          dbVault.saveCollection('student_company_mails', serverMails);
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('gsfc_student_mail_updated', { detail: { allMails: serverMails } }));
      }
    }
  } catch (err) {
    console.warn('Backend student mail sync notice:', err.message);
  } finally {
    isFetchingMails = false;
  }
}

if (typeof window !== 'undefined') {
  syncMailsFromBackend();
}

export function fetchServerStudentMails() {
  syncMailsFromBackend();
  return inMemoryMailCache || getStudentMails();
}

export function getStudentMails() {
  if (inMemoryMailCache && Array.isArray(inMemoryMailCache)) {
    return inMemoryMailCache;
  }
  try {
    const fromVault = dbVault.getCollection('student_company_mails', null);
    if (fromVault && Array.isArray(fromVault)) {
      const cleanVault = fromVault.filter(m => !m.id?.includes('mail_seed') && !m.room_id?.includes('google'));
      inMemoryMailCache = cleanVault;
      return cleanVault;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleanParsed = parsed.filter(m => !m.id?.includes('mail_seed') && !m.room_id?.includes('google'));
        inMemoryMailCache = cleanParsed;
        return cleanParsed;
      }
    }
  } catch (err) {
    console.error('Error reading student mails:', err);
  }
  inMemoryMailCache = [];
  return [];
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

    const updated = [newMail, ...existing.filter(x => x.id !== newMail.id)];
    inMemoryMailCache = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dbVault.saveCollection('student_company_mails', updated);

    // Dispatch custom event for real-time reactivity in open components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gsfc_student_mail_updated', { detail: { newMail, allMails: updated } }));
    }

    // Post to backend SQLite API asynchronously
    try {
      fetch('/api/company/student-mails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMail)
      }).catch(err => console.warn('Async student mail POST notice:', err));
    } catch (e) {}

    return newMail;
  } catch (err) {
    console.error('Error saving student mail:', err);
    return null;
  }
}

export function isCompanyMatching(mail, companyNameOrId, isGsfcInternal = false) {
  if (!companyNameOrId || companyNameOrId === 'all') return true;

  const mailComp = (mail.company_name || '').toLowerCase();
  const mailId = (mail.company_id || '').toLowerCase();
  const query = String(companyNameOrId).toLowerCase().trim();

  if (isGsfcInternal) {
    return mailComp.includes('gsfc') || mailId.includes('gsfc');
  }

  // Keywords intelligent check
  if (query.includes('google') && (mailComp.includes('google') || mailId.includes('google'))) return true;
  if (query.includes('microsoft') && (mailComp.includes('microsoft') || mailId.includes('microsoft') || mailComp.includes('azure'))) return true;
  if (query.includes('tcs') && (mailComp.includes('tcs') || mailId.includes('tcs') || mailComp.includes('tata'))) return true;
  if (query.includes('gsfc') && (mailComp.includes('gsfc') || mailId.includes('gsfc'))) return true;

  // Direct substring / exact id match
  return mailComp.includes(query) || query.includes(mailComp) || mailId === query;
}

export function getMailsForCompany(companyNameOrId, isGsfcInternal = false) {
  const allMails = getStudentMails();
  if (!companyNameOrId || companyNameOrId === 'all') return allMails;

  return allMails.filter(m => isCompanyMatching(m, companyNameOrId, isGsfcInternal));
}

export function markMailStatus(mailId, status) {
  try {
    const mails = getStudentMails();
    const updated = mails.map(m => (m.id === mailId ? { ...m, status } : m));
    inMemoryMailCache = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dbVault.saveCollection('student_company_mails', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gsfc_student_mail_updated', { detail: { mailId, status, allMails: updated } }));
    }

    // Sync status with backend SQLite API
    try {
      fetch(`/api/company/student-mails/${mailId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }).catch(err => console.warn('Async student mail status PATCH notice:', err));
    } catch (e) {}

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

    inMemoryMailCache = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dbVault.saveCollection('student_company_mails', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gsfc_student_mail_updated', { detail: { mailId, replyText, repliedAt, allMails: updated } }));
    }

    // Post to backend SQLite API asynchronously
    try {
      fetch(`/api/company/student-mails/${mailId}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText, recruiterName })
      }).catch(err => console.warn('Async student mail reply PATCH notice:', err));
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
    inMemoryMailCache = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dbVault.saveCollection('student_company_mails', updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gsfc_student_mail_updated', { detail: { deletedId: mailId, allMails: updated } }));
    }

    // Delete from backend SQLite API asynchronously
    try {
      fetch(`/api/company/student-mails/${mailId}`, {
        method: 'DELETE'
      }).catch(err => console.warn('Async student mail DELETE notice:', err));
    } catch (e) {}

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

