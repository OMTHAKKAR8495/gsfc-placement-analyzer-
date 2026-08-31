import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, Plus, Search, Filter, CheckCircle2, AlertCircle, Clock, 
  Building2, User, Award, FileText, Download, Edit3, Trash2, X, Save, 
  ExternalLink, Check, Sparkles, RefreshCw, ChevronRight, ShieldCheck,
  Star, DollarSign, Calendar, MapPin, Mail, Phone
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function FacultyInternshipManagement({ currentUser }) {
  const { showToast } = useToast();

  const [internships, setInternships] = useState([]);
  const [stats, setStats] = useState({
    total_internships: 0,
    active_internships: 0,
    completed_internships: 0,
    approved_noc_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCompletion, setSelectedCompletion] = useState('ALL');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    student_name: '',
    roll_number: '',
    program: 'BTech CSE',
    branch: 'Computer Science & Engineering',
    company_name: '',
    role: '',
    duration: '6 Months (Jan 2026 - Jun 2026)',
    start_date: '2026-01-05',
    end_date: '2026-06-30',
    stipend: '₹25,000 / month',
    location: 'Vadodara (On-site)',
    industry_mentor_name: '',
    industry_mentor_email: '',
    faculty_mentor_name: currentUser?.name || 'Dr. Neeshu Chaudhary',
    status: 'approved',
    completion_status: 'ongoing',
    performance_rating: 4.5,
    evaluation_notes: '',
    noc_status: 'issued',
    offer_letter_url: '',
    completion_certificate_url: ''
  });

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDept !== 'ALL') params.append('department', selectedDept);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedCompletion !== 'ALL') params.append('completion_status', selectedCompletion);
      if (searchQuery) params.append('search', searchQuery);

      const [internRes, statsRes] = await Promise.all([
        fetch(`/api/faculty/internships?${params.toString()}`),
        fetch('/api/faculty/internships/stats')
      ]);

      if (internRes.ok) {
        const data = await internRes.json();
        setInternships(data || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData || {});
      }
    } catch (err) {
      console.error('Error loading internships:', err);
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not load internship records from server.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [selectedDept, selectedStatus, selectedCompletion]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInternships();
  };

  const openAddModal = () => {
    setFormData({
      student_name: '',
      roll_number: '',
      program: 'BTech CSE',
      branch: 'Computer Science & Engineering',
      company_name: '',
      role: '',
      duration: '6 Months (Jan 2026 - Jun 2026)',
      start_date: '2026-01-05',
      end_date: '2026-06-30',
      stipend: '₹25,000 / month',
      location: 'Vadodara (On-site)',
      industry_mentor_name: '',
      industry_mentor_email: '',
      faculty_mentor_name: currentUser?.name || 'Dr. Neeshu Chaudhary',
      status: 'approved',
      completion_status: 'ongoing',
      performance_rating: 4.5,
      evaluation_notes: '',
      noc_status: 'issued',
      offer_letter_url: '',
      completion_certificate_url: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedInternship(item);
    setFormData({
      student_name: item.student_name || '',
      roll_number: item.roll_number || '',
      program: item.program || 'BTech CSE',
      branch: item.branch || '',
      company_name: item.company_name || '',
      role: item.role || '',
      duration: item.duration || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      stipend: item.stipend || '',
      location: item.location || '',
      industry_mentor_name: item.industry_mentor_name || '',
      industry_mentor_email: item.industry_mentor_email || '',
      faculty_mentor_name: item.faculty_mentor_name || '',
      status: item.status || 'approved',
      completion_status: item.completion_status || 'ongoing',
      performance_rating: item.performance_rating || 4.5,
      evaluation_notes: item.evaluation_notes || '',
      noc_status: item.noc_status || 'issued',
      offer_letter_url: item.offer_letter_url || '',
      completion_certificate_url: item.completion_certificate_url || ''
    });
    setIsEditModalOpen(true);
  };

  const openDossierModal = (item) => {
    setSelectedInternship(item);
    setIsDossierModalOpen(true);
  };

  const handleCreateInternship = async (e) => {
    e.preventDefault();
    if (!formData.student_name || !formData.roll_number || !formData.company_name || !formData.role) {
      showToast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please fill in student name, roll number, company, and role.'
      });
      return;
    }

    try {
      const res = await fetch('/api/faculty/internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          created_by: currentUser?.name || 'TPC Faculty Coordinator'
        })
      });

      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Internship Logged',
          message: `Official internship record for ${formData.student_name} at ${formData.company_name} saved successfully!`
        });
        setIsAddModalOpen(false);
        fetchInternships();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save internship');
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message
      });
    }
  };

  const handleUpdateInternship = async (e) => {
    e.preventDefault();
    if (!selectedInternship) return;

    try {
      const res = await fetch(`/api/faculty/internships/${selectedInternship.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Internship Updated',
          message: 'Internship details and mentor records updated successfully.'
        });
        setIsEditModalOpen(false);
        fetchInternships();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Update Error',
        message: err.message
      });
    }
  };

  const handleQuickStatusUpdate = async (id, statusUpdates, successMessage) => {
    try {
      const res = await fetch(`/api/faculty/internships/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusUpdates)
      });

      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Status Updated',
          message: successMessage || 'Internship tracking status updated.'
        });
        fetchInternships();
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message
      });
    }
  };

  const handleDeleteInternship = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove the internship record for ${name}?`)) return;

    try {
      const res = await fetch(`/api/faculty/internships/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast({
          type: 'info',
          title: 'Record Removed',
          message: `Internship log for ${name} removed.`
        });
        fetchInternships();
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> GSFC University Prayaas DCS Integration
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-amber-400" />
              Faculty Internship & Corporate Training Hub
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Monitor, log, approve official university NOCs, and track 6-month industry internships & PPOs across BTech CSE, Chemical, Mechanical & IT departments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={fetchInternships}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Refresh Internship Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button 
              onClick={openAddModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Student Internship
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Internships</span>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {stats.total_internships || internships.length}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">Across Monitored Batches</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Active & Ongoing</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {stats.active_internships || internships.filter(i => i.completion_status === 'ongoing').length}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">Under Corporate Mentorship</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Official NOCs Issued</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.approved_noc_count || internships.filter(i => i.noc_status === 'issued').length}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">University Endorsed</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Completed / PPOs</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-2">
            {stats.completed_internships || internships.filter(i => i.completion_status === 'completed').length}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-1">Credit Transfer Ready</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search candidate name, roll no, company, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          <button 
            type="submit"
            className="px-3 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition cursor-pointer"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">🏢 All Departments</option>
            <option value="CSE">💻 Computer Science & Engg</option>
            <option value="Chemical">🧪 Chemical Engineering</option>
            <option value="Mechanical">⚙️ Mechanical Engineering</option>
            <option value="IT">🌐 Information Technology</option>
          </select>

          {/* Completion Status Filter */}
          <select 
            value={selectedCompletion}
            onChange={(e) => setSelectedCompletion(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">⏱️ All Statuses</option>
            <option value="ongoing">🟢 Ongoing / In-Progress</option>
            <option value="completed">🏆 Completed / PPO</option>
            <option value="pending">⏳ Approval Pending</option>
          </select>
        </div>
      </div>

      {/* Internships Records Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Enrolled Student Internships ({internships.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Official GSFC University Placement & Internship Ledger
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
            <p className="text-xs font-bold">Loading official internship records...</p>
          </div>
        ) : internships.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Briefcase className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">No internship records found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No matching records found for the applied department and filters. Click "Log Student Internship" to create an entry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-700 uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Student & Roll No</th>
                  <th className="py-3.5 px-4">Company & Role</th>
                  <th className="py-3.5 px-4">Duration & Stipend</th>
                  <th className="py-3.5 px-4">Mentors</th>
                  <th className="py-3.5 px-4">NOC & State</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {internships.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        {item.student_name}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                        Roll: <span className="font-mono text-indigo-600 dark:text-indigo-400">{item.roll_number}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {item.program} • {item.branch}
                      </div>
                    </td>

                    {/* Company & Role */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        {item.company_name}
                      </div>
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                        {item.role}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {item.location || 'Vadodara'}
                      </div>
                    </td>

                    {/* Duration & Stipend */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.duration}
                      </div>
                      <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {item.stipend || 'Unpaid'}
                      </div>
                      {item.start_date && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.start_date} {item.end_date ? `to ${item.end_date}` : ''}
                        </div>
                      )}
                    </td>

                    {/* Mentors */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        Industry: <span className="text-slate-600 dark:text-slate-400">{item.industry_mentor_name || 'Assigned Lead'}</span>
                      </div>
                      <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                        Faculty: <span>{item.faculty_mentor_name || 'Dr. Neeshu Chaudhary'}</span>
                      </div>
                    </td>

                    {/* NOC & State */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.noc_status === 'issued' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}>
                          NOC: {item.noc_status || 'Issued'}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.completion_status === 'completed'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                            : item.completion_status === 'ongoing' || item.status === 'approved'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {item.completion_status || item.status}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDossierModal(item)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 hover:text-blue-600 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="View Official Internship Dossier & NOC"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {item.completion_status !== 'completed' && (
                          <button
                            onClick={() => handleQuickStatusUpdate(item.id, { completion_status: 'completed', status: 'completed' }, `Marked ${item.student_name}'s internship as completed / PPO!`)}
                            className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Mark as Completed / PPO"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteInternship(item.id, item.student_name)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: LOG NEW STUDENT INTERNSHIP                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Log Student Internship</h3>
                  <p className="text-xs text-slate-500 font-medium">Prayaas DCS Official Placement & Internship Record</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInternship} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Om Thakkar"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Enrollment / Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24BT04171"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Program *</label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="BTech CSE">BTech Computer Science & Engg</option>
                    <option value="BTech Chemical">BTech Chemical Engineering</option>
                    <option value="BTech Mechanical">BTech Mechanical Engineering</option>
                    <option value="BTech IT">BTech Information Technology</option>
                    <option value="MBA">MBA Management Studies</option>
                    <option value="MSc Biotechnology">MSc Biotechnology</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Branch / Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. AI & Cloud / Industrial Systems"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Cloud India / GSFC Limited"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloud Architecture & AI Intern"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 6 Months (Jan - Jun 2026)"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Monthly Stipend</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹35,000 / month"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Vadodara / Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Industry Mentor Name & Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kannan (Staff Cloud Engineer)"
                    value={formData.industry_mentor_name}
                    onChange={(e) => setFormData({ ...formData, industry_mentor_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Industry Mentor Email</label>
                  <input
                    type="email"
                    placeholder="e.g. mentor@company.com"
                    value={formData.industry_mentor_email}
                    onChange={(e) => setFormData({ ...formData, industry_mentor_email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Faculty Mentor Coordinator</label>
                  <input
                    type="text"
                    value={formData.faculty_mentor_name}
                    onChange={(e) => setFormData({ ...formData, faculty_mentor_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">NOC Status</label>
                  <select
                    value={formData.noc_status}
                    onChange={(e) => setFormData({ ...formData, noc_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="issued">✅ Issued (Official University Approval)</option>
                    <option value="pending">⏳ Pending Review</option>
                    <option value="not_required">⚪ Not Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Faculty Evaluation & Progress Notes</label>
                <textarea
                  rows="2"
                  placeholder="Notes on student performance, project scope, monthly reports..."
                  value={formData.evaluation_notes}
                  onChange={(e) => setFormData({ ...formData, evaluation_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Internship Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: EDIT INTERNSHIP DETAILS                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isEditModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Internship Record</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedInternship.student_name} ({selectedInternship.roll_number})</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInternship} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Completion Status</label>
                  <select
                    value={formData.completion_status}
                    onChange={(e) => setFormData({ ...formData, completion_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="ongoing">🟢 Ongoing / In-Progress</option>
                    <option value="completed">🏆 Completed / PPO</option>
                    <option value="pending">⏳ Pending Verification</option>
                    <option value="terminated">❌ Terminated</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">NOC Status</label>
                  <select
                    value={formData.noc_status}
                    onChange={(e) => setFormData({ ...formData, noc_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="issued">✅ Issued</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="not_required">⚪ Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Performance Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.performance_rating}
                    onChange={(e) => setFormData({ ...formData, performance_rating: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">Evaluation & Mentorship Notes</label>
                <textarea
                  rows="3"
                  value={formData.evaluation_notes}
                  onChange={(e) => setFormData({ ...formData, evaluation_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: OFFICIAL INTERNSHIP DOSSIER & NOC PREVIEW            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isDossierModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Official Internship Dossier</h3>
                  <p className="text-xs text-slate-500 font-medium">GSFC University Training & Placement Cell</p>
                </div>
              </div>
              <button onClick={() => setIsDossierModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">Candidate Information</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{selectedInternship.roll_number}</span>
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white">{selectedInternship.student_name}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{selectedInternship.program} • {selectedInternship.branch}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] font-black uppercase text-slate-400">Company & Role</div>
                  <div className="font-black text-slate-900 dark:text-white mt-1">{selectedInternship.company_name}</div>
                  <div className="text-[11px] font-bold text-slate-500">{selectedInternship.role}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] font-black uppercase text-slate-400">Duration & Compensation</div>
                  <div className="font-black text-slate-900 dark:text-white mt-1">{selectedInternship.duration}</div>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{selectedInternship.stipend}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="text-[10px] font-black uppercase text-slate-400">Mentorship Alignment</div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300">
                  <strong>Industry Mentor:</strong> {selectedInternship.industry_mentor_name || 'N/A'} {selectedInternship.industry_mentor_email ? `(${selectedInternship.industry_mentor_email})` : ''}
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300">
                  <strong>Faculty Advisor:</strong> {selectedInternship.faculty_mentor_name || 'Dr. Neeshu Chaudhary'}
                </div>
              </div>

              {selectedInternship.evaluation_notes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl text-[11px] text-slate-700 dark:text-slate-300">
                  <strong className="text-blue-900 dark:text-blue-300 block mb-1">Faculty Progress Evaluation:</strong>
                  {selectedInternship.evaluation_notes}
                </div>
              )}

              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-black text-emerald-900 dark:text-emerald-300">Official University NOC Stamped</div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Valid for 8th Semester Academic Credit Transfer</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black">VERIFIED</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-5 mt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsDossierModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
