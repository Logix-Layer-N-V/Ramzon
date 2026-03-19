import React, { useState, useContext, useMemo } from 'react';
import { LanguageContext } from '../lib/context';
import { Search, Plus, Package, Ruler, Pencil, Trash2, Settings2, ChevronUp, ChevronDown } from 'lucide-react';
import { storage } from '../lib/storage';
import { useNavigate } from 'react-router-dom';
import type { WoodProduct } from '../types';

const CATEGORIES = ['All', 'Doors', 'Mouldings', 'Frames', 'Window Frames', 'Crating'];

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, currencySymbol } = useContext(LanguageContext);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<WoodProduct[]>(() => storage.products.get());

  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    const updated = products.filter(p => p.id !== id);
    storage.products.save(updated);
    setProducts(updated);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.woodType.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || (p as any).category === activeCategory;
    return matchSearch && matchCat;
  });

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (typeof av === 'number' && typeof bv === 'number')
        return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''));
    });
  }, [filtered, sortKey, sortDir]);

  const SortTh = ({ col, label, className }: { col: string; label: string; className?: string }) => (
    <th
      className={`px-6 py-4 cursor-pointer select-none group ${className ?? ''}`}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col -space-y-0.5 opacity-30 group-hover:opacity-60 transition-opacity">
          <ChevronUp size={9} className={sortKey === col && sortDir === 'asc' ? '!opacity-100 text-slate-700' : ''} strokeWidth={3}/>
          <ChevronDown size={9} className={sortKey === col && sortDir === 'desc' ? '!opacity-100 text-slate-700' : ''} strokeWidth={3}/>
        </span>
      </span>
    </th>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('productCatalog')}</h1>
          <p className="text-sm font-medium text-slate-500 italic">{t('manageProducts')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/products/categories')}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            <Settings2 size={14} /> Configure Types
          </button>
          <button
            onClick={() => navigate('/products/new')}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl active:scale-95"
          >
            <Plus size={18} /> {t('newProductBtn')}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
              activeCategory === cat
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex items-center gap-4">
          <div className="flex-1 max-w-sm relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product or wood species..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm"
            />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} products</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <SortTh col="name" label="Product / Wood Species" />
                <SortTh col="category" label="Category" />
                <th className="px-6 py-4">Dimensions (mm)</th>
                <th className="px-6 py-4 text-center">Unit</th>
                <SortTh col="stock" label="Stock" className="text-center" />
                <SortTh col="pricePerUnit" label="Price / Unit" className="text-right" />
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">{p.name}</div>
                        {p.woodType && <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">{p.woodType}</div>}
                        {(p as any).sku && <div className="text-[9px] font-bold text-slate-400 mt-0.5">#{(p as any).sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black">
                      {(p as any).category || 'Doors'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg w-fit">
                      <Ruler size={12} />
                      {p.thickness > 0 ? `${p.thickness} × ` : ''}{p.width} × {p.length}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-slate-400 italic">{p.unit}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      p.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 italic">{currencySymbol}{p.pricePerUnit.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        title="Edit"
                        onClick={() => navigate(`/products/edit/${p.id}`)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Package size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="font-bold text-sm text-slate-400">
                {products.length === 0 ? 'No products yet' : 'No products match your filter'}
              </p>
              {products.length === 0 && (
                <button
                  onClick={() => navigate('/products/new')}
                  className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all"
                >
                  + Add first product
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
