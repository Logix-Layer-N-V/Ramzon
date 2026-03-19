
import React, { useState, useContext } from 'react';
import {
  Globe2,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Trash2,
  Pencil,
  Calendar,
  Save,
  CheckCircle2,
  X,
  History,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { LanguageContext } from '../lib/context';
import { storage } from '../lib/storage';
import type { ExchangeRate } from '../types';

// Convert storage ExchangeRate → display row format
const rateToRow = (r: ExchangeRate) => ({
  id: r.id, date: r.date,
  usd: r.usdSrd.toString(), srd: '1.00',
  eur: r.eurSrd.toString(), usdt: r.usdSrd.toString(),
});

const DEFAULT_RATES: ExchangeRate[] = [
  { id: 'r1', date: '2026-03-05', usdSrd: 36.50, eurSrd: 39.80, eurUsd: 1.09 },
  { id: 'r2', date: '2026-03-04', usdSrd: 36.40, eurSrd: 39.70, eurUsd: 1.09 },
  { id: 'r3', date: '2026-03-03', usdSrd: 36.35, eurSrd: 39.60, eurUsd: 1.09 },
];

const CurrencyManagementPage: React.FC = () => {
  const { t, availableCurrencies, setAvailableCurrencies } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState<'list' | 'tracking'>('tracking');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showCurrencyForm, setShowCurrencyForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Daily tracking history — loaded from storage, falls back to defaults
  const initRates = () => {
    const saved = storage.exchangeRates.get();
    if (saved.length === 0) { storage.exchangeRates.save(DEFAULT_RATES); return DEFAULT_RATES.map(rateToRow); }
    return saved.sort((a, b) => b.date.localeCompare(a.date)).map(rateToRow);
  };
  const [dailyRates, setDailyRates] = useState(initRates);

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    usd: '',
    srd: '1.00',
    eur: '',
    usdt: ''
  });

  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    symbol: '',
    status: 'Active'
  });

  const [editingCurrency, setEditingCurrency] = useState<{ id: string; code: string; name: string; symbol: string; status: string } | null>(null);

  const handleExportCSV = () => {
    const headers = ['Date', 'USD Rate', 'SRD Base', 'EUR Rate', 'USDT Rate'];
    const rows = dailyRates.map(r => [r.date, r.usd, r.srd, r.eur, r.usdt]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exchange-rates-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddEntry = () => {
    if (!newEntry.usd || !newEntry.eur) return;
    const usdSrd = parseFloat(newEntry.usd);
    const eurSrd = parseFloat(newEntry.eur);
    const newRate: ExchangeRate = {
      id: Math.random().toString(36).substr(2, 9),
      date: newEntry.date,
      usdSrd,
      eurSrd,
      eurUsd: usdSrd > 0 ? eurSrd / usdSrd : 1.09,
    };
    // Persist to storage — replace if same date already exists
    const existing = storage.exchangeRates.get();
    storage.exchangeRates.save([newRate, ...existing.filter(r => r.date !== newEntry.date)]);
    // Update display list
    setDailyRates([rateToRow(newRate), ...dailyRates.filter(r => r.date !== newEntry.date)]);
    setShowEntryForm(false);
    setNewEntry({ date: new Date().toISOString().split('T')[0], usd: '', srd: '1.00', eur: '', usdt: '' });
  };

  const handleDeleteRate = (rateId: string) => {
    storage.exchangeRates.save(storage.exchangeRates.get().filter(r => r.id !== rateId));
    setDailyRates(prev => prev.filter(r => r.id !== rateId));
  };

  const handleAddCurrency = () => {
    if (!newCurrency.code || !newCurrency.name) return;
    const currency = {
      id: Math.random().toString(36).substr(2, 9),
      ...newCurrency
    };
    setAvailableCurrencies([...availableCurrencies, currency]);
    setShowCurrencyForm(false);
    setNewCurrency({ code: '', name: '', symbol: '', status: 'Active' });
  };

  const removeCurrency = (id: string) => {
    setAvailableCurrencies(availableCurrencies.filter(c => c.id !== id));
  };

  const handleSaveEdit = () => {
    if (!editingCurrency || !editingCurrency.code || !editingCurrency.name) return;
    setAvailableCurrencies(availableCurrencies.map(c => c.id === editingCurrency.id ? editingCurrency : c));
    setEditingCurrency(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Currency Control Center</h1>
          <p className="text-sm font-medium text-slate-500">Centralized management for multi-currency operations and daily exchange logs</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'tracking' && (
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  showFilters || filterPeriod !== 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter size={14} /> {t('filters')}
                {filterPeriod !== 'all' && (
                  <span className="bg-white text-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">1</span>
                )}
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                <Download size={14} /> {t('export')}
              </button>
            </>
          )}
          <button
            onClick={() => activeTab === 'tracking' ? setShowEntryForm(true) : setShowCurrencyForm(true)}
            className="bg-brand-primary text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-xl active:scale-95"
          >
            <Plus size={16} /> {activeTab === 'tracking' ? 'New Daily Log' : 'Add Unit'}
          </button>
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab('tracking')}
          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === 'tracking' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <TrendingUp size={14} /> Exchange Tracking
        </button>
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Globe2 size={14} /> Available Units
        </button>
      </div>

      <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            {activeTab === 'tracking' ? (
              <>
                <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-brand-primary">
                      <History size={16} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Rate History Log</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <Calendar size={14} /> {dailyRates.length} entries
                  </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                  <div className="px-8 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-6 items-end animate-in fade-in duration-200">
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
                    {filterPeriod === 'custom' && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('custom')}</label>
                        <div className="flex gap-3 items-center">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{t('from')}</span>
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none" />
                          </div>
                          <span className="text-slate-300 mt-4">→</span>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{t('to')}</span>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none" />
                          </div>
                        </div>
                      </div>
                    )}
                    <button onClick={() => { setFilterPeriod('all'); setCustomFrom(''); setCustomTo(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
                      <X size={12} /> {t('reset')}
                    </button>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5">Date / Updated</th>
                        <th className="px-4 py-5 text-center">USD Rate</th>
                        <th className="px-4 py-5 text-center bg-slate-100/50">SRD (Base)</th>
                        <th className="px-4 py-5 text-center">EURO Rate</th>
                        <th className="px-4 py-5 text-center">USDT Rate</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dailyRates.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-4">
                            <span className="font-bold text-slate-400 tracking-tighter">{row.date}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-black text-slate-900 text-lg italic">{row.usd}</span>
                          </td>
                          <td className="px-4 py-4 text-center bg-slate-50/30 font-bold text-slate-400">
                            {row.srd}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-black text-brand-primary text-lg italic">{row.eur}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-black text-orange-600 text-lg italic">{row.usdt}</span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <button onClick={() => handleDeleteRate(row.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Supported Billing Units</h3>
                  <button className="text-[10px] font-black text-brand-primary hover:underline uppercase tracking-widest">Global Standards</button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableCurrencies.map((c) => (
                    <div key={c.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-xl font-black text-slate-900">
                          {c.symbol}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight">{c.code}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{c.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-100">
                          {c.status}
                        </span>
                        <button
                          onClick={() => setEditingCurrency({ ...c })}
                          className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => removeCurrency(c.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
      </div>

      {/* Daily Entry Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowEntryForm(false)}></div>
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                  <ArrowUpDown size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight italic">Log Daily Rates</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Tracking Input</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEntryForm(false)}
                className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl text-slate-400 hover:text-slate-950 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Date</label>
                <input 
                  type="date" 
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-2 focus:ring-brand-accent-light outline-none transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-600 rounded-full"></span> USD Rate
                  </label>
                  <input 
                    type="number" step="0.01" placeholder="0.00"
                    value={newEntry.usd}
                    onChange={(e) => setNewEntry({...newEntry, usd: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SRD (Static)</label>
                  <input readOnly value="1.00" className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-lg font-black outline-none cursor-not-allowed opacity-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 bg-emerald-600 rounded-full"></span> EURO Rate
                  </label>
                  <input 
                    type="number" step="0.01" placeholder="0.00"
                    value={newEntry.eur}
                    onChange={(e) => setNewEntry({...newEntry, eur: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 bg-orange-600 rounded-full"></span> USDT Rate
                  </label>
                  <input 
                    type="number" step="0.01" placeholder="0.00"
                    value={newEntry.usdt}
                    onChange={(e) => setNewEntry({...newEntry, usdt: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black outline-none focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowEntryForm(false)}
                  className="flex-1 py-4 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={handleAddEntry}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Record Log Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Currency Modal */}
      {showCurrencyForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowCurrencyForm(false)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Globe2 size={20} />
                </div>
                <h3 className="font-black text-slate-900 tracking-tight italic">Register Unit</h3>
              </div>
              <button onClick={() => setShowCurrencyForm(false)} className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl text-slate-400 hover:text-slate-950">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ISO Code</label>
                <input 
                  type="text" placeholder="e.g. GBP"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                <input 
                  type="text" placeholder="e.g. Pound Sterling"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Symbol</label>
                <input 
                  type="text" placeholder="e.g. £"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <button 
                onClick={handleAddCurrency}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all mt-4"
              >
                Save Currency Unit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Currency Modal */}
      {editingCurrency && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setEditingCurrency(null)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight italic">Edit Currency Unit</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modify billing unit</p>
                </div>
              </div>
              <button onClick={() => setEditingCurrency(null)} className="p-2.5 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl text-slate-400 hover:text-slate-950">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ISO Code</label>
                <input
                  type="text" placeholder="e.g. GBP"
                  value={editingCurrency.code}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
                <input
                  type="text" placeholder="e.g. Pound Sterling"
                  value={editingCurrency.name}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Symbol</label>
                <input
                  type="text" placeholder="e.g. £"
                  value={editingCurrency.symbol}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, symbol: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                <select
                  value={editingCurrency.status}
                  onChange={(e) => setEditingCurrency({ ...editingCurrency, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingCurrency(null)}
                  className="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-[2] py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyManagementPage;
