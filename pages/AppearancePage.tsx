
import React, { useState, useContext, useEffect } from 'react';
import {
  Move,
  Plus,
  Save,
  Wand2,
  Eye,
  FileText,
  ClipboardList,
  Receipt,
  Wallet,
  CreditCard,
  Check,
  AlignLeft,
  Settings2,
  Building,
  Scale,
  CreditCard as PaymentIcon,
  MessageSquareText,
  LayoutTemplate,
  X,
  Download,
  Printer,
  AlignRight,
  AlignCenter,
  Upload,
  Sliders,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../lib/context';
import { storage, NoteTemplate } from '../lib/storage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  MessageSquareText, FileText, Wand2,
};

const DEFAULT_NOTE_TEMPLATES: NoteTemplate[] = [
  { name: 'Standard Payment Note', content: 'Thank you for your business. Please include Invoice # in payment reference.', iconName: 'MessageSquareText' },
  { name: 'Wood Quality Note',     content: 'This timber is graded according to FAS standards. Please store in a dry place.',  iconName: 'FileText' },
  { name: 'Delivery Note',         content: 'Our transport team will contact you 24 hours before arrival.',                    iconName: 'Wand2' },
];

type DocumentType = 'invoice' | 'estimate' | 'payment' | 'credit' | 'note';
type HeaderStyle   = 'centered' | 'split';
type FontFamily    = 'sans' | 'serif' | 'mono';
type FontSize      = 'small' | 'medium' | 'large';
type FontWeight    = 'normal' | 'medium' | 'bold' | 'black';

// ── Translation map ───────────────────────────────────────────────────────────

const APPTXT: Record<string, Record<string, string>> = {
  nl: {
    pageTitle: 'Document Stijlen', pageSubtitle: 'Volledig beheer over uw factuur & offerte layout',
    preview: 'Voorbeeld', save: 'Opslaan', saved: 'Opgeslagen!',
    tabEditor: 'Template Editor', tabHeaders: 'PDF Headers', tabNotes: 'Notities & Terms',
    docSections: 'Document Secties', docType: 'Document Type',
    invoices: 'Facturen', estimates: 'Offertes', payments: 'Betalingsbonnen', credits: "Creditnota's", notes: 'Aangepaste Nota\'s',
    sections: 'Secties', addBlock: 'Blok toevoegen',
    colors: 'Kleuren & Branding', accentColor: 'Accent kleur', reset: 'Reset',
    headerBg: 'Header achtergrond', tableHdr: 'Tabel koptekst',
    brand: 'Merk', dark: 'Donker', light: 'Licht', none: 'Geen',
    typography: 'Typografie', fontFamily: 'Lettertype', textScale: 'Tekstgrootte',
    small: 'Klein', medium: 'Middel', large: 'Groot',
    weight: 'Gewicht', reg: 'Reg', med: 'Med', bold: 'Bold', black: 'Black',
    docTitle: 'Document Titel', titleSize: 'Grootte', titleStyle: 'Stijl',
    normal: 'Normaal', uppercase: 'Hoofdl.', stamp: 'Stempel',
    customLabel: 'Aangepaste Naam',
    logoHeader: 'Logo & Header', logoSize: 'Logo grootte', headerLayout: 'Header indeling',
    split: 'Split', centered: 'Gecentreerd',
    companyFields: 'Bedrijfsinfo Velden',
    clientBlock: 'Klantblok', style: 'Stijl', clean: 'Clean', boxed: 'Kader',
    position: 'Positie', right: 'Rechts', left: 'Links', below: 'Onder',
    tableStyle: 'Tabelstijl', rowLines: 'Rijscheidingslijnen',
    horizontal: 'Horizontaal', grid: 'Grid',
    footerContent: 'Footer Inhoud', bankDetails: 'Bankgegevens', legalText: 'Juridische Disclaimer',
    saveApply: 'Opslaan & Toepassen', savedLabel: 'Opgeslagen!',
    livePreview: 'Live Preview', liveChanges: 'Wijzigingen zijn direct zichtbaar',
    visible: 'Zichtbaar', hidden: 'Verborgen',
    headerTitle: 'Document Header', headerSub: 'Stel in hoe bedrijfsinfo verschijnt op alle PDF exports',
    headerStructure: 'Header Structuur', logoAlignment: 'Logo Uitlijning',
    titleSizeLabel: 'Documenttitel Grootte', clientStyleLabel: 'Klantblok Stijl',
    companyInfoSync: 'Bedrijfsinfo gesynchroniseerd vanuit Instellingen',
    editCompany: 'Bedrijfsinfo bewerken', uploadLogo: 'Upload Logo',
    notesTitle: 'Standaard Notities', notesSub: 'Standaard tekst voor de Notities sectie op documenten',
    add: 'Toevoegen', newTemplate: 'Nieuw Template',
    templateName: 'Template naam (bijv. Betalingsherinnering)',
    templateContent: 'Standaard tekst voor de Notities sectie...',
    cancel: 'Annuleren',
    previewTitle: 'PDF Layout Voorbeeld', type: 'Type', close: 'Sluiten',
    naam: 'Naam', adres: 'Adres', telefoon: 'Telefoon', email: 'Email', btwNr: 'BTW nr', kkfNr: 'KKF nr',
    clientFields: 'Client Info Velden', company: 'Bedrijf',
    metaCols: 'Meta Kolommen', tableCols: 'Tabel Kolommen',
    datum: 'Datum', nr: 'Nummer', termijn: 'Termijn', vervaldatum: 'Vervaldatum', rep: 'Rep', project: 'Project',
    omschrijving: 'Omschrijving', afmeting: 'Afmeting', qty: 'Aantal', eenheid: 'Eenheid',
    houtsoort: 'Houtsoort', prijs: 'Prijs', subtotaal: 'Subtotaal', btw: 'BTW%', totaal: 'Totaal',
  },
  en: {
    pageTitle: 'Document Styles', pageSubtitle: 'Full control over your invoice & quote layout',
    preview: 'Preview', save: 'Save', saved: 'Saved!',
    tabEditor: 'Template Editor', tabHeaders: 'PDF Headers', tabNotes: 'Notes & Terms',
    docSections: 'Document Sections', docType: 'Document Type',
    invoices: 'Invoices', estimates: 'Quotes', payments: 'Payments', credits: 'Credit Notes', notes: 'Custom Notes',
    sections: 'Sections', addBlock: 'Add block',
    colors: 'Colors & Branding', accentColor: 'Accent color', reset: 'Reset',
    headerBg: 'Header background', tableHdr: 'Table header',
    brand: 'Brand', dark: 'Dark', light: 'Light', none: 'None',
    typography: 'Typography', fontFamily: 'Font family', textScale: 'Text scale',
    small: 'Small', medium: 'Medium', large: 'Large',
    weight: 'Weight', reg: 'Reg', med: 'Med', bold: 'Bold', black: 'Black',
    docTitle: 'Document Title', titleSize: 'Size', titleStyle: 'Style',
    normal: 'Normal', uppercase: 'Uppercase', stamp: 'Stamp',
    customLabel: 'Custom Name',
    logoHeader: 'Logo & Header', logoSize: 'Logo size', headerLayout: 'Header layout',
    split: 'Split', centered: 'Centered',
    companyFields: 'Company Info Fields',
    clientBlock: 'Client Block', style: 'Style', clean: 'Clean', boxed: 'Boxed',
    position: 'Position', right: 'Right', left: 'Left', below: 'Below',
    tableStyle: 'Table Style', rowLines: 'Row separators',
    horizontal: 'Horizontal', grid: 'Grid',
    footerContent: 'Footer Content', bankDetails: 'Bank Details', legalText: 'Legal Disclaimer',
    saveApply: 'Save & Apply', savedLabel: 'Saved!',
    livePreview: 'Live Preview', liveChanges: 'Changes are visible instantly',
    visible: 'Visible', hidden: 'Hidden',
    headerTitle: 'Document Header', headerSub: 'Configure how company info appears on all PDF exports',
    headerStructure: 'Header Structure', logoAlignment: 'Logo Alignment',
    titleSizeLabel: 'Document Title Size', clientStyleLabel: 'Client Block Style',
    companyInfoSync: 'Company info synced from Settings',
    editCompany: 'Edit Company Info', uploadLogo: 'Upload Logo',
    notesTitle: 'Default Notes', notesSub: 'Default text for the Notes section on documents',
    add: 'Add', newTemplate: 'New Template',
    templateName: 'Template name (e.g. Payment Reminder)',
    templateContent: 'Default text for the Notes section...',
    cancel: 'Cancel',
    previewTitle: 'PDF Layout Preview', type: 'Type', close: 'Close',
    naam: 'Name', adres: 'Address', telefoon: 'Phone', email: 'Email', btwNr: 'VAT no.', kkfNr: 'KKF no.',
    clientFields: 'Client Info Fields', company: 'Company',
    metaCols: 'Meta Columns', tableCols: 'Table Columns',
    datum: 'Date', nr: 'Number', termijn: 'Terms', vervaldatum: 'Due Date', rep: 'Rep', project: 'Project',
    omschrijving: 'Description', afmeting: 'Dimensions', qty: 'Qty', eenheid: 'Unit',
    houtsoort: 'Wood Type', prijs: 'Price', subtotaal: 'Subtotal', btw: 'VAT%', totaal: 'Total',
  },
};
(['es', 'fr', 'zh', 'pt', 'de'] as const).forEach(l => { APPTXT[l] = APPTXT.en; });

