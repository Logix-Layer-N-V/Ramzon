
import React, { useState, useMemo, useContext } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, FileText, Clock, Users,
  BarChart3, CheckCircle2, AlertCircle, FileWarning, FileMinus,
  CreditCard, Banknote, Smartphone, Coins, ArrowUpRight, ArrowDownRight,
  Minus, Package
} from 'lucide-react';
import { storage } from '../lib/storage';
import { LanguageContext } from '../lib/context';

type Period = 'month' | 'year' | 'all';

const MONTH_NAMES = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

const fmt = (n: number, symbol: string) =>
  `${symbol} ${n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : n.toFixed(0)}`;

const TrafficInsightsPage: React.FC = () => {
  const { currencySymbol } = useContext(LanguageContext);
  const [period, setPeriod] = useState<Period>('month');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ── Raw data ──────────────────────────────────────────────────────────────
  const invoices = useMemo(() => storage.invoices.get(), []);
  const payments = useMemo(() => storage.payments.get(), []);
  const clients  = useMemo(() => storage.clients.get(), []);
  const expenses = useMemo(() => storage.expenses.get(), []);

  // ── Period filter helper ──────────────────────────────────────────────────
  const inPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    if (period === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (period === 'year')  return d.getFullYear() === currentYear;
    return true;
  };

  // ── KPI calculations ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const filteredPayments = payments.filter(p => inPeriod(p.date || ''));
    const filteredInvoices = invoices.filter(inv => inPeriod(inv.date || ''));

    const revenue = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);

    const openAR = invoices
      .filter(inv => inv.status !== ('paid' as never) && inv.status !== ('cancelled' as never))
      .reduce((s, inv) => s + Math.max(0, inv.totalAmount || 0), 0);

    const avgInvoice = filteredInvoices.length > 0
      ? filteredInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0) / filteredInvoices.length
      : 0;

    const linked = payments.filter(p => p.invoiceId && p.date);
    const avgDays = linked.length > 0 ? (() => {
      const diffs = linked.map(p => {
        const inv = invoices.find(i => i.id === p.invoiceId);
        if (!inv || !inv.date) return 0;
        return Math.max(0, (new Date(p.date).getTime() - new Date(inv.date).getTime()) / 86_400_000);
      });
      return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    })() : 0;

    return { revenue, openAR, avgInvoice, avgDays };
  }, [invoices, payments, period]);

  // ── Monthly revenue (12 months) ───────────────────────────────────────────
  const monthlyRevenue = useMemo(() =>
    Array.from({ length: 12 }, (_, i) =>
      payments
        .filter(p => p.date && new Date(p.date).getMonth() === i && new Date(p.date).getFullYear() === currentYear)
        .reduce((s, p) => s + (p.amount || 0), 0)
    ), [payments, currentYear]);

  const maxRevenue = Math.max(...monthlyRevenue, 1);

  // ── Monthly expenses (6 months) ───────────────────────────────────────────
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const mi = (currentMonth - 5 + i + 12) % 12;
    const yi = currentMonth - 5 + i < 0 ? currentYear - 1 : currentYear;
    const rev = payments
      .filter(p => p.date && new Date(p.date).getMonth() === mi && new Date(p.date).getFullYear() === yi)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const exp = expenses
      .filter(e => e.date && new Date(e.date).getMonth() === mi && new Date(e.date).getFullYear() === yi)
      .reduce((s, e) => s + (e.amount || 0), 0);
    return { label: MONTH_NAMES[mi], rev, exp };
  });
  const maxLast6 = Math.max(...last6.flatMap(m => [m.rev, m.exp]), 1);

  // ── Invoice status breakdown ──────────────────────────────────────────────
  const statusGroups = useMemo(() => {
    const filtered = invoices.filter(inv => inPeriod(inv.date || ''));
    const total = filtered.length || 1;
    const count = (s: string) => filtered.filter(inv => inv.status === s).length;
    return [
      { label: 'Paid',          key: 'paid',      color: 'bg-emerald-500', text: 'text-emerald-700', count: count('paid') },
      { label: 'Openstaand',   key: 'sent',       color: 'bg-blue-500',   text: 'text-blue-700',    count: count('sent') + count('partial') },
      { label: 'Achterstallig',key: 'overdue',    color: 'bg-red-500',    text: 'text-red-700',     count: count('overdue') },
      { label: 'Concept',      key: 'draft',      color: 'bg-slate-300',  text: 'text-slate-600',   count: count('draft') },
    ].map(g => ({ ...g, pct: Math.round((g.count / total) * 100) }));
  }, [invoices, period]);

  // ── Top 5 clients ─────────────────────────────────────────────────────────
  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; billed: number; paid: number; count: number }>();
    invoices.filter(inv => inPeriod(inv.date || '')).forEach(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      const name = client ? (client.company || client.name || 'Onbekend') : (inv.clientName || 'Onbekend');
      const billed = inv.totalAmount || 0;
      const paid   = 0;
      const existing = map.get(name) || { name, billed: 0, paid: 0, count: 0 };
      map.set(name, { name, billed: existing.billed + billed, paid: existing.paid + paid, count: existing.count + 1 });
    });
    return [...map.values()].sort((a, b) => b.billed - a.billed).slice(0, 5);
  }, [invoices, clients, period]);

  const maxClientBilled = Math.max(...topClients.map(c => c.billed), 1);

  // ── Payment method breakdown ──────────────────────────────────────────────
  const paymentMethods = useMemo(() => {
    const filtered = payments.filter(p => inPeriod(p.date || ''));
    const map = new Map<string, number>();
    filtered.forEach(p => {
      const m = p.method || 'Overig';
      map.set(m, (map.get(m) || 0) + 1);
    });
    const total = filtered.length || 1;
    const methodColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      'Bank Transfer': { bg: 'bg-blue-500',   text: 'text-blue-700',   icon: CreditCard },
      'Cash':          { bg: 'bg-emerald-500', text: 'text-emerald-700',icon: Banknote },
      'iDeal':         { bg: 'bg-purple-500',  text: 'text-purple-700', icon: Smartphone },
      'PayPal':        { bg: 'bg-cyan-500',    text: 'text-cyan-700',   icon: CreditCard },
      'USDT':          { bg: 'bg-amber-500',   text: 'text-amber-700',  icon: Coins },
      'Cheque':        { bg: 'bg-slate-500',   text: 'text-slate-700',  icon: FileText },
    };
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([method, count]) => ({
        method,
        count,
        pct: Math.round((count / total) * 100),
        ...(methodColors[method] || { bg: 'bg-slate-400', text: 'text-slate-600', icon: Package }),
      }));
  }, [payments, period]);

  // ── Empty-state helper ────────────────────────────────────────────────────
  const isEmpty = (arr: any[]) => arr.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Business Insights</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Financiële prestaties en bedrijfsanalyse</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['month', 'year', 'all'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {p === 'month' ? 'Deze maand' : p === 'year' ? 'Dit jaar' : 'Alles'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Omzet ontvangen', value: fmt(kpis.revenue, currencySymbol), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', trend: null },
          { label: 'Openstaand (AR)',  value: fmt(kpis.openAR, currencySymbol),  icon: AlertCircle, color: 'bg-amber-50 text-amber-600',  trend: null },
          { label: 'Gem. factuurwaarde', value: fmt(kpis.avgInvoice, currencySymbol), icon: FileText, color: 'bg-blue-50 text-blue-600', trend: null },
          { label: 'Avg. Payment Term', value: kpis.avgDays > 0 ? `${kpis.avgDays} days` : '—', icon: Clock, color: 'bg-purple-50 text-purple-600', trend: null },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.color}`}>
                <kpi.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 leading-none">{kpi.value}</p>
            <p className="text-[11px] font-bold text-slate-500 mt-1.5 uppercase tracking-wide">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Maandelijkse Omzet — {currentYear}</h3>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
            <span className="text-[10px] font-bold text-slate-500">Ontvangen betalingen</span>
          </div>
        </div>

        {isEmpty(payments) ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <div className="text-center"><BarChart3 size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">Geen betalingen geregistreerd</p></div>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-end gap-2 h-48">
              {monthlyRevenue.map((val, i) => {
                const pct = (val / maxRevenue) * 100;
                const isCurrentMonth = i === currentMonth;
                const isHovered = hoveredMonth === i;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredMonth(i)} onMouseLeave={() => setHoveredMonth(null)}>
                    {isHovered && val > 0 && (
                      <div className="absolute -mt-8 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-10">
                        {fmt(val, currencySymbol)}
                      </div>
                    )}
                    <div className={`w-full rounded-t-lg transition-all duration-200 ${isCurrentMonth ? 'bg-blue-500' : isHovered ? 'bg-slate-400' : 'bg-slate-200'}`}
                      style={{ height: pct > 0 ? `${Math.max(pct, 3)}%` : '3%', opacity: pct === 0 ? 0.3 : 1 }}>
                    </div>
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

      {/* Status + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Invoice Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Factuurstatus Verdeling</h3>
          {isEmpty(invoices) ? (
            <div className="h-32 flex items-center justify-center text-slate-400">
              <div className="text-center"><FileText size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">Geen facturen gevonden</p></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stacked bar */}
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

        {/* Top Clients */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Top 5 Klanten op Omzet</h3>
          {isEmpty(topClients) ? (
            <div className="h-32 flex items-center justify-center text-slate-400">
              <div className="text-center"><Users size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">Geen klantdata beschikbaar</p></div>
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
                        <p className={`text-[9px] font-black ${paidPct >= 100 ? 'text-emerald-600' : paidPct > 50 ? 'text-amber-600' : 'text-red-500'}`}>{paidPct}% paid</p>
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
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Payment Method Distribution</h3>
          {isEmpty(paymentMethods) ? (
            <div className="h-32 flex items-center justify-center text-slate-400">
              <div className="text-center"><CreditCard size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">Geen betalingen beschikbaar</p></div>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${m.bg.replace('bg-', 'bg-').replace('500', '100')} ${m.text} shrink-0`}>
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
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Omzet vs Kosten — Laatste 6 maanden</h3>
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500">Omzet</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-orange-400" /><span className="text-[10px] font-bold text-slate-500">Kosten</span></div>
          </div>
          {last6.every(m => m.rev === 0 && m.exp === 0) ? (
            <div className="h-32 flex items-center justify-center text-slate-400">
              <div className="text-center"><TrendingUp size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">Geen data beschikbaar</p></div>
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
                      <div className="flex-1 bg-emerald-500 rounded-t-md transition-all" style={{ height: `${Math.max(revH, revH > 0 ? 2 : 0)}%` }} title={`Omzet: ${fmt(m.rev, currencySymbol)}`} />
                      <div className="flex-1 bg-orange-400 rounded-t-md transition-all" style={{ height: `${Math.max(expH, expH > 0 ? 2 : 0)}%` }} title={`Kosten: ${fmt(m.exp, currencySymbol)}`} />
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
    </div>
  );
};

export default TrafficInsightsPage;
