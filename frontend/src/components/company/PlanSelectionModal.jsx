import React, { useState, useEffect } from 'react';
import { 
  X, Check, Sparkles, ShieldCheck, Zap, Award, Crown, 
  ArrowRight, HelpCircle, CheckCircle, AlertCircle, FileText, 
  Video, Eye, MessageSquare, Flame, ChevronRight, Briefcase
} from 'lucide-react';


const TIER_ICONS = {
  plan_bronze: Award,
  plan_silver: Zap,
  plan_gold: Crown,
  plan_diamond: Sparkles
};

const TIER_GRADIENTS = {
  plan_bronze: 'from-amber-700 via-amber-800 to-amber-900 border-amber-500/40 text-amber-100',
  plan_silver: 'from-slate-600 via-slate-700 to-slate-800 border-slate-400/40 text-slate-100',
  plan_gold: 'from-amber-500 via-yellow-600 to-amber-700 border-amber-400 text-amber-950',
  plan_diamond: 'from-cyan-600 via-blue-700 to-indigo-900 border-cyan-400 text-cyan-100'
};

const TIER_CARD_ACCENTS = {
  plan_bronze: 'border-amber-600/30 hover:border-amber-500 shadow-amber-900/10',
  plan_silver: 'border-slate-400/30 hover:border-slate-300 shadow-slate-900/10',
  plan_gold: 'border-amber-400/60 hover:border-amber-300 ring-2 ring-amber-400/20 shadow-amber-500/20',
  plan_diamond: 'border-cyan-400/60 hover:border-cyan-300 ring-2 ring-cyan-400/30 shadow-cyan-500/20'
};

const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    id: 'plan_bronze',
    name: 'Bronze Recruiter Plan',
    badge_title: 'Bronze Tier',
    price_inr: 10000,
    duration_days: 90,
    max_postings: 3,
    description: 'Essential on-campus recruitment package with candidate database search, shortlist view, and 3 campus placement drives.',
    features: {
      max_postings: 3,
      resume_download: true,
      shortlist_view: true,
      ats_score_view: false,
      candidate_readiness: false,
      online_meetings: false,
      homepage_featured: false,
      support_level: 'Standard TPC Listing & Email Support'
    }
  },
  {
    id: 'plan_silver',
    name: 'Silver Pro Recruiter Plan',
    badge_title: 'Silver Tier (Popular)',
    price_inr: 25000,
    duration_days: 180,
    max_postings: 10,
    description: 'High-growth hiring tier with full resume PDF downloads, AI ATS ranking, candidate screening, and 10 campus drives.',
    features: {
      max_postings: 10,
      resume_download: true,
      shortlist_view: true,
      ats_score_view: true,
      candidate_readiness: true,
      online_meetings: false,
      homepage_featured: false,
      support_level: 'Priority Placement Listing & WhatsApp TPC Support'
    }
  },
  {
    id: 'plan_gold',
    name: 'Gold Enterprise Sovereign',
    badge_title: 'Gold Tier (Recommended)',
    price_inr: 50000,
    duration_days: 365,
    max_postings: -1,
    description: 'Unlimited campus placement drives, AI predictive match score insights, in-portal video interviews, and dedicated TPC concierge.',
    features: {
      max_postings: -1,
      resume_download: true,
      shortlist_view: true,
      ats_score_view: true,
      candidate_readiness: true,
      online_meetings: true,
      homepage_featured: true,
      support_level: 'Dedicated TPC Account Manager, Priority Campus Interview Rooms'
    }
  }
];

