
import React, { useContext, useState, useRef } from 'react';
import { 
  Settings, 
  Layout, 
  Monitor, 
  Save, 
  Check, 
  Globe, 
  Languages, 
  Palette, 
  Paintbrush, 
  Building2, 
  UploadCloud, 
  Coins, 
  Info,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Link as LinkIcon,
  Hash,
  Percent,
  Plus,
  Trash2,
  X,
  Clock,
  Timer,
  CalendarDays,
  ChevronDown,
  Pencil,
  ArrowRight,
  ClipboardList,
  Receipt,
  Wallet,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext, TaxRate } from '../lib/context';
import { Language } from '../lib/translations';
import { getDocNumConfig, saveDocNumConfig, previewDocNumber, DocType, DateFormat } from '../lib/docNumbering';

interface SettingsPageProps {
  viewMode: 'modal' | 'page';
  setViewMode: (mode: 'modal' | 'page') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ viewMode, setViewMode }) => {
  const navigate = useNavigate();
  const {
    lang, setLang, t, theme: currentTheme, setTheme,
    multiCurrency, setMultiCurrency, availableCurrencies,
    defaultCurrency, setDefaultCurrency,
    companyName, setCompanyName, companyLogo, setCompanyLogo,
    companyAddress, setCompanyAddress,
    companyPhone, setCompanyPhone,
    companyEmail, setCompanyEmail,
    companyWebsite, setCompanyWebsite,
    companyKKF, setCompanyKKF,
    companyBTW, setCompanyBTW,
    taxRates, setTaxRates,
    enableCrypto, setEnableCrypto,
    brandColor, setBrandColor,
    accentColor, setAccentColor,
    timezone, setTimezone,
    dateFormat, setDateFormat,
    timeFormat, setTimeFormat,
  } = useContext(LanguageContext);
  
  const [saved, setSaved] = useState(false);
  const [validityDays, setValidityDays] = useState<number>(() => parseInt(localStorage.getItem('erp_quote_validity_days') ?? '14', 10));
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [newTax, setNewTax] = useState({ name: '', percentage: 0 });
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [editTaxData, setEditTaxData] = useState({ name: '', percentage: 0 });

  // Document Numbering State
  const [docNums, setDocNums] = useState({
    inv: getDocNumConfig('inv'),
    est: getDocNumConfig('est'),
    pay: getDocNumConfig('pay'),
    crd: getDocNumConfig('crd'),
  });
  const updateDocNum = (type: DocType, field: 'prefix' | 'dateFormat', value: string) => {
    const updated = { ...docNums, [type]: { ...docNums[type], [field]: value } };
    setDocNums(updated);
    saveDocNumConfig(type, { [field]: value });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTaxRate = () => {
    if (!newTax.name) return;
    const rate: TaxRate = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTax.name,
      percentage: newTax.percentage,
      isDefault: taxRates.length === 0
    };
    setTaxRates([...taxRates, rate]);
    setNewTax({ name: '', percentage: 0 });
    setShowTaxForm(false);
  };

  const startEditing = (rate: TaxRate) => {
    setEditingTaxId(rate.id);
    setEditTaxData({ name: rate.name, percentage: rate.percentage });
  };

  const saveEdit = (id: string) => {
    setTaxRates(taxRates.map(tr => tr.id === id ? { ...tr, name: editTaxData.name, percentage: editTaxData.percentage } : tr));
    setEditingTaxId(null);
  };

  const removeTaxRate = (id: string) => {
    setTaxRates(taxRates.filter(t => t.id !== id));
  };

  const languageOptions: { id: Language; label: string; flag: string }[] = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { id: 'es', label: 'Español', flag: '🇪🇸' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' }
  ];

  const themeOptions = [
    { id: 'default', label: 'Ramzon Standard', colors: ['bg-[#BE1E2D]', 'bg-[#1A1A1A]'], tagline: 'Red & Dark' },
    { id: 'emerald', label: t('emeraldTheme'), colors: ['bg-emerald-800', 'bg-emerald-200'], tagline: 'Trust & Nature' },
    { id: 'indigo', label: t('indigoTheme'), colors: ['bg-indigo-900', 'bg-indigo-400'], tagline: 'Modern Clean' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Settings</h1>
          <p className="text-sm font-medium text-slate-500">Manage your organisation profile and system configuration</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-brand-primary text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-2xl shadow-slate-200 active:scale-95"
        >
          {saved ? <Check size={18} /> : <Save size={18} />}
          {saved ? 'Settings Updated' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">

          {/* Detailed Company Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Building2 size={16} className="text-brand-primary" /> {t('companySettings')}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Company Identity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('uploadLogo')}</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-brand-primary transition-all group relative overflow-hidden shadow-inner"
                >
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo Preview" className="w-full h-full object-contain p-6" />
                  ) : (
                    <>
                      <UploadCloud size={40} className="text-slate-300 group-hover:text-brand-primary transition-colors mb-3" />
                      <span className="text-[10px] font-bold text-slate-400 text-center px-6">DRAG & DROP LOGO HERE</span>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
                </div>
                {companyLogo && (
                  <button onClick={(e) => { e.stopPropagation(); setCompanyLogo(null); }} className="w-full text-[10px] font-black text-red-500 hover:underline uppercase tracking-widest">Remove Artwork</button>
                )}
              </div>

              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('companyName')}</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-brand-accent-light outline-none transition-all shadow-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} /> {t('address')}
                  </label>
                  <input 
                    type="text" 
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Phone size={12} /> {t('phone')}
                  </label>
                  <input 
                    type="text" 
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={12} /> {t('email')}
                  </label>
                  <input 
                    type="email" 
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon size={12} /> {t('website')}
                  </label>
                  <input 
                    type="text" 
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={12} /> {t('kkf')}
                  </label>
                  <input 
                    type="text" 
                    value={companyKKF}
                    onChange={(e) => setCompanyKKF(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Percent size={12} /> {t('btw')}
                  </label>
                  <input 
                    type="text" 
                    value={companyBTW}
                    onChange={(e) => setCompanyBTW(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none shadow-sm"
                  />
                </div>

                {/* Default Currency */}
                <div className="md:col-span-2 space-y-1.5 p-5 bg-blue-50/40 rounded-2xl border border-blue-100">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={12} /> Default Currency
                    <span className="ml-auto text-[9px] font-bold text-blue-400 normal-case tracking-normal">Applied on invoices, quotes &amp; payments</span>
                  </label>
                  <div className="relative">
                    <select
                      aria-label="Standaard valuta"
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="w-full px-5 py-3.5 bg-white border border-blue-200 rounded-2xl text-sm font-black outline-none appearance-none focus:ring-4 focus:ring-blue-100 shadow-sm"
                    >
                      <option value="EUR">🇪🇺 EUR – Euro</option>
                      <option value="USD">🇺🇸 USD – US Dollar</option>
                      <option value="SRD">🇸🇷 SRD – Surinaamse Dollar</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <DollarSign size={10} className="text-blue-600" />
                    </div>
                    <p className="text-[9px] font-bold text-blue-500">Active: <span className="font-black">{defaultCurrency}</span> – changes are saved immediately</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Clock size={16} className="text-brand-primary" /> Date &amp; Time
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">Regional Config</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Globe size={10} /> Timezone
                </label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none appearance-none"
                  >
                    <option value="America/Paramaribo">🇸🇷 America/Paramaribo (UTC−3)</option>
                    <option value="America/New_York">🇺🇸 America/New_York (UTC−5/−4)</option>
                    <option value="America/Chicago">🇺🇸 America/Chicago (UTC−6/−5)</option>
                    <option value="America/Los_Angeles">🇺🇸 America/Los_Angeles (UTC−8/−7)</option>
                    <option value="Europe/Amsterdam">🇳🇱 Europe/Amsterdam (UTC+1/+2)</option>
                    <option value="Europe/London">🇬🇧 Europe/London (UTC+0/+1)</option>
                    <option value="UTC">🌐 UTC (Global)</option>
                    <option value="Asia/Dubai">🇦🇪 Asia/Dubai (UTC+4)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
                <p className="text-[9px] text-slate-400 font-medium pl-1">
                  Current time: <span className="font-black text-slate-600">{new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })}</span>
                </p>
              </div>

              {/* Date Format */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarDays size={10} /> Date Format
                </label>
                <div className="relative">
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none appearance-none"
                  >
                    <option value="DD-MM-YYYY">DD-MM-YYYY  (05-03-2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD  (2026-03-05) — ISO</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY  (03/05/2026)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
                <p className="text-[9px] text-slate-400 font-medium pl-1">
                  Preview: <span className="font-black text-slate-600">
                    {dateFormat === 'DD-MM-YYYY' ? '05-03-2026' : dateFormat === 'MM/DD/YYYY' ? '03/05/2026' : '2026-03-05'}
                  </span>
                </p>
              </div>

              {/* Time Format */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Timer size={10} /> Time Display
                </label>
                <div className="relative">
                  <select
                    value={timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none appearance-none"
                  >
                    <option value="24h">24-Hour  (14:30)</option>
                    <option value="12h">12-Hour  (02:30 PM)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
                <p className="text-[9px] text-slate-400 font-medium pl-1">
                  Example: <span className="font-black text-slate-600">{timeFormat === '24h' ? '14:30' : '02:30 PM'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Tax Settings Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Percent size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('taxSettings')}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('manageTaxRates')}</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowTaxForm(!showTaxForm); setEditingTaxId(null); }}
                className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-90"
              >
                {showTaxForm ? <X size={18} /> : <Plus size={18} />}
              </button>
            </div>

            {showTaxForm && (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('taxName')}</label>
                  <input 
                    type="text" placeholder="e.g. BTW High"
                    value={newTax.name}
                    onChange={(e) => setNewTax({...newTax, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('percentage')}</label>
                  <input 
                    type="number" placeholder="21"
                    value={newTax.percentage}
                    onChange={(e) => setNewTax({...newTax, percentage: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={addTaxRate}
                    className="w-full py-2.5 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg active:scale-95"
                  >
                    Add Tax Rate
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {taxRates.map((rate) => (
                <div 
                  key={rate.id} 
                  onClick={() => editingTaxId !== rate.id && startEditing(rate)}
                  className={`p-5 rounded-3xl flex items-center justify-between group transition-all border cursor-pointer ${editingTaxId === rate.id ? 'bg-white border-emerald-300 shadow-xl' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg hover:border-emerald-200'}`}
                >
                  {editingTaxId === rate.id ? (
                    <div className="flex flex-col gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase">Naam</label>
                            <input 
                              value={editTaxData.name}
                              onChange={(e) => setEditTaxData({...editTaxData, name: e.target.value})}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                              autoFocus
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase">Percentage</label>
                            <input 
                              type="number"
                              value={editTaxData.percentage}
                              onChange={(e) => setEditTaxData({...editTaxData, percentage: parseFloat(e.target.value) || 0})}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                            />
                         </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingTaxId(null)} className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase">Cancel</button>
                        <button onClick={() => saveEdit(rate.id)} className="px-4 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-black uppercase shadow-md hover:opacity-90 transition-all">Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-xl font-black text-slate-900 shadow-sm group-hover:scale-105 transition-transform">
                          {rate.percentage}%
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight uppercase text-xs">{rate.name}</p>
                          {rate.isDefault && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] italic">Default Rate</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="p-2 text-slate-400 hover:text-brand-primary transition-all">
                          <Pencil size={16} />
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeTaxRate(rate.id); }}
                          className="p-2 text-slate-300 hover:text-red-500 transition-all"
                          title="Verwijderen"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Workflow Quick Links Section - "Van hier uit kan je naar..." */}
            <div className="pt-6 border-t border-slate-50">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Actions</h4>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button 
                    onClick={() => navigate('/estimates')}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-white hover:border-brand-primary hover:shadow-lg transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-brand-primary shadow-sm"><ClipboardList size={16} /></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Quotes</span>
                  </button>
                  <button
                    onClick={() => navigate('/invoices')}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-white hover:border-brand-primary hover:shadow-lg transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-brand-primary shadow-sm"><Receipt size={16} /></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Invoices</span>
                  </button>
                  <button
                    onClick={() => navigate('/payments')}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-white hover:border-brand-primary hover:shadow-lg transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-brand-primary shadow-sm"><Wallet size={16} /></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Payments</span>
                  </button>
                  <button
                    onClick={() => navigate('/credits')}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-white hover:border-brand-primary hover:shadow-lg transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-brand-primary shadow-sm"><CreditCard size={16} /></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Credits</span>
                  </button>
               </div>
               <p className="text-[9px] text-slate-400 font-bold mt-4 italic text-center">Tax rates are applied to documents in this order.</p>
            </div>
          </div>

          {/* Document Numbering */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Hash size={16} className="text-brand-primary" /> Document Nummering
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Auto-Increment</span>
            </div>
            <p className="text-xs text-slate-400 font-medium -mt-2">
              Set prefix and date format per document type. Numbers are auto-incremented on creation.
            </p>

            <div className="space-y-3">
              {([
                { type: 'inv' as DocType, label: 'Invoice', icon: '🧾' },
                { type: 'est' as DocType, label: 'Estimate', icon: '📋' },
                { type: 'pay' as DocType, label: 'Payment', icon: '💳' },
                { type: 'crd' as DocType, label: 'Credit Note', icon: '📄' },
              ]).map(({ type, label, icon }) => {
                const cfg = docNums[type];
                const preview = `${cfg.prefix}-${
                  cfg.dateFormat === 'YYYYMMDD' ? `${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}` :
                  cfg.dateFormat === 'YYYYMM'   ? `${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}` :
                  cfg.dateFormat === 'YYYY'     ? `${new Date().getFullYear()}` :
                                                  `${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}`
                }-${String(cfg.counter + 1).padStart(3, '0')}`;

                return (
                  <div key={type} className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-lg shrink-0">{icon}</span>
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest w-20 shrink-0">{label}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <div className="space-y-1 w-28">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Prefix</label>
                        <input
                          type="text"
                          value={cfg.prefix}
                          maxLength={6}
                          onChange={e => updateDocNum(type, 'prefix', e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-brand-primary uppercase"
                          placeholder="INV"
                        />
                      </div>
                      <div className="space-y-1 flex-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Date Format</label>
                        <div className="relative">
                          <select
                            value={cfg.dateFormat}
                            onChange={e => updateDocNum(type, 'dateFormat', e.target.value as DateFormat)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none appearance-none"
                          >
                            <option value="YYYYMMDD">Year+Month+Day  (YYYYMMDD)</option>
                            <option value="YYYYMM">Year+Month  (YYYYMM)</option>
                            <option value="YYYY">Year only  (YYYY)</option>
                            <option value="MMDD">Month+Day  (MMDD)</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Number</p>
                      <span className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black tracking-widest font-mono">
                        {preview}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Default Quote Validity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <CalendarDays size={16} className="text-brand-primary" /> Default Geldigheid
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Estimates</span>
            </div>
            <p className="text-xs text-slate-400 font-medium -mt-2">Hoeveel dagen een offerte standaard geldig is na aanmaak.</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { days: 1,  label: '1 dag'    },
                { days: 3,  label: '3 dagen'  },
                { days: 7,  label: '1 week'   },
                { days: 14, label: '2 weken'  },
                { days: 21, label: '3 weken'  },
                { days: 30, label: '1 maand'  },
              ].map(opt => (
                <button key={opt.days} onClick={() => {
                  localStorage.setItem('erp_quote_validity_days', String(opt.days));
                  setValidityDays(opt.days);
                }} className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                  validityDays === opt.days
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400'
                }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Paintbrush size={16} className="text-brand-accent" /> {t('colorScheme')}
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">User Interface</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {themeOptions.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 group ${
                    currentTheme === theme.id
                      ? 'border-brand-primary bg-brand-accent-light/30'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex -space-x-2 shrink-0">
                    <div className={`w-7 h-7 rounded-full border-2 border-white shadow ${theme.colors[0]}`}></div>
                    <div className={`w-7 h-7 rounded-full border-2 border-white shadow ${theme.colors[1]}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 leading-tight italic truncate">{theme.label}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{theme.tagline}</p>
                  </div>
                  {currentTheme === theme.id && <div className="w-3 h-3 rounded-full bg-brand-primary shrink-0"></div>}
                </button>
              ))}
            </div>

            {/* Custom Color Pickers */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aangepaste Kleuren</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Primary Color</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={e => setBrandColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
                      title="Primary color (buttons, accents)"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900">{brandColor.toUpperCase()}</p>
                      <p className="text-[9px] text-slate-400 font-bold">Knoppen & accenten</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-200" style={{ backgroundColor: brandColor }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest">Accent Kleur</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
                      title="Accent kleur (tekst, icons)"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900">{accentColor.toUpperCase()}</p>
                      <p className="text-[9px] text-slate-400 font-bold">Tekst & icons</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-200" style={{ backgroundColor: accentColor }} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setBrandColor('#BE1E2D'); setAccentColor('#1A1A1A'); }}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-colors"
              >
                ↺ Reset naar Ramzon standaard
              </button>
            </div>
          </div>


          {/* Language + Crypto — side-by-side row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                  <Globe size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Taal / Language</h4>
                  <p className="text-[9px] text-slate-400 font-bold">Active: {languageOptions.find(l => l.id === lang)?.label}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {languageOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setLang(opt.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all flex items-center gap-2.5 ${lang === opt.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
                  >
                    <span className="text-sm">{opt.flag}</span>
                    <span className="uppercase tracking-widest text-[10px] font-black">{opt.label}</span>
                    {lang === opt.id && <Check size={12} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Crypto Payment Toggle */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Payment Settings</h4>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-black text-sm">₮</div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Crypto Payment</p>
                    <p className="text-[9px] text-slate-400 font-bold">USDT / Tether</p>
                  </div>
                </div>
                <button
                  onClick={() => setEnableCrypto(!enableCrypto)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 ${enableCrypto ? 'bg-brand-primary' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${enableCrypto ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <p className="text-[9px] font-bold text-slate-400 px-1">
                {enableCrypto ? '✓ USDT will appear as a payment option on invoices and payment forms.' : 'Tether (USDT) is hidden from all currency selections.'}
              </p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default SettingsPage;
