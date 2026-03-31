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
  taxRate?: number;
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
  const fontFamily      = localStorage.getItem('erp_doc_font_family') ?? 'sans';
  const bankDetails     = localStorage.getItem('erp_bank_details') ?? '';
  const legalDisclaimer = localStorage.getItem('erp_legal_disclaimer') ?? '';
  const accentColor     = localStorage.getItem('erp_doc_accent_color') ?? '#8B1D2A';
  const logoSz          = (localStorage.getItem('erp_doc_logo_size') ?? 'md') as 'sm' | 'md' | 'lg';
  const tableRowsStyle  = (localStorage.getItem('erp_doc_table_rows') ?? 'horizontal') as 'horizontal' | 'grid' | 'none';
  const docTitleMode    = (localStorage.getItem('erp_doc_title_style') ?? 'normal') as 'normal' | 'uppercase' | 'stamp';

  const showF: Record<string, boolean> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_show_fields') ?? '{}'); } catch { return {}; }
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
  const tableColsOrder: string[] = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_table_cols_order') ?? '["omschrijving","afmeting","qty","eenheid","houtsoort","prijs","subtotaal","btw","totaal"]'); }
    catch { return ['omschrijving', 'afmeting', 'qty', 'eenheid', 'houtsoort', 'prijs', 'subtotaal', 'btw', 'totaal']; }
  })();
  const showTableCols: Record<string, boolean> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_show_table_cols') ?? '{}'); } catch { return {}; }
  })();
  const customTitlesMap: Record<string, string> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_doc_custom_titles') ?? '{}'); } catch { return {}; }
  })();

  // ── Derived values ───────────────────────────────────────────────────────
  const logoH     = logoSz === 'sm' ? 'h-8' : logoSz === 'lg' ? 'h-16' : 'h-12';
  const tblRowCls = tableRowsStyle === 'grid' ? 'border border-slate-100' : tableRowsStyle === 'horizontal' ? 'border-b border-slate-100' : '';
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  const defaultTitleMap: Record<string, string> = { invoice: 'Invoice', quote: 'Estimate', payment: 'Payment', credit: 'Credit Note' };
  const docLabel     = customTitlesMap[docType] ?? defaultTitleMap[docType] ?? (docType === 'quote' ? 'Offerte' : 'Factuur');
  const displayLabel = docTitleMode === 'uppercase' ? docLabel.toUpperCase() : docLabel;

  const formatDate = (d: string) => {
    if (!d) return '—';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  };

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
                    companyLogo={companyLogo || undefined}
                    rep={rep}
                    paidAmount={paidAmount}
                    currency={currency}
                    currencySymbol={currencySymbol}
                    items={items.map(i => {
                      const effectivePrice = i.price * (docType === 'invoice' ? (1 - (i.discount ?? 0) / 100) : 1);
                      const itemSub = i.qty * effectivePrice * itemArea(i);
                      const itemTax = i.taxRate ?? 10;
                      return {
                        description: i.description,
                        qty: i.qty,
                        unit: i.unit || 'pcs',
                        houtsoort: i.houtsoort || undefined,
                        price: effectivePrice,
                        subtotal: itemSub,
                        total: itemSub * (1 + itemTax / 100),
                        taxRate: itemTax,
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

          {/* ── HEADER: company left | title right ── */}
          <div className="flex items-start justify-between gap-6 pb-6 mb-6 border-b border-slate-200">

            {/* LEFT: logo + company fields */}
            <div className="flex items-start gap-4">
              {companyLogo && (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className={`${logoH} w-auto object-contain`}
                  style={{ maxWidth: '140px' }}
                />
              )}
              <div>
                {companyFieldsOrder.map(key => {
                  if (key === 'name')    return showF.name !== false    ? <p key="name"    className="font-black text-base text-slate-900 leading-tight">{companyName}</p> : null;
                  if (key === 'address') return showF.address !== false && companyAddress ? <p key="address" className="text-xs text-slate-500 mt-1 leading-relaxed uppercase">{companyAddress}</p> : null;
                  if (key === 'phone')   return showF.phone !== false   && companyPhone   ? <p key="phone"   className="text-xs text-slate-500">{companyPhone}</p> : null;
                  if (key === 'email')   return showF.email !== false   && companyEmail   ? <p key="email"   className="text-xs text-slate-500">{companyEmail}</p> : null;
                  if (key === 'btw')     return showF.btw !== false     && companyBTW     ? <p key="btw"     className="text-xs text-slate-400">BTW: {companyBTW}</p> : null;
                  if (key === 'kkf')     return showF.kkf !== false     && companyKKF     ? <p key="kkf"     className="text-xs text-slate-400">KKF: {companyKKF}</p> : null;
                  return null;
                })}
              </div>
            </div>

            {/* RIGHT: document title + meta */}
            <div className="text-right shrink-0">
              <p
                className={`font-black leading-none${docTitleMode === 'uppercase' ? ' uppercase tracking-widest' : ' italic'}${docTitleMode === 'stamp' ? ' border-2 border-current px-3 py-1 inline-block' : ''}`}
                style={{ fontSize: '2.4rem', color: accentColor }}
              >
                {displayLabel}
              </p>
              <p className="font-mono text-sm text-slate-600 mt-2">{docNumber}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(date)}</p>
              {validUntil && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {docType === 'quote' ? 'GELDIG T/M ' : 'VERVALDATUM '}{formatDate(validUntil)}
                </p>
              )}
              {docType === 'invoice' && !validUntil && (
                <p className="text-xs text-slate-500 mt-0.5">Payment term: 30 days</p>
              )}
            </div>
          </div>

          {/* ── CLIENT BLOCK (AAN) ── */}
          <div className="mb-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Aan</p>
            {clientFieldsOrder.map(key => {
              if (showClientF[key] === false) return null;
              if (key === 'name')    return clientName    ? <p key="name"    className="font-bold text-slate-900 text-sm leading-tight">{clientName}</p>                  : null;
              if (key === 'company') return clientCompany ? <p key="company" className="text-sm text-slate-600 font-medium">{clientCompany}</p>                          : null;
              if (key === 'address') return clientAddress ? <p key="address" className="text-xs text-slate-500 mt-0.5 uppercase leading-relaxed">{clientAddress}</p>     : null;
              if (key === 'phone')   return clientPhone   ? <p key="phone"   className="text-xs text-slate-500 mt-0.5">{clientPhone}</p>                                  : null;
              if (key === 'email')   return clientEmail   ? <p key="email"   className="text-xs text-slate-500">{clientEmail}</p>                                         : null;
              if (key === 'vat')     return clientVAT     ? <p key="vat"     className="text-xs text-slate-400 mt-0.5">BTW: {clientVAT}</p>                               : null;
              return null;
            })}
          </div>

          {/* ── META ROW TABLE ── */}
          <table className="w-full border-collapse border border-slate-200 mb-6 text-xs">
            <thead>
              <tr>
                <th className="border border-slate-200 py-1.5 px-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">Date</th>
                <th className="border border-slate-200 py-1.5 px-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">{docType === 'invoice' ? 'Invoice #' : 'Estimate #'}</th>
                <th className="border border-slate-200 py-1.5 px-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">Terms</th>
                <th className="border border-slate-200 py-1.5 px-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">Due Date</th>
                <th className="border border-slate-200 py-1.5 px-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">Rep</th>
                <th className="border border-slate-200 py-1.5 px-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">Project</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 py-1.5 px-3 font-bold">{formatDate(date)}</td>
                <td className="border border-slate-200 py-1.5 px-3 font-bold">{docNumber}</td>
                <td className="border border-slate-200 py-1.5 px-3 font-bold">COD</td>
                <td className="border border-slate-200 py-1.5 px-3 font-bold">{validUntil ? formatDate(validUntil) : '—'}</td>
                <td className="border border-slate-200 py-1.5 px-3 font-bold">{rep || '—'}</td>
                <td className="border border-slate-200 py-1.5 px-3 font-bold">—</td>
              </tr>
            </tbody>
          </table>

          {/* ── LINE ITEMS TABLE ── */}
          {(() => {
            type ColDef = { label: string; align: 'left' | 'center' | 'right'; width?: string; cell: (item: ModalLineItem, idx: number, area: number, lineTotal: number) => React.ReactNode };
            const allCols: Record<string, ColDef> = {
              omschrijving: { label: 'Omschrijving', align: 'left',   cell: (item) => <span className="font-medium">{item.description || '—'}</span> },
              afmeting:     { label: 'Afmeting',     align: 'center', width: '90px', cell: (item) => item.mmW && item.mmH ? `${item.mmW}×${item.mmH}` : '—' },
              qty:          { label: 'Qty',          align: 'right',  width: '48px', cell: (item) => <span className="font-bold">{item.qty}</span> },
              eenheid:      { label: 'U/M',          align: 'center', width: '44px', cell: (item) => <span className="text-slate-500">{item.unit}</span> },
              houtsoort:    { label: 'Wood',         align: 'left',   width: '80px', cell: (item) => <span className="text-slate-600">{item.houtsoort || '—'}</span> },
              prijs:        { label: 'Rate',         align: 'right',  width: '72px', cell: (item) => `${currencySymbol}${item.price.toFixed(2)}` },
              subtotaal:    { label: 'Subtotal',     align: 'right',  width: '80px', cell: (_item, _idx, _area, lineTotal) => `${currencySymbol}${lineTotal.toFixed(2)}` },
              btw:          { label: 'BTW%',         align: 'center', width: '48px', cell: (item) => `${item.taxRate ?? 10}%` },
              totaal:       { label: 'Amount',       align: 'right',  width: '80px', cell: (item, _idx, _area, lineTotal) => <span className="font-black">{currencySymbol}{(lineTotal * (1 + (item.taxRate ?? 10) / 100)).toFixed(2)}</span> },
            };
            const visCols = tableColsOrder.filter(k => showTableCols[k] !== false && allCols[k]);
            const visColCount = visCols.length + 1;
            return (
              <table className="w-full mb-6 border-collapse text-xs mt-4">
                <thead>
                  <tr>
                    {visCols.map(key => (
                      <th
                        key={key}
                        className={`text-${allCols[key].align} py-2.5 px-3 text-[9px] uppercase tracking-widest font-black text-white`}
                        style={{ backgroundColor: accentColor, ...(allCols[key].width ? { width: allCols[key].width } : {}) }}
                      >
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
                          {visCols.map(key => (
                            <td key={key} className={`py-2.5 px-3 text-${allCols[key].align}`}>
                              {allCols[key].cell(item, idx, area, lineTotal)}
                            </td>
                          ))}
                        </tr>
                        {item.unit === 'm²' && item.mmW && item.mmH && !visCols.includes('afmeting') && (
                          <tr key={`${item.id}-dim`}>
                            <td colSpan={visColCount} className="pb-2 pt-0 px-3 text-[9px] text-slate-400 italic">
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
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm border-b border-slate-100">
                <span className="text-slate-500 font-medium">BTW</span>
                <span className="font-bold">{currencySymbol}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2" style={{ borderColor: accentColor }}>
                <span className="font-black text-base" style={{ color: accentColor }}>TOTAL ({currency})</span>
                <span className="font-black text-base" style={{ color: accentColor }}>{currencySymbol}{total.toFixed(2)}</span>
              </div>
              {paidAmount != null && paidAmount > 0 && (
                <>
                  <div className="flex justify-between py-2 text-sm border-t border-slate-100">
                    <span className="text-emerald-600 font-medium">Paid</span>
                    <span className="font-bold text-emerald-600">− {currencySymbol}{paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-slate-900">
                    <span className="font-black text-slate-900 text-base">BALANCE</span>
                    <span className="font-black text-slate-900 text-base">{currencySymbol}{Math.max(0, total - paidAmount).toFixed(2)}</span>
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
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Details</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{bankDetails}</p>
                </div>
              )}
              {legalDisclaimer && (
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Terms & Conditions</p>
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
