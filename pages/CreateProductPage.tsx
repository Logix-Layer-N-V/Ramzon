import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, Check, Package, Ruler, Calculator, Box, Plus, Hash, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockWoodProducts } from '../lib/mock-data';
import { storage } from '../lib/storage';
import type { DoorModel, ProfileSize, WoodSpecies, DoorPriceEntry } from '../types';

const PRODUCT_CATEGORIES = ['Doors', 'Mouldings', 'Frames', 'Window Frames', 'Crating'];
const CRATE_TYPES = ['Standard crate (small)', 'Standard crate (medium)', 'Standard crate (large)', 'Custom crate', 'Pallet box', 'Export crate'];
const MOULDING_PRODUCTS = ['Crown moulding', 'Skirting board', 'Architrave', 'Fascia board', 'Ceiling moulding', 'Door casing'];
const FRAME_SIZES = ['18×40mm', '18×60mm', '18×80mm', '25×50mm', '25×75mm', '25×100mm', '32×100mm'];
const WINDOW_FRAME_SIZES = ['56×56mm', '56×69mm', '56×89mm', '70×70mm', '70×90mm', '90×90mm', '140×90mm'];

const DEFAULT_DOOR_MODELS: DoorModel[] = [
  { id: 'dm1', name: 'Panel door' }, { id: 'dm2', name: 'Classic door' },
  { id: 'dm3', name: 'Stile & rail door' }, { id: 'dm4', name: 'Sliding door' },
  { id: 'dm5', name: 'Overlay door' }, { id: 'dm6', name: 'Louvre door' },
];
const DEFAULT_PROFILE_SIZES: ProfileSize[] = [
  { id: 'ps1', label: '800×2100mm', mmW: 800, mmH: 2100 },
  { id: 'ps2', label: '900×2100mm', mmW: 900, mmH: 2100 },
  { id: 'ps3', label: '1000×2200mm', mmW: 1000, mmH: 2200 },
  { id: 'ps4', label: '1200×2400mm', mmW: 1200, mmH: 2400 },
];
const DEFAULT_WOOD_SPECIES: WoodSpecies[] = [
  { id: 'ws1', name: 'Teak', color: '#c8a87a' }, { id: 'ws2', name: 'Oak', color: '#d4a96a' },
  { id: 'ws3', name: 'Mahogany', color: '#8b3a2a' }, { id: 'ws4', name: 'Pine', color: '#e8c98a' },
  { id: 'ws5', name: 'Kopi', color: '#6b4226' }, { id: 'ws6', name: 'Purpleheart', color: '#6a3772' },
  { id: 'ws7', name: 'Wenge', color: '#3d2b1f' }, { id: 'ws8', name: 'Ipe', color: '#5c3a1a' },
];

function initList<T>(key: string, defaults: T[]): T[] {
  const saved = storage[key as keyof typeof storage]?.get?.() as T[] | undefined;
  if (saved && (saved as T[]).length > 0) return saved as T[];
  return defaults;
}

const INPUT = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-slate-400';
const LABEL = 'text-[10px] font-black text-slate-400 uppercase tracking-widest';

