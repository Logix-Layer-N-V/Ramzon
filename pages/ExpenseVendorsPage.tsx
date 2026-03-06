import React, { useState, useContext } from 'react';
import { Store, Plus, Pencil, Trash2, Check, X, Phone, Mail, MapPin } from 'lucide-react';
import { LanguageContext } from '../lib/context';

const DEFAULT_VENDORS = [
  { id: 'v1', name: 'Shell Suriname', category: 'Logistiek', phone: '+597 410-000', email: 'info@shell.sr', address: 'Paramaribo' },
  { id: 'v2', name: 'Houtimport Brazilië BV', category: 'Inventaris', phone: '+55 11 9000-0000', email: 'orders@houtbr.com', address: 'São Paulo, Brazil' },
  { id: 'v3', name: 'DHB Transport', category: 'Logistiek', phone: '+597 520-123', email: 'transport@dhb.sr', address: 'Paramaribo' },
];

const ExpenseVendorsPage: React.FC = () => {
  const { t } = useContext(LanguageContext);
  const [vendors, setVendors] = useState(DEFAULT_VENDORS);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: '', phone: '', email: '', address: '' });

  const resetForm = () => setForm({ name: '', category: '', phone: '', email: '', address: '' });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setVendors([...vendors, { id: `v${Date.now()}`, ...form }]);
    resetForm();
    setIsAdding(false);
  };

  const handleEdit = (v: typeof vendors[0]) => {
    setEditingId(v.id);
    setForm({ name: v.name, category: v.category, phone: v.phone, email: v.email, address: v.address });
  };

  const handleSaveEdit = (id: string) => {
    setVendors(vendors.map(v => v.id === id ? { ...v, ...form } : v));
    setEditingId(null);
    resetForm();
  };

  const AddForm = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
    <div className="p-6 border-b border-brand-primary/20 bg-red-50/20 grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        type="text"
      placeholder="Vendor name *"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
        autoFocus
      />
      <input
        type="text"
      placeholder="Category (e.g. Logistics)"
        value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })}
        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
      />
      <input
        type="text"
      placeholder="Phone number"
        value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
      />
      <input
        type="email"
      placeholder="Email address"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
      />
      <input
        type="text"
      placeholder="Address / Location"
        value={form.address}
        onChange={e => setForm({ ...form, address: e.target.value })}
        className="md:col-span-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
      />
      <div className="md:col-span-2 flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
          {t('cancel')}
        </button>
        <button onClick={onConfirm} className="px-6 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-red-800 transition-colors flex items-center gap-2">
          <Check size={16} /> {t('save')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vendors</h1>
          <p className="text-sm font-medium text-slate-500 italic">{t('manageVendors')}</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-red-800 transition-all flex items-center gap-2 shadow-xl active:scale-95"
        >
          <Plus size={18} /> {t('newVendorBtn')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isAdding && <AddForm onConfirm={handleAdd} onCancel={() => { setIsAdding(false); resetForm(); }} />}

        <div className="divide-y divide-slate-100">
          {vendors.map((v) => (
            <div key={v.id}>
              {editingId === v.id ? (
                <AddForm onConfirm={() => handleSaveEdit(v.id)} onCancel={() => { setEditingId(null); resetForm(); }} />
              ) : (
                <div className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50/50 transition-colors group">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <Store size={20} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-slate-900 text-sm">{v.name}</p>
                      {v.category && (
                        <span className="px-2 py-0.5 bg-brand-accent-light text-brand-primary rounded-full text-[9px] font-black uppercase tracking-widest">
                          {v.category}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {v.phone && (
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <Phone size={10} /> {v.phone}
                        </span>
                      )}
                      {v.email && (
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <Mail size={10} /> {v.email}
                        </span>
                      )}
                      {v.address && (
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <MapPin size={10} /> {v.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      title="Bewerken"
                      onClick={() => handleEdit(v)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      title="Verwijderen"
                      onClick={() => setVendors(vendors.filter(x => x.id !== v.id))}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {vendors.length === 0 && (
          <div className="p-12 text-center text-slate-300">
            <Store size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">No vendors found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseVendorsPage;
