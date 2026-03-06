import React, { useState, useContext } from 'react';
import { 
  Search, 
  Plus, 
  Building, 
  Mail, 
  Phone, 
  Filter, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2,
  Users,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { mockClients } from '../lib/mock-data';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../lib/context';

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useContext(LanguageContext);
  const [search, setSearch] = useState('');

  const filteredClients = mockClients.filter(c => 
    c.company.toLowerCase().includes(search.toLowerCase()) || 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Relationship Management</h1>
          <p className="text-sm font-semibold text-slate-500">Manage your business relations and order history</p>
        </div>
        <button 
          onClick={() => navigate('/clients/new')}
          className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-2 shadow-md active:scale-95"
        >
          <Plus size={18} /> New Client
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Accounts</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-900">{mockClients.length}</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+2 this month</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg. Order Value</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-900">{currencySymbol}4,250</h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Stable</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Portfolio</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-900">{currencySymbol}242k</h3>
            <ArrowUpRight size={20} className="text-emerald-500 mb-1" />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/10">
          <div className="flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by company name or contact person..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-accent-light transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white text-slate-600 hover:bg-slate-50 transition-all">
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Organisation / Contact</th>
                <th className="px-6 py-4">Contact Details</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Revenue YTD</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((c) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner">
                        <Building size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate leading-tight">{c.company}</p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">{c.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <Mail size={12} className="text-slate-300" />
                        {c.email}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                        <Phone size={12} className="text-slate-300" />
                        {c.phone || 'No phone'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-bold uppercase tracking-wider border border-emerald-100">
                      <CheckCircle2 size={10} /> {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <p className="font-bold text-slate-900">{currencySymbol}{c.totalSpent.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Verified</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button title="View detail" className="p-2 text-slate-400 hover:text-brand-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-none hover:shadow-sm">
                        <ExternalLink size={16} />
                      </button>
                      <button title="More options" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-none hover:shadow-sm">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs font-semibold text-slate-400">Showing 1–{filteredClients.length} of {filteredClients.length} clients</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-400 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase text-slate-900 shadow-sm hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
