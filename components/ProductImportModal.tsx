import React, { useRef, useState } from 'react';
import { X, Upload, Download, CheckCircle2, AlertCircle, Loader2, Package } from 'lucide-react';
import { useCreateProduct } from '../lib/hooks/useProducts';

interface ParsedRow {
  name: string;
  woodType: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  stock: number;
  sku: string;
  valid: boolean;
  error?: string;
}

interface ProductImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

const SAMPLE_CSV = `name,wood_type,category,unit,price_per_unit,stock,sku
Enkele Deur,Teak,Doors,m²,720,10,DOOR-001
Deurkozijn,,Frames,lm,110,25,FRM-001
Raamkozijn,,Window Frames,m,85,15,WF-001
Plint 70mm,,Mouldings,lm,45,50,MOLD-001`;

const COL_MAP: Record<string, keyof ParsedRow> = {
  name: 'name',
  wood_type: 'woodType',
  woodtype: 'woodType',
  category: 'category',
  unit: 'unit',
  price_per_unit: 'pricePerUnit',
  pricerperunit: 'pricePerUnit',
  price: 'pricePerUnit',
  stock: 'stock',
  sku: 'sku',
};

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => { raw[h] = (vals[i] ?? '').trim(); });

    const row: ParsedRow = {
      name: '', woodType: '', category: '', unit: 'pcs',
      pricePerUnit: 0, stock: 0, sku: '', valid: true,
    };

    Object.entries(raw).forEach(([col, val]) => {
      const field = COL_MAP[col];
      if (!field) return;
      if (field === 'pricePerUnit' || field === 'stock') {
        const n = parseFloat(val);
        if (val !== '' && isNaN(n)) {
          row.valid = false;
          row.error = `Invalid number in column "${col}"`;
        } else {
          (row as any)[field] = isNaN(n) ? 0 : n;
        }
      } else {
        (row as any)[field] = val;
      }
    });

    if (!row.name) {
      row.valid = false;
      row.error = row.error ?? 'Naam verplicht';
    }
    return row;
  }).filter(r => r.name || r.sku);
}

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ramzon_products_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const ProductImportModal: React.FC<ProductImportModalProps> = ({ onClose, onImported }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const createProduct = useCreateProduct();

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Only .csv files are supported.');
      return;
    }
    setFileError('');
    const reader = new FileReader();
    reader.onload = e => {
      const parsed = parseCSV(e.target?.result as string);
      setRows(parsed);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const validRows = rows.filter(r => r.valid);

  const handleImport = async () => {
    if (!validRows.length) return;
    setImporting(true);
    setProgress(0);
    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      await new Promise<void>(resolve => {
        createProduct.mutate({
          name: r.name,
          woodType: r.woodType,
          category: r.category,
          unit: r.unit || 'pcs',
          pricePerUnit: r.pricePerUnit,
          stock: r.stock,
          sku: r.sku,
        }, { onSuccess: () => resolve(), onError: () => resolve() });
      });
      setProgress(i + 1);
    }
    setImporting(false);
    setStep('done');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
              <Package size={15} className="text-white" />
            </div>
            <span className="font-black text-slate-900 text-sm uppercase tracking-widest">Import Products</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── STEP: UPLOAD ── */}
          {step === 'upload' && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); setFileError(''); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-slate-50'}`}
              >
                <Upload size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="font-black text-slate-700 text-sm">Sleep een CSV-bestand hierheen</p>
                <p className="text-xs text-slate-400 mt-1">of klik om een bestand te kiezen</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              {fileError && (
                <p className="text-xs font-bold text-red-500">{fileError}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Gebruik de exacte kolomnamen uit het voorbeeldbestand.</span>
                <button
                  onClick={e => { e.stopPropagation(); downloadSample(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-all"
                >
                  <Download size={13} /> Download sample CSV
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 text-[10px] text-slate-500 font-mono leading-relaxed">
                <p className="font-black text-slate-400 uppercase tracking-widest mb-2 text-[9px]">Beschikbare kolommen</p>
                <span className="text-slate-700 font-bold">name</span> · wood_type · category · unit · price_per_unit · stock · sku
                <p className="mt-2 text-slate-400 not-italic font-sans text-[9px]">Categorieën: Doors · Mouldings · Frames · Window Frames · Crating</p>
                <p className="text-slate-400 not-italic font-sans text-[9px]">Eenheden: pcs · m² · lm · m · m³</p>
              </div>
            </>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === 'preview' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-slate-700">
                  {rows.length} rijen gevonden · <span className="text-emerald-600">{validRows.length} geldig</span>
                  {rows.length - validRows.length > 0 && (
                    <span className="text-red-500 ml-1">· {rows.length - validRows.length} overgeslagen</span>
                  )}
                </p>
                <button
                  onClick={() => { setRows([]); setStep('upload'); }}
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold underline"
                >
                  Ander bestand
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl max-h-72 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2.5 font-black text-slate-400 uppercase tracking-widest text-[9px]"></th>
                      <th className="px-3 py-2.5 font-black text-slate-400 uppercase tracking-widest text-[9px]">Naam</th>
                      <th className="px-3 py-2.5 font-black text-slate-400 uppercase tracking-widest text-[9px]">Categorie</th>
                      <th className="px-3 py-2.5 font-black text-slate-400 uppercase tracking-widest text-[9px]">Eenheid</th>
                      <th className="px-3 py-2.5 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Prijs</th>
                      <th className="px-3 py-2.5 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((r, i) => (
                      <tr key={i} className={r.valid ? 'hover:bg-slate-50' : 'bg-red-50'}>
                        <td className="px-3 py-2">
                          {r.valid
                            ? <CheckCircle2 size={13} className="text-emerald-500" />
                            : <AlertCircle size={13} className="text-red-400" aria-label={r.error} />}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {r.name || '—'}
                          {r.woodType && <span className="text-slate-400 ml-1 font-normal">· {r.woodType}</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{r.category || '—'}</td>
                        <td className="px-3 py-2 text-slate-500">{r.unit}</td>
                        <td className="px-3 py-2 text-slate-700 text-right font-bold">{r.pricePerUnit.toFixed(2)}</td>
                        <td className="px-3 py-2 text-slate-500 text-right">{r.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Importeren…</span>
                    <span>{progress}/{validRows.length}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all duration-300"
                      style={{ width: `${(progress / validRows.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-40"
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Import {validRows.length} product{validRows.length !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg">Import voltooid!</p>
                <p className="text-sm text-slate-500 mt-1">{progress} product{progress !== 1 ? 'en' : ''} toegevoegd aan de catalogus.</p>
              </div>
              <button
                onClick={onImported}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Sluiten
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductImportModal;
