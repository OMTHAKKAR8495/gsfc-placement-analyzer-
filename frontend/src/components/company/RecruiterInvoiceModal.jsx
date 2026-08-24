import React from 'react';
import { X, Printer, Download, Building2, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

export default function RecruiterInvoiceModal({ isOpen, onClose, transaction }) {
  if (!isOpen || !transaction) return null;

  const invoice = transaction.invoice_data || transaction.invoice || {};
  const receiptNo = transaction.receipt_number || invoice.receiptNumber || 'GSFC-REC-2026';
  const issueDate = transaction.paid_at || transaction.created_at || new Date().toISOString();
  const companyName = transaction.company_name || invoice.companyName || 'Corporate Recruiter';
  const planName = transaction.plan_name || invoice.planName || 'Corporate Placement Tier';
  const totalAmount = transaction.amount_inr || invoice.totalAmount || 0;
  const baseAmount = invoice.baseAmount || Math.round(totalAmount / 1.18);
  const gstAmount = invoice.gstAmount || (totalAmount - baseAmount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl my-8 bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Actions Top Bar */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-700" />
            <span>Official GST Tax Invoice Receipt</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-white space-y-6 text-xs text-slate-700">
          
          {/* Header with GSFC Logo & Institution Info */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-xl shadow-md">
                G
              </div>
              <div>
                <h1 className="text-base font-black text-blue-950 uppercase tracking-tight">
                  GSFC University
                </h1>
                <p className="text-[11px] font-bold text-slate-600">Training & Placement Cell (TPC)</p>
                <p className="text-[10px] text-slate-500">Vigyan Bhavan, Fertilizer Nagar, Vadodara, Gujarat 391750</p>
                <p className="text-[10px] text-slate-500">GSTIN: <strong>24AAACG1234F1Z5</strong> | State: Gujarat (24)</p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-black rounded-lg text-xs uppercase mb-1">
                ORIGINAL TAX INVOICE
              </div>
              <p className="text-[11px] font-bold text-slate-800">Invoice #: {receiptNo}</p>
              <p className="text-[10px] text-slate-500">Date: {new Date(issueDate).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Billed To / Recruiter Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Billed To (Recruiter):
              </span>
              <h3 className="font-black text-slate-900 text-sm">{companyName}</h3>
              <p className="text-slate-600 mt-0.5">{invoice.companyEmail || transaction.billing_email || 'hr@company.com'}</p>
              <p className="text-slate-600">{invoice.companyPhone || transaction.billing_phone || '+91 98765 43210'}</p>
              {invoice.gstNumber && <p className="text-[10px] font-mono text-slate-500 mt-1">Client GSTIN: {invoice.gstNumber}</p>}
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Payment Particulars:
              </span>
              <p><strong>Payment Gateway:</strong> Razorpay UPI / Cards</p>
              <p><strong>Transaction Ref:</strong> <span className="font-mono text-[10px]">{transaction.gateway_payment_id || 'pay_demo_verified'}</span></p>
              <p><strong>Payment Status:</strong> <span className="text-emerald-600 font-black">PAID & SETTLED</span></p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-[11px] font-black uppercase">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Subscription Item Description</th>
                  <th className="p-3">HSN/SAC</th>
                  <th className="p-3 text-right">Taxable Value</th>
                  <th className="p-3 text-right">GST (18%)</th>
                  <th className="p-3 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold">1</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{planName} Corporate Recruitment Access</p>
                    <p className="text-[10px] text-slate-500">Campus hiring drive requirement posting, applicant rosters & verification</p>
                  </td>
                  <td className="p-3 font-mono text-[10px]">998311</td>
                  <td className="p-3 text-right font-semibold">₹{baseAmount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-semibold">₹{gstAmount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-black text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Calculation */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Sub-Total:</span>
                <span className="font-bold text-slate-800">₹{baseAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (9%):</span>
                <span>₹{Math.round(gstAmount / 2).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (9%):</span>
                <span>₹{Math.round(gstAmount / 2).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-slate-950 text-sm">
                <span>Grand Total:</span>
                <span className="text-blue-900">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Authorization & Signature Seal */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 text-[10px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Computer-generated official tax invoice. Certified genuine by GSFC TPC.</span>
            </div>

            <div className="text-center">
              <div className="w-28 h-10 border-b border-slate-400 mb-1 flex items-end justify-center">
                <span className="font-serif italic text-slate-700 text-xs font-bold">Neeshu Chaudhary</span>
              </div>
              <span className="text-[10px] font-black text-slate-800 uppercase block">Dr. Neeshu Chaudhary</span>
              <span className="text-[9px] text-slate-500 block">Placement Officer, GSFC University</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