function InlineAdd({ label, onAdd }: { label: string; onAdd: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  return open ? (
    <div className="flex gap-2 mt-2">
      <input value={val} onChange={e => setVal(e.target.value)} placeholder={`New ${label}...`}
        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
        onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); setOpen(false); } }}
      />
      <button onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); setOpen(false); } }}
        className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">Add</button>
      <button onClick={() => setOpen(false)} className="px-3 py-2 text-slate-400 text-xs font-bold">Cancel</button>
    </div>
  ) : (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 font-bold mt-2">
      <Plus size={12}/> Add {label}
    </button>
  );
}

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [saved, setSaved] = useState(false);
  const [category, setCategory] = useState('Doors');

  // Door wizard state
  const [doorStep, setDoorStep] = useState(1);
  const [sku, setSku] = useState('');
  const [skuManual, setSkuManual] = useState(false);
  const [doorModels, setDoorModels] = useState<DoorModel[]>(() => initList('doorModels', DEFAULT_DOOR_MODELS));
  const [profileSizes, setProfileSizes] = useState<ProfileSize[]>(() => initList('profileSizes', DEFAULT_PROFILE_SIZES));
  const [woodSpeciesList, setWoodSpeciesList] = useState<WoodSpecies[]>(() => initList('woodSpecies', DEFAULT_WOOD_SPECIES));
  const [priceMatrix, setPriceMatrix] = useState<DoorPriceEntry[]>(() => storage.doorPriceMatrix.get());

  const [selectedModel, setSelectedModel] = useState<DoorModel | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileSize | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<WoodSpecies | null>(null);

  // Other fields
  const [name, setName] = useState('');
  const [breedte, setBreedte] = useState<number>(800);
  const [hoogte, setHoogte] = useState<number>(2100);
  const [thickness, setThickness] = useState<number>(40);
  const [pricePerM2, setPricePerM2] = useState<number>(0);
  const [priceManual, setPriceManual] = useState(false);
  const [stock, setStock] = useState<number>(0);

  // Non-door fields
  const [crateType, setCrateType] = useState(CRATE_TYPES[0]);
  const [mouldingProduct, setMouldingProduct] = useState(MOULDING_PRODUCTS[0]);
  const [frameSize, setFrameSize] = useState(FRAME_SIZES[0]);
  const [windowFrameSize, setWindowFrameSize] = useState(WINDOW_FRAME_SIZES[0]);
  const [lengte, setLengte] = useState<number>(2400);
  const [houtsoort, setHoutsoort] = useState('Teak');
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [unit, setUnit] = useState('m²');

  useEffect(() => {
    if (category === 'Doors') setUnit('m²');
    else if (['Mouldings', 'Frames', 'Window Frames'].includes(category)) setUnit('lm');
    else setUnit('pcs');
  }, [category]);

  // Auto-generate SKU from selections
  useEffect(() => {
    if (category === 'Doors' && !skuManual && selectedModel && selectedProfile && selectedSpecies) {
      const m = selectedModel.name.split(' ').map(w => w[0]).join('').toUpperCase();
      const p = selectedProfile.label.replace('mm','').replace('×','-');
      const w = selectedSpecies.name.substring(0, 3).toUpperCase();
      setSku(`D-${m}-${p}-${w}`);
    }
  }, [selectedModel, selectedProfile, selectedSpecies, skuManual, category]);

  // Auto-fill price from matrix
  useEffect(() => {
    if (category === 'Doors' && !priceManual && selectedModel && selectedSpecies) {
      const entry = priceMatrix.find(e => e.modelId === selectedModel.id && e.woodSpeciesId === selectedSpecies.id);
      if (entry) setPricePerM2(entry.pricePerM2);
    }
  }, [selectedModel, selectedSpecies, priceMatrix, priceManual, category]);

  // Sync profile dimensions to door size inputs
  useEffect(() => {
    if (selectedProfile) {
      setBreedte(selectedProfile.mmW);
      setHoogte(selectedProfile.mmH);
    }
  }, [selectedProfile]);

  useEffect(() => {
    if (id) {
      const p = mockWoodProducts.find(x => x.id === id);
      if (p) {
        setName(p.name); setHoutsoort(p.woodType);
        setCategory((p as any).category || 'Doors');
        setPricePerUnit(p.pricePerUnit); setStock(p.stock);
        setUnit(p.unit); setBreedte(p.width); setHoogte(p.length); setThickness(p.thickness);
      }
    }
  }, [id]);

  const oppervlakte = useMemo(() => (breedte / 1000) * (hoogte / 1000), [breedte, hoogte]);
  const totalPrice = useMemo(() => {
    if (category === 'Doors') return oppervlakte * pricePerM2;
    if (['Mouldings', 'Frames', 'Window Frames'].includes(category)) return (lengte / 1000) * pricePerUnit;
    return pricePerUnit;
  }, [category, oppervlakte, lengte, pricePerUnit, pricePerM2]);

  const addDoorModel = (name: string) => {
    const updated = [...doorModels, { id: `dm${Date.now()}`, name }];
    setDoorModels(updated); storage.doorModels.save(updated);
  };
  const addProfileSize = (label: string) => {
    const parts = label.replace('mm','').split('×');
    const updated = [...profileSizes, { id: `ps${Date.now()}`, label: label.includes('mm') ? label : `${label}mm`, mmW: +(parts[0]||0), mmH: +(parts[1]||0) }];
    setProfileSizes(updated); storage.profileSizes.save(updated);
  };
  const addWoodSpecies = (name: string) => {
    const updated = [...woodSpeciesList, { id: `ws${Date.now()}`, name }];
    setWoodSpeciesList(updated); storage.woodSpecies.save(updated);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => navigate('/products'), 1200);
  };

  const doorStepComplete = (step: number) => {
    if (step === 1) return sku.length > 0;
    if (step === 2) return selectedModel !== null;
    if (step === 3) return selectedProfile !== null;
    if (step === 4) return selectedSpecies !== null;
    return false;
  };

  const STEP_LABELS = ['SKU #', 'Door Model', 'Profile Size', 'Wood Species'];

  const renderDoorWizard = () => (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => {
          const step = i + 1;
          const done = doorStepComplete(step);
          const active = doorStep === step;
          return (
            <React.Fragment key={step}>
              <button onClick={() => setDoorStep(step)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all ${
                  active ? 'bg-slate-900 text-white' : done ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400 hover:text-slate-700'
                }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  active ? 'bg-white/20' : done ? 'bg-emerald-500 text-white' : 'bg-slate-200'
                }`}>{done && !active ? <Check size={10}/> : step}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {i < 3 && <ChevronRight size={12} className="text-slate-300 flex-shrink-0"/>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step 1: SKU */}
      {doorStep === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl">
            <Hash size={16} className="text-amber-600"/>
            <p className="text-xs font-bold text-amber-700">SKU is auto-generated once you pick Model, Profile & Species. You can also set it manually.</p>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>SKU #</label>
            <input value={sku} onChange={e => { setSku(e.target.value); setSkuManual(true); }}
              placeholder="e.g. D-PD-900-2100-TEA"
              className={INPUT}/>
            {skuManual && <button onClick={() => { setSkuManual(false); }} className="text-xs text-slate-400 hover:text-slate-700 font-bold">↺ Auto-generate</button>}
          </div>
          <button onClick={() => setDoorStep(2)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black">
            Next: Door Model <ChevronRight size={14}/>
          </button>
        </div>
      )}

      {/* Step 2: Door Model */}
      {doorStep === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-2 gap-2">
            {doorModels.map(m => (
              <button key={m.id} onClick={() => setSelectedModel(m)}
                className={`px-4 py-3 rounded-xl text-sm font-bold border text-left transition-all ${
                  selectedModel?.id === m.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700'
                }`}>{m.name}</button>
            ))}
          </div>
          <InlineAdd label="door model" onAdd={addDoorModel}/>
          {selectedModel && (
            <button onClick={() => setDoorStep(3)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black">
              Next: Profile Size <ChevronRight size={14}/>
            </button>
          )}
        </div>
      )}

      {/* Step 3: Profile Size */}
      {doorStep === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-2 gap-2">
            {profileSizes.map(p => (
              <button key={p.id} onClick={() => setSelectedProfile(p)}
                className={`px-4 py-3 rounded-xl text-sm font-bold border text-left transition-all ${
                  selectedProfile?.id === p.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700'
                }`}>
                <div className="font-black">{p.label}</div>
                <div className="text-xs opacity-60">{(p.mmW/1000).toFixed(2)} × {(p.mmH/1000).toFixed(2)} m</div>
              </button>
            ))}
          </div>
          <InlineAdd label="profile size (e.g. 900×2100mm)" onAdd={addProfileSize}/>
          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className={LABEL}>Width (mm)</label>
              <input type="number" value={breedte} onChange={e => setBreedte(+e.target.value)} className={INPUT}/>
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Height (mm)</label>
              <input type="number" value={hoogte} onChange={e => setHoogte(+e.target.value)} className={INPUT}/>
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Thickness (mm)</label>
              <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} className={INPUT}/>
            </div>
          </div>
          {selectedProfile && (
            <button onClick={() => setDoorStep(4)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black">
              Next: Wood Species <ChevronRight size={14}/>
            </button>
          )}
        </div>
      )}

      {/* Step 4: Wood Species */}
      {doorStep === 4 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-2 gap-2">
            {woodSpeciesList.map(ws => (
              <button key={ws.id} onClick={() => setSelectedSpecies(ws)}
                className={`px-4 py-3 rounded-xl text-sm font-bold border text-left transition-all flex items-center gap-3 ${
                  selectedSpecies?.id === ws.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700'
                }`}>
                {ws.color && <span className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10" style={{ backgroundColor: ws.color }}/>}
                {ws.name}
              </button>
            ))}
          </div>
          <InlineAdd label="wood species" onAdd={addWoodSpecies}/>
        </div>
      )}
    </div>
  );

  const renderCategoryFields = () => {
    switch (category) {
      case 'Doors': return renderDoorWizard();
      case 'Mouldings':
        return (<>
          <div className="space-y-1.5">
            <label className={LABEL}>Moulding Product</label>
            <select value={mouldingProduct} onChange={e => setMouldingProduct(e.target.value)} className={INPUT}>
              {MOULDING_PRODUCTS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Length (mm)</label>
            <input type="number" value={lengte} onChange={e => setLengte(+e.target.value)} className={INPUT}/>
          </div>
        </>);
      case 'Frames':
        return (<>
          <div className="space-y-1.5">
            <label className={LABEL}>Profile Size</label>
            <select value={frameSize} onChange={e => setFrameSize(e.target.value)} className={INPUT}>
              {FRAME_SIZES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Length (mm)</label>
            <input type="number" value={lengte} onChange={e => setLengte(+e.target.value)} className={INPUT}/>
          </div>
        </>);
      case 'Window Frames':
        return (<>
          <div className="space-y-1.5">
            <label className={LABEL}>Cross-section Size</label>
            <select value={windowFrameSize} onChange={e => setWindowFrameSize(e.target.value)} className={INPUT}>
              {WINDOW_FRAME_SIZES.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Length (mm)</label>
            <input type="number" value={lengte} onChange={e => setLengte(+e.target.value)} className={INPUT}/>
          </div>
        </>);
      case 'Crating':
        return (
          <div className="space-y-1.5">
            <label className={LABEL}>Crate Type</label>
            <select value={crateType} onChange={e => setCrateType(e.target.value)} className={INPUT}>
              {CRATE_TYPES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        );
      default: return null;
    }
  };

  const isDoor = category === 'Doors';
  const doorReady = isDoor && selectedModel && selectedProfile && selectedSpecies && sku;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/products')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16}/> Back to Catalog
        </button>
        <button onClick={handleSave} disabled={isDoor && !doorReady}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all disabled:opacity-40">
          {saved ? <Check size={16}/> : <Save size={16}/>} {saved ? 'Saved...' : isEdit ? 'Save Changes' : 'Save Product'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Category tabs */}
          <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
            <h3 className={`${LABEL} mb-4`}>Category</h3>
            <div className="grid grid-cols-5 gap-2">
              {PRODUCT_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-3 rounded-xl text-xs font-black border transition-all ${
                    category === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Package size={22}/></div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{isEdit ? 'Edit Product' : 'New Product'}</h2>
                <p className="text-xs text-slate-400 font-medium">Category: {category}</p>
              </div>
            </div>

            {!isDoor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className={LABEL}>Product Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. Teak ${category}...`} className={INPUT}/>
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL}>Wood Type</label>
                  <input value={houtsoort} onChange={e => setHoutsoort(e.target.value)} className={INPUT}/>
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL}>Unit</label>
                  <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-black text-slate-600">{unit}</div>
                </div>
              </div>
            )}

            {isDoor && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <div className="flex gap-2 flex-wrap">
                  {selectedModel && <span className="px-3 py-1 bg-slate-200 rounded-full text-xs font-black">{selectedModel.name}</span>}
                  {selectedProfile && <span className="px-3 py-1 bg-slate-200 rounded-full text-xs font-black">{selectedProfile.label}</span>}
                  {selectedSpecies && (
                    <span className="px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 bg-slate-200">
                      {selectedSpecies.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedSpecies.color }}/>}
                      {selectedSpecies.name}
                    </span>
                  )}
                  {sku && <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black font-mono">{sku}</span>}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <h3 className={`${LABEL} flex items-center gap-2`}><Ruler size={12}/> {category} configuration</h3>
              {renderCategoryFields()}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-slate-900 p-8 rounded-[28px] text-white shadow-2xl space-y-6 sticky top-24">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">Price & Stock</h3>
            <div className="space-y-4">
              {isDoor ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Price per m²</label>
                    {!priceManual && <span className="text-[9px] text-emerald-400 font-bold">Auto from matrix</span>}
                  </div>
                  <input type="number" value={pricePerM2} min={0}
                    onChange={e => { setPricePerM2(+e.target.value); setPriceManual(true); }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-black text-white outline-none"/>
                  {priceManual && <button onClick={() => setPriceManual(false)} className="text-[10px] text-white/40 hover:text-white/70 font-bold">↺ Use matrix price</button>}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Price per {unit}</label>
                  <input type="number" value={pricePerUnit} min={0} onChange={e => setPricePerUnit(+e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-black text-white outline-none"/>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Opening Stock</label>
                <div className="relative">
                  <Box size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                  <input type="number" value={stock} min={0} onChange={e => setStock(+e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-black text-white outline-none"/>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calculator size={14} className="text-amber-400"/>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Price Calculator</p>
              </div>
              {isDoor && (
                <>
                  <div className="flex justify-between text-xs font-bold opacity-60"><span>{breedte}×{hoogte}mm</span><span>{oppervlakte.toFixed(4)} m²</span></div>
                  <div className="flex justify-between text-xs font-bold opacity-60"><span>Price / m²</span><span>SRD {pricePerM2.toFixed(2)}</span></div>
                </>
              )}
              {['Mouldings','Frames','Window Frames'].includes(category) && (
                <>
                  <div className="flex justify-between text-xs font-bold opacity-60"><span>Length</span><span>{(lengte/1000).toFixed(2)} lm</span></div>
                  <div className="flex justify-between text-xs font-bold opacity-60"><span>Price / lm</span><span>SRD {pricePerUnit}</span></div>
                </>
              )}
              <div className="h-px bg-white/10"/>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-white/60">Unit Price</span>
                <span className="text-2xl font-black text-amber-400">SRD {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handleSave} disabled={isDoor && !doorReady}
              className="w-full py-3 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
              <Save size={14}/> {isEdit ? 'Save' : 'Add Product'}
            </button>

            {isDoor && !doorReady && (
              <p className="text-[10px] text-white/30 text-center">Complete all 4 steps to save</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProductPage;
