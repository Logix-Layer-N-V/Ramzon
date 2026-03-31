import React, { useState, useContext, useMemo } from 'react';
import {
  Search, Plus, Filter, ClipboardList, Send,
  MoreHorizontal, Check, FileText, Pencil, X,
  CheckCircle2, AlertCircle, ChevronUp, ChevronDown, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockEstimates, mockClients } from '../lib/mock-data';
import { Estimate, EstimateStatus } from '../types';
import { LanguageContext } from '../lib/context';
import { storage } from '../lib/storage';
import { sendDocumentEmail } from '../lib/sendDocument';

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
  const [refresh, setRefresh] = useState(0);
  const estimates = useMemo(() => {
    const stored = storage.estimates.get();
    if (stored.length === 0) return mockEstimates;
    const ids = new Set(stored.map(e => e.id));
    return [...mockEstimates.filter(e => !ids.has(e.id)), ...stored];
  }, [refresh]);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<EstimateStatus | 'All'>('All');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customFromTime, setCustomFromTime] = useState('00:00');
  const [customTo, setCustomTo] = useState('');
  const [customToTime, setCustomToTime] = useState('23:59');

  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const [sendingId, setSendingId] = useState<string | null>(null);
  const { companyName, companyAddress, companyPhone, companyEmail, companyLogo } = useContext(LanguageContext);

  const allClients = useMemo(() => {
    const stored = storage.clients.get();
    const ids = new Set(stored.map(c => c.id));
    return [...mockClients.filter(c => !ids.has(c.id)), ...stored];
  }, []);

  const handleSendEmail = async (e: React.MouseEvent, q: Estimate) => {
    e.stopPropagation();
    const client = allClients.find(c => c.id === q.clientId);
    const email = client?.email;
    if (!email) {
      alert('This client has no email address. Please add one first.');
      return;
    }
    if (!window.confirm(`Send ${q.estimateNumber} to ${email}?`)) return;
    setSendingId(q.id);
    try {
      await sendDocumentEmail({
        to: email,
        clientName: client?.name || q.clientName,
        docType: 'estimate',
        docNumber: q.estimateNumber,
        total: q.total,
        currency: q.currency || 'SRD',
        currencySymbol,
        companyName,
        pdfProps: {
          docType: 'quote',
          docNumber: q.estimateNumber,
          date: q.date,
          clientName: client?.name || q.clientName,
          clientCompany: client?.company,
          clientAddress: client?.address,
          clientPhone: client?.phone,
          clientEmail: client?.email,
          clientVAT: client?.vatNumber,
          companyName, companyAddress, companyPhone, companyEmail, companyLogo,
          rep: q.rep,
          paidAmount: q.paidAmount,
          currency: q.currency || 'SRD',
          currencySymbol,
          items: (q.items || []).map(it => ({
            description: it.description,
            qty: it.quantity,
            unit: 'pcs',
            price: it.unitPrice,
            total: it.total,
          })),
          subtotal: q.subtotal,
          tax: q.taxAmount,
          total: q.total,
        },
      });
      alert(`Estimate sent to ${email}`);
    } catch (err: any) {
      alert(`Failed to send: ${err?.response?.data?.error || err.message}`);
    } finally {
      setSendingId(null);
    }
  };

  const handleApprove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = estimates.map(est => est.id === id ? { ...est, status: 'Accepted' as const } : est);
    storage.estimates.save(updated);
    setRefresh(r => r + 1);
  };

  const handleConvert = (e: React.MouseEvent, estimate: Estimate) => {
    e.stopPropagation();
    // Build invoice data from estimate
    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      clientId: estimate.clientId,
      clientName: estimate.clientName,
      date: new Date().toISOString().split('T')[0],
      dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
      currency: estimate.currency ?? 'SRD',
      exchangeRate: estimate.exchangeRate ?? 1,
      items: estimate.items ?? [],
      subtotal: estimate.subtotal ?? 0,
      taxRate: estimate.taxRate ?? 21,
      taxAmount: estimate.taxAmount ?? 0,
      totalAmount: estimate.total ?? 0,
      status: 'Pending' as const,
      rep: estimate.rep ?? '',
      paidAmount: 0,
      estimateId: estimate.id,
    };
    // Save to storage
    const existing = storage.invoices.get();
    storage.invoices.save([...existing, newInvoice]);
    // Mark estimate as accepted
    const allEstimates = estimates;
    const updatedEstimates = allEstimates.map(est =>
      est.id === estimate.id ? { ...est, status: 'Accepted' as const } : est
    );
    storage.estimates.save(updatedEstimates.filter(est => !mockEstimates.find(m => m.id === est.id) || est.status !== mockEstimates.find(m => m.id === est.id)?.status));
    // Navigate to the new invoice
    navigate(`/invoices/${newInvoice.id}`);
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

  const totalValue = filtered.reduce((a, b) => a + b.total, 0);
  const acceptedCount = filtered.filter(e => e.status === 'Accepted').length;
  const sentCount = filtered.filter(e => e.status === 'Sent').length;

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Estimates</h1>
          <p className="text-sm font-medium text-slate-500 italic">Manage quotes and convert to invoices</p>
        </div>
        <button
          onClick={() => navigate('/estimates/new')}
          className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition-all flex items-center gap-2 shadow-xl active:scale-95"
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
                <SortTh col="estimateNumber" label="Estimate #" />
                <SortTh col="clientName" label="Client" />
                <SortTh col="total" label="Amount" />
                <SortTh col="date" label="Date" />
                <SortTh col="status" label="Status" />
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400 font-bold">
                    No estimates found.
                  </td>
                </tr>
              )}
              {sorted.map(q => (
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
                        onClick={e => handleSendEmail(e, q)}
                        disabled={sendingId === q.id}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Send Email"
                      >
                        {sendingId === q.id ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                      </button>
                      <button
                        onClick={e => handleEdit(e, q.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
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
