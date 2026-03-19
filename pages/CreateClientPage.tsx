import React, { useState, useContext } from 'react';
import { ArrowLeft, User, Building, Mail, Phone, MapPin, Save, Hash, Info, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../lib/context';
import { storage } from '../lib/storage';
import { ClientSchema } from '../lib/schemas';

const CreateClientPage: React.FC = () => {
  const navigate = useNavigate();
  const { enableCrypto } = useContext(LanguageContext);

  const [contactName, setContactName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [btw, setBtw] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('SRD');

  const canSave = contactName.trim().length > 0;

  const handleSave = () => {
    const validation = ClientSchema.safeParse({
      name: contactName,
      email: email,
      company: company || undefined,
      phone: phone || undefined,
      address: address || undefined,
      vatNumber: btw || undefined,
    });
    if (!validation.success) {
      alert(validation.error.issues[0].message); // Phase 1 — inline errors in Task 8
      return;
    }
    const existing = storage.clients.get();
    const newClient = {
      id: `c${Date.now()}`,
      name: contactName.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim(),
      vatNumber: btw.trim(),
      address: address.trim(),
      notes,
      totalSpent: 0,
      status: 'Active' as const,
      preferredCurrency,
    };
    storage.clients.save([...existing, newClient]);
    navigate('/clients');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold text-sm transition-all">
          <ArrowLeft size={16} /> Back to CRM
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`px-8 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
            !canSave
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-brand-primary text-white active:scale-95 hover:bg-red-800'
          }`}
        >
          <Save size={18} /> Save Client
        </button>
      </div>

      <div className="space-y-6">
        {/* Main Client Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 text-brand-primary rounded-xl flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">New Business Account</h2>
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">CRM Account Details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* 1. Contact Person (required) */}
            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Contact Person <span className="text-brand-primary">*</span>
              </label>
              <input
                type="text"
                placeholder="Full name of contact person..."
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all"
                autoFocus
              />
              {!contactName.trim() && (
                <p className="text-[10px] text-slate-400 font-semibold">Required – name of the contact person</p>
              )}
            </div>

            {/* 2. Company Name (optional) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Building size={12} /> Company Name <span className="text-slate-300 text-[9px] normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="E.g. Ramzon Wood N.V."
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all"
              />
            </div>

            {/* 3. Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} /> Phone Number
              </label>
              <input
                type="text"
                placeholder="+597 ..."
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all"
              />
            </div>

            {/* 4. Email (optional) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} /> Email Address <span className="text-slate-300 text-[9px] normal-case font-normal">(optional)</span>
              </label>
              <input
                type="email"
                placeholder="client@company.sr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all"
              />
            </div>

            {/* 5. Default Currency */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                💱 Default Currency
              </label>
              <select
                aria-label="Default currency"
                value={preferredCurrency}
                onChange={e => setPreferredCurrency(e.target.value)}
                className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-700"
              >
                <option value="SRD">🇸🇷 SRD – Surinamese Dollar</option>
                <option value="USD">🇺🇸 USD – US Dollar</option>
                <option value="EUR">🇪🇺 EUR – Euro</option>
                {enableCrypto && <option value="USDT">💵 USDT – Tether</option>}
              </select>
              <p className="text-[10px] text-slate-400 font-medium">Used as default currency on invoices and quotes</p>
            </div>

            {/* 6. VAT Number (optional) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Hash size={12} /> VAT Number <span className="text-slate-300 text-[9px] normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="NL8829..."
                value={btw}
                onChange={e => setBtw(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* 7. Business Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={12} /> Business Address
            </label>
            <textarea
              rows={2}
              placeholder="Full billing address..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        {/* Notes (separate card) */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Internal Notes</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Only visible to staff members</p>
            </div>
          </div>
          <textarea
            rows={4}
            placeholder="Special notes about this client, payment agreements, delivery preferences..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-3 bg-amber-50/30 border border-amber-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-100 focus:bg-white transition-all resize-none text-slate-700"
          />
        </div>

        {/* Info banner */}
        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-4 items-start">
          <Info size={20} className="text-brand-primary shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold text-slate-500 leading-relaxed italic">
            Only the contact person is required. Company name, VAT number and email are optional but help with automatic invoicing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateClientPage;
