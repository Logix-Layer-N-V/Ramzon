
import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  CheckCircle2, 
  Plus, 
  Receipt, 
  ClipboardList, 
  Wallet, 
  CreditCard,
  User,
  ArrowRight,
  Pencil,
  FileText
} from 'lucide-react';
import { mockClients, mockInvoices, mockEstimates, mockPayments, mockCredits } from '../lib/mock-data';
import { LanguageContext } from '../lib/context';
import { Search, BarChart3 } from 'lucide-react';

type ClientTab = 'overview' | 'estimates' | 'invoices' | 'payments' | 'credits';

const CURRENCIES = ['All', 'EUR', 'USD', 'SRD'];
const DATE_FILTERS = ['All', 'Today', 'This week', 'This month', 'Custom'];

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, currencySymbol } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState<ClientTab>('overview');
  const [dateFilter, setDateFilter] = useState('All');
  const [currencyFilter, setCurrencyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const client = mockClients.find(c => c.id === id);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <User size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Client not found</h2>
        <button onClick={() => navigate('/clients')} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm">
          Back to CRM
        </button>
      </div>
    );
  }

  const clientInvoices = mockInvoices.filter(i => i.clientId === id);
  const clientEstimates = mockEstimates.filter(e => e.clientId === id);
  const clientPayments = mockPayments.filter(p => p.clientId === id);
  const clientCredits = mockCredits.filter(c => c.clientId === id);


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> {t('backToCRM')}
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/clients/edit/${client.id}`)}
            className="bg-white border border-slate-200 text-slate-900 px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
          >
            <Pencil size={14} /> {t('editRelation')}
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
        
        <div className="relative flex flex-col md:flex-row gap-8 items-start">
          <div className="w-20 h-20 bg-slate-100 text-brand-primary rounded-[24px] flex items-center justify-center shadow-inner shrink-0">
            <Building size={40} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">{client.company}</h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border border-emerald-100 shadow-sm">
                <CheckCircle2 size={10} /> {client.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client ID: <span className="text-slate-900">{client.id.toUpperCase()}</span></span>
              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type: <span className="text-slate-900">Professional Buyer</span></span>
            </div>
          </div>
          <div className="text-right bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 shadow-inner">
            <p className="text-3xl font-black text-slate-900 italic">{currencySymbol}{client.totalSpent.toLocaleString()}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{t('totalRevenue')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8 border-t border-slate-50 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">Contact Person</label>
            <p className="text-sm font-black text-slate-800">{client.name}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">VAT Number</label>
            <p className="text-sm font-bold text-slate-600 font-mono tracking-tighter">{client.vatNumber}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">Email Address</label>
            <p className="text-sm font-black text-brand-primary underline decoration-brand-accent-light underline-offset-4">{client.email}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">Location</label>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 italic">
              <MapPin size={12} className="text-slate-300" />
              {client.address}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Control - Reordered as per request: Estimate -> Invoice -> Payment -> Credit */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'estimates', label: 'Quotes', icon: ClipboardList },
            { id: 'invoices', label: 'Invoices', icon: Receipt },
            { id: 'payments', label: 'Payments', icon: Wallet },
            { id: 'credits', label: 'Credits', icon: CreditCard },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ClientTab)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'}`}
            >
              <tab.icon size={14} className={activeTab === tab.id ? 'text-brand-primary' : 'opacity-40'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Canvas - All rows now navigate to detail pages */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <div className="divide-y divide-slate-50 animate-in fade-in duration-500">
            {activeTab === 'estimates' && (
              clientEstimates.length > 0 ? clientEstimates.map(est => (
                <div 
                  key={est.id} 
                  onClick={() => navigate(`/estimates/${est.id}`)}
                  className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><ClipboardList size={22} /></div>
                    <div>
                      <p className="text-sm font-black text-slate-900 italic tracking-tight">{est.estimateNumber}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{est.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900 italic">{currencySymbol}{est.total.toLocaleString()}</p>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${est.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{est.status}</span>
                    </div>
                    <ArrowRight size={20} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              )) : <EmptyState icon={ClipboardList} label="No quotes found" />
            )}

            {activeTab === 'invoices' && (
              clientInvoices.length > 0 ? clientInvoices.map(inv => (
                <div 
                  key={inv.id} 
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group cursor-pointer border-l-4 border-l-transparent hover:border-l-emerald-500"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Receipt size={22} /></div>
                    <div>
                      <p className="text-sm font-black text-slate-900 italic tracking-tight">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{inv.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900 italic">{currencySymbol}{inv.totalAmount.toLocaleString()}</p>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{inv.status}</span>
                    </div>
                    <ArrowRight size={20} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              )) : <EmptyState icon={Receipt} label="No invoices found" />
            )}

            {activeTab === 'payments' && (
              clientPayments.length > 0 ? clientPayments.map(pay => (
                <div 
                  key={pay.id} 
                  onClick={() => navigate(`/payments/${pay.id}`)}
                  className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group border-l-4 border-l-transparent hover:border-l-indigo-500 cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Wallet size={22} /></div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{pay.method}</p>
                      <p className="text-[10px] text-slate-400 font-bold italic tracking-tight">{pay.reference}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-600 italic">+{currencySymbol}{pay.amount.toLocaleString()}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{pay.date}</p>
                    </div>
                    <ArrowRight size={20} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              )) : <EmptyState icon={Wallet} label="No payment history" />
            )}

            {activeTab === 'overview' && (() => {
              const allTx = [
                ...clientEstimates.map(e => ({ id: e.id, path: `/estimates/${e.id}`, type: 'Quote', number: e.estimateNumber, date: e.date, amount: e.total, status: e.status, currency: 'EUR', icon: ClipboardList, color: 'blue' })),
                ...clientInvoices.map(i => ({ id: i.id, path: `/invoices/${i.id}`, type: 'Invoice', number: i.invoiceNumber, date: i.date, amount: i.totalAmount, status: i.status, currency: 'EUR', icon: Receipt, color: 'emerald' })),
                ...clientPayments.map(p => ({ id: p.id, path: `/payments/${p.id}`, type: 'Payment', number: p.reference, date: p.date, amount: p.amount, status: 'Received', currency: 'EUR', icon: Wallet, color: 'indigo' })),
                ...clientCredits.map(c => ({ id: c.id, path: `/credits/${c.id}`, type: 'Credit', number: c.id, date: c.date, amount: c.amount, status: c.status, currency: 'EUR', icon: CreditCard, color: 'amber' })),
              ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
               .filter(tx => {
                 const q = searchQuery.toLowerCase();
                 const matchQ = !q || tx.number?.toLowerCase().includes(q) || tx.type.toLowerCase().includes(q) || String(tx.amount).includes(q);
                 const matchC = currencyFilter === 'All' || tx.currency === currencyFilter;
                 if (!matchQ || !matchC) return false;
                 if (dateFilter === 'All') return true;
                 const txDate = new Date(tx.date);
                 const now = new Date();
                 if (dateFilter === 'Today') return txDate.toDateString() === now.toDateString();
                 if (dateFilter === 'This week') { const w = new Date(now); w.setDate(now.getDate()-7); return txDate >= w; }
                 if (dateFilter === 'This month') return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
                 return true;
               });
              const colorMap: Record<string,string> = { blue:'bg-blue-50 text-blue-600', emerald:'bg-emerald-50 text-emerald-600', indigo:'bg-indigo-50 text-indigo-600', amber:'bg-amber-50 text-amber-600' };
              return (
                <div>
                  {/* Filter bar */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-48">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input aria-label="Search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by number, type, amount..." className="w-full pl-8 pr-4 py-2 text-xs font-bold border border-slate-200 rounded-xl outline-none bg-white"/>
                    </div>
                    <select aria-label="Datum filter" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl outline-none bg-white">
                      {DATE_FILTERS.map(f => <option key={f}>{f}</option>)}
                    </select>
                    <select aria-label="Currency filter" value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)} className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl outline-none bg-white">
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <span className="text-[10px] font-black text-slate-400">{allTx.length} transactions</span>
                  </div>
                  {/* Table header */}
                  <div className="grid grid-cols-12 px-6 py-2 bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-2">Type</div>
                    <div className="col-span-3">Number</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Currency</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-1 text-center">Status</div>
                  </div>
                  {allTx.length === 0 ? <EmptyState icon={BarChart3} label="No transactions found"/> : allTx.map(tx => {
                    const Icon = tx.icon;
                    return (
                      <div key={tx.id} onClick={() => navigate(tx.path)} className="grid grid-cols-12 px-6 py-3 hover:bg-slate-50/60 border-b border-slate-50 cursor-pointer group transition-colors text-xs items-center">
                        <div className="col-span-2 flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorMap[tx.color]}`}><Icon size={13}/></div>
                          <span className="font-bold text-slate-600">{tx.type}</span>
                        </div>
                        <div className="col-span-3 font-black text-slate-900 italic">{tx.number}</div>
                        <div className="col-span-2 text-slate-400 font-bold">{tx.date}</div>
                        <div className="col-span-2 font-bold text-slate-500">{tx.currency}</div>
                        <div className="col-span-2 text-right font-black text-slate-900">{currencySymbol}{tx.amount.toLocaleString()}</div>
                        <div className="col-span-1 text-center"><span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{tx.status}</span></div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {activeTab === 'credits' && (
              clientCredits.length > 0 ? clientCredits.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => navigate(`/credits/${c.id}`)}
                  className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group border-l-4 border-l-transparent hover:border-l-amber-500 cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><CreditCard size={22} /></div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Credit Note</p>
                      <p className="text-[10px] text-slate-400 font-bold italic tracking-tight">{c.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xl font-black text-blue-600 italic">{currencySymbol}{c.amount.toLocaleString()}</p>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{c.status}</span>
                    </div>
                    <ArrowRight size={20} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              )) : <EmptyState icon={CreditCard} label="No outstanding credits" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="py-32 flex flex-col items-center justify-center text-slate-300 gap-6">
    <div className="p-8 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100 shadow-inner">
      <Icon size={64} className="opacity-10" />
    </div>
    <div className="text-center space-y-1">
      <p className="text-sm font-black uppercase tracking-[0.3em] italic text-slate-400">{label}</p>
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Create a new document to get started</p>
    </div>
  </div>
);

export default ClientDetailPage;
