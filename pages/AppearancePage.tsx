
import React, { useState, useContext, useEffect } from 'react';
import { 
  Palette, 
  Move, 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown, 
  Sparkles, 
  Wand2, 
  Eye, 
  Box, 
  FileText, 
  ClipboardList, 
  Receipt, 
  Wallet, 
  CreditCard,
  Grid,
  Check,
  AlignLeft,
  Settings2,
  Paperclip,
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
  Type,
  Type as FontSizeIcon,
  Bold as FontWeightIcon,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../lib/context';
import { storage, NoteTemplate } from '../lib/storage';

// Map string icon names → Lucide components for note templates
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  MessageSquareText, FileText, Wand2,
};

const DEFAULT_NOTE_TEMPLATES: NoteTemplate[] = [
  { name: 'Standard Payment Note', content: 'Thank you for your business. Please include Invoice # in payment reference.', iconName: 'MessageSquareText' },
  { name: 'Wood Quality Note',     content: 'This timber is graded according to FAS standards. Please store in a dry place.',  iconName: 'FileText' },
  { name: 'Delivery Note',         content: 'Our transport team will contact you 24 hours before arrival.',                    iconName: 'Wand2' },
];

type DocumentType = 'invoice' | 'estimate' | 'payment' | 'credit' | 'note';
type HeaderStyle = 'centered' | 'split';
type Alignment = 'left' | 'center' | 'right';
type FontFamily = 'sans' | 'serif' | 'mono';
type FontSize = 'small' | 'medium' | 'large';
type FontWeight = 'normal' | 'medium' | 'bold' | 'black';

