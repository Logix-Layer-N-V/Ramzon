import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeft, Save, Check, Coins, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockClients, mockCredits, mockInvoices } from '../lib/mock-data';
import { LanguageContext } from '../lib/context';

const CREDIT_REASONS = ['Damaged goods', 'Product return', 'Overpayment refund', 'Discount correction', 'Quality complaint', 'Other reason'];

const CreateCreditPage: React.FC = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useContext(LanguageContext);
  const { id: editId } = useParams();
  const isEdit = !!editId;
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState(CREDIT_REASONS[0]);
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (editId) {
      const existing = mockCredits.find(c => c.id === editId);
      if (existing) {
        setClientId(existing.clientId);
        setAmount(existing.amount.toString());
        setDate(existing.date);
        setReason(existing.reason);
      }
    }
  }, [editId]);

  const clientInvoices = mockInvoices.filter(inv => inv.clientId === clientId);
  const handleSave = () => { setSaved(true); setTimeout(() => navigate('/credits'), 1200); };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/credits')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16}/> Back to Credits
        </button>
        <button onClick={handleSave} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all">
          {saved ? <Check size={16}/> : <Save size={16}/>} {saved ? 'Saved...' : isEdit ? 'Save' : 'Create Credit Note'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><Coins size={22}/></div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{isEdit ? 'Edit Credit Note' : 'New Credit Note'}</h2>
                <p className="text-xs text-slate-400 font-medium">Create a credit note for a client</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users size={10}/> Client</label>
                <select aria-label="Client" value={clientId} onChange={e => { setClientId(e.target.value); setInvoiceRef(''); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                  <option value="">-- Select client --</option>
                  {mockClients.map(c => <option key={c.id} value={c.id}>{c.company} ({c.name})</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link to Invoice (optional)</label>
                <select aria-label="Link to invoice" value={invoiceRef} onChange={e => { setInvoiceRef(e.target.value); const inv = mockInvoices.find(i => i.id === e.target.value); if (inv) setAmount(inv.totalAmount.toString()); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                  <option value="">-- No invoice --</option>
                  {clientInvoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — {currencySymbol}{inv.totalAmount.toFixed(2)}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Amount ({currencySymbol})</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"/>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                <input aria-label="Date" type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"/>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</label>
                <select aria-label="Reason for credit" value={reason} onChange={e => setReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
                  {CREDIT_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional notes for the credit..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none resize-none"/>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-slate-900 p-8 rounded-[28px] text-white shadow-2xl space-y-6 sticky top-24">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">Credit Summary</h3>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-2xl p-4"><p className="text-[10px] text-white/40 uppercase font-black">Client</p><p className="font-black text-white mt-1">{mockClients.find(c => c.id === clientId)?.company || '—'}</p></div>
              <div className="bg-white/5 rounded-2xl p-4"><p className="text-[10px] text-white/40 uppercase font-black">Reason</p><p className="font-black text-white mt-1 text-xs">{reason}</p></div>
              <div className="bg-white/5 rounded-2xl p-4"><p className="text-[10px] text-white/40 uppercase font-black">Credit Amount</p><p className="text-3xl font-black text-orange-400 mt-1">{currencySymbol}{parseFloat(amount || '0').toFixed(2)}</p></div>
            </div>
            <button onClick={handleSave} className="w-full py-3 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center gap-2">
              <Save size={14}/> Create Credit Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCreditPage;
