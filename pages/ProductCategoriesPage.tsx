import React, { useState, useEffect } from 'react';
import {
  Layers, Trees, DoorOpen, Ruler, Grid2x2,
  Plus, Pencil, Trash2, Save, X, Check, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import type { WoodSpecies, DoorModel, ProfileSize, DoorPriceEntry } from '../types';

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: 'Doors',         description: 'Houtsoort → Model deur → Afmeting (m²)' },
  { id: 'cat2', name: 'Mouldings',     description: 'Houtsoort → Product type → Lengte (lm)' },
  { id: 'cat3', name: 'Frames',        description: 'Houtsoort → Afmeting profiel → Lengte (lm)' },
  { id: 'cat4', name: 'Window Frames', description: 'Houtsoort → Doorsnee maat → Lengte (lm)' },
  { id: 'cat5', name: 'Crating',       description: 'Crate type → Prijs per stuk' },
];
const DEFAULT_SPECIES: WoodSpecies[] = [
  { id: 'ws1', name: 'Teak',        color: '#c8a87a' },
  { id: 'ws2', name: 'Oak',         color: '#d4a96a' },
  { id: 'ws3', name: 'Mahogany',    color: '#8b3a2a' },
  { id: 'ws4', name: 'Pine',        color: '#e8c98a' },
  { id: 'ws5', name: 'Kopi',        color: '#6b4226' },
  { id: 'ws6', name: 'Purpleheart', color: '#6a3772' },
  { id: 'ws7', name: 'Wenge',       color: '#3d2b1f' },
  { id: 'ws8', name: 'Ipe',         color: '#5c3a1a' },
];
const DEFAULT_MODELS: DoorModel[] = [
  { id: 'dm1', name: 'Panel door' }, { id: 'dm2', name: 'Classic door' },
  { id: 'dm3', name: 'Stile & rail door' }, { id: 'dm4', name: 'Sliding door' },
  { id: 'dm5', name: 'Overlay door' }, { id: 'dm6', name: 'Louvre door' },
];
const DEFAULT_PROFILES: ProfileSize[] = [
  { id: 'ps1', label: '800×2100mm',  mmW: 800,  mmH: 2100 },
  { id: 'ps2', label: '900×2100mm',  mmW: 900,  mmH: 2100 },
  { id: 'ps3', label: '1000×2200mm', mmW: 1000, mmH: 2200 },
  { id: 'ps4', label: '1200×2400mm', mmW: 1200, mmH: 2400 },
];

type Tab = 'categories' | 'species' | 'models' | 'profiles' | 'matrix';
const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'categories', label: 'Categories',    icon: Layers   },
  { id: 'species',    label: 'Wood Species',  icon: Trees    },
  { id: 'models',     label: 'Door Models',   icon: DoorOpen },
  { id: 'profiles',   label: 'Profile Sizes', icon: Ruler    },
  { id: 'matrix',     label: 'Price Matrix',  icon: Grid2x2  },
];

function EditableRow({ value, onSave, onCancel }: {
  value: string; onSave: (v: string) => void; onCancel: () => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div className="flex gap-2 flex-1">
      <input value={v} onChange={e => setV(e.target.value)} autoFocus
        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
        onKeyDown={e => { if (e.key === 'Enter' && v.trim()) onSave(v.trim()); if (e.key === 'Escape') onCancel(); }}
      />
      <button onClick={() => v.trim() && onSave(v.trim())} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check size={14} /></button>
      <button onClick={onCancel} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={14} /></button>
    </div>
  );
}

const ROW = 'flex items-center justify-between px-5 py-3.5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 group';
const BTN_ICON = 'p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all';

const ProductCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  // ── Categories ──────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('erp_product_categories') ?? 'null') ?? DEFAULT_CATEGORIES; }
    catch { return DEFAULT_CATEGORIES; }
  });
  useEffect(() => { localStorage.setItem('erp_product_categories', JSON.stringify(categories)); }, [categories]);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editCatId, setEditCatId] = useState<string | null>(null);

  // ── Wood Species ─────────────────────────────────────────────────────────────
  const [species, setSpecies] = useState<WoodSpecies[]>(() => {
    const s = storage.woodSpecies.get(); return s.length ? s : DEFAULT_SPECIES;
  });
  const saveSpecies = (updated: WoodSpecies[]) => { setSpecies(updated); storage.woodSpecies.save(updated); };
  const [addingSp, setAddingSp] = useState(false);
  const [newSpName, setNewSpName] = useState('');
  const [newSpColor, setNewSpColor] = useState('#c8a87a');
  const [newSpMarkup, setNewSpMarkup] = useState(0);
  const [editSpId, setEditSpId] = useState<string | null>(null);

  // ── Door Models ──────────────────────────────────────────────────────────────
  const [models, setModels] = useState<DoorModel[]>(() => {
    const m = storage.doorModels.get(); return m.length ? m : DEFAULT_MODELS;
  });
  const saveModels = (updated: DoorModel[]) => { setModels(updated); storage.doorModels.save(updated); };
  const [addingModel, setAddingModel] = useState(false);
  const [editModelId, setEditModelId] = useState<string | null>(null);

  // ── Profile Sizes ────────────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState<ProfileSize[]>(() => {
    const p = storage.profileSizes.get(); return p.length ? p : DEFAULT_PROFILES;
  });
  const saveProfiles = (updated: ProfileSize[]) => { setProfiles(updated); storage.profileSizes.save(updated); };
  const [addingProf, setAddingProf] = useState(false);
  const [newProfLabel, setNewProfLabel] = useState('');
  const [newProfW, setNewProfW] = useState('');
  const [newProfH, setNewProfH] = useState('');
  const [newProfType, setNewProfType] = useState<'surface' | 'length'>('surface');
  const [editProfId, setEditProfId] = useState<string | null>(null);
  const [editProfData, setEditProfData] = useState<{ label: string; mmW: string; mmH: string; measureType: 'surface' | 'length' } | null>(null);

  // ── Price Matrix ─────────────────────────────────────────────────────────────
  const [matrix, setMatrix] = useState<DoorPriceEntry[]>(() => storage.doorPriceMatrix.get());
  const [matrixSaved, setMatrixSaved] = useState(false);
  const getPrice = (modelId: string, speciesId: string) =>
    matrix.find(e => e.modelId === modelId && e.woodSpeciesId === speciesId)?.pricePerM2 ?? 0;
  const setPrice = (modelId: string, speciesId: string, price: number) => {
    const exists = matrix.find(e => e.modelId === modelId && e.woodSpeciesId === speciesId);
    setMatrix(exists
      ? matrix.map(e => e.modelId === modelId && e.woodSpeciesId === speciesId ? { ...e, pricePerM2: price } : e)
      : [...matrix, { id: `pm_${modelId}_${speciesId}`, modelId, woodSpeciesId: speciesId, pricePerM2: price }]
    );
  };
  const saveMatrix = () => {
    storage.doorPriceMatrix.save(matrix);
    setMatrixSaved(true);
    setTimeout(() => setMatrixSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/products')} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Configuration</h1>
          <p className="text-sm font-medium text-slate-500">Manage categories, wood species, door models, profiles & pricing</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
        {activeTab === 'categories' && (
          <>
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-2"><Layers size={15} /> Product Categories</h3>
              <button onClick={() => setAddingCat(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="p-6 space-y-2">
              {addingCat && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                  <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name (e.g. Kozijnen)" autoFocus
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                  <input value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Flow description (e.g. Houtsoort → Doorsnee maat)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none" />
                  <div className="flex gap-2">
                    <button onClick={() => {
                      if (!newCatName.trim()) return;
                      setCategories([...categories, { id: `cat${Date.now()}`, name: newCatName.trim(), description: newCatDesc.trim() }]);
                      setNewCatName(''); setNewCatDesc(''); setAddingCat(false);
                    }} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">Save</button>
                    <button onClick={() => setAddingCat(false)} className="px-4 py-2 text-slate-400 text-xs font-bold">Cancel</button>
                  </div>
                </div>
              )}
              {categories.map((cat: any) => (
                <div key={cat.id} className={ROW}>
                  <div>
                    <p className="font-black text-slate-900">{cat.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{cat.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className={`${BTN_ICON} text-slate-400 hover:text-slate-700 hover:bg-slate-100`} onClick={() => setEditCatId(cat.id)}><Pencil size={13} /></button>
                    <button className={`${BTN_ICON} text-slate-300 hover:text-red-500 hover:bg-red-50`}
                      onClick={() => window.confirm(`Delete "${cat.name}"?`) && setCategories(categories.filter((c: any) => c.id !== cat.id))}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── WOOD SPECIES ──────────────────────────────────────────────────── */}
        {activeTab === 'species' && (
          <>
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-2"><Trees size={15} /> Wood Species</h3>
              <button onClick={() => setAddingSp(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                <Plus size={13} /> Add Species
              </button>
            </div>
            <div className="p-6 space-y-2">
              {addingSp && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-wrap items-center gap-3">
                  <input type="color" value={newSpColor} onChange={e => setNewSpColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-none cursor-pointer shrink-0" />
                  <input value={newSpName} onChange={e => setNewSpName(e.target.value)} placeholder="Species name" autoFocus
                    className="flex-1 min-w-[140px] px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-3 py-2">
                    <input type="number" value={newSpMarkup} min={0} max={200} onChange={e => setNewSpMarkup(+e.target.value)}
                      className="w-12 text-sm font-bold outline-none bg-transparent text-center" placeholder="0" />
                    <span className="text-xs text-slate-400 font-black">% markup</span>
                  </div>
                  <button onClick={() => {
                    if (!newSpName.trim()) return;
                    saveSpecies([...species, { id: `ws${Date.now()}`, name: newSpName.trim(), color: newSpColor, markup: newSpMarkup }]);
                    setNewSpName(''); setNewSpColor('#c8a87a'); setNewSpMarkup(0); setAddingSp(false);
                  }} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black">Save</button>
                  <button onClick={() => setAddingSp(false)} className="text-slate-400 text-xs font-bold">Cancel</button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {species.map((sp) => (
                  <div key={sp.id} className={ROW}>
                    {editSpId === sp.id ? (
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        <input type="color" defaultValue={sp.color ?? '#c8a87a'}
                          onChange={e => saveSpecies(species.map(s => s.id === sp.id ? { ...s, color: e.target.value } : s))}
                          className="w-8 h-8 rounded-lg border-none cursor-pointer shrink-0" />
                        <EditableRow value={sp.name}
                          onSave={v => { saveSpecies(species.map(s => s.id === sp.id ? { ...s, name: v } : s)); setEditSpId(null); }}
                          onCancel={() => setEditSpId(null)} />
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                          <input type="number" defaultValue={sp.markup ?? 0} min={0} max={200}
                            onChange={e => saveSpecies(species.map(s => s.id === sp.id ? { ...s, markup: +e.target.value } : s))}
                            className="w-10 text-sm font-bold outline-none bg-transparent text-center" />
                          <span className="text-[10px] text-slate-400 font-black shrink-0">%</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl border-2 border-white shadow-sm shrink-0" style={{ background: sp.color ?? '#c8a87a' }} />
                          <span className="font-black text-slate-900">{sp.name}</span>
                          {(sp.markup ?? 0) > 0 && (
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-[10px] font-black">+{sp.markup}%</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button className={`${BTN_ICON} text-slate-400 hover:text-slate-700 hover:bg-slate-100`} onClick={() => setEditSpId(sp.id)}><Pencil size={13} /></button>
                          <button className={`${BTN_ICON} text-slate-300 hover:text-red-500 hover:bg-red-50`}
                            onClick={() => saveSpecies(species.filter(s => s.id !== sp.id))}><Trash2 size={13} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── DOOR MODELS ───────────────────────────────────────────────────── */}
        {activeTab === 'models' && (
          <>
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-2"><DoorOpen size={15} /> Door Models</h3>
              <button onClick={() => setAddingModel(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                <Plus size={13} /> Add Model
              </button>
            </div>
            <div className="p-6 space-y-2 max-w-xl">
              {addingModel && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                  <EditableRow value="" onSave={v => { saveModels([...models, { id: `dm${Date.now()}`, name: v }]); setAddingModel(false); }} onCancel={() => setAddingModel(false)} />
                </div>
              )}
              {models.map((m) => (
                <div key={m.id} className={ROW}>
                  {editModelId === m.id ? (
                    <EditableRow value={m.name}
                      onSave={v => { saveModels(models.map(x => x.id === m.id ? { ...x, name: v } : x)); setEditModelId(null); }}
                      onCancel={() => setEditModelId(null)} />
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><DoorOpen size={14} /></div>
                        <span className="font-black text-slate-900">{m.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button className={`${BTN_ICON} text-slate-400 hover:text-slate-700 hover:bg-slate-100`} onClick={() => setEditModelId(m.id)}><Pencil size={13} /></button>
                        <button className={`${BTN_ICON} text-slate-300 hover:text-red-500 hover:bg-red-50`} onClick={() => saveModels(models.filter(x => x.id !== m.id))}><Trash2 size={13} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PROFILE SIZES ─────────────────────────────────────────────────── */}
        {activeTab === 'profiles' && (
          <>
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-2"><Ruler size={15} /> Profile Sizes</h3>
              <button onClick={() => setAddingProf(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                <Plus size={13} /> Add Size
              </button>
            </div>
            <div className="p-6 space-y-2 max-w-2xl">
              {addingProf && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Label</label>
                    <input value={newProfLabel} onChange={e => setNewProfLabel(e.target.value)} placeholder="e.g. 900×2100mm" autoFocus
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none w-36" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Width (mm)</label>
                    <input type="number" value={newProfW} onChange={e => setNewProfW(e.target.value)} placeholder="900"
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none w-24" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Height (mm)</label>
                    <input type="number" value={newProfH} onChange={e => setNewProfH(e.target.value)} placeholder="2100"
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none w-24" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                    <div className="flex gap-1">
                      <button onClick={() => setNewProfType('surface')}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${newProfType === 'surface' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                        ⊞ Surface
                      </button>
                      <button onClick={() => setNewProfType('length')}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${newProfType === 'length' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'}`}>
                        ↔ Length
                      </button>
                    </div>
                  </div>
                  <button onClick={() => {
                    if (!newProfLabel.trim()) return;
                    saveProfiles([...profiles, { id: `ps${Date.now()}`, label: newProfLabel.trim(), mmW: +newProfW || 0, mmH: +newProfH || 0, measureType: newProfType }]);
                    setNewProfLabel(''); setNewProfW(''); setNewProfH(''); setNewProfType('surface'); setAddingProf(false);
                  }} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black h-fit">Save</button>
                  <button onClick={() => setAddingProf(false)} className="text-slate-400 text-xs font-bold h-fit">Cancel</button>
                </div>
              )}
              {profiles.map((pr) => (
                <div key={pr.id} className={`${ROW} flex-wrap gap-2`}>
                  {editProfId === pr.id && editProfData ? (
                    <div className="flex-1 flex flex-wrap items-end gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Label</label>
                        <input value={editProfData.label} onChange={e => setEditProfData({ ...editProfData, label: e.target.value })} autoFocus
                          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none w-36" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">W (mm)</label>
                        <input type="number" value={editProfData.mmW} onChange={e => setEditProfData({ ...editProfData, mmW: e.target.value })}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none w-24" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">H (mm)</label>
                        <input type="number" value={editProfData.mmH} onChange={e => setEditProfData({ ...editProfData, mmH: e.target.value })}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none w-24" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                        <div className="flex gap-1">
                          <button onClick={() => setEditProfData({ ...editProfData, measureType: 'surface' })}
                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${editProfData.measureType === 'surface' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            ⊞ Surface
                          </button>
                          <button onClick={() => setEditProfData({ ...editProfData, measureType: 'length' })}
                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${editProfData.measureType === 'length' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            ↔ Length
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-1 items-end pb-0.5">
                        <button onClick={() => {
                          if (!editProfData.label.trim()) return;
                          saveProfiles(profiles.map(x => x.id === pr.id ? { ...x, label: editProfData.label.trim(), mmW: +editProfData.mmW || 0, mmH: +editProfData.mmH || 0, measureType: editProfData.measureType } : x));
                          setEditProfId(null); setEditProfData(null);
                        }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Check size={14} /></button>
                        <button onClick={() => { setEditProfId(null); setEditProfData(null); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${pr.measureType === 'length' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {pr.measureType === 'length' ? '↔' : '⊞'}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{pr.label}</p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {pr.measureType === 'length' ? `${pr.mmW} mm — length` : `${pr.mmW} × ${pr.mmH} mm`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className={`${BTN_ICON} text-slate-400 hover:text-slate-700 hover:bg-slate-100`}
                          onClick={() => { setEditProfId(pr.id); setEditProfData({ label: pr.label, mmW: String(pr.mmW), mmH: String(pr.mmH), measureType: pr.measureType ?? 'surface' }); }}>
                          <Pencil size={13} />
                        </button>
                        <button className={`${BTN_ICON} text-slate-300 hover:text-red-500 hover:bg-red-50`} onClick={() => saveProfiles(profiles.filter(x => x.id !== pr.id))}><Trash2 size={13} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PRICE MATRIX ──────────────────────────────────────────────────── */}
        {activeTab === 'matrix' && (
          <>
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-2"><Grid2x2 size={15} /> Door Price Matrix</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Price per m² (SRD) — rows = models · columns = wood species</p>
              </div>
              <button onClick={saveMatrix}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${matrixSaved ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                {matrixSaved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Matrix</>}
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              {models.length === 0 ? (
                <p className="text-slate-400 text-sm font-medium py-8 text-center">Add door models in the Door Models tab first.</p>
              ) : (
                <table className="border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-44 border-b border-slate-100">Model ↓ · Species →</th>
                      {species.map(sp => (
                        <th key={sp.id} className="px-3 py-3 text-center min-w-[90px] border-b border-slate-100">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: sp.color ?? '#c8a87a' }} />
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-tight">{sp.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m, ri) => (
                      <tr key={m.id} className={ri % 2 === 0 ? 'bg-slate-50/50' : ''}>
                        <td className="px-4 py-3 font-black text-slate-800 text-xs whitespace-nowrap border-r border-slate-100">{m.name}</td>
                        {species.map(sp => (
                          <td key={sp.id} className="px-2 py-2 text-center">
                            <input
                              type="number"
                              value={getPrice(m.id, sp.id) || ''}
                              onChange={e => setPrice(m.id, sp.id, parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default ProductCategoriesPage;
