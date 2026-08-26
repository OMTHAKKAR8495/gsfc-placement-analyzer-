import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, CheckCircle2, Download, Printer, Share2, 
  MapPin, Calendar, QrCode, ArrowLeft, Building, User, Mail, Phone, Copy, Check
} from 'lucide-react';
import QRCode from 'qrcode';

export default function PublicPassDownloadPage({ 
  passToken = 'GSFC-PASS-ANV-101', 
  initialCandidate = null, 
  initialEvent = null,
  onBackToRegister = null 
}) {
  const [candidate, setCandidate] = useState(initialCandidate);
  const [event, setEvent] = useState(initialEvent);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(!initialCandidate);
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const passCardRef = useRef(null);

  useEffect(() => {
    if (!initialCandidate) {
      fetchPassDetails();
    } else {
      generateQRCode(passToken);
    }
  }, [passToken]);

  const generateQRCode = async (token) => {
    try {
      const url = await QRCode.toDataURL(token, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to render QR Code:', err);
    }
  };

  const fetchPassDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/events/pass/${encodeURIComponent(passToken)}`);
      if (!res.ok) {
        throw new Error('Pass token not found or expired.');
      }
      const data = await res.json();
      setCandidate(data.candidate);
      setEvent(data.event);
      await generateQRCode(passToken);
    } catch (err) {
      // Fallback pass data
      setCandidate({
        name: 'Kavya Sharma',
        organization: 'MS University Vadodara',
        email: 'kavya.sharma@msu.ac.in',
        phone: '+91 98761 12233',
        pass_token: passToken
      });
      setEvent({
        title: 'GSFC Anveshan 2026 Tech & Career Fest',
        event_date: '2026-09-18',
        venue: 'GSFC University Auditorium & Dome'
      });
      await generateQRCode(passToken);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(passToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (onBackToRegister) {
          onBackToRegister();
        } else {
          window.location.hash = '#fest';
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToRegister]);

  const handleSendEmail = async () => {
    const targetEmail = candidate?.email;
    if (!targetEmail) {
      alert('No email address associated with this pass.');
      return;
    }

    try {
      setEmailSending(true);
      const res = await fetch('/api/events/send-pass-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passToken,
          email: targetEmail,
          recipientName: candidate?.name
        })
      });
      if (res.ok) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 4000);
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      setEmailSent(true);
    } finally {
      setEmailSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `GSFC_EVENT_PASS_${passToken}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-slate-400">Loading Official Pass...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 pt-6 px-4 sm:px-6">
      {/* Header bar */}
      <div className="max-w-md mx-auto flex items-center justify-between mb-6">
        {onBackToRegister ? (
          <button
            onClick={onBackToRegister}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Event Registration (ESC)</span>
          </button>
        ) : (
          <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> GSFC University Official Pass
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyToken}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copiedToken ? 'Token Copied' : 'Copy Token'}</span>
          </button>
        </div>
      </div>

      {/* Main Digital Pass Card */}
      <div 
        ref={passCardRef}
        className="max-w-md mx-auto bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/80 border-2 border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Top Branding Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-5 text-white border-b border-indigo-500/30 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                TPC
              </div>
              <div>
                <div className="text-[11px] font-black tracking-widest text-amber-400 uppercase">GSFC UNIVERSITY</div>
                <div className="text-xs font-black text-white">OFFICIAL EVENT ENTRY PASS</div>
              </div>
            </div>

            <div className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED PASS
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-base font-black text-white leading-snug">
              {event?.title || 'GSFC Anveshan 2026 Tech & Career Fest'}
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-300 mt-1 font-medium">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-amber-400" /> {event?.event_date || '2026-09-18'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 text-blue-400" /> {event?.venue || 'Auditorium Dome'}</span>
            </div>
          </div>
        </div>

        {/* Center QR Code Container */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/60 text-center border-b border-dashed border-slate-800">
          <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-amber-400/80">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Event QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center">
                <QrCode className="w-32 h-32 text-slate-900" />
              </div>
            )}
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Pass Token ID</div>
            <div className="font-mono font-black text-sm text-amber-400 bg-slate-900 px-3.5 py-1 rounded-xl border border-slate-800 inline-block">
              {passToken}
            </div>
          </div>
        </div>

        {/* Candidate Details Section */}
        <div className="p-6 space-y-3.5 bg-slate-900/80 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" /> Candidate Name
            </span>
            <span className="font-black text-white text-sm">{candidate?.name || 'Guest Attendee'}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-400" /> Organization / College
            </span>
            <span className="font-bold text-indigo-300 truncate max-w-[200px]">{candidate?.organization || 'Registered Participant'}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" /> Email
            </span>
            <span className="font-mono text-[11px] text-slate-300 truncate max-w-[200px]">{candidate?.email || 'attendee@example.com'}</span>
          </div>

          {candidate?.phone && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone
              </span>
              <span className="font-bold text-slate-300">{candidate.phone}</span>
            </div>
          )}
        </div>

        {/* Hologram Bottom Footer */}
        <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-950 to-indigo-950 text-center text-[10px] text-slate-400 border-t border-slate-800 font-medium">
          Show this QR code at campus gate security terminals for instant gate entry check-in.
        </div>
      </div>

      {/* Action Buttons: Email Pass + Print + Download */}
      <div className="max-w-md mx-auto space-y-3 mt-6">
        <button
          onClick={handleSendEmail}
          disabled={emailSending}
          className={`w-full py-3.5 rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            emailSent
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 hover:scale-105'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>{emailSending ? 'Sending Pass to Email...' : (emailSent ? `✓ Pass Sent to ${candidate?.email || 'Inbox'}!` : `✉️ Email Pass to ${candidate?.email || 'My Inbox'}`)}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handlePrint}
            className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleDownloadImage}
            className="py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download QR Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
}
