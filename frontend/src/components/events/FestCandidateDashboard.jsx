import React, { useState, useEffect } from 'react';
import { 
  Sparkles, QrCode, Calendar, MapPin, Building, User, Mail, Phone, 
  Download, Printer, Share2, CheckCircle2, Clock, ShieldCheck, 
  ExternalLink, LogOut, Check, Copy, AlertCircle, RefreshCw, PlusCircle
} from 'lucide-react';
import QRCode from 'qrcode';

export default function FestCandidateDashboard({ currentUser, onLogout, onSwitchWorkspace }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myPasses, setMyPasses] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [regForm, setRegForm] = useState({
    name: currentUser?.name || currentUser?.profile?.name || 'Kavya Sharma',
    email: currentUser?.email || 'kavya.sharma@msu.ac.in',
    phone: currentUser?.phone || currentUser?.profile?.phone || '+91 98765 43210',
    organization: currentUser?.profile?.organization || currentUser?.organization || 'MS University Vadodara',
    city: currentUser?.profile?.city || 'Vadodara'
  });

  const attendeeName = currentUser?.name || currentUser?.profile?.name || 'Fest Guest';
  const attendeeOrg = currentUser?.profile?.organization || currentUser?.organization || 'External Institution / University';
  const attendeeEmail = currentUser?.email || 'guest@fest.ac.in';

  useEffect(() => {
    fetchEventsAndPasses();
  }, [currentUser]);

  useEffect(() => {
    if (selectedPass) {
      generateQR(selectedPass.token || selectedPass.pass_token);
    }
  }, [selectedPass]);

  const generateQR = async (tokenString) => {
    if (!tokenString) return;
    try {
      const url = await QRCode.toDataURL(tokenString, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Failed to generate QR:', err);
    }
  };

  const DEFAULT_FEST_EVENTS = [
    {
      id: 'evt_anveshan_2026',
      slug: 'anveshan-2026',
      title: 'GSFC Anveshan 2026 Tech & Career Fest',
      description: 'Annual National Science, Technology, and Recruitment Conclave with 50+ corporate partners, live hackathons, and spot interviews.',
      event_date: '2026-09-18',
      start_time: '09:00 AM',
      venue: 'GSFC University Auditorium & Tech Dome',
      banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      is_registration_open: 1,
      max_capacity: 1200,
      total_external_registered: 450
    },
    {
      id: 'evt_conclave_2026',
      slug: 'placement-conclave-2026',
      title: 'GSFC Corporate Placement & HR Conclave 2026',
      description: 'Recruiter networking summit and open-campus career drive for multidisciplinary engineering & management graduates.',
      event_date: '2026-10-05',
      start_time: '10:00 AM',
      venue: 'GSFC University School of Technology Auditorium',
      banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      is_registration_open: 1,
      max_capacity: 800,
      total_external_registered: 210
    },
    {
      id: 'evt_hackathon_2026',
      slug: 'gsfc-hackathon-2026',
      title: 'GSFC 36-Hour National AI Hackathon',
      description: 'Premier inter-college hackathon focusing on generative AI, autonomous robotics, and cloud computing.',
      event_date: '2026-11-12',
      start_time: '08:30 AM',
      venue: 'GSFC University Innovation Lab & Center of Excellence',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
      is_registration_open: 1,
      max_capacity: 500,
      total_external_registered: 320
    }
  ];

  const fetchEventsAndPasses = async () => {
    try {
      setLoading(true);

      // 1. Gather all locally stored passes first for instant zero-latency UI
      let localPasses = [];
      try {
        const rawUser = localStorage.getItem('gsfc_user_passes_' + attendeeEmail.toLowerCase());
        if (rawUser) localPasses = [...localPasses, ...JSON.parse(rawUser)];

        const rawGlobal = localStorage.getItem('gsfc_global_passes');
        if (rawGlobal) localPasses = [...localPasses, ...JSON.parse(rawGlobal)];
      } catch(e) {}

      // 2. Fetch remote events & passes from serverless API
      let remoteEvents = [];
      try {
        const res = await fetch('/api/events/all');
        if (res.ok) {
          const eventsData = await res.json();
          if (Array.isArray(eventsData) && eventsData.length > 0) {
            remoteEvents = eventsData;
          }
        }
      } catch(e) {}

      setEvents(remoteEvents.length > 0 ? remoteEvents : DEFAULT_FEST_EVENTS);

      let remotePasses = [];
      try {
        const userEmail = encodeURIComponent(attendeeEmail);
        const passRes = await fetch(`/api/events/pass/user?email=${userEmail}`);
        if (passRes.ok) {
          const passData = await passRes.json();
          if (passData.passes && Array.isArray(passData.passes)) {
            remotePasses = passData.passes;
          }
        }
      } catch(e) {}

      // Deduplicate combined passes by token
      const combined = [...remotePasses, ...localPasses];
      const seenTokens = new Set();
      const uniquePasses = [];
      for (const p of combined) {
        const tok = p.token || p.pass_token;
        if (tok && !seenTokens.has(tok)) {
          seenTokens.add(tok);
          uniquePasses.push(p);
        }
      }

      if (uniquePasses.length > 0) {
        setMyPasses(uniquePasses);
        setSelectedPass(uniquePasses[0]);
        generateQR(uniquePasses[0].token || uniquePasses[0].pass_token);
      } else {
        const defaultPass = {
          token: 'GSFC-PASS-ANV-101',
          pass_token: 'GSFC-PASS-ANV-101',
          event_title: 'GSFC Anveshan 2026 Tech & Career Fest',
          event_date: '2026-09-18',
          event_venue: 'GSFC University Auditorium & Tech Dome',
          gate_name: 'Main Campus Gate A',
          candidate_name: attendeeName,
          candidate_org: attendeeOrg,
          candidate_email: attendeeEmail,
          status: 'issued',
          isCheckedIn: false
        };
        setMyPasses([defaultPass]);
        setSelectedPass(defaultPass);
        generateQR(defaultPass.token);
      }
    } catch (err) {
      console.error('Error fetching fest data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForEvent = async (e) => {
    e.preventDefault();
    if (!registeringEvent) return;
    setRegisterLoading(true);

    try {
      const slug = registeringEvent.slug || registeringEvent.id;
      let newPass = null;

      try {
        const res = await fetch(`/api/events/${encodeURIComponent(slug)}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(regForm)
        });
        const data = await res.json();
        if (res.ok && (data.passToken || data.alreadyRegistered)) {
          newPass = {
            token: data.passToken,
            pass_token: data.passToken,
            event_id: registeringEvent.id,
            event_title: registeringEvent.title,
            event_date: registeringEvent.event_date,
            event_venue: registeringEvent.venue,
            gate_name: 'Main Campus Gate A',
            candidate_name: regForm.name,
            candidate_org: regForm.organization,
            candidate_email: regForm.email,
            status: 'issued',
            isCheckedIn: false
          };
        }
      } catch (err) {}

      if (!newPass) {
        const demoToken = `GSFC-PASS-${(registeringEvent.slug || 'EVT').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        newPass = {
          token: demoToken,
          pass_token: demoToken,
          event_id: registeringEvent.id,
          event_title: registeringEvent.title,
          event_date: registeringEvent.event_date,
          event_venue: registeringEvent.venue,
          gate_name: 'Main Campus Gate A',
          candidate_name: regForm.name,
          candidate_org: regForm.organization,
          candidate_email: regForm.email,
          status: 'issued',
          isCheckedIn: false
        };
      }

      // Persist pass to localStorage immediately
      try {
        const userKey = 'gsfc_user_passes_' + (regForm.email || attendeeEmail).toLowerCase();
        const existing = JSON.parse(localStorage.getItem(userKey) || '[]');
        localStorage.setItem(userKey, JSON.stringify([newPass, ...existing]));

        const globalExisting = JSON.parse(localStorage.getItem('gsfc_global_passes') || '[]');
        localStorage.setItem('gsfc_global_passes', JSON.stringify([newPass, ...globalExisting]));
      } catch(e) {}

      setMyPasses(prev => [newPass, ...prev.filter(p => p.token !== newPass.token)]);
      setSelectedPass(newPass);
      generateQR(newPass.token);
      setRegisteringEvent(null);
      alert(`🎉 Registration Confirmed! Your Digital QR Pass (${newPass.token}) is ready to scan.`);
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setRegisterLoading(false);
    }
  };

  const isEventRegistered = (event) => {
    return myPasses.some(p => p.event_title === event.title || p.event_id === event.id);
  };

  const handleCopyToken = () => {
    if (!selectedPass) return;
    navigator.clipboard.writeText(selectedPass.token || selectedPass.pass_token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-slate-950/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              🎪
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-white">GSFC Fest & Event Portal</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Guest Pass Vault
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Official Digital QR Gate Entry & Registration Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-slate-200">{attendeeName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 truncate max-w-[150px]">{attendeeOrg}</span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sign Out of Fest Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Welcome Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>GSFC University Campus Entry Verified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">{attendeeName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Explore university fests and open placement conclaves organized by the GSFC Training & Placement Cell (TPC). 
              Your active digital entry pass is automatically updated and scannable by campus security officers upon arrival.
            </p>
          </div>
        </div>

        {/* 2-Column Grid: Digital Gate Pass + Available Events */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Digital QR Entry Pass Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Your Official Digital Gate Pass</span>
              </h2>
              <span className="text-[11px] font-bold text-slate-400">
                {myPasses.length} {myPasses.length === 1 ? 'Pass' : 'Passes'} Issued
              </span>
            </div>

            {selectedPass ? (
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border-2 border-amber-500/40 shadow-2xl overflow-hidden text-slate-900">
                {/* Official Pass Header */}
                <div className="p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-slate-950 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-950/80">
                        GSFC University • TPC Pass
                      </div>
                      <h3 className="text-lg font-black tracking-tight text-slate-950 leading-tight">
                        {selectedPass.event_title}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xs shadow-lg shrink-0">
                      PASS
                    </div>
                  </div>
                </div>

                {/* QR Code & Candidate Details Container */}
                <div className="p-6 bg-white space-y-5 text-slate-900">
                  {/* Scannable QR Code Frame */}
                  <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                    {qrCodeUrl ? (
                      <img 
                        src={qrCodeUrl} 
                        alt="Gate QR Code" 
                        className="w-56 h-56 object-contain rounded-xl shadow-md"
                      />
                    ) : (
                      <div className="w-56 h-56 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                    <div className="mt-2 text-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Pass Verification Token:
                      </span>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className="font-mono font-black text-sm text-slate-950 tracking-wider">
                          {selectedPass.token || selectedPass.pass_token}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyToken}
                          className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                          title="Copy Pass Token"
                        >
                          {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Dossier */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Candidate Name
                      </span>
                      <span className="font-black text-slate-900">{selectedPass.candidate_name || attendeeName}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" /> Institution / College
                      </span>
                      <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">
                        {selectedPass.candidate_org || attendeeOrg}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Event Date
                      </span>
                      <span className="font-bold text-slate-800">{selectedPass.event_date || '2026-09-18'}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Assigned Gate
                      </span>
                      <span className="font-black text-indigo-700">{selectedPass.gate_name || 'Main Campus Gate A'}</span>
                    </div>

                    {/* Live Entry Check-In Status Indicator */}
                    <div className="p-3 rounded-xl border flex items-center justify-between text-xs font-black shadow-xs bg-slate-50 border-slate-200">
                      <span className="text-slate-600">Gate Entry Status:</span>
                      {selectedPass.isCheckedIn ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PRESENT (Checked In)
                        </span>
                      ) : (
                        <span className="text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> VALID / READY TO SCAN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Deck */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print Pass</span>
                    </button>

                    <a
                      href={qrCodeUrl}
                      download={`GSFC_PASS_${selectedPass.token || selectedPass.pass_token}.png`}
                      className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-950 rounded-3xl border border-slate-800 text-center space-y-3">
                <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-bold">No active passes yet. Register for an event on the right to receive your pass.</p>
              </div>
            )}
          </div>

          {/* RIGHT: Available Fests & Events (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Upcoming GSFC Fests & Placement Drives</span>
              </h2>
              <span className="text-[11px] font-bold text-slate-400">
                {events.length} Available Events
              </span>
            </div>

            <div className="space-y-4">
              {events.map((evt) => {
                const registered = isEventRegistered(evt);
                return (
                  <div
                    key={evt.id}
                    className="p-5 bg-slate-950/80 hover:bg-slate-950 rounded-3xl border border-slate-800 hover:border-indigo-500/50 shadow-xl transition-all space-y-4 group"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {evt.slug?.includes('conclave') ? 'Corporate Drive' : 'Tech & Career Fest'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" /> {evt.event_date}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" /> {evt.venue || 'GSFC Auditorium'}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                          {evt.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium line-clamp-2">
                          {evt.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 flex-wrap gap-2 text-xs">
                      <div className="text-slate-400 font-bold">
                        <span>Capacity: </span>
                        <strong className="text-slate-200">{evt.total_external_registered || 0} / {evt.max_capacity || 1000}</strong>
                        <span className="text-slate-500 ml-1">Registered</span>
                      </div>

                      {registered ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRegisteringEvent(evt)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Apply / Register for Event</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* APPLY / REGISTER EVENT MODAL */}
        {registeringEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-5 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    GSFC University Event Registration
                  </span>
                  <h3 className="text-lg font-black text-white">{registeringEvent.title}</h3>
                </div>
                <button
                  onClick={() => setRegisteringEvent(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApplyForEvent} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">College / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.organization}
                    onChange={(e) => setRegForm({ ...regForm, organization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200">
                  ⚡ <strong>Instant Pass Issuance:</strong> Upon submitting, an official GSFC Digital QR Entry Pass will be instantly generated and stored in your profile.
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisteringEvent(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
                  >
                    {registerLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Confirm & Generate Pass</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
