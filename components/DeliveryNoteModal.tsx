import React, { useContext, useState } from 'react';
import { X, Truck, Printer } from 'lucide-react';
import { LanguageContext } from '../lib/context';

interface DeliveryNoteModalProps {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientCompany?: string;
  clientAddress?: string;
  items: Array<{ description: string; qty: number; unit: string; spec?: string }>;
  onClose: () => void;
}

const DeliveryNoteModal: React.FC<DeliveryNoteModalProps> = ({
  invoiceNumber,
  date,
  clientName,
  clientCompany,
  clientAddress,
  items,
  onClose,
}) => {
  const { companyName, companyLogo, companyAddress, companyPhone, companyEmail } = useContext(LanguageContext);
  const [deliveryLocation, setDeliveryLocation] = useState('');

  const fmtDate = (s: string) => {
    if (!s) return '—';
    const p = s.split('-');
    return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : s;
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #delivery-note-body, #delivery-note-body * { visibility: visible !important; }
          #delivery-note-body {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 20mm 15mm !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          .delivery-location-input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            outline: none !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        @media screen {
          .delivery-print-root { display: flex; }
        }
      `}</style>

      {/* Overlay */}
      <div className="delivery-print-root fixed inset-0 z-50 items-end sm:items-center justify-center bg-black/60 p-4">
        {/* Modal card */}
        <div className="bg-white rounded-[24px] w-full max-w-[800px] max-h-[95vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">

          {/* Modal header (no-print) */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                <Truck size={15} className="text-white" />
              </div>
              <span className="font-black text-slate-900 text-sm uppercase tracking-widest">Afleverbon</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
              >
                <Printer size={13} /> Print
              </button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable document body */}
          <div id="delivery-note-body" className="p-10 font-sans text-slate-900">

            {/* ── HEADER ── */}
            <div className="flex items-start justify-between pb-6 mb-6 border-b-2 border-slate-900">
              <div className="flex items-start gap-4">
                {companyLogo && (
                  <img src={companyLogo} className="h-12 w-auto object-contain" alt="Logo" />
                )}
                <div>
                  <p className="font-black text-base text-slate-900 leading-tight">{companyName}</p>
                  {companyAddress && <p className="text-xs text-slate-500 mt-1 uppercase leading-relaxed">{companyAddress}</p>}
                  {companyPhone && <p className="text-xs text-slate-500">{companyPhone}</p>}
                  {companyEmail && <p className="text-xs text-slate-500">{companyEmail}</p>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-3xl tracking-tight text-slate-900 uppercase">Afleverbon</p>
                <p className="font-mono text-sm text-slate-600 mt-1">{invoiceNumber}</p>
                <p className="text-xs text-slate-500 mt-0.5">{fmtDate(date)}</p>
              </div>
            </div>

            {/* ── CLIENT BLOCK ── */}
            <div className="mb-8 grid grid-cols-2 gap-8">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Deliver to</p>
                <p className="font-bold text-sm text-slate-900">{clientName}</p>
                {clientCompany && <p className="text-sm text-slate-600">{clientCompany}</p>}
                {clientAddress && <p className="text-xs text-slate-500 mt-0.5 uppercase leading-relaxed">{clientAddress}</p>}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Location</p>
                <input
                  className="delivery-location-input w-full text-sm font-bold text-slate-900 border-b-2 border-slate-300 focus:border-slate-900 outline-none bg-slate-50 px-2 py-1.5 rounded-t transition-colors no-print"
                  placeholder="Enter delivery address..."
                  value={deliveryLocation}
                  onChange={e => setDeliveryLocation(e.target.value)}
                />
                {/* Print version: show as plain text with underline */}
                <p className="hidden text-sm font-bold text-slate-900 border-b-2 border-slate-300 pb-1 min-h-[28px]" style={{ display: 'none' }}>
                  {deliveryLocation || ' '}
                </p>
              </div>
            </div>

            {/* ── ITEMS TABLE ── */}
            <table className="w-full border-collapse text-xs mb-10">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white">Description</th>
                  <th className="text-center py-3 px-4 text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white w-20">Qty</th>
                  <th className="text-center py-3 px-4 text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white w-20">Unit</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-3 px-4 border-b border-slate-100 font-medium text-slate-800">
                      {item.description}
                      {item.spec && <span className="text-slate-400 font-normal ml-1.5">{item.spec}mm</span>}
                    </td>
                    <td className="py-3 px-4 border-b border-slate-100 text-center font-black text-slate-900">{item.qty}</td>
                    <td className="py-3 px-4 border-b border-slate-100 text-center text-slate-500 font-medium">{item.unit}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 text-xs">No items</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ── SIGNATURE BLOCKS ── */}
            <div className="grid grid-cols-2 gap-10 mt-8 pt-6 border-t border-slate-200">
              {/* Left: Afgeleverd door */}
              <div className="space-y-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivered by</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-8">Name</p>
                    <div className="border-b-2 border-slate-300 w-full" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-8">Signature</p>
                    <div className="border-b-2 border-slate-300 w-full" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date</p>
                    <div className="border-b-2 border-slate-300 w-full" />
                  </div>
                </div>
              </div>

              {/* Right: Ontvangen / Afgehandeld */}
              <div className="space-y-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Received / Acknowledged</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-8">Name</p>
                    <div className="border-b-2 border-slate-300 w-full" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-8">Signature</p>
                    <div className="border-b-2 border-slate-300 w-full" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date</p>
                    <div className="border-b-2 border-slate-300 w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── FOOTER NOTE ── */}
            <p className="text-[9px] text-slate-400 text-center mt-10 pt-4 border-t border-slate-100">
              This document must be signed upon receipt of goods. — {companyName}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeliveryNoteModal;
