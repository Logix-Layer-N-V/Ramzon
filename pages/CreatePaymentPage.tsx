import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ArrowLeft, Save, Check, Wallet, Users, Calendar, FileText, CreditCard, Landmark, TrendingUp, Building2, Banknote, UserPlus } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { LanguageContext } from '../lib/context';
import { getLatestExchangeRate, storage } from '../lib/storage';
import { commitDocNumber } from '../lib/docNumbering';
import type { BankAccount, ExchangeRate } from '../types';
import { useClients } from '../lib/hooks/useClients';
import { useInvoices, useUpdateInvoice } from '../lib/hooks/useInvoices';
import { usePayment, useCreatePayment, useUpdatePayment } from '../lib/hooks/usePayments';
import QuickAddClientModal from '../components/QuickAddClientModal';

const BANK_ACCOUNTS_DEFAULT: BankAccount[] = [
  { id: 'dsb_srd', bank: 'DSB Bank', currency: 'SRD', iban: 'SR29DSB0000001234', balance: 45230 },
  { id: 'dsb_usd', bank: 'DSB Bank', currency: 'USD', iban: 'SR29DSB0000001235', balance: 12800 },
  { id: 'dsb_eur', bank: 'DSB Bank', currency: 'EUR', iban: 'SR29DSB0000001236', balance: 9500 },
  { id: 'hkb_srd', bank: 'HKB Hakrinbank', currency: 'SRD', iban: 'SR29HKB0000005678', balance: 31200 },
  { id: 'hkb_usd', bank: 'HKB Hakrinbank', currency: 'USD', iban: 'SR29HKB0000005679', balance: 7400 },
  { id: 'hkb_eur', bank: 'HKB Hakrinbank', currency: 'EUR', iban: 'SR29HKB0000005680', balance: 4100 },
  { id: 'cash_srd', bank: 'Cash', currency: 'SRD', iban: '—', balance: 1500 },
  { id: 'cash_usd', bank: 'Cash', currency: 'USD', iban: '—', balance: 300 },
  { id: 'cash_eur', bank: 'Cash', currency: 'EUR', iban: '—', balance: 150 },
];

const EXCHANGE_RATES_DEFAULT: ExchangeRate[] = [
  { id: 'r1', date: '2026-03-05', usdSrd: 36.50, eurSrd: 39.80, eurUsd: 1.09 },
];

const LABEL = 'text-[10px] font-black text-slate-400 uppercase tracking-widest';
const INPUT = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-slate-400';

const CreatePaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { defaultCurrency } = useContext(LanguageContext);
  const { id: editId } = useParams();
  const location = useLocation();
  const isEdit = !!editId;

  const fromInvoiceState = (location.state as { fromInvoice?: { invoiceId: string; clientId: string; total: number } } | null)?.fromInvoice;

  const { data: allClients = [] } = useClients();
  const { data: allInvoices = [] } = useInvoices();
  const { data: existingPayment } = usePayment(editId || '');
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const updateInvoice = useUpdateInvoice();

  const bankAccounts = useMemo(() => {
    const saved = storage.bankAccounts.get();
    if (saved.length === 0) { storage.bankAccounts.save(BANK_ACCOUNTS_DEFAULT); return BANK_ACCOUNTS_DEFAULT; }
    return saved.map(a => a.bank === 'Petty Cash' ? { ...a, bank: 'Cash' } : a);
  }, []);

  const exchangeRates = useMemo(() => {
    const saved = storage.exchangeRates.get();
    if (saved.length === 0) { storage.exchangeRates.save(EXCHANGE_RATES_DEFAULT); return EXCHANGE_RATES_DEFAULT; }
    return saved;
  }, []);

  const latestRate: ExchangeRate | null = useMemo(() => {
    if (!exchangeRates.length) return null;
    return [...exchangeRates].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [exchangeRates]);

  const [showAddClient, setShowAddClient] = useState(false);
  const [clientId, setClientId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'SRD');
  const [bankAccountId, setBankAccountId] = useState('');
  const [rateOverride, setRateOverride] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [methodType, setMethodType] = useState<'bank' | 'cash'>('bank');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredBanks = bankAccounts.filter(b =>
    b.currency === currency &&
    (methodType === 'bank' ? b.bank !== 'Cash' : b.bank === 'Cash')
  );

  const clientInvoices = useMemo(
    () => allInvoices.filter(inv => inv.clientId === clientId && inv.status !== 'Paid'),
    [allInvoices, clientId]
  );

  const getRate = (cur: string): number => {
    const r = latestRate;
    if (!r) return 1;
    switch (cur) {
      case 'USD': return r.usdSrd;
      case 'EUR': return r.eurSrd;
      default: return 1;
    }
  };

  const activeRate = rateOverride !== null ? rateOverride : getRate(currency);
  const amountSRD = currency === 'SRD' ? parseFloat(amount || '0') : parseFloat(amount || '0') * activeRate;

  const selectedInvoice = useMemo(() => clientInvoices.find(i => i.id === invoiceId), [clientInvoices, invoiceId]);
  const invoiceBalance = useMemo(() => {
    if (!selectedInvoice) return 0;
    return selectedInvoice.totalAmount - (selectedInvoice.paidAmount ?? 0);
  }, [selectedInvoice]);

  useEffect(() => {
    const banks = bankAccounts.filter(b =>
      b.currency === currency &&
      (methodType === 'bank' ? b.bank !== 'Cash' : b.bank === 'Cash')
    );
    if (banks.length > 0) setBankAccountId(banks[0].id);
    else setBankAccountId('');
    setRateOverride(null);
  }, [currency, methodType, bankAccounts]);

  useEffect(() => {
    if (selectedInvoice && invoiceBalance > 0) {
      const inDocCurrency = currency === 'SRD' ? invoiceBalance : invoiceBalance / activeRate;
      setAmount(inDocCurrency.toFixed(2));
    }
  }, [invoiceId]);

  useEffect(() => {
    if (!editId && fromInvoiceState) {
      setClientId(fromInvoiceState.clientId);
      setInvoiceId(fromInvoiceState.invoiceId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (existingPayment) {
      setClientId(existingPayment.clientId);
      setInvoiceId(existingPayment.invoiceId || '');
      setAmount(existingPayment.amount.toString());
      setCurrency(existingPayment.currency);
      setDate(existingPayment.date);
      setMethodType(existingPayment.method === 'Cash' ? 'cash' : 'bank');
      setReference(existingPayment.reference || '');
      setNotes(existingPayment.notes || '');
    }
  }, [existingPayment]);

  const handleSave = () => {
    const amt = parseFloat(amount || '0');
    const newErrors: Record<string, string> = {};
    if (!clientId) newErrors.clientId = 'Please select a client';
    if (!amount || amt <= 0) newErrors.amount = 'Vul een geldig bedrag in';
    if (!date) newErrors.date = 'Vul een datum in';
    if (!methodType) newErrors.methodType = 'Please select a payment method';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const paymentNumber = isEdit ? reference : commitDocNumber('pay');

    const paymentData = {
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

    const onSuccess = () => {
      // Update bank account balance in localStorage
      const accts = storage.bankAccounts.get().length ? storage.bankAccounts.get() : [...BANK_ACCOUNTS_DEFAULT];
      const acctIdx = accts.findIndex(a => a.id === (bankAccountId || 'cash_srd'));
      if (acctIdx >= 0) {
        accts[acctIdx] = { ...accts[acctIdx], balance: accts[acctIdx].balance + amt };
        storage.bankAccounts.save(accts);
      }

      // Update invoice status if payment covers remaining balance
      if (invoiceId && selectedInvoice && amt >= invoiceBalance) {
        updateInvoice.mutate({ id: invoiceId, status: 'Paid' });
      }

      setSaved(true);
      setTimeout(() => navigate('/payments'), 1200);
    };

    if (isEdit && editId) {
      updatePayment.mutate({ id: editId, ...paymentData }, { onSuccess });
    } else {
      createPayment.mutate(paymentData, { onSuccess });
    }
  };

  const rateLabel = latestRate ? `Rate: 1 ${currency} = ${activeRate.toFixed(2)} SRD (${latestRate.date})` : '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => navigate('/payments')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16}/> Back to Payments
        </button>
      </div>

      {fromInvoiceState && !editId && (
        <div className="bg-brand-accent-light border border-brand-primary/20 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Banknote size={18} className="text-brand-primary" />
          </div>
          <div>
            <p className="text-xs font-black text-brand-accent uppercase tracking-widest">Payment for Invoice</p>
            <p className="text-[11px] text-brand-primary font-medium mt-0.5">Client and invoice have been pre-selected. Enter the amount and confirm.</p>
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
              <div className="flex gap-2">
                <select aria-label="Client" value={clientId} onChange={e => { setClientId(e.target.value); setInvoiceId(''); if (errors.clientId) setErrors(prev => ({ ...prev, clientId: '' })); }} className={`flex-1 px-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none ${errors.clientId ? 'border-red-400' : 'border-slate-200'}`}>
                  <option value="">-- Select client --</option>
                  {allClients.map(c => <option key={c.id} value={c.id}>{c.company} ({c.name})</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddClient(true)}
                  className="px-3 py-3 bg-brand-primary text-white rounded-xl hover:opacity-90 transition-all active:scale-95 shrink-0"
                  title="Add new client"
                >
                  <UserPlus size={16} />
                </button>
              </div>
              {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>}
            </div>

            {/* Invoice link */}
            <div className="space-y-1.5 lg:col-span-2">
              <label className={`${LABEL} flex items-center gap-2`}><FileText size={10}/> Link to Invoice (optional)</label>
              <select aria-label="Link to invoice" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} className={INPUT}>
                <option value="">-- No specific invoice --</option>
                {clientInvoices.map(inv => {
                  const bal = inv.totalAmount - (inv.paidAmount ?? 0);
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
              <input aria-label="Date" type="date" value={date} onChange={e => { setDate(e.target.value); if (errors.date) setErrors(prev => ({ ...prev, date: '' })); }} className={`${INPUT} ${errors.date ? 'border-red-400' : ''}`}/>
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className={`${LABEL} flex items-center gap-2`}><TrendingUp size={10}/> Currency</label>
              <select aria-label="Currency" value={currency} onChange={e => setCurrency(e.target.value)} className={INPUT}>
                {['SRD', 'USD', 'EUR'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className={LABEL}>Amount ({currency})</label>
              <input aria-label="Amount" type="number" value={amount} onChange={e => { setAmount(e.target.value); if (errors.amount) setErrors(prev => ({ ...prev, amount: '' })); }} placeholder="0.00" className={`${INPUT} ${errors.amount ? 'border-red-400' : ''}`}/>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
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
                  <button type="button" onClick={() => setRateOverride(null)} className="text-[10px] text-slate-400 hover:text-slate-700 font-bold">↺ Use latest rate</button>
                )}
              </div>
            )}

            {/* Payment Method: Bank or Cash toggle */}
            <div className="space-y-1.5 lg:col-span-3">
              <label className={`${LABEL} flex items-center gap-2`}><CreditCard size={10}/> Ontvangen via</label>
              {errors.methodType && <p className="text-red-500 text-xs mt-1">{errors.methodType}</p>}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethodType('bank')}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-black text-sm transition-all ${
                    methodType === 'bank'
                      ? 'border-brand-primary bg-brand-primary text-white shadow-lg'
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
                      ? 'border-brand-primary bg-brand-primary text-white shadow-lg'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Banknote size={18}/> Cash
                </button>
              </div>
            </div>

            {/* Bank Account */}
            <div className="space-y-1.5 lg:col-span-3">
              <label className={`${LABEL} flex items-center gap-2`}><Landmark size={10}/> {methodType === 'cash' ? 'Cash Account' : 'Bank Account'} ({currency})</label>
              <select aria-label="Bank account" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} className={INPUT}>
                {filteredBanks.length === 0 && <option value="">No {currency} {methodType === 'cash' ? 'cash' : 'bank'} accounts</option>}
                {filteredBanks.map(b => (
                  <option key={b.id} value={b.id}>{b.bank} — {b.currency} {b.balance.toLocaleString()} ({b.iban !== '—' ? b.iban : 'Cash'})</option>
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
                <p className="text-lg font-black">{allClients.find(c => c.id === clientId)?.company || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">{methodType === 'cash' ? 'Cash' : 'Bank'}</p>
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
            <button type="button" onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-95">
              {saved ? <Check size={14}/> : <Save size={14}/>}
              {saved ? 'Saved...' : isEdit ? 'Save Payment' : 'Register Payment'}
            </button>
          </div>
        </div>
      </div>
      {showAddClient && (
        <QuickAddClientModal
          onClose={() => setShowAddClient(false)}
          onCreated={(newClient) => {
            setClientId(newClient.id);
            setShowAddClient(false);
          }}
        />
      )}
    </div>
  );
};

export default CreatePaymentPage;