const AppearancePage: React.FC = () => {
  const { 
    companyName, companyLogo, companyAddress, 
    companyPhone, companyEmail, companyWebsite, 
    companyKKF, companyBTW 
  } = useContext(LanguageContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'builder' | 'header' | 'footer' | 'themes' | 'notities'>('builder');
  const [activeDocType, setActiveDocType] = useState<DocumentType>('invoice');
  const [docTheme, setDocTheme] = useState<'minimal' | 'corporate' | 'modern' | 'compact'>('corporate');
  const [showPreview, setShowPreview] = useState(false);
  
  // Header Customization States
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>('split');
  const [logoAlignment, setLogoAlignment] = useState<Alignment>('left');

  // Typography Customization States
  const [fontFamily, setFontFamily] = useState<FontFamily>('sans');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [fontWeight, setFontWeight] = useState<FontWeight>('bold');

  // Notes Templates State — persisted to localStorage
  const [noteTemplates, setNoteTemplates] = useState<NoteTemplate[]>(() => {
    const saved = storage.noteTemplates.get();
    return saved.length ? saved : DEFAULT_NOTE_TEMPLATES;
  });
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  // Persist note templates to localStorage whenever they change
  useEffect(() => { storage.noteTemplates.save(noteTemplates); }, [noteTemplates]);

  // Document skeletons with ordering and visibility
  const [docSkeletons, setDocSkeletons] = useState({
    invoice: [
      { id: 'h1', label: 'Branding Header (Logo & Info)', enabled: true },
      { id: 'm1', label: 'Metadata Row (Date, #, Terms)', enabled: true },
      { id: 't1', label: 'Items Table (Wood Specs)', enabled: true },
      { id: 's1', label: 'BTW & Tax Line', enabled: true },
      { id: 'p1', label: 'Footer Section (Notes & Totals)', enabled: true },
    ],
    estimate: [
      { id: 'h1', label: 'Branding Header', enabled: true },
      { id: 'm1', label: 'Metadata Row', enabled: true },
      { id: 't1', label: 'Items Table', enabled: true },
      { id: 's1', label: 'BTW Line', enabled: true },
      { id: 'p1', label: 'Footer Section', enabled: true },
    ],
    payment: [
      { id: 'h1', label: 'Branding Header', enabled: true },
      { id: 'm1', label: 'Metadata Row', enabled: true },
      { id: 't1', label: 'Receipt Items', enabled: true },
      { id: 's1', label: 'BTW Line', enabled: true },
      { id: 'p1', label: 'Footer Section', enabled: true },
    ],
    credit: [
      { id: 'h1', label: 'Branding Header', enabled: true },
      { id: 'm1', label: 'Metadata Row', enabled: true },
      { id: 't1', label: 'Credit Items', enabled: true },
      { id: 's1', label: 'BTW Line', enabled: true },
      { id: 'p1', label: 'Footer Section', enabled: true },
    ],
    note: [
      { id: 'h1', label: 'Branding Header', enabled: true },
      { id: 'm1', label: 'Metadata Row', enabled: true },
      { id: 't1', label: 'Note Content', enabled: true },
      { id: 'p1', label: 'Footer Section', enabled: true },
    ]
  });

  const toggleSkeletonItem = (type: DocumentType, id: string) => {
    setDocSkeletons(prev => ({
      ...prev,
      [type]: prev[type].map(item => item.id === id ? { ...item, enabled: !item.enabled } : item)
    }));
  };

  const isEnabled = (type: DocumentType, partId: string) => {
    return docSkeletons[type].find(p => p.id === partId)?.enabled;
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'builder':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Select Document</h3>
                  <Settings2 size={16} className="text-slate-400" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'invoice', label: 'Invoices', icon: Receipt },
                    { id: 'estimate', label: 'Estimates', icon: ClipboardList },
                    { id: 'payment', label: 'Payment Receipts', icon: Wallet },
                    { id: 'credit', label: 'Credit Notes', icon: CreditCard },
                    { id: 'note', label: 'Custom Notes', icon: FileText },
                  ].map(doc => (
                    <button 
                      key={doc.id}
                      onClick={() => setActiveDocType(doc.id as DocumentType)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group border ${activeDocType === doc.id ? 'bg-brand-primary text-white border-brand-primary shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <doc.icon size={18} className={activeDocType === doc.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                      <span className="text-xs font-black uppercase tracking-wider">{doc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Layout Engine</h3>
                  <Palette size={16} className="text-brand-accent" />
                </div>
                <div className="flex flex-col gap-2">
                   {['minimal', 'corporate', 'modern', 'compact'].map(theme => (
                     <button 
                      key={theme}
                      onClick={() => setDocTheme(theme as any)}
                      className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${docTheme === theme ? 'bg-brand-accent-light border-brand-accent text-brand-primary' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                     >
                       {theme.charAt(0).toUpperCase() + theme.slice(1)} Template
                     </button>
                   ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Typography Settings</h3>
                  <Type size={16} className="text-brand-primary" />
                </div>
                <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Font Family</label>
                     <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {['sans', 'serif', 'mono'].map((f) => (
                          <button 
                            key={f}
                            onClick={() => setFontFamily(f as any)}
                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${fontFamily === f ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {f}
                          </button>
                        ))}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Text Scaling</label>
                     <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {['small', 'medium', 'large'].map((s) => (
                          <button 
                            key={s}
                            onClick={() => setFontSize(s as any)}
                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${fontSize === s ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {s.charAt(0)}
                          </button>
                        ))}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Base Weight</label>
                     <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                        {['normal', 'medium', 'bold', 'black'].map((w) => (
                          <button 
                            key={w}
                            onClick={() => setFontWeight(w as any)}
                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${fontWeight === w ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {w === 'normal' ? 'N' : w === 'medium' ? 'M' : w === 'bold' ? 'B' : 'BL'}
                          </button>
                        ))}
                     </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.1)] min-h-[700px] flex flex-col gap-4 relative">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">PDF Document Skeleton: {activeDocType.toUpperCase()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-all"><AlignLeft size={18} /></button>
                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-all"><Grid size={18} /></button>
                  </div>
                </div>

                <div className="space-y-3">
                  {docSkeletons[activeDocType].map((item, idx) => (
                    <div 
                      key={item.id}
                      className={`group relative flex items-center justify-between p-6 rounded-[24px] border transition-all duration-500 hover:scale-[1.01] ${item.enabled ? 'bg-white border-slate-200 shadow-sm opacity-100' : 'bg-slate-50 border-slate-100 opacity-40 grayscale'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="cursor-grab active:cursor-grabbing text-slate-200 group-hover:text-slate-400 transition-colors">
                          <Move size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 tracking-tight">{item.label}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Part 0{idx + 1}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleSkeletonItem(activeDocType, item.id)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${item.enabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-200 text-slate-500 border-transparent'}`}
                        >
                          {item.enabled ? 'VISIBLE' : 'HIDDEN'}
                        </button>
                        <button className="p-2 text-slate-200 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all">
                          <Settings2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-8 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-4 text-slate-300 group hover:border-brand-accent hover:text-brand-primary transition-all cursor-pointer">
                  <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Append Custom Data Block</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'header':
        return (
          <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.05)] space-y-8 animate-in fade-in duration-300">
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Document Header Configurator</h3>
                 <p className="text-sm font-medium text-slate-500">Customize how your company info appears on all generated PDF exports</p>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Header Structure Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setHeaderStyle('centered')}
                        className={`p-4 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${headerStyle === 'centered' ? 'border-brand-primary bg-brand-accent-light' : 'border-slate-100 bg-white'}`}
                      >
                        Centered Brand
                      </button>
                      <button 
                        onClick={() => setHeaderStyle('split')}
                        className={`p-4 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${headerStyle === 'split' ? 'border-brand-primary bg-brand-accent-light' : 'border-slate-100 bg-white'}`}
                      >
                        Split Info/Title
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo Alignment</label>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setLogoAlignment('left')}
                        className={`px-6 py-3 border-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${logoAlignment === 'left' ? 'border-brand-primary bg-brand-accent-light' : 'border-slate-100 bg-white'}`}
                       >
                         <AlignLeft size={16} /> Left
                       </button>
                       <button 
                        onClick={() => setLogoAlignment('center')}
                        className={`px-6 py-3 border-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${logoAlignment === 'center' ? 'border-brand-primary bg-brand-accent-light' : 'border-slate-100 bg-white'}`}
                       >
                         <AlignCenter size={16} /> Center
                       </button>
                       <button 
                        onClick={() => setLogoAlignment('right')}
                        className={`px-6 py-3 border-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${logoAlignment === 'right' ? 'border-brand-primary bg-brand-accent-light' : 'border-slate-100 bg-white'}`}
                       >
                         <AlignRight size={16} /> Right
                       </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center gap-4">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <Building size={32} className="text-brand-primary" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 italic max-w-[200px]">Header information is automatically synced from Company Settings</p>
                  <button 
                    onClick={() => navigate('/settings')}
                    className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline hover:opacity-80 transition-all"
                  >
                    Edit Company Info
                  </button>
                </div>
             </div>
          </div>
        );
      case 'footer':
        return (
          <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.05)] space-y-8 animate-in fade-in duration-300">
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Legal & Payment Footer Editor</h3>
                 <p className="text-sm font-medium text-slate-500">Manage bank details, BTW numbers, and IBAN info for document footers</p>
               </div>
             </div>
             
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50 space-y-4">
                      <div className="flex items-center gap-3">
                        <PaymentIcon size={18} className="text-brand-primary" />
                        <span className="text-xs font-black uppercase tracking-widest">Bank Details Block</span>
                      </div>
                      <textarea className="w-full h-32 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium resize-none" defaultValue={`ING Bank: NL88 INGB 0123 4567 89\nBTW nr: ${companyBTW}\nKKF: ${companyKKF}`} />
                   </div>
                   <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50 space-y-4">
                      <div className="flex items-center gap-3">
                        <Scale size={18} className="text-brand-primary" />
                        <span className="text-xs font-black uppercase tracking-widest">Legal Disclaimer Block</span>
                      </div>
                      <textarea className="w-full h-32 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium resize-none" defaultValue={"Betalingstermijn is 14 dagen. Op al onze leveringen zijn de algemene voorwaarden van toepassing."} />
                   </div>
                </div>
             </div>
          </div>
        );
      case 'notities':
        return (
          <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.05)] space-y-8 animate-in fade-in duration-300">
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Default Notes Management</h3>
                 <p className="text-sm font-medium text-slate-500">Configure default text that appears in the "Notes" section of your documents</p>
               </div>
               <button
                 onClick={() => setShowAddTemplate(true)}
                 className="px-5 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg hover:bg-red-800 transition-all active:scale-95"
               >
                 <Plus size={14} /> Add Template
               </button>
             </div>

             {/* Add Template Modal */}
             {showAddTemplate && (
               <div className="p-6 bg-blue-50/40 border-2 border-blue-100 rounded-[24px] space-y-4 animate-in slide-in-from-top-3 duration-300">
                 <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">New Notes Template</h4>
                 <div className="space-y-3">
                   <input
                     aria-label="Template name"
                     placeholder="Template name (e.g. Payment Reminder)"
                     value={newTemplateName}
                     onChange={e => setNewTemplateName(e.target.value)}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-300"
                   />
                   <textarea
                     aria-label="Template content"
                     placeholder="Enter the default text that will appear in the Notes section..."
                     value={newTemplateContent}
                     onChange={e => setNewTemplateContent(e.target.value)}
                     rows={4}
                     className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none resize-none focus:border-blue-300"
                   />
                 </div>
                 <div className="flex gap-3 justify-end">
                   <button onClick={() => { setShowAddTemplate(false); setNewTemplateName(''); setNewTemplateContent(''); }}
                     className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-50 transition-all">
                     Cancel
                   </button>
                   <button onClick={() => {
                     if (!newTemplateName.trim()) return;
                     setNoteTemplates(prev => [...prev, { name: newTemplateName, content: newTemplateContent, iconName: 'MessageSquareText' }]);
                     setNewTemplateName(''); setNewTemplateContent(''); setShowAddTemplate(false);
                   }} className="px-5 py-2 bg-brand-primary text-white rounded-xl text-xs font-black hover:bg-red-800 transition-all shadow-lg">
                     Save Template
                   </button>
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {noteTemplates.map((note, i) => {
                  const NoteIcon = ICON_MAP[note.iconName] ?? FileText;
                  return (
                    <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[24px] hover:bg-white hover:shadow-xl transition-all cursor-pointer group relative">
                      <button
                        title="Remove template"
                        onClick={() => setNoteTemplates(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-primary shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <NoteIcon size={20} />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mb-2">{note.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">"{note.content}"</p>
                    </div>
                  );
                })}
             </div>
          </div>
        );
      case 'themes':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-2 animate-in fade-in duration-300">
            {[
              { name: 'Modern Minimalist', desc: 'Light, spacious and professional', author: 'Ramzon' },
              { name: 'Corporate Grid', desc: 'Standard business layout with heavy table styling', author: 'Enterprise' },
              { name: 'Eco-Teak Branding', desc: 'Natural tones for timber specialists', author: 'WoodDesign' }
            ].map((theme, i) => (
              <div key={theme.name} className="bg-white border border-slate-200 rounded-[32px] overflow-hidden group shadow-lg hover:shadow-2xl transition-all relative">
                <div className="h-56 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  <LayoutTemplate size={48} className="text-slate-200 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                  {i === 0 && (
                    <div className="absolute top-4 left-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Active</div>
                  )}
                </div>
                <div className="p-6 flex flex-col gap-1">
                  <h3 className="font-black text-slate-900 text-base">{theme.name}</h3>
                  <p className="text-xs text-slate-500 font-bold italic">{theme.desc}</p>
                </div>
                <div className="px-6 pb-6 pt-2 flex gap-2">
                    <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">Sample PDF</button>
                    {i !== 0 && <button className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">Activate</button>}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  const getThemeClasses = () => {
    // Determine base styles from theme
    let baseStyles = {
      container: 'gap-12 p-16 font-sans',
      header: 'border-b border-slate-200 pb-8',
      table: 'border-none',
      tableHead: 'bg-transparent border-b-2 border-slate-100 text-slate-400 font-medium',
      totalCard: 'bg-transparent border-t border-slate-200 text-slate-900 p-4',
      typography: 'font-normal tracking-normal'
    };

    switch (docTheme) {
      case 'modern':
        baseStyles = {
          container: 'gap-16 p-20 font-sans bg-white',
          header: 'pb-12 border-b-4 border-brand-accent/20',
          table: 'border-separate border-spacing-y-2',
          tableHead: 'bg-slate-50/80 rounded-xl text-slate-900 font-black px-6',
          totalCard: 'bg-brand-primary text-white p-8 rounded-[32px] shadow-2xl',
          typography: 'font-bold tracking-tight'
        };
        break;
      case 'compact':
        baseStyles = {
          container: 'gap-6 p-8 font-sans text-[11px]',
          header: 'pb-4 border-b border-slate-100',
          table: 'border-collapse',
          tableHead: 'bg-slate-100 text-slate-600 font-black py-2 px-2',
          totalCard: 'bg-slate-50 border border-slate-200 p-4 rounded-xl',
          typography: 'font-bold leading-tight'
        };
        break;
      case 'corporate':
        baseStyles = {
          container: 'gap-20 p-24 font-serif',
          header: 'border-b-2 border-slate-900 pb-10',
          table: 'border-collapse',
          tableHead: 'bg-slate-900 text-white uppercase font-black py-3 px-4',
          totalCard: 'bg-white border-2 border-slate-900 p-6 shadow-md',
          typography: 'font-black tracking-tighter'
        };
        break;
    }

    // Override with manual typography settings
    const familyMap = {
      sans: 'font-sans',
      serif: 'font-serif',
      mono: 'font-mono'
    };
    
    const sizeMap = {
      small: 'text-[11px]',
      medium: 'text-[13px]',
      large: 'text-[15px]'
    };

    const weightMap = {
      normal: 'font-normal',
      medium: 'font-medium',
      bold: 'font-bold',
      black: 'font-black'
    };

    return {
      ...baseStyles,
      typography: `${familyMap[fontFamily]} ${sizeMap[fontSize]} ${weightMap[fontWeight]}`
    };
  };

  const styles = getThemeClasses();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Document Styles</h1>
          <p className="text-slate-500 font-bold italic mt-1 leading-none">Customize the visual output of your Invoice & Estimate system</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPreview(true)}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <Eye size={18} /> Live Preview
          </button>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-2xl shadow-slate-200 active:scale-95">
            <Save size={20} /> Apply Layouts
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 no-scrollbar overflow-x-auto bg-slate-50/50 px-4 py-1.5 rounded-2xl shadow-inner">
        {[
          { id: 'builder', label: 'Document Builder', icon: Box },
          { id: 'header', label: 'PDF Headers', icon: LayoutTemplate },
          { id: 'footer', label: 'PDF Footers', icon: Building },
          { id: 'notities', label: 'Notes & Terms', icon: MessageSquareText },
          { id: 'themes', label: 'Visual Themes', icon: Palette }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-4 flex items-center gap-3 shrink-0 ${activeTab === tab.id ? 'border-brand-accent text-brand-primary' : 'border-transparent text-slate-400 hover:text-slate-900 hover:bg-white/50 rounded-lg'}`}
          >
            <tab.icon size={18} className={activeTab === tab.id ? 'text-brand-primary' : 'opacity-40'} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        {renderTabContent()}
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowPreview(false)}></div>
          
          <div className="bg-white w-full max-w-5xl h-[92vh] rounded-[40px] shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <LayoutTemplate size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight text-lg italic">PDF Output Preview</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Template: {docTheme.toUpperCase()} • Type: {activeDocType.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <Printer size={20} />
                </button>
                <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                  <Download size={20} />
                </button>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

             <div className="flex-1 overflow-y-auto bg-slate-100/50 p-8 md:p-16 flex justify-center">
                <div className="w-full max-w-[850px] min-h-[1100px] bg-white shadow-2xl border border-slate-900 flex flex-col transition-all duration-500 animate-in slide-in-from-bottom-8 p-8 space-y-6 font-sans text-slate-900">
                   
                   {isEnabled(activeDocType, 'h1') && (
                     <div className="flex justify-between items-start">
                       <div className="w-1/3">
                         <div className="w-48 h-24 flex items-center justify-center overflow-hidden">
                           {companyLogo ? (
                             <img src={companyLogo} className="w-full h-full object-contain" alt="Ramzon Logo" />
                           ) : (
                             <div className="text-2xl font-black text-brand-primary italic">RAMZON N.V.</div>
                           )}
                         </div>
                         <div className="mt-2 space-y-0.5 text-[9px] font-bold text-slate-900 uppercase">
                           <p className="flex items-center gap-1">📍 {companyAddress}</p>
                           <p className="flex items-center gap-1">📞 {companyPhone}</p>
                           <p className="flex items-center gap-1">✉️ {companyEmail}</p>
                         </div>
                       </div>
                       
                       <div className="flex-1 text-center pt-4">
                         <h1 className="text-6xl font-black text-slate-900 tracking-tighter italic" style={{ fontFamily: 'serif' }}>{activeDocType === 'invoice' ? 'Invoice' : activeDocType.charAt(0).toUpperCase() + activeDocType.slice(1)}</h1>
                       </div>

                       <div className="w-1/3">
                         <div className="bg-slate-100 border border-slate-300 p-4 min-h-[120px] rounded-sm">
                           <h3 className="text-xs font-black text-center mb-4 uppercase tracking-wider">Customer Information</h3>
                           <div className="text-center space-y-1">
                             <p className="text-sm font-bold">Dinesh Abhelak</p>
                             <p className="text-xs text-slate-600">+597 8594052</p>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}

                   <div className="border-y border-slate-900 grid grid-cols-6 divide-x divide-slate-900 text-center">
                     <div className="py-1">
                       <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Date</p>
                       <p className="text-xs font-bold">01-Sept-2021</p>
                     </div>
                     <div className="py-1">
                       <p className="text-[10px] font-bold border-b border-slate-200 mb-1">{activeDocType.toUpperCase()} #</p>
                       <p className="text-xs font-bold">166</p>
                     </div>
                     <div className="py-1">
                       <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Terms</p>
                       <p className="text-xs font-bold">COD</p>
                     </div>
                     <div className="py-1 bg-slate-100">
                       <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Due Date</p>
                       <p className="text-xs font-bold">01-Sept-2021</p>
                     </div>
                     <div className="py-1">
                       <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Rep</p>
                       <p className="text-xs font-bold">SS</p>
                     </div>
                     <div className="py-1">
                       <p className="text-[10px] font-bold border-b border-slate-200 mb-1">Project</p>
                       <p className="text-xs font-bold">-</p>
                     </div>
                   </div>

                   {(isEnabled(activeDocType, 't1') || isEnabled(activeDocType, 'cr1') || isEnabled(activeDocType, 'r1')) && (
                     <div className="border border-slate-900 min-h-[400px] flex flex-col">
                       <table className="w-full text-left border-collapse">
                         <thead className="border-b border-slate-900">
                           <tr className="divide-x divide-slate-900 text-[11px] font-black uppercase">
                             <th className="py-1 px-2 w-[40%]">Description</th>
                             <th className="py-1 px-2 text-center w-[12%]">Measurem...</th>
                             <th className="py-1 px-2 text-center w-[8%]">Qu...</th>
                             <th className="py-1 px-2 text-center w-[8%]">U/M</th>
                             <th className="py-1 px-2 text-center w-[12%]">Wood</th>
                             <th className="py-1 px-2 text-right w-[10%]">Rate</th>
                             <th className="py-1 px-2 text-right w-[10%]">Amount</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-transparent">
                           {[
                             { desc: 'Hout drogen', measurement: '', qty: 3.75, um: 'CBM', wood: 'KOP-Kopi', rate: 80.00, total: 300.00 },
                             { desc: 'Vloerhout her-schaven en profileren', measurement: '', qty: 135, um: 'M²', wood: '', rate: 8.00, total: 1080.00 }
                           ].map((row, i) => (
                             <tr key={i} className="divide-x divide-slate-900 text-xs font-medium">
                                <td className="py-2 px-2">{row.desc}</td>
                                <td className="py-2 px-2 text-center">{row.measurement}</td>
                                <td className="py-2 px-2 text-center">{row.qty}</td>
                                <td className="py-2 px-2 text-center">{row.um}</td>
                                <td className="py-2 px-2 text-center">{row.wood}</td>
                                <td className="py-2 px-2 text-right">{row.rate.toFixed(2)}</td>
                                <td className="py-2 px-2 text-right">{row.total.toFixed(2)}</td>
                             </tr>
                           ))}
                           <tr className="flex-1 divide-x divide-slate-900 h-[300px]">
                             <td className="border-none"></td>
                             <td className="border-none"></td>
                             <td className="border-none"></td>
                             <td className="border-none"></td>
                             <td className="border-none"></td>
                             <td className="border-none"></td>
                             <td className="border-none"></td>
                           </tr>
                         </tbody>
                       </table>
                     </div>
                   )}

                   {isEnabled(activeDocType, 's1') && (
                     <div className="border border-slate-900 grid grid-cols-12 divide-x divide-slate-900">
                       <div className="col-span-10 py-1 px-4 text-xs font-black text-center uppercase tracking-wider">
                         BTW tnv RAMZON NV # 2000012965 (10.0%)
                       </div>
                       <div className="col-span-2 py-1 px-2 text-right text-xs font-bold">
                         USD 0.00
                       </div>
                     </div>
                   )}

                   <div className="mt-auto space-y-0">
                      <div className="grid grid-cols-12 border border-slate-900 divide-x divide-slate-900">
                         {isEnabled(activeDocType, 'p1') && (
                           <div className="col-span-9 p-4 text-[9px] font-bold space-y-1 leading-tight">
                             <p>1-Office Hours: mon-fri 08:00-12:00/13:00-17:00).</p>
                             <p>2-Hakrinbank N.V SRD 20.633.15.56 II EURO 20.695.94.66 II US$ 20.802.82.73 SWIFT HAKRSRPA.</p>
                             <p className="pl-2">For Banking transfers the transfercertificate is required.</p>
                             <p>3-All wood products exclude: supply, finishing, glass, locksmithing</p>
                             <p>4-All measurements in MM II Size tolerances: ± 5mm</p>
                             <p>5-Exceeding the stated delivery time, those not lend parties the right to terminate the contract,</p>
                             <p>6-We are not responsible for products that have not been collected within 30 days of completion.</p>
                             <p>7-Open balances are to be paid in full immediately before the items are collected.</p>
                             <p>8-No refund on cancellation, regardless of reason.</p>
                             <p>9-The warranty is on the product.</p>
                           </div>
                         )}
                         <div className="col-span-3 flex flex-col divide-y divide-slate-900">
                            <div className="flex-1 p-3 flex justify-between items-center">
                              <span className="text-xs font-black uppercase">Total</span>
                              <span className="text-xs font-bold">USD 1,380.00</span>
                            </div>
                            <div className="flex-1 p-3 flex justify-between items-center">
                              <span className="text-xs font-black uppercase">Payments</span>
                              <span className="text-xs font-bold">USD -272.00</span>
                            </div>
                            <div className="flex-1 p-3 flex justify-between items-center bg-slate-50">
                              <span className="text-xs font-black uppercase">Balance</span>
                              <span className="text-xs font-bold">USD 1,108.00</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
            
            <div className="px-10 py-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Layout Engine</span>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Adjust Layout
                  </button>
                  <button 
                    onClick={() => setShowPreview(false)}
                    className="px-10 py-3 bg-brand-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Deploy to PDF Server
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppearancePage;
