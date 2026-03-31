import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, Check, Package, Ruler, Calculator, Box, Plus, Hash, ChevronRight, Pencil, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { storage } from '../lib/storage';
import type { DoorModel, DoorPriceEntry, WoodProduct } from '../types';

// ─── Fallback lists (if localStorage is empty) ────────────────────────────────
const DEFAULT_DOOR_MODELS: DoorModel[] = [
  { id: 'dm1', name: 'Panel door' },       { id: 'dm2', name: 'Classic door' },
  { id: 'dm3', name: 'Stile & rail door' },{ id: 'dm4', name: 'Sliding door' },
  { id: 'dm5', name: 'Overlay door' },     { id: 'dm6', name: 'Louvre door' },
];

const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: 'Doors',         pricingType: 'm2'  },
  { id: 'cat2', name: 'Mouldings',     pricingType: 'lm'  },
  { id: 'cat3', name: 'Frames',        pricingType: 'lm'  },
  { id: 'cat4', name: 'Window Frames', pricingType: 'lm'  },
  { id: 'cat5', name: 'Crating',       pricingType: 'pcs' },
];

function initList<T>(key: string, defaults: T[]): T[] {
  const saved = storage[key as keyof typeof storage]?.get?.() as T[] | undefined;
  if (saved && (saved as T[]).length > 0) return saved as T[];
  return defaults;
}

const INPUT = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-slate-400 transition-colors';
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

