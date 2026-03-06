import React, { useState } from 'react';
import { Tag, Plus, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react';

const ICON_LIBRARY = [
  { group: '🚛 Transport & Logistiek', icons: ['🚛', '🚗', '🚢', '✈️', '🚆', '🚚', '🛻', '🚁', '🛺', '⛵'] },
  { group: '🏢 Kantoor & Admin', icons: ['🏢', '🏭', '📋', '📊', '📄', '📝', '🖨️', '📁', '🗂️', '📌'] },
  { group: '💻 IT & Technologie', icons: ['💻', '🖥️', '⌨️', '🖱️', '📱', '💾', '🔌', '📡', '🌐', '☁️'] },
  { group: '🔧 Onderhoud & Reparaties', icons: ['🔧', '🔨', '🛠️', '⚙️', '🪛', '🔩', '🧰', '🪜', '🧹', '🪚'] },
  { group: '📣 Marketing & Sales', icons: ['📣', '📢', '📺', '📻', '🎯', '🎨', '📸', '🖼️', '🎬', '📰'] },
  { group: '👷 Personeel & HR', icons: ['👷', '👨‍💼', '👥', '🎓', '🏆', '💼', '👔', '⏰', '📅', '✅'] },
  { group: '🏗️ Productie & Materialen', icons: ['🏗️', '🪵', '🧱', '⚡', '🛢️', '🪨', '🧪', '⚗️', '🔬', '🪣'] },
  { group: '💡 Utilities & Energie', icons: ['⚡', '💡', '🔥', '💧', '♨️', '🌡️', '❄️', '🔋', '⛽', '🚰'] },
  { group: '💰 Financieel & Juridisch', icons: ['💰', '💳', '💵', '📈', '📉', '🏦', '⚖️', '📜', '🔐', '💎'] },
  { group: '🔑 Algemeen Business', icons: ['🔑', '📞', '🎯', '⏱️', '🏷️', '🛒', '🎁', '🔔', '🔒', '📦'] },
];

const ALL_ICONS = ICON_LIBRARY.flatMap(g => g.icons);

const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: 'Logistiek', color: '#3B82F6', icon: '🚛' },
  { id: 'cat2', name: 'Inventaris / Materialen', color: '#F59E0B', icon: '📦' },
  { id: 'cat3', name: 'Personeelskosten', color: '#10B981', icon: '👷' },
  { id: 'cat4', name: 'Kantoor & Admin', color: '#8B5CF6', icon: '🏢' },
  { id: 'cat5', name: 'Onderhoud & Reparaties', color: '#EF4444', icon: '🔧' },
  { id: 'cat6', name: 'Utilities', color: '#06B6D4', icon: '⚡' },
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  onClose: () => void;
}

const IconPickerModal: React.FC<IconPickerProps> = ({ value, onChange, onClose }) => {
  const [activeGroup, setActiveGroup] = useState(ICON_LIBRARY[0].group);

  return (
    <div className="absolute z-50 left-0 top-14 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Dropdown select */}
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <select
          aria-label="Icon categorie"
          value={activeGroup}
          onChange={e => setActiveGroup(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
        >
          {ICON_LIBRARY.map(g => (
            <option key={g.group} value={g.group}>{g.group}</option>
          ))}
        </select>
      </div>
      {/* Icon grid */}
      <div className="p-3 grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto">
        {(ICON_LIBRARY.find(g => g.group === activeGroup)?.icons || []).map(icon => (
          <button key={icon} onClick={() => { onChange(icon); onClose(); }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl text-xl transition-all hover:bg-slate-100 hover:scale-110 ${
              value === icon ? 'bg-brand-primary/10 ring-2 ring-brand-primary' : ''
            }`}>
            {icon}
          </button>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-slate-100 flex justify-between items-center">
        <p className="text-[10px] text-slate-400 font-bold">Geselecteerd: {value}</p>
        <button onClick={onClose} className="text-[10px] font-bold text-slate-400 hover:text-slate-700">Sluiten</button>
      </div>
    </div>
  );
};

const ExpenseCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📋');
  const [showPicker, setShowPicker] = useState(false);
  const [showEditPicker, setShowEditPicker] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    setCategories([...categories, { id: `cat${Date.now()}`, name: newName.trim(), color: '#BE1E2D', icon: newIcon }]);
    setNewName(''); setNewIcon('📋'); setIsAdding(false); setShowPicker(false);
  };

  const handleDelete = (id: string) => setCategories(categories.filter(c => c.id !== id));

  const handleEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewIcon(cat.icon);
    setShowEditPicker(false);
  };

  const handleSaveEdit = (id: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name: newName, icon: newIcon } : c));
    setEditingId(null); setNewName(''); setShowEditPicker(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expense Categorieën</h1>
          <p className="text-sm font-medium text-slate-500 italic">Beheer categorieën voor kostenoverzicht en rapportage</p>
        </div>
        <button onClick={() => { setIsAdding(true); setShowPicker(false); }}
          className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-red-800 transition-all flex items-center gap-2 shadow-xl active:scale-95">
          <Plus size={18} /> Nieuwe Categorie
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isAdding && (
          <div className="p-4 border-b border-brand-primary/20 bg-red-50/30">
            <div className="flex items-center gap-4">
              {/* Icon picker button */}
              <div className="relative shrink-0">
                <button onClick={() => setShowPicker(!showPicker)}
                  className="w-14 h-10 flex items-center justify-center gap-1 border border-slate-200 rounded-lg bg-white text-xl hover:bg-slate-50 transition-all">
                  {newIcon} <ChevronDown size={10} className="text-slate-400"/>
                </button>
                {showPicker && (
                  <IconPickerModal value={newIcon} onChange={setNewIcon} onClose={() => setShowPicker(false)} />
                )}
              </div>
              <input
                aria-label="Naam van categorie"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Naam van categorie..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button title="Save" onClick={handleAdd} className="p-2 bg-brand-primary text-white rounded-lg hover:bg-red-800 transition-colors">
                <Check size={18} />
              </button>
              <button title="Annuleren" onClick={() => { setIsAdding(false); setShowPicker(false); }} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 ml-1">💡 Klik op het icoon om te kiezen uit de bibliotheek</p>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group">
              <div className="relative shrink-0">
                {editingId === cat.id ? (
                  <>
                    <button onClick={() => setShowEditPicker(!showEditPicker)}
                      className="w-12 h-10 flex items-center justify-center gap-1 border-2 border-brand-primary/40 rounded-xl bg-white text-xl hover:bg-slate-50 transition-all">
                      {newIcon} <ChevronDown size={10} className="text-slate-400"/>
                    </button>
                    {showEditPicker && (
                      <IconPickerModal value={newIcon} onChange={setNewIcon} onClose={() => setShowEditPicker(false)} />
                    )}
                  </>
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-slate-100 group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </div>
                )}
              </div>
              <div className="flex-1">
                {editingId === cat.id ? (
                  <input
                    aria-label="Naam van categorie"
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit(cat.id)}
                  />
                ) : (
                  <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                )}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                {editingId === cat.id ? (
                  <>
                    <button title="Save" onClick={() => handleSaveEdit(cat.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Check size={16} />
                    </button>
                    <button title="Annuleren" onClick={() => { setEditingId(null); setShowEditPicker(false); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button title="Bewerken" onClick={() => handleEdit(cat)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button title="Verwijderen" onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="p-12 text-center text-slate-300">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">Geen categorieën gevonden</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCategoriesPage;
