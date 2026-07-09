
import React, { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import InvoicesPage from './pages/InvoicesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import QuotesPage from './pages/QuotesPage';
import CreateQuotePage from './pages/CreateQuotePage';
import ExpensesPage from './pages/ExpensesPage';
import CreateExpensePage from './pages/CreateExpensePage';
import ProductsPage from './pages/ProductsPage';
import CreateProductPage from './pages/CreateProductPage';
import ClientsPage from './pages/ClientsPage';
import CreateClientPage from './pages/CreateClientPage';
import ClientDetailPage from './pages/ClientDetailPage';
import EditClientPage from './pages/EditClientPage';
import PaymentsPage from './pages/PaymentsPage';
import CreatePaymentPage from './pages/CreatePaymentPage';
import CreditsPage from './pages/CreditsPage';
import CreateCreditPage from './pages/CreateCreditPage';
import ReportsPage from './pages/ReportsPage';
import FinanceReportsPage from './pages/FinanceReportsPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ServicesPage from './pages/ServicesPage';
import AppearancePage from './pages/AppearancePage';
import CurrencyManagementPage from './pages/CurrencyManagementPage';
import FinancePage from './pages/FinancePage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import ExpenseCategoriesPage from './pages/ExpenseCategoriesPage';
import ExpenseVendorsPage from './pages/ExpenseVendorsPage';
import DocumentationPage from './pages/DocumentationPage';
import ProductCategoriesPage from './pages/ProductCategoriesPage';
import ServiceCategoriesPage from './pages/ServiceCategoriesPage';
import NotificationsPage from './pages/NotificationsPage';
import { LocationAwareErrorBoundary } from './components/ErrorBoundary';
import { Language, translations } from './lib/translations';
import { LanguageContext, Currency, TaxRate } from './lib/context';
import { storage } from './lib/storage';
import { AuthProvider, useAuth } from './lib/auth';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  // Safety net for mutations with no call-site error handling: log to the console so a
  // failure is at least visible during debugging. NOT a user-facing alert — React Query
  // v5 gives a MutationCache global handler no way to detect whether the specific
  // mutate(vars, { onError }) call already has its own handler (mutation.options only
  // reflects the hook-level useMutation() config, never per-call .mutate() options), so
  // alerting here would double-fire alongside every call-site alert AND pop a blocking
  // dialog per row during loops like CSV import. Every user-facing save flow in this
  // app sets its own onError explicitly instead.
  mutationCache: new MutationCache({
    onError: (error: any) => {
      const msg = error?.response?.data?.error || error?.message || String(error);
      console.error('[mutation failed]', msg);
    },
  }),
});

