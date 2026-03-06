import React, { useState, useRef, useContext } from 'react';
import { ArrowLeft, Wallet, Tag, DollarSign, Calendar, Save, Trash2, Paperclip, X, FileText, Image, Link2, ExternalLink, Store, AlertTriangle, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../lib/context';

interface Attachment {
  name: string;
  size: string;
  type: 'image' | 'pdf' | 'link';
  url: string;
  preview?: string;
}

const CreateExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState('');

  const handleNav = (path: string) => {
    if (isDirty) {
      setPendingNav(path);
      setShowDraftPrompt(true);
    } else {
      navigate(path);
    }
  };

  const handleVendorChange = (value: string) => {
    if (value === '__new__') {
      navigate('/expenses/vendors');
      return;
    }
    setSelectedVendor(value);
    setIsDirty(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => processFile(file));
    e.target.value = '';
  };

  const processFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      const sizeKB = (file.size / 1024).toFixed(0);
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      setAttachments(prev => [...prev, {
        name: file.name,
        size: file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`,
        type: isImage ? 'image' : 'pdf',
        url,
        preview: isImage ? url : undefined,
      }]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach((file) => processFile(file as File));
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    const url = linkInput.startsWith('http') ? linkInput : `https://${linkInput}`;
    setAttachments(prev => [...prev, {
      name: url.replace(/^https?:\/\//, '').slice(0, 40),
      size: '',
      type: 'link',
      url,
    }]);
    setLinkInput('');
    setShowLinkInput(false);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Unsaved changes prompt */}
      {showDraftPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowDraftPrompt(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl z-10 p-8 max-w-sm w-full space-y-5 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="font-black text-slate-900">{t('unsavedChanges')}</p>
                <p className="text-xs text-slate-400 font-medium">{t('unsavedChangesMsg')}</p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { setShowDraftPrompt(false); if (pendingNav) navigate(pendingNav); }}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                {t('discardChanges')}
              </button>
              <button
                onClick={() => setShowDraftPrompt(false)}
                className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                {t('continueEditing')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => handleNav('/expenses')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold">
          <ArrowLeft size={18} /> Back to Expenses
        </button>
        <button className="bg-red-600 text-white px-8 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-red-100 active:scale-95 transition-all flex items-center gap-2">
          <Save size={16} /> Log Expense
        </button>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
             <Wallet size={28} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">Record New Expense</h2>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cost Tracking</p>
           </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={12} /> Amount (€)
                </label>
                <input aria-label="Bedrag" type="number" placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black outline-none focus:bg-white transition-all shadow-inner" />
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Date
                </label>
                <input aria-label="Datum" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Tag size={12} /> Category
             </label>
             <select aria-label="Categorie" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
               <option>Inventory / Wood Stock</option>
               <option>Logistics & Shipping</option>
               <option>Rent & Utilities</option>
               <option>Marketing</option>
               <option>Tools & Machinery</option>
             </select>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Store size={12} /> {t('vendor')}
             </label>
             <select
               aria-label="Vendor"
               value={selectedVendor}
               onChange={e => handleVendorChange(e.target.value)}
               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white transition-all"
             >
               <option value="">— Select vendor —</option>
               <option>Build-It Ltd</option>
               <option>Miller Furniture</option>
               <option>Abhelak Constructions</option>
               <option>Jiawan Interiors</option>
               <option>Brandstof Suriname</option>
               <option>Tropical Timber Co.</option>
               <option>Local Market</option>
               <option disabled>──────────────</option>
               <option value="__new__">＋ {t('newVendor')}</option>
             </select>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               Description
             </label>
             <input aria-label="Beschrijving" type="text" placeholder="e.g. Fuel for truck #02" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
          </div>

          {/* Attachment Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Paperclip size={12} /> Attachment (Optioneel)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkInput(!showLinkInput)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 hover:bg-slate-100 transition-all"
                >
                  <Link2 size={11} /> Link
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 hover:bg-slate-100 transition-all"
                >
                  <Paperclip size={11} /> Upload
                </button>
              </div>
            </div>

            {/* Link Input */}
            {showLinkInput && (
              <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
                <input
                  aria-label="Link URL"
                  type="url"
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                  placeholder="https://drive.google.com/... of invoice url"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-300"
                  autoFocus
                />
                <button onClick={handleAddLink} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all">
                  Toevoegen
                </button>
                <button title="Close" onClick={() => setShowLinkInput(false)} className="px-3 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-black hover:bg-slate-200 transition-all">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                dragOver 
                  ? 'border-blue-400 bg-blue-50 scale-[1.01]' 
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              <div className="flex gap-3 text-slate-300">
                <FileText size={24} />
                <Image size={24} />
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Klik of sleep een PDF / afbeelding hier</p>
              <p className="text-[10px] text-slate-300 font-medium">PNG, JPG, PDF • max 10MB</p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
              aria-label="Bestand uploaden"
            />

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{attachments.length} bijlage(n)</p>
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl group hover:border-slate-300 transition-all shadow-sm">
                    {/* Preview or Icon */}
                    {att.type === 'image' && att.preview ? (
                      <img src={att.preview} alt={att.name} className="w-10 h-10 object-cover rounded-lg border border-slate-100" />
                    ) : att.type === 'pdf' ? (
                      <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-red-500" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Link2 size={18} className="text-blue-500" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{att.name}</p>
                      {att.size && <p className="text-[9px] text-slate-400 font-bold uppercase">{att.size} • {att.type.toUpperCase()}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Openen"
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        title="Verwijder bijlage"
                        onClick={() => removeAttachment(idx)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50 flex items-center gap-4">
           <button
             onClick={() => handleNav('/expenses')}
             className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-600 transition-colors"
           >
             <Trash2 size={14} /> {t('discardChanges')}
           </button>
        </div>
      </div>
    </div>
  );
};

export default CreateExpensePage;
