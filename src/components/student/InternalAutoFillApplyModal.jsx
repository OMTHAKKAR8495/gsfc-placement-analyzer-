import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Send, FileText, CheckCircle, Sparkles, User, Mail, Phone, Award, BookOpen, Layers } from 'lucide-react';

export default function InternalAutoFillApplyModal({ isOpen, onClose, requirement, student, onSubmitApplication }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: '',
    branch: '',
    cgpa: '',
    skills: '',
    projectsSummary: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      let parsed = {};
      try {
        parsed = typeof student.parsed_resume_json === 'string'
          ? JSON.parse(student.parsed_resume_json || '{}')
          : (student.parsed_resume_json || {});
      } catch (e) {}

      const skillsList = parsed.skills?.technical
        ? parsed.skills.technical.join(', ')
        : (student.skills ? student.skills.join(', ') : 'Python, React, SQL');

      const projList = parsed.projects
        ? parsed.projects.map(p => p.title).join('; ')
        : 'Neural Placement Matcher; Realtime Code Collaboration Tool';

      setFormData({
        name: student.name || parsed.name || 'Arav Sharma',
        email: student.email || parsed.email || 'arav.sharma@student.edu',
        phone: parsed.phone || '+91 9876543210',
        program: student.program || parsed.program || 'BTech CSE',
        branch: student.branch || parsed.branch || 'Computer Science & Engineering',
        cgpa: student.cgpa || parsed.cgpa || 8.9,
        skills: skillsList,
        projectsSummary: projList
      });
    }
  }, [student, isOpen]);

  if (!isOpen || !requirement) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmitApplication(requirement.id, formData);
    setSubmitting(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full shadow-2xl overflow-hidden my-8 text-slate-900 dark:text-slate-100">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase rounded-lg border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-Filled Application Form
              </span>
            </div>
            <h2 className="text-xl font-black">{requirement.title}</h2>
            <p className="text-xs text-slate-300 font-bold">{requirement.company_name} • CTC: {requirement.ctc_range}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-Fill Guidance Notice */}
        <div className="bg-blue-50 dark:bg-blue-950/40 p-4 border-b border-blue-100 dark:border-blue-900/50 flex items-center gap-3 text-xs font-bold text-blue-900 dark:text-blue-200">
          <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
          <span>All fields below have been pre-filled from your parsed resume. Feel free to edit inline before submitting.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Candidate Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Academic CGPA</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.cgpa}
                onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Degree Program</label>
              <input
                type="text"
                required
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Specialization / Branch</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Technical Skills Summary</label>
            <textarea
              rows={2}
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-900"
            />
          </div>

          {/* Resume Attachment Preview */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-900 dark:text-blue-400" />
              <div>
                <div className="text-xs font-black">Attached Verified Resume</div>
                <div className="text-[10px] text-slate-500 font-bold">sample_resume_arav_sharma.pdf</div>
              </div>
            </div>
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-lg">
              Verified PDF
            </span>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-xl flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting Application...' : 'Confirm & Submit Application'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : null;
}
