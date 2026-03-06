import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Settings2 } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 'sc1', name: 'Drogen', unit: 'm³', price: 80, description: 'Kiln drying van hout - prijs per m³' },
  { id: 'sc2', name: 'Heat Treatment', unit: 'm³', price: 60, description: 'Warmtebehandeling voor export - per m³' },
  { id: 'sc3', name: 'Schaverij', unit: 'm²', price: 8, description: 'Schaven en profileren - prijs per m²' },
];

const UNITS = ['m³', 'm²', 'lm', 'pcs', 'uur', 'lot'];

const ServiceCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newUnit, setNewUnit] = useState('m³');
  const [newPrice, setNewPrice] = useState<number>(0);

  const handleAdd = () => {
    if (!newName.trim()) return;
    setCategories([...categories, {
      id: `sc${Date.now()}`,
      name: newName.trim(),
      unit: newUnit,
      price: newPrice,
      description: newDescription.trim(),
    }]);
    setNewName(''); setNewDescription(''); setNewUnit('m³'); setNewPrice(0);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => setCategories(categories.filter(c => c.id !== id));

  const handleEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewDescription(cat.description);
    setNewUnit(cat.unit);
    setNewPrice(cat.price);
  };

  const handleSaveEdit = (id: string) => {
    setCategories(categories.map(c => c.id === id
      ? { ...c, name: newName, description: newDescription, unit: newUnit, price: newPrice }
      : c));
    setEditingId(null);
    setNewName('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Service Categorieën</h1>
          <p className="text-sm font-medium text-slate-500 italic">Beheer verwerkingsdiensten en basisprijzen</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-purple-800 transition-all flex items-center gap-2 shadow-xl active:scale-95"
        >
          <Plus size={18} /> Nieuwe Service
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isAdding && (
          <div className="p-4 border-b border-purple-200 bg-purple-50/40 space-y-3">
            <p className="text-xs font-black text-purple-700 uppercase tracking-widest">Nieuwe service toevoegen</p>
            <div className="flex items-center gap-3">
              <input
                aria-label="Naam van service"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Service naam..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-purple-200"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button title="Save" onClick={handleAdd} className="p-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors">
                <Check size={18} />
              </button>
              <button title="Annuleren" onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input
                aria-label="Beschrijving"
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Beschrijving..."
                className="col-span-1 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-200"
              />
              <select
                aria-label="Eenheid"
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none bg-white"
              >
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                <input
                  aria-label="Basisprijs"
                  type="number"
                  value={newPrice}
                  min={0}
                  onChange={e => setNewPrice(+e.target.value)}
                  placeholder="Basisprijs"
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 shrink-0">
                <Settings2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === cat.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        aria-label="Naam van service"
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="flex-1 px-2 py-1 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit(cat.id)}
                      />
                      <select
                        aria-label="Eenheid"
                        value={newUnit}
                        onChange={e => setNewUnit(e.target.value)}
                        className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold outline-none bg-white"
                      >
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">€</span>
                        <input
                          aria-label="Basisprijs"
                          type="number"
                          value={newPrice}
                          min={0}
                          onChange={e => setNewPrice(+e.target.value)}
                          className="w-20 pl-5 pr-2 py-1 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                    <input
                      aria-label="Beschrijving"
                      type="text"
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-black">€{cat.price} / {cat.unit}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{cat.description}</p>
                  </>
                )}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                {editingId === cat.id ? (
                  <>
                    <button title="Save" onClick={() => handleSaveEdit(cat.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Check size={16} />
                    </button>
                    <button title="Annuleren" onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
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
            <Settings2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">Geen service categorieën</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCategoriesPage;
