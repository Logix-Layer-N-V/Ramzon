import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ArrowLeft, Save, Check, Wallet, Users, Calendar, FileText, CreditCard, Landmark, TrendingUp, Building2, Banknote } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { mockClients, mockInvoices } from '../lib/mock-data';
import { LanguageContext } from '../lib/context';
import { storage, getLatestExchangeRate, toSRD, getInvoicePaidTotal } from '../lib/storage';
import { commitDocNumber } from '../lib/docNumbering';
import type { Payment, BankAccount, ExchangeRate } from '../types';

const BANK_ACCOUNTS_DEFAULT: BankAccount[] = [
  { id: 'dsb_srd', bank: 'DSB Bank', currency: 'SRD', iban: 'SR29DSB0000001234', balance: 45230 },
  { id: 'dsb_usd', bank: 'DSB Bank', currency: 'USD', iban: 'SR29DSB0000001235', balance: 12800 },
  { id: 'dsb_eur', bank: 'DSB Bank', currency: 'EUR', iban: 'SR29DSB0000001236', balance: 9500 },
  { id: 'hkb_srd', bank: 'HKB Hakrinbank', currency: 'SRD', iban: 'SR29HKB0000005678', balance: 31200 },
  { id: 'hkb_usd', bank: 'HKB Hakrinbank', currency: 'USD', iban: 'SR29HKB0000005679', balance: 7400 },
  { id: 'hkb_eur', bank: 'HKB Hakrinbank', currency: 'EUR', iban: 'SR29HKB0000005680', balance: 4100 },
  { id: 'cash_srd', bank: 'Petty Cash', currency: 'SRD', iban: '—', balance: 1500 },
  { id: 'cash_usd', bank: 'Petty Cash', currency: 'USD', iban: '—', balance: 300 },
  { id: 'cash_eur', bank: 'Petty Cash', currency: 'EUR', iban: '—', balance: 150 },
];

const EXCHANGE_RATES_DEFAULT: ExchangeRate[] = [
  { id: 'r1', date: '2026-03-05', usdSrd: 36.50, eurSrd: 39.80, eurUsd: 1.09 },
];

const LABEL = 'text-[10px] font-black text-slate-400 uppercase tracking-widest';
const INPUT = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-slate-400';

const CreatePaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { defaultCurrency, enableCrypto } = useContext(LanguageContext);
  const { id: editId } = useParams();
  const location = useLocation();
  const isEdit = !!editId;

  // State passed from "Record Payment" button on Edit Invoice page
  const fromInvoiceState = (location.state as { fromInvoice?: { invoiceId: string; clientId: string; total: number } } | null)?.fromInvoice;

  // Load bank accounts and exchange rates from storage (or defaults)
  const bankAccounts = useMemo(() => {
    const saved = storage.bankAccounts.get();
    if (saved.length === 0) { storage.bankAccounts.save(BANK_ACCOUNTS_DEFAULT); return BANK_ACCOUNTS_DEFAULT; }
    return saved;
  }, []);

  const exchangeRates = useMemo(() => {
    const saved = storage.exchangeRates.get();
    if (saved.length === 0) { storage.exchangeRates.save(EXCHANGE_RATES_DEFAULT); return EXCHANGE_RATES_DEFAULT; }
    return saved;
  }, []);

  const latestRate: ExchangeRate | null = useMemo(() => {
    if (!exchangeRates.length) return null;
    return exchangeRates.sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [exchangeRates]);

  // Form state
  const [clientId, setClientId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'SRD');
  const [bankAccountId, setBankAccountId] = useState('');
  const [rateOverride, setRateOverride] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [methodType, setMethodType] = useState<'bank' | 'cash'>('bank'); // Bank or Cash
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  // Derived: filter accounts by methodType (bank = DSB/HKB, cash = Petty Cash) + currency
  const filteredBanks = bankAccounts.filter(b =>
    b.currency === currency &&
    (methodType === 'bank' ? b.bank !== 'Petty Cash' : b.bank === 'Petty Cash')
  );
  const clientInvoices = useMemo(() => mockInvoices.filter(inv => inv.clientId === clientId && inv.status !== 'Paid'), [clientId]);

  const getRate = (cur: string): number => {
    const r = latestRate;
    if (!r) return 1;
    switch (cur) {
      case 'USD': return r.usdSrd;
      case 'EUR': return r.eurSrd;
      case 'USDT': return r.usdSrd;
      default: return 1;
    }
  };

  const activeRate = rateOverride !== null ? rateOverride : getRate(currency);
  const amountSRD = currency === 'SRD' ? parseFloat(amount || '0') : parseFloat(amount || '0') * activeRate;

  const selectedInvoice = useMemo(() => clientInvoices.find(i => i.id === invoiceId), [clientInvoices, invoiceId]);
  const invoiceBalance = useMemo(() => {
    if (!selectedInvoice) return 0;
    const paid = getInvoicePaidTotal(selectedInvoice.id);
    return selectedInvoice.totalAmount - paid;
  }, [selectedInvoice]);

  // Auto-select first bank account when currency or methodType changes
  useEffect(() => {
    const banks = bankAccounts.filter(b =>
      b.currency === currency &&
      (methodType === 'bank' ? b.bank !== 'Petty Cash' : b.bank === 'Petty Cash')
    );
    if (banks.length > 0) setBankAccountId(banks[0].id);
    else setBankAccountId('');
    setRateOverride(null);
  }, [currency, methodType, bankAccounts]);

  // Pre-fill amount from invoice balance
  useEffect(() => {
    if (selectedInvoice && invoiceBalance > 0) {
      const inDocCurrency = currency === 'SRD' ? invoiceBalance : invoiceBalance / activeRate;
      setAmount(inDocCurrency.toFixed(2));
    }
  }, [invoiceId]);

  // Pre-fill from "Record Payment" on invoice edit page
  useEffect(() => {
    if (!editId && fromInvoiceState) {
      setClientId(fromInvoiceState.clientId);
      setInvoiceId(fromInvoiceState.invoiceId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load existing payment for edit
  useEffect(() => {
    if (editId) {
      const existing = storage.payments.get().find(p => p.id === editId);
      if (existing) {
        setClientId(existing.clientId);
        setInvoiceId(existing.invoiceId || '');
        setAmount(existing.amount.toString());
        setCurrency(existing.currency);
        setBankAccountId(existing.bankAccountId);
        setDate(existing.date);
        setMethodType(existing.method === 'Cash' ? 'cash' : 'bank');
        setReference(existing.reference || '');
        setNotes(existing.notes || '');
        if (existing.exchangeRate) setRateOverride(existing.exchangeRate);
      }
    }
  }, [editId]);

  const handleSave = () => {
    const amt = parseFloat(amount || '0');
    if (!amt || !clientId) return;

    const paymentId = editId || `pay_${Date.now()}`;
    const paymentNumber = isEdit ? reference : commitDocNumber('pay');

    const payment: Payment = {
      id: paymentId,
      clientId,
      invoiceId: invoiceId || undefined,
      amount: amt,
      currency,
      exchangeRate: activeRate,
      bankAccountId: bankAccountId || 'cash_srd',
      date,
      method: methodType === 'cash' ? 'Cash' : 'Bank Transfer',
      reference: reference || paymentNumber,
      notes,
      status: 'Completed',
    };

    // Persist payment
    const payments = storage.payments.get();
    if (isEdit) {
      const idx = payments.findIndex(p => p.id === paymentId);
      if (idx >= 0) payments[idx] = payment; else payments.push(payment);
    } else {
      payments.push(payment);
    }
    storage.payments.save(payments);

    // Update bank account balance
    const accounts = storage.bankAccounts.get();
    if (!accounts.length) storage.bankAccounts.save(BANK_ACCOUNTS_DEFAULT);
    const accts = accounts.length ? accounts : [...BANK_ACCOUNTS_DEFAULT];
    const acctIdx = accts.findIndex(a => a.id === bankAccountId);
    if (acctIdx >= 0) { accts[acctIdx] = { ...accts[acctIdx], balance: accts[acctIdx].balance + amt }; }
    storage.bankAccounts.save(accts);

    // Update invoice status if fully paid
    if (invoiceId) {
      const invoices = storage.invoices.get();
      const savedInv = invoices.find(i => i.id === invoiceId);
      if (savedInv) {
        const totalPaid = getInvoicePaidTotal(invoiceId);
        if (totalPaid >= savedInv.totalAmount) {
          const idx = invoices.findIndex(i => i.id === invoiceId);
          invoices[idx] = { ...savedInv, status: 'Paid' };
          storage.invoices.save(invoices);
        }
      }
    }

    setSaved(true);
    setTimeout(() => navigate('/payments'), 1200);
  };

  const rateLabel = latestRate ? `Rate: 1 ${currency} = ${activeRate.toFixed(2)} SRD (${latestRate.date})` : '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/payments')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16}/> Back to Payments
        </button>
      </div>

      {/* Banner: pre-filled from invoice */}
      {fromInvoiceState && !editId && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Banknote size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-black text-blue-800 uppercase tracking-widest">Payment for Invoice</p>
            <p className="text-[11px] text-blue-600 font-medium mt-0.5">Client and invoice have been pre-selected. Enter the amount and confirm.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Wallet size={22}/></div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{isEdit ? 'Edit Payment' : 'Register Payment'}</h2>
              <p className="text-xs text-slate-400 font-medium">Record a received payment with bank & currency</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Client */}
            <div className="space-y-1.5 lg:col-span-3">
              <label className={`${LABEL} flex items-center gap-2`}><Users size={10}/> Client</label>
              <select value={clientId} onChange={e => { setClientId(e.target.value); setInvoiceId(''); }} className={INPUT}>
                <option value="">-- Select client --</option>
                {mockClients.map(c => <option key={c.id} value={c.id}>{c.company} ({c.name})</option>)}
              </select>
            </div>

            {/* Invoice link */}
            <div className="space-y-1.5 lg:col-span-2">
              <label className={`${LABEL} flex items-center gap-2`}><FileText size={10}/> Link to Invoice (optional)</label>
              <select value={invoiceId} onChange={e => setInvoiceId(e.target.value)} className={INPUT}>
                <option value="">-- No specific invoice --</option>
                {clientInvoices.map(inv => {
                  const bal = inv.totalAmount - getInvoicePaidTotal(inv.id);
                  return <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — Balance: SRD {bal.toFixed(2)}</option>;
                })}
              </select>
              {selectedInvoice && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl">
                  <span className="text-xs font-bold text-amber-700">Balance due: SRD {invoiceBalance.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className={`${LABEL} flex items-center gap-2`}><Calendar size={10}/> Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT}/>
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className={`${LABEL} flex items-center gap-2`}><TrendingUp size={10}/> Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={INPUT}>
                {['SRD', 'USD', 'EUR', ...(enableCrypto ? ['USDT'] : [])].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className={LABEL}>Amount ({currency})</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={INPUT}/>
              {currency !== 'SRD' && (
                <p className="text-xs text-slate-500 font-bold">≈ SRD {amountSRD.toFixed(2)}</p>
              )}
            </div>

            {/* Exchange rate */}
            {currency !== 'SRD' && (
              <div className="space-y-1.5">
                <label className={LABEL}>Rate to SRD</label>
                <input type="number" step="0.01"
                  value={rateOverride !== null ? rateOverride : getRate(currency)}
                  onChange={e => setRateOverride(parseFloat(e.target.value))}
                  className={INPUT}/>
                {latestRate && <p className="text-[10px] text-slate-400 font-medium">{rateLabel}</p>}
                {rateOverride !== null && (
                  <button onClick={() => setRateOverride(null)} className="text-[10px] text-slate-400 hover:text-slate-700 font-bold">↺ Use latest rate</button>
                )}
              </div>
            )}

            {/* Payment Method: Bank or Cash toggle */}
            <div className="space-y-1.5 lg:col-span-3">
              <label className={`${LABEL} flex items-center gap-2`}><CreditCard size={10}/> Ontvangen via</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethodType('bank')}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-black text-sm transition-all ${
                    methodType === 'bank'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Building2 size={18}/> Bank
                </button>
                <button
                  type="button"
                  onClick={() => setMethodType('cash')}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-black text-sm transition-all ${
                    methodType === 'cash'
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Banknote size={18}/> Kas (Cash)
                </button>
              </div>
            </div>

            {/* Bank Account */}
            <div className="space-y-1.5 lg:col-span-3">
              <label className={`${LABEL} flex items-center gap-2`}><Landmark size={10}/> {methodType === 'cash' ? 'Kas Rekening' : 'Bank Rekening'} ({currency})</label>
              <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} className={INPUT}>
                {filteredBanks.length === 0 && <option value="">Geen {currency} {methodType === 'cash' ? 'kas' : 'bank'} rekeningen</option>}
                {filteredBanks.map(b => (
                  <option key={b.id} value={b.id}>{b.bank} — {b.currency} {b.balance.toLocaleString()} ({b.iban !== '—' ? b.iban : 'Kas'})</option>
                ))}
              </select>
            </div>

            {/* Reference */}
            <div className="space-y-1.5 lg:col-span-2">
              <label className={LABEL}>Reference / Transaction ID</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)}
                placeholder="e.g. bank transfer ref, cheque #..."
                className={INPUT}/>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 lg:col-span-3">
              <label className={LABEL}>Internal Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Optional internal notes..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none resize-none"/>
            </div>
          </div>
        </div>

        {/* Bottom summary bar */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl">
          <div className="flex flex-wrap items-center gap-6 justify-between">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Client</p>
                <p className="text-lg font-black">{mockClients.find(c => c.id === clientId)?.company || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">{methodType === 'cash' ? 'Kas' : 'Bank'}</p>
                <p className="text-lg font-black">{bankAccounts.find(b => b.id === bankAccountId)?.bank || (methodType === 'cash' ? 'Cash' : 'Bank')}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-1">Amount</p>
                <p className="text-3xl font-black text-emerald-400">
                  {currency} {parseFloat(amount || '0').toFixed(2)}
                  {currency !== 'SRD' && <span className="text-sm text-white/40 ml-2">= SRD {amountSRD.toFixed(2)}</span>}
                </p>
              </div>
            </div>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all active:scale-95">
              {saved ? <Check size={14}/> : <Save size={14}/>}
              {saved ? 'Saved...' : isEdit ? 'Save Payment' : 'Register Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePaymentPage;
