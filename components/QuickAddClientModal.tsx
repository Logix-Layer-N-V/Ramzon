import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { storage } from '../lib/storage';
import type { Client } from '../types';

interface Props {
  onClose: () => void;
  onCreated: (client: Client) => void;
}

const QuickAddClientModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Naam is verplicht';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Ongeldig emailadres';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      address: address.trim(),
      vatNumber: '',
      totalSpent: 0,
      status: 'Active',
      preferredCurrency: 'SRD',
    };

    const existing = storage.clients.get();
    storage.clients.save([...existing, newClient]);
    onCreated(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center">
              <UserPlus size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">New Client</h2>
              <p className="text-[10px] text-slate-400 font-bold">Add client and select immediately</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Naam *</label>
              <input
                autoFocus
                value={name}
                onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
                placeholder="Voornaam Achternaam"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:border-brand-primary transition-colors ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bedrijf</label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Bedrijfsnaam (optioneel)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
                placeholder="email@voorbeeld.com"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:border-brand-primary transition-colors ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefoon</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+597 ..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary transition-colors"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adres</label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Straat, Stad"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-black uppercase tracking-widest transition-colors">
            Annuleer
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg"
          >
            <Check size={14} /> Save & Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddClientModal;
