import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ArrowLeft, Save, Check, Coins, Users, Calendar, FileText, AlignLeft, Printer, UserPlus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockClients, mockCredits, mockInvoices } from '../lib/mock-data';
import { LanguageContext } from '../lib/context';
import { storage } from '../lib/storage';
import type { Credit } from '../types';
import DocPDFModal from '../components/DocPDFModal';
import QuickAddClientModal from '../components/QuickAddClientModal';

const CREDIT_REASONS = ['Damaged goods', 'Product return', 'Overpayment refund', 'Discount correction', 'Quality complaint', 'Other reason'];

const LABEL = 'text-[10px] font-black text-slate-400 uppercase tracking-widest';
const INPUT = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-400 focus:bg-white transition-colors';

const CreateCreditPage: React.FC = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useContext(LanguageContext);
  const { id: editId } = useParams();
  const isEdit = !!editId;
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientRefresh, setClientRefresh] = useState(0);
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState(CREDIT_REASONS[0]);
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allClients = useMemo(() => {
    const stored = storage.clients.get();
    if (stored.length === 0) return mockClients;
    const ids = new Set(stored.map(c => c.id));
    return [...mockClients.filter(c => !ids.has(c.id)), ...stored];
  }, [clientRefresh]);

  useEffect(() => {
    if (editId) {
      // check localStorage first, fallback to mock data
      const fromStorage = storage.credits.get().find(c => c.id === editId);
      const existing = fromStorage ?? mockCredits.find(c => c.id === editId);
      if (existing) {
        setClientId(existing.clientId);
        setAmount(existing.amount.toString());
        setDate(existing.date);
        setReason(existing.reason);
        setNotes((existing as any).notes || '');
      }
    }
  }, [editId]);

  const clientInvoices = mockInvoices.filter(inv => inv.clientId === clientId);

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!clientId) newErrors.clientId = 'Selecteer een klant';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Vul een geldig bedrag in';
    if (!reason) newErrors.reason = 'Selecteer een reden';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    const existing = storage.credits.get();
    if (isEdit && editId) {
      const updated = existing.map(c =>
        c.id === editId
          ? { ...c, clientId, amount: parseFloat(amount) || 0, date, reason, notes, status: c.status }
          : c
      );
      storage.credits.save(updated);
    } else {
      const newCredit: Credit = {
        id: `cr-${Date.now()}`,
        clientId,
        amount: parseFloat(amount) || 0,
        date,
        reason,
        notes,
        status: 'Available',
      };
      storage.credits.save([...existing, newCredit]);
    }
    setSaved(true);
    setTimeout(() => navigate('/credits'), 1200);
  };

  const selectedClient = allClients.find(c => c.id === clientId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/credits')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16}/> Back to Credits
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPDF(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={15}/> Preview PDF
          </button>
          <button onClick={handleSave} className="bg-brand-primary text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all">
            {saved ? <Check size={16}/> : <Save size={16}/>} {saved ? 'Saved...' : isEdit ? 'Save' : 'Create Credit Note'}
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="flex items-center gap-4 px-8 py-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-brand-accent-light text-brand-primary rounded-2xl flex items-center justify-center shrink-0">
            <Coins size={22}/>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">{isEdit ? 'Edit Credit Note' : 'New Credit Note'}</h2>
            <p className="text-xs text-slate-400 font-medium">Issue a credit note for a client</p>
          </div>
        </div>

        {/* Fields grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Client */}
          <div className="space-y-1.5 lg:col-span-3">
            <label className={`${LABEL} flex items-center gap-2`}><Users size={10}/> Client</label>
            <div className="flex gap-2">
              <select
                aria-label="Client"
                value={clientId}
                onChange={e => { setClientId(e.target.value); setInvoiceRef(''); if (errors.clientId) setErrors(prev => ({ ...prev, clientId: '' })); }}
                className={`flex-1 px-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:border-orange-400 focus:bg-white transition-colors ${errors.clientId ? 'border-red-400' : 'border-slate-200'}`}
              >
                <option value="">-- Select client --</option>
                {allClients.map(c => <option key={c.id} value={c.id}>{c.company} ({c.name})</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowAddClient(true)}
                className="px-3 py-3 bg-brand-primary text-white rounded-xl hover:opacity-90 transition-all active:scale-95 shrink-0"
                title="Nieuwe klant toevoegen"
              >
                <UserPlus size={16} />
              </button>
            </div>
            {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>}
          </div>

          {/* Link to invoice */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className={`${LABEL} flex items-center gap-2`}><FileText size={10}/> Link to Invoice (optional)</label>
            <select
              aria-label="Link to invoice"
              value={invoiceRef}
              onChange={e => {
                setInvoiceRef(e.target.value);
                const inv = mockInvoices.find(i => i.id === e.target.value);
                if (inv) setAmount(inv.totalAmount.toString());
              }}
              className={INPUT}
            >
              <option value="">-- No specific invoice --</option>
              {clientInvoices.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — {currencySymbol}{inv.totalAmount.toFixed(2)}</option>
              ))}
            </select>
          </div>

          {/* Credit Amount */}
          <div className="space-y-1.5">
            <label className={LABEL}>Credit Amount ({currencySymbol})</label>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); if (errors.amount) setErrors(prev => ({ ...prev, amount: '' })); }}
              placeholder="0.00"
              className={`${INPUT} ${errors.amount ? 'border-red-400' : ''}`}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className={`${LABEL} flex items-center gap-2`}><Calendar size={10}/> Date</label>
            <input
              aria-label="Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={INPUT}
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className={LABEL}>Reason</label>
            <select
              aria-label="Reason for credit"
              value={reason}
              onChange={e => { setReason(e.target.value); if (errors.reason) setErrors(prev => ({ ...prev, reason: '' })); }}
              className={`${INPUT} ${errors.reason ? 'border-red-400' : ''}`}
            >
              {CREDIT_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1.5 lg:col-span-3">
            <label className={`${LABEL} flex items-center gap-2`}><AlignLeft size={10}/> Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes for the credit note..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none resize-none focus:border-orange-400 focus:bg-white transition-colors"
            />
          </div>

        </div>
      </div>

      {/* Bottom summary bar */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl">
        <div className="flex flex-wrap items-center gap-6 justify-between">
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Client</p>
              <p className="text-lg font-black">{selectedClient?.company || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Reason</p>
              <p className="text-lg font-black">{reason}</p>
            </div>
            <div>
              <p className="text-[10px] text-orange-400 uppercase font-black tracking-widest mb-1">Credit Amount</p>
              <p className="text-3xl font-black text-orange-400">
                {currencySymbol}{parseFloat(amount || '0').toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPDF(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              <Printer size={14}/> Preview PDF
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-95"
            >
              {saved ? <Check size={14}/> : <Save size={14}/>}
              {saved ? 'Saved...' : isEdit ? 'Save Credit Note' : 'Create Credit Note'}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      {showPDF && (
        <DocPDFModal
          docType="invoice"
          docNumber={editId ?? `CN-${Date.now()}`}
          date={date}
          clientName={selectedClient?.name ?? ''}
          clientCompany={selectedClient?.company}
          clientAddress={selectedClient?.address}
          clientPhone={selectedClient?.phone}
          clientEmail={selectedClient?.email}
          currency="SRD"
          currencySymbol="SRD"
          items={[{
            id: 'cn-1',
            description: reason || 'Credit Note',
            houtsoort: '',
            spec: '',
            qty: 1,
            unit: 'st',
            price: parseFloat(amount) || 0,
          }]}
          subtotal={parseFloat(amount) || 0}
          tax={0}
          total={parseFloat(amount) || 0}
          onClose={() => setShowPDF(false)}
        />
      )}

      {showAddClient && (
        <QuickAddClientModal
          onClose={() => setShowAddClient(false)}
          onCreated={(newClient) => {
            setClientRefresh(r => r + 1);
            setClientId(newClient.id);
            setShowAddClient(false);
          }}
        />
      )}
    </div>
  );
};

export default CreateCreditPage;
