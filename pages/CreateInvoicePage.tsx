import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Receipt, Users, Search, Send, Check, Sparkles, X, TrendingUp, Banknote, Ruler } from 'lucide-react';
import { LanguageContext } from '../lib/context';
import { InvoiceSchema } from '../lib/schemas';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { mockClients, mockInvoices, mockUsers, RAMZON_SERVICES, RAMZON_PRODUCT_CATALOG, RAMZON_HOUTSOORTEN } from '../lib/mock-data';
import { Estimate, Invoice, WoodSpecies } from '../types';
import { previewDocNumber, commitDocNumber } from '../lib/docNumbering';
import { getLatestExchangeRate, storage } from '../lib/storage';
import DocPDFModal from '../components/DocPDFModal';

type ItemType = 'product' | 'service' | 'item';
interface LineItem { id: string; type: ItemType; description: string; houtsoort: string; qty: number; unit: string; price: number; discount: number; taxRate: number; mmW?: number; mmH?: number; }
interface CatalogItem { id: string; type: ItemType; name: string; desc: string; price: number; unit: string; }

const SERVICE_ITEMS_INV = RAMZON_SERVICES.map(s => ({
  id: s.id, type: 'service' as ItemType, name: s.name, desc: s.description, price: s.price, unit: s.unit,
}));
const STATIC_PRODUCT_ITEMS_INV = RAMZON_PRODUCT_CATALOG.flatMap(cat =>
  cat.subcategories.map(sub => ({
    id: `${cat.category}-${sub.name}`, type: 'product' as ItemType,
    name: sub.name, desc: cat.category, price: sub.basePrice,
    unit: cat.category === 'Deuren' ? 'm²' : 'PCS',
  }))
);
const catToDescInv = (cat: string) => {
  if (cat === 'Doors') return 'Deuren';
  if (cat === 'Frames' || cat === 'Window Frames') return 'Kozijnen';
  return cat;
};

