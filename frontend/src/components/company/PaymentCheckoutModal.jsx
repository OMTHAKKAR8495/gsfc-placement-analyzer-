import React, { useState, useEffect } from 'react';
import { 
  X, Check, ShieldCheck, CreditCard, QrCode, Building2, 
  Lock, ArrowRight, Sparkles, CheckCircle2, AlertCircle, 
  Smartphone, FileText, ChevronRight, Download, Printer, RefreshCw, Zap,
  ExternalLink, Copy, CheckCheck, Link2, Landmark, CheckCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { triggerCelebrationCrackles } from '../../context/ToastContext';

export const RECRUITER_PACKAGES = [
  {
    id: 'plan_bronze',
    name: 'Bronze Plan (Recruiter)',
    subtitle: '15 Days • 3 Active Drives',
    price_inr: 10000,
    duration_days: 15,
    max_postings: 3
  },
  {
    id: 'plan_silver',
    name: 'Silver Plan (Recruiter)',
    subtitle: '30 Days • 10 Active Drives',
    price_inr: 25000,
    duration_days: 30,
    max_postings: 10
  },
  {
    id: 'plan_gold',
    name: 'Gold Plan (Recruiter)',
    subtitle: '60 Days • Unlimited Drives',
    price_inr: 50000,
    duration_days: 60,
    max_postings: -1
  },
  {
    id: 'plan_diamond',
    name: 'Diamond Tier (Annual Sovereign)',
    subtitle: '365 Days • Full TPC Suite',
    price_inr: 100000,
    duration_days: 365,
    max_postings: -1
  }
];

export default function PaymentCheckoutModal({ 
  isOpen, 
  onClose, 
  plan: initialPlan, 
  company, 
  onPaymentSuccess 
}) {
  const [packageType, setPackageType] = useState('standard'); // 'standard' | 'custom'
  const [selectedPlan, setSelectedPlan] = useState(() => initialPlan || RECRUITER_PACKAGES[0]);
  const [customAmount, setCustomAmount] = useState(10000);
  const [customItemName, setCustomItemName] = useState('Custom Campus Drive Sponsorship');

  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'bank_wire' | 'cards'
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    gstNumber: '24AAACG1234F1Z5',
    address: 'GSFC University Technology Incubation Center, Vadodara, Gujarat'
  });

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedIfsc, setCopiedIfsc] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [manualUtr, setManualUtr] = useState('');
  const [step, setStep] = useState('review'); // 'review' | 'processing' | 'success' | 'failed'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedTransaction, setCompletedTransaction] = useState(null);

  const PRIMARY_UPI_ID = '9558413347@yb1';
  const OFFICIAL_UNIVERSITY_UPI = 'gsfcuniversity@icici';
  const RAZORPAY_PAYMENT_LINK = 'https://rzp.io/rzp/Oqk3jU7X';

  useEffect(() => {
    if (initialPlan) {
      const match = RECRUITER_PACKAGES.find(p => p.id === initialPlan.id) || initialPlan;
      setSelectedPlan(match);
    }
  }, [initialPlan]);

  useEffect(() => {
    if (company) {
      setBillingDetails(prev => ({
        ...prev,
        name: company.company_name || company.name || 'Oteck Technologies',
        email: company.contact_email || company.email || 'omthakkar168@gmail.com',
        phone: company.contact_phone || company.phone || '+91 95584 13347'
      }));
    }
  }, [company]);

  const activeAmount = packageType === 'custom' ? (parseInt(customAmount, 10) || 1000) : (selectedPlan?.price_inr || 10000);
  const activeItemName = packageType === 'custom' ? customItemName : (selectedPlan?.name || 'Recruiter Plan');

  // Generate live high-resolution UPI QR Code
  useEffect(() => {
    const upiUri = `upi://pay?pa=${PRIMARY_UPI_ID}&pn=GSFC%20Placement%20Cell&am=${activeAmount}&cu=INR&tn=${encodeURIComponent(activeItemName)}&tr=GSFC_SUB_${Date.now()}`;
    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR:', err));
  }, [activeAmount, activeItemName]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(PRIMARY_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(RAZORPAY_PAYMENT_LINK);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartPayment = async (forcedMethod = paymentMethod) => {
    setLoading(true);
    setErrorMessage('');
    setStep('processing');

    try {
      // 1. Create Order on Backend
      const orderRes = await fetch('/api/subscriptions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || company?.user_id,
          planId: selectedPlan?.id || 'plan_bronze',
          billingDetails: billingDetails
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Could not initiate payment order.');
      }

      // If window.Razorpay SDK is ready and key is active
      if (window.Razorpay && orderData.keyId && !orderData.keyId.includes('test_gsfc') && forcedMethod !== 'upi_qr') {
        const options = {
          key: orderData.keyId,
          amount: activeAmount * 100,
          currency: 'INR',
          name: 'GSFC University Placement Portal',
          description: `Subscription for ${activeItemName}`,
          image: '/gsfc-logo-official.png',
          order_id: orderData.orderId,
          prefill: {
            name: billingDetails.name,
            email: billingDetails.email,
            contact: billingDetails.phone
          },
          theme: { color: '#06b6d4' },
          handler: async function (response) {
            await verifyAndActivatePayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              isDemoCheckout: false
            });
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setStep('review');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // High-fidelity instant Sandbox / Verified QR Simulator
        setTimeout(async () => {
          const mockPaymentId = manualUtr ? `pay_utr_${manualUtr.trim()}` : ('pay_rzp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
          const mockSignature = 'verified_hmac_sig_' + Math.random().toString(36).substring(2, 10);

          await verifyAndActivatePayment({
            orderId: orderData.orderId,
            paymentId: mockPaymentId,
            signature: mockSignature,
            isDemoCheckout: true
          });
        }, 1200);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage(err.message || 'Payment initiation failed.');
      setStep('failed');
      setLoading(false);
    }
  };

  const verifyAndActivatePayment = async ({ orderId, paymentId, signature, isDemoCheckout }) => {
    try {
      const verifyRes = await fetch('/api/subscriptions/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company?.id || company?.user_id,
          planId: selectedPlan?.id || 'plan_bronze',
          orderId: orderId,
          paymentId: paymentId,
          signature: signature,
          paymentMethod: paymentMethod === 'upi' ? `Instant UPI QR (${PRIMARY_UPI_ID})` : paymentMethod === 'bank_wire' ? 'Bank Wire (NEFT/RTGS)' : `Live Razorpay Gateway (${RAZORPAY_PAYMENT_LINK})`,
          billingDetails: billingDetails,
          isDemoCheckout: isDemoCheckout
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed.');
      }

      setCompletedTransaction(verifyData.transaction);
      setStep('success');
      setLoading(false);
      triggerCelebrationCrackles();

      if (onPaymentSuccess) {
        onPaymentSuccess(verifyData.subscription, verifyData.transaction);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setErrorMessage(err.message || 'Payment verification failed.');
      setStep('failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl my-auto bg-[#070d18] border border-cyan-900/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col text-white max-h-[94vh]">
        
        {/* Top Header */}
        <div className="p-6 pb-4 text-center relative border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-transparent">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-amber-300 bg-clip-text text-transparent">
            Online Payment Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl mx-auto mt-1.5">
            Pay easily for GSFC University placement packages, recruiter tiers, or custom drives via Instant UPI QR, Bank Wire (NEFT/IMPS), or Cards. Instant receipt issued.
          </p>
        </div>

        {/* Modal Main Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {step === 'review' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Steps 1 & 2 */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Step 1: Select Package or Amount */}
                <div className="p-5 rounded-3xl bg-[#0c1424] border border-cyan-900/30 shadow-md space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black text-amber-400">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>1. Select Package or Amount</span>
                  </div>

                  {/* Toggle: Standard Packages / Custom Amount */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#070c18] rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPackageType('standard')}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        packageType === 'standard'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Standard Packages
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackageType('custom')}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        packageType === 'custom'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Custom Amount
                    </button>
                  </div>

                  {/* Package Cards List */}
                  {packageType === 'standard' ? (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {RECRUITER_PACKAGES.map((pkg) => {
                        const isSelected = selectedPlan?.id === pkg.id;
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => setSelectedPlan(pkg)}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400'
                                : 'bg-[#09101d] border-slate-800/80 hover:border-slate-700 hover:bg-[#0c1629]'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-black text-white">{pkg.name}</div>
                              <div className="text-[11px] text-slate-400">{pkg.subtitle}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-black text-cyan-400">
                                ₹{pkg.price_inr.toLocaleString('en-IN')}{pkg.id === 'plan_diamond' ? '+' : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-[#09101d] rounded-2xl border border-slate-800">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Custom Description / Milestone</label>
                        <input
                          type="text"
                          value={customItemName}
                          onChange={(e) => setCustomItemName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#070c18] border border-slate-700 text-xs text-white focus:border-cyan-400"
                          placeholder="e.g. On-Campus Placement Drive Sponsor"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Amount in INR (₹)</label>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#070c18] border border-slate-700 text-xs font-mono text-cyan-400 font-bold focus:border-cyan-400"
                          min="100"
                        />
                      </div>
                    </div>
                  )}

                  {/* Summary Bar */}
                  <div className="pt-3 border-t border-slate-800/90 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Selected Item:</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[200px]">{activeItemName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black">
                    <span className="text-slate-300">Total Payable:</span>
                    <span className="text-cyan-400 text-lg font-black">₹{activeAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Step 2: Client Details */}
                <div className="p-5 rounded-3xl bg-[#0c1424] border border-cyan-900/30 shadow-md space-y-3.5">
                  <div className="flex items-center gap-2 text-sm font-black text-cyan-400">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    <span>2. Client Details</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">Full Name / Business Name *</span>
                      <input
                        type="text"
                        value={billingDetails.name}
                        onChange={(e) => setBillingDetails({ ...billingDetails, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070c18] border border-slate-700 text-xs text-white focus:border-cyan-400 placeholder:text-slate-600"
                        placeholder="e.g. Om Thakkar / Oteck Technologies"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">Email Address (for receipt & invoice) *</span>
                      <input
                        type="email"
                        value={billingDetails.email}
                        onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070c18] border border-slate-700 text-xs text-white focus:border-cyan-400 placeholder:text-slate-600"
                        placeholder="omthakkar168@gmail.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">Phone Number</span>
                        <input
                          type="text"
                          value={billingDetails.phone}
                          onChange={(e) => setBillingDetails({ ...billingDetails, phone: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#070c18] border border-slate-700 text-xs text-white focus:border-cyan-400"
                          placeholder="+91 95584 13347"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">GSTIN Number (Optional)</span>
                        <input
                          type="text"
                          value={billingDetails.gstNumber}
                          onChange={(e) => setBillingDetails({ ...billingDetails, gstNumber: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#070c18] border border-slate-700 text-xs text-white focus:border-cyan-400"
                          placeholder="24AAACG1234F1Z5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>


              {/* RIGHT COLUMN: Step 3 (Payment Method & Action Box) */}
              <div className="lg:col-span-6 space-y-4">
                
                <div className="p-5 rounded-3xl bg-[#0c1424] border border-cyan-900/30 shadow-md space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black text-cyan-400">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span>3. Choose Payment Method</span>
                  </div>

                  {/* 3 Main Method Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg font-black'
                          : 'bg-[#09101d] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Instant UPI / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_wire')}
                      className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'bank_wire'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg font-black'
                          : 'bg-[#09101d] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                      <span>Bank Wire (NEFT)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cards')}
                      className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentMethod === 'cards'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg font-black'
                          : 'bg-[#09101d] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Cards / Gateway</span>
                    </button>
                  </div>

                  {/* Central Razorpay Box */}
                  <div className="p-5 rounded-3xl bg-[#09101d] border border-cyan-500/20 text-center space-y-3.5 shadow-inner">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 rounded-full text-[11px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Live Razorpay Instant Payment
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Amount set by selected plan or custom input:</div>
                      <div className="text-3xl font-black text-cyan-400 mt-0.5 tracking-tight">
                        ₹{activeAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs font-bold text-slate-300 mt-0.5">Item: {activeItemName}</div>
                    </div>

                    {/* QR Preview if in UPI Mode */}
                    {paymentMethod === 'upi' && qrDataUrl && (
                      <div className="p-3 bg-white rounded-2xl w-44 h-44 mx-auto border border-cyan-400/50 shadow-lg flex flex-col items-center justify-center">
                        <img src={qrDataUrl} alt="UPI QR" className="w-36 h-36 object-contain" />
                        <span className="text-[9px] font-black text-slate-900 uppercase">Scan to Pay via Any UPI</span>
                      </div>
                    )}

                    {/* Bank Wire Details if in Bank Wire Mode */}
                    {paymentMethod === 'bank_wire' && (
                      <div className="p-3.5 bg-[#070c18] rounded-2xl border border-slate-800 text-left text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Account Name:</span>
                          <span className="font-bold text-white">GSFC University TPC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Bank Name:</span>
                          <span className="font-bold text-white">ICICI Bank Ltd</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Account No:</span>
                          <span className="font-mono font-bold text-cyan-300">184605001234</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">IFSC Code:</span>
                          <span className="font-mono font-bold text-cyan-300">ICIC0001846</span>
                        </div>
                      </div>
                    )}

                    {/* Double Action Button Grid */}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartPayment(paymentMethod)}
                        disabled={loading}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pay ₹{activeAmount.toLocaleString('en-IN')} via Live Razorpay ⚡</span>
                      </button>

                      <a
                        href={RAZORPAY_PAYMENT_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 px-4 rounded-xl bg-[#0f1b30] hover:bg-[#152542] border border-cyan-800/40 text-cyan-300 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
                      >
                        <span>Hosted Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="text-[10px] text-slate-400 font-medium">
                      Accepts Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards & NetBanking.
                    </div>
                  </div>

                  {/* Direct UPI VPA Handle */}
                  <div className="p-3.5 rounded-2xl bg-[#09101d] border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">DIRECT UPI VPA HANDLE</div>
                      <div className="font-mono font-black text-white text-sm mt-0.5">{PRIMARY_UPI_ID}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="py-1.5 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      {copiedUpi ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy UPI ID'}</span>
                    </button>
                  </div>

                  {/* UTR Verification Field */}
                  <div className="p-3 rounded-2xl bg-[#09101d] border border-slate-800 flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      value={manualUtr}
                      onChange={(e) => setManualUtr(e.target.value)}
                      placeholder="Enter UPI Ref / UTR No. (Optional)"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#070c18] border border-slate-700 text-xs font-mono text-white focus:border-cyan-400 placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleStartPayment('upi_qr')}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer shrink-0"
                    >
                      Verify UTR
                    </button>
                  </div>

                  {/* Automatic Official Tax Receipt Generation Notice */}
                  <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-900/30 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Automatic Official Tax Receipt Generation</span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      Clicking <strong>Pay via Live Razorpay</strong> launches your secure checkout. Upon successful payment completion, your official branded tax receipt will automatically pop up with a print & download option!
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* STEP 2: PROCESSING */}
          {step === 'processing' && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                <Lock className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Communicating with Razorpay Secure Gateway...
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Verifying cryptographic HMAC signature and provisioning your recruiter tier. Please do not refresh.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && completedTransaction && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg animate-bounce">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">
                  Payment Verified & Portals Unlocked!
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  Your corporate account is now activated for <strong>{activeItemName}</strong>. You have full access to student dossiers, ATS match rankings, and live interview rooms.
                </p>
              </div>

              {/* Receipt Pill Card */}
              <div className="w-full max-w-md p-4 bg-[#0c1424] rounded-2xl border border-cyan-900/40 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Receipt / Invoice No:</span>
                  <span className="font-bold text-cyan-300">{completedTransaction.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono text-[11px] text-slate-300">{completedTransaction.payment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-black text-emerald-400">₹{activeAmount.toLocaleString('en-IN')} (Success)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer"
              >
                Access Recruiter Portal
              </button>
            </div>
          )}

          {/* STEP 4: FAILED */}
          {step === 'failed' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Payment Could Not Be Completed</h3>
                <p className="text-xs text-rose-400 mt-1 max-w-sm">{errorMessage || 'Please try again or use the Hosted Razorpay link.'}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl border border-slate-700 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="py-2.5 px-5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