export default function PlanSelectionModal({ 
  isOpen, 
  onClose, 
  currentSubscription, 
  onSelectPlan, 
  companyName = 'Corporate Recruiter' 
}) {
  const [plans, setPlans] = useState(DEFAULT_SUBSCRIPTION_PLANS);
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('plan_silver');

  useEffect(() => {
    if (!isOpen) return;
    fetchPlans();
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/subscriptions/plans');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const parsed = data.map(p => ({
            ...p,
            features: typeof p.features_json === 'string' ? JSON.parse(p.features_json) : (p.features || {})
          }));
          setPlans(parsed);
          return;
        }
      }
      setPlans(DEFAULT_SUBSCRIPTION_PLANS);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      setPlans(DEFAULT_SUBSCRIPTION_PLANS);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white overflow-hidden shrink-0">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-xs font-black tracking-wider uppercase mb-2.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>GSFC Recruiter Tier Access</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Choose Your Campus Recruitment Plan
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Connect directly with 1,500+ pre-assessed engineering, chemical, and management students at GSFC University. Pick a plan to post hiring requirements and unlock verified candidate dossiers.
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {currentSubscription && currentSubscription.has_subscription && (
            <div className="mt-4 p-3 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold">Current Active Plan:</span>
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded-lg">{currentSubscription.plan_name}</span>
                <span className="text-slate-300">({currentSubscription.postings_used} of {currentSubscription.is_unlimited ? '∞' : currentSubscription.max_postings} postings used • {currentSubscription.days_remaining} days left)</span>
              </div>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">

              {plans.map((plan) => {
                const IconComponent = TIER_ICONS[plan.id] || Award;
                const isSelected = selectedPlanId === plan.id;
                const isCurrent = currentSubscription?.plan_id === plan.id && currentSubscription?.status === 'active';
                const isPopular = plan.id === 'plan_gold';
                const features = plan.features || {};

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-3xl p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between border bg-white dark:bg-slate-800/90 ${
                      TIER_CARD_ACCENTS[plan.id] || 'border-slate-200'
                    } ${isSelected ? 'ring-2 ring-blue-600 dark:ring-blue-400 shadow-xl scale-[1.02]' : 'hover:shadow-md'}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-slate-950" />
                        <span>Most Popular</span>
                      </div>
                    )}

                    <div>
                      {/* Tier Badge & Title */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-2xl bg-gradient-to-br ${TIER_GRADIENTS[plan.id] || 'from-slate-700 to-slate-900'} shadow-sm`}>
                            <IconComponent className="w-5 h-5 text-amber-300" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug">
                              {plan.name}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {plan.badge_title}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="my-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            ₹{plan.price_inr.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            / {plan.duration_days} days
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {plan.description}
                        </p>
                      </div>

                      {/* Quota Highlights */}
                      <div className="mb-4 p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>
                          {plan.max_postings === -1 ? 'Unlimited Active Postings' : `Up to ${plan.max_postings} Active Postings`}
                        </span>
                      </div>

                      {/* Feature Bullet Points */}
                      <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-start gap-2">
                          <CheckCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${features.resume_download ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className={features.resume_download ? 'font-medium' : 'text-slate-400 line-through'}>
                            Full Resume PDF Download
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${features.ats_score_view ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className={features.ats_score_view ? 'font-medium' : 'text-slate-400 line-through'}>
                            AI ATS Fit & Skill Match Score
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${features.online_meetings ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className={features.online_meetings ? 'font-medium' : 'text-slate-400 line-through'}>
                            In-Portal Video Interviews
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${features.candidate_readiness ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className={features.candidate_readiness ? 'font-medium' : 'text-slate-400 line-through'}>
                            Predictive Readiness Scores
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${features.homepage_featured ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className={features.homepage_featured ? 'font-medium' : 'text-slate-400 line-through'}>
                            Homepage Featured Partner Banner
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Select Action Button */}
                    <div className="mt-6 pt-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlanId(plan.id);
                          onSelectPlan(plan);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-default'
                            : isSelected
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 hover:from-blue-500 hover:to-amber-500 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isCurrent ? (

                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Active Tier</span>
                          </>
                        ) : (
                          <>
                            <span>Select {plan.name}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>




        {/* Footer Guarantee */}
        <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Official Razorpay Gateway Integration:</strong> 100% secure payment with instant GST Tax Invoice & campus coordinator assignment.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const p = plans.find(x => x.id === selectedPlanId) || plans[0];
                if (p) onSelectPlan(p);
              }}
              disabled={!selectedPlanId || loading}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 hover:from-blue-600 hover:to-amber-500 text-white font-black shadow-lg shadow-blue-700/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Proceed to Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
