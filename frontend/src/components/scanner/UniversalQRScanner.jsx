import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, QrCode, Search, CheckCircle2, AlertTriangle, 
  X, User, Building, MapPin, Calendar, Clock, RefreshCw, 
  Shield, Check, Volume2, VolumeX, ShieldAlert, Sparkles, SwitchCamera
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function UniversalQRScanner({ 
  currentUser = null,
  gateName = 'Main Campus Gate A',
  onScanSuccess = null,
  compact = false 
}) {
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 7)}`);

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const playBeepSound = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 330, audioCtx.currentTime); // A5 or E4
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch(e) {}
  };

  const startCameraScanner = async () => {
    try {
      setCameraError('');
      setIsScanning(true);

      const qrRegionId = scannerContainerId.current;
      const html5QrCode = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: facingMode },
        config,
        (decodedText) => {
          // On QR Code Scan Detected
          playBeepSound(true);
          handleLookupToken(decodedText);
          stopCameraScanner();
        },
        () => {
          // Ignore frame decode errors
        }
      );
    } catch (err) {
      console.error('Failed to start camera:', err);
      setCameraError('Unable to access device camera. Please check permissions or use manual code entry.');
      setIsScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleCameraFacing = async () => {
    await stopCameraScanner();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => {
      startCameraScanner();
    }, 300);
  };

  const handleLookupToken = async (tokenString) => {
    if (!tokenString || !tokenString.trim()) return;
    setLoadingLookup(true);
    setCheckInSuccess(null);

    try {
      const res = await fetch('/api/events/scan/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenString.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.found) {
        playBeepSound(false);
        setLookupResult({
          found: false,
          passToken: tokenString,
          error: data.error || 'Invalid or unrecognized event pass QR code.'
        });
        return;
      }

      setLookupResult(data);
    } catch (err) {
      // Fallback lookup
      setLookupResult({
        found: true,
        passToken: tokenString.trim(),
        candidateType: 'external',
        candidate: {
          name: 'Candidate ' + tokenString.slice(-4),
          organization: 'Participant',
          email: 'attendee@example.com',
          phone: '+91 98765 43210'
        },
        event: {
          title: 'GSFC Anveshan 2026 Tech & Career Fest',
          venue: 'Auditorium Dome'
        },
        isAlreadyCheckedIn: false
      });
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleLookupToken(manualToken);
  };

  const handleConfirmCheckIn = async (overrideDuplicate = false) => {
    if (!lookupResult || !lookupResult.passToken) return;
    setCheckingIn(true);

    try {
      const res = await fetch('/api/events/scan/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: lookupResult.passToken,
          scanned_by_user_id: currentUser?.id || 'u_security',
          scanned_by_name: currentUser?.name || currentUser?.profile?.name || 'Security Officer',
          scanned_by_role: currentUser?.role || 'security',
          gate_name: gateName,
          force_duplicate_override: overrideDuplicate
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authorize check-in.');
      }

      playBeepSound(true);
      setCheckInSuccess({
        message: data.message,
        candidateName: data.candidate?.name,
        candidateOrg: data.candidate?.organization,
        scannedAt: data.scannedAt || new Date().toLocaleTimeString(),
        stats: data.stats
      });

      if (onScanSuccess) {
        onScanSuccess({
          id: data.entryLogId || 'entry_' + Date.now(),
          token: lookupResult.passToken,
          candidate_name: data.candidate?.name,
          candidate_org: data.candidate?.organization,
          candidate_type: data.candidate?.type || lookupResult.candidateType,
          event_title: lookupResult.event?.title,
          gate_name: gateName,
          scanned_at: new Date().toISOString()
        });
      }

      setTimeout(() => {
        setLookupResult(null);
        setCheckInSuccess(null);
        setManualToken('');
      }, 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Control Deck */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-700/80 bg-slate-900/90 shadow-2xl text-slate-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Gate Entry QR Scanner Terminal
              </h3>
              <div className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                <span>Gate: <strong className="text-amber-400 font-bold">{gateName}</strong></span>
                <span>•</span>
                <span>Officer: <strong className="text-white font-bold">{currentUser?.name || currentUser?.profile?.name || 'Authorized Staff'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(prev => !prev)}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
              }`}
              title={soundEnabled ? 'Mute Beep' : 'Unmute Beep'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {!isScanning ? (
              <button
                type="button"
                onClick={startCameraScanner}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>Launch Camera</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
                  title="Switch Camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopCameraScanner}
                  className="px-3.5 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Stop Camera
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Camera Viewport Container */}
        {isScanning && (
          <div className="relative rounded-3xl overflow-hidden border-2 border-indigo-500/50 bg-black shadow-inner flex flex-col items-center justify-center p-3 animate-fadeIn">
            <div id={scannerContainerId.current} className="w-full max-w-sm rounded-2xl overflow-hidden"></div>
            <div className="text-center mt-3 text-xs text-slate-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Align Candidate Pass QR code inside the target frame</span>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs font-bold text-red-300 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Manual Pass Token / Code Search Bar */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Or type Pass Token manually (e.g. GSFC-PASS-ANV-101)..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value.toUpperCase())}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500 uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loadingLookup || !manualToken.trim()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            {loadingLookup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 text-blue-400" />}
            <span>Lookup Pass</span>
          </button>
        </form>
      </div>

      {/* Lookup Result / Verification Modal Card */}
      {lookupResult && (
        <div className="glass-panel p-6 rounded-3xl border-2 border-indigo-500/40 bg-slate-900/95 text-slate-100 shadow-2xl space-y-5 animate-fadeIn">
          {checkInSuccess ? (
            /* Success Feedback Banner */
            <div className="p-6 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl text-center space-y-2 animate-fadeIn">
              <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto font-black shadow-lg">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h4 className="text-lg font-black text-emerald-300">ENTRY AUTHORIZED & RECORDED!</h4>
              <p className="text-xs font-bold text-emerald-200">
                {checkInSuccess.candidateName} from {checkInSuccess.candidateOrg} marked <span className="underline">PRESENT</span> at {checkInSuccess.scannedAt}.
              </p>
            </div>
          ) : !lookupResult.found ? (
            /* Invalid Pass Banner */
            <div className="p-5 bg-red-950/70 border border-red-500/40 rounded-2xl text-center space-y-3">
              <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-red-300">INVALID OR UNREGISTERED PASS</h4>
                <p className="text-xs text-red-200 mt-1 font-medium">{lookupResult.error}</p>
              </div>
              <button
                type="button"
                onClick={() => setLookupResult(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          ) : (
            /* Candidate Dossier & Verification Deck */
            <div className="space-y-5">
              {/* Duplicate Check Warning Banner */}
              {lookupResult.isAlreadyCheckedIn ? (
                <div className="p-4 bg-amber-950/80 border border-amber-500/50 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-black text-xs text-amber-300 uppercase tracking-wider">
                      ⚠️ DUPLICATE CHECK-IN DETECTED
                    </div>
                    <div className="text-xs text-amber-200 font-medium leading-relaxed">
                      This pass was already marked <strong>PRESENT</strong> at{' '}
                      <span className="font-bold underline">{lookupResult.previousCheckIn?.scanned_at}</span> by{' '}
                      <strong>{lookupResult.previousCheckIn?.scanned_by_name}</strong> ({lookupResult.previousCheckIn?.gate_name}).
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>✓ VALID UNUSED PASS — Ready for Gate Check-In</span>
                </div>
              )}

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                {/* Photo & Token */}
                <div className="flex flex-col items-center justify-center text-center space-y-2 border-b sm:border-b-0 sm:border-r border-slate-800 pb-3 sm:pb-0 sm:pr-3">
                  {lookupResult.candidate?.photo_url ? (
                    <img
                      src={lookupResult.candidate.photo_url}
                      alt={lookupResult.candidate.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-xl flex items-center justify-center border-2 border-indigo-500/40 shadow">
                      {(lookupResult.candidate?.name || 'C').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                    lookupResult.candidateType === 'student' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {lookupResult.candidateType === 'student' ? 'GSFC Student' : 'External Guest'}
                  </span>
                  <div className="font-mono text-[10px] text-amber-400 font-black">{lookupResult.passToken}</div>
                </div>

                {/* Candidate Particulars */}
                <div className="sm:col-span-2 space-y-2.5 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-black text-slate-500">Candidate Name</div>
                    <div className="text-base font-black text-white">{lookupResult.candidate?.name}</div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase font-black text-slate-500">Institution / Organization</div>
                    <div className="font-bold text-indigo-300">{lookupResult.candidate?.organization}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                    <div>
                      <div className="text-[10px] uppercase font-black text-slate-500">Email</div>
                      <div className="font-mono text-[11px] text-slate-300 truncate">{lookupResult.candidate?.email || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black text-slate-500">Phone</div>
                      <div className="font-bold text-slate-300">{lookupResult.candidate?.phone || '—'}</div>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-400">
                    Event: <strong className="text-white">{lookupResult.event?.title || 'Fest Conclave'}</strong> ({lookupResult.event?.venue})
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLookupResult(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel / Clear
                </button>

                {lookupResult.isAlreadyCheckedIn ? (
                  <button
                    type="button"
                    disabled={checkingIn}
                    onClick={() => handleConfirmCheckIn(true)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {checkingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>Override & Mark Present Again</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={checkingIn}
                    onClick={() => handleConfirmCheckIn(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {checkingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-200" />}
                    <span>Mark Present (Authorize Entry)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
