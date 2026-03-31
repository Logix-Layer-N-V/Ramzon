import React, { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Wrench, MoreVertical, Pencil, Trash2,
  Check, X, Settings2, DollarSign, Tag, AlignLeft,
} from 'lucide-react';
import { LanguageContext } from '../lib/context';
import { getList, saveList } from '../lib/storage';

const LS_KEY = 'erp_services';

const UNITS = ['hr', 'm²', 'm³', 'lm', 'pcs', 'lot', 'dag', 'rit'];
const STATUSES = ['Available', 'Booked', 'Unavailable'] as const;
type ServiceStatus = typeof STATUSES[number];

interface Service {
  id: string;
  name: string;
  category: string;
  rate: number;
  unit: string;
  status: ServiceStatus;
  description?: string;
}

const DEFAULT_SERVICES: Service[] = [
  { id: 'sv1', name: 'Custom Sawmilling',           category: 'Fabrication',  rate: 85,  unit: 'hr',  status: 'Available', description: 'Op maat zagen van houtbalken en planken.' },
  { id: 'sv2', name: 'Kiln Drying',                 category: 'Processing',   rate: 45,  unit: 'm³',  status: 'Booked',    description: 'Oven drogen van hout voor exportkwaliteit.' },
  { id: 'sv3', name: 'Planer / Thicknesser Service',category: 'Fabrication',  rate: 60,  unit: 'hr',  status: 'Available', description: 'Schaven en afwerken op gewenste dikte.' },
  { id: 'sv4', name: 'Professional Grading',        category: 'Consultancy',  rate: 120, unit: 'lot', status: 'Available', description: 'Kwaliteitskeuring en sortering van hout.' },
];

function loadServices(): Service[] {
  const saved = getList<Service>(LS_KEY);
  return saved.length ? saved : DEFAULT_SERVICES;
}

const STATUS_STYLE: Record<ServiceStatus, string> = {
  Available:   'bg-emerald-100 text-emerald-700',
  Booked:      'bg-amber-100 text-amber-700',
  Unavailable: 'bg-red-100 text-red-600',
};

