
import React, { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  Building,
  Calendar,
  CheckCircle2,
  Receipt,
  ClipboardList,
  Wallet,
  CreditCard,
  Clock,
  Pencil,
  Banknote,
  X,
  FileText,
  TrendingUp,
  TrendingDown,
  Copy,
  Trash2,
  MessageSquareText,
  Truck,
} from 'lucide-react';
import { LanguageContext } from '../lib/context';
import { storage, NoteTemplate } from '../lib/storage';
import { commitDocNumber } from '../lib/docNumbering';
import { useClients } from '../lib/hooks/useClients';
import { useInvoice, useUpdateInvoice, useDeleteInvoice } from '../lib/hooks/useInvoices';
import { useEstimate, useDeleteEstimate } from '../lib/hooks/useEstimates';
import { usePayments, usePayment, useCreatePayment, useDeletePayment } from '../lib/hooks/usePayments';
import { useCredit, useDeleteCredit } from '../lib/hooks/useCredits';
import { useExpense, useDeleteExpense } from '../lib/hooks/useExpenses';
import { useBankAccounts } from '../lib/hooks/useBankAccounts';
import { useCreateBankTransaction } from '../lib/hooks/useBankTransactions';
import { useLatestExchangeRate } from '../lib/hooks/useExchangeRates';
import { alertMutationError } from '../lib/mutationError';
import DocPDFModal from '../components/DocPDFModal';
import DeliveryNoteModal from '../components/DeliveryNoteModal';

interface DocumentDetailPageProps {
  type: 'invoices' | 'estimates' | 'payments' | 'credits' | 'recurring' | 'expenses' | 'reports';
}

const DEFAULT_NOTES = `1-Office Hours: mon-fri 08:00-12:00/13:00-17:00).
2-Hakrinbank N.V SRD 20.633.15.56 II EURO 20.695.94.66 II US$ 20.802.82.73 SWIFT HAKRSRPA.
   For Banking transfers the transfercertificate is required.
   All bank and transfer costs are for the account of the buyer.
3-All wood products exclude: supply, finishing, glass, locksmithing
4-All measurements in MM II Size tolerances: ± 5mm
5-Exceeding the stated delivery time, those not lend parties the right to terminate the contract,
   to refuse payment or otherwise fail to fulfill his / her obligations.
6-We are not responsible for products that have not been collected within 30 days of completion.
7-Open balances are to be paid in full immediately before the items are collected.
8-No refund on cancellation, regardless of reason.
9-The warranty is on the product. Not on any additional costs such as transportation and labor costs.
   Ask for the warranty condition.`;

