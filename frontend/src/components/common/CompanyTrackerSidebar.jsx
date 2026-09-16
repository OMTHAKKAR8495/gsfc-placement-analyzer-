import React, { useState, useEffect } from 'react';
import { Building2, Sparkles, Clock, CheckCircle2, Search, Filter, ArrowUpRight, TrendingUp, Calendar } from 'lucide-react';

export default function CompanyTrackerSidebar({ currentUser, onSelectCompany, onApplyClick }) {
  const [activeFilter, setActiveFilter] = useState('new'); // 'new', 'past', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [minCtcFilter, setMinCtcFilter] = useState(false);

  // Resolve user role
  const resolvedUser = currentUser || (() => {
    try {
      const stored = localStorage.getItem('currentUser') || localStorage.getItem('campus_hire_user') || localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    const role = localStorage.getItem('user_role');
    if (role) return { role };
    return null;
  })();

  const defaultCompaniesList = [];

  const [companiesList, setCompaniesList] = useState(defaultCompaniesList);

  useEffect(() => {
    fetchLiveDrives();
  }, []);

  const fetchLiveDrives = async () => {
    try {
      const res = await fetch('/api/student/requirements?showAll=true');
      const data = await res.json();
      if (data.feed && Array.isArray(data.feed) && data.feed.length > 0) {
        const live = data.feed.map(item => ({
          id: item.company_id || item.id,
          name: item.company_name,
          logo: item.logo_url || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=60',
          type: 'new',
          role: item.title,
          ctc: item.ctc_range,
          date: 'Active Drive',
          status: '⚡ Newly Arrived',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
        }));
        setCompaniesList(live);
      } else {
        setCompaniesList([]);
      }
    } catch (e) {
      setCompaniesList([]);
    }
  };

  const filteredCompanies = companiesList.filter(c => {
    const matchesTab = activeFilter === 'all' || c.type === activeFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCtc = !minCtcFilter || parseFloat(c.ctc.replace(/[^0-9.]/g, '')) >= 15;
    return matchesTab && matchesSearch && matchesCtc;
  });

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl space-y-4">
      {/* Header Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-900 shrink-0" />
          <div>
            <h3 className="font-black text-sm text-slate-900">Corporate Drives Tracker</h3>
            <p className="text-[10px] font-bold text-slate-600">Newly Arrived & Passed Companies</p>
          </div>
        </div>
        <span className="px-2 py-0.5 bg-blue-50 text-blue-900 text-[10px] font-black rounded-md border border-blue-200">
          Live TPC Feed
        </span>
      </div>

      {/* Filter Segmented Control Tabs */}
      <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-black">
        <button
          onClick={() => setActiveFilter('new')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
            activeFilter === 'new'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          ⚡ Newly Arrived
        </button>
        <button
          onClick={() => setActiveFilter('past')}
          className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
            activeFilter === 'past'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          ✅ Passed Drives
        </button>
        <button
          onClick={() => setActiveFilter('all')}
          className={`py-1.5 px-2 rounded-lg transition-all text-center ${
            activeFilter === 'all'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          All
        </button>
      </div>

      {/* Search & Quick Check Options */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search corporate drives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-900"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={minCtcFilter}
            onChange={(e) => setMinCtcFilter(e.target.checked)}
            className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 w-3.5 h-3.5"
          />
          Show High CTC Only (&ge; ₹15 LPA)
        </label>
      </div>

      {/* Corporate Cards List */}
      <div className="space-y-3 pt-1">
        {filteredCompanies.map((comp) => (
          <div key={comp.id} className="p-3 bg-white/90 rounded-2xl border border-slate-200 hover:border-blue-500/50 hover:shadow-md transition-all space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={comp.logo}
                  alt={comp.name}
                  className="w-9 h-9 rounded-xl object-contain bg-slate-50 p-1 border border-slate-200 shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=60';
                  }}
                />
                <div>
                  <h4 className="font-black text-xs text-slate-900 leading-tight">{comp.name}</h4>
                  <div className="text-[10px] text-slate-600 font-bold line-clamp-1">{comp.role}</div>
                </div>
              </div>

              <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border shrink-0 ${comp.badgeColor}`}>
                {comp.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1 text-blue-900 font-black">
                <TrendingUp className="w-3 h-3" /> {comp.ctc}
              </div>
              <div className="text-slate-500 text-[10px]">{comp.date}</div>
            </div>
          </div>
        ))}

        {filteredCompanies.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-xs font-bold">
            No placement drives match your filter.
          </div>
        )}
      </div>
    </div>
  );
}
