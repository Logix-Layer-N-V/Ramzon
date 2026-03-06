
import React, { useContext } from 'react';
import { Search, Plus, Settings2, Wrench, Clock, DollarSign, CheckCircle2, MoreVertical } from 'lucide-react';
import { LanguageContext } from '../lib/context';

const ServicesPage: React.FC = () => {
  const { currencySymbol } = useContext(LanguageContext);
  const services = [
    { id: 's1', name: 'Custom Sawmilling', category: 'Fabrication', rate: '85/hr', status: 'Available' },
    { id: 's2', name: 'Kiln Drying', category: 'Processing', rate: '45/m³', status: 'Booked' },
    { id: 's3', name: 'Planer / Thicknesser Service', category: 'Fabrication', rate: '60/hr', status: 'Available' },
    { id: 's4', name: 'Professional Grading', category: 'Consultancy', rate: '120/lot', status: 'Available' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Services</h1>
          <p className="text-sm font-medium text-slate-500 italic">Manage sawmilling, drying, and wood processing services</p>
        </div>
        <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl active:scale-95">
          <Plus size={18} /> Add Service
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between gap-4">
           <div className="flex-1 max-w-sm relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search services..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">Service Types</button>
        </div>

        <div className="divide-y divide-slate-100">
          {services.map((s) => (
            <div key={s.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors shadow-inner">
                  <Wrench size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 leading-tight">{s.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      s.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>{s.status}</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{s.category}</p>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-8">
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900 italic">{currencySymbol}{s.rate}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Standard Rate</p>
                </div>
                <button title="More options" className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={20} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Capacity Tracker</h4>
            <p className="text-lg font-bold leading-tight mb-6">Sawmill capacity is at 85% for this month. 4 pending bookings.</p>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-blue-500 w-[85%]" />
            </div>
            <button className="w-full py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-all">
              Manage Schedule
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
           <div>
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Service Revenue</h4>
             <p className="text-3xl font-black text-slate-900 tracking-tight">{currencySymbol}4,250</p>
             <p className="text-xs font-bold text-slate-500 mt-1">This Month • +12% from last</p>
           </div>
           <div className="mt-8 flex gap-2">
             <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-3/4" />
             </div>
             <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-1/2" />
             </div>
             <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-full" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
