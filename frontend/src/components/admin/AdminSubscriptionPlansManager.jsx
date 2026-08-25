import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Users, Clock, Plus, Pencil, 
  Search, Download, CheckCircle2, AlertCircle, Sparkles, 
  ShieldCheck, RefreshCw, Eye, X, Check, ArrowUpRight, Crown, 
  Briefcase, FileText, Zap, Award, Flame, Building2
} from 'lucide-react';
import RecruiterInvoiceModal from '../company/RecruiterInvoiceModal';
import { useToast } from '../../context/ToastContext';

const DEFAULT_PLANS = [
  {
    id: 'plan_bronze',
    name: 'Bronze Recruiter Plan',
    badge_title: 'Bronze Tier',
    price_inr: 10000,
    duration_days: 15,
    max_postings: 3,
    description: 'Essential on-campus recruitment package with candidate database search, shortlist view, and 3 campus placement drives.',
    features: { max_postings: 3, resume_download: true, shortlist_view: true, ats_score_view: false, online_meetings: false }
  },
  {
    id: 'plan_silver',
    name: 'Silver Pro Recruiter Plan',
    badge_title: 'Silver Tier',
    price_inr: 25000,
    duration_days: 30,
    max_postings: 10,
    description: 'High-growth hiring tier with full resume PDF downloads, AI ATS ranking, candidate screening, and 10 campus drives.',
    features: { max_postings: 10, resume_download: true, shortlist_view: true, ats_score_view: true, candidate_readiness: true, online_meetings: false }
  },
  {
    id: 'plan_gold',
    name: 'Gold Enterprise Sovereign',
    badge_title: 'Gold Tier (Recommended)',
    price_inr: 50000,
    duration_days: 60,
    max_postings: -1,
    description: 'Unlimited campus placement drives, AI predictive match score insights, in-portal video interviews, and dedicated TPC concierge.',
    features: { max_postings: -1, resume_download: true, shortlist_view: true, ats_score_view: true, candidate_readiness: true, online_meetings: true }
  }
];

