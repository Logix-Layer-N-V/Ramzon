import React, { useState, useContext, useMemo } from 'react';
import {
  Search, Plus, Filter, Wallet, Truck, ShoppingCart,
  Wrench, BarChart2, Tag, X, CheckCircle2, AlertCircle,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { mockExpenses } from '../lib/mock-data';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../lib/context';

const STATUS_OPTIONS = ['Paid', 'Unpaid'] as const;
const CATEGORY_OPTIONS = ['Logistics', 'Inventory', 'Rent & Utilities', 'Marketing', 'Tools & Machinery'] as const;

const getCategoryIcon = (cat: string) => {
  if (cat === 'Logistics') return <Truck size={16} />;
  if (cat === 'Inventory') return <ShoppingCart size={16} />;
  if (cat === 'Tools & Machinery') return <Wrench size={16} />;
  if (cat === 'Marketing') return <BarChart2 size={16} />;
  return <Tag size={16} />;
};

const getCategoryColor = (cat: string) => {
  if (cat === 'Logistics') return 'bg-blue-50 text-blue-600';
  if (cat === 'Inventory') return 'bg-orange-50 text-orange-600';
  if (cat === 'Tools & Machinery') return 'bg-slate-100 text-slate-600';
  if (cat === 'Marketing') return 'bg-purple-50 text-purple-600';
  return 'bg-teal-50 text-teal-600';
};

const ExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, currencySymbol } = useContext(LanguageContext);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customFromTime, setCustomFromTime] = useState('00:00');
  const [customTo, setCustomTo] = useState('');
  const [customToTime, setCustomToTime] = useState('23:59');

  const filtered = mockExpenses.filter(ex => {
    const matchSearch = ex.description.toLowerCase().includes(search.toLowerCase()) ||
      ex.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || ex.status === filterStatus;
    const matchCategory = filterCategory === 'All' || ex.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
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

  const totalOut = filtered.reduce((s, e) => s + e.amount, 0);
  const totalPaid = filtered.filter(e => e.status === 'Paid').reduce((s, e) => s + e.amount, 0);
  const totalUnpaid = filtered.filter(e => e.status === 'Unpaid').reduce((s, e) => s + e.amount, 0);

  const activeFilters = [filterStatus !== 'All', filterCategory !== 'All', filterPeriod !== 'all'].filter(Boolean).length;

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expenses</h1>
          <p className="text-sm font-medium text-slate-500 italic">Track overhead, logistics and inventory costs</p>
        </div>
        <button
          onClick={() => navigate('/expenses/new')}
          className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-red-700 transition-all flex items-center gap-2 shadow-xl shadow-red-100 active:scale-95"
        >
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Wallet size={20} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Outgoing</p>
            <p className="text-xl font-black text-slate-900">{currencySymbol}{totalOut.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Paid</p>
            <p className="text-xl font-black text-slate-900">{currencySymbol}{totalPaid.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertCircle size={20} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Unpaid</p>
            <p className="text-xl font-black text-slate-900">{currencySymbol}{totalUnpaid.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Search + Filter bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/20">
          <div className="flex-1 max-w-sm relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses or category..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-100 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              showFilters || activeFilters > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} /> Filters
            {activeFilters > 0 && (
              <span className="bg-white text-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-6 items-end animate-in fade-in duration-200">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <div className="flex gap-2 flex-wrap">
                {(['All', ...STATUS_OPTIONS] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      filterStatus === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</label>
              <div className="flex gap-2 flex-wrap">
                {(['All', ...CATEGORY_OPTIONS] as const).map(c => (
                  <button key={c} onClick={() => setFilterCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      filterCategory === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}>{c}</button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('period')}</label>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'today', 'week', 'month', 'quarter', 'custom'] as const).map(p => (
                  <button key={p} onClick={() => setFilterPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      filterPeriod === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}>
                    {p === 'all' ? t('all') : p === 'today' ? t('today') : p === 'week' ? t('week') : p === 'month' ? t('month') : p === 'quarter' ? t('quarter') : t('custom')}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom period */}
            {filterPeriod === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('customPeriod')}</label>
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex flex-col gap-1"><span className="text-[9px] font-bold text-slate-400 uppercase">{t('fromDate')}</span>
                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none" /></div>
                  <div className="flex flex-col gap-1"><span className="text-[9px] font-bold text-slate-400 uppercase">{t('time')}</span>
                    <input type="time" value={customFromTime} onChange={e => setCustomFromTime(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none" /></div>
                  <span className="text-slate-300 font-black mt-4">→</span>
                  <div className="flex flex-col gap-1"><span className="text-[9px] font-bold text-slate-400 uppercase">{t('toDate')}</span>
                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none" /></div>
                  <div className="flex flex-col gap-1"><span className="text-[9px] font-bold text-slate-400 uppercase">{t('time')}</span>
                    <input type="time" value={customToTime} onChange={e => setCustomToTime(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none" /></div>
                </div>
              </div>
            )}

            <button onClick={() => { setFilterStatus('All'); setFilterCategory('All'); setFilterPeriod('all'); setCustomFrom(''); setCustomTo(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
              <X size={12} /> {t('reset')}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <SortTh col="description" label="Description" />
                <SortTh col="category" label="Category" />
                <SortTh col="date" label="Date" />
                <SortTh col="status" label="Status" />
                <SortTh col="amount" label="Amount" className="text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400 font-bold">
                    No expenses found.
                  </td>
                </tr>
              )}
              {sorted.map(ex => (
                <tr
                  key={ex.id}
                  onClick={() => navigate(`/expenses/${ex.id}`)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${getCategoryColor(ex.category)}`}>
                        {getCategoryIcon(ex.category)}
                      </div>
                      <span className="font-bold text-slate-900">{ex.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ex.category}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-bold">{ex.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                      ex.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {ex.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 italic">
                    {currencySymbol}{ex.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''} found
          </p>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            {t('total')}: {currencySymbol}{totalOut.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
