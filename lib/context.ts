import { createContext } from 'react';
import { Language, translations } from './translations';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  status: string;
}

export interface TaxRate {
  id: string;
  name: string;
  percentage: number;
  isDefault: boolean;
}

export const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  theme: string;
  setTheme: (t: string) => void;
  multiCurrency: boolean;
  setMultiCurrency: (v: boolean) => void;
  availableCurrencies: Currency[];
  setAvailableCurrencies: (currencies: Currency[]) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  companyLogo: string | null;
  setCompanyLogo: (logo: string | null) => void;
  companyAddress: string;
  setCompanyAddress: (v: string) => void;
  companyPhone: string;
  setCompanyPhone: (v: string) => void;
  companyEmail: string;
  setCompanyEmail: (v: string) => void;
  companyWebsite: string;
  setCompanyWebsite: (v: string) => void;
  companyKKF: string;
  setCompanyKKF: (v: string) => void;
  companyBTW: string;
  setCompanyBTW: (v: string) => void;
  taxRates: TaxRate[];
  setTaxRates: (v: TaxRate[]) => void;
  defaultCurrency: string;
  setDefaultCurrency: (v: string) => void;
  currencySymbol: string;
  enableCrypto: boolean;
  setEnableCrypto: (v: boolean) => void;
  // Date / Time
  timezone: string;
  setTimezone: (v: string) => void;
  dateFormat: string;
  setDateFormat: (v: string) => void;
  timeFormat: string;
  setTimeFormat: (v: string) => void;
  formatDate: (dateStr: string) => string;
}>({
  lang: 'en',
  setLang: () => {},
  t: (key) => translations.en[key],
  theme: 'default',
  setTheme: () => {},
  multiCurrency: false,
  setMultiCurrency: () => {},
  availableCurrencies: [],
  setAvailableCurrencies: () => {},
  companyName: 'Ramzon NV',
  setCompanyName: () => {},
  companyLogo: null,
  setCompanyLogo: () => {},
  companyAddress: '',
  setCompanyAddress: () => {},
  companyPhone: '',
  setCompanyPhone: () => {},
  companyEmail: '',
  setCompanyEmail: () => {},
  companyWebsite: '',
  setCompanyWebsite: () => {},
  companyKKF: '',
  setCompanyKKF: () => {},
  companyBTW: '',
  setCompanyBTW: () => {},
  taxRates: [],
  setTaxRates: () => {},
  defaultCurrency: 'USD',
  setDefaultCurrency: () => {},
  currencySymbol: '$',
  enableCrypto: false,
  setEnableCrypto: () => {},
  timezone: 'America/Paramaribo',
  setTimezone: () => {},
  dateFormat: 'DD-MM-YYYY',
  setDateFormat: () => {},
  timeFormat: '24h',
  setTimeFormat: () => {},
  formatDate: (d) => d,
});