// ─── Tax rate options ─────────────────────────────────────────────────────────
const TAX_OPTIONS = [
  { value: 0,  label: '0%',  desc: 'Exempt' },
  { value: 10, label: '10%', desc: 'Reduced rate' },
  { value: 21, label: '21%', desc: 'Standard rate' },
];

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [saved, setSaved] = useState(false);

  // ── Categories (from localStorage) ──────────────────────────────────────────
  const [categories] = useState<any[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('erp_product_categories') ?? 'null');
      if (!saved || saved.some((c: any) => !c.pricingType)) return DEFAULT_CATEGORIES;
      return saved;
    } catch { return DEFAULT_CATEGORIES; }
  });
  const [category, setCategory] = useState(categories[0]?.name ?? 'Doors');
  const activeCat = categories.find((c: any) => c.name === category) ?? categories[0];

  // ── Shared product fields (all categories) ──────────────────────────────────
  const [productName, setProductName]   = useState('');
  const [description, setDescription]   = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState<0 | 10 | 21>(21);

  // ── Door wizard state (2 steps: SKU + Model) ─────────────────────────────────
  const [doorStep, setDoorStep] = useState(1);
  const [sku, setSku]           = useState('');
  const [skuManual, setSkuManual] = useState(false);

  // Models: load all, filter by category
  const [allModels, setAllModels] = useState<any[]>(() => {
    const m = storage.doorModels.get();
    const base = m.length ? m : DEFAULT_DOOR_MODELS;
    // migrate orphaned models to first category
    return base.map((x: any) => x.categoryId ? x : { ...x, categoryId: 'cat1' });
  });
  const [selectedModel, setSelectedModel] = useState<DoorModel | null>(null);

  const [priceMatrix]   = useState<DoorPriceEntry[]>(() => storage.doorPriceMatrix.get());
  const [breedte, setBreedte]     = useState<number>(800);
  const [hoogte, setHoogte]       = useState<number>(2100);
  const [thickness, setThickness] = useState<number>(40);
  const [pricePerM2, setPricePerM2] = useState<number>(0);
  const [priceManual, setPriceManual] = useState(false);

  // ── Non-door fields ─────────────────────────────────────────────────────────
  const [stock, setStock]           = useState<number>(0);
  const [lengte, setLengte]         = useState<number>(2400);
  const [houtsoort, setHoutsoort]   = useState('Teak');
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [unit, setUnit]             = useState('m²');
  const [calculationType, setCalculationType] = useState<'pcs' | 'm2' | 'lm'>('lm');

  // ── Category change effects ──────────────────────────────────────────────────
  useEffect(() => {
    const pt = activeCat?.pricingType ?? 'pcs';
    if (pt === 'm2') { setUnit('m²'); setCalculationType('m2'); }
    else if (pt === 'lm') { setCalculationType('lm'); }
    else { setCalculationType('pcs'); }
  }, [category]);

  useEffect(() => {
    if (activeCat?.pricingType !== 'm2') {
      setUnit(calculationType === 'm2' ? 'm²' : calculationType === 'lm' ? 'lm' : 'pcs');
    }
  }, [calculationType, category]);

  // ── Auto-generate SKU (when model selected) ─────────────────────────────────
  useEffect(() => {
    const isDoor = activeCat?.pricingType === 'm2';
    if (isDoor && !skuManual && selectedModel) {
      const m = selectedModel.name.split(' ').map((w: string) => w[0]).join('').toUpperCase();
      setSku(`D-${m}`);
    }
  }, [selectedModel, skuManual, category]);

  // ── Load existing product for edit ──────────────────────────────────────────
  useEffect(() => {
    if (id) {
      const p = storage.products.get().find((x: WoodProduct) => x.id === id);
      if (p) {
        setProductName(p.name); setHoutsoort(p.woodType);
        setCategory(p.category || categories[0]?.name || 'Doors');
        setPricePerUnit(p.pricePerUnit); setStock(p.stock);
        setUnit(p.unit); setBreedte(p.width); setHoogte(p.length); setThickness(p.thickness);
        if (p.sku) setSku(p.sku);
        if (p.calculationType) setCalculationType(p.calculationType);
        if ((p as any).description) setDescription((p as any).description);
        if ((p as any).defaultTaxRate !== undefined) setDefaultTaxRate((p as any).defaultTaxRate);
      }
    }
  }, [id]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isDoor     = activeCat?.pricingType === 'm2';
  const oppervlakte = useMemo(() => (breedte / 1000) * (hoogte / 1000), [breedte, hoogte]);
  const totalPrice  = useMemo(() => {
    if (isDoor) return oppervlakte * pricePerM2;
    if (activeCat?.pricingType === 'lm') return (lengte / 1000) * pricePerUnit;
    return pricePerUnit;
  }, [isDoor, activeCat, oppervlakte, lengte, pricePerUnit, pricePerM2]);

  // Models for selected category
  const catModels = allModels.filter((m: any) => m.categoryId === activeCat?.id);
  const addModelForCat = (name: string) => {
    const updated = [...allModels, { id: `dm${Date.now()}`, name, categoryId: activeCat?.id ?? 'cat1' }];
    setAllModels(updated); storage.doorModels.save(updated);
  };

  // ── Step completion ──────────────────────────────────────────────────────────
  const STEP_LABELS = ['SKU #', 'Model'];
  const doorStepComplete = (step: number) => {
    if (step === 1) return sku.length > 0;
    if (step === 2) return selectedModel !== null;
    return false;
  };
  const doorReady = isDoor && selectedModel && sku;

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const finalName = productName.trim() || (isDoor && selectedModel ? selectedModel.name : category);
    const product: WoodProduct & { [k: string]: any } = {
      id: id ?? `prod_${Date.now()}`,
      name: finalName,
      woodType: isDoor ? '' : houtsoort,
      thickness: isDoor ? 40 : thickness,
      width:  breedte,
      length: isDoor ? hoogte : (activeCat?.pricingType === 'lm' ? lengte : 0),
      unit: (isDoor ? 'm²' : unit) as WoodProduct['unit'],
      pricePerUnit: isDoor ? pricePerM2 : pricePerUnit,
      stock,
      category,
      calculationType: isDoor ? 'm2' : calculationType,
      description,
      defaultTaxRate,
      ...(isDoor && { sku, modelId: selectedModel?.id }),
    };
    const existing = storage.products.get();
    if (id) {
      storage.products.save(existing.map((p: WoodProduct) => p.id === id ? product : p));
    } else {
      storage.products.save([...existing, product]);
    }
    setSaved(true);
    setTimeout(() => navigate('/products'), 1200);
  };

  // ── Door wizard (2 steps) ─────────────────────────────────────────────────────
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
              {i < 1 && <ChevronRight size={12} className="text-slate-300 flex-shrink-0"/>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step 1: SKU */}
      {doorStep === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl">
            <Hash size={16} className="text-amber-600"/>
            <p className="text-xs font-bold text-amber-700">SKU is auto-generated once you pick a Model & Wood Species. You can also set it manually.</p>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>SKU #</label>
            <input value={sku} onChange={e => { setSku(e.target.value); setSkuManual(true); }}
              placeholder="e.g. D-PD-TEA"
              className={INPUT}/>
            {skuManual && <button onClick={() => setSkuManual(false)} className="text-xs text-slate-400 hover:text-slate-700 font-bold">↺ Auto-generate</button>}
          </div>
          <button onClick={() => setDoorStep(2)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black">
            Next: Model <ChevronRight size={14}/>
          </button>
        </div>
      )}

      {/* Step 2: Model */}
      {doorStep === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          {catModels.length === 0 ? (
            <div className="py-6 text-center text-sm font-bold text-slate-400">
              No models for this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {catModels.map((m: any) => (
                <button key={m.id} onClick={() => setSelectedModel(m)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold border text-left transition-all ${
                    selectedModel?.id === m.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-700'
                  }`}>{m.name}</button>
              ))}
            </div>
          )}
          <InlineAdd label="model" onAdd={addModelForCat}/>
        </div>
      )}

    </div>
  );

  // ── Non-door category fields ──────────────────────────────────────────────────
  const renderCategoryFields = () => {
    if (isDoor) return renderDoorWizard();
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className={LABEL}>Wood Type / Material</label>
          <input value={houtsoort} onChange={e => setHoutsoort(e.target.value)} className={INPUT}/>
        </div>
        {activeCat?.pricingType === 'lm' && (
          <div className="space-y-1.5">
            <label className={LABEL}>Length (mm)</label>
            <input type="number" value={lengte} onChange={e => setLengte(+e.target.value)} className={INPUT}/>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
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

          {/* Category tabs (from localStorage) */}
          <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
            <h3 className={`${LABEL} mb-4`}>Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat: any) => (
                <button key={cat.id} onClick={() => { setCategory(cat.name); setSelectedModel(null); setDoorStep(1); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${
                    category === cat.name ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main form card */}
          <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Package size={22}/></div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{isEdit ? 'Edit Product' : 'New Product'}</h2>
                <p className="text-xs text-slate-400 font-medium">Category: {category}</p>
              </div>
            </div>

            {/* Product name + description (ALL categories) */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={LABEL}>Product Name</label>
                <input value={productName} onChange={e => setProductName(e.target.value)}
                  placeholder={isDoor && selectedModel ? selectedModel.name : `e.g. ${category} product...`}
                  className={INPUT}/>
                {isDoor && !productName && selectedModel && (
                  <p className="text-[10px] text-slate-400 font-medium">Auto: "{selectedModel.name}"</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className={LABEL}>Product Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Enter a product description..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-slate-400 transition-colors resize-none"/>
              </div>
            </div>

            {/* Calculation type (non-door) */}
            {!isDoor && (
              <div className="space-y-2">
                <label className={LABEL}>Calculation Type</label>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => setCalculationType('pcs')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${calculationType === 'pcs' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                    📦 Fixed Item (PCS)
                  </button>
                  <button type="button" onClick={() => setCalculationType('m2')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${calculationType === 'm2' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-brand-primary'}`}>
                    ⊞ Area-based (m²)
                  </button>
                  <button type="button" onClick={() => setCalculationType('lm')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${calculationType === 'lm' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300'}`}>
                    ↔ Length-based (lm)
                  </button>
                </div>
              </div>
            )}

            {/* Door selection summary */}
            {isDoor && (selectedModel || sku) && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl flex-wrap">
                {selectedModel && <span className="px-3 py-1 bg-slate-200 rounded-full text-xs font-black">{selectedModel.name}</span>}
                {sku && <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black font-mono">{sku}</span>}
              </div>
            )}

            {/* Category-specific configuration */}
            <div className="space-y-4 pt-4 border-t border-slate-50">
              <h3 className={`${LABEL} flex items-center gap-2`}><Ruler size={12}/> {category} Configuration</h3>
              {renderCategoryFields()}
            </div>
          </div>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 p-8 rounded-[28px] text-white shadow-2xl space-y-6 sticky top-24">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">Price & Stock</h3>

            {/* Price input */}
            <div className="space-y-4">
              {isDoor ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Price per m²</label>
                    {!priceManual && <span className="text-[9px] text-emerald-400 font-bold">Auto matrix</span>}
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

              {/* Stock */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Opening Stock</label>
                <div className="relative">
                  <Box size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
                  <input type="number" value={stock} min={0} onChange={e => setStock(+e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm font-black text-white outline-none"/>
                </div>
              </div>

              {/* Default Tax Rate */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Standard VAT Rate</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TAX_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setDefaultTaxRate(opt.value as 0 | 10 | 21)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all flex flex-col items-center gap-0.5 ${
                        defaultTaxRate === opt.value
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                      }`}>
                      <span>{opt.label}</span>
                      <span className="text-[8px] opacity-70 font-medium">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price calculator */}
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
              {activeCat?.pricingType === 'lm' && (
                <>
                  <div className="flex justify-between text-xs font-bold opacity-60"><span>Length</span><span>{(lengte/1000).toFixed(2)} lm</span></div>
                  <div className="flex justify-between text-xs font-bold opacity-60"><span>Price / lm</span><span>SRD {pricePerUnit}</span></div>
                </>
              )}
              <div className="flex justify-between text-xs font-bold opacity-60"><span>BTW</span><span>{defaultTaxRate}%</span></div>
              <div className="h-px bg-white/10"/>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-white/60">Unit price</span>
                <span className="text-2xl font-black text-amber-400">SRD {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handleSave} disabled={isDoor && !doorReady}
              className="w-full py-3 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
              <Save size={14}/> {isEdit ? 'Save Changes' : 'Add Product'}
            </button>

            {isDoor && !doorReady && (
              <p className="text-[10px] text-white/30 text-center">Select a model and enter a SKU to save</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProductPage;
