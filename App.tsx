
import React, { useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { DEMO_PRODUCTS } from './lib/mock-data';
import { AuthProvider, useAuth } from './lib/auth';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
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
                <Route path="/estimates" element={<QuotesPage />} />
                <Route path="/estimates/new" element={<CreateQuotePage />} />
                <Route path="/estimates/edit/:id" element={<CreateQuotePage />} />
                <Route path="/estimates/:id" element={<DocumentDetailPage type="estimates" />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/payments/new" element={<CreatePaymentPage />} />
                <Route path="/payments/edit/:id" element={<CreatePaymentPage />} />
                <Route path="/payments/:id" element={<DocumentDetailPage type="payments" />} />
                <Route path="/credits" element={<CreditsPage />} />
                <Route path="/credits/new" element={<CreateCreditPage />} />
                <Route path="/credits/edit/:id" element={<CreateCreditPage />} />
                <Route path="/credits/:id" element={<DocumentDetailPage type="credits" />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/currencies" element={<CurrencyManagementPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/expenses/new" element={<CreateExpensePage />} />
                <Route path="/expenses/categories" element={<ExpenseCategoriesPage />} />
                <Route path="/expenses/vendors" element={<ExpenseVendorsPage />} />
                <Route path="/expenses/edit/:id" element={<CreateExpensePage />} />
                <Route path="/expenses/:id" element={<DocumentDetailPage type="expenses" />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/new" element={<CreateProductPage />} />
                <Route path="/products/edit/:id" element={<CreateProductPage />} />
                <Route path="/products/categories" element={<ProductCategoriesPage />} />
                <Route path="/documentation" element={<DocumentationPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/categories" element={<ServiceCategoriesPage />} />
                <Route path="/appearance" element={<AppearancePage />} />
                <Route path="/reports/finance" element={<FinanceReportsPage />} />
                <Route path="/reports/finance/print" element={<DocumentDetailPage type="reports" />} />
                <Route path="/reports/health" element={<ReportsPage />} />
                <Route path="/insights" element={<Navigate to="/reports/finance" replace />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/new" element={<CreateClientPage />} />
                <Route path="/clients/:id" element={<ClientDetailPage />} />
                <Route path="/clients/edit/:id" element={<EditClientPage />} />
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
      { id: '4', code: 'USDT', name: 'Tether', symbol: '₮', status: 'Active' },
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
  const [enableCrypto, setEnableCrypto] = useState(() => localStorage.getItem('enableCrypto') === 'true');

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
      case 'USDT': return '₮';
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
      { id: 't1', name: 'BTW standard', percentage: 21, isDefault: true },
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
    localStorage.setItem('enableCrypto', enableCrypto.toString());
  }, [enableCrypto]);

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

  // Seed demo products into storage if empty (first load / fresh install)
  useEffect(() => {
    if (storage.products.get().length === 0) {
      storage.products.save(DEMO_PRODUCTS);
    }
  }, []);

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
      enableCrypto, setEnableCrypto,
      brandColor, setBrandColor,
      accentColor, setAccentColor,
      timezone,   setTimezone:   (v: string) => { setTimezone(v);   localStorage.setItem('timezone', v); },
      dateFormat, setDateFormat: (v: string) => { setDateFormat(v); localStorage.setItem('dateFormat', v); },
      timeFormat, setTimeFormat: (v: string) => { setTimeFormat(v); localStorage.setItem('timeFormat', v); },
      formatDate,
    }}>
      <AppRoutes isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
    </LanguageContext.Provider>
    </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
