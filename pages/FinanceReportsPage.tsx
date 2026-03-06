
import React, { useState, useMemo, useRef, useEffect, useContext } from 'react';
import {
  TrendingUp, DollarSign, FileText, Clock, Users,
  BarChart3, AlertCircle, CreditCard, Banknote, Smartphone, Coins, Package,
  Download, ClipboardList, Wallet, Scale, Search, MoreHorizontal,
  RotateCcw, ChevronDown, Calendar, Check, ArrowRight,
  CalendarDays, Target, Settings2, Receipt,
} from 'lucide-react';
import { storage } from '../lib/storage';
import { LanguageContext } from '../lib/context';

type Period = 'month' | 'year' | 'all';
type ReportType = 'sales' | 'estimates' | 'invoices' | 'payments' | 'profit_loss';
type DateMode = 'presets' | 'custom';
type Tab = 'insights' | 'reports';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (n: number, symbol: string) =>
  `${symbol} ${n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : n.toFixed(0)}`;

const FinanceReportsPage: React.FC = () => {
  const { currencySymbol } = useContext(LanguageContext);
  const currentYear = new Date().getFullYear();
  const now = new Date();
  const currentMonth = now.getMonth();

  // ── Tab ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('insights');

  // ── Insights state ────────────────────────────────────────────────────────
  const [period, setPeriod] = useState<Period>('month');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // ── Reports state ─────────────────────────────────────────────────────────
  const [reportType, setReportType]                 = useState<ReportType>('sales');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dateMode, setDateMode]             = useState<DateMode>('presets');
  const [selectedDay, setSelectedDay]       = useState<string>('All');
  const [selectedMonth, setSelectedMonth]   = useState<string>('All months');
  const [selectedYear, setSelectedYear]     = useState<string>(currentYear.toString());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate]     = useState('');
  const [isRunning, setIsRunning]             = useState(false);
  const [, setAppliedReportType]              = useState<ReportType>('sales');

  // ── Raw data ──────────────────────────────────────────────────────────────
  const invoices = useMemo(() => storage.invoices.get(), []);
  const payments = useMemo(() => storage.payments.get(), []);
  const clients  = useMemo(() => storage.clients.get(),  []);
  const expenses = useMemo(() => storage.expenses.get(), []);

  // ── Period filter ─────────────────────────────────────────────────────────
  const inPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    if (period === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (period === 'year')  return d.getFullYear() === currentYear;
    return true;
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const fp = payments.filter(p => inPeriod(p.date || ''));
    const fi = invoices.filter(inv => inPeriod(inv.date || ''));
    const revenue    = fp.reduce((s, p) => s + (p.amount || 0), 0);
    const openAR     = invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((s, inv) => s + Math.max(0, (inv.totalAmount || inv.total || 0) - (inv.paidAmount || 0)), 0);
    const avgInvoice = fi.length > 0
      ? fi.reduce((s, inv) => s + (inv.totalAmount || inv.total || 0), 0) / fi.length : 0;
    const linked  = payments.filter(p => p.invoiceId && p.date);
    const avgDays = linked.length > 0 ? (() => {
      const diffs = linked.map(p => {
        const inv = invoices.find(i => i.id === p.invoiceId);
        if (!inv || !inv.date) return 0;
        return Math.max(0, (new Date(p.date).getTime() - new Date(inv.date).getTime()) / 86_400_000);
      });
      return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    })() : 0;
    return { revenue, openAR, avgInvoice, avgDays };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, payments, period]);

  // ── Monthly revenue (12 months) ───────────────────────────────────────────
  const monthlyRevenue = useMemo(() =>
    Array.from({ length: 12 }, (_, i) =>
      payments
        .filter(p => p.date && new Date(p.date).getMonth() === i && new Date(p.date).getFullYear() === currentYear)
        .reduce((s, p) => s + (p.amount || 0), 0)
    ), [payments, currentYear]);

  const maxRevenue = Math.max(...monthlyRevenue, 1);

  // ── Last 6 months rev vs exp ──────────────────────────────────────────────
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const mi = (currentMonth - 5 + i + 12) % 12;
    const yi = currentMonth - 5 + i < 0 ? currentYear - 1 : currentYear;
    const rev = payments.filter(p => p.date && new Date(p.date).getMonth() === mi && new Date(p.date).getFullYear() === yi).reduce((s, p) => s + (p.amount || 0), 0);
    const exp = expenses.filter(e => e.date && new Date(e.date).getMonth() === mi && new Date(e.date).getFullYear() === yi).reduce((s, e) => s + (e.amount || 0), 0);
    return { label: MONTH_NAMES[mi], rev, exp };
  });
  const maxLast6 = Math.max(...last6.flatMap(m => [m.rev, m.exp]), 1);

  // ── Invoice status breakdown ──────────────────────────────────────────────
  const statusGroups = useMemo(() => {
    const filtered = invoices.filter(inv => inPeriod(inv.date || ''));
    const total = filtered.length || 1;
    const count = (s: string) => filtered.filter(inv => inv.status === s).length;
    return [
      { label: 'Paid',    key: 'paid',    color: 'bg-emerald-500', text: 'text-emerald-700', count: count('paid') },
      { label: 'Open',    key: 'sent',    color: 'bg-blue-500',    text: 'text-blue-700',    count: count('sent') + count('partial') },
      { label: 'Overdue', key: 'overdue', color: 'bg-red-500',     text: 'text-red-700',     count: count('overdue') },
      { label: 'Draft',   key: 'draft',   color: 'bg-slate-300',   text: 'text-slate-600',   count: count('draft') },
    ].map(g => ({ ...g, pct: Math.round((g.count / total) * 100) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, period]);

  // ── Top 5 clients ─────────────────────────────────────────────────────────
  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; billed: number; paid: number; count: number }>();
    invoices.filter(inv => inPeriod(inv.date || '')).forEach(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const name   = client ? (client.company || client.name || 'Unknown') : (inv.clientName || 'Unknown');
      const billed = inv.totalAmount || inv.total || 0;
      const paid   = inv.paidAmount || 0;
      const existing = map.get(name) || { name, billed: 0, paid: 0, count: 0 };
      map.set(name, { name, billed: existing.billed + billed, paid: existing.paid + paid, count: existing.count + 1 });
    });
    return [...map.values()].sort((a, b) => b.billed - a.billed).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, clients, period]);

  const maxClientBilled = Math.max(...topClients.map(c => c.billed), 1);

  // ── Payment method breakdown ──────────────────────────────────────────────
  const paymentMethods = useMemo(() => {
    const filtered = payments.filter(p => inPeriod(p.date || ''));
    const map = new Map<string, number>();
    filtered.forEach(p => {
      const m = p.paymentMethod || p.method || 'Other';
      map.set(m, (map.get(m) || 0) + 1);
    });
    const total = filtered.length || 1;
    const colors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      'Bank Transfer': { bg: 'bg-blue-500',    text: 'text-blue-700',    icon: CreditCard },
      'Cash':          { bg: 'bg-emerald-500',  text: 'text-emerald-700', icon: Banknote },
      'iDeal':         { bg: 'bg-purple-500',   text: 'text-purple-700',  icon: Smartphone },
      'PayPal':        { bg: 'bg-cyan-500',     text: 'text-cyan-700',    icon: CreditCard },
      'USDT':          { bg: 'bg-amber-500',    text: 'text-amber-700',   icon: Coins },
      'Cheque':        { bg: 'bg-slate-500',    text: 'text-slate-700',   icon: FileText },
    };
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([method, count]) => ({
      method, count,
      pct: Math.round((count / total) * 100),
      ...(colors[method] || { bg: 'bg-slate-400', text: 'text-slate-600', icon: Package }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, period]);

  // ── Report options ────────────────────────────────────────────────────────
  const days   = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['All months', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years  = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => (currentYear - i).toString());

  const reportOptions = [
    { id: 'sales',       label: 'Sales Performance',    icon: BarChart3,    color: 'text-blue-500',    bg: 'bg-blue-50',    desc: 'Revenue analytics and growth' },
    { id: 'estimates',   label: 'Estimates & Quotes',   icon: ClipboardList,color: 'text-purple-500',  bg: 'bg-purple-50',  desc: 'Pipeline and proposal tracking' },
    { id: 'invoices',    label: 'Invoice Ledger',        icon: Receipt,      color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Accounts receivable status' },
    { id: 'payments',    label: 'Payment History',       icon: Wallet,       color: 'text-amber-500',   bg: 'bg-amber-50',   desc: 'Settlement and cash flow logs' },
    { id: 'profit_loss', label: 'Profit & Loss (P&L)',   icon: Scale,        color: 'text-brand-primary',bg: 'bg-slate-50',  desc: 'Full financial health summary' },
  ];

  const currentModel = reportOptions.find(o => o.id === reportType) || reportOptions[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRunReport = () => {
    setIsRunning(true);
    setTimeout(() => { setAppliedReportType(reportType); setIsRunning(false); }, 800);
  };

  const isEmpty = (arr: unknown[]) => arr.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Financial performance and business intelligence</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('#/reports/finance/print', '_blank')}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-md active:scale-95"
          >
            <FileText size={14} /> Print
          </button>
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: 'insights', label: 'Business Insights' },
          { key: 'reports',  label: 'Finance Reports'   },
        ] as { key: Tab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${
              activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BUSINESS INSIGHTS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'insights' && (
        <>
          {/* Period filter */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {(['month', 'year', 'all'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                  period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'All Time'}
              </button>
            ))}
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenue Received',  value: fmt(kpis.revenue,    currencySymbol), icon: DollarSign,  color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Open Receivables',  value: fmt(kpis.openAR,     currencySymbol), icon: AlertCircle, color: 'bg-amber-50   text-amber-600'   },
              { label: 'Avg Invoice Value', value: fmt(kpis.avgInvoice,  currencySymbol), icon: FileText,    color: 'bg-blue-50    text-blue-600'    },
              { label: 'Avg Payment Days',  value: kpis.avgDays > 0 ? `${kpis.avgDays} days` : '—', icon: Clock, color: 'bg-purple-50 text-purple-600' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
                  <kpi.icon size={18} />
                </div>
                <p className="text-2xl font-black text-slate-900 leading-none">{kpi.value}</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1.5 uppercase tracking-wide">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Revenue — {currentYear}</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-500">Payments received</span>
              </div>
            </div>
            {isEmpty(payments) ? (
              <div className="h-48 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-bold">No payments recorded</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-end gap-2 h-48">
                  {monthlyRevenue.map((val, i) => {
                    const pct = (val / maxRevenue) * 100;
                    const isCurrentMonth = i === currentMonth;
                    const isHovered = hoveredMonth === i;
                    return (
                      <div key={i}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer"
                        onMouseEnter={() => setHoveredMonth(i)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        {isHovered && val > 0 && (
                          <div className="absolute -mt-8 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-10">
                            {fmt(val, currencySymbol)}
                          </div>
                        )}
                        <div
                          className={`w-full rounded-t-lg transition-all duration-200 ${
                            isCurrentMonth ? 'bg-blue-500' : isHovered ? 'bg-slate-400' : 'bg-slate-200'
                          }`}
                          style={{ height: pct > 0 ? `${Math.max(pct, 3)}%` : '3%', opacity: pct === 0 ? 0.3 : 1 }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  {MONTH_NAMES.map((m, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className={`text-[9px] font-black uppercase ${i === currentMonth ? 'text-blue-600' : 'text-slate-400'}`}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Invoice Status + Top Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Invoice Status Breakdown</h3>
              {isEmpty(invoices) ? (
                <div className="h-32 flex items-center justify-center text-slate-400">
                  <div className="text-center"><FileText size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">No invoices found</p></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex h-3 rounded-full overflow-hidden gap-px">
                    {statusGroups.filter(g => g.pct > 0).map(g => (
                      <div key={g.key} className={`${g.color} transition-all`} style={{ width: `${g.pct}%` }} title={`${g.label}: ${g.pct}%`} />
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    {statusGroups.map(g => (
                      <div key={g.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-sm ${g.color}`} />
                          <span className="text-xs font-bold text-slate-700">{g.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${g.color} rounded-full`} style={{ width: `${g.pct}%` }} />
                          </div>
                          <span className="text-xs font-black text-slate-900 w-6 text-right">{g.count}</span>
                          <span className={`text-[10px] font-black w-8 text-right ${g.text}`}>{g.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top 5 Clients */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Top 5 Clients by Revenue</h3>
              {isEmpty(topClients) ? (
                <div className="h-32 flex items-center justify-center text-slate-400">
                  <div className="text-center"><Users size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">No client data available</p></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {topClients.map((c, i) => {
                    const paidPct = c.billed > 0 ? Math.round((c.paid / c.billed) * 100) : 0;
                    const barPct  = Math.round((c.billed / maxClientBilled) * 100);
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">{i + 1}</div>
                            <span className="text-xs font-black text-slate-900 truncate">{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold shrink-0">({c.count}×)</span>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-xs font-black text-slate-900">{fmt(c.billed, currencySymbol)}</p>
                            <p className={`text-[9px] font-black ${paidPct >= 100 ? 'text-emerald-600' : paidPct > 50 ? 'text-amber-600' : 'text-red-500'}`}>
                              {paidPct}% paid
                            </p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${barPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods + Revenue vs Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Payment Method Breakdown</h3>
              {isEmpty(paymentMethods) ? (
                <div className="h-32 flex items-center justify-center text-slate-400">
                  <div className="text-center"><CreditCard size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">No payment data</p></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 ${m.text}`}>
                        <m.icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-900">{m.method}</span>
                          <span className={`text-[10px] font-black ${m.text}`}>{m.count}× · {m.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${m.bg} rounded-full`} style={{ width: `${m.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue vs Expenses (last 6 months) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Revenue vs Expenses — Last 6 Months</h3>
              <div className="flex items-center gap-4 mb-5">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500">Revenue</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-orange-400" /><span className="text-[10px] font-bold text-slate-500">Expenses</span></div>
              </div>
              {last6.every(m => m.rev === 0 && m.exp === 0) ? (
                <div className="h-32 flex items-center justify-center text-slate-400">
                  <div className="text-center"><TrendingUp size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">No data available</p></div>
                </div>
              ) : (
                <div className="flex items-end gap-3 h-40">
                  {last6.map((m, i) => {
                    const revH = Math.round((m.rev / maxLast6) * 100);
                    const expH = Math.round((m.exp / maxLast6) * 100);
                    const net  = m.rev - m.exp;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div className="w-full flex items-end gap-0.5 justify-center" style={{ height: '85%' }}>
                          <div className="flex-1 bg-emerald-500 rounded-t-md transition-all" style={{ height: `${Math.max(revH, revH > 0 ? 2 : 0)}%` }} title={`Revenue: ${fmt(m.rev, currencySymbol)}`} />
                          <div className="flex-1 bg-orange-400 rounded-t-md transition-all"  style={{ height: `${Math.max(expH, expH > 0 ? 2 : 0)}%` }} title={`Expenses: ${fmt(m.exp, currencySymbol)}`} />
                        </div>
                        <span className="text-[9px] font-black text-slate-400">{m.label}</span>
                        {(m.rev > 0 || m.exp > 0) && (
                          <span className={`text-[9px] font-black ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {net >= 0 ? '+' : ''}{fmt(net, currencySymbol).replace(currencySymbol + ' ', '')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FINANCE REPORTS TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <>
          {/* Filter engine */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
            <div className="p-6 md:p-8 space-y-8">

              {/* Row 1: Report type + Date mode */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">

                {/* Report type selector */}
                <div className="space-y-3 flex-1 relative" ref={dropdownRef}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Type</h3>
                  </div>
                  <button
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="w-full lg:max-w-md flex items-center justify-between px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-brand-primary transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${currentModel.bg} ${currentModel.color} shadow-sm group-hover:scale-105 transition-transform`}>
                        <currentModel.icon size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 leading-none">{currentModel.label}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-tight">{currentModel.desc}</p>
                      </div>
                    </div>
                    <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isModelDropdownOpen ? 'rotate-180 text-brand-primary' : ''}`} />
                  </button>

                  {isModelDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full lg:max-w-md bg-white border border-slate-100 rounded-xl shadow-lg z-[100] p-2 animate-in fade-in zoom-in-95 duration-200">
                      {reportOptions.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => { setReportType(opt.id as ReportType); setIsModelDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${reportType === opt.id ? 'bg-brand-primary text-white' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${reportType === opt.id ? 'bg-white/10 text-brand-accent' : `${opt.bg} ${opt.color}`}`}>
                              <opt.icon size={18} />
                            </div>
                            <div className="text-left">
                              <p className={`text-xs font-bold ${reportType === opt.id ? 'text-white' : 'text-slate-900'}`}>{opt.label}</p>
                              <p className={`text-[9px] font-semibold ${reportType === opt.id ? 'text-white/60' : 'text-slate-400'}`}>{opt.desc}</p>
                            </div>
                          </div>
                          {reportType === opt.id && <Check size={16} className="text-brand-accent" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date mode */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Range</h3>
                  <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-100">
                    <button onClick={() => setDateMode('presets')} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-tight transition-all ${dateMode === 'presets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Presets</button>
                    <button onClick={() => setDateMode('custom')}  className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-tight transition-all ${dateMode === 'custom'  ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Custom</button>
                  </div>
                </div>
              </div>

              {/* Row 2: Date pickers */}
              <div className="pt-6 border-t border-slate-100">
                {dateMode === 'presets' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                    {/* Day */}
                    <div className="lg:col-span-6 space-y-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <CalendarDays size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Day of Week</span>
                      </div>
                      <div className="bg-slate-50 p-1 rounded-xl flex gap-1 border border-slate-100">
                        {days.map(day => (
                          <button key={day} onClick={() => setSelectedDay(day)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-all ${
                              selectedDay === day ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}>
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Month */}
                    <div className="lg:col-span-3 space-y-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Target size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Month</span>
                      </div>
                      <div className="relative">
                        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none hover:border-brand-primary transition-all cursor-pointer">
                          {months.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300" />
                      </div>
                    </div>
                    {/* Year */}
                    <div className="lg:col-span-3 space-y-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Year</span>
                      </div>
                      <div className="relative">
                        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none hover:border-brand-primary transition-all cursor-pointer">
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Start Date</span>
                      </div>
                      <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-accent-light focus:border-brand-primary transition-all" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <ArrowRight size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">End Date</span>
                      </div>
                      <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-accent-light focus:border-brand-primary transition-all" />
                    </div>
                  </div>
                )}
              </div>

              {/* Action row */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400">
                  {dateMode === 'custom'
                    ? `Range: ${customStartDate || '—'} to ${customEndDate || '—'}`
                    : `Period: ${selectedMonth} ${selectedYear}`}
                </p>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={() => { setReportType('sales'); setSelectedDay('All'); setDateMode('presets'); }}
                    className="flex-1 md:flex-none px-5 py-2.5 text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                  <button
                    onClick={handleRunReport}
                    disabled={isRunning}
                    className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isRunning
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Settings2 size={14} className="text-brand-accent" /> Generate Report</>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Ledger table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center shadow-md">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{currentModel.label}</h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
                    {dateMode === 'custom'
                      ? `${customStartDate || '—'} – ${customEndDate || '—'}`
                      : `${selectedMonth} ${selectedYear}`}
                  </p>
                </div>
              </div>
              <div className="relative hidden sm:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-accent-light outline-none" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-4 py-4">Client</th>
                    <th className="px-4 py-4 text-center">Date</th>
                    <th className="px-4 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[0, 1, 2].map(idx => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                      <td className="px-6 py-5 font-bold text-slate-900 text-sm">#TXN-9982-Z{idx}</td>
                      <td className="px-4 py-5">
                        <p className="text-sm font-bold text-slate-700">Royal Timber Logistics</p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Partner</p>
                      </td>
                      <td className="px-4 py-5 text-center font-semibold text-slate-400 text-sm">2026-03-05</td>
                      <td className="px-4 py-5 text-right font-bold text-slate-900">€ 14.280,00</td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 bg-white border border-slate-100 rounded-lg text-slate-300 hover:text-slate-900 hover:shadow-sm transition-all">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Total records: 482</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-400">Previous</button>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-900 shadow-sm">Next</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceReportsPage;
