import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, Sparkles, AlertCircle, ArrowLeft, CheckCircle, ExternalLink, Download, FileText, Search, Tag, ShieldCheck } from 'lucide-react';
import InterviewQuestionGeneratorModal from './InterviewQuestionGeneratorModal';

export default function CompanyDashboard({ company, onRefreshCompany }) {
  const [requirements, setRequirements] = useState([]);
  const [activeReqApplicants, setActiveReqApplicants] = useState(null);
  const [applicantsData, setApplicantsData] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const toggleProgram = (prog) => {
    setPostForm(prev => {
      const current = prev.eligible_programs;
      const updated = current.includes(prog) ? current.filter(p => p !== prog) : [...current, prog];
      return { ...prev, eligible_programs: updated };
    });
  };

  const openQuestionGenerator = (candidate = null) => {
    setSelectedCandidate(candidate);
    setQuestionModalOpen(true);
  };

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

      {!company?.approved && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-3 font-bold">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-700" />
          <div>
            <span className="font-black block text-sm">Account Pending Approval by Training & Placement Cell</span>
            Your recruiter account is currently being verified by GSFC TPC Admin. Once approved, your requirements will appear on the live student feed.
          </div>
        </div>
      )}

      {/* VIEW 1: RANKED APPLICANTS LEADERBOARD */}
      {activeReqApplicants ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-200/90">
            <button
              onClick={() => setActiveReqApplicants(null)}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-100 rounded-xl text-xs font-black text-slate-800 transition-all border border-slate-200 min-h-[42px]"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" /> Back to Requirements
            </button>
            <div className="text-left sm:text-right">
              <h2 className="text-sm font-black text-slate-900">{activeReqApplicants.title}</h2>
              <div className="text-xs text-blue-900 font-black">{applicantsData.length} Candidates Ranked by NLP Match Score</div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 text-[10px] uppercase tracking-wider font-black">
                    <th className="py-4 px-4 sm:px-5">Rank & Candidate</th>
                    <th className="py-4 px-4 sm:px-5">Degree & CGPA</th>
                    <th className="py-4 px-4 sm:px-5">NLP Match Score</th>
                    <th className="py-4 px-4 sm:px-5">Parsed Skills Summary</th>
                    <th className="py-4 px-4 sm:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {applicantsData.map((app, idx) => (
                    <tr key={app.application_id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-4 px-4 sm:px-5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            idx === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            idx === 1 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-sm font-black">{app.name}</div>
                            <div className="text-[10px] text-slate-500 font-bold">Applied: {new Date(app.applied_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <div className="text-slate-900 font-black">{app.program}</div>
                        <div className="text-[11px] text-emerald-800 font-black">{app.cgpa} CGPA</div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs rounded-xl shadow-sm shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-blue-800" /> {app.matchScore}% Match
                        </div>
                      </td>

                      <td className="py-4 px-4 sm:px-5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {app.skillsSummary.slice(0, 4).map((sk, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] text-slate-800 rounded-md font-black">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-4 sm:px-5 text-right">
                        <button
                          onClick={() => openQuestionGenerator(app)}
                          className="py-2 px-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/20 shrink-0 min-h-[38px]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>AI Questions</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {applicantsData.length === 0 && (
              <div className="text-center py-12 text-slate-600 text-xs font-bold">
                No applicants yet for this hiring requirement.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VIEW 2: POSTED REQUIREMENTS GRID */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900">Active Hiring Requirements ({requirements.length})</h2>
          </div>

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

                <div className="text-[11px] text-slate-700 bg-slate-100/90 p-3 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 font-bold">
                  <div><span className="text-slate-500">Min CGPA:</span> <span className="text-slate-900 font-black">{req.min_cgpa}</span></div>
                  <div><span className="text-slate-500">Openings:</span> <span className="text-slate-900 font-black">{req.openings}</span></div>
                  <div><span className="text-slate-500">Programs:</span> <span className="text-slate-900 font-black">{JSON.parse(req.eligible_programs_json || '[]').join(', ')}</span></div>
                  <div><span className="text-slate-500">Deadline:</span> <span className="text-slate-900 font-black">{req.deadline}</span></div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    onClick={() => openQuestionGenerator()}
                    className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all min-h-[42px]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>AI Questions</span>
                  </button>
                  <button
                    onClick={() => viewApplicants(req)}
                    className="flex-1 py-2.5 px-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/20 transition-all min-h-[42px]"
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

      {/* POST REQUIREMENT MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base sm:text-lg font-black text-slate-900">Post New Hiring Requirement</h2>
              <button onClick={() => setShowPostModal(false)} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 font-bold text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handlePostRequirement} className="space-y-4 text-xs text-slate-900">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Job Title / Role</label>
                <input
                  type="text"
                  required
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  placeholder="e.g. Full-Stack AI Engineer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 font-bold">Eligible Programs / Branches</label>
                <div className="flex flex-wrap gap-2">
                  {availablePrograms.map((prog) => {
                    const selected = postForm.eligible_programs.includes(prog);
                    return (
                      <button
                        key={prog}
                        type="button"
                        onClick={() => toggleProgram(prog)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                          selected
                            ? 'bg-blue-900 border-blue-900 text-white shadow-md'
                            : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {prog} {selected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Minimum CGPA Cutoff</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={postForm.min_cgpa}
                    onChange={(e) => setPostForm({ ...postForm, min_cgpa: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Job Type</label>
                  <select
                    value={postForm.job_type}
                    onChange={(e) => setPostForm({ ...postForm, job_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="PPO">PPO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">CTC / Stipend Range</label>
                  <input
                    type="text"
                    value={postForm.ctc_range}
                    onChange={(e) => setPostForm({ ...postForm, ctc_range: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Number of Openings</label>
                  <input
                    type="number"
                    value={postForm.openings}
                    onChange={(e) => setPostForm({ ...postForm, openings: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  value={postForm.required_skills}
                  onChange={(e) => setPostForm({ ...postForm, required_skills: e.target.value })}
                  placeholder="Python, React, SQL"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Job Description & AI Matching Prompt</label>
                <textarea
                  rows={4}
                  value={postForm.job_description}
                  onChange={(e) => setPostForm({ ...postForm, job_description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 leading-relaxed font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/20 min-h-[44px]"
              >
                {loading ? 'Publishing...' : 'Publish Requirement to Student Feed'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI INTERVIEW QUESTION GENERATOR MODAL */}
      {questionModalOpen && activeReqApplicants && (
        <InterviewQuestionGeneratorModal
          isOpen={questionModalOpen}
          onClose={() => setQuestionModalOpen(false)}
          requirement={activeReqApplicants}
          studentCandidate={selectedCandidate}
        />
      )}
    </div>
  );
}
