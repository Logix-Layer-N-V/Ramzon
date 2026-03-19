import React, { useContext, useEffect } from 'react';
import { Printer, X, Download } from 'lucide-react';
import { LanguageContext } from '../lib/context';
import { pdf } from '@react-pdf/renderer';
import { DocPDF } from './DocPDF';

export interface ModalLineItem {
  id: string;
  description: string;
  houtsoort: string;
  spec: string;
  qty: number;
  unit: string;
  price: number;
  discount?: number;
  mmW?: number;
  mmH?: number;
}

export interface DocPDFModalProps {
  docType: 'quote' | 'invoice';
  docNumber: string;
  date: string;
  validUntil?: string;
  clientName: string;
  clientCompany?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientVAT?: string;
  rep?: string;
  paidAmount?: number;
  currency: string;
  currencySymbol: string;
  items: ModalLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  onClose: () => void;
}

const itemArea = (item: ModalLineItem) =>
  item.mmW && item.mmH ? (item.mmW / 1000) * (item.mmH / 1000) : 1;

const PRINT_CSS = [
  '@media print {',
  '  .no-print { display: none !important; }',
  '  body > * { display: none !important; }',
  '  #pdf-document {',
  '    display: block !important;',
  '    position: fixed !important;',
  '    top: 0 !important; left: 0 !important;',
  '    width: 210mm !important;',
  '    min-height: 297mm !important;',
  '    margin: 0 !important;',
  '    padding: 20mm !important;',
  '    box-shadow: none !important;',
  '    border: none !important;',
  '    border-radius: 0 !important;',
  '    z-index: 99999 !important;',
  '    overflow: visible !important;',
  '  }',
  '  #pdf-document * {',
  '    -webkit-print-color-adjust: exact !important;',
  '    print-color-adjust: exact !important;',
  '  }',
  '}',
].join('\n');

