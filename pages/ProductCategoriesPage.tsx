import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Layers } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 'pc1', name: 'Deuren', description: 'Houtsoort → Model deur → Afmeting (oppervlakte m²)' },
  { id: 'pc2', name: 'Mouldings', description: 'Houtsoort → Product type → Lengte (lm)' },
  { id: 'pc3', name: 'Lijsten', description: 'Houtsoort → Afmeting profiel → Lengte (lm)' },
  { id: 'pc4', name: 'Kozijnen', description: 'Houtsoort → Doorsnee maat → Lengte (lm)' },
  { id: 'pc5', name: 'Crating', description: 'Crate type → Prijs per stuk' },
];

const ProductCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    setCategories([...categories, {
      id: `pc${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim(),
    }]);
    setNewName(''); setNewDescription('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => setCategories(categories.filter(c => c.id !== id));

  const handleEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewDescription(cat.description);
  };

  const handleSaveEdit = (id: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name: newName, description: newDescription } : c));
    setEditingId(null);
    setNewName('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Categorieën</h1>
          <p className="text-sm font-medium text-slate-500 italic">Beheer productcategorieën en hun prijsstructuur</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl active:scale-95"
        >
          <Plus size={18} /> Nieuwe Categorie
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isAdding && (
          <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Nieuwe categorie toevoegen</p>
            <div className="flex items-center gap-3">
              <input
                aria-label="Naam van categorie"
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Naam categorie..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-300"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button title="Save" onClick={handleAdd} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                <Check size={18} />
              </button>
              <button title="Annuleren" onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <input
              aria-label="Beschrijving"
              type="text"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Beschrijving (bijv. Houtsoort → Model → Afmeting)..."
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 shrink-0">
                <Layers size={18} />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === cat.id ? (
                  <div className="space-y-2">
                    <input
                      aria-label="Naam van categorie"
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit(cat.id)}
                    />
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
                    <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{cat.description}</p>
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
            <Layers size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">Geen categorieën</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategoriesPage;
