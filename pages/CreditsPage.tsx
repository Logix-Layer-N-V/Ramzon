
import React, { useState, useContext, useMemo } from 'react';
import { Search, Filter, Plus, CreditCard, FileText, CheckCircle2, Pencil, ExternalLink, X, Coins, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockCredits, mockClients } from '../lib/mock-data';
import { LanguageContext } from '../lib/context';
import { storage } from '../lib/storage';

const STATUS_OPTIONS = ['Available', 'Used'] as const;

const CreditsPage: React.FC = () => {
  const { t, currencySymbol } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [refresh, setRefresh] = useState(0);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customFromTime, setCustomFromTime] = useState('00:00');
  const [customTo, setCustomTo] = useState('');
  const [customToTime, setCustomToTime] = useState('23:59');

  // merge localStorage credits (user-created/edited) on top of mock data
  const allCredits = useMemo(() => {
    const stored = storage.credits.get();
    if (stored.length === 0) return mockCredits;
    const storedIds = new Set(stored.map(c => c.id));
    const mockOnly = mockCredits.filter(c => !storedIds.has(c.id));
    return [...mockOnly, ...stored];
  }, [refresh]);

  const handleDeleteCredit = (id: string) => {
    if (!window.confirm('Credit note verwijderen?')) return;
    const updated = allCredits.filter(c => c.id !== id);
    storage.credits.save(updated.filter(c => !mockCredits.find(m => m.id === c.id)));
    setRefresh(r => r + 1);
  };

  const allClients = useMemo(() => {
    const stored = storage.clients.get();
    const ids = new Set(stored.map(c => c.id));
    return [...mockClients.filter(c => !ids.has(c.id)), ...stored];
  }, []);

  const filteredCredits = allCredits.filter(c => {
    const client = allClients.find(cl => cl.id === c.clientId);
    const matchSearch = client?.company.toLowerCase().includes(search.toLowerCase()) ||
           c.reason.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const sorted = useMemo(() => {
    if (!sortKey) return filteredCredits;
    return [...filteredCredits].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (typeof av === 'number' && typeof bv === 'number')
        return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''));
    });
  }, [filteredCredits, sortKey, sortDir]);

  const totalAvailable = filteredCredits.filter(c => c.status === 'Available').reduce((s, c) => s + c.amount, 0);

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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('credits')}</h1>
          <p className="text-sm font-medium text-slate-500 italic">Manage client balance adjustments and returns</p>
        </div>
        <button onClick={() => navigate('/credits/new')} className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition-all flex items-center gap-2 shadow-xl active:scale-95">
          <Plus size={18} /> {t('newCreditBtn')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Coins size={20} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Credit</p>
            <p className="text-xl font-black text-slate-900">{currencySymbol}{totalAvailable.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Credits</p>
            <p className="text-xl font-black text-slate-900">{filteredCredits.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search + Filter bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/20">
          <div className="flex-1 max-w-sm relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search credits or clients..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              showFilters || filterStatus !== 'All' || filterPeriod !== 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} /> Filters
            {(filterStatus !== 'All' || filterPeriod !== 'all') && (
              <span className="bg-white text-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
                {[filterStatus !== 'All', filterPeriod !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-6 items-end animate-in fade-in duration-200">
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
            <button onClick={() => { setFilterStatus('All'); setFilterPeriod('all'); setCustomFrom(''); setCustomTo(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
              <X size={12} /> {t('reset')}
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <SortTh col="reason" label="Client / Reason" />
                <SortTh col="status" label="Status" />
                <SortTh col="date" label="Issue Date" />
                <SortTh col="amount" label="Amount" className="text-right" />
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((c) => {
                const client = allClients.find(cl => cl.id === c.clientId);
                return (
                  <tr 
                    key={c.id} 
                    onClick={() => navigate(`/credits/${c.id}`)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          <CreditCard size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate leading-tight">{client?.company || 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight line-clamp-1 italic">{c.reason}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        c.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {c.status === 'Available' && <CheckCircle2 size={10} />} {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-400 tracking-tight">{c.date}</td>
                    <td className="px-6 py-4 text-right font-black text-blue-600 italic">
                      {currencySymbol}{c.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button title="Bewerken"
                          onClick={(e) => { e.stopPropagation(); navigate(`/credits/edit/${c.id}`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        ><Pencil size={15}/></button>
                        <button title="Bekijk detail"
                          onClick={(e) => { e.stopPropagation(); navigate(`/credits/${c.id}`); }}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        ><ExternalLink size={15}/></button>
                        <button title="Document"
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        ><FileText size={15}/></button>
                        <button title="Verwijderen"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCredit(c.id); }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        ><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filteredCredits.length} credit{filteredCredits.length !== 1 ? 's' : ''} found
          </p>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            {currencySymbol}{totalAvailable.toLocaleString()} available
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreditsPage;