const DocumentDetailPage: React.FC<DocumentDetailPageProps> = ({ type }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, companyName, companyLogo, companyAddress, companyEmail, companyPhone, companyWebsite, companyBTW, companyKKF, currencySymbol } = useContext(LanguageContext);
  const [notes, setNotes] = useState<string>(() =>
    localStorage.getItem(`notes_${type}_${id}`) ?? DEFAULT_NOTES
  );
  const [editingNotes, setEditingNotes] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('SRD');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentBankId, setPaymentBankId] = useState('');
  const [showDeliveryNote, setShowDeliveryNote] = useState(false);

  const { data: allClients = [] } = useClients();
  const { data: invoiceData } = useInvoice(type === 'invoices' ? (id ?? '') : '');
  const { data: estimateData } = useEstimate(type === 'estimates' ? (id ?? '') : '');
  const { data: singlePaymentData } = usePayment(type === 'payments' ? (id ?? '') : '');
  const { data: creditData } = useCredit(type === 'credits' ? (id ?? '') : '');
  const { data: expenseData } = useExpense(type === 'expenses' ? (id ?? '') : '');
  const { data: allPayments = [] } = usePayments();

  const deleteInvoice = useDeleteInvoice();
  const deleteEstimate = useDeleteEstimate();
  const deletePayment = useDeletePayment();
  const deleteCredit = useDeleteCredit();
  const deleteExpense = useDeleteExpense();
  const createPayment = useCreatePayment();
  const updateInvoice = useUpdateInvoice();

  // Persist notes per document
  useEffect(() => {
    if (id) localStorage.setItem(`notes_${type}_${id}`, notes);
  }, [notes, type, id]);

  // Delete this document and navigate back
  const handleDelete = useCallback(() => {
    if (!id || !window.confirm('Delete this document? This cannot be undone.')) return;
    const onSuccess = () => navigate(-1);
    switch (type) {
      case 'invoices':  deleteInvoice.mutate(id, { onSuccess, onError: alertMutationError }); break;
      case 'estimates': deleteEstimate.mutate(id, { onSuccess, onError: alertMutationError }); break;
      case 'payments':  deletePayment.mutate(id, { onSuccess, onError: alertMutationError }); break;
      case 'credits':   deleteCredit.mutate(id, { onSuccess, onError: alertMutationError }); break;
      case 'expenses':  deleteExpense.mutate(id, { onSuccess, onError: alertMutationError }); break;
    }
  }, [type, id, navigate, deleteInvoice, deleteEstimate, deletePayment, deleteCredit, deleteExpense]);

  const { data: bankAccounts = [] } = useBankAccounts();
  const createBankTransaction = useCreateBankTransaction();
  const latestRate = useLatestExchangeRate();

  // Keep the quick-pay bank selection valid for the chosen currency — was previously
  // hardcoded to a specific seed account id that no longer exists once renamed/deleted.
  useEffect(() => {
    const valid = bankAccounts.some(b => b.id === paymentBankId && b.currency === paymentCurrency);
    if (!valid) {
      setPaymentBankId(bankAccounts.find(b => b.currency === paymentCurrency)?.id || '');
    }
  }, [paymentCurrency, bankAccounts, paymentBankId]);

  // Payments for this invoice from the API
  const linkedPayments = useMemo(() => {
    if (type !== 'invoices' || !id) return [];
    return allPayments.filter(p => p.invoiceId === id);
  }, [allPayments, type, id]);

  // Each payment already carries the SRD rate that was locked in when it was recorded —
  // use that instead of "today's" rate so historical totals don't drift.
  const paymentToSRD = (amount: number, currency: string, exchangeRate: number) =>
    currency === 'SRD' ? amount : amount * (exchangeRate || 1);

  const totalPaid = useMemo(() =>
    linkedPayments.reduce((s, p) => s + paymentToSRD(p.amount, p.currency, p.exchangeRate), 0),
  [linkedPayments]);

  // Derive document data from the appropriate hook
  const docData = useMemo(() => {
    switch (type) {
      case 'invoices':  return invoiceData ?? null;
      case 'estimates': return estimateData ?? null;
      case 'payments':  return singlePaymentData ?? null;
      case 'credits':   return creditData ?? null;
      case 'expenses':  return expenseData ?? null;
      case 'recurring': return {
        id: 'rec1',
        clientName: 'Build-It Ltd',
        date: '2024-03-01',
        totalAmount: 4500,
        status: 'Active',
        plan: 'Quarterly Teak Delivery',
        items: [{ description: 'Quarterly Teak Supply Retainer', quantity: 1, unitPrice: 4500, amount: 4500 }]
      };
      case 'reports': return {
        id: 'rep1',
        date: new Date().toLocaleDateString(),
        title: 'Financial Performance Report',
        items: [
          { description: 'Total Revenue', quantity: 1, unitPrice: 142850, amount: 142850 },
          { description: 'Total Expenses', quantity: 1, unitPrice: 8400, amount: 8400 },
          { description: 'Net Profit', quantity: 1, unitPrice: 134450, amount: 134450 }
        ],
        totalAmount: 134450
      };
      default: return null;
    }
  }, [type, invoiceData, estimateData, singlePaymentData, creditData, expenseData]);

  // Duplicate — pre-fill the create form with this document's data
  const handleDuplicate = useCallback(() => {
    const d = docData as any;
    if (!d) return;
    if (type === 'invoices') {
      navigate('/invoices/new', { state: { fromDuplicate: {
        clientId: d.clientId, currency: d.currency, items: d.items,
        notes: d.notes, taxRate: d.taxRate,
      }}});
    } else if (type === 'estimates') {
      navigate('/estimates/new', { state: { fromEstimate: {
        clientId: d.clientId, currency: d.currency, items: d.items,
        notes: d.notes, taxRate: d.taxRate,
      }}});
    }
  }, [type, docData, navigate]);

  const client = useMemo(() => {
    if (!docData) return null;
    const clientId = (docData as any).clientId;
    if (clientId) return allClients.find(c => c.id === clientId);
    // Fallback for types without explicit clientId in mock
    if (type === 'recurring') return allClients.find(c => c.company === 'Build-It Ltd');
    return null;
  }, [docData, type, allClients]);

  if (!docData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <Receipt size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Document not found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">
          Back
        </button>
      </div>
    );
  }

  const getDocTitle = () => {
    switch (type) {
      case 'invoices': return (docData as any).invoiceNumber;
      case 'estimates': return (docData as any).estimateNumber;
      case 'payments': return 'Payment Receipt';
      case 'credits': return 'Credit Note';
      case 'expenses': return 'Expense Receipt';
      case 'recurring': return 'Recurring Plan';
      case 'reports': return (docData as any).title;
      default: return 'Document';
    }
  };

  const getDocIcon = () => {
    switch (type) {
      case 'invoices': return Receipt;
      case 'estimates': return ClipboardList;
      case 'payments': return Wallet;
      case 'expenses': return Wallet;
      case 'recurring': return Clock;
      default: return CreditCard;
    }
  };

  const Icon = getDocIcon();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-all"
        >
          <ArrowLeft size={16} /> {t('back')}
        </button>
        <div className="flex items-center gap-1.5">
          {/* Icon-only utility buttons — blue tinted */}
          <button title="Print"    onClick={() => setShowPdfModal(true)} className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm active:scale-95"><Printer  size={15} /></button>
          <button title="Download" onClick={() => setShowPdfModal(true)} className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm active:scale-95"><Download size={15} /></button>
          {type === 'invoices' && (
            <button title="Delivery Note" onClick={() => setShowDeliveryNote(true)} className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm active:scale-95"><Truck size={15} /></button>
          )}
          {type !== 'reports' && (<>
            <button
              title="Edit"
              onClick={() => {
                const editRoutes: Record<string, string> = {
                  invoices: `/invoices/edit/${id}`,
                  estimates: `/estimates/edit/${id}`,
                  payments: `/payments/edit/${id}`,
                  credits: `/credits/edit/${id}`,
                  recurring: `/recurring/edit/${id}`,
                  expenses: `/expenses/edit/${id}`,
                };
                navigate(editRoutes[type] || '/');
              }}
              className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm active:scale-95"
            >
              <Pencil size={15} />
            </button>
            <button title="Duplicate" onClick={handleDuplicate} className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm active:scale-95"><Copy   size={15} /></button>
            <button title="Delete"    onClick={handleDelete}    className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 hover:bg-red-50  hover:text-red-500  hover:border-red-100  transition-all shadow-sm active:scale-95"><Trash2 size={15} /></button>
          </>)}
          {/* Contextual action buttons */}
          {type === 'invoices' && (
            <button
              onClick={() => {
                const invoiceTotal = (docData as any).totalAmount || (docData as any).total || 0;
                setPaymentAmount((invoiceTotal - totalPaid).toFixed(2));
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-95 ml-1"
            >
              <Banknote size={14} /> Add Payment
            </button>
          )}
          {type === 'estimates' && (
            <button
              onClick={() => {
                const est = docData as any;
                navigate('/invoices/new', { state: { fromEstimate: { id: est.id, estimateNumber: est.estimateNumber, clientId: est.clientId, date: est.date, status: 'Accepted', items: (est.items || []).map((i: any) => ({ ...i })), totalAmount: est.total || est.totalAmount } } });
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-95 ml-1"
            >
              <FileText size={14} /> Convert to Invoice
            </button>
          )}
        </div>
      </div>

      {/* Main Document Body — image 2 layout */}
      {(() => {
        const accentColor = localStorage.getItem('erp_doc_accent_color') || '#8B1D2A';
        const customTitles: Record<string, string> = (() => { try { return JSON.parse(localStorage.getItem('erp_doc_custom_titles') || '{}'); } catch { return {}; } })();
        const bankDetails     = localStorage.getItem('erp_bank_details') || '';
        const legalDisclaimer = localStorage.getItem('erp_legal_disclaimer') || '';
        const defaultTitles: Record<string, string> = { invoices: 'Invoice', estimates: 'Estimate', payments: 'Payment', credits: 'Credit Note', expenses: 'Expense', recurring: 'Recurring', reports: 'Report' };
        const typeToKey: Record<string, string> = { invoices: 'invoice', estimates: 'quote', payments: 'payment', credits: 'credit' };
        const docLabel = customTitles[typeToKey[type] ?? type] ?? defaultTitles[type] ?? 'Document';
        const d = docData as any;
        const invoiceTotal = d.totalAmount || d.total || 0;
        // Balance due is compared/displayed in SRD (totalPaid already is); normalize
        // the invoice's own total using the rate that was locked in when it was created.
        const invoiceTotalSRD = (d.currency || 'SRD') === 'SRD' ? invoiceTotal : invoiceTotal * (d.exchangeRate || 1);
        const balance = invoiceTotalSRD - totalPaid;
        const cur = d.currency || currencySymbol;
        const fmt = (n: number) => `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        // Use the actual stored subtotal/tax when available (per-line tax rates can vary),
        // falling back to a flat-21% approximation only for docs that don't carry them (credits).
        const displaySubtotal = d.subtotal != null ? d.subtotal : invoiceTotal / 1.21;
        const displayTax = d.taxAmount != null ? d.taxAmount : invoiceTotal - displaySubtotal;
        const fmtDate = (s: string) => { if (!s) return '—'; const p = s.split('-'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : s; };

        const tableItems = d.items || (type === 'expenses' ? [
          { description: d.description, quantity: 1, um: 'LOT', rate: d.amount, amount: d.amount }
        ] : []);

        return (
          <div className="max-w-[850px] mx-auto bg-white border border-slate-200 shadow-2xl overflow-hidden p-10 font-sans text-slate-900">

            {/* ── HEADER: company left | title right ── */}
            <div className="flex items-start justify-between gap-6 pb-6 mb-6 border-b border-slate-200">
              {/* LEFT: logo + company info */}
              <div className="flex items-start gap-4">
                {companyLogo ? (
                  <img src={companyLogo} className="h-12 w-auto object-contain" alt="Logo" />
                ) : null}
                <div>
                  <p className="font-black text-base text-slate-900 leading-tight">{companyName}</p>
                  {companyAddress && <p className="text-xs text-slate-500 mt-1 uppercase leading-relaxed">{companyAddress}</p>}
                  {companyPhone   && <p className="text-xs text-slate-500">{companyPhone}</p>}
                  {companyEmail   && <p className="text-xs text-slate-500">{companyEmail}</p>}
                  {companyBTW     && <p className="text-xs text-slate-400 mt-0.5">BTW: {companyBTW}</p>}
                  {companyKKF     && <p className="text-xs text-slate-400">KKF: {companyKKF}</p>}
                </div>
              </div>
              {/* RIGHT: title + doc meta */}
              <div className="text-right shrink-0">
                <p className="font-black italic leading-none" style={{ fontSize: '2.4rem', color: accentColor }}>{docLabel}</p>
                <p className="font-mono text-sm text-slate-600 mt-2">{getDocTitle()}</p>
                <p className="text-xs text-slate-500 mt-0.5">{fmtDate(d.date)}</p>
                {d.validUntil && <p className="text-xs text-slate-500 mt-0.5">GELDIG T/M {fmtDate(d.validUntil)}</p>}
                {type === 'invoices' && d.dueDate && <p className="text-xs text-slate-500 mt-0.5">VERVALDATUM {fmtDate(d.dueDate)}</p>}
              </div>
            </div>

            {/* ── CLIENT BLOCK (AAN) ── */}
            {(type === 'invoices' || type === 'estimates' || type === 'credits') && (
              <div className="mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Aan</p>
                {client ? (
                  <>
                    <p className="font-bold text-slate-900 text-sm">{client.name}</p>
                    {client.company && <p className="text-sm text-slate-600">{client.company}</p>}
                    {client.address && <p className="text-xs text-slate-500 mt-0.5 uppercase">{client.address}</p>}
                    {client.phone   && <p className="text-xs text-slate-500 mt-0.5">{client.phone}</p>}
                    {client.email   && <p className="text-xs text-slate-500">{client.email}</p>}
                    {(client as any).vatNumber && <p className="text-xs text-slate-400 mt-0.5">BTW: {(client as any).vatNumber}</p>}
                  </>
                ) : (
                  <p className="text-sm text-slate-400 italic">—</p>
                )}
              </div>
            )}

            {/* ── META ROW TABLE ── */}
            <table className="w-full border-collapse border border-slate-200 mb-6 text-xs">
              <thead>
                <tr>
                  {['Date', type === 'invoices' ? 'Invoice #' : 'Estimate #', 'Terms', 'Due Date', 'Rep', 'Project'].map(h => (
                    <th key={h} className="border border-slate-200 py-1.5 px-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 py-1.5 px-3 font-bold">{fmtDate(d.date)}</td>
                  <td className="border border-slate-200 py-1.5 px-3 font-bold">{getDocTitle()}</td>
                  <td className="border border-slate-200 py-1.5 px-3 font-bold">COD</td>
                  <td className="border border-slate-200 py-1.5 px-3 font-bold">{d.validUntil ? fmtDate(d.validUntil) : d.dueDate ? fmtDate(d.dueDate) : '—'}</td>
                  <td className="border border-slate-200 py-1.5 px-3 font-bold">{d.rep || '—'}</td>
                  <td className="border border-slate-200 py-1.5 px-3 font-bold">—</td>
                </tr>
              </tbody>
            </table>

            {/* ── ITEMS TABLE ── */}
            {tableItems.length > 0 && (
              <table className="w-full border-collapse text-xs mt-4 mb-6">
                <thead>
                  <tr>
                    <th className="text-left py-2.5 px-3 text-[9px] uppercase tracking-widest font-black text-white" style={{ backgroundColor: accentColor }}>Omschrijving</th>
                    <th className="text-center py-2.5 px-3 text-[9px] uppercase tracking-widest font-black text-white w-16" style={{ backgroundColor: accentColor }}>QTY</th>
                    <th className="text-center py-2.5 px-3 text-[9px] uppercase tracking-widest font-black text-white w-14" style={{ backgroundColor: accentColor }}>U/M</th>
                    <th className="text-right py-2.5 px-3 text-[9px] uppercase tracking-widest font-black text-white w-24" style={{ backgroundColor: accentColor }}>Prijs</th>
                    <th className="text-right py-2.5 px-3 text-[9px] uppercase tracking-widest font-black text-white w-24" style={{ backgroundColor: accentColor }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tableItems.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2.5 px-3 font-medium">{item.description}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{item.um || item.unit || 'PCS'}</td>
                      <td className="py-2.5 px-3 text-right">{(item.rate ?? item.unitPrice ?? item.price ?? 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-black">{(item.amount ?? (item.quantity * (item.unitPrice ?? item.rate ?? 0)) ?? 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── TOTALS ── */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="flex justify-between py-2 text-sm border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold">{fmt(displaySubtotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm border-b border-slate-100">
                  <span className="text-slate-500 font-medium">BTW</span>
                  <span className="font-bold">{fmt(displayTax)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2" style={{ borderColor: accentColor }}>
                  <span className="font-black text-base" style={{ color: accentColor }}>TOTAL ({cur})</span>
                  <span className="font-black text-base" style={{ color: accentColor }}>{fmt(invoiceTotal)}</span>
                </div>
                {totalPaid > 0 && (
                  <>
                    <div className="flex justify-between py-2 text-sm border-t border-slate-100">
                      <span className="text-emerald-600 font-medium">Paid</span>
                      <span className="font-bold text-emerald-600">− SRD {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-slate-900">
                      <span className={`font-black text-base ${balance <= 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {balance <= 0 ? '✓ PAID' : 'BALANCE'}
                      </span>
                      <span className={`font-black text-base ${balance <= 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {balance <= 0 ? '—' : `SRD ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── FOOTER ── */}
            {(bankDetails || legalDisclaimer) && (
              <div className="border-t border-slate-200 pt-5 mt-4 grid grid-cols-2 gap-6 text-[10px] text-slate-500">
                {bankDetails && (
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Details</p>
                    <p className="whitespace-pre-wrap leading-relaxed">{bankDetails}</p>
                  </div>
                )}
                {legalDisclaimer && (
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Terms & Conditions</p>
                    <p className="whitespace-pre-wrap leading-relaxed">{legalDisclaimer}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        );
      })()}
      {/* Payment history (below document body) */}
      {type === 'invoices' && linkedPayments.length > 0 && (
        <div className="max-w-[850px] mx-auto space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment History</h3>
          <div className="bg-white rounded-[20px] border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {linkedPayments.map(p => {
              const bank = bankAccounts.find(b => b.id === p.bankAccountId);
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Banknote size={14} className="text-emerald-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900">{bank?.bank || p.bankAccountId}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{p.date} · {p.method} · {p.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-700">{p.currency} {p.amount.toFixed(2)}</p>
                    {p.currency !== 'SRD' && p.exchangeRate && (
                      <p className="text-[10px] text-slate-400">= SRD {paymentToSRD(p.amount, p.currency, p.exchangeRate).toFixed(2)} @ {p.exchangeRate}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Forex difference block — only when invoice has non-SRD currency + exchange rate + payments */}
      {type === 'invoices' && linkedPayments.length > 0 && (() => {
        const inv = docData as any;
        const invCurrency: string = inv.currency || 'SRD';
        const invRate: number = inv.exchangeRate || 0;
        if (invCurrency === 'SRD' || !invRate) return null;
        const invoiceTotal: number = inv.totalAmount || inv.total || 0;
        // SRD value locked at invoice creation time
        const srdAtInvoice = invoiceTotal * invRate;
        // Actual SRD received through payments
        const srdReceived = totalPaid;
        const diff = srdReceived - srdAtInvoice;
        const isGain = diff >= 0;
        return (
          <div className="max-w-[850px] mx-auto">
            <div className={`rounded-[20px] border p-5 flex items-center gap-5 shadow-sm ${isGain ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isGain ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                {isGain
                  ? <TrendingUp size={18} className="text-emerald-600"/>
                  : <TrendingDown size={18} className="text-orange-600"/>}
              </div>
              <div className="flex-1 space-y-2">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isGain ? 'text-emerald-700' : 'text-orange-700'}`}>
                  Exchange Difference (FX) — informational
                </p>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold mb-0.5">Invoice ({invCurrency})</p>
                    <p className="font-black text-slate-900">{invCurrency} {invoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-slate-400 font-medium">@ {invRate.toFixed(2)} → SRD {srdAtInvoice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold mb-0.5">Paid (SRD)</p>
                    <p className="font-black text-slate-900">SRD {srdReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-slate-400 font-medium">{linkedPayments.length} payment{linkedPayments.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold mb-0.5">Difference</p>
                    <p className={`font-black text-lg ${isGain ? 'text-emerald-700' : 'text-orange-600'}`}>
                      {isGain ? '+' : ''}SRD {diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-slate-400 font-medium">{isGain ? 'Exchange gain' : 'Exchange loss'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Notes Quick-Edit Panel — outside print area */}
      {(type === 'invoices' || type === 'estimates' || type === 'credits') && (() => {
        const DEFAULT_TEMPLATES: NoteTemplate[] = [
          { name: 'Standard Payment', content: 'Thank you for your business. Please include Invoice # in payment reference.', iconName: 'MessageSquareText' },
          { name: 'Wood Quality',     content: 'This timber is graded according to FAS standards. Please store in a dry place.',  iconName: 'FileText' },
          { name: 'Delivery',         content: 'Our transport team will contact you 24 hours before arrival.',                    iconName: 'Wand2' },
        ];
        const templates = (() => { const s = storage.noteTemplates.get(); return s.length ? s : DEFAULT_TEMPLATES; })();
        return (
          <div className="max-w-[850px] mx-auto">
            <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center">
                    <MessageSquareText size={13} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Document Notes</span>
                </div>
                <button
                  onClick={() => setEditingNotes(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editingNotes ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  <Pencil size={10} /> {editingNotes ? 'Save' : 'Edit'}
                </button>
              </div>
              {/* Template Chips */}
              <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-100">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => setNotes(prev => prev ? `${prev}\n${tpl.content}` : tpl.content)}
                    title={tpl.content}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-accent-light hover:text-brand-primary rounded-lg text-[10px] font-bold text-slate-600 transition-all border border-transparent hover:border-brand-accent"
                  >
                    <FileText size={10} />
                    {tpl.name}
                  </button>
                ))}
                <span className="text-[9px] text-slate-300 font-medium self-center">Click a chip to append to notes</span>
              </div>
              {/* Notes body */}
              <div className="px-5 py-4">
                {editingNotes ? (
                  <textarea
                    aria-label="Document notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={10}
                    className="w-full text-xs font-medium leading-relaxed resize-none outline-none border border-blue-200 rounded-xl p-3 bg-blue-50/30 focus:bg-white transition-colors"
                    autoFocus
                  />
                ) : (
                  <pre className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{notes}</pre>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payment Modal */}
      {showPaymentModal && type === 'invoices' && (() => {
        // Normalize the invoice's own total to SRD (using the rate locked in when it
        // was created) so it can be compared against totalPaid, which is also in SRD.
        const invCurrency = (docData as any).currency || 'SRD';
        const invExchangeRate = (docData as any).exchangeRate || 1;
        const invoiceTotalRaw = (docData as any).totalAmount || (docData as any).total || 0;
        const invoiceTotal = invCurrency === 'SRD' ? invoiceTotalRaw : invoiceTotalRaw * invExchangeRate;
        const balance = invoiceTotal - totalPaid;

        const getRateSRD = (cur: string) => {
          if (!latestRate) return 1;
          if (cur === 'USD') return latestRate.usdSrd;
          if (cur === 'EUR') return latestRate.eurSrd;
          return 1;
        };

        const amtNum = parseFloat(paymentAmount) || 0;
        const amtSRD = paymentCurrency === 'SRD' ? amtNum : amtNum * getRateSRD(paymentCurrency);
        const filteredBanks = bankAccounts.filter(b => b.currency === paymentCurrency);

        const handleAddPayment = () => {
          if (amtSRD <= 0) return;
          const capped = Math.min(amtSRD, balance);
          const rate = getRateSRD(paymentCurrency);
          const payAmt = paymentCurrency === 'SRD' ? capped : capped / rate;
          const bankId = paymentBankId || filteredBanks[0]?.id;
          if (!bankId) { alert(`No ${paymentCurrency} bank/cash account exists yet — add one on the Finance page first.`); return; }
          const paymentRef = commitDocNumber('pay');
          const newTotalPaidSRD = totalPaid + capped;

          createPayment.mutate({
            clientId: (docData as any).clientId || '',
            invoiceId: id,
            amount: payAmt,
            currency: paymentCurrency,
            exchangeRate: rate,
            bankAccountId: bankId,
            date: paymentDate,
            method: paymentMethod,
            reference: paymentRef,
            notes: '',
          }, {
            onSuccess: () => {
              createBankTransaction.mutate({
                accountId: bankId,
                type: 'deposit',
                amount: payAmt,
                date: paymentDate,
                description: `Payment ${paymentRef}`,
                reference: paymentRef,
                toAccountId: '',
              }, { onError: alertMutationError });
              if (newTotalPaidSRD >= invoiceTotal && id) {
                updateInvoice.mutate({ id, status: 'Paid' }, { onError: alertMutationError });
              }
              setShowPaymentModal(false);
              setPaymentAmount('');
            },
            onError: alertMutationError,
          });
        };

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-[28px] p-8 shadow-2xl w-full max-w-md space-y-5 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Add Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-400 hover:text-slate-900"><X size={18}/></button>
              </div>

              {/* Quick fill */}
              <div className="flex gap-2">
                <button onClick={() => setPaymentAmount(balance.toFixed(2))}
                  className="flex-1 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-100">
                  Full — SRD {balance.toFixed(2)}
                </button>
                <button onClick={() => setPaymentAmount((balance / 2).toFixed(2))}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100">
                  50% — SRD {(balance / 2).toFixed(2)}
                </button>
              </div>

              {/* Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currency</label>
                  <select value={paymentCurrency} onChange={e => { setPaymentCurrency(e.target.value); const banks = bankAccounts.filter(b => b.currency === e.target.value); setPaymentBankId(banks[0]?.id || ''); }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                    {['SRD','USD','EUR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount ({paymentCurrency})</label>
                  <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="0.00" min="0"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black outline-none focus:border-emerald-400"
                    autoFocus/>
                </div>
              </div>
              {paymentCurrency !== 'SRD' && <p className="text-xs text-slate-500 font-bold -mt-2">≈ SRD {amtSRD.toFixed(2)}</p>}

              {/* Bank account */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Account</label>
                <select value={paymentBankId} onChange={e => setPaymentBankId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                  {filteredBanks.map(b => <option key={b.id} value={b.id}>{b.bank} ({b.currency})</option>)}
                  {!filteredBanks.length && <option>No {paymentCurrency} accounts</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                    {['Bank Transfer','Cash','Credit Card'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleAddPayment} disabled={amtSRD <= 0}
                className="w-full py-3 bg-brand-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-40">
                Confirm Payment
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Delivery Note Modal ── */}
      {showDeliveryNote && type === 'invoices' && (() => {
        const d = docData as any;
        return (
          <DeliveryNoteModal
            invoiceNumber={d.invoiceNumber ?? d.id ?? '—'}
            date={d.date ?? ''}
            clientName={client?.name ?? ''}
            clientCompany={client?.company}
            clientAddress={(client as any)?.address}
            items={(d.items ?? []).map((i: any) => ({
              description: i.description ?? '',
              qty: i.quantity ?? i.qty ?? 1,
              unit: i.um ?? i.unit ?? 'st',
              spec: i.spec || undefined,
            }))}
            onClose={() => setShowDeliveryNote(false)}
          />
        );
      })()}

      {/* ── DocPDF Modal (print / download) ── */}
      {showPdfModal && (type === 'invoices' || type === 'estimates' || type === 'credits') && (() => {
        const d = docData as any;
        const docType = type === 'invoices' ? 'invoice' : 'quote';
        const docNumber = d.invoiceNumber || d.estimateNumber || d.id || '—';
        // credits use d.amount; invoices/estimates use d.totalAmount or d.total
        const rawTotal  = type === 'credits' ? (d.amount || 0) : (d.totalAmount || d.total || 0);
        const subtotal  = d.subtotal != null ? d.subtotal : rawTotal / 1.21;
        const total     = rawTotal;
        const tax       = total - subtotal;
        const cur       = d.currency || 'SRD';
        // credits have no items array — synthesize one row from reason + amount
        const pdfItems  = type === 'credits'
          ? [{ id: '1', description: d.reason || 'Credit', houtsoort: '', spec: '', qty: 1, unit: 'PCS', price: d.amount || 0 }]
          : (d.items || []).map((i: any) => {
              const specParts = (i.spec || '').split('x').map(Number);
              const mmW = specParts[0] > 0 ? specParts[0] : undefined;
              const mmH = specParts[1] > 0 ? specParts[1] : undefined;
              return {
                id: i.id || String(Math.random()),
                description: i.description || '',
                houtsoort: i.houtsoort || i.wood || '',
                spec: i.spec || '',
                qty: i.quantity || i.qty || 1,
                unit: i.um || i.unit || 'PCS',
                price: i.rate || i.unitPrice || i.price || 0,
                taxRate: i.taxRate ?? 10,
                mmW,
                mmH,
                priceByArea: i.priceByArea === true,
              };
            });
        return (
          <DocPDFModal
            docType={docType}
            docNumber={docNumber}
            date={d.date || ''}
            validUntil={d.validUntil || d.dueDate}
            clientName={client?.name || ''}
            clientCompany={client?.company}
            clientAddress={(client as any)?.address}
            clientPhone={client?.phone}
            clientEmail={client?.email}
            clientVAT={(client as any)?.vatNumber}
            rep={d.rep}
            paidAmount={totalPaid > 0 ? totalPaid : undefined}
            currency={cur}
            currencySymbol={currencySymbol}
            items={pdfItems}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onClose={() => setShowPdfModal(false)}
          />
        );
      })()}
    </div>
  );
};

export default DocumentDetailPage;