// ── Small helper UI components ────────────────────────────────────────────────

const SettingsSec: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
    <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const SettingsLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{children}</span>
);

const OptionRow: React.FC<{ options: { value: string; label: string }[]; active: string; onChange: (v: string) => void }> = ({ options, active, onChange }) => (
  <div className="flex gap-1">
    {options.map(o => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={`flex-1 py-1.5 rounded text-[9px] font-black uppercase tracking-wide border transition-all ${active === o.value ? 'border-brand-primary bg-brand-accent-light text-brand-primary' : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// ── Live document preview ──────────────────────────────────────────────────────

interface LivePreviewProps {
  accentColor: string;
  headerBg: 'brand' | 'dark' | 'light' | 'none';
  tableHeaderMode: 'dark' | 'brand' | 'light' | 'none';
  logoSize: 'sm' | 'md' | 'lg';
  showFields: Record<string, boolean>;
  clientPosition: 'right' | 'left' | 'below';
  tableRows: 'horizontal' | 'grid' | 'none';
  titleStyle: 'normal' | 'uppercase' | 'stamp';
  fontFamily: FontFamily;
  titleSize: 'sm' | 'md' | 'lg';
  clientStyle: 'clean' | 'boxed';
  headerStyle: HeaderStyle;
  companyFieldsOrder: string[];
  customTitles: Record<string, string>;
  clientFieldsOrder: string[];
  showClientFields: Record<string, boolean>;
}

const DEFAULT_TITLES: Record<string, string> = {
  invoice: 'Factuur', estimate: 'Offerte', quote: 'Offerte', payment: 'Betaling', credit: 'Creditnota',
};

const LivePreview: React.FC<LivePreviewProps> = ({
  accentColor, headerBg, tableHeaderMode, logoSize, showFields,
  clientPosition, tableRows, titleStyle, fontFamily, titleSize, clientStyle, headerStyle,
  companyFieldsOrder, customTitles, clientFieldsOrder, showClientFields,
}) => {
  const { companyName, companyLogo, companyAddress, companyPhone, companyEmail, companyBTW, companyKKF } = useContext(LanguageContext) as any;

  const hdrHasBg = headerBg !== 'none';
  const hdrBgStyle: React.CSSProperties =
    headerBg === 'brand' ? { backgroundColor: accentColor } :
    headerBg === 'dark'  ? { backgroundColor: '#1e293b' } :
    headerBg === 'light' ? { backgroundColor: '#f8fafc' } : {};
  const hdrPadding   = hdrHasBg ? '-mx-8 -mt-8 mb-6 px-8 pt-8 pb-6' : 'border-b-2 border-slate-200 pb-5 mb-5';
  const hdrTextMain  = hdrHasBg ? 'text-white' : 'text-slate-900';
  const hdrTextSub   = hdrHasBg ? 'text-white/70' : 'text-slate-500';
  const hdrTextMuted = hdrHasBg ? 'text-white/50' : 'text-slate-400';

  const tblHdrStyle: React.CSSProperties =
    tableHeaderMode === 'dark'  ? { backgroundColor: '#1e293b', color: 'white' } :
    tableHeaderMode === 'brand' ? { backgroundColor: accentColor, color: 'white' } :
    tableHeaderMode === 'light' ? { backgroundColor: '#f8fafc', color: '#64748b' } :
    { color: '#475569', borderBottom: '2px solid #e2e8f0' };

  const logoH     = logoSize === 'sm' ? 'h-6' : logoSize === 'lg' ? 'h-14' : 'h-10';
  const tblRowCls = tableRows === 'grid' ? 'border border-slate-100' : tableRows === 'horizontal' ? 'border-b border-slate-100' : '';
  const titleSzCls = titleSize === 'sm' ? 'text-xs' : titleSize === 'lg' ? 'text-xl' : 'text-base';
  const docLabelRaw = customTitles['invoice'] || DEFAULT_TITLES['invoice'];
  const displayLabel = titleStyle === 'uppercase' ? docLabelRaw.toUpperCase() : docLabelRaw;
  const docTitleCls = `${titleSzCls} font-black ${hdrHasBg ? 'text-white' : 'text-slate-900'}${titleStyle === 'stamp' ? ' border-2 border-current px-2 py-0.5 inline-block' : ''}${titleStyle === 'uppercase' ? ' uppercase tracking-widest' : ' tracking-tight'}`;
  const docNumCls = `font-mono text-xs mt-0.5 ${hdrHasBg ? 'text-white/60' : 'text-slate-400'}`;
  const fontCls = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  const SAMPLE = [
    { desc: 'Enkele Deur Teak', wood: 'Teak', qty: 3, unit: 'stuks', total: 750 },
    { desc: 'Kozijn Mahonie', wood: 'Mahonie', qty: 1, unit: 'm²', total: 180 },
    { desc: 'Vloerhout herschaven', wood: 'Kopi', qty: 135, unit: 'm²', total: 1080 },
  ];

  const renderField = (key: string) => {
    switch (key) {
      case 'name':    return showFields.name !== false    ? <p key="name"    className={`font-black text-sm leading-tight ${hdrTextMain}`}>{companyName || 'Ramzon N.V.'}</p> : null;
      case 'address': return showFields.address !== false ? <p key="address" className={`text-xs mt-0.5 ${hdrTextSub}`}>{companyAddress || 'Paramaribo, Suriname'}</p> : null;
      case 'phone':   return showFields.phone !== false   ? <p key="phone"   className={`text-xs ${hdrTextSub}`}>{companyPhone || '+597 123 456'}</p> : null;
      case 'email':   return showFields.email !== false   ? <p key="email"   className={`text-xs ${hdrTextSub}`}>{companyEmail || 'info@ramzon.com'}</p> : null;
      case 'btw':     return showFields.btw !== false     ? <p key="btw"     className={`text-xs ${hdrTextMuted}`}>BTW: {companyBTW || '2000012965'}</p> : null;
      case 'kkf':     return showFields.kkf !== false     ? <p key="kkf"     className={`text-xs ${hdrTextMuted}`}>KKF: {companyKKF || '12345'}</p> : null;
      default: return null;
    }
  };

  const SAMPLE_CLIENT: Record<string, string> = {
    name: 'Dinesh Abhelak', company: 'Abhelak Constructions',
    address: 'Kanaalstraat 14, Paramaribo', phone: '+597 859 4052',
    email: 'dinesh@abhelak.sr', vat: 'SR8800123',
  };
  const ClientBlk = ({ align = 'right' }: { align?: 'left' | 'right' }) => (
    <div className={`${clientStyle === 'boxed' ? 'border border-slate-200 rounded px-3 py-2' : ''} ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Aan</p>
      {clientFieldsOrder.map(key => {
        if (showClientFields[key] === false) return null;
        if (key === 'name')    return <p key="name"    className="font-bold text-slate-900 text-sm leading-tight">{SAMPLE_CLIENT.name}</p>;
        if (key === 'company') return <p key="company" className="text-xs text-slate-500 font-medium mt-0.5">{SAMPLE_CLIENT.company}</p>;
        if (key === 'address') return <p key="address" className="text-xs text-slate-400 mt-0.5">{SAMPLE_CLIENT.address}</p>;
        if (key === 'phone')   return <p key="phone"   className="text-xs text-slate-400 mt-0.5">{SAMPLE_CLIENT.phone}</p>;
        if (key === 'email')   return <p key="email"   className="text-xs text-slate-400">{SAMPLE_CLIENT.email}</p>;
        if (key === 'vat')     return <p key="vat"     className="text-xs text-slate-400 mt-0.5">BTW: {SAMPLE_CLIENT.vat}</p>;
        return null;
      })}
    </div>
  );

  return (
    <div className={`bg-white p-8 ${fontCls} text-sm text-slate-800 border border-slate-200`} style={{ minHeight: '1000px' }}>

      {/* Header */}
      {headerStyle === 'split' ? (
        <div className={hdrPadding} style={hdrBgStyle}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-3">
              {companyLogo ? (
                <img src={companyLogo} alt="" className={`${logoH} w-auto object-contain${hdrHasBg ? ' brightness-0 invert' : ''}`} style={{ maxWidth: '140px' }} />
              ) : (
                <span className={`font-black italic text-base ${hdrTextMain}`}>{companyName || 'RAMZON'}</span>
              )}
              <div>{companyFieldsOrder.map(k => renderField(k))}</div>
            </div>
            <div className="text-right shrink-0">
              <p className={docTitleCls}>{displayLabel}</p>
              <p className={docNumCls}>#F-2025-001</p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${hdrPadding} text-center`} style={hdrBgStyle}>
          {companyLogo ? (
            <img src={companyLogo} alt="" className={`${logoH} w-auto object-contain mx-auto mb-2${hdrHasBg ? ' brightness-0 invert' : ''}`} style={{ maxWidth: '140px' }} />
          ) : (
            <span className={`font-black italic text-xl block mb-2 ${hdrTextMain}`}>{companyName || 'RAMZON N.V.'}</span>
          )}
          {companyFieldsOrder.map(k => renderField(k))}
          <p className={`mt-3 ${docTitleCls}`}>{displayLabel}</p>
          <p className={docNumCls}>#F-2025-001</p>
        </div>
      )}

      {/* Meta row */}
      <div className={`flex${clientPosition === 'below' ? '' : ' justify-between'} items-start mb-5 pb-4 border-b border-slate-200`}>
        {clientPosition === 'left' && <ClientBlk align="left" />}
        <div className="flex gap-6">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Datum</p>
            <p className="font-bold text-slate-900 text-sm">13-03-2025</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Betaaltermijn</p>
            <p className="font-bold text-slate-900 text-sm">30 dagen</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Valuta</p>
            <p className="font-bold text-slate-900 text-sm">USD</p>
          </div>
        </div>
        {clientPosition === 'right' && <ClientBlk align="right" />}
      </div>
      {clientPosition === 'below' && <div className="mb-5"><ClientBlk align="left" /></div>}

      {/* Table */}
      <table className="w-full mb-5 border-collapse text-xs">
        <thead>
          <tr>
            {['Omschrijving', 'Houtsoort', 'Aantal', 'Eenh.', 'Totaal'].map(h => (
              <th key={h} className="text-left py-2 px-2 text-[9px] uppercase tracking-widest font-black" style={tblHdrStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SAMPLE.map((row, i) => (
            <tr key={i} className={tblRowCls}>
              <td className="py-2 px-2 font-medium">{row.desc}</td>
              <td className="py-2 px-2 text-slate-500">{row.wood}</td>
              <td className="py-2 px-2 text-right font-bold">{row.qty}</td>
              <td className="py-2 px-2 text-center text-slate-500">{row.unit}</td>
              <td className="py-2 px-2 text-right font-black">${row.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-56">
          <div className="flex justify-between py-1.5 text-xs border-t border-slate-200">
            <span className="text-slate-500">Subtotaal</span><span className="font-bold">$2,010.00</span>
          </div>
          <div className="flex justify-between py-1.5 text-xs border-b border-slate-100">
            <span className="text-slate-500">BTW (10%)</span><span className="font-bold">$201.00</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-slate-900">
            <span className="font-black text-slate-900">TOTAAL</span><span className="font-black text-slate-900">$2,432.10</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-4 text-[10px] text-slate-500">
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Betalingsgegevens</p>
          <p>ING Bank: NL88 INGB 0123 4567 89</p>
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Voorwaarden</p>
          <p>Betalingstermijn is 14 dagen.</p>
        </div>
      </div>
    </div>
  );
};

// ── Main AppearancePage ────────────────────────────────────────────────────────

const AppearancePage: React.FC = () => {
  const {
    lang,
    companyName, companyLogo, companyAddress,
    companyPhone, companyEmail,
    companyKKF, companyBTW, setCompanyLogo,
  } = useContext(LanguageContext) as any;
  const navigate = useNavigate();

  const L = APPTXT[lang] ?? APPTXT.en;

  const [activeTab, setActiveTab] = useState<'style' | 'header' | 'notities'>('style');
  const [previewZoom, setPreviewZoom] = useState(52);
  const [activeDocType, setActiveDocType] = useState<DocumentType>('invoice');
  const [showPreview, setShowPreview] = useState(false);
  const [applySaved, setApplySaved] = useState(false);

  // Header customization
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>(
    () => (localStorage.getItem('erp_doc_header_style') as any) ?? 'split'
  );
  const [logoAlignment, setLogoAlignment] = useState<'left' | 'center' | 'right'>(
    () => (localStorage.getItem('erp_doc_logo_align') as any) ?? 'left'
  );

  // Typography
  const [fontFamily, setFontFamily] = useState<FontFamily>(
    () => (localStorage.getItem('erp_doc_font_family') as any) ?? 'sans'
  );
  const [fontSize, setFontSize] = useState<FontSize>(
    () => (localStorage.getItem('erp_doc_font_size') as any) ?? 'medium'
  );
  const [fontWeight, setFontWeight] = useState<FontWeight>(
    () => (localStorage.getItem('erp_doc_font_weight') as any) ?? 'bold'
  );

  // Document title
  const [titleSize, setTitleSize] = useState<'sm' | 'md' | 'lg'>(
    () => (localStorage.getItem('erp_doc_title_size') as any) ?? 'md'
  );
  const [titleStyle, setTitleStyle] = useState<'normal' | 'uppercase' | 'stamp'>(
    () => (localStorage.getItem('erp_doc_title_style') as any) ?? 'normal'
  );
  const [customTitles, setCustomTitles] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_custom_titles') ?? '{}'); } catch { return {}; }
  });

  // Customer block
  const [clientStyle, setClientStyle] = useState<'clean' | 'boxed'>(
    () => (localStorage.getItem('erp_doc_client_style') as any) ?? 'clean'
  );
  const [clientPosition, setClientPosition] = useState<'right' | 'left' | 'below'>(
    () => (localStorage.getItem('erp_doc_client_position') as any) ?? 'right'
  );

  // Colors & branding
  const [accentColor, setAccentColor] = useState<string>(
    () => localStorage.getItem('erp_doc_accent_color') ?? '#8B1D2A'
  );
  const [headerBg, setHeaderBg] = useState<'brand' | 'dark' | 'light' | 'none'>(
    () => (localStorage.getItem('erp_doc_header_bg') as any) ?? 'none'
  );
  const [tableHeaderMode, setTableHeaderMode] = useState<'dark' | 'brand' | 'light' | 'none'>(
    () => (localStorage.getItem('erp_doc_table_header') as any) ?? 'dark'
  );

  // Logo size
  const [logoSize, setLogoSize] = useState<'sm' | 'md' | 'lg'>(
    () => (localStorage.getItem('erp_doc_logo_size') as any) ?? 'md'
  );

  // Company field visibility + order
  const [showFields, setShowFields] = useState<Record<string, boolean>>(() => {
    const raw = localStorage.getItem('erp_doc_show_fields');
    return raw ? JSON.parse(raw) : { name: true, address: true, phone: true, email: true, btw: true, kkf: true };
  });
  const [companyFieldsOrder, setCompanyFieldsOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_company_fields_order') ?? '["name","address","phone","email","btw","kkf"]'); }
    catch { return ['name', 'address', 'phone', 'email', 'btw', 'kkf']; }
  });

  // Client field visibility + order
  const [clientFieldsOrder, setClientFieldsOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_client_fields_order') ?? '["name","company","address","phone","email","vat"]'); }
    catch { return ['name', 'company', 'address', 'phone', 'email', 'vat']; }
  });
  const [showClientFields, setShowClientFields] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_show_client_fields') ?? '{}'); } catch { return {}; }
  });

  // Client fields drag state
  const [ckDragIdx,     setCkDragIdx]     = useState<number | null>(null);
  const [ckDragOverIdx, setCkDragOverIdx] = useState<number | null>(null);
  const handleCkDragStart = (i: number) => setCkDragIdx(i);
  const handleCkDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setCkDragOverIdx(i); };
  const handleCkDrop      = (targetIdx: number) => {
    if (ckDragIdx === null || ckDragIdx === targetIdx) { setCkDragIdx(null); setCkDragOverIdx(null); return; }
    const parts = [...clientFieldsOrder];
    const [moved] = parts.splice(ckDragIdx, 1);
    parts.splice(targetIdx, 0, moved);
    setClientFieldsOrder(parts);
    setCkDragIdx(null); setCkDragOverIdx(null);
  };
  const handleCkDragEnd = () => { setCkDragIdx(null); setCkDragOverIdx(null); };

  // Meta columns order + visibility
  const [metaColsOrder, setMetaColsOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_meta_cols_order') ?? '["datum","nr","termijn","vervaldatum","rep","project"]'); }
    catch { return ['datum', 'nr', 'termijn', 'vervaldatum', 'rep', 'project']; }
  });
  const [showMetaCols, setShowMetaCols] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_show_meta_cols') ?? '{}'); } catch { return {}; }
  });
  const [mcDragIdx,     setMcDragIdx]     = useState<number | null>(null);
  const [mcDragOverIdx, setMcDragOverIdx] = useState<number | null>(null);
  const handleMcDragStart = (i: number) => setMcDragIdx(i);
  const handleMcDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setMcDragOverIdx(i); };
  const handleMcDrop      = (targetIdx: number) => {
    if (mcDragIdx === null || mcDragIdx === targetIdx) { setMcDragIdx(null); setMcDragOverIdx(null); return; }
    const parts = [...metaColsOrder];
    const [moved] = parts.splice(mcDragIdx, 1);
    parts.splice(targetIdx, 0, moved);
    setMetaColsOrder(parts);
    setMcDragIdx(null); setMcDragOverIdx(null);
  };
  const handleMcDragEnd = () => { setMcDragIdx(null); setMcDragOverIdx(null); };

  // Table columns order + visibility
  const [tableColsOrder, setTableColsOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_table_cols_order') ?? '["omschrijving","afmeting","qty","eenheid","houtsoort","prijs","subtotaal","btw","totaal"]'); }
    catch { return ['omschrijving', 'afmeting', 'qty', 'eenheid', 'houtsoort', 'prijs', 'subtotaal', 'btw', 'totaal']; }
  });
  const [showTableCols, setShowTableCols] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_show_table_cols') ?? '{}'); } catch { return {}; }
  });
  const [tcDragIdx,     setTcDragIdx]     = useState<number | null>(null);
  const [tcDragOverIdx, setTcDragOverIdx] = useState<number | null>(null);
  const handleTcDragStart = (i: number) => setTcDragIdx(i);
  const handleTcDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setTcDragOverIdx(i); };
  const handleTcDrop      = (targetIdx: number) => {
    if (tcDragIdx === null || tcDragIdx === targetIdx) { setTcDragIdx(null); setTcDragOverIdx(null); return; }
    const parts = [...tableColsOrder];
    const [moved] = parts.splice(tcDragIdx, 1);
    parts.splice(targetIdx, 0, moved);
    setTableColsOrder(parts);
    setTcDragIdx(null); setTcDragOverIdx(null);
  };
  const handleTcDragEnd = () => { setTcDragIdx(null); setTcDragOverIdx(null); };

  // Company fields drag state
  const [cfDragIdx,     setCfDragIdx]     = useState<number | null>(null);
  const [cfDragOverIdx, setCfDragOverIdx] = useState<number | null>(null);
  const handleCfDragStart = (i: number) => setCfDragIdx(i);
  const handleCfDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setCfDragOverIdx(i); };
  const handleCfDrop      = (targetIdx: number) => {
    if (cfDragIdx === null || cfDragIdx === targetIdx) { setCfDragIdx(null); setCfDragOverIdx(null); return; }
    const parts = [...companyFieldsOrder];
    const [moved] = parts.splice(cfDragIdx, 1);
    parts.splice(targetIdx, 0, moved);
    setCompanyFieldsOrder(parts);
    setCfDragIdx(null); setCfDragOverIdx(null);
  };
  const handleCfDragEnd = () => { setCfDragIdx(null); setCfDragOverIdx(null); };

  // Table row style
  const [tableRows, setTableRows] = useState<'horizontal' | 'grid' | 'none'>(
    () => (localStorage.getItem('erp_doc_table_rows') as any) ?? 'horizontal'
  );

  // Footer text
  const [bankDetails, setBankDetails] = useState(
    () => localStorage.getItem('erp_bank_details') ?? `ING Bank: NL88 INGB 0123 4567 89\nBTW nr: ${companyBTW ?? ''}\nKKF: ${companyKKF ?? ''}`
  );
  const [legalDisclaimer, setLegalDisclaimer] = useState(
    () => localStorage.getItem('erp_legal_disclaimer') ?? 'Betalingstermijn is 14 dagen. Op al onze leveringen zijn de algemene voorwaarden van toepassing.'
  );
  useEffect(() => { localStorage.setItem('erp_bank_details', bankDetails); }, [bankDetails]);
  useEffect(() => { localStorage.setItem('erp_legal_disclaimer', legalDisclaimer); }, [legalDisclaimer]);

  // Drag-and-drop — document sections
  const [dragIdx,     setDragIdx]     = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i); };
  const handleDrop      = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const parts = [...docSkeletons[activeDocType]];
    const [moved] = parts.splice(dragIdx, 1);
    parts.splice(targetIdx, 0, moved);
    setDocSkeletons(prev => ({ ...prev, [activeDocType]: parts }));
    setDragIdx(null); setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // Skeleton label editing
  const [editingSkeletonId,    setEditingSkeletonId]    = useState<string | null>(null);
  const [editingSkeletonLabel, setEditingSkeletonLabel] = useState('');
  const saveSkeletonLabel = () => {
    if (!editingSkeletonId || !editingSkeletonLabel.trim()) { setEditingSkeletonId(null); return; }
    setDocSkeletons(prev => ({
      ...prev,
      [activeDocType]: prev[activeDocType].map(item =>
        item.id === editingSkeletonId ? { ...item, label: editingSkeletonLabel.trim() } : item
      )
    }));
    setEditingSkeletonId(null);
  };

  // Drag-and-drop — header tab
  const [headerSectionsOrder, setHeaderSectionsOrder] = useState<string[]>(
    () => JSON.parse(localStorage.getItem('erp_header_sections_order') ?? '["structure","logo","titleSize","clientStyle"]')
  );
  const [hDragIdx,     setHDragIdx]     = useState<number | null>(null);
  const [hDragOverIdx, setHDragOverIdx] = useState<number | null>(null);
  const handleHDragStart = (i: number) => setHDragIdx(i);
  const handleHDragOver  = (e: React.DragEvent, i: number) => { e.preventDefault(); setHDragOverIdx(i); };
  const handleHDrop      = (targetIdx: number) => {
    if (hDragIdx === null || hDragIdx === targetIdx) { setHDragIdx(null); setHDragOverIdx(null); return; }
    const parts = [...headerSectionsOrder];
    const [moved] = parts.splice(hDragIdx, 1);
    parts.splice(targetIdx, 0, moved);
    setHeaderSectionsOrder(parts);
    localStorage.setItem('erp_header_sections_order', JSON.stringify(parts));
    setHDragIdx(null); setHDragOverIdx(null);
  };
  const handleHDragEnd = () => { setHDragIdx(null); setHDragOverIdx(null); };

  // Apply layouts — persist all settings
  const handleApplyLayouts = () => {
    localStorage.setItem('erp_doc_font_family',           fontFamily);
    localStorage.setItem('erp_doc_font_size',             fontSize);
    localStorage.setItem('erp_doc_font_weight',           fontWeight);
    localStorage.setItem('erp_doc_header_style',          headerStyle);
    localStorage.setItem('erp_doc_logo_align',            logoAlignment);
    localStorage.setItem('erp_doc_title_size',            titleSize);
    localStorage.setItem('erp_doc_title_style',           titleStyle);
    localStorage.setItem('erp_doc_client_style',          clientStyle);
    localStorage.setItem('erp_doc_client_position',       clientPosition);
    localStorage.setItem('erp_doc_accent_color',          accentColor);
    localStorage.setItem('erp_doc_header_bg',             headerBg);
    localStorage.setItem('erp_doc_table_header',          tableHeaderMode);
    localStorage.setItem('erp_doc_logo_size',             logoSize);
    localStorage.setItem('erp_doc_show_fields',           JSON.stringify(showFields));
    localStorage.setItem('erp_doc_table_rows',            tableRows);
    localStorage.setItem('erp_doc_custom_titles',         JSON.stringify(customTitles));
    localStorage.setItem('erp_doc_company_fields_order',  JSON.stringify(companyFieldsOrder));
    localStorage.setItem('erp_doc_client_fields_order',   JSON.stringify(clientFieldsOrder));
    localStorage.setItem('erp_doc_show_client_fields',    JSON.stringify(showClientFields));
    localStorage.setItem('erp_doc_meta_cols_order',        JSON.stringify(metaColsOrder));
    localStorage.setItem('erp_doc_show_meta_cols',         JSON.stringify(showMetaCols));
    localStorage.setItem('erp_doc_table_cols_order',       JSON.stringify(tableColsOrder));
    localStorage.setItem('erp_doc_show_table_cols',        JSON.stringify(showTableCols));
    setApplySaved(true);
    setTimeout(() => setApplySaved(false), 2000);
  };

  // Note templates
  const [noteTemplates, setNoteTemplates] = useState<NoteTemplate[]>(() => {
    const saved = storage.noteTemplates.get();
    return saved.length ? saved : DEFAULT_NOTE_TEMPLATES;
  });
  const [showAddTemplate,   setShowAddTemplate]   = useState(false);
  const [newTemplateName,   setNewTemplateName]   = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  useEffect(() => { storage.noteTemplates.save(noteTemplates); }, [noteTemplates]);

  // Document skeletons
  const [docSkeletons, setDocSkeletons] = useState({
    invoice:  [
      { id: 'h1', label: 'Branding Header (Logo & Info)', enabled: true },
      { id: 'm1', label: 'Metadata Row (Date, #, Terms)', enabled: true },
      { id: 't1', label: 'Items Table (Wood Specs)',      enabled: true },
      { id: 's1', label: 'BTW & Tax Line',                enabled: true },
      { id: 'p1', label: 'Footer Section (Notes & Totals)', enabled: true },
    ],
    estimate: [
      { id: 'h1', label: 'Branding Header', enabled: true },
      { id: 'm1', label: 'Metadata Row',    enabled: true },
      { id: 't1', label: 'Items Table',     enabled: true },
      { id: 's1', label: 'BTW Line',        enabled: true },
      { id: 'p1', label: 'Footer Section',  enabled: true },
    ],
    payment:  [
      { id: 'h1', label: 'Branding Header', enabled: true },
      { id: 'm1', label: 'Metadata Row',    enabled: true },
      { id: 't1', label: 'Receipt Items',   enabled: true },
      { id: 's1', label: 'BTW Line',        enabled: true },
      { id: 'p1', label: 'Footer Section',  enabled: true },
    ],
    credit:   [
      { id: 'h1', label: 'Branding Header', enabled: true },
      { id: 'm1', label: 'Metadata Row',    enabled: true },
      { id: 't1', label: 'Credit Items',    enabled: true },
      { id: 's1', label: 'BTW Line',        enabled: true },
      { id: 'p1', label: 'Footer Section',  enabled: true },
    ],
    note:     [
      { id: 'h1', label: 'Branding Header', enabled: true },
      { id: 'm1', label: 'Metadata Row',    enabled: true },
      { id: 't1', label: 'Note Content',    enabled: true },
      { id: 'p1', label: 'Footer Section',  enabled: true },
    ],
  });

  const toggleSkeletonItem = (type: DocumentType, id: string) => {
    setDocSkeletons(prev => ({
      ...prev,
      [type]: prev[type].map(item => item.id === id ? { ...item, enabled: !item.enabled } : item)
    }));
  };

  const isEnabled = (type: DocumentType, partId: string) =>
    docSkeletons[type].find(p => p.id === partId)?.enabled;

  // Field label maps
  const fieldLabels: Record<string, string> = {
    name: L.naam, address: L.adres, phone: L.telefoon, email: L.email, btw: L.btwNr, kkf: L.kkfNr,
  };
  const clientFieldLabels: Record<string, string> = {
    name: L.naam, company: L.company, address: L.adres, phone: L.telefoon, email: L.email, vat: L.btwNr,
  };
  const metaColLabels: Record<string, string> = {
    datum: L.datum, nr: L.nr, termijn: L.termijn, vervaldatum: L.vervaldatum, rep: L.rep, project: L.project,
  };
  const tableColLabels: Record<string, string> = {
    omschrijving: L.omschrijving, afmeting: L.afmeting, qty: L.qty, eenheid: L.eenheid,
    houtsoort: L.houtsoort, prijs: L.prijs, subtotaal: L.subtotaal, btw: L.btw, totaal: L.totaal,
  };

  // Default document titles
  const defaultTitles: Record<string, string> = {
    invoice: 'Factuur', estimate: 'Offerte', quote: 'Offerte', payment: 'Betaling', credit: 'Creditnota',
  };

  // ── Tab content renderer ────────────────────────────────────────────────────

  const renderTabContent = () => {
    switch (activeTab) {

      // ── TEMPLATE EDITOR ─────────────────────────────────────────────────────
      case 'style':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 animate-in fade-in duration-300">

            {/* ── Left: Settings panels ── */}
            <div className="xl:col-span-5 space-y-2.5">

              {/* Document Sections (merged from old builder tab) */}
              <SettingsSec label={L.docSections}>
                <div className="space-y-3">
                  {/* Doc type selector */}
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { id: 'invoice',  label: L.invoices,  icon: Receipt },
                      { id: 'estimate', label: L.estimates, icon: ClipboardList },
                      { id: 'payment',  label: L.payments,  icon: Wallet },
                      { id: 'credit',   label: L.credits,   icon: CreditCard },
                      { id: 'note',     label: L.notes,     icon: FileText },
                    ].map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setActiveDocType(doc.id as DocumentType)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all border text-left ${activeDocType === doc.id ? 'bg-brand-primary text-white border-brand-primary shadow' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                      >
                        <doc.icon size={14} className={activeDocType === doc.id ? 'text-white' : 'text-slate-400'} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{doc.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Section ordering */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <SettingsLabel>{L.sections}: {activeDocType.toUpperCase()}</SettingsLabel>
                    {docSkeletons[activeDocType].map((item, idx) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={e => handleDragOver(e, idx)}
                        onDrop={() => handleDrop(idx)}
                        onDragEnd={handleDragEnd}
                        className={`group flex items-center gap-2 p-2.5 rounded border transition-all select-none
                          ${item.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'}
                          ${dragIdx === idx ? 'opacity-30' : ''}
                          ${dragOverIdx === idx && dragIdx !== idx ? 'border-t-2 border-brand-primary' : ''}`}
                      >
                        <Move size={12} className="text-slate-300 cursor-grab shrink-0" />
                        <div className="flex-1 min-w-0">
                          {editingSkeletonId === item.id ? (
                            <input
                              autoFocus
                              value={editingSkeletonLabel}
                              onChange={e => setEditingSkeletonLabel(e.target.value)}
                              onBlur={saveSkeletonLabel}
                              onKeyDown={e => { if (e.key === 'Enter') saveSkeletonLabel(); if (e.key === 'Escape') setEditingSkeletonId(null); }}
                              className="w-full text-xs font-black text-slate-900 bg-slate-50 border border-brand-primary rounded px-2 py-0.5 outline-none"
                            />
                          ) : (
                            <p className="text-xs font-black text-slate-700 truncate">{item.label}</p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleSkeletonItem(activeDocType, item.id)}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border transition-all ${item.enabled ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-300'}`}
                        >
                          {item.enabled ? L.visible : L.hidden}
                        </button>
                        <button
                          onClick={() => { setEditingSkeletonId(item.id); setEditingSkeletonLabel(item.label); }}
                          className="p-1 text-slate-200 hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Settings2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </SettingsSec>

              <SettingsSec label={L.colors}>
                <div className="space-y-4">
                  <div>
                    <SettingsLabel>{L.accentColor}</SettingsLabel>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={e => setAccentColor(e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-slate-200 p-0.5 bg-white"
                      />
                      <span className="font-mono text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">{accentColor}</span>
                      <button
                        onClick={() => setAccentColor('#8B1D2A')}
                        className="text-[9px] font-black text-slate-400 hover:text-slate-600 ml-auto uppercase tracking-widest"
                      >
                        {L.reset}
                      </button>
                    </div>
                  </div>
                  <div>
                    <SettingsLabel>{L.headerBg}</SettingsLabel>
                    <OptionRow
                      options={[{value:'brand',label:L.brand},{value:'dark',label:L.dark},{value:'light',label:L.light},{value:'none',label:L.none}]}
                      active={headerBg}
                      onChange={v => setHeaderBg(v as 'brand'|'dark'|'light'|'none')}
                    />
                  </div>
                  <div>
                    <SettingsLabel>{L.tableHdr}</SettingsLabel>
                    <OptionRow
                      options={[{value:'dark',label:L.dark},{value:'brand',label:L.brand},{value:'light',label:L.light},{value:'none',label:L.none}]}
                      active={tableHeaderMode}
                      onChange={v => setTableHeaderMode(v as 'dark'|'brand'|'light'|'none')}
                    />
                  </div>
                </div>
              </SettingsSec>

              <SettingsSec label={L.typography}>
                <div className="space-y-3">
                  <div>
                    <SettingsLabel>{L.fontFamily}</SettingsLabel>
                    <OptionRow
                      options={[{value:'sans',label:'Sans'},{value:'serif',label:'Serif'},{value:'mono',label:'Mono'}]}
                      active={fontFamily}
                      onChange={v => setFontFamily(v as FontFamily)}
                    />
                  </div>
                  <div>
                    <SettingsLabel>{L.textScale}</SettingsLabel>
                    <OptionRow
                      options={[{value:'small',label:L.small},{value:'medium',label:L.medium},{value:'large',label:L.large}]}
                      active={fontSize}
                      onChange={v => setFontSize(v as FontSize)}
                    />
                  </div>
                  <div>
                    <SettingsLabel>{L.weight}</SettingsLabel>
                    <OptionRow
                      options={[{value:'normal',label:L.reg},{value:'medium',label:L.med},{value:'bold',label:L.bold},{value:'black',label:L.black}]}
                      active={fontWeight}
                      onChange={v => setFontWeight(v as FontWeight)}
                    />
                  </div>
                </div>
              </SettingsSec>

              <SettingsSec label={L.docTitle}>
                <div className="space-y-3">
                  <div>
                    <SettingsLabel>{L.titleSize}</SettingsLabel>
                    <OptionRow
                      options={[{value:'sm',label:L.small},{value:'md',label:L.medium},{value:'lg',label:L.large}]}
                      active={titleSize}
                      onChange={v => setTitleSize(v as 'sm'|'md'|'lg')}
                    />
                  </div>
                  <div>
                    <SettingsLabel>{L.titleStyle}</SettingsLabel>
                    <OptionRow
                      options={[{value:'normal',label:L.normal},{value:'uppercase',label:L.uppercase},{value:'stamp',label:L.stamp}]}
                      active={titleStyle}
                      onChange={v => setTitleStyle(v as 'normal'|'uppercase'|'stamp')}
                    />
                  </div>
                  <div>
                    <SettingsLabel>{L.customLabel}</SettingsLabel>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['invoice', 'estimate', 'payment', 'credit'] as const).map(dt => (
                        <div key={dt} className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{dt}</span>
                          <input
                            value={customTitles[dt] ?? defaultTitles[dt] ?? dt}
                            onChange={e => setCustomTitles(prev => ({ ...prev, [dt]: e.target.value }))}
                            className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded bg-white focus:outline-none focus:border-brand-primary/50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SettingsSec>

              <SettingsSec label={L.logoHeader}>
                <div className="space-y-3">
                  <div>
                    <SettingsLabel>{L.logoSize}</SettingsLabel>
                    <OptionRow
                      options={[{value:'sm',label:L.small},{value:'md',label:L.medium},{value:'lg',label:L.large}]}
                      active={logoSize}
                      onChange={v => setLogoSize(v as 'sm'|'md'|'lg')}
                    />
                  </div>
                  <div>
                    <SettingsLabel>{L.headerLayout}</SettingsLabel>
                    <OptionRow
                      options={[{value:'split',label:L.split},{value:'centered',label:L.centered}]}
                      active={headerStyle}
                      onChange={v => setHeaderStyle(v as HeaderStyle)}
                    />
                  </div>
                </div>
              </SettingsSec>

              <SettingsSec label={L.companyFields}>
                <div className="space-y-1.5">
                  {companyFieldsOrder.map((key, idx) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => handleCfDragStart(idx)}
                      onDragOver={e => handleCfDragOver(e, idx)}
                      onDrop={() => handleCfDrop(idx)}
                      onDragEnd={handleCfDragEnd}
                      className={`flex items-center gap-2 p-2 rounded border bg-white select-none cursor-grab transition-all
                        ${cfDragIdx === idx ? 'opacity-30' : ''}
                        ${cfDragOverIdx === idx && cfDragIdx !== idx ? 'border-t-2 border-brand-primary' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <Move size={12} className="text-slate-300 shrink-0" />
                      <span className="flex-1 text-xs font-black uppercase tracking-wide text-slate-600">{fieldLabels[key] ?? key}</span>
                      <button
                        onClick={() => setShowFields(prev => ({ ...prev, [key]: !(prev[key] !== false) }))}
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border transition-all ${showFields[key] !== false ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-300'}`}
                      >
                        {showFields[key] !== false ? L.visible : L.hidden}
                      </button>
                    </div>
                  ))}
                </div>
              </SettingsSec>

              <SettingsSec label={L.clientFields}>
                <div className="space-y-1.5">
                  {clientFieldsOrder.map((key, idx) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => handleCkDragStart(idx)}
                      onDragOver={e => handleCkDragOver(e, idx)}
                      onDrop={() => handleCkDrop(idx)}
                      onDragEnd={handleCkDragEnd}
                      className={`flex items-center gap-2 p-2 rounded border bg-white select-none cursor-grab transition-all
                        ${ckDragIdx === idx ? 'opacity-30' : ''}
                        ${ckDragOverIdx === idx && ckDragIdx !== idx ? 'border-t-2 border-brand-primary' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <Move size={12} className="text-slate-300 shrink-0" />
                      <span className="flex-1 text-xs font-black uppercase tracking-wide text-slate-600">{clientFieldLabels[key] ?? key}</span>
                      <button
                        onClick={() => setShowClientFields(prev => ({ ...prev, [key]: !(prev[key] !== false) }))}
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border transition-all ${showClientFields[key] !== false ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-300'}`}
                      >
                        {showClientFields[key] !== false ? L.visible : L.hidden}
                      </button>
                    </div>
                  ))}
                </div>
              </SettingsSec>

              <SettingsSec label={L.clientBlock}>
                <div className="space-y-3">
                  <div>
                    <SettingsLabel>{L.style}</SettingsLabel>
                    <OptionRow
                      options={[{value:'clean',label:L.clean},{value:'boxed',label:L.boxed}]}
                      active={clientStyle}
                      onChange={v => setClientStyle(v as 'clean'|'boxed')}
                    />
                  </div>
                  <div>
                    <SettingsLabel>{L.position}</SettingsLabel>
                    <OptionRow
                      options={[{value:'right',label:L.right},{value:'left',label:L.left},{value:'below',label:L.below}]}
                      active={clientPosition}
                      onChange={v => setClientPosition(v as 'right'|'left'|'below')}
                    />
                  </div>
                </div>
              </SettingsSec>

              <SettingsSec label={L.tableStyle}>
                <div>
                  <SettingsLabel>{L.rowLines}</SettingsLabel>
                  <OptionRow
                    options={[{value:'horizontal',label:L.horizontal},{value:'grid',label:L.grid},{value:'none',label:L.none}]}
                    active={tableRows}
                    onChange={v => setTableRows(v as 'horizontal'|'grid'|'none')}
                  />
                </div>
              </SettingsSec>

              <SettingsSec label={L.metaCols}>
                <div className="space-y-1.5">
                  {metaColsOrder.map((key, idx) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => handleMcDragStart(idx)}
                      onDragOver={e => handleMcDragOver(e, idx)}
                      onDrop={() => handleMcDrop(idx)}
                      onDragEnd={handleMcDragEnd}
                      className={`flex items-center gap-2 p-2 rounded border bg-white select-none cursor-grab transition-all
                        ${mcDragIdx === idx ? 'opacity-30' : ''}
                        ${mcDragOverIdx === idx && mcDragIdx !== idx ? 'border-t-2 border-brand-primary' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <Move size={12} className="text-slate-300 shrink-0" />
                      <span className="flex-1 text-xs font-black uppercase tracking-wide text-slate-600">{metaColLabels[key] ?? key}</span>
                      <button
                        onClick={() => setShowMetaCols(prev => ({ ...prev, [key]: !(prev[key] !== false) }))}
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border transition-all ${showMetaCols[key] !== false ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-300'}`}
                      >
                        {showMetaCols[key] !== false ? L.visible : L.hidden}
                      </button>
                    </div>
                  ))}
                </div>
              </SettingsSec>

              <SettingsSec label={L.tableCols}>
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">Geldt voor PDF/print (klant-versie). In bewerkmodus zijn altijd alle kolommen zichtbaar.</p>
                <div className="space-y-1.5">
                  {tableColsOrder.map((key, idx) => (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => handleTcDragStart(idx)}
                      onDragOver={e => handleTcDragOver(e, idx)}
                      onDrop={() => handleTcDrop(idx)}
                      onDragEnd={handleTcDragEnd}
                      className={`flex items-center gap-2 p-2 rounded border bg-white select-none cursor-grab transition-all
                        ${tcDragIdx === idx ? 'opacity-30' : ''}
                        ${tcDragOverIdx === idx && tcDragIdx !== idx ? 'border-t-2 border-brand-primary' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <Move size={12} className="text-slate-300 shrink-0" />
                      <span className="flex-1 text-xs font-black uppercase tracking-wide text-slate-600">{tableColLabels[key] ?? key}</span>
                      <button
                        onClick={() => setShowTableCols(prev => ({ ...prev, [key]: !(prev[key] !== false) }))}
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border transition-all ${showTableCols[key] !== false ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-300'}`}
                      >
                        {showTableCols[key] !== false ? L.visible : L.hidden}
                      </button>
                    </div>
                  ))}
                </div>
              </SettingsSec>

              <SettingsSec label={L.footerContent}>
                <div className="space-y-3">
                  <div>
                    <SettingsLabel>{L.bankDetails}</SettingsLabel>
                    <textarea
                      value={bankDetails}
                      onChange={e => setBankDetails(e.target.value)}
                      rows={3}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs resize-none focus:outline-none focus:border-brand-primary/50"
                    />
                  </div>
                  <div>
                    <SettingsLabel>{L.legalText}</SettingsLabel>
                    <textarea
                      value={legalDisclaimer}
                      onChange={e => setLegalDisclaimer(e.target.value)}
                      rows={3}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs resize-none focus:outline-none focus:border-brand-primary/50"
                    />
                  </div>
                </div>
              </SettingsSec>

              <button
                onClick={handleApplyLayouts}
                className={`w-full py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${applySaved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-900 text-white shadow-slate-300 hover:bg-slate-800'}`}
              >
                {applySaved ? <><Check size={15} /> {L.savedLabel}</> : <><Save size={15} /> {L.saveApply}</>}
              </button>
            </div>

            {/* ── Right: Live preview ── */}
            <div className="xl:col-span-7">
              <div className="rounded-lg border border-slate-200 overflow-hidden sticky top-4 bg-slate-100" style={{ height: '680px' }}>
                <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L.livePreview}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 tabular-nums">{previewZoom}%</span>
                    <input
                      type="range"
                      min={30}
                      max={90}
                      step={2}
                      value={previewZoom}
                      onChange={e => setPreviewZoom(Number(e.target.value))}
                      className="w-20 h-1 accent-brand-primary cursor-pointer"
                    />
                  </div>
                </div>
                <div className="overflow-hidden relative" style={{ height: '636px' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: '50%',
                    transform: `translateX(-50%) scale(${previewZoom / 100})`,
                    transformOrigin: 'top center',
                    width: '860px', pointerEvents: 'none',
                  }}>
                    <LivePreview
                      accentColor={accentColor}
                      headerBg={headerBg}
                      tableHeaderMode={tableHeaderMode}
                      logoSize={logoSize}
                      showFields={showFields}
                      clientPosition={clientPosition}
                      tableRows={tableRows}
                      titleStyle={titleStyle}
                      fontFamily={fontFamily}
                      titleSize={titleSize}
                      clientStyle={clientStyle}
                      headerStyle={headerStyle}
                      companyFieldsOrder={companyFieldsOrder}
                      customTitles={customTitles}
                      clientFieldsOrder={clientFieldsOrder}
                      showClientFields={showClientFields}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // ── PDF HEADERS ──────────────────────────────────────────────────────────
      case 'header':
        return (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tighter">{L.headerTitle}</h3>
              <p className="text-sm font-medium text-slate-500 mt-0.5">{L.headerSub}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                {headerSectionsOrder.map((sectionId, idx) => (
                  <div
                    key={sectionId}
                    draggable
                    onDragStart={() => handleHDragStart(idx)}
                    onDragOver={e => handleHDragOver(e, idx)}
                    onDrop={() => handleHDrop(idx)}
                    onDragEnd={handleHDragEnd}
                    className={`group p-4 rounded-lg border bg-white transition-all select-none
                      ${hDragIdx === idx ? 'opacity-30 scale-95' : ''}
                      ${hDragOverIdx === idx && hDragIdx !== idx ? 'border-t-2 border-brand-primary shadow-md' : 'border-slate-100 shadow-sm hover:shadow-md'}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 shrink-0">
                        <Move size={13} />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {sectionId === 'structure' ? L.headerStructure
                          : sectionId === 'logo' ? L.logoAlignment
                          : sectionId === 'titleSize' ? L.titleSizeLabel
                          : L.clientStyleLabel}
                      </span>
                    </div>

                    {sectionId === 'structure' && (
                      <div className="flex gap-2">
                        <button onClick={() => setHeaderStyle('centered')}
                          className={`flex-1 p-2.5 border rounded text-[10px] font-black uppercase tracking-widest transition-all ${headerStyle === 'centered' ? 'border-brand-primary bg-brand-accent-light text-brand-primary' : 'border-slate-100 text-slate-400'}`}>
                          {L.centered}
                        </button>
                        <button onClick={() => setHeaderStyle('split')}
                          className={`flex-1 p-2.5 border rounded text-[10px] font-black uppercase tracking-widest transition-all ${headerStyle === 'split' ? 'border-brand-primary bg-brand-accent-light text-brand-primary' : 'border-slate-100 text-slate-400'}`}>
                          {L.split}
                        </button>
                      </div>
                    )}
                    {sectionId === 'logo' && (
                      <div className="flex gap-2">
                        {(['left', 'center', 'right'] as const).map(a => (
                          <button key={a} onClick={() => setLogoAlignment(a)}
                            className={`flex-1 p-2.5 border rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${logoAlignment === a ? 'border-brand-primary bg-brand-accent-light text-brand-primary' : 'border-slate-100 text-slate-400'}`}>
                            {a === 'left' ? <AlignLeft size={13} /> : a === 'center' ? <AlignCenter size={13} /> : <AlignRight size={13} />}
                            {a.charAt(0).toUpperCase() + a.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                    {sectionId === 'titleSize' && (
                      <OptionRow
                        options={[{value:'sm',label:L.small},{value:'md',label:L.medium},{value:'lg',label:L.large}]}
                        active={titleSize}
                        onChange={v => setTitleSize(v as 'sm'|'md'|'lg')}
                      />
                    )}
                    {sectionId === 'clientStyle' && (
                      <OptionRow
                        options={[{value:'clean',label:L.clean},{value:'boxed',label:L.boxed}]}
                        active={clientStyle}
                        onChange={v => setClientStyle(v as 'clean'|'boxed')}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  {companyLogo ? (
                    <img src={companyLogo} className="w-20 h-14 object-contain" alt="Logo" />
                  ) : (
                    <Building size={28} className="text-brand-primary" />
                  )}
                </div>
                <label className="flex flex-col items-center gap-2 cursor-pointer group">
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:border-brand-primary group-hover:text-brand-primary transition-all shadow-sm">
                    <Upload size={11} /> {L.uploadLogo}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setCompanyLogo && setCompanyLogo(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <p className="text-xs font-bold text-slate-400 italic">{L.companyInfoSync}</p>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline transition-all"
                >
                  {L.editCompany}
                </button>
              </div>
            </div>
          </div>
        );

      // ── NOTES & TERMS ────────────────────────────────────────────────────────
      case 'notities':
        return (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tighter">{L.notesTitle}</h3>
                <p className="text-sm font-medium text-slate-500 mt-0.5">{L.notesSub}</p>
              </div>
              <button
                onClick={() => setShowAddTemplate(true)}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg text-xs font-black flex items-center gap-2 shadow hover:bg-red-800 transition-all active:scale-95"
              >
                <Plus size={13} /> {L.add}
              </button>
            </div>

            {showAddTemplate && (
              <div className="p-5 bg-blue-50/40 border-2 border-blue-100 rounded-lg space-y-4 animate-in slide-in-from-top-3 duration-300">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{L.newTemplate}</h4>
                <div className="space-y-3">
                  <input
                    aria-label="Template naam"
                    placeholder={L.templateName}
                    value={newTemplateName}
                    onChange={e => setNewTemplateName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-300"
                  />
                  <textarea
                    aria-label="Template inhoud"
                    placeholder={L.templateContent}
                    value={newTemplateContent}
                    onChange={e => setNewTemplateContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none resize-none focus:border-blue-300"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => { setShowAddTemplate(false); setNewTemplateName(''); setNewTemplateContent(''); }}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-500 hover:bg-slate-50 transition-all">
                    {L.cancel}
                  </button>
                  <button onClick={() => {
                    if (!newTemplateName.trim()) return;
                    setNoteTemplates(prev => [...prev, { name: newTemplateName, content: newTemplateContent, iconName: 'MessageSquareText' }]);
                    setNewTemplateName(''); setNewTemplateContent(''); setShowAddTemplate(false);
                  }} className="px-5 py-2 bg-brand-primary text-white rounded-lg text-xs font-black hover:bg-red-800 transition-all shadow">
                    {L.save}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {noteTemplates.map((note, i) => {
                const NoteIcon = ICON_MAP[note.iconName] ?? FileText;
                return (
                  <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-lg hover:bg-white hover:shadow-lg transition-all cursor-pointer group relative">
                    <button
                      title="Verwijder template"
                      onClick={() => setNoteTemplates(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-red-500"
                    >
                      <X size={13} />
                    </button>
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-brand-primary shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      <NoteIcon size={18} />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 mb-1.5">{note.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">"{note.content}"</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
    }
  };

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">{L.pageTitle}</h1>
          <p className="text-slate-500 font-bold italic mt-1 text-sm leading-none">{L.pageSubtitle}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <Eye size={16} /> {L.preview}
          </button>
          <button
            onClick={handleApplyLayouts}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 shadow-lg active:scale-95 ${applySaved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'}`}
          >
            {applySaved ? <><Check size={16} /> {L.saved}</> : <><Save size={16} /> {L.save}</>}
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-slate-50/50 px-3 py-1 rounded-lg">
        {[
          { id: 'style',    label: L.tabEditor,  icon: Sliders },
          { id: 'header',   label: L.tabHeaders, icon: LayoutTemplate },
          { id: 'notities', label: L.tabNotes,   icon: MessageSquareText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 flex items-center gap-2.5 shrink-0 ${activeTab === tab.id ? 'border-brand-accent text-brand-primary' : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-t-lg'}`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? 'text-brand-primary' : 'opacity-40'} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">{renderTabContent()}</div>

      {/* ── Full Preview Modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowPreview(false)}></div>

          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center text-white">
                  <LayoutTemplate size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight">{L.previewTitle}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {L.type}: {activeDocType.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <Printer size={18} />
                </button>
                <button className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2.5 bg-slate-900 text-white rounded-lg shadow hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-100/50 p-8 md:p-12 flex justify-center">
              <div className="w-full max-w-[850px] min-h-[1100px] bg-white shadow-xl border border-slate-200 p-10 font-sans text-slate-900">

                {isEnabled(activeDocType, 'h1') && (
                  <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                    <div>
                      <div className="w-36 h-20 flex items-center justify-center overflow-hidden mb-2">
                        {companyLogo ? (
                          <img src={companyLogo} className="w-full h-full object-contain" alt="Logo" />
                        ) : (
                          <div className="text-xl font-black text-brand-primary italic">{companyName || 'RAMZON N.V.'}</div>
                        )}
                      </div>
                      <div className="space-y-0.5 text-[9px] font-bold text-slate-600">
                        {companyAddress && <p>{companyAddress}</p>}
                        {companyPhone && <p>{companyPhone}</p>}
                        {companyEmail && <p>{companyEmail}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <h1 className="text-base font-black text-slate-900 uppercase tracking-widest">
                        {customTitles[activeDocType] || defaultTitles[activeDocType] || activeDocType.toUpperCase()}
                      </h1>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">#2025-001</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-6 border-t border-b border-slate-900 divide-x divide-slate-200 text-center mb-6">
                  {['Datum', '#', 'Termijn', 'Vervaldatum', 'Rep', 'Project'].map(h => (
                    <div key={h} className="py-1.5">
                      <p className="text-[9px] font-bold text-slate-400 border-b border-slate-100 mb-1">{h}</p>
                      <p className="text-xs font-bold">—</p>
                    </div>
                  ))}
                </div>

                {isEnabled(activeDocType, 't1') && (
                  <div className="border border-slate-200 mb-4 min-h-[300px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="border-b border-slate-200">
                        <tr className="bg-slate-900 text-white text-[9px] font-black uppercase">
                          <th className="py-1.5 px-2 w-[40%]">Omschrijving</th>
                          <th className="py-1.5 px-2 text-center w-[12%]">Afmeting</th>
                          <th className="py-1.5 px-2 text-center w-[8%]">Qty</th>
                          <th className="py-1.5 px-2 text-center w-[8%]">Eenheid</th>
                          <th className="py-1.5 px-2 text-center w-[12%]">Houtsoort</th>
                          <th className="py-1.5 px-2 text-right w-[10%]">Prijs</th>
                          <th className="py-1.5 px-2 text-right w-[10%]">Totaal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { desc: 'Hout drogen', qty: 3.75, um: 'CBM', wood: 'Kopi', rate: 80.00, total: 300.00 },
                          { desc: 'Vloerhout herschaven', qty: 135, um: 'M²', wood: '', rate: 8.00, total: 1080.00 },
                        ].map((row, i) => (
                          <tr key={i} className="text-xs font-medium border-b border-slate-50">
                            <td className="py-2 px-2">{row.desc}</td>
                            <td className="py-2 px-2 text-center">—</td>
                            <td className="py-2 px-2 text-center">{row.qty}</td>
                            <td className="py-2 px-2 text-center">{row.um}</td>
                            <td className="py-2 px-2 text-center">{row.wood || '—'}</td>
                            <td className="py-2 px-2 text-right">{row.rate.toFixed(2)}</td>
                            <td className="py-2 px-2 text-right">{row.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {isEnabled(activeDocType, 'p1') && (
                  <div className="border border-slate-200 grid grid-cols-12 divide-x divide-slate-200">
                    <div className="col-span-9 p-4 text-[9px] font-bold space-y-1 text-slate-500 leading-tight">
                      <p>1 - Kantooruren: ma-vr 08:00-12:00 / 13:00-17:00</p>
                      <p>2 - Hakrinbank N.V SRD 20.633.15.56 · EURO 20.695.94.66 · US$ 20.802.82.73</p>
                      <p>3 - Alle houtproducten excl.: supply, afwerking, glas, sloten</p>
                    </div>
                    <div className="col-span-3 flex flex-col divide-y divide-slate-200">
                      <div className="flex-1 p-3 flex justify-between items-center">
                        <span className="text-xs font-black uppercase">Totaal</span>
                        <span className="text-xs font-bold">USD 1,380.00</span>
                      </div>
                      <div className="flex-1 p-3 flex justify-between items-center bg-slate-50">
                        <span className="text-xs font-black uppercase">Saldo</span>
                        <span className="text-xs font-bold">USD 1,108.00</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Layout Engine</span>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow hover:bg-slate-800 active:scale-95 transition-all"
              >
                {L.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppearancePage;
