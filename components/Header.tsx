
import React, { useState, useContext, useEffect } from 'react';
import {
  Search,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Plus,
  LayoutDashboard,
  X,
  Users,
  UserPlus,
  ClipboardList,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Banknote,
  Coins,
  Package,
  Wrench,
  BookOpen
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LanguageContext } from '../lib/context';
import { storage } from '../lib/storage';
import { useAuth } from '../lib/auth';

interface HeaderProps {
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onToggleSidebar }) => {
  const { t, companyName, companyLogo } = useContext(LanguageContext);
  const { user } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Ctrl+/ to toggle search overlay, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(v => !v);
        setSearchQuery('');
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('isLoggedIn');
      window.location.reload();
    }
  };

  const getBreadcrumbLabel = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return t('overview');
    
    const segment = segments[0];
    switch (segment) {
      case 'dashboard': return t('overview');
      case 'invoices': return t('invoices');
      case 'estimates': return t('estimates');
      case 'expenses': return t('expenses');
      case 'products': return t('products');
      case 'services': return t('services');
      case 'clients': return t('crm');
      case 'reports': return t('reports');
      case 'users': return t('users');
      case 'settings': return t('settings');
      default: return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  const breadcrumbLabel = getBreadcrumbLabel(location.pathname);

  const GlobalBackdrop = ({ onClick, zIndex = "z-[9999]" }: { onClick: () => void, zIndex?: string }) => (
    <div 
      className={`fixed inset-0 bg-black/[0.01] ${zIndex} animate-in fade-in duration-200`} 
      onClick={onClick}
    />
  );

  const notifications = [
    {
      id: 1,
      title: 'Overdue Invoice',
      message: 'Invoice INV-0042 from Tropical Wood NV is 14 days overdue.',
      time: '2 HOURS AGO',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      isRead: false
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'USD 3,450 received from Caribbean Furniture Group.',
      time: '1 DAY AGO',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      isRead: true
    }
  ];

  return (
    <header className="h-20 md:h-16 border-b border-slate-200 bg-white sticky top-0 z-[1000] px-4 md:px-8 flex items-center justify-between pt-4 md:pt-0 transition-all">
      {/* Advanced Search Overlay */}
      {isSearchOpen && (() => {
        const q = searchQuery.toLowerCase();
        const invoiceResults = q.length >= 1
          ? storage.invoices.get().filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.clientName.toLowerCase().includes(q)).slice(0, 4)
          : [];
        const estimateResults = q.length >= 1
          ? storage.estimates.get().filter(e => ((e as any).estimateNumber ?? '').toLowerCase().includes(q) || e.clientName.toLowerCase().includes(q)).slice(0, 4)
          : [];
        const clientResults = q.length >= 1
          ? storage.clients.get().filter(c => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 4)
          : [];
        const hasResults = invoiceResults.length + estimateResults.length + clientResults.length > 0;

        return (
          <div className="fixed inset-0 z-[10002] flex items-start justify-center pt-[10vh] px-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} />
            <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 z-10">
              {/* Search input */}
              <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
                <Search size={20} className="text-slate-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search invoices, clients, estimates..."
                  className="flex-1 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 bg-transparent"
                />
                <kbd className="px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded border border-slate-200 shrink-0">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                {q.length === 0 ? (
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {([
                      { label: 'Invoices',  path: '/invoices',  Icon: Receipt,      color: 'text-brand-accent bg-brand-accent-light' },
                      { label: 'Estimates', path: '/estimates', Icon: ClipboardList, color: 'text-violet-600 bg-violet-50' },
                      { label: 'Clients',   path: '/clients',   Icon: Users,         color: 'text-blue-600 bg-blue-50' },
                      { label: 'Payments',  path: '/payments',  Icon: Banknote,      color: 'text-amber-600 bg-amber-50' },
                    ] as const).map(item => (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); setIsSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all text-left group"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                          <item.Icon size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : !hasResults ? (
                  <div className="py-12 text-center">
                    <p className="text-slate-400 font-medium text-sm">No results for <span className="font-black text-slate-600">"{searchQuery}"</span></p>
                  </div>
                ) : (
                  <div className="p-3 space-y-1">
                    {invoiceResults.length > 0 && (
                      <>
                        <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoices</p>
                        {invoiceResults.map(inv => (
                          <button key={inv.id}
                            onClick={() => { navigate(`/invoices/${inv.id}`); setIsSearchOpen(false); setSearchQuery(''); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                          >
                            <div className="w-9 h-9 bg-brand-accent-light text-brand-accent rounded-xl flex items-center justify-center shrink-0">
                              <Receipt size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-900">{inv.invoiceNumber}</p>
                              <p className="text-[11px] text-slate-400 font-medium truncate">{inv.clientName}</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 shrink-0" />
                          </button>
                        ))}
                      </>
                    )}
                    {estimateResults.length > 0 && (
                      <>
                        <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimates</p>
                        {estimateResults.map(est => (
                          <button key={est.id}
                            onClick={() => { navigate(`/estimates/${est.id}`); setIsSearchOpen(false); setSearchQuery(''); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                          >
                            <div className="w-9 h-9 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
                              <ClipboardList size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-900">{(est as any).estimateNumber ?? est.id}</p>
                              <p className="text-[11px] text-slate-400 font-medium truncate">{est.clientName}</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 shrink-0" />
                          </button>
                        ))}
                      </>
                    )}
                    {clientResults.length > 0 && (
                      <>
                        <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Clients</p>
                        {clientResults.map(cli => (
                          <button key={cli.id}
                            onClick={() => { navigate(`/clients/${cli.id}`); setIsSearchOpen(false); setSearchQuery(''); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                          >
                            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                              <Users size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-900">{cli.name}</p>
                              <p className="text-[11px] text-slate-400 font-medium truncate">{cli.company}</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 shrink-0" />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Footer hints */}
              <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center gap-4 text-[10px] font-bold text-slate-400">
                <span>↵ to open</span>
                <span>·</span>
                <span>ESC to close</span>
                <span className="ml-auto">ctrl+/ to toggle</span>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex items-center gap-2 md:gap-4 text-sm font-medium text-slate-500">
        <button onClick={onToggleSidebar} className="p-2 md:p-0 text-slate-900 font-bold hover:text-brand-accent transition-colors flex items-center gap-3 text-left">
          {/* Logo container - md:hidden zorgt ervoor dat dit alleen op mobiel zichtbaar is */}
          <div className="h-11 w-auto max-w-[130px] flex items-center justify-center active:scale-95 transition-transform shrink-0 md:hidden">
            {companyLogo ? (
              <img src={companyLogo} className="h-full w-auto object-contain" alt="Logo" />
            ) : (
              <LayoutDashboard size={24} className="text-brand-primary" />
            )}
          </div>
          <span className="hidden md:inline">{user?.role ? `${user.role} Dashboard` : 'Dashboard'}</span>
        </button>
        <span className="text-slate-300 hidden md:inline">/</span>
        <span className="font-semibold italic text-slate-600 hidden md:inline">{breadcrumbLabel}</span>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* Desktop search trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-3 pl-4 pr-3 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-400 w-48 lg:w-64 shadow-sm hover:border-slate-300 transition-all mr-2"
        >
          <Search size={15} className="shrink-0" />
          <span className="flex-1 text-left font-medium">{t('search')}...</span>
          <kbd className="hidden lg:flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded border border-slate-200 shrink-0">ctrl+/</kbd>
        </button>

        {/* Mobile search icon */}
        <button onClick={() => setIsSearchOpen(true)} className="p-2 md:hidden text-slate-500 hover:bg-slate-100 rounded-full transition-all">
          <Search size={20} />
        </button>
        
        {/* Quick Create Menu */}
        <div className="relative">
          <button 
            onClick={() => { setIsQuickCreateOpen(!isQuickCreateOpen); setIsUserMenuOpen(false); setIsNotificationOpen(false); }}
            className={`p-2 rounded-full transition-all border group ${isQuickCreateOpen ? 'bg-brand-primary text-white border-brand-primary shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200'}`}
          >
            <Plus size={20} className={`transition-transform duration-300 ${isQuickCreateOpen ? 'rotate-90' : 'group-hover:scale-110'}`} />
          </button>

          {isQuickCreateOpen && (
            <>
              <GlobalBackdrop onClick={() => setIsQuickCreateOpen(false)} zIndex="z-[10000]" />
              <div className="fixed md:absolute left-1/2 md:left-auto md:right-0 -translate-x-1/2 md:translate-x-0 mt-3 top-20 md:top-auto w-[calc(100vw-3rem)] md:w-[460px] max-h-[85vh] overflow-y-auto no-scrollbar bg-white border border-slate-200 rounded-[32px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] z-[10001] p-3 animate-in fade-in zoom-in-95 duration-200 ring-4 ring-black/5 md:ring-0">
                <div className="px-6 py-4 border-b border-slate-50 mb-2 flex justify-between items-center bg-slate-50/30 rounded-t-[24px] sticky top-0 z-20">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('quickCreate')}</p>
                </div>
                <div className="grid grid-cols-1 gap-1 p-1">
                  
                  {/* CLIENT */}
                  <button onClick={() => { navigate('/clients/new'); setIsQuickCreateOpen(false); }} className="w-full px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-[20px] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Users size={20} /></div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-bold text-slate-900">{t('newClient')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Add to CRM database</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-blue-600" />
                  </button>

                  {/* ESTIMATE */}
                  <button onClick={() => { navigate('/estimates/new'); setIsQuickCreateOpen(false); }} className="w-full px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-[20px] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><ClipboardList size={20} /></div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-bold text-slate-900">{t('newEstimate')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Generate timber proposal</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-violet-600" />
                  </button>

                  {/* INVOICE */}
                  <button onClick={() => { navigate('/invoices/new'); setIsQuickCreateOpen(false); }} className="w-full px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-[20px] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-brand-accent-light text-brand-accent rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Receipt size={20} /></div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-bold text-slate-900">{t('newInvoice')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Bill a professional client</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-brand-accent" />
                  </button>

                  {/* PAYMENT */}
                  <button onClick={() => { navigate('/payments'); setIsQuickCreateOpen(false); }} className="w-full px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-[20px] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Banknote size={20} /></div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-bold text-slate-900">{t('newPayment')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Record incoming transaction</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-amber-600" />
                  </button>

                  {/* CREDIT */}
                  <button onClick={() => { navigate('/credits'); setIsQuickCreateOpen(false); }} className="w-full px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-[20px] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Coins size={20} /></div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-bold text-slate-900">{t('newCredit')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Issue client balance adjustment</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-indigo-600" />
                  </button>

                  {/* PRODUCT */}
                  <button onClick={() => { navigate('/products/new'); setIsQuickCreateOpen(false); }} className="w-full px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-[20px] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Package size={20} /></div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-bold text-slate-900">{t('newProduct')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Register new wood species</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-orange-600" />
                  </button>

                  {/* SERVICE */}
                  <button onClick={() => { navigate('/services'); setIsQuickCreateOpen(false); }} className="w-full px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-[20px] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><Wrench size={20} /></div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-bold text-slate-900">{t('newService')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Define custom sawmill service</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-pink-600" />
                  </button>

                  {/* USER */}
                  <button onClick={() => { navigate('/users'); setIsQuickCreateOpen(false); }} className="w-full px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-[20px] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"><UserPlus size={20} /></div>
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-bold text-slate-900">{t('newUser')}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Manage team access levels</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-slate-600" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* NOTIFICATION DROP-DOWN */}
        <div className="relative">
          <button 
            onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsQuickCreateOpen(false); setIsUserMenuOpen(false); }}
            className={`p-2 rounded-full transition-all border group relative ${isNotificationOpen ? 'bg-brand-primary text-white border-brand-primary shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-slate-200'}`}
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {isNotificationOpen && (
            <>
              <GlobalBackdrop onClick={() => setIsNotificationOpen(false)} zIndex="z-[10000]" />
              <div className="fixed md:absolute left-1/2 md:left-auto md:right-0 -translate-x-1/2 md:translate-x-0 mt-3 top-20 md:top-auto w-[calc(100vw-3rem)] md:w-[400px] bg-white border border-slate-200 rounded-[24px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] z-[10001] p-2 animate-in fade-in zoom-in-95 duration-200 ring-4 ring-black/5 md:ring-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 mb-1 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('notifications')}</p>
                    <span className="px-1.5 py-0.5 bg-brand-accent/10 text-brand-accent rounded-full text-[9px] font-black uppercase tracking-wide">2 nieuw</span>
                  </div>
                  <button onClick={() => setIsNotificationOpen(false)} className="p-1 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"><X size={15} /></button>
                </div>

                <div className="max-h-[320px] overflow-y-auto no-scrollbar py-0.5 space-y-0.5">
                  {notifications.map((n) => (
                    <button key={n.id} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-xl flex gap-3 transition-all group">
                      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${n.bgColor} ${n.color} group-hover:scale-110 transition-transform duration-200`}>
                        <n.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                        <div className="flex items-center justify-between w-full">
                          <p className="text-xs font-black text-slate-900 leading-tight">{n.title}</p>
                          {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-brand-accent shrink-0 ml-2"></div>}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-snug mt-0.5">{n.message}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-2 py-2 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => { setIsNotificationOpen(false); navigate('/notifications'); }}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    {t('viewAll')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2"></div>

        <div className="relative">
          <button 
            onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsQuickCreateOpen(false); setIsNotificationOpen(false); }}
            className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-full transition-all group border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm">
              <img src="https://picsum.photos/seed/admin/100/100" className="w-full h-full object-cover" alt="Avatar" />
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform mr-1 ${isUserMenuOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
          </button>

          {isUserMenuOpen && (
            <>
              <GlobalBackdrop onClick={() => setIsUserMenuOpen(false)} zIndex="z-[10000]" />
              <div className="fixed md:absolute right-4 md:right-0 mt-3 top-20 md:top-auto w-[calc(100vw-4rem)] md:w-64 max-w-[280px] bg-white border border-slate-200 rounded-[32px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] z-[10001] p-2 animate-in fade-in zoom-in-95 duration-200 ring-4 ring-black/5 md:ring-0">
                <div className="px-5 py-4 border-b border-slate-50 mb-1 flex justify-between items-center">
                  <div className="flex flex-col items-start text-left"><p className="text-sm font-black text-slate-900 leading-tight">Alex Andria</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admin</p></div>
                </div>
                <div className="space-y-0.5 mt-1">
                  <button onClick={() => { navigate('/users'); setIsUserMenuOpen(false); }} className="w-full px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-2xl flex items-center gap-4 transition-colors group text-left">
                    <UserPlus size={18} className="text-slate-400 group-hover:text-slate-900" /> <span>{t('users')}</span>
                  </button>
                  <button onClick={() => { navigate('/settings'); setIsUserMenuOpen(false); }} className="w-full px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-2xl flex items-center gap-4 transition-colors group text-left">
                    <Settings size={18} className="text-slate-400 group-hover:text-slate-900" /> <span>{t('settings')}</span>
                  </button>
                  <button onClick={() => { navigate('/documentation'); setIsUserMenuOpen(false); }} className="w-full px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-2xl flex items-center gap-4 transition-colors group text-left">
                    <BookOpen size={18} className="text-slate-400 group-hover:text-slate-900" /> <span>Documentation</span>
                  </button>
                  <button className="w-full px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-2xl flex items-center gap-4 transition-colors group text-left">
                    <Shield size={18} className="text-slate-400 group-hover:text-slate-900" /> <span>{t('security')}</span>
                  </button>
                </div>
                <div className="my-1 border-t border-slate-100 mx-2"></div>
                <button onClick={handleLogoutClick} className="w-full px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-2xl flex items-center gap-4 transition-colors">
                  <LogOut size={18} className="rotate-180" /> <span>{t('logout')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
