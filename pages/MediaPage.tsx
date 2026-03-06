
import React, { useState } from 'react';
import { Upload, Grid, List, Search, Filter, MoreHorizontal, Copy, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockMedia } from '../lib/mock-data';

const MediaPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMedia = mockMedia.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Media Library</h1>
          <p className="text-slate-500 text-sm">Manage images, videos and documents</p>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm active:scale-95">
          <Upload size={16} /> Upload New
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-950 outline-none transition-all shadow-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-200 rounded-lg p-1 bg-white shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'text-slate-950 bg-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'text-slate-950 bg-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Filter size={14} /> All Types
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filteredMedia.map((item) => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/media/${item.id}`)}
              className="group relative bg-white border border-slate-200 rounded-lg overflow-hidden aspect-square cursor-pointer hover:border-slate-400 hover:shadow-md transition-all shadow-sm"
            >
              <img src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white font-bold truncate w-full">{item.name}</p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="bg-white/90 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm text-slate-900">
                   {item.size}
                 </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedia.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/media/${item.id}`)}
                >
                  <td className="px-6 py-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={item.url} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-bold text-slate-900">{item.name}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 font-medium">{item.size}</td>
                  <td className="px-6 py-3 text-slate-500 font-medium">{item.date}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="p-2 text-slate-400 hover:text-slate-900 rounded-md transition-all">
                        <Copy size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 rounded-md transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MediaPage;
