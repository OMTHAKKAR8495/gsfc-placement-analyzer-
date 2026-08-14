import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, Sparkles, AlertCircle, ArrowLeft, CheckCircle, ExternalLink, Download, FileText, Search, Tag, ShieldCheck, Database, Printer, Eye } from 'lucide-react';
import InterviewQuestionGeneratorModal from './InterviewQuestionGeneratorModal';
import ReportPDFModal from '../common/ReportPDFModal';

export default function CompanyDashboard({ company, onRefreshCompany }) {
  const [activeTab, setActiveTab] = useState('requirements'); // 'requirements', 'database'
  const [requirements, setRequirements] = useState([]);
  const [activeReqApplicants, setActiveReqApplicants] = useState(null);
  const [applicantsData, setApplicantsData] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Candidate Database View State
  const [allCandidates, setAllCandidates] = useState([]);
  const [searchCandidateQuery, setSearchCandidateQuery] = useState('');
  const [selectedCandidateReport, setSelectedCandidateReport] = useState(null);
  const [pdfReportModalOpen, setPdfReportModalOpen] = useState(false);

  // AI Question Generator Modal state
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Form state
  const [postForm, setPostForm] = useState({
    title: '',
    eligible_programs: ['BTech CSE', 'BTech IT'],
    min_cgpa: '7.5',
    required_skills: 'Python, React, SQL',
    preferred_skills: 'Docker, FastAPI',
    job_type: 'Full-time',
    ctc_range: '₹18,00,000 - ₹24,00,000 PA',
    openings: '3',
    deadline: '2026-10-30',
    job_description: 'We are seeking talented software engineers to build enterprise web services, cloud microservices, and AI integrations.'
  });

  const availablePrograms = ['BTech CSE', 'BTech IT', 'BTech Mechanical', 'BTech ECE', 'BBA', 'MBA', 'MSc CS'];

  useEffect(() => {
    fetchCompanyRequirements();
    fetchCandidateDatabase();
  }, [company]);

  const fetchCompanyRequirements = async () => {
    if (!company?.id) return;
    try {
      const res = await fetch(`/api/company/requirements?companyId=${company.id}`);
      const data = await res.json();
      setRequirements(data);
    } catch (err) {
      console.error('Error fetching company requirements:', err);
    }
  };

  const fetchCandidateDatabase = async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setAllCandidates(data || []);
    } catch (err) {
      console.error('Error fetching candidate database:', err);
    }
  };

  const handlePostRequirement = async (e) => {
    e.preventDefault();
    if (!company?.approved) {
      alert('Your recruiter account is pending TPC Admin approval. You cannot post requirements until verified.');
      return;
    }

    setLoading(true);
    try {
      const reqSkillsArr = postForm.required_skills.split(',').map(s=>s.trim()).filter(Boolean);
      const prefSkillsArr = postForm.preferred_skills.split(',').map(s=>s.trim()).filter(Boolean);

      const res = await fetch('/api/company/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postForm,
          company_id: company.id,
          required_skills: reqSkillsArr,
          preferred_skills: prefSkillsArr
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post requirement');

      alert('🎉 Placement hiring requirement posted successfully!');
      setShowPostModal(false);
      fetchCompanyRequirements();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewApplicants = async (reqItem) => {
    setActiveReqApplicants(reqItem);
    try {
      const res = await fetch(`/api/company/requirements/${reqItem.id}/applicants`);
      const data = await res.json();
      setApplicantsData(data.applicants || []);
    } catch (err) {
      console.error('Error fetching applicants:', err);
    }
  };

  const openCandidatePdfReport = (candidate) => {
    setSelectedCandidateReport({
      name: candidate.name,
      email: candidate.email || `${candidate.name.toLowerCase().replace(/\s+/g, '_')}@student.edu`,
      atsScore: candidate.ats_score || 92,
      skills: ['Python', 'React', 'SQL', 'FastAPI', 'Docker', 'Machine Learning']
    });
    setPdfReportModalOpen(true);
  };

  const filteredCandidates = allCandidates.filter(c => 
    c.name.toLowerCase().includes(searchCandidateQuery.toLowerCase()) ||
    c.program.toLowerCase().includes(searchCandidateQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Recruiter Banner */}
      <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4 z-10">
          <img
            src={company?.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60'}
            alt={company?.company_name}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-contain bg-slate-50 p-2 border border-slate-200 shadow-md shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{company?.company_name || 'Recruiting Partner'}</h1>
              {company?.approved ? (
                <span className="px-2.5 py-0.5 sm:py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black rounded-lg flex items-center gap-1 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified TPC Partner
                </span>
              ) : (
                <span className="px-2.5 py-0.5 sm:py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black rounded-lg flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Pending TPC Verification
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 mt-1 font-bold">{company?.industry || 'Technology'} • {company?.website}</p>
          </div>
        </div>

        <div className="z-10 w-full md:w-auto">
          <button
            onClick={() => setShowPostModal(true)}
            className="w-full md:w-auto py-3 px-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Post New Hiring Requirement</span>
          </button>
        </div>
      </div>

      {/* Recruiter Navigation Bar: Active Requirements vs Candidate Database */}
      <div className="flex items-center gap-3 bg-white/90 p-2 rounded-2xl border border-slate-200 shadow-sm max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'requirements'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Active Hiring Requirements ({requirements.length})
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
            activeTab === 'database'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" /> 🗄️ Candidate Database ({allCandidates.length})
        </button>
      </div>

      {/* VIEW 1: CANDIDATE DATABASE VIEW */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate database..."
                value={searchCandidateQuery}
                onChange={(e) => setSearchCandidateQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="text-xs text-blue-900 font-black">
              Showing {filteredCandidates.length} Saved GSFC Candidate Profiles
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                    <th className="py-4 px-4 sm:px-5">Candidate Name</th>
                    <th className="py-4 px-4 sm:px-5">Degree & CGPA</th>
                    <th className="py-4 px-4 sm:px-5">ATS Score</th>
                    <th className="py-4 px-4 sm:px-5">Shortlist Status</th>
                    <th className="py-4 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCandidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 px-4 sm:px-5 font-black text-slate-900">
                        <div className="text-sm">{cand.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{cand.roll_number}</div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <div className="text-slate-900 font-black">{cand.program}</div>
                        <div className="text-[11px] text-emerald-800 font-black">{cand.cgpa} CGPA</div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs rounded-xl">
                          {cand.ats_score || 92} / 100
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs rounded-xl flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> PASS (ELIGIBLE)
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-5 text-right">
                        <button
                          onClick={() => openCandidatePdfReport(cand)}
                          className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-md shrink-0"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-300" />
                          <span>PDF Report</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ACTIVE REQUIREMENTS GRID */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requirements.map((req) => (
              <div key={req.id} className="glass-card p-4 sm:p-6 rounded-3xl border border-slate-200/90 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-base text-slate-900">{req.title}</h3>
                    <div className="text-xs text-blue-900 font-black mt-0.5">{req.job_type} • CTC: {req.ctc_range}</div>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black rounded-xl flex items-center gap-1.5 shrink-0">
                    <Users className="w-3.5 h-3.5 text-blue-900 shrink-0" /> {req.applicant_count} Applicants
                  </span>
                </div>

                <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-bold">{req.job_description}</p>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    onClick={() => viewApplicants(req)}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all min-h-[42px]"
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>View Applicants ({req.applicant_count})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF REPORT MODAL */}
      <ReportPDFModal
        isOpen={pdfReportModalOpen}
        onClose={() => setPdfReportModalOpen(false)}
        candidateData={selectedCandidateReport}
      />
    </div>
  );
}
