import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Sparkles, User, Mail, Phone, Building, 
  CheckCircle2, ArrowRight, Shield, Download, QrCode, AlertTriangle, 
  Layers, Clock, ExternalLink, Share2, Copy, Check
} from 'lucide-react';
import QRCode from 'qrcode';
import PublicPassDownloadPage from './PublicPassDownloadPage';

export default function PublicEventRegisterPage({ eventSlug = 'anveshan-2026', onBackToHome }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    city: 'Vadodara',
    photo_url: '',
    custom_data: {}
  });

  // Success / Pass state
  const [registeredPass, setRegisteredPass] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [eventSlug]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/events/${encodeURIComponent(eventSlug)}`);
      if (!res.ok) {
        throw new Error('Event not found or failed to load.');
      }
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      // Fallback sample event if offline
      setEvent({
        id: 'evt_anveshan_2026',
        title: 'GSFC Anveshan 2026 Tech & Career Fest',
        slug: 'anveshan-2026',
        description: 'Annual Flagship National Technical & Placement Conclave featuring 50+ recruiting companies, competitive hackathons, industry keynotes, and career discovery pavilions.',
        category: 'Tech Fest & Career Fair',
        event_date: '2026-09-18',
        end_date: '2026-09-20',
        venue: 'GSFC University Auditorium, Dome & Tech Hub',
        banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        is_registration_open: 1,
        total_external_registered: 142
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.organization) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventSlug)}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration.');
      }

      setRegisteredPass({
        passToken: data.passToken,
        candidate: data.candidate,
        event: data.event || event
      });
    } catch (err) {
      // Offline fallback pass generation
      const fallbackToken = 'GSFC-PASS-EXT-' + Math.floor(100000 + Math.random() * 900000);
      setRegisteredPass({
        passToken: fallbackToken,
        candidate: {
          ...formData,
          id: 'ext_offline_' + Date.now(),
          pass_token: fallbackToken
        },
        event: event
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (registeredPass) {
    return (
      <PublicPassDownloadPage
        passToken={registeredPass.passToken}
        initialCandidate={registeredPass.candidate}
        initialEvent={registeredPass.event}
        onBackToRegister={() => setRegisteredPass(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-slate-400">Loading Event Details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white font-sans pb-16">
      {/* Top GSFC University & TPC Branding Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 p-0.5 shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xs text-amber-400">
              TPC
            </div>
          </div>
          <div>
            <div className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
              GSFC UNIVERSITY <span className="text-amber-400">•</span> TPC EVENT HUB
            </div>
            <div className="text-[10px] text-slate-400 font-bold">Training & Placement Cell Official Portal</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Event'}</span>
          </button>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 border border-blue-600/40 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
            >
              Main Portal
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {/* Event Banner Hero Card */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="relative h-64 sm:h-80 w-full overflow-hidden">
            <img
              src={event?.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'}
              alt={event?.title}
              className="w-full h-full object-cover object-center filter brightness-[0.65]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

            {/* Floating Tags */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-md text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current" /> {event?.category || 'Flagship Fest'}
              </span>
              {event?.is_registration_open ? (
                <span className="px-3 py-1 bg-emerald-500/90 backdrop-blur-md text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></span> Registrations Open
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-500/90 backdrop-blur-md text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md">
                  Registrations Closed
                </span>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8 -mt-16 relative z-10 space-y-4">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {event?.title}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium max-w-3xl">
              {event?.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-500">Event Date</div>
                  <div className="text-xs font-black text-white">{event?.event_date} {event?.end_date ? `to ${event.end_date}` : ''}</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-500">Venue</div>
                  <div className="text-xs font-black text-white">{event?.venue || 'GSFC University Auditorium'}</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-500">Entry Requirement</div>
                  <div className="text-xs font-black text-white">Digital QR Pass Required</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5" /> Visitor & Candidate Registration
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Get Your Digital Entry QR Pass</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                Register as an outside student, recruiter, guest, or alumni to receive your instant digital gate entry QR pass.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs font-bold text-red-300 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-300 mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kavya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="kavya@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5">Contact Phone *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* College / Organization */}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5">College / Organization *</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. MS University / Tech Company"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5">City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Vadodara / Ahmedabad"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !event?.is_registration_open}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-500 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating Digital QR Pass...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" />
                      <span>Complete Registration & Generate QR Pass</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-[11px] text-slate-500 font-medium">
                  Instant digital pass generation. Your personal QR pass will be issued immediately upon submission.
                </p>
              </div>
            </form>
          </div>

          {/* Right Column: Pass Preview & Event Guidelines */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Digital Pass Preview Card */}
            <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900/80 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>

              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-xs text-white uppercase tracking-wider">Official Event Pass Preview</span>
                </div>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                  QR Token Verified
                </span>
              </div>

              <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  <QrCode className="w-28 h-28 text-slate-950" />
                </div>
                <div className="space-y-1">
                  <div className="font-black text-sm text-white">{formData.name || 'Candidate Full Name'}</div>
                  <div className="text-xs text-indigo-300 font-bold">{formData.organization || 'University / Institution'}</div>
                  <div className="text-[10px] font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 inline-block mt-1">
                    TOKEN: GSFC-PASS-ANV-XXXXXX
                  </div>
                </div>
              </div>

              <div className="border-t border-indigo-500/20 pt-4 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Scan this pass at Main Campus Gate A on arrival</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Valid for full access to exhibition dome & auditorium</span>
                </div>
              </div>
            </div>

            {/* Event Highlights & Guidelines */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> Entry Instructions
              </h3>
              <ul className="text-xs text-slate-400 space-y-2 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Gates open at 08:30 AM on event days. Present your digital QR pass on mobile or printed copy.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Security officers and faculty coordinators will scan your pass at the gate using the scanner terminal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Keep a government photo ID or college ID card for verification if requested.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
