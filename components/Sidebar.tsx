
import React, { useState, useContext, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  ClipboardList,
  CreditCard,
  Wallet,
  Layers,
  Settings2,
  Banknote,
  Coins,
  Globe2,
  LayoutTemplate,
  BarChart3,
  Activity,
  Tag,
  Store,
  ListFilter,
  BookOpen,
  Landmark,
  X,
} from 'lucide-react';
import { LanguageContext } from '../lib/context';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, isCollapsed, onToggleCollapse }) => {
  const { t, multiCurrency, companyName, companyLogo } = useContext(LanguageContext);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    dashboard: false,
    billing: currentPath.startsWith('/invoices') || currentPath.startsWith('/estimates') || currentPath.startsWith('/payments') || currentPath.startsWith('/credits'),
    expenses: currentPath.startsWith('/expenses'),
    products: currentPath.startsWith('/products'),
    services: currentPath.startsWith('/services'),
    reports: currentPath.startsWith('/reports'),
    users: currentPath === '/users' || currentPath === '/documentation',
  });

  useEffect(() => {
    const isBilling = currentPath.startsWith('/invoices') || currentPath.startsWith('/estimates') || currentPath.startsWith('/payments') || currentPath.startsWith('/credits') || currentPath.startsWith('/currencies');
    const isExpenses = currentPath.startsWith('/expenses');
    const isProducts = currentPath.startsWith('/products');
    const isServices = currentPath.startsWith('/services');
    const isReports = currentPath.startsWith('/reports');
    const isUsers = currentPath === '/users' || currentPath === '/documentation';

    setOpenMenus({
      dashboard: false,
      billing: isBilling,
      expenses: isExpenses,
      products: isProducts,
      services: isServices,
      reports: isReports,
      users: isUsers,
    });
  }, [currentPath]);

  const NavItem = ({ label, icon: Icon, path, active, hasDropdown, menuKey }: { 
    label: string, 
    icon: any, 
    path?: string, 
    active: boolean, 
    hasDropdown?: boolean,
    menuKey?: string
  }) => {
    return (
      <div className="flex flex-col w-full px-3">
        <button
          onClick={() => {
            if (path) onNavigate(path);
            if (hasDropdown && menuKey && !isCollapsed) setOpenMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
            if (isCollapsed && onToggleCollapse) onToggleCollapse();
          }}
          className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            active && !hasDropdown
              ? 'bg-brand-primary text-white shadow-lg' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`}
        >
          <Icon size={18} className={`shrink-0 ${active ? 'scale-110' : ''}`} />
          {(!isCollapsed || window.innerWidth < 768) && <span className="flex-1 text-left whitespace-nowrap overflow-hidden">{label}</span>}
          {hasDropdown && (!isCollapsed || window.innerWidth < 768) && (
            <ChevronDown size={14} className={`transition-transform ${openMenus[menuKey!] ? 'rotate-180' : ''}`} />
          )}
        </button>
      </div>
    );
  };

  const SubMenuItem = ({ label, icon: Icon, path, active }: { 
    label: string, 
    icon: any, 
    path: string, 
    active: boolean
  }) => {
    if (isCollapsed && window.innerWidth >= 768) return null;
    return (
      <button
        onClick={() => onNavigate(path)}
        className={`w-full flex items-center gap-3 pl-11 pr-3 py-2 rounded-lg text-xs font-bold transition-all ${
          active ? 'text-brand-accent bg-brand-accent-light/50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Icon size={14} />
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  };

  return (
    <>
      {!isCollapsed && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1005] md:hidden" onClick={onToggleCollapse} />
      )}

      <div className={`
        ${isCollapsed ? 'md:w-20 -translate-x-full md:translate-x-0' : 'w-72 translate-x-0'} 
        fixed md:sticky top-0 left-0 border-r border-slate-200 h-screen flex flex-col bg-white transition-all duration-300 z-[1010] md:z-[40]
      `}>
        {/* Logo container */}
        {(!isCollapsed || window.innerWidth < 768) ? (
          <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Ramzon Logo"
                  className="w-full max-h-24 object-contain object-left"
                />
              ) : (
                <div className="py-2">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 block">{companyName}</span>
                  <span className="block text-[10px] font-bold text-brand-accent uppercase tracking-widest leading-none mt-1">Invoice Center</span>
                </div>
              )}
            </div>
            {/* X close button — mobile only */}
            <button
              onClick={onToggleCollapse}
              className="md:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
              title="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-4 border-b border-slate-100">
            <img src="/favicon.png" alt="Ramzon" className="w-10 h-10 object-contain" />
          </div>
        )}

        <div className="flex-1 space-y-1 mt-4 overflow-y-auto no-scrollbar pb-4">
          <NavItem label={t('overview')} icon={LayoutDashboard} path="/dashboard" active={currentPath === '/dashboard'} />
          <NavItem label={t('crm')} icon={Users} path="/clients" active={currentPath.startsWith('/clients')} />
          
          {/* Billing */}
          <div className="space-y-1">
            <NavItem label={t('billing')} icon={CreditCard} hasDropdown menuKey="billing"
              active={currentPath.startsWith('/invoices') || currentPath.startsWith('/estimates') || currentPath.startsWith('/payments') || currentPath.startsWith('/credits') || currentPath.startsWith('/recurring') || currentPath.startsWith('/currencies')} />
            {openMenus.billing && (
              <div className="overflow-hidden">
                <SubMenuItem label={t('estimates')} icon={ClipboardList} path="/estimates" active={currentPath === '/estimates'} />
                <SubMenuItem label={t('invoices')} icon={Receipt} path="/invoices" active={currentPath === '/invoices'} />
                <SubMenuItem label={t('payments')} icon={Banknote} path="/payments" active={currentPath === '/payments'} />
                <SubMenuItem label={t('credits')} icon={Coins} path="/credits" active={currentPath === '/credits'} />
                <SubMenuItem label={t('multiCurrencyMenu')} icon={Globe2} path="/currencies" active={currentPath === '/currencies'} />
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className="space-y-1">
            <NavItem label={t('expenses')} icon={Wallet} hasDropdown menuKey="expenses" active={currentPath.startsWith('/expenses')} />
            {openMenus.expenses && (
              <div className="overflow-hidden">
                <SubMenuItem label={t('allExpenses')} icon={ListFilter} path="/expenses" active={currentPath === '/expenses'} />
                <SubMenuItem label={t('categories')} icon={Tag} path="/expenses/categories" active={currentPath === '/expenses/categories'} />
                <SubMenuItem label={t('vendors')} icon={Store} path="/expenses/vendors" active={currentPath === '/expenses/vendors'} />
              </div>
            )}
          </div>

          {/* Internal Finance */}
          <NavItem label={t('internalFinance')} icon={Landmark} path="/finance" active={currentPath === '/finance'} />

          {/* Products */}
          <div className="space-y-1">
            <NavItem label={t('products')} icon={Layers} hasDropdown menuKey="products" active={currentPath.startsWith('/products')} />
            {openMenus.products && (
              <div className="overflow-hidden">
                <SubMenuItem label={t('allProducts')} icon={Layers} path="/products" active={currentPath === '/products'} />
                <SubMenuItem label={t('categories')} icon={Tag} path="/products/categories" active={currentPath === '/products/categories'} />
              </div>
            )}
          </div>

          {/* Services */}
          <div className="space-y-1">
            <NavItem label={t('services')} icon={Settings2} hasDropdown menuKey="services" active={currentPath.startsWith('/services')} />
            {openMenus.services && (
              <div className="overflow-hidden">
                <SubMenuItem label={t('allServices')} icon={Settings2} path="/services" active={currentPath === '/services'} />
                <SubMenuItem label={t('categories')} icon={Tag} path="/services/categories" active={currentPath === '/services/categories'} />
              </div>
            )}
          </div>

          <NavItem label={t('docStyles')} icon={LayoutTemplate} path="/appearance" active={currentPath === '/appearance'} />

          {/* Reports */}
          <div className="space-y-1">
            <NavItem label={t('reports')} icon={FileText} hasDropdown menuKey="reports"
              active={currentPath.startsWith('/reports')} />
            {openMenus.reports && (
              <div className="overflow-hidden">
                <SubMenuItem label={t('financeReports')} icon={BarChart3} path="/reports/finance" active={currentPath === '/reports/finance'} />
                <SubMenuItem label={t('systemHealth')}   icon={Activity}  path="/reports/health"  active={currentPath === '/reports/health'} />
              </div>
            )}
          </div>

          {/* Users */}
          <div className="space-y-1">
            <NavItem label={t('users')} icon={Users} hasDropdown menuKey="users" active={currentPath === '/users' || currentPath === '/documentation'} />
            {openMenus.users && (
              <div className="overflow-hidden">
                <SubMenuItem label={t('users')} icon={Users} path="/users" active={currentPath === '/users'} />
                <SubMenuItem label={t('documentation')} icon={BookOpen} path="/documentation" active={currentPath === '/documentation'} />
              </div>
            )}
          </div>
        </div>

        <div className={`px-3 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
          {(!isCollapsed || window.innerWidth < 768) && (
            <button 
              onClick={() => onNavigate('/settings')} 
              className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                currentPath === '/settings' 
                  ? 'bg-brand-primary text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Settings size={18} className="shrink-0" />
              <span className="flex-1 text-left truncate">{t('settings')}</span>
            </button>
          )}
          
          <button onClick={onToggleCollapse} className="hidden md:flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all">
            {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
