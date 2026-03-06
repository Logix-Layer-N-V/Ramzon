import React, { useState, useContext } from 'react';
import {
  Search, Plus, Filter, ClipboardList, Send,
  MoreHorizontal, Check, FileText, Pencil, X,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockEstimates, mockClients } from '../lib/mock-data';
import { Estimate, EstimateStatus } from '../types';
import { LanguageContext } from '../lib/context';

const STATUS_OPTIONS: EstimateStatus[] = ['Accepted', 'Sent', 'Draft', 'Expired'];

const getStatusStyle = (status: EstimateStatus) => {
  switch (status) {
    case 'Accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Sent':     return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'Draft':    return 'bg-slate-50 text-slate-600 border-slate-200';
    case 'Expired':  return 'bg-red-50 text-red-600 border-red-100';
    default:         return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, currencySymbol } = useContext(LanguageContext);
  const [estimates, setEstimates] = useState<Estimate[]>(mockEstimates);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<EstimateStatus | 'All'>('All');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customFromTime, setCustomFromTime] = useState('00:00');
  const [customTo, setCustomTo] = useState('');
  const [customToTime, setCustomToTime] = useState('23:59');

  const handleApprove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEstimates(prev => prev.map(est => est.id === id ? { ...est, status: 'Accepted' } : est));
  };

  const handleConvert = (e: React.MouseEvent, estimate: Estimate) => {
    e.stopPropagation();
    navigate('/invoices/new', { state: { fromEstimate: estimate } });
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/estimates/edit/${id}`);
  };

  const filtered = estimates.filter(q => {
    const matchSearch = q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.estimateNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalValue = filtered.reduce((a, b) => a + b.total, 0);
  const acceptedCount = filtered.filter(e => e.status === 'Accepted').length;
  const sentCount = filtered.filter(e => e.status === 'Sent').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Estimates</h1>
          <p className="text-sm font-medium text-slate-500 italic">Manage quotes and convert to invoices</p>
        </div>
        <button
          onClick={() => navigate('/estimates/new')}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-200 active:scale-95"
        >
          <Plus size={18} /> {t('newEstimateBtn')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('totalPipeline')}</p>
            <p className="text-xl font-black text-slate-900">{currencySymbol}{totalValue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('accepted')}</p>
            <p className="text-xl font-black text-slate-900">{acceptedCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Send size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('sent')}</p>
            <p className="text-xl font-black text-slate-900">{sentCount}</p>
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
              placeholder="Search estimates or clients..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-100 transition-all"
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
            {/* Status filter */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <div className="flex gap-2 flex-wrap">
                {(['All', ...STATUS_OPTIONS] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s as EstimateStatus | 'All')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      filterStatus === s
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Period filter */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('period')}</label>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'today', 'week', 'month', 'quarter', 'custom'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      filterPeriod === p
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {p === 'all' ? t('all') : p === 'today' ? t('today') : p === 'week' ? t('week') : p === 'month' ? t('month') : p === 'quarter' ? t('quarter') : t('custom')}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom period date + time */}
            {filterPeriod === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('customPeriod')}</label>
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{t('fromDate')}</span>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={e => setCustomFrom(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{t('time')}</span>
                    <input
                      type="time"
                      value={customFromTime}
                      onChange={e => setCustomFromTime(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                  <span className="text-slate-300 font-black mt-4">→</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{t('toDate')}</span>
                    <input
                      type="date"
                      value={customTo}
                      onChange={e => setCustomTo(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{t('time')}</span>
                    <input
                      type="time"
                      value={customToTime}
                      onChange={e => setCustomToTime(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Reset */}
            <button
              onClick={() => { setFilterStatus('All'); setFilterPeriod('all'); setCustomFrom(''); setCustomTo(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={12} /> {t('reset')}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-4">Estimate #</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400 font-bold">
                    No estimates found.
                  </td>
                </tr>
              )}
              {filtered.map(q => (
                <tr
                  key={q.id}
                  onClick={() => navigate(`/estimates/${q.id}`)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-black text-slate-900 italic">{q.estimateNumber}</td>
                  <td className="px-6 py-4">
                    {(() => {
                      const c = mockClients.find(cl => cl.id === q.clientId);
                      return (
                        <>
                          <div className="font-bold text-slate-900">{c?.name || q.clientName}</div>
                          {c?.company && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.company}</div>}
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900">{currencySymbol}{q.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500 font-bold">{q.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(q.status)}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={e => handleEdit(e, q.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Bewerken"
                      >
                        <Pencil size={15} />
                      </button>
                      {q.status === 'Sent' && (
                        <button
                          onClick={e => handleApprove(e, q.id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <Check size={12} /> Approve
                        </button>
                      )}
                      {q.status === 'Accepted' && (
                        <button
                          onClick={e => handleConvert(e, q)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-1.5"
                        >
                          <FileText size={12} /> Convert
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/estimates/${q.id}`); }}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Bekijk detail"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filtered.length} estimate{filtered.length !== 1 ? 's' : ''} {t('found')}
          </p>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            {t('total')}: {currencySymbol}{totalValue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuotesPage;