const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { currencySymbol, enableCrypto } = useContext(LanguageContext);
  const location = useLocation();
  const { id: editId } = useParams();
  const isEdit = !!editId;
  const [selectedClient, setSelectedClient] = useState('');
  const [currency, setCurrency] = useState('SRD');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [docTaxRate] = useState(21);
  const [items, setItems] = useState<LineItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [committedDocNumber, setCommittedDocNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [docNumber] = useState(() => isEdit ? '' : previewDocNumber('inv'));
  const [selectedRep, setSelectedRep] = useState<string>(() =>
    localStorage.getItem('erp_active_user_name') ?? mockUsers.find(u => u.role === 'Admin' && u.status === 'Active')?.name ?? ''
  );
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [itemSearch, setItemSearch] = useState('');
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const searchRef = useRef<HTMLDivElement>(null);

  // Dynamic catalog: merge services + storage products (fallback to static if empty)
  const [storedProducts] = useState(() => storage.products.get());
  const [woodSpeciesList] = useState<WoodSpecies[]>(() => {
    const s = storage.woodSpecies.get();
    return s.length > 0 ? s : [];
  });
  const getMarkup = (name: string) => woodSpeciesList.find(sp => sp.name === name)?.markup ?? 0;

  const catalogItems = useMemo<CatalogItem[]>(() => {
    const storedMapped: CatalogItem[] = storedProducts.map(p => ({
      id: p.id, type: 'product' as ItemType,
      name: p.name, desc: catToDescInv(p.category ?? ''),
      price: p.pricePerUnit,
      unit: (p.unit === 'pcs' || p.unit === 'PCS') ? 'PCS' : p.unit,
    }));
    const products: CatalogItem[] = storedMapped.length > 0 ? storedMapped : STATIC_PRODUCT_ITEMS_INV;
    return [...SERVICE_ITEMS_INV, ...products] as CatalogItem[];
  }, [storedProducts]);

  // Category chips derived from catalog
  const CATALOG_CATEGORIES = [
    { id: 'all',     label: 'All',      icon: '✦',  count: catalogItems.length },
    { id: 'service', label: 'Services', icon: '⚙️', count: catalogItems.filter(i => i.type === 'service').length },
    ...['Deuren','Mouldings','Lijsten','Kozijnen','Crating'].map(cat => ({
      id: cat,
      label: cat === 'Deuren' ? 'Doors' : cat === 'Lijsten' ? 'Boards' : cat === 'Kozijnen' ? 'Frames' : cat,
      icon:  cat === 'Deuren' ? '🚪' : cat === 'Mouldings' ? '〰️' : cat === 'Lijsten' ? '📏' : cat === 'Kozijnen' ? '🪟' : '📦',
      count: catalogItems.filter(i => i.desc === cat).length,
    })).filter(c => c.count > 0),
  ];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowItemSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (editId) {
      const existing = mockInvoices.find(i => i.id === editId);
      if (existing) {
        setSelectedClient(existing.clientId);
        if (existing.items?.length > 0) {
          setItems(existing.items.map(i => ({ id: (i as any).id || Math.random().toString(36).slice(2), type: 'item' as ItemType, description: (i as any).description || '', houtsoort: '', qty: (i as any).quantity || 1, unit: 'PCS', price: (i as any).unitPrice || 0, discount: 0, taxRate: (i as any).taxRate ?? 10 })));
        }
      }
    }
  }, [editId]);

  useEffect(() => {
    const state = location.state as { fromEstimate?: Estimate; fromDuplicate?: any };
    if (state?.fromEstimate) {
      const est = state.fromEstimate;
      setSelectedClient(est.clientId);
      setIsConverted(true);
      if (est.currency) setCurrency(est.currency);
      if (est.exchangeRate) setExchangeRate(est.exchangeRate);
      if (est.items?.length > 0) {
        setItems(est.items.map(i => ({ id: i.id, type: 'item' as ItemType, description: i.description, houtsoort: '', qty: i.quantity, unit: 'PCS', price: i.unitPrice, discount: 0, taxRate: (i as any).taxRate ?? 10 })));
      }
    } else if (state?.fromDuplicate) {
      const dup = state.fromDuplicate;
      if (dup.clientId) setSelectedClient(dup.clientId);
      if (dup.currency) setCurrency(dup.currency);
      if (dup.items?.length > 0) {
        setItems(dup.items.map((i: any) => ({
          id: Math.random().toString(36).slice(2),
          type: 'item' as ItemType,
          description: i.description || '',
          houtsoort: i.houtsoort || '',
          qty: i.quantity || i.qty || 1,
          unit: i.unit || 'PCS',
          price: i.unitPrice || i.price || 0,
          discount: 0,
          taxRate: i.taxRate ?? 10,
        })));
      }
    }
  }, [location.state]);

  // Auto-fill preferred currency when client changes
  useEffect(() => {
    if (selectedClient) {
      const c = mockClients.find(cl => cl.id === selectedClient);
      if (c?.preferredCurrency) setCurrency(c.preferredCurrency);
    }
  }, [selectedClient]);

  // Auto-fill exchange rate whenever currency changes (including on mount from conversion state)
  useEffect(() => {
    const latest = getLatestExchangeRate();
    if (!latest) return;
    if (currency === 'USD' || currency === 'USDT') setExchangeRate(latest.usdSrd);
    else if (currency === 'EUR') setExchangeRate(latest.eurSrd);
    else setExchangeRate(1);
  }, [currency]);

  const isSlashMode = itemSearch.startsWith('/');
  const slashCmd   = isSlashMode ? itemSearch.slice(1).toLowerCase() : '';
  const SLASH_MAP: Record<string, string> = {
    's':'service','se':'service','ser':'service','serv':'service','services':'service',
    'd':'Deuren','do':'Deuren','doo':'Deuren','door':'Deuren','doors':'Deuren','deuren':'Deuren',
    'm':'Mouldings','mo':'Mouldings','mou':'Mouldings','mould':'Mouldings','mouldings':'Mouldings',
    'b':'Lijsten','bo':'Lijsten','boa':'Lijsten','boar':'Lijsten','board':'Lijsten','boards':'Lijsten',
    'f':'Kozijnen','fr':'Kozijnen','fra':'Kozijnen','fram':'Kozijnen','frame':'Kozijnen','frames':'Kozijnen',
    'c':'Crating','cr':'Crating','cra':'Crating','crat':'Crating','crating':'Crating',
  };
  const filteredCatalog = (() => {
    let list = catalogItems;
    if (activeCategory !== 'all')
      list = list.filter(i => activeCategory === 'service' ? i.type === 'service' : i.desc === activeCategory);
    if (!isSlashMode && itemSearch.trim()) {
      const q = itemSearch.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
    }
    return (itemSearch.trim() || activeCategory !== 'all') ? list : list.slice(0, 15);
  })();

  const addFromCatalog = (item: typeof catalogItems[0]) => {
    setItems(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      type: item.type,
      description: item.type === 'product' ? `${item.desc} — ${item.name}` : item.name,
      houtsoort: item.type === 'product' ? RAMZON_HOUTSOORTEN[0] : '',
      qty: 1, unit: item.unit, price: item.price, discount: 0, taxRate: 10,
      mmW: item.unit === 'm²' ? 800 : undefined,
      mmH: item.unit === 'm²' ? 2100 : undefined,
    }]);
    setItemSearch('');
    setShowItemSearch(false);
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: Math.random().toString(36).slice(2), type: 'item', description: '', houtsoort: '', qty: 1, unit: 'PCS', price: 0, discount: 0, taxRate: 10 }]);
    setShowItemSearch(false);
    setItemSearch('');
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: keyof LineItem, val: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  const handleSave = () => {
    const result = InvoiceSchema.safeParse({
      clientId: selectedClient,
      date: invoiceDate,
      dueDate: dueDate,
      items: items.map(i => ({ description: i.description, qty: i.qty, price: i.price })),
    });
    if (!result.success) {
      alert(result.error.issues[0].message);
      return;
    }
    const num = isEdit ? docNumber : commitDocNumber('inv');
    setCommittedDocNumber(num);
    const clientObj = mockClients.find(c => c.id === selectedClient);
    const inv: Invoice = {
      id: isEdit && editId ? editId : Math.random().toString(36).slice(2, 10),
      invoiceNumber: num,
      clientId: selectedClient,
      clientName: clientObj?.name ?? selectedClient,
      date: invoiceDate,
      dueDate,
      currency,
      exchangeRate,
      items: items.map(i => ({
        id: i.id,
        productId: '',
        description: i.description,
        quantity: i.qty,
        unitPrice: i.price,
        total: itemTotal(i),
        taxRate: i.taxRate,
      })),
      subtotal,
      taxRate: docTaxRate,
      taxAmount: tax,
      totalAmount: total,
      status: 'Pending',
    };
    const existing = storage.invoices.get();
    if (isEdit && editId) {
      storage.invoices.save(existing.map(e => e.id === editId ? inv : e));
    } else {
      storage.invoices.save([...existing, inv]);
    }
    setSaved(true);
    setShowPdfModal(true);
  };

  const itemArea = (i: LineItem) => (i.mmW && i.mmH) ? (i.mmW / 1000) * (i.mmH / 1000) : 1;
  const itemSubtotal = (i: LineItem) => i.price * (1 + getMarkup(i.houtsoort) / 100) * i.qty * (1 - i.discount / 100) * itemArea(i);
  const itemTotal = (i: LineItem) => itemSubtotal(i) * (1 + i.taxRate / 100);
  // Locale-aware number formatter: USD → 1,234,567.89 · SRD/EUR → 1.234.567,89
  const fmt = (n: number) => n.toLocaleString(currency === 'USD' ? 'en-US' : 'nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const subtotal = items.reduce((acc, item) => acc + itemSubtotal(item), 0);
  const tax = items.reduce((acc, item) => acc + itemSubtotal(item) * item.taxRate / 100, 0);
  const total = subtotal + tax;

  return (
    <>
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/invoices')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all">
          <ArrowLeft size={18} /> Back to Invoices
        </button>
      </div>

      {isConverted && (
        <div className="bg-brand-accent-light border border-brand-accent/30 p-4 rounded-2xl flex items-center gap-4">
          <Sparkles className="text-brand-accent shrink-0" size={24} />
          <p className="text-xs font-black text-brand-primary uppercase tracking-widest">
            Data successfully imported from Quote {(location.state as any)?.fromEstimate?.estimateNumber}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Client + Date */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Receipt size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h2>
              {!isEdit && <p className="text-xs font-black text-slate-400 mt-0.5 font-mono">{docNumber}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={12} /> Select Client
              </label>
              <select aria-label="Select client" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none appearance-none">
                <option value="">-- Select a Client --</option>
                {mockClients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Date</label>
              <input aria-label="Invoice date" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary/50"
              />
            </div>

            {/* Currency + Rate row */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={12}/> Currency
              </label>
              <select aria-label="Currency" value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none appearance-none">
                <option value="SRD">🇸🇷 SRD</option>
                <option value="USD">🇺🇸 USD</option>
                <option value="EUR">🇪🇺 EUR</option>
                {enableCrypto && <option value="USDT">💵 USDT</option>}
              </select>
            </div>
            {currency !== 'SRD' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exchange Rate (to SRD)</label>
                <input type="number" step="0.01" value={exchangeRate}
                  onChange={e => setExchangeRate(parseFloat(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"/>
                <p className="text-[10px] text-slate-400 font-medium">1 {currency} = SRD {(exchangeRate).toFixed(2)}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={12} /> Sales Rep
              </label>
              <select aria-label="Sales rep" value={selectedRep} onChange={e => { setSelectedRep(e.target.value); localStorage.setItem('erp_active_user_name', e.target.value); }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none appearance-none">
                <option value="">— No Rep —</option>
                {mockUsers.filter(u => u.status === 'Active').map(u => (
                  <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Banknote size={12} /> Partial Payment ({currencySymbol})
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={paidAmount || ''}
                placeholder="0.00"
                onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
              />
              {paidAmount > 0 && (
                <p className="text-[10px] font-black text-emerald-600">
                  Saldo: {currencySymbol}{Math.max(0, total - paidAmount).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Line Items</h3>
            {items.length > 0 && (
              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {items.length} item{items.length !== 1 ? 's' : ''} · {currencySymbol}{fmt(subtotal)}
              </span>
            )}
          </div>

          {/* Smart Search Bar */}
          <div ref={searchRef} className="relative w-full md:w-1/2">
            <div className={`flex items-center gap-3 px-4 py-3 border rounded-2xl transition-all duration-200 ${showItemSearch ? 'border-blue-400 bg-white shadow-lg shadow-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}>
              <Search size={15} className={`shrink-0 transition-colors ${showItemSearch ? 'text-blue-500' : 'text-slate-400'}`} />
              <input
                type="text"
                value={itemSearch}
                onChange={e => {
                  const val = e.target.value;
                  setItemSearch(val);
                  setShowItemSearch(true);
                  // Slash shortcut: exact match applies category
                  if (val.startsWith('/') && SLASH_MAP[val.slice(1).toLowerCase()]) {
                    setActiveCategory(SLASH_MAP[val.slice(1).toLowerCase()]);
                    setItemSearch('');
                  }
                }}
                onFocus={() => setShowItemSearch(true)}
                placeholder={activeCategory !== 'all' ? `Search in ${CATALOG_CATEGORIES.find(c=>c.id===activeCategory)?.label ?? activeCategory}…` : 'Search products & services…  or type  /  to filter by category'}
                className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 placeholder:font-normal"
              />
              {/* Active category pill */}
              {activeCategory !== 'all' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full shrink-0">
                  <span className="text-xs">{CATALOG_CATEGORIES.find(c => c.id === activeCategory)?.icon}</span>
                  <span className="text-[10px] font-black">{CATALOG_CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
                  <button onClick={() => setActiveCategory('all')} className="hover:text-blue-900 transition-colors ml-0.5"><X size={10}/></button>
                </div>
              )}
              {itemSearch && (
                <button onClick={() => setItemSearch('')} className="text-slate-300 hover:text-slate-600 transition-colors p-0.5 shrink-0"><X size={13}/></button>
              )}
              {!showItemSearch && (
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 border border-slate-200 rounded text-[9px] font-black text-slate-400 bg-slate-100 shrink-0">/</kbd>
              )}
            </div>

            {/* Dropdown */}
            {showItemSearch && (
              <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl mt-2 overflow-hidden animate-in fade-in zoom-in-[0.98] duration-150">

                {/* ── Slash Command Mode ────────────────────────────────── */}
                {isSlashMode ? (
                  <div className="p-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Filter by category</p>
                    <div className="space-y-0.5">
                      {CATALOG_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                        const match = slashCmd === '' || cat.label.toLowerCase().startsWith(slashCmd) || cat.id.toLowerCase().startsWith(slashCmd);
                        if (!match) return null;
                        return (
                          <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setItemSearch(''); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-lg group-hover:scale-110 transition-transform shrink-0">{cat.icon}</div>
                            <div className="flex-1">
                              <span className="text-sm font-black text-slate-900">/{cat.label.toLowerCase()}</span>
                              <span className="text-[11px] text-slate-400 ml-2">→ show {cat.label} only</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{cat.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ── Category Chips ────────────────────────────────── */}
                    <div className="flex gap-1.5 px-3 py-2.5 border-b border-slate-100 overflow-x-auto no-scrollbar">
                      {CATALOG_CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                          {cat.id !== 'all' && (
                            <span className={`text-[9px] font-black ml-0.5 ${activeCategory === cat.id ? 'text-white/50' : 'text-slate-400'}`}>{cat.count}</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* ── Results (grouped) ─────────────────────────────── */}
                    <div className="max-h-72 overflow-y-auto no-scrollbar">
                      {filteredCatalog.length === 0 ? (
                        <div className="py-10 text-center">
                          <div className="text-3xl mb-2">🔍</div>
                          <p className="text-sm font-black text-slate-400">No results{itemSearch ? ` for "${itemSearch}"` : ''}</p>
                          <p className="text-[11px] text-slate-300 mt-1">Try another search or clear the category filter</p>
                        </div>
                      ) : (() => {
                        const services = filteredCatalog.filter(i => i.type === 'service');
                        const products = filteredCatalog.filter(i => i.type === 'product');
                        const grouped: Record<string, CatalogItem[]> = products.reduce<Record<string, CatalogItem[]>>((acc, item) => { if (!acc[item.desc]) acc[item.desc] = []; acc[item.desc].push(item); return acc; }, {});
                        return (
                          <>
                            {services.length > 0 && (
                              <div>
                                <div className="px-4 py-1.5 sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-50">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">⚙️ Services</p>
                                </div>
                                {services.map(item => (
                                  <button key={item.id} onClick={() => addFromCatalog(item)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group border-b border-slate-50 last:border-0">
                                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                      <span className="text-base">⚙️</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-sm font-black text-slate-900">{currencySymbol}{item.price.toFixed(2)}</p>
                                      <p className="text-[9px] text-slate-400">per {item.unit}</p>
                                    </div>
                                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full shrink-0 ml-1">SERVICE</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {Object.entries(grouped).map(([cat, catItems]) => (
                              <div key={cat}>
                                <div className="px-4 py-1.5 sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-50">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">📦 {cat}</p>
                                </div>
                                {catItems.map(item => (
                                  <button key={item.id} onClick={() => addFromCatalog(item)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left group border-b border-slate-50 last:border-0">
                                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                      <span className="text-base">📦</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-sm font-black text-slate-900">{currencySymbol}{item.price.toFixed(2)}</p>
                                      <p className="text-[9px] text-slate-400">per {item.unit}</p>
                                    </div>
                                    <span className="text-[8px] font-black px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full shrink-0 ml-1">PRODUCT</span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className="border-t border-slate-100 bg-slate-50/50">
                  <button onClick={addItem}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-100 transition-colors text-sm font-black text-slate-600 text-left">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Plus size={12} className="text-emerald-600"/>
                    </div>
                    Add custom line item
                    <span className="ml-auto text-[9px] text-slate-400 font-bold bg-slate-200 px-1.5 py-0.5 rounded">BLANK</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Receipt size={20} className="text-slate-300"/>
              </div>
              <p className="text-sm font-black text-slate-400">No line items yet</p>
              <p className="text-xs text-slate-300 mt-1">
                Search above or type <kbd className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[10px] font-black text-slate-500 border border-slate-200">/</kbd> to filter by category
              </p>
            </div>
          )}

          {/* Line items table */}
          {items.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              {/* Column header */}
              <div className="hidden md:grid md:grid-cols-[64px_76px_1fr_38px_64px_84px_110px_48px_110px] gap-1.5 px-3 py-1.5 bg-slate-50 border-b border-slate-200">
                {[
                  { label: 'Qty',       align: '' },
                  { label: 'Wood',      align: '' },
                  { label: 'Description', align: '' },
                  { label: 'Unit',      align: 'text-center' },
                  { label: 'BTW%',      align: 'text-center' },
                  { label: 'Price',     align: 'text-right pr-2' },
                  { label: 'Subtotaal', align: 'text-right pr-2' },
                  { label: 'Disc %',    align: 'text-right pr-1' },
                  { label: 'Total',     align: 'text-right pr-2' },
                ].map(({ label, align }, i) => (
                  <p key={i} className={`text-[7px] font-black text-slate-400 uppercase tracking-widest ${align}`}>{label}</p>
                ))}
              </div>
              {items.map((item, idx) => (
                <React.Fragment key={item.id}>
                <div
                  className="relative flex flex-wrap md:grid md:grid-cols-[64px_76px_1fr_38px_64px_84px_110px_48px_110px] gap-1.5 items-center px-3 py-2 border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                  {/* Qty */}
                  <input type="number" value={item.qty} min={0} onChange={e => updateItem(item.id,'qty',+e.target.value)} aria-label="Quantity"
                    className="w-full px-1.5 py-1 border border-slate-200 bg-transparent rounded-lg text-xs font-bold outline-none text-center hover:border-slate-300 focus:border-blue-300 focus:bg-white transition-all"/>
                  {/* Wood type */}
                  {item.type === 'product' ? (
                    <div className="flex flex-row items-center gap-0.5 w-full">
                      <select value={item.houtsoort} onChange={e => updateItem(item.id,'houtsoort',e.target.value)} aria-label="Wood type"
                        className="flex-1 min-w-0 px-1.5 py-1 border border-slate-200 bg-transparent rounded-lg text-[10px] font-bold outline-none hover:border-slate-300 focus:border-blue-300 focus:bg-white transition-all">
                        {RAMZON_HOUTSOORTEN.map(h => <option key={h}>{h}</option>)}
                      </select>
                      {item.houtsoort && getMarkup(item.houtsoort) > 0 && (
                        <span className="shrink-0 px-1 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[8px] font-black">+{getMarkup(item.houtsoort)}%</span>
                      )}
                    </div>
                  ) : <div className="hidden md:block"/>}
                  {/* Description */}
                  <input value={item.description} onChange={e => updateItem(item.id,'description',e.target.value)}
                    placeholder="Description…"
                    className="flex-1 md:flex-none min-w-0 px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white rounded-lg text-xs font-medium outline-none transition-all placeholder:text-slate-300"/>
                  {/* Unit */}
                  <input value={item.unit} onChange={e => updateItem(item.id,'unit',e.target.value)} aria-label="Unit" placeholder="PCS"
                    className="w-full px-1.5 py-1 border border-slate-200 bg-transparent rounded-lg text-[10px] font-bold outline-none text-center hover:border-slate-300 focus:border-blue-300 focus:bg-white transition-all"/>
                  {/* BTW% — before Price */}
                  <select value={item.taxRate} onChange={e => updateItem(item.id,'taxRate',+e.target.value)} aria-label="BTW rate"
                    className="w-full px-1.5 py-1 border border-slate-200 bg-white rounded-lg text-xs font-bold outline-none hover:border-slate-300 focus:border-blue-300 transition-all text-center">
                    <option value={0}>0%</option>
                    <option value={10}>10%</option>
                  </select>
                  {/* Price */}
                  <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg px-2 py-1 hover:border-slate-300 focus-within:border-blue-300 focus-within:bg-white transition-all">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{currencySymbol}</span>
                    <input type="number" value={item.price} min={0} onChange={e => updateItem(item.id,'price',+e.target.value)} aria-label="Price"
                      className="flex-1 bg-transparent text-xs font-bold outline-none min-w-0 text-right"/>
                  </div>
                  {/* Subtotaal (pre-tax) */}
                  <div className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-black text-right w-full">
                    {currencySymbol}{fmt(itemSubtotal(item))}
                  </div>
                  {/* Discount */}
                  <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg px-1.5 py-1 hover:border-slate-300 focus-within:border-blue-300 focus-within:bg-white transition-all">
                    <input type="number" value={item.discount} min={0} max={100} onChange={e => updateItem(item.id,'discount',+e.target.value)} aria-label="Discount"
                      className="flex-1 bg-transparent text-xs font-bold outline-none min-w-0 text-right"/>
                    <span className="text-[10px] text-slate-400 shrink-0">%</span>
                  </div>
                  {/* Total (incl. markup + discount + tax) */}
                  <div className="px-2 py-1 bg-slate-900 text-white rounded-lg text-xs font-black text-right w-full">
                    {currencySymbol}{fmt(itemTotal(item))}
                  </div>
                  {/* Delete — absolute overlay on hover */}
                  <button onClick={() => removeItem(item.id)} title="Remove line"
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-white/90 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-sm">
                    <Trash2 size={11}/>
                  </button>
                </div>
                {/* Measurement sub-row — only for m² product items */}
                {item.unit === 'm²' && item.type === 'product' && (
                  <div className="flex items-center gap-2 flex-wrap pl-[188px] pr-4 pb-2.5 -mt-1 border-b border-slate-100 bg-slate-50/40">
                    <Ruler size={11} className="text-slate-400 shrink-0"/>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Afmeting:</span>
                    <input type="number" value={item.mmW ?? ''} min={0}
                      onChange={e => updateItem(item.id, 'mmW', +e.target.value)}
                      placeholder="Breedte"
                      className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-center bg-white outline-none focus:border-blue-300"/>
                    <span className="text-slate-300 font-bold text-sm">×</span>
                    <input type="number" value={item.mmH ?? ''} min={0}
                      onChange={e => updateItem(item.id, 'mmH', +e.target.value)}
                      placeholder="Hoogte"
                      className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-center bg-white outline-none focus:border-blue-300"/>
                    <span className="text-[10px] text-slate-400 font-bold">mm</span>
                    {item.mmW && item.mmH ? (
                      <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[10px] font-black">
                        = {((item.mmW / 1000) * (item.mmH / 1000)).toFixed(4)} m²
                      </span>
                    ) : null}
                    <span className="ml-auto text-[9px] text-slate-400 font-bold italic">prijs is per m²</span>
                  </div>
                )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Summary Bar — Full Width */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl">
          <div className="flex flex-wrap items-center gap-6 justify-between">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Subtotal</p>
                <p className="text-xl font-black">{currencySymbol}{fmt(subtotal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">VAT</p>
                <p className="text-xl font-black">{currencySymbol}{fmt(tax)}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-1">Total Amount</p>
                <p className="text-3xl font-black text-emerald-400">{currencySymbol}{fmt(total)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                <Send size={14} /> Send via Email
              </button>
              {isEdit && (
                <button
                  onClick={() => navigate('/payments/new', { state: { fromInvoice: { invoiceId: editId, clientId: selectedClient, total } } })}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-lg"
                >
                  <Banknote size={14} /> Record Payment
                </button>
              )}
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all active:scale-95">
                {saved ? <Check size={14} /> : <Save size={14} />}
                {saved ? 'Processing...' : 'Finalize Invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showPdfModal && (
      <DocPDFModal
        docType="invoice"
        docNumber={committedDocNumber}
        date={invoiceDate}
        clientName={mockClients.find(c => c.id === selectedClient)?.name ?? selectedClient}
        clientCompany={mockClients.find(c => c.id === selectedClient)?.company}
        clientAddress={mockClients.find(c => c.id === selectedClient)?.address}
        clientPhone={mockClients.find(c => c.id === selectedClient)?.phone}
        clientEmail={mockClients.find(c => c.id === selectedClient)?.email}
        clientVAT={mockClients.find(c => c.id === selectedClient)?.vatNumber}
        rep={selectedRep || undefined}
        paidAmount={paidAmount > 0 ? paidAmount : undefined}
        currency={currency}
        currencySymbol={currencySymbol}
        items={items.map(i => ({
          id: i.id,
          description: i.description,
          houtsoort: i.houtsoort,
          spec: '',
          qty: i.qty,
          unit: i.unit,
          price: i.price,
          discount: i.discount,
          taxRate: i.taxRate,
          mmW: i.mmW,
          mmH: i.mmH,
        }))}
        subtotal={subtotal}
        tax={tax}
        total={total}
        onClose={() => { setShowPdfModal(false); navigate('/invoices'); }}
      />
    )}
    </>
  );
};

export default CreateInvoicePage;
