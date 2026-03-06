
import React, { useState } from 'react';
import { Activity, ShieldCheck, Database, Zap, ArrowRight, Download, RefreshCcw, Cpu, Server, HardDrive, ShieldAlert, FileSearch, Lock } from 'lucide-react';

const ReportsPage: React.FC = () => {
  // Mock check for Super Admin. In real app, pull from AuthContext.
  const [userRole] = useState<'Admin' | 'Super Admin'>('Super Admin');
  const isSuperAdmin = userRole === 'Super Admin';

  const handleExportLogs = () => {
    alert('Generating detailed error log CSV export...');
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center shadow-inner">
          <Lock size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 font-medium max-w-sm">System Health monitoring and error logs are reserved for Super Admin accounts only.</p>
        </div>
        <button className="text-brand-primary font-black uppercase text-xs tracking-widest hover:underline">Contact System Administrator</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
          <p className="text-slate-500">Monitor server performance, security incidents and logs</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportLogs}
            className="bg-white border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <FileSearch size={16} /> Export Error Log
          </button>
          <button className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl">
            <RefreshCcw size={16} /> Run Diagnostics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'System Uptime', value: '99.99%', status: 'Operational', icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Firewall', value: 'Active', status: 'Threats Blocked', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Database Latency', value: '42ms', status: 'Optimal', icon: Database, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Build Speed', value: '1.2s', status: 'Static Export', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-start gap-4 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
              <stat.icon size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[10px] font-bold text-slate-500">{stat.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
              <div className="flex items-center gap-3">
                <h3 className="font-black text-sm text-slate-900">Live Error Monitoring</h3>
                <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[8px] font-black uppercase tracking-widest">Master Logs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-[10px] font-bold text-red-600 uppercase">Live</span>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { time: '14:23:01', type: '404 Page Not Found', path: '/wp-login.php', severity: 'Low' },
                { time: '12:05:45', type: 'CORS Policy Block', path: '/api/v1/assets', severity: 'Medium' },
                { time: '09:12:12', type: 'MySQL Query Timeout', path: 'db_cluster_01', severity: 'High' },
                { time: '08:45:00', type: 'SSL Handshake Failed', path: 'api.ramzon.sr', severity: 'Medium' },
              ].map((log, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between text-xs group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-slate-400 font-mono font-bold">{log.time}</span>
                    <div className="flex flex-col">
                      <span className={`font-black text-sm tracking-tight ${log.severity === 'High' ? 'text-red-600' : 'text-slate-900'}`}>{log.type}</span>
                      <span className="text-slate-400 truncate max-w-[200px] font-bold italic">{log.path}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    log.severity === 'High' ? 'bg-red-100 text-red-700' : 
                    log.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {log.severity}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50/30 border-t border-slate-50 text-center">
              <button className="text-xs font-black text-slate-500 hover:text-slate-900 transition-colors">View Detailed Events</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Resource Allocation</h3>
            <div className="space-y-6">
              {[
                { label: 'CPU Usage', val: 45, icon: Cpu, color: 'bg-blue-600' },
                { label: 'Memory', val: 78, icon: HardDrive, color: 'bg-purple-600' },
                { label: 'Network', val: 12, icon: Server, color: 'bg-green-600' },
              ].map((m) => (
                <div key={m.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                      <m.icon size={14} /> {m.label}
                    </div>
                    <span className="text-xs font-black text-slate-900">{m.val}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full ${m.color} transition-all duration-1000 ease-out`} style={{ width: `${m.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
             <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Master Security</h4>
             <p className="text-white text-sm font-bold leading-relaxed mb-6">System integrity is 100%. No unauthorized login attempts detected in the last 24h.</p>
             <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all border border-white/10">
               Security Audit
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
