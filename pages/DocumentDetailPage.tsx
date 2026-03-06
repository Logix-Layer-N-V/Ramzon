
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
} from 'lucide-react';
import { LanguageContext } from '../lib/context';
import { mockInvoices, mockEstimates, mockPayments, mockCredits, mockClients, mockExpenses } from '../lib/mock-data';
import { storage, getLatestExchangeRate, toSRD, NoteTemplate } from '../lib/storage';
import { commitDocNumber } from '../lib/docNumbering';
import type { Payment, BankAccount } from '../types';

const BANK_ACCOUNTS_DEFAULT: BankAccount[] = [
  { id: 'dsb_srd', bank: 'DSB Bank', currency: 'SRD', iban: 'SR29DSB0000001234', balance: 45230 },
  { id: 'dsb_usd', bank: 'DSB Bank', currency: 'USD', iban: 'SR29DSB0000001235', balance: 12800 },
  { id: 'hkb_srd', bank: 'HKB Hakrinbank', currency: 'SRD', iban: 'SR29HKB0000005678', balance: 31200 },
  { id: 'cash_srd', bank: 'Petty Cash', currency: 'SRD', iban: '—', balance: 1500 },
];

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
  const { t, companyName, companyLogo, companyAddress, companyEmail, companyPhone, companyWebsite, companyBTW, companyKKF, currencySymbol, enableCrypto } = useContext(LanguageContext);
  const [notes, setNotes] = useState<string>(() =>
    localStorage.getItem(`notes_${type}_${id}`) ?? DEFAULT_NOTES
  );
  const [editingNotes, setEditingNotes] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('SRD');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentBankId, setPaymentBankId] = useState('dsb_srd');
  const [paymentRefresh, setPaymentRefresh] = useState(0); // trigger re-render

  // Persist notes per document
  useEffect(() => {
    if (id) localStorage.setItem(`notes_${type}_${id}`, notes);
  }, [notes, type, id]);

  // Delete this document from storage and navigate back
  const handleDelete = useCallback(() => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    switch (type) {
      case 'invoices':  storage.invoices.save(storage.invoices.get().filter(i => i.id !== id)); break;
      case 'estimates': storage.estimates.save(storage.estimates.get().filter(e => e.id !== id)); break;
      case 'payments':  storage.payments.save(storage.payments.get().filter(p => p.id !== id)); break;
      case 'credits':   storage.credits.save(storage.credits.get().filter(c => c.id !== id)); break;
      case 'expenses':  storage.expenses.save(storage.expenses.get().filter(e => e.id !== id)); break;
    }
    navigate(-1);
  }, [type, id, navigate]);

  const bankAccounts: BankAccount[] = useMemo(() => {
    const saved = storage.bankAccounts.get();
    return saved.length ? saved : BANK_ACCOUNTS_DEFAULT;
  }, [paymentRefresh]);

  // Load persisted payments for this invoice
  const linkedPayments = useMemo(() => {
    if (type !== 'invoices' || !id) return [];
    return storage.payments.get().filter(p => p.invoiceId === id && p.status !== 'Refunded');
  }, [type, id, paymentRefresh]);

  const totalPaid = useMemo(() =>
    linkedPayments.reduce((s, p) => s + toSRD(p.amount, p.currency), 0),
  [linkedPayments]);

  // Fetch standard data based on type
  const docData = useMemo(() => {
    switch (type) {
      case 'invoices': return mockInvoices.find(i => i.id === id);
      case 'estimates': return mockEstimates.find(e => e.id === id);
      case 'payments': return mockPayments.find(p => p.id === id);
      case 'credits': return mockCredits.find(c => c.id === id);
      case 'expenses': return mockExpenses.find(e => e.id === id);
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
  }, [type, id]);

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
    if (clientId) return mockClients.find(c => c.id === clientId);
    // Fallback for types without explicit clientId in mock
    if (type === 'recurring') return mockClients.find(c => c.company === 'Build-It Ltd');
    return null;
  }, [docData, type]);

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
          <button title="Print"    onClick={() => window.print()}    className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm active:scale-95"><Printer  size={15} /></button>
          <button title="Download"                                   className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm active:scale-95"><Download size={15} /></button>
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
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all active:scale-95 ml-1"
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
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all active:scale-95 ml-1"
            >
              <FileText size={14} /> Convert to Invoice
            </button>
          )}
        </div>
      </div>

      {/* Main Document Body */}
      <div className="max-w-[850px] mx-auto bg-white border border-slate-900 shadow-2xl overflow-hidden p-8 space-y-6 font-sans text-slate-900">
        
        {/* Branding Header */}
        <div className="flex justify-between items-start">
          <div className="w-1/3">
            <div className="w-48 h-24 flex items-center justify-center overflow-hidden">
              {companyLogo ? (
                <img src={companyLogo} className="w-full h-full object-contain" alt="Ramzon Logo" />
              ) : (
                <div className="text-2xl font-black text-brand-primary italic">RAMZON N.V.</div>
              )}
            </div>
            <div className="mt-2 space-y-0.5 text-[9px] font-bold text-slate-900 uppercase">
              <p className="flex items-center gap-1"><span className="text-brand-primary">📍</span> {companyAddress}</p>
              <p className="flex items-center gap-1"><span className="text-brand-primary">📞</span> {companyPhone}</p>
              <p className="flex items-center gap-1"><span className="text-brand-primary">✉️</span> {companyEmail}</p>
            </div>
          </div>
          
          <div className="flex-1 text-center pt-4">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic font-serif">
              {type === 'invoices' ? 'Invoice' : 
               type === 'estimates' ? 'Estimate' : 
               type === 'payments' ? 'Payment' : 
               type === 'credits' ? 'Credit' : 
               type === 'expenses' ? 'Expense' : 
               type === 'recurring' ? 'Recurring' : 'Report'}
            </h1>
          </div>

          <div className="w-1/3">
            <div className="bg-slate-100 border border-slate-300 p-4 min-h-[120px] rounded-sm">
              <h3 className="text-xs font-black text-center mb-4 uppercase tracking-wider">
                {type === 'expenses' ? 'Vendor Information' : 
                 type === 'reports' ? 'Report Parameters' : 'Customer Information'}
              </h3>
              <div className="text-center space-y-1">
                {type === 'reports' ? (
                  <>
                    <p className="text-sm font-bold">Full Financial Audit</p>
                    <p className="text-xs text-slate-600">Period: Q1 2024</p>
                  </>
                ) : type === 'expenses' ? (
                  <>
                    <p className="text-sm font-bold">{(docData as any).category || 'General Vendor'}</p>
                    <p className="text-xs text-slate-600">{(docData as any).description}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold">{client?.name || client?.company || 'Client'}</p>
                    {client?.company && client?.name && (
                      <p className="text-xs text-slate-500 font-medium">{client.company}</p>
                    )}
                    <p className="text-xs text-slate-600">{client?.phone || ''}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="border-y border-slate-900 grid grid-cols-6 divide-x divide-slate-900 text-center">
          <div className="py-1">
            <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Date</p>
            <p className="text-xs font-bold">{(docData as any).date || '01-Sept-2021'}</p>
          </div>
          <div className="py-1">
            <p className="text-[10px] font-bold border-b border-slate-200 mb-1">{type.slice(0, -1).toUpperCase()} #</p>
            <p className="text-xs font-bold">{getDocTitle() || '166'}</p>
          </div>
          <div className="py-1">
            <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Terms</p>
            <p className="text-xs font-bold">COD</p>
          </div>
          <div className="py-1 bg-slate-100">
            <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Due Date</p>
            <p className="text-xs font-bold">{(docData as any).dueDate || (docData as any).date}</p>
          </div>
          <div className="py-1">
            <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Rep</p>
            <p className="text-xs font-bold">SS</p>
          </div>
          <div className="py-1">
            <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Project</p>
            <p className="text-xs font-bold">-</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-slate-900 min-h-[500px] flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-900">
              <tr className="divide-x divide-slate-900 text-[11px] font-black uppercase">
                <th className="py-1 px-2 w-[40%]">Description</th>
                <th className="py-1 px-2 text-center w-[12%]">Measurem...</th>
                <th className="py-1 px-2 text-center w-[8%]">Qu...</th>
                <th className="py-1 px-2 text-center w-[8%]">U/M</th>
                <th className="py-1 px-2 text-center w-[12%]">Wood</th>
                <th className="py-1 px-2 text-right w-[10%]">Rate</th>
                <th className="py-1 px-2 text-right w-[10%]">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent">
              {((docData as any).items || (type === 'expenses' ? [
                { description: (docData as any).description, measurement: '', quantity: 1, um: 'LOT', wood: '', rate: (docData as any).amount, amount: (docData as any).amount }
              ] : type === 'reports' ? [
                { description: 'Total Revenue', measurement: '', quantity: 1, um: 'EUR', wood: '', rate: 142850, amount: 142850 },
                { description: 'Total Expenses', measurement: '', quantity: 1, um: 'EUR', wood: '', rate: 8400, amount: 8400 }
              ] : [
                { description: 'Wood drying', measurement: '', quantity: 3.75, um: 'CBM', wood: 'KOP-Kopi', rate: 80.00, amount: 300.00 },
                { description: 'Floorboard re-planing and profiling', measurement: '', quantity: 135, um: 'M²', wood: '', rate: 8.00, amount: 1080.00 }
              ])).map((item: any, idx: number) => (
                <tr key={idx} className="divide-x divide-slate-900 text-xs font-medium">
                  <td className="py-2 px-2">{item.description}</td>
                  <td className="py-2 px-2 text-center">{item.measurement || ''}</td>
                  <td className="py-2 px-2 text-center">{item.quantity}</td>
                  <td className="py-2 px-2 text-center">{item.um || 'PCS'}</td>
                  <td className="py-2 px-2 text-center">{item.wood || ''}</td>
                  <td className="py-2 px-2 text-right">{item.rate?.toFixed(2) || item.unitPrice?.toFixed(2)}</td>
                  <td className="py-2 px-2 text-right">{(item.amount || (item.quantity * item.unitPrice))?.toFixed(2)}</td>
                </tr>
              ))}
              {/* Vertical lines filler */}
              <tr className="flex-1 divide-x divide-slate-900 h-[400px]">
                <td className="border-none"></td>
                <td className="border-none"></td>
                <td className="border-none"></td>
                <td className="border-none"></td>
                <td className="border-none"></td>
                <td className="border-none"></td>
                <td className="border-none"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BTW Line */}
        <div className="border border-slate-900 grid grid-cols-12 divide-x divide-slate-900">
          <div className="col-span-10 py-1 px-4 text-xs font-black text-center uppercase tracking-wider">
            BTW tnv RAMZON NV # {companyBTW || '2000012965'} (10.0%)
          </div>
          <div className="col-span-2 py-1 px-2 text-right text-xs font-bold">
            USD 0.00
          </div>
        </div>

        {/* Footer Section */}
        <div className="grid grid-cols-12 border border-slate-900 divide-x divide-slate-900">
          {/* Notes - Editable */}
          <div className="col-span-9 p-3 relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Notes</span>
              <button
                onClick={() => setEditingNotes(!editingNotes)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-100 hover:bg-red-100"
              >
                <Pencil size={9} /> {editingNotes ? t('save') : t('edit')}
              </button>
            </div>
            {editingNotes ? (
              <textarea
                aria-label="Document notes"
                title="Document notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-[9px] font-bold leading-tight resize-none outline-none border border-blue-200 rounded p-1 bg-blue-50/30 focus:bg-white transition-colors"
                rows={14}
                autoFocus
              />
            ) : (
              <div className="text-[9px] font-bold leading-tight whitespace-pre-line text-slate-900">
                {notes}
              </div>
            )}
          </div>
          
          {/* Totals */}
          <div className="col-span-3 flex flex-col divide-y divide-slate-900">
            {(() => {
              const invoiceTotal = (docData as any).totalAmount || (docData as any).total || 0;
              const balance = invoiceTotal - totalPaid;
              const cur = (docData as any).currency || currencySymbol;
              return (<>
                <div className="flex-1 p-3 flex justify-between items-center">
                  <span className="text-xs font-black uppercase">Total</span>
                  <span className="text-xs font-bold">{cur} {invoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex-1 p-3 flex justify-between items-center">
                  <span className="text-xs font-black uppercase">Payments</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {totalPaid > 0 ? `-SRD ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'SRD 0.00'}
                  </span>
                </div>
                <div className={`flex-1 p-3 flex justify-between items-center ${balance <= 0 ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  <span className="text-xs font-black uppercase">Balance</span>
                  <span className={`text-xs font-bold ${balance <= 0 ? 'text-emerald-700' : ''}`}>
                    {balance <= 0 ? '✓ PAID' : `SRD ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              </>);
            })()}
          </div>
        </div>
      </div>
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
                      <p className="text-[10px] text-slate-400">= SRD {toSRD(p.amount, p.currency).toFixed(2)} @ {p.exchangeRate}</p>
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
        const invoiceTotal = (docData as any).totalAmount || (docData as any).total || 0;
        const balance = invoiceTotal - totalPaid;
        const latestRate = getLatestExchangeRate();

        const getRateSRD = (cur: string) => {
          if (!latestRate) return 1;
          if (cur === 'USD' || cur === 'USDT') return latestRate.usdSrd;
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

          const p: Payment = {
            id: `pay_${Date.now()}`,
            clientId: (docData as any).clientId || '',
            invoiceId: id,
            amount: paymentCurrency === 'SRD' ? capped : capped / rate,
            currency: paymentCurrency,
            exchangeRate: paymentCurrency !== 'SRD' ? rate : undefined,
            bankAccountId: paymentBankId || (filteredBanks[0]?.id || 'cash_srd'),
            date: paymentDate,
            method: paymentMethod,
            reference: commitDocNumber('pay'),
            status: 'Completed',
          };

          const payments = storage.payments.get();
          storage.payments.save([...payments, p]);

          // Update bank balance
          const accts = storage.bankAccounts.get().length ? storage.bankAccounts.get() : BANK_ACCOUNTS_DEFAULT;
          const ai = accts.findIndex(a => a.id === p.bankAccountId);
          if (ai >= 0) { accts[ai] = { ...accts[ai], balance: accts[ai].balance + p.amount }; storage.bankAccounts.save(accts); }

          setShowPaymentModal(false);
          setPaymentAmount('');
          setPaymentRefresh(n => n + 1);
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
                    {['SRD','USD','EUR',...(enableCrypto?['USDT']:[])].map(c => <option key={c}>{c}</option>)}
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
                    {['Bank Transfer','Cash','Credit Card','USDT'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleAddPayment} disabled={amtSRD <= 0}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-40">
                Confirm Payment
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DocumentDetailPage;