const DocPDFModal: React.FC<DocPDFModalProps> = ({
  docType, docNumber, date, validUntil,
  clientName, clientCompany, clientAddress, clientPhone, clientEmail, clientVAT,
  rep, paidAmount,
  currency, currencySymbol, items, subtotal, tax, total, onClose,
}) => {
  const {
    companyName, companyLogo, companyAddress, companyPhone, companyEmail,
    companyBTW, companyKKF,
  } = useContext(LanguageContext);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'pdf-print-styles';
    styleEl.textContent = PRINT_CSS;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, []);

  // ── Template settings from localStorage ─────────────────────────────────
  const fontFamily        = localStorage.getItem('erp_doc_font_family') ?? 'sans';
  const bankDetails       = localStorage.getItem('erp_bank_details') ?? '';
  const legalDisclaimer   = localStorage.getItem('erp_legal_disclaimer') ?? '';
  const headerStyle       = localStorage.getItem('erp_doc_header_style') ?? 'split';
  const accentColor       = localStorage.getItem('erp_doc_accent_color') ?? '#8B1D2A';
  const headerBgMode      = (localStorage.getItem('erp_doc_header_bg') ?? 'none') as 'brand' | 'dark' | 'light' | 'none';
  const tableHeaderMode   = (localStorage.getItem('erp_doc_table_header') ?? 'dark') as 'dark' | 'brand' | 'light' | 'none';
  const logoSz            = (localStorage.getItem('erp_doc_logo_size') ?? 'md') as 'sm' | 'md' | 'lg';
  const showF: Record<string, boolean> = (() => {
    const raw = localStorage.getItem('erp_doc_show_fields');
    return raw ? JSON.parse(raw) : { name: true, address: true, phone: true, email: true, btw: true, kkf: true };
  })();
  const companyFieldsOrder: string[] = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_company_fields_order') ?? '["name","address","phone","email","btw","kkf"]'); }
    catch { return ['name', 'address', 'phone', 'email', 'btw', 'kkf']; }
  })();
  const clientFieldsOrder: string[] = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_client_fields_order') ?? '["name","company","address","phone","email","vat"]'); }
    catch { return ['name', 'company', 'address', 'phone', 'email', 'vat']; }
  })();
  const showClientF: Record<string, boolean> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_show_client_fields') ?? '{}'); } catch { return {}; }
  })();
  const metaColsOrder: string[] = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_meta_cols_order') ?? '["datum","nr","termijn","vervaldatum","rep","project"]'); }
    catch { return ['datum', 'nr', 'termijn', 'vervaldatum', 'rep', 'project']; }
  })();
  const showMetaCols: Record<string, boolean> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_show_meta_cols') ?? '{}'); } catch { return {}; }
  })();
  const tableColsOrder: string[] = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_table_cols_order') ?? '["omschrijving","afmeting","qty","eenheid","houtsoort","prijs","totaal"]'); }
    catch { return ['omschrijving', 'afmeting', 'qty', 'eenheid', 'houtsoort', 'prijs', 'totaal']; }
  })();
  const showTableCols: Record<string, boolean> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_show_table_cols') ?? '{}'); } catch { return {}; }
  })();
  const customTitlesMap: Record<string, string> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_custom_titles') ?? '{}'); } catch { return {}; }
  })();
  const clientPos         = (localStorage.getItem('erp_doc_client_position') ?? 'right') as 'right' | 'left' | 'below';
  const tableRowsStyle    = (localStorage.getItem('erp_doc_table_rows') ?? 'horizontal') as 'horizontal' | 'grid' | 'none';
  const docTitleMode      = (localStorage.getItem('erp_doc_title_style') ?? 'normal') as 'normal' | 'uppercase' | 'stamp';
  const clientStyle       = localStorage.getItem('erp_doc_client_style') ?? 'clean';
  const titleSize         = localStorage.getItem('erp_doc_title_size') ?? 'md';

  // ── Derived header styles ────────────────────────────────────────────────
  const hdrHasBg = headerBgMode !== 'none';
  const hdrBgStyle: React.CSSProperties =
    headerBgMode === 'brand' ? { backgroundColor: accentColor } :
    headerBgMode === 'dark'  ? { backgroundColor: '#1e293b' } :
    headerBgMode === 'light' ? { backgroundColor: '#f8fafc' } : {};
  const hdrPadding   = hdrHasBg ? '-mx-10 -mt-10 mb-8 px-10 pt-10 pb-7' : 'border-b-2 border-slate-200 pb-6 mb-6';
  const hdrTextMain  = hdrHasBg ? 'text-white' : 'text-slate-900';
  const hdrTextSub   = hdrHasBg ? 'text-white/70' : 'text-slate-500';
  const hdrTextMuted = hdrHasBg ? 'text-white/50' : 'text-slate-400';

  // ── Derived table header styles ──────────────────────────────────────────
  const tblHdrStyle: React.CSSProperties =
    tableHeaderMode === 'dark'  ? { backgroundColor: '#1e293b', color: 'white' } :
    tableHeaderMode === 'brand' ? { backgroundColor: accentColor, color: 'white' } :
    tableHeaderMode === 'light' ? { backgroundColor: '#f8fafc', color: '#64748b' } :
    { color: '#475569', borderBottom: '2px solid #e2e8f0' };

  // ── Other derived values ─────────────────────────────────────────────────
  const logoH       = logoSz === 'sm' ? 'h-8' : logoSz === 'lg' ? 'h-16' : 'h-12';
  const tblRowCls   = tableRowsStyle === 'grid' ? 'border border-slate-100' : tableRowsStyle === 'horizontal' ? 'border-b border-slate-100' : '';
  const titleSzCls  = titleSize === 'sm' ? 'text-xs' : titleSize === 'lg' ? 'text-xl' : 'text-base';
  const defaultTitleMap: Record<string, string> = { invoice: 'Factuur', quote: 'Offerte', payment: 'Betaling', credit: 'Creditnota' };
  const docLabel    = customTitlesMap[docType] ?? defaultTitleMap[docType] ?? (docType === 'quote' ? 'Offerte' : 'Factuur');
  const displayLabel = docTitleMode === 'uppercase' ? docLabel.toUpperCase() : docLabel;
  const docTitleCls = `${titleSzCls} font-black tracking-tight ${hdrHasBg ? 'text-white' : 'text-slate-900'}${docTitleMode === 'stamp' ? ' border-2 border-current px-2 py-0.5 inline-block' : ''}${docTitleMode === 'uppercase' ? ' uppercase tracking-widest' : ''}`;
  const docNumCls   = `font-mono text-xs mt-0.5 ${hdrHasBg ? 'text-white/60' : 'text-slate-400'}`;
  const fontClass   = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  const formatDate = (d: string) => {
    if (!d) return '—';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  };

  const ClientBlock = ({ align = 'right' }: { align?: 'left' | 'right' }) => (
    <div className={`${clientStyle === 'boxed' ? 'border border-slate-200 rounded px-4 py-3 min-w-[160px]' : ''} ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aan</p>
      {clientFieldsOrder.map(key => {
        if (showClientF[key] === false) return null;
        if (key === 'name')    return clientName    ? <p key="name"    className="font-bold text-slate-900 text-sm leading-tight">{clientName}</p>               : null;
        if (key === 'company') return clientCompany ? <p key="company" className="text-xs text-slate-500 font-medium mt-0.5">{clientCompany}</p>                 : null;
        if (key === 'address') return clientAddress ? <p key="address" className="text-xs text-slate-500 mt-0.5 leading-relaxed">{clientAddress}</p>             : null;
        if (key === 'phone')   return clientPhone   ? <p key="phone"   className="text-xs text-slate-400 mt-0.5">{clientPhone}</p>                               : null;
        if (key === 'email')   return clientEmail   ? <p key="email"   className="text-xs text-slate-400">{clientEmail}</p>                                      : null;
        if (key === 'vat')     return clientVAT     ? <p key="vat"     className="text-xs text-slate-400 mt-0.5">BTW: {clientVAT}</p>                            : null;
        return null;
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-950/90 backdrop-blur-sm flex flex-col">

      {/* ── Top bar ── */}
      <div className="no-print shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white">
            <Printer size={15} />
          </div>
          <div>
            <p className="text-sm font-black text-white">{displayLabel} — {docNumber}</p>
            <p className="text-[10px] text-white/40 font-medium">{clientName || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const blob = await pdf(
                  <DocPDF
                    docType={docType}
                    docNumber={docNumber}
                    date={date}
                    validUntil={validUntil}
                    clientName={clientName}
                    clientCompany={clientCompany}
                    clientAddress={clientAddress}
                    clientPhone={clientPhone}
                    clientEmail={clientEmail}
                    clientVAT={clientVAT}
                    companyName={companyName}
                    companyAddress={companyAddress}
                    companyPhone={companyPhone}
                    companyEmail={companyEmail}
                    rep={rep}
                    paidAmount={paidAmount}
                    currency={currency}
                    currencySymbol={currencySymbol}
                    items={items.map(i => {
                      const effectivePrice = i.price * (docType === 'invoice' ? (1 - (i.discount ?? 0) / 100) : 1);
                      return {
                        description: i.description,
                        qty: i.qty,
                        unit: i.unit || 'pcs',
                        houtsoort: i.houtsoort || undefined,
                        price: effectivePrice,
                        total: i.qty * effectivePrice * itemArea(i),
                      };
                    })}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                  />
                ).toBlob();
                const url = URL.createObjectURL(blob);
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
                window.open(url, '_blank');
              } catch (err) {
                alert('PDF generation failed. Please try again.');
                if (import.meta.env.DEV) console.error('PDF error:', err);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow"
          >
            <Download size={13} /> Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow"
          >
            <Printer size={13} /> Print
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            title="Sluiten"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable document area ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center px-4 py-8">

        <div
          id="pdf-document"
          className={`w-full max-w-[860px] bg-white shadow-2xl p-10 ${fontClass} text-sm text-slate-800 border border-slate-200`}
          style={{ minHeight: '1100px' }}
        >

          {/* ── HEADER ── */}
          {headerStyle === 'split' ? (
            <div className={hdrPadding} style={hdrBgStyle}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  {companyLogo && (
                    <img
                      src={companyLogo}
                      alt={companyName}
                      className={`${logoH} w-auto object-contain${hdrHasBg ? ' brightness-0 invert' : ''}`}
                      style={{ maxWidth: '160px' }}
                    />
                  )}
                  <div>
                    {companyFieldsOrder.map(key => {
                      if (key === 'name')    return showF.name !== false    ? <p key="name"    className={`font-black text-base leading-tight ${hdrTextMain}`}>{companyName}</p> : null;
                      if (key === 'address') return showF.address !== false && companyAddress ? <p key="address" className={`text-xs mt-1 leading-relaxed ${hdrTextSub}`}>{companyAddress}</p> : null;
                      if (key === 'phone')   return showF.phone !== false   && companyPhone   ? <p key="phone"   className={`text-xs ${hdrTextSub}`}>{companyPhone}</p> : null;
                      if (key === 'email')   return showF.email !== false   && companyEmail   ? <p key="email"   className={`text-xs ${hdrTextSub}`}>{companyEmail}</p> : null;
                      if (key === 'btw')     return showF.btw !== false     && companyBTW     ? <p key="btw"     className={`text-xs ${hdrTextMuted}`}>BTW: {companyBTW}</p> : null;
                      if (key === 'kkf')     return showF.kkf !== false     && companyKKF     ? <p key="kkf"     className={`text-xs ${hdrTextMuted}`}>KKF: {companyKKF}</p> : null;
                      return null;
                    })}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={docTitleCls}>{displayLabel}</p>
                  <p className={docNumCls}>{docNumber}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${hdrPadding} text-center`} style={hdrBgStyle}>
              {companyLogo && (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className={`${logoH} w-auto object-contain mx-auto mb-2${hdrHasBg ? ' brightness-0 invert' : ''}`}
                  style={{ maxWidth: '160px' }}
                />
              )}
              {companyFieldsOrder.map(key => {
                if (key === 'name')    return showF.name !== false    ? <p key="name"    className={`font-black text-lg ${hdrTextMain}`}>{companyName}</p> : null;
                if (key === 'address') return showF.address !== false && companyAddress ? <p key="address" className={`text-xs mt-0.5 ${hdrTextSub}`}>{companyAddress}</p> : null;
                if (key === 'phone')   return showF.phone !== false   && companyPhone   ? <p key="phone"   className={`text-xs mt-0.5 ${hdrTextMuted}`}>{companyPhone}</p> : null;
                if (key === 'email')   return showF.email !== false   && companyEmail   ? <p key="email"   className={`text-xs mt-0.5 ${hdrTextMuted}`}>{companyEmail}</p> : null;
                if (key === 'btw')     return showF.btw !== false     && companyBTW     ? <p key="btw"     className={`text-xs mt-0.5 ${hdrTextMuted}`}>BTW: {companyBTW}</p> : null;
                if (key === 'kkf')     return showF.kkf !== false     && companyKKF     ? <p key="kkf"     className={`text-xs mt-0.5 ${hdrTextMuted}`}>KKF: {companyKKF}</p> : null;
                return null;
              })}
              <p className={`mt-4 ${docTitleCls}`}>{displayLabel}</p>
              <p className={docNumCls}>{docNumber}</p>
            </div>
          )}

          {/* ── META ROW ── */}
          {(() => {
            const metaValues: Record<string, React.ReactNode> = {
              datum:       <><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Datum</p><p className="font-bold text-slate-900 text-sm">{formatDate(date)}</p></>,
              nr:          <><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">#</p><p className="font-bold text-slate-900 text-sm">{docNumber}</p></>,
              termijn:     docType === 'quote'
                ? <><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Geldig tot</p><p className="font-bold text-slate-900 text-sm">{validUntil ? formatDate(validUntil) : '—'}</p></>
                : <><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Betaaltermijn</p><p className="font-bold text-slate-900 text-sm">30 dagen</p></>,
              vervaldatum: <><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Vervaldatum</p><p className="font-bold text-slate-900 text-sm">{validUntil ? formatDate(validUntil) : '—'}</p></>,
              rep:         <><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rep</p><p className="font-bold text-slate-900 text-sm">{rep || '—'}</p></>,
              project:     <><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Project</p><p className="font-bold text-slate-900 text-sm">—</p></>,
            };
            const visibleMeta = metaColsOrder.filter(k => showMetaCols[k] !== false);
            return (
              <div className={`flex${clientPos === 'below' ? '' : ' justify-between'} items-start mb-6 pb-5 border-b border-slate-200`}>
                {clientPos === 'left' && <ClientBlock align="left" />}
                <div className="flex gap-8">
                  {visibleMeta.map(key => <div key={key}>{metaValues[key]}</div>)}
                </div>
                {clientPos === 'right' && <ClientBlock align="right" />}
              </div>
            );
          })()}
          {clientPos === 'below' && <div className="mb-6"><ClientBlock align="left" /></div>}

          {/* ── LINE ITEMS TABLE ── */}
          {(() => {
            type ColDef = { label: string; align: 'left'|'center'|'right'; width?: string; cell: (item: ModalLineItem, idx: number, area: number, lineTotal: number) => React.ReactNode };
            const allCols: Record<string, ColDef> = {
              omschrijving: { label: 'Omschrijving', align: 'left',   cell: (item) => <span className="font-medium">{item.description || '—'}</span> },
              afmeting:     { label: 'Afmeting',     align: 'center', width: '90px', cell: (item) => item.mmW && item.mmH ? `${item.mmW}×${item.mmH}` : '—' },
              qty:          { label: 'Aantal',        align: 'right',  width: '40px', cell: (item) => <span className="font-bold">{item.qty}</span> },
              eenheid:      { label: 'Eenh.',         align: 'center', width: '40px', cell: (item) => <span className="text-slate-500">{item.unit}</span> },
              houtsoort:    { label: 'Houtsoort',     align: 'left',   width: '80px', cell: (item) => <span className="text-slate-600">{item.houtsoort || '—'}</span> },
              prijs:        { label: 'Prijs',         align: 'right',  width: '72px', cell: (item) => `${currencySymbol}${item.price.toFixed(2)}` },
              totaal:       { label: 'Totaal',        align: 'right',  width: '72px', cell: (_item, _idx, _area, lineTotal) => <span className="font-black">{currencySymbol}{lineTotal.toFixed(2)}</span> },
            };
            const visCols = tableColsOrder.filter(k => showTableCols[k] !== false && allCols[k]);
            const visColCount = visCols.length + 1; // +1 for # column
            return (
              <table className="w-full mb-6 border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-2 text-[9px] uppercase tracking-widest font-black" style={{ ...tblHdrStyle, width: '24px' }}>#</th>
                    {visCols.map(key => (
                      <th key={key} className={`text-${allCols[key].align} py-2 px-2 text-[9px] uppercase tracking-widest font-black`} style={{ ...tblHdrStyle, ...(allCols[key].width ? { width: allCols[key].width } : {}) }}>
                        {allCols[key].label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const area = itemArea(item);
                    const discountFactor = docType === 'invoice' ? (1 - (item.discount ?? 0) / 100) : 1;
                    const lineTotal = item.qty * item.price * area * discountFactor;
                    return (
                      <React.Fragment key={item.id}>
                        <tr className={tblRowCls}>
                          <td className="py-2.5 px-2 text-slate-400">{idx + 1}</td>
                          {visCols.map(key => (
                            <td key={key} className={`py-2.5 px-2 text-${allCols[key].align}`}>
                              {allCols[key].cell(item, idx, area, lineTotal)}
                            </td>
                          ))}
                        </tr>
                        {item.unit === 'm²' && item.mmW && item.mmH && !visCols.includes('afmeting') && (
                          <tr key={`${item.id}-dim`}>
                            <td />
                            <td colSpan={visColCount - 1} className="pb-2 pt-0 px-2 text-[9px] text-slate-400 italic">
                              Afmeting: {item.mmW} × {item.mmH} mm = {area.toFixed(4)} m²
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}

          {/* ── TOTALS ── */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm border-t border-slate-200">
                <span className="text-slate-500 font-medium">Subtotaal</span>
                <span className="font-bold">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm border-b border-slate-100">
                <span className="text-slate-500 font-medium">BTW (21%)</span>
                <span className="font-bold">{currencySymbol}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-slate-900">
                <span className="font-black text-slate-900 text-base">TOTAAL</span>
                <span className="font-black text-slate-900 text-base">{currencySymbol}{total.toFixed(2)}</span>
              </div>
              {paidAmount != null && paidAmount > 0 && (
                <>
                  <div className="flex justify-between py-2 text-sm border-t border-slate-100">
                    <span className="text-emerald-600 font-medium">Betaald</span>
                    <span className="font-bold text-emerald-600">− {currencySymbol}{paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-brand-primary">
                    <span className="font-black text-brand-primary text-base">SALDO</span>
                    <span className="font-black text-brand-primary text-base">{currencySymbol}{Math.max(0, total - paidAmount).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── FOOTER ── */}
          {(bankDetails || legalDisclaimer) && (
            <div className="border-t border-slate-200 pt-5 mt-4 grid grid-cols-2 gap-6 text-[10px] text-slate-500">
              {bankDetails && (
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Betalingsgegevens</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{bankDetails}</p>
                </div>
              )}
              {legalDisclaimer && (
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Voorwaarden</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{legalDisclaimer}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DocPDFModal;