const Layout: React.FC<{ 
  children: React.ReactNode; 
  onLogout: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
}> = ({ children, onLogout, isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  }, [location.pathname, setIsSidebarCollapsed]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900 selection:bg-brand-accent/20">
      <Sidebar 
        currentPath={location.pathname} 
        onNavigate={(path) => navigate(path)} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          onLogout={onLogout} 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-y-auto w-full no-scrollbar relative bg-white">
          <div className="p-5 sm:p-6 md:p-8 min-h-full animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const RequireRole: React.FC<{ roles: string[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC<{
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
}> = ({ isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={() => {}} />} />
        <Route path="/*" element={
          isAuthenticated ? (
            <Layout onLogout={logout} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed}>
              <LocationAwareErrorBoundary>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/new" element={<CreateInvoicePage />} />
                <Route path="/invoices/edit/:id" element={<CreateInvoicePage />} />
                <Route path="/invoices/:id" element={<DocumentDetailPage type="invoices" />} />
                <Route path="/estimates" element={<RequireRole roles={['Admin','Sales']}><QuotesPage /></RequireRole>} />
                <Route path="/estimates/new" element={<RequireRole roles={['Admin','Sales']}><CreateQuotePage /></RequireRole>} />
                <Route path="/estimates/edit/:id" element={<RequireRole roles={['Admin','Sales']}><CreateQuotePage /></RequireRole>} />
                <Route path="/estimates/:id" element={<RequireRole roles={['Admin','Sales']}><DocumentDetailPage type="estimates" /></RequireRole>} />
                <Route path="/payments" element={<RequireRole roles={['Admin','Accountant']}><PaymentsPage /></RequireRole>} />
                <Route path="/payments/new" element={<RequireRole roles={['Admin','Accountant']}><CreatePaymentPage /></RequireRole>} />
                <Route path="/payments/edit/:id" element={<RequireRole roles={['Admin','Accountant']}><CreatePaymentPage /></RequireRole>} />
                <Route path="/payments/:id" element={<RequireRole roles={['Admin','Accountant']}><DocumentDetailPage type="payments" /></RequireRole>} />
                <Route path="/credits" element={<RequireRole roles={['Admin','Accountant']}><CreditsPage /></RequireRole>} />
                <Route path="/credits/new" element={<RequireRole roles={['Admin','Accountant']}><CreateCreditPage /></RequireRole>} />
                <Route path="/credits/edit/:id" element={<RequireRole roles={['Admin','Accountant']}><CreateCreditPage /></RequireRole>} />
                <Route path="/credits/:id" element={<RequireRole roles={['Admin','Accountant']}><DocumentDetailPage type="credits" /></RequireRole>} />
                <Route path="/finance" element={<RequireRole roles={['Admin','Accountant']}><FinancePage /></RequireRole>} />
                <Route path="/currencies" element={<RequireRole roles={['Admin','Accountant']}><CurrencyManagementPage /></RequireRole>} />
                <Route path="/expenses" element={<RequireRole roles={['Admin','Accountant']}><ExpensesPage /></RequireRole>} />
                <Route path="/expenses/new" element={<RequireRole roles={['Admin','Accountant']}><CreateExpensePage /></RequireRole>} />
                <Route path="/expenses/categories" element={<RequireRole roles={['Admin','Accountant']}><ExpenseCategoriesPage /></RequireRole>} />
                <Route path="/expenses/vendors" element={<RequireRole roles={['Admin','Accountant']}><ExpenseVendorsPage /></RequireRole>} />
                <Route path="/expenses/edit/:id" element={<RequireRole roles={['Admin','Accountant']}><CreateExpensePage /></RequireRole>} />
                <Route path="/expenses/:id" element={<RequireRole roles={['Admin','Accountant']}><DocumentDetailPage type="expenses" /></RequireRole>} />
                {/* Product create/edit/delete is Admin-only on the API — keep the route guard in sync
                    so Sales never sees a form whose save silently 403s. */}
                <Route path="/products" element={<RequireRole roles={['Admin','Sales']}><ProductsPage /></RequireRole>} />
                <Route path="/products/new" element={<RequireRole roles={['Admin']}><CreateProductPage /></RequireRole>} />
                <Route path="/products/edit/:id" element={<RequireRole roles={['Admin']}><CreateProductPage /></RequireRole>} />
                <Route path="/products/categories" element={<RequireRole roles={['Admin']}><ProductCategoriesPage /></RequireRole>} />
                <Route path="/documentation" element={<DocumentationPage />} />
                <Route path="/services" element={<RequireRole roles={['Admin','Sales']}><ServicesPage /></RequireRole>} />
                <Route path="/services/categories" element={<RequireRole roles={['Admin','Sales']}><ServiceCategoriesPage /></RequireRole>} />
                <Route path="/appearance" element={<RequireRole roles={['Admin','Sales']}><AppearancePage /></RequireRole>} />
                <Route path="/reports/finance" element={<RequireRole roles={['Admin','Accountant']}><FinanceReportsPage /></RequireRole>} />
                <Route path="/reports/finance/print" element={<RequireRole roles={['Admin','Accountant']}><DocumentDetailPage type="reports" /></RequireRole>} />
                <Route path="/reports/health" element={<RequireRole roles={['Admin']}><ReportsPage /></RequireRole>} />
                <Route path="/insights" element={<Navigate to="/reports/finance" replace />} />
                <Route path="/users" element={<RequireRole roles={['Admin']}><UsersPage /></RequireRole>} />
                <Route path="/clients" element={<RequireRole roles={['Admin','Sales']}><ClientsPage /></RequireRole>} />
                <Route path="/clients/new" element={<RequireRole roles={['Admin','Sales']}><CreateClientPage /></RequireRole>} />
                <Route path="/clients/:id" element={<RequireRole roles={['Admin','Sales']}><ClientDetailPage /></RequireRole>} />
                <Route path="/clients/edit/:id" element={<RequireRole roles={['Admin','Sales']}><EditClientPage /></RequireRole>} />
                <Route path="/settings" element={<SettingsPage viewMode="page" setViewMode={()=>{}} />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              </LocationAwareErrorBoundary>
            </Layout>
          ) : <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 768);
  const [lang, setLang] = useState<Language>((localStorage.getItem('appLang') as Language) || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'default');
  const [multiCurrency, setMultiCurrency] = useState(() => localStorage.getItem('multiCurrency') === 'true');
  
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(() => {
    const saved = localStorage.getItem('availableCurrencies');
    return saved ? JSON.parse(saved) : [
      { id: '1', code: 'USD', name: 'US Dollar', symbol: '$', status: 'Active' },
      { id: '2', code: 'SRD', name: 'Surinamese Dollar', symbol: 'SRD', status: 'Active' },
      { id: '3', code: 'EUR', name: 'Euro', symbol: '€', status: 'Active' },
    ];
  });

  const [companyName, setCompanyName] = useState(() => {
    const stored = localStorage.getItem('companyName');
    // Migrate old long default to new short default
    if (!stored || stored === 'Ramzon Wood Processing Company N.V.' || stored === 'Ramzon Admin') return 'Ramzon NV';
    return stored;
  });
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => localStorage.getItem('companyLogo') || '/ramzon-logo.png');
  
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('companyAddress') || 'Industrieweg Zuid 12, Paramaribo, Suriname');
  const [companyPhone, setCompanyPhone] = useState(() => localStorage.getItem('companyPhone') || '+597 123-4567');
  const [companyEmail, setCompanyEmail] = useState(() => localStorage.getItem('companyEmail') || 'info@ramzon.sr');
  const [companyWebsite, setCompanyWebsite] = useState(() => localStorage.getItem('companyWebsite') || 'www.ramzon.sr');
  const [companyKKF, setCompanyKKF] = useState(() => localStorage.getItem('companyKKF') || '12345');
  const [companyBTW, setCompanyBTW] = useState(() => localStorage.getItem('companyBTW') || '101.202.303');
  
  const [defaultCurrency, setDefaultCurrency] = useState(() => localStorage.getItem('defaultCurrency') || 'USD');
  // Brand Colors (custom override)
  const [brandColor, setBrandColor] = useState(() => localStorage.getItem('erp_brand_color') || '#BE1E2D');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('erp_accent_color') || '#1A1A1A');

  // Date / Time settings
  const [timezone, setTimezone]   = useState(() => localStorage.getItem('timezone')   || 'America/Paramaribo');
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem('dateFormat') || 'DD-MM-YYYY');
  const [timeFormat, setTimeFormat] = useState(() => localStorage.getItem('timeFormat') || '24h');

  const formatDate = useCallback((dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    switch (dateFormat) {
      case 'DD-MM-YYYY': return `${d}-${m}-${y}`;
      case 'MM/DD/YYYY': return `${m}/${d}/${y}`;
      default:           return `${y}-${m}-${d}`; // ISO
    }
  }, [dateFormat]);

  const getCurrencySymbol = (code: string): string => {
    switch (code) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'SRD': return 'SRD ';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CAD': return 'CA$';
      case 'AUD': return 'A$';
      default: return code + ' ';
    }
  };

  const [taxRates, setTaxRates] = useState<TaxRate[]>(() => {
    const saved = localStorage.getItem('taxRates');
    return saved ? JSON.parse(saved) : [
      { id: 't1', name: 'BTW standard', percentage: 10, isDefault: true },
      { id: 't2', name: 'BTW export', percentage: 0, isDefault: false },
    ];
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', brandColor);
    const r = parseInt(brandColor.slice(1,3),16), g = parseInt(brandColor.slice(3,5),16), b = parseInt(brandColor.slice(5,7),16);
    document.documentElement.style.setProperty('--brand-accent-light', `rgba(${r},${g},${b},0.08)`);
    localStorage.setItem('erp_brand_color', brandColor);
  }, [brandColor]);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-accent', accentColor);
    localStorage.setItem('erp_accent_color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('multiCurrency', multiCurrency.toString());
  }, [multiCurrency]);

  useEffect(() => {
    localStorage.setItem('availableCurrencies', JSON.stringify(availableCurrencies));
  }, [availableCurrencies]);

  useEffect(() => {
    localStorage.setItem('companyName', companyName);
    localStorage.setItem('companyAddress', companyAddress);
    localStorage.setItem('companyPhone', companyPhone);
    localStorage.setItem('companyEmail', companyEmail);
    localStorage.setItem('companyWebsite', companyWebsite);
    localStorage.setItem('companyKKF', companyKKF);
    localStorage.setItem('companyBTW', companyBTW);
    localStorage.setItem('taxRates', JSON.stringify(taxRates));
  }, [companyName, companyAddress, companyPhone, companyEmail, companyWebsite, companyKKF, companyBTW, taxRates]);

  useEffect(() => {
    if (companyLogo) localStorage.setItem('companyLogo', companyLogo);
    else localStorage.removeItem('companyLogo');
  }, [companyLogo]);

  // One-time migration: rename "Petty Cash" → "Cash" in stored bank accounts
  useEffect(() => {
    const accounts = storage.bankAccounts.get();
    if (accounts.some(a => a.bank === 'Petty Cash')) {
      storage.bankAccounts.save(accounts.map(a => a.bank === 'Petty Cash' ? { ...a, bank: 'Cash' } : a));
    }
  }, []);

  const t = (key: keyof typeof translations.en) => {
    return translations[lang][key] || translations.en[key];
  };

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('appLang', newLang);
  };

  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <LanguageContext.Provider value={{
      lang, setLang: handleSetLang, t, theme, setTheme,
      multiCurrency, setMultiCurrency, availableCurrencies, setAvailableCurrencies,
      companyName, setCompanyName, companyLogo, setCompanyLogo,
      companyAddress, setCompanyAddress,
      companyPhone, setCompanyPhone,
      companyEmail, setCompanyEmail,
      companyWebsite, setCompanyWebsite,
      companyKKF, setCompanyKKF,
      companyBTW, setCompanyBTW,
      taxRates, setTaxRates,
      defaultCurrency, setDefaultCurrency: (v: string) => { setDefaultCurrency(v); localStorage.setItem('defaultCurrency', v); },
      currencySymbol: getCurrencySymbol(defaultCurrency),
      brandColor, setBrandColor,
      accentColor, setAccentColor,
      timezone,   setTimezone:   (v: string) => { setTimezone(v);   localStorage.setItem('timezone', v); },
      dateFormat, setDateFormat: (v: string) => { setDateFormat(v); localStorage.setItem('dateFormat', v); },
      timeFormat, setTimeFormat: (v: string) => { setTimeFormat(v); localStorage.setItem('timeFormat', v); },
      formatDate,
    }}>
      <AppRoutes isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      <Analytics />
    </LanguageContext.Provider>
    </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
