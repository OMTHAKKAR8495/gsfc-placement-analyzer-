import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, FileText, Search, UploadCloud, CheckCircle2, 
  XCircle, Clock, Building2, User, Award, Hash, ExternalLink, ArrowRight, 
  Sparkles, RefreshCw, Lock, Copy, Check, ArrowLeft, Layers 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function PublicDocumentVerifyPage({ initialDocId = '', onBackToHome }) {
  const { t } = useLanguage();
  const [docIdInput, setDocIdInput] = useState(initialDocId || '');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('verify'); // 'verify' | 'ledger'
  const [ledgerBlocks, setLedgerBlocks] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [fileCalculating, setFileCalculating] = useState(false);

  useEffect(() => {
    if (initialDocId) {
      handleVerify(initialDocId);
    }
  }, [initialDocId]);

  const handleVerify = async (queryId) => {
    const idToSearch = (queryId || docIdInput).trim();
    if (!idToSearch) {
      setErrorMsg('Please enter a valid Document ID or Cryptographic Hash.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setVerificationResult(null);

    try {
      const res = await fetch(`/api/blockchain/verify/${encodeURIComponent(idToSearch)}`);
      const data = await res.json();
      if (res.ok && data.verified) {
        setVerificationResult(data);
      } else {
        setErrorMsg(data.message || 'No official document found with this ID on the GSFC Cryptographic Ledger.');
        setVerificationResult({ verified: false, status: data.status || 'not_found', message: data.message });
      }
    } catch (err) {
      setErrorMsg('Network error connecting to verification gateway: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Client-side SHA-256 calculation for uploaded files
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileCalculating(true);
    setErrorMsg('');
    setVerificationResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setDocIdInput(hashHex);

      const res = await fetch('/api/blockchain/verify-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: hashHex })
      });
      const data = await res.json();

      if (res.ok && data.verified) {
        setVerificationResult(data);
      } else {
        setVerificationResult({
          verified: false,
          calculated_hash: hashHex,
          status: 'tampered_or_unregistered',
          message: '❌ Tampered / Unregistered File: The calculated cryptographic hash does not match any official document sealed by GSFC University TPC.'
        });
      }
    } catch (err) {
      setErrorMsg('Error processing file: ' + err.message);
    } finally {
      setFileCalculating(false);
    }
  };

  const fetchLedger = async () => {
    setLedgerLoading(true);
    try {
      const res = await fetch('/api/blockchain/ledger');
      const data = await res.json();
      if (data.ledger) {
        setLedgerBlocks(data.ledger);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleCopyHash = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/40 text-white font-black text-lg">
            ⛓️
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-white flex items-center gap-2">
              GSFC University TPC
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                Ledger Verifier
              </span>
            </div>
            <div className="text-xs text-slate-400">Public Document Authenticity & Cryptographic Verification</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('verify')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'verify' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Verify Document
            </button>
            <button
              onClick={() => { setActiveTab('ledger'); fetchLedger(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ledger' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Ledger Blocks
            </button>
          </div>

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {activeTab === 'verify' ? (
          <>
            {/* Hero Verification Box */}
            <div className="bg-gradient-to-b from-slate-800/80 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-blue-400" /> Tamper-Evident SHA-256 Proofs
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Verify Official Placement Credentials
                </h1>
                <p className="text-sm text-slate-400">
                  Instantly authenticate offer letters, placement certificates, and technical eligibility passes issued by GSFC University Training & Placement Cell.
                </p>
              </div>

              {/* Input Bar */}
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={docIdInput}
                      onChange={(e) => setDocIdInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                      placeholder="e.g. GSFC-CERT-2026-001 or SHA-256 hash..."
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <button
                    onClick={() => handleVerify()}
                    disabled={loading || fileCalculating}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 shrink-0"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Verify Now
                  </button>
                </div>

                {/* File Upload Trigger */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <span>Or verify original file binary:</span>
                  <label className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer underline flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5" />
                    Upload PDF / Certificate
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {fileCalculating && <span className="text-amber-400 animate-pulse">Calculating cryptographic digest...</span>}
                </div>

                {/* Sample IDs Quick Fill */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500 pt-2">
                  <span>Try sample ID:</span>
                  <button
                    onClick={() => { setDocIdInput('GSFC-CERT-2026-001'); handleVerify('GSFC-CERT-2026-001'); }}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-md font-mono text-[11px] border border-slate-700"
                  >
                    GSFC-CERT-2026-001
                  </button>
                  <button
                    onClick={() => { setDocIdInput('GSFC-OFFER-2026-045'); handleVerify('GSFC-OFFER-2026-045'); }}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-md font-mono text-[11px] border border-slate-700"
                  >
                    GSFC-OFFER-2026-045
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Result Card */}
            {verificationResult && (
              <div className="transition-all animate-in fade-in zoom-in-95 duration-300">
                {verificationResult.verified ? (
                  <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-emerald-950/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/40 pb-5">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            Cryptographically Verified Authentic
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-white">
                            {verificationResult.document?.document_title || 'Official Placement Credential'}
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/50 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono font-bold text-emerald-300">Block #{verificationResult.document?.block_number || 1}</span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400" /> Candidate Name
                        </div>
                        <div className="text-sm font-black text-white">{verificationResult.document?.student_name}</div>
                        <div className="text-xs font-mono text-slate-400">{verificationResult.document?.roll_number}</div>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Placement Partner & Role
                        </div>
                        <div className="text-sm font-black text-white">{verificationResult.document?.company_name}</div>
                        <div className="text-xs text-slate-400">{verificationResult.document?.job_title}</div>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-400" /> Offered CTC Package
                        </div>
                        <div className="text-sm font-black text-amber-300">{verificationResult.document?.ctc_range || 'Standard Grade'}</div>
                        <div className="text-xs text-slate-400">Issued: {new Date(verificationResult.document?.issued_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Cryptographic Proof Box */}
                    <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-indigo-400" /> SHA-256 Cryptographic Digest
                        </span>
                        <button
                          onClick={() => handleCopyHash(verificationResult.document?.document_hash)}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                        >
                          {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedHash ? 'Copied' : 'Copy Hash'}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-emerald-400 bg-slate-900 p-2.5 rounded-xl break-all border border-emerald-950">
                        {verificationResult.document?.document_hash}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                        <span>🏛️ Issuing Authority: <strong className="text-slate-200">{verificationResult.document?.issuer_name}</strong> ({verificationResult.document?.issuer_role})</span>
                        <span>Immutable Record • GSFC University TPC</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-b from-rose-950/40 to-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                        <XCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-rose-400">
                          Verification Failed
                        </div>
                        <h3 className="text-lg font-black text-white">Document Not Found / Tampered</h3>
                        <p className="text-sm text-slate-300 mt-1">
                          {verificationResult.message || 'No matching block hash exists on the GSFC Placement ledger. This document may be altered or unauthorized.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Ledger Blocks Explorer */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" /> GSFC Cryptographic Placement Ledger
                </h2>
                <p className="text-xs text-slate-400">Append-only immutable record of all issued placement credentials.</p>
              </div>
              <button
                onClick={fetchLedger}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
              >
                <RefreshCw className={`w-4 h-4 ${ledgerLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3">
              {ledgerBlocks.map((block) => (
                <div key={block.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                        Block #{block.block_number}
                      </span>
                      <span className="text-sm font-bold text-white">{block.document_title}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(block.issued_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-300">
                    <span>Candidate: <strong>{block.student_name}</strong> ({block.roll_number})</span>
                    <span>Company: <strong>{block.company_name}</strong></span>
                    <span>Doc ID: <strong className="font-mono text-blue-400">{block.id}</strong></span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 bg-slate-900/90 p-2 rounded-lg truncate border border-slate-800">
                    Hash: {block.document_hash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
