import React, { useState, useContext, useMemo } from 'react';
import { LanguageContext } from '../lib/context';
import {
  Search, Plus, Filter, FileText, Download, Send,
  MoreHorizontal, CheckCircle2, Clock, AlertCircle, X,
  ChevronUp, ChevronDown, Trash2, Loader2
} from 'lucide-react';
import { mockInvoices, mockClients } from '../lib/mock-data';
import { InvoiceStatus, Invoice } from '../types';
import { useNavigate } from 'react-router-dom';
import { exportCSV } from '../lib/csvExport';
import { storage } from '../lib/storage';
import { sendDocumentEmail } from '../lib/sendDocument';

const STATUS_OPTIONS: InvoiceStatus[] = ['Paid', 'Pending', 'Overdue', 'Draft'];

const getStatusStyle = (status: InvoiceStatus) => {
  switch (status) {
    case 'Paid':    return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'Overdue': return 'bg-red-50 text-red-700 border-red-100';
    default:        return 'bg-slate-50 text-slate-700 border-slate-100';
  }
};

const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, currencySymbol } = useContext(LanguageContext);
  const [refresh, setRefresh] = useState(0);

  const allInvoices = useMemo(() => {
    const stored = storage.invoices.get();
    const storedIds = new Set(stored.map((e: Invoice) => e.id));
    return [...stored, ...mockInvoices.filter((e: Invoice) => !storedIds.has(e.id))];
  }, [refresh]);

  const [sendingId, setSendingId] = useState<string | null>(null);
  const { companyName, companyAddress, companyPhone, companyEmail, companyLogo } = useContext(LanguageContext);

  const handleSendEmail = async (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    const client = allClients.find(c => c.id === inv.clientId);
    const email = client?.email;
    if (!email) {
      alert('This client has no email address. Please add one first.');
      return;
    }
    if (!window.confirm(`Send ${inv.invoiceNumber} to ${email}?`)) return;
    setSendingId(inv.id);
    try {
      await sendDocumentEmail({
        to: email,
        clientName: client?.name || inv.clientName,
        docType: 'invoice',
        docNumber: inv.invoiceNumber,
        total: inv.totalAmount,
        currency: inv.currency || 'SRD',
        currencySymbol,
        companyName,
        pdfProps: {
          docType: 'invoice',
          docNumber: inv.invoiceNumber,
          date: inv.date,
          validUntil: inv.dueDate,
          clientName: client?.name || inv.clientName,
          clientCompany: client?.company,
          clientAddress: client?.address,
          clientPhone: client?.phone,
          clientEmail: client?.email,
          clientVAT: client?.vatNumber,
          companyName, companyAddress, companyPhone, companyEmail, companyLogo,
          rep: inv.rep,
          paidAmount: inv.paidAmount,
          currency: inv.currency || 'SRD',
          currencySymbol,
          items: inv.items.map(it => ({
            description: it.description,
            qty: it.quantity,
            unit: 'pcs',
            price: it.unitPrice,
            total: it.total,
          })),
          subtotal: inv.subtotal,
          tax: inv.taxAmount,
          total: inv.totalAmount,
        },
      });
      alert(`Invoice sent to ${email}`);
    } catch (err: any) {
      alert(`Failed to send: ${err?.response?.data?.error || err.message}`);
    } finally {
      setSendingId(null);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (!window.confirm('Factuur verwijderen?')) return;
    const updated = allInvoices.filter(inv => inv.id !== id);
    storage.invoices.save(updated.filter(inv => !mockInvoices.find(m => m.id === inv.id)));
    setRefresh(r => r + 1);
  };

  const allClients = useMemo(() => {
    const stored = storage.clients.get();
    const ids = new Set(stored.map(c => c.id));
    return [...mockClients.filter(c => !ids.has(c.id)), ...stored];
  }, []);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'All'>('All');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customFromTime, setCustomFromTime] = useState('00:00');
  const [customTo, setCustomTo] = useState('');
  const [customToTime, setCustomToTime] = useState('23:59');

  const [sortKey, setSortKey] = useState<string>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = allInvoices.filter(inv => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || inv.status === filterStatus;
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

  const totalPaid    = filtered.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0);
  const totalPending = filtered.filter(i => i.status === 'Pending').reduce((s, i) => s + i.totalAmount, 0);
  const totalOverdue = filtered.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.totalAmount, 0);

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-sm font-medium text-slate-500 italic">Manage your wood sales and accounts receivable</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportCSV(`invoices-${new Date().toISOString().slice(0,10)}.csv`, filtered.map(i => ({ Invoice: i.invoiceNumber, Client: i.clientName, Date: i.date, DueDate: i.dueDate, Amount: i.totalAmount, Status: i.status })))}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={15}/> Export CSV
          </button>
          <button
            onClick={() => navigate('/invoices/new')}
            className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition-all flex items-center gap-2 shadow-xl active:scale-95"
          >
            <Plus size={18}/> New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Paid</p>
            <p className="text-xl font-black text-slate-900">{currencySymbol}{totalPaid.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending</p>
            <p className="text-xl font-black text-slate-900">{currencySymbol}{totalPending.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Overdue</p>
            <p className="text-xl font-black text-slate-900">{currencySymbol}{totalOverdue.toLocaleString()}</p>
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
              placeholder="Search invoices or clients..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
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
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <div className="flex gap-2 flex-wrap">
                {(['All', ...STATUS_OPTIONS] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s as InvoiceStatus | 'All')}
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

            {/* Period */}
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

            {/* Custom period */}
            {filterPeriod === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('customPeriod')}</label>
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{t('fromDate')}</span>
                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{t('time')}</span>
                    <input type="time" value={customFromTime} onChange={e => setCustomFromTime(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-slate-100" />
                  </div>
                  <span className="text-slate-300 font-black mt-4">→</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{t('toDate')}</span>
                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-slate-100" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{t('time')}</span>
                    <input type="time" value={customToTime} onChange={e => setCustomToTime(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-slate-100" />
                  </div>
                </div>
              </div>
            )}

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
                <SortTh col="invoiceNumber" label="Invoice #" />
                <SortTh col="clientName" label="Client" />
                <SortTh col="totalAmount" label="Amount" />
                <SortTh col="dueDate" label="Due Date" />
                <SortTh col="status" label="Status" />
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400 font-bold">
                    No invoices found.
                  </td>
                </tr>
              )}
              {sorted.map(inv => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-black text-slate-900 italic">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4">
                    {(() => {
                      const c = allClients.find(cl => cl.id === inv.clientId);
                      return (
                        <>
                          <div className="font-bold text-slate-900">{c?.name || inv.clientName}</div>
                          {c?.company && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.company}</div>}
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900">{currencySymbol}{inv.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500 font-bold">{inv.dueDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={e => handleSendEmail(e, inv)}
                        disabled={sendingId === inv.id}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Send Email"
                      >
                        {sendingId === inv.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); }}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); }}
                        className="p-2 text-slate-400 hover:text-slate-950 rounded-lg transition-colors"
                        title="More options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteInvoice(inv.id); }}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
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
            {filtered.length} invoice{filtered.length !== 1 ? 's' : ''} found
          </p>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            {t('total')}: {currencySymbol}{filtered.reduce((s, i) => s + i.totalAmount, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