export default function AdminSubscriptionPlansManager() {
  const [overview, setOverview] = useState(null);
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals state
  const [editingPlan, setEditingPlan] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManualGrantModal, setShowManualGrantModal] = useState(false);
  const [selectedInvoiceTx, setSelectedInvoiceTx] = useState(null);

  // Manual Grant Form
  const [grantForm, setGrantForm] = useState({
    companyId: 'c_gsfc_limited',
    planId: 'plan_gold',
    durationDays: 365,
    notes: 'Official University MoU Corporate Partner'
  });
  const [companiesList, setCompaniesList] = useState([]);

  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overRes, plansRes, txRes, compRes] = await Promise.all([
        fetch('/api/admin/subscriptions/overview'),
        fetch('/api/admin/subscriptions/plans'),
        fetch('/api/admin/subscriptions/transactions'),
        fetch('/api/admin/companies')
      ]);

      if (overRes && overRes.ok) setOverview(await overRes.json());
      if (plansRes && plansRes.ok) {
        const pData = await plansRes.json();
        if (Array.isArray(pData) && pData.length > 0) {
          setPlans(pData);
        } else {
          setPlans(DEFAULT_PLANS);
        }
      }
      if (txRes && txRes.ok) setTransactions(await txRes.json());
      if (compRes && compRes.ok) setCompaniesList(await compRes.json());
    } catch (err) {
      console.error('Error fetching admin subscriptions data:', err);
      setPlans(DEFAULT_PLANS);
    }
  };


  const handleSavePlan = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editingPlan) return;

    try {
      const res = await fetch(`/api/admin/subscriptions/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast?.success ? toast.success(data.message) : alert(data.message);
        setShowEditModal(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to update plan.');
      }
    } catch (err) {
      alert(err.message || 'Error updating plan.');
    }
  };

  const handleManualGrant = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const res = await fetch('/api/admin/subscriptions/manual-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grantForm)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast?.success ? toast.success(data.message) : alert(data.message);
        setShowManualGrantModal(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to grant subscription.');
      }
    } catch (err) {
      alert(err.message || 'Error granting subscription.');
    }
  };

  const exportTransactionsCSV = () => {
    if (!transactions.length) return;
    const headers = ['Receipt No', 'Company Name', 'Plan', 'Amount (INR)', 'Gateway', 'Payment ID', 'Status', 'Date'];
    const rows = transactions.map(t => [
      t.receipt_number,
      `"${t.company_name}"`,
      t.plan_name,
      t.amount_inr,
      t.gateway,
      t.gateway_payment_id || '',
      t.status,
      t.paid_at || t.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSFC_Recruiter_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = !searchQuery || 
      (t.company_name && t.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.receipt_number && t.receipt_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.gateway_payment_id && t.gateway_payment_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Quick Controls */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl border border-blue-900/40 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-xs font-black tracking-wider uppercase mb-2">
            <Crown className="w-3.5 h-3.5" />
            <span>TPC Revenue & Recruiter Subscriptions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Recruiter Plans & Payment Gateway Hub
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
            Configure dynamic tier pricing, posting quotas, and feature flags. Monitor real-time Razorpay settlements and corporate recruitment access.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowManualGrantModal(true)}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Grant MoU Plan</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Revenue Settled
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{(overview?.total_revenue_inr || 0).toLocaleString('en-IN')}
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
              100% Verified via Razorpay
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Active Subscriptions
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {overview?.active_subscriptions || 0}
            </h3>
            <span className="text-[11px] text-blue-600 font-bold mt-1 block">
              Corporate Recruiters
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Transactions
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {overview?.total_transactions || 0}
            </h3>
            <span className="text-[11px] text-slate-500 font-bold mt-1 block">
              Invoices Generated
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Expiring in ≤15 Days
            </span>
            <h3 className="text-2xl font-black text-amber-600">
              {overview?.expiring_soon || 0}
            </h3>
            <span className="text-[11px] text-amber-500 font-bold mt-1 block">
              Renewal Reminders Dispatched
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Configurable Subscription Plans Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Active Recruitment Tiers & Quota Limits
            </h3>
            <p className="text-xs text-slate-500">
              Manage tier pricing, posting quotas, and feature flags without redeploying code.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const features = plan.features || {};
            return (
              <div 
                key={plan.id}
                className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                      {plan.badge_title}
                    </span>
                    <button
                      onClick={() => {
                        setEditingPlan({
                          ...plan,
                          features: plan.features || {}
                        });
                        setShowEditModal(true);
                      }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <h4 className="text-lg font-black text-slate-900 dark:text-white">{plan.name}</h4>
                  
                  <div className="my-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      ₹{plan.price_inr.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">/ {plan.duration_days} days</span>
                    <p className="text-[11px] text-slate-500 mt-1">{plan.description}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                    <p><strong>Max Job Postings:</strong> {plan.max_postings === -1 ? 'Unlimited (∞)' : `${plan.max_postings} Drives`}</p>
                    <p><strong>Resume Download:</strong> {features.resume_download ? '✅ Enabled' : '❌ Disabled'}</p>
                    <p><strong>ATS Match Score:</strong> {features.ats_score_view ? '✅ Enabled' : '❌ Disabled'}</p>
                    <p><strong>Video Interviews:</strong> {features.online_meetings ? '✅ Enabled' : '❌ Disabled'}</p>
                    <p><strong>Readiness Score:</strong> {features.candidate_readiness ? '✅ Enabled' : '❌ Disabled'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-right">
                  <span className="text-[10px] font-bold text-slate-400">
                    Status: {plan.is_active ? 'Active on Portal' : 'Archived'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Master Transactions Ledger */}
      <div className="p-6 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Corporate Payment Ledger & Invoices
            </h3>
            <p className="text-xs text-slate-500">
              Audit all payment transactions, gateway order IDs, and printable GST invoices.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search company or invoice #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid & Settled</option>
              <option value="created">Pending Payment</option>
              <option value="failed">Failed Attempts</option>
            </select>

            {/* Export CSV */}
            <button
              onClick={exportTransactionsCSV}
              className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 uppercase font-black text-[10px]">
                <tr>
                  <th className="p-3.5">Invoice / Receipt #</th>
                  <th className="p-3.5">Recruiter / Company</th>
                  <th className="p-3.5">Plan Tier</th>
                  <th className="p-3.5">Amount (INR)</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Gateway Payment ID</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No matching payment transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {tx.receipt_number}
                      </td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-white">
                        {tx.company_name}
                      </td>
                      <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                        {tx.plan_name}
                      </td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-white">
                        ₹{tx.amount_inr?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {tx.payment_method || 'Razorpay UPI / Cards'}
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-500">
                        {tx.gateway_payment_id || '—'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          tx.status === 'paid'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : tx.status === 'created'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {new Date(tx.paid_at || tx.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedInvoiceTx(tx)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          title="View Printable Tax Receipt"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT PLAN MODAL */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Edit Tier: {editingPlan.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Badge Title</label>
                  <input
                    type="text"
                    value={editingPlan.badge_title}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge_title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Price (INR ₹)</label>
                  <input
                    type="number"
                    value={editingPlan.price_inr}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_inr: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={editingPlan.duration_days}
                    onChange={(e) => setEditingPlan({ ...editingPlan, duration_days: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Postings (-1=∞)</label>
                  <input
                    type="number"
                    value={editingPlan.max_postings}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_postings: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Description</label>
                <textarea
                  rows={2}
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                />
              </div>

              {/* Feature Flags */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-black text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                  Feature Flags Permission Matrix
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.features?.resume_download || false}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        features: { ...editingPlan.features, resume_download: e.target.checked }
                      })}
                      className="rounded text-blue-600"
                    />
                    <span>Full Resume Download</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.features?.ats_score_view || false}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        features: { ...editingPlan.features, ats_score_view: e.target.checked }
                      })}
                      className="rounded text-blue-600"
                    />
                    <span>AI ATS Fit Score View</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.features?.online_meetings || false}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        features: { ...editingPlan.features, online_meetings: e.target.checked }
                      })}
                      className="rounded text-blue-600"
                    />
                    <span>Video Interview Rooms</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.features?.homepage_featured || false}
                      onChange={(e) => setEditingPlan({
                        ...editingPlan,
                        features: { ...editingPlan.features, homepage_featured: e.target.checked }
                      })}
                      className="rounded text-blue-600"
                    />
                    <span>Homepage Featured Banner</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md"
                >
                  Save Tier Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL MOU GRANT MODAL */}
      {showManualGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Grant Complimentary Partner Subscription
              </h3>
              <button onClick={() => setShowManualGrantModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualGrant} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Corporate Partner</label>
                <select
                  value={grantForm.companyId}
                  onChange={(e) => setGrantForm({ ...grantForm, companyId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  {companiesList.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name || c.name || 'Company'} ({c.industry || 'Tech'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Tier</label>
                  <select
                    value={grantForm.planId}
                    onChange={(e) => setGrantForm({ ...grantForm, planId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.badge_title})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={grantForm.durationDays}
                    onChange={(e) => setGrantForm({ ...grantForm, durationDays: parseInt(e.target.value) || 365 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Grant Reason / MoU Reference</label>
                <input
                  type="text"
                  value={grantForm.notes}
                  onChange={(e) => setGrantForm({ ...grantForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualGrantModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
                >
                  Confirm & Provision Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE VIEWER MODAL */}
      <RecruiterInvoiceModal
        isOpen={Boolean(selectedInvoiceTx)}
        onClose={() => setSelectedInvoiceTx(null)}
        transaction={selectedInvoiceTx}
      />

    </div>
  );
}
