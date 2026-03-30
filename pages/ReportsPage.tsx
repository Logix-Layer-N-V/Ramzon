
import React, { useState } from 'react';
import { Activity, ShieldCheck, Database, Zap, RefreshCcw, Cpu, Server, HardDrive, FileSearch, Lock, X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';

// ── Error log data (shared between display + export) ────────────────────────
const ERROR_LOGS = [
  { time: '14:23:01', type: '404 Page Not Found',    path: '/wp-login.php',   severity: 'Low'    },
  { time: '12:05:45', type: 'CORS Policy Block',     path: '/api/v1/assets',  severity: 'Medium' },
  { time: '09:12:12', type: 'MySQL Query Timeout',   path: 'db_cluster_01',   severity: 'High'   },
  { time: '08:45:00', type: 'SSL Handshake Failed',  path: 'api.ramzon.sr',   severity: 'Medium' },
];

// ── Diagnostic checks ───────────────────────────────────────────────────────
const DIAGNOSTIC_CHECKS = [
  { label: 'Database connection',        status: 'pass',  detail: 'PostgreSQL 17 responding in 42ms' },
  { label: 'API server reachability',    status: 'pass',  detail: 'Express :4000 — 200 OK' },
  { label: 'SSL certificate validity',   status: 'warn',  detail: 'Expires in 18 days — renew soon' },
  { label: 'Disk space',                 status: 'pass',  detail: '62% used (238 GB free)' },
  { label: 'Memory pressure',            status: 'warn',  detail: '78% in use — consider scaling' },
  { label: 'Firewall rules',             status: 'pass',  detail: 'All 14 rules active, 0 conflicts' },
  { label: 'Backup last run',            status: 'pass',  detail: 'Today 03:00 — completed successfully' },
  { label: 'Unauthorized login attempts',status: 'pass',  detail: '0 attempts in last 24h' },
];

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.role === 'Admin' || true; // allow all for now

  // ── Diagnostics state ────────────────────────────────────────────────────
  const [diagRunning,  setDiagRunning]  = useState(false);
  const [diagProgress, setDiagProgress] = useState(0);
  const [diagDone,     setDiagDone]     = useState(false);
  const [showDiagModal, setShowDiagModal] = useState(false);

  // ── Security audit state ────────────────────────────────────────────────
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const handleRunDiagnostics = () => {
    setDiagRunning(true);
    setDiagProgress(0);
    setDiagDone(false);
    setShowDiagModal(true);

    let step = 0;
    const total = DIAGNOSTIC_CHECKS.length;
    const interval = setInterval(() => {
      step++;
      setDiagProgress(step);
      if (step >= total) {
        clearInterval(interval);
        setDiagRunning(false);
        setDiagDone(true);
      }
    }, 350);
  };

  const handleExportLogs = () => {
    const header = 'Time,Type,Path,Severity';
    const rows = ERROR_LOGS.map(l => `${l.time},"${l.type}","${l.path}",${l.severity}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ramzon-error-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
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

  const passCount = DIAGNOSTIC_CHECKS.filter(c => c.status === 'pass').length;
  const warnCount = DIAGNOSTIC_CHECKS.filter(c => c.status === 'warn').length;
  const failCount = DIAGNOSTIC_CHECKS.filter(c => c.status === 'fail').length;

  return (
    <>
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* ── Header ── */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
          <p className="text-slate-500">Monitor server performance, security incidents and logs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportLogs}
            className="bg-white border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <FileSearch size={16} /> Export Error Log
          </button>
          <button
            onClick={handleRunDiagnostics}
            disabled={diagRunning}
            className="bg-brand-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-70"
          >
            <RefreshCcw size={16} className={diagRunning ? 'animate-spin' : ''} />
            {diagRunning ? 'Running…' : 'Run Diagnostics'}
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'System Uptime',    value: '99.99%', status: 'Operational',   icon: Activity,    color: 'text-green-500',  bg: 'bg-green-50'  },
          { label: 'Firewall',         value: 'Active', status: 'Threats Blocked', icon: ShieldCheck, color: 'text-blue-500',   bg: 'bg-blue-50'   },
          { label: 'Database Latency', value: '42ms',   status: 'Optimal',         icon: Database,    color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Build Speed',      value: '1.2s',   status: 'Static Export',   icon: Zap,         color: 'text-yellow-600', bg: 'bg-yellow-50' },
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

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Live Error Log */}
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
              {ERROR_LOGS.map((log, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between text-xs group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-slate-400 font-mono font-bold">{log.time}</span>
                    <div className="flex flex-col">
                      <span className={`font-black text-sm tracking-tight ${log.severity === 'High' ? 'text-red-600' : 'text-slate-900'}`}>{log.type}</span>
                      <span className="text-slate-400 truncate max-w-[200px] font-bold italic">{log.path}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    log.severity === 'High'   ? 'bg-red-100 text-red-700' :
                    log.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>{log.severity}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50/30 border-t border-slate-50 text-center">
              <button
                onClick={handleExportLogs}
                className="text-xs font-black text-slate-500 hover:text-brand-primary transition-colors"
              >
                Download Full Log CSV →
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Resource Allocation</h3>
            <div className="space-y-6">
              {[
                { label: 'CPU Usage', val: 45, icon: Cpu,       color: 'bg-blue-600'   },
                { label: 'Memory',    val: 78, icon: HardDrive, color: 'bg-purple-600' },
                { label: 'Network',   val: 12, icon: Server,    color: 'bg-green-600'  },
              ].map((m) => (
                <div key={m.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                      <m.icon size={14} /> {m.label}
                    </div>
                    <span className="text-xs font-black text-slate-900">{m.val}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full ${m.color} transition-all duration-1000 ease-out`} style={{ width: `${m.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Master Security</h4>
            <p className="text-white text-sm font-bold leading-relaxed mb-6">System integrity is 100%. No unauthorized login attempts detected in the last 24h.</p>
            <button
              onClick={() => setShowSecurityModal(true)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all border border-white/10 active:scale-95"
            >
              Security Audit
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ── Diagnostics Modal ───────────────────────────────────────────────── */}
    {showDiagModal && (
      <div className="fixed inset-0 z-[900] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">System Diagnostics</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {diagRunning ? `Running checks… (${diagProgress}/${DIAGNOSTIC_CHECKS.length})` : `Completed — ${passCount} pass · ${warnCount} warn · ${failCount} fail`}
              </p>
            </div>
            {diagDone && (
              <button onClick={() => setShowDiagModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary transition-all duration-300 ease-out"
              style={{ width: `${(diagProgress / DIAGNOSTIC_CHECKS.length) * 100}%` }}
            />
          </div>

          {/* Checks list */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {DIAGNOSTIC_CHECKS.map((check, i) => {
              const done = i < diagProgress;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${done ? 'bg-slate-50' : 'opacity-30'}`}>
                  <div className="shrink-0 mt-0.5">
                    {!done ? (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                    ) : check.status === 'pass' ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : check.status === 'warn' ? (
                      <AlertTriangle size={16} className="text-amber-500" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800">{check.label}</p>
                    {done && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{check.detail}</p>}
                  </div>
                  {done && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      check.status === 'pass' ? 'bg-emerald-100 text-emerald-700' :
                      check.status === 'warn' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{check.status}</span>
                  )}
                </div>
              );
            })}
          </div>

          {diagDone && (
            <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
              failCount > 0 ? 'bg-red-50 text-red-700' :
              warnCount > 0 ? 'bg-amber-50 text-amber-700' :
              'bg-emerald-50 text-emerald-700'
            }`}>
              {failCount > 0 ? <XCircle size={18}/> : warnCount > 0 ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>}
              {failCount > 0
                ? `${failCount} critical issue(s) found — action required.`
                : warnCount > 0
                ? `${warnCount} warning(s) detected — review recommended.`
                : 'All systems operational. No issues found.'}
            </div>
          )}

          {diagDone && (
            <button
              onClick={() => setShowDiagModal(false)}
              className="w-full py-3 bg-brand-primary text-white rounded-xl text-sm font-black hover:opacity-90 transition-all active:scale-95"
            >
              Close
            </button>
          )}
        </div>
      </div>
    )}

    {/* ── Security Audit Modal ────────────────────────────────────────────── */}
    {showSecurityModal && (
      <div className="fixed inset-0 z-[900] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Security Audit Report</h2>
            <button onClick={() => setShowSecurityModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Unauthorized login attempts (24h)', value: '0',         ok: true  },
              { label: 'Active sessions',                   value: '3',         ok: true  },
              { label: 'Failed API requests (1h)',          value: '12',        ok: true  },
              { label: 'Open firewall exceptions',          value: '2',         ok: false },
              { label: 'Last password rotation',            value: '14 days ago', ok: true },
              { label: 'SSL certificate expires in',        value: '18 days',   ok: false },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <span className="text-xs font-bold text-slate-600">{row.label}</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${row.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle size={16} /> System integrity is 100%. No critical threats detected.
          </div>
          <button
            onClick={() => setShowSecurityModal(false)}
            className="w-full py-3 bg-brand-primary text-white rounded-xl text-sm font-black hover:opacity-90 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    )}
    </>
  );
};

export default ReportsPage;
