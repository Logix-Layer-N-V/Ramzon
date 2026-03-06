
import React, { useState, useContext } from 'react';
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

interface HeaderProps {
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onToggleSidebar }) => {
  const { t, companyName, companyLogo } = useContext(LanguageContext);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

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
      title: 'Factuur achterstallig',
      message: 'Factuur INV-0042 van Tropical Wood NV is 14 dagen te laat.',
      time: '2 UUR GELEDEN',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      isRead: false
    },
    {
      id: 2,
      title: 'Betaling ontvangen',
      message: 'USD 3.450 ontvangen van Caribbean Furniture Group.',
      time: '1 DAG GELEDEN',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      isRead: true
    }
  ];

  return (
    <header className="h-20 md:h-16 border-b border-slate-200 bg-white sticky top-0 z-[1000] px-4 md:px-8 flex items-center justify-between pt-4 md:pt-0 transition-all">
      {isMobileSearchOpen && (
        <div className="absolute inset-0 bg-white z-[10001] flex items-center px-4 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              autoFocus
              type="text" 
              placeholder={t('search')} 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button onClick={() => setIsMobileSearchOpen(false)} className="ml-3 p-2 text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>
      )}

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
          <span className="hidden md:inline">Admin Dashboard</span>
        </button>
        <span className="text-slate-300 hidden md:inline">/</span>
        <span className="font-semibold italic text-slate-600 hidden md:inline">{breadcrumbLabel}</span>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <div className="hidden md:block relative group mr-2">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={t('search')} 
            className="pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-900 focus:ring-2 focus:ring-brand-accent-light outline-none w-48 lg:w-72 shadow-sm font-medium"
          />
        </div>

        <button onClick={() => setIsMobileSearchOpen(true)} className="p-2 md:hidden text-slate-500 hover:bg-slate-100 rounded-full transition-all">
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
              <div className="fixed md:absolute left-1/2 md:left-auto md:right-0 -translate-x-1/2 md:translate-x-0 mt-3 top-20 md:top-auto w-[calc(100vw-3rem)] md:w-[460px] bg-white border border-slate-200 rounded-[32px] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.3)] z-[10001] p-3 animate-in fade-in zoom-in-95 duration-200 ring-4 ring-black/5 md:ring-0 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 mb-2 flex justify-between items-center bg-slate-50/30 rounded-t-[24px]">
                  <div className="flex flex-col items-start text-left">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('notifications')}</p>
                    <p className="text-[10px] font-bold text-brand-accent uppercase tracking-wider mt-0.5">2 NIEUWE MELDINGEN</p>
                  </div>
                  <button onClick={() => setIsNotificationOpen(false)} className="p-1.5 text-slate-300 hover:text-slate-900 hover:bg-white rounded-full transition-all"><X size={18} /></button>
                </div>
                
                <div className="max-h-[450px] overflow-y-auto no-scrollbar py-1 space-y-1">
                  {notifications.map((n) => (
                    <button key={n.id} className="w-full text-left p-5 hover:bg-slate-50 rounded-[24px] flex gap-5 transition-all group">
                      <div className={`w-12 h-12 rounded-[18px] shrink-0 flex items-center justify-center ${n.bgColor} ${n.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                        <n.icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                        <div className="flex items-center justify-between w-full mb-1">
                          <p className="text-sm font-black text-slate-900 leading-tight">{n.title}</p>
                          <div className="flex items-center gap-2">
                             {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand-accent shrink-0"></div>}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed pr-4">{n.message}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{n.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-50 mt-2 bg-slate-50/20 rounded-b-[24px]">
                  <button className="w-full py-4 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">{t('viewAll')}</button>
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
                    <BookOpen size={18} className="text-slate-400 group-hover:text-slate-900" /> <span>Documentatie</span>
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
