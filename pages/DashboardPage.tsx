
import React, { useContext, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Clock,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { mockInvoices, mockPayments, mockEstimates, mockExpenses, mockCredits, mockClients } from '../lib/mock-data';
import { storage } from '../lib/storage';
import { LanguageContext } from '../lib/context';
import type { Invoice, Payment, Estimate, Expense, Credit, Client } from '../types';

const merge = <T extends { id: string }>(stored: T[], mock: T[]): T[] => {
  if (stored.length === 0) return mock;
  const ids = new Set(stored.map(x => x.id));
  return [...mock.filter(x => !ids.has(x.id)), ...stored];
};

const DashboardPage: React.FC = () => {
  const { currencySymbol } = useContext(LanguageContext);

  const invoices  = useMemo(() => merge(storage.invoices.get(),  mockInvoices),  []);
  const payments  = useMemo(() => merge(storage.payments.get(),  mockPayments),  []);
  const estimates = useMemo(() => merge(storage.estimates.get(), mockEstimates), []);
  const expenses  = useMemo(() => merge(storage.expenses.get(),  mockExpenses),  []);
  const credits   = useMemo(() => merge(storage.credits.get(),   mockCredits),   []);
  const clients   = useMemo(() => merge(storage.clients.get(),   mockClients),   []);

  // KPI computations
  const totalRevenue   = payments.filter(p => p.status !== 'Refunded').reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses  = expenses.reduce((sum, e) => sum + e.amount, 0);
  const creditNotes    = credits.reduce((sum, c) => sum + c.amount, 0);
  const netProfit      = totalRevenue - totalExpenses - creditNotes;

  const openInvoices   = invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled');
  const openInvoiceTotal = openInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  const openEstimates  = estimates.filter(e => e.status === 'Sent' || e.status === 'Draft');

  const pendingInvoices = invoices.filter(i => i.status === 'Pending');

  const KpiCard = ({ title, value, trend, isPositive, subtitle, icon: Icon }: any) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        </div>
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-brand-accent-light text-brand-accent' : 'bg-red-50 text-red-600'}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
        <p className="text-[10px] text-slate-500 font-bold">{subtitle}</p>
        <div className={`flex items-center gap-1 text-[10px] font-black ${isPositive ? 'text-brand-accent' : 'text-red-600'}`}>
          {trend} {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-sm font-medium text-slate-500">Ramzon N.V. • Real-time Business Health</p>
        </div>
        <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-full flex items-center gap-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Gateway: Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Net Revenue"
          value={`${currencySymbol}${totalRevenue.toLocaleString()}`}
          trend={`${payments.length} payments`}
          isPositive={true}
          subtitle={`Net profit: ${currencySymbol}${netProfit.toLocaleString()}`}
          icon={DollarSign}
        />
        <KpiCard
          title="Outstanding"
          value={`${currencySymbol}${openInvoiceTotal.toLocaleString()}`}
          trend={`${openInvoices.length} invoices`}
          isPositive={false}
          subtitle={`${pendingInvoices.length} invoices pending`}
          icon={Clock}
        />
        <KpiCard
          title="Expenses"
          value={`${currencySymbol}${totalExpenses.toLocaleString()}`}
          trend={`${expenses.length} records`}
          isPositive={false}
          subtitle={`${clients.length} active clients · ${openEstimates.length} open estimates`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Receipt size={16} className="text-brand-accent" /> Pending Invoices
              </h3>
              <button className="text-[10px] font-black text-brand-accent hover:underline uppercase tracking-widest">View Billing</button>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingInvoices.map((inv) => (
                <div key={inv.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-accent-light group-hover:text-brand-accent transition-colors">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{inv.clientName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{inv.invoiceNumber} • Due {inv.dueDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{currencySymbol}{inv.totalAmount.toLocaleString()}</p>
                      <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest italic">Action Required</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-brand-primary p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="relative z-10">
              <h4 className="text-brand-accent text-[10px] font-black uppercase tracking-[0.2em] mb-4">Ramzon Intelligence</h4>
              <p className="text-lg font-bold leading-tight mb-6">You have {currencySymbol}{openInvoiceTotal.toLocaleString()} outstanding across {openInvoices.length} open invoice{openInvoices.length !== 1 ? 's' : ''}.</p>
              <button className="w-full py-3 bg-white text-slate-900 rounded-xl text-xs font-black shadow-lg hover:bg-brand-accent-light transition-all">
                Send Reminders
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Cashflow Forecast</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-bold italic">Open Estimates Pipeline</span>
                <span className="text-slate-900 font-black">{currencySymbol}{openEstimates.reduce((s, e) => s + e.total, 0).toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent w-3/4" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Based on current quotes and recurring invoices.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
