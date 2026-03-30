
import React, { useState, useContext, useMemo } from 'react';
import { Search, Filter, ArrowDownCircle, Download, ExternalLink, Plus, Pencil, X, CheckCircle2, Banknote, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockPayments, mockClients } from '../lib/mock-data';
import { LanguageContext } from '../lib/context';
import { exportCSV } from '../lib/csvExport';
import { storage } from '../lib/storage';

const METHOD_OPTIONS = ['Bank Transfer', 'Cash', 'Credit Card'] as const;

const PaymentsPage: React.FC = () => {
  const { t, currencySymbol } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterMethod, setFilterMethod] = useState<string>('All');
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

  const allPayments = useMemo(() => {
    const stored = storage.payments.get();
    if (stored.length === 0) return mockPayments;
    const storedIds = new Set(stored.map(p => p.id));
    return [...mockPayments.filter(p => !storedIds.has(p.id)), ...stored];
  }, [refresh]);

  const handleDeletePayment = (id: string) => {
    if (!window.confirm('Betaling verwijderen?')) return;
    const updated = allPayments.filter(p => p.id !== id);
    storage.payments.save(updated.filter(p => !mockPayments.find(m => m.id === p.id)));
    setRefresh(r => r + 1);
  };

  const allClients = useMemo(() => {
    const stored = storage.clients.get();
    const ids = new Set(stored.map(c => c.id));
    return [...mockClients.filter(c => !ids.has(c.id)), ...stored];
  }, []);

  const filteredPayments = allPayments.filter(p => {
    const client = allClients.find(c => c.id === p.clientId);
    const matchSearch = client?.company.toLowerCase().includes(search.toLowerCase()) ||
           p.reference.toLowerCase().includes(search.toLowerCase());
    const matchMethod = filterMethod === 'All' || p.method === filterMethod;
    return matchSearch && matchMethod;
  });

  const sorted = useMemo(() => {
    if (!sortKey) return filteredPayments;
    return [...filteredPayments].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (typeof av === 'number' && typeof bv === 'number')
        return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''));
    });
  }, [filteredPayments, sortKey, sortDir]);

  const totalAmount = filteredPayments.reduce((s, p) => s + p.amount, 0);

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('payments')}</h1>
          <p className="text-sm font-medium text-slate-500 italic">History of all incoming transactions and settlements</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(`payments-${new Date().toISOString().slice(0,10)}.csv`, filteredPayments.map(p => { const c = allClients.find(cl => cl.id === p.clientId); return { Date: p.date, Reference: p.reference, Client: c?.company || '', Amount: p.amount, Method: p.method, Status: p.status }; }))}
            className="border border-slate-200 bg-white text-slate-600 px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-50 transition-all flex items-center gap-2">
            <Download size={16}/> Export CSV
          </button>
          <button onClick={() => navigate('/payments/new')} className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition-all flex items-center gap-2 shadow-xl active:scale-95">
            <Plus size={16}/> {t('newPaymentBtn')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Received</p>
            <p className="text-xl font-black text-slate-900">{currencySymbol}{totalAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Banknote size={20} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Transactions</p>
            <p className="text-xl font-black text-slate-900">{filteredPayments.length}</p>
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
              placeholder="Search by client or reference..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              showFilters || filterMethod !== 'All' || filterPeriod !== 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} /> Filters
            {(filterMethod !== 'All' || filterPeriod !== 'all') && (
              <span className="bg-white text-slate-900 rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
                {[filterMethod !== 'All', filterPeriod !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-6 items-end animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Method</label>
              <div className="flex gap-2 flex-wrap">
                {(['All', ...METHOD_OPTIONS] as const).map(m => (
                  <button key={m} onClick={() => setFilterMethod(m)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      filterMethod === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}>{m}</button>
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
            <button onClick={() => { setFilterMethod('All'); setFilterPeriod('all'); setCustomFrom(''); setCustomTo(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
              <X size={12} /> {t('reset')}
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <SortTh col="reference" label="Transaction / Client" />
                <SortTh col="method" label="Method" />
                <SortTh col="date" label="Date" />
                <SortTh col="amount" label="Amount" className="text-right" />
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((p) => {
                const client = allClients.find(c => c.id === p.clientId);
                return (
                  <tr 
                    key={p.id} 
                    onClick={() => navigate(`/payments/${p.id}`)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          <ArrowDownCircle size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate leading-tight">{client?.company || 'Unknown Client'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600">{p.method}</td>
                    <td className="px-6 py-4 font-bold text-slate-400">{p.date}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 italic text-base">
                      +{currencySymbol}{p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button title="Bewerken"
                          onClick={(e) => { e.stopPropagation(); navigate(`/payments/edit/${p.id}`); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        ><Pencil size={15}/></button>
                        <button title="Download"
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        ><Download size={15}/></button>
                        <button title="Bekijk detail"
                          onClick={(e) => { e.stopPropagation(); navigate(`/payments/${p.id}`); }}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        ><ExternalLink size={15}/></button>
                        <button title="Verwijderen"
                          onClick={(e) => { e.stopPropagation(); handleDeletePayment(p.id); }}
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
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
          </p>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            +{currencySymbol}{totalAmount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