const EMPTY: Omit<Service, 'id'> = { name: '', category: '', rate: 0, unit: 'hr', status: 'Available', description: '' };

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useContext(LanguageContext);

  const [services, setServices] = useState<Service[]>(loadServices);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Context menu
  const [menuId, setMenuId] = useState<string | null>(null);

  const save = (updated: Service[]) => {
    setServices(updated);
    saveList(LS_KEY, updated);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return services.filter(s => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      const matchS = filterStatus === 'All' || s.status === filterStatus;
      return matchQ && matchS;
    });
  }, [services, search, filterStatus]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({ name: s.name, category: s.category, rate: s.rate, unit: s.unit, status: s.status, description: s.description ?? '' });
    setFormErrors({});
    setShowModal(true);
    setMenuId(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Service verwijderen?')) return;
    save(services.filter(s => s.id !== id));
    setMenuId(null);
  };

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Naam is verplicht';
    if (!form.category.trim()) errs.category = 'Categorie is verplicht';
    if (form.rate <= 0) errs.rate = 'Tarief moet groter dan 0 zijn';
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    if (editingId) {
      save(services.map(s => s.id === editingId ? { ...s, ...form } : s));
    } else {
      save([...services, { id: `sv-${Date.now()}`, ...form }]);
    }
    setShowModal(false);
  };

  const toggleStatus = (id: string) => {
    save(services.map(s => {
      if (s.id !== id) return s;
      const next: ServiceStatus = s.status === 'Available' ? 'Booked' : s.status === 'Booked' ? 'Unavailable' : 'Available';
      return { ...s, status: next };
    }));
    setMenuId(null);
  };

  const F = (field: keyof typeof form, val: string | number) =>
    setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500" onClick={() => setMenuId(null)}>

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Services</h1>
          <p className="text-sm font-medium text-slate-500 italic">Beheer zaagwerk, drogen en houtbewerkingsdiensten</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/services/categories')}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Settings2 size={14} /> Service Types
          </button>
          <button
            onClick={openAdd}
            className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition-all flex items-center gap-2 shadow-xl active:scale-95"
          >
            <Plus size={18} /> Add Service
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 max-w-sm relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek services..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {['All', ...STATUSES].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === st ? 'bg-brand-primary text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="px-6 py-2 bg-slate-50/30 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {filtered.length} van {services.length} services
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Wrench size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">Geen services gevonden</p>
            <button onClick={openAdd} className="mt-3 text-xs text-brand-primary font-black hover:underline">+ Voeg eerste service toe</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(s => (
              <div key={s.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-accent-light group-hover:text-brand-primary transition-colors shrink-0">
                    <Wrench size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-900 leading-tight truncate">{s.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.category}</p>
                    {s.description && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{s.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 italic">{currencySymbol}{s.rate}<span className="text-xs font-bold text-slate-400">/{s.unit}</span></p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Standaard tarief</p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(s); }}
                      className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-accent-light rounded-lg transition-colors"
                      title="Bewerken"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={e => { e.stopPropagation(); setMenuId(menuId === s.id ? null : s.id); }}
                        className="p-2 text-slate-300 hover:text-slate-600 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {menuId === s.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-20 min-w-[170px] overflow-hidden" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(s)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">
                            <Pencil size={13} className="text-brand-primary" /> Bewerken
                          </button>
                          <button onClick={() => toggleStatus(s.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">
                            <Check size={13} className="text-emerald-500" /> Status wijzigen
                          </button>
                          <div className="border-t border-slate-100" />
                          <button onClick={() => handleDelete(s.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-black text-red-500 hover:bg-red-50">
                            <Trash2 size={13} /> Verwijderen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Services', value: services.length, icon: Wrench, color: 'bg-brand-accent-light text-brand-primary' },
          { label: 'Beschikbaar', value: services.filter(s => s.status === 'Available').length, icon: Check, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Geboekt', value: services.filter(s => s.status === 'Booked').length, icon: Tag, color: 'bg-amber-50 text-amber-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <p className="text-2xl font-black text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center">
                  <Wrench size={15} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">{editingId ? 'Service Bewerken' : 'Nieuwe Service'}</h2>
                  <p className="text-[10px] text-slate-400 font-bold">Vul de service details in</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {/* Name — full width */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Naam *</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => { F('name', e.target.value); setFormErrors(p => ({ ...p, name: '' })); }}
                    placeholder="bijv. Custom Sawmilling"
                    className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:border-brand-primary transition-colors ${formErrors.name ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs">{formErrors.name}</p>}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorie *</label>
                  <input
                    value={form.category}
                    onChange={e => { F('category', e.target.value); setFormErrors(p => ({ ...p, category: '' })); }}
                    placeholder="bijv. Fabrication"
                    className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:border-brand-primary transition-colors ${formErrors.category ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {formErrors.category && <p className="text-red-500 text-xs">{formErrors.category}</p>}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    value={form.status}
                    onChange={e => F('status', e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary appearance-none"
                  >
                    {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                {/* Rate */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarief *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.rate || ''}
                    onChange={e => { F('rate', parseFloat(e.target.value) || 0); setFormErrors(p => ({ ...p, rate: '' })); }}
                    placeholder="0.00"
                    className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:border-brand-primary transition-colors ${formErrors.rate ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {formErrors.rate && <p className="text-red-500 text-xs">{formErrors.rate}</p>}
                </div>

                {/* Unit */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per eenheid</label>
                  <select
                    value={form.unit}
                    onChange={e => F('unit', e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary appearance-none"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Omschrijving</label>
                  <textarea
                    value={form.description}
                    onChange={e => F('description', e.target.value)}
                    placeholder="Optionele omschrijving van de service..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-black uppercase tracking-widest transition-colors">
                Annuleer
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg"
              >
                <Check size={14} /> {editingId ? 'Opslaan' : 'Toevoegen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
