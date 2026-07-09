
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, ShieldCheck, Database, Zap, RefreshCcw,
  Cpu, Server, HardDrive, FileSearch, Lock,
  X, CheckCircle, AlertTriangle, XCircle,
  Bug, BellRing, PlugZap, Users, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface ErrorLog {
  id: string;
  ts: string;
  level: string;
  source: string;
  message: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

interface DisplayLog {
  id: string;
  time: string;
  type: string;
  path: string;
  severity: 'High' | 'Medium' | 'Low';
}

interface Toast {
  id: string;
  log: DisplayLog;
}

interface SystemStats {
  dbLatencyMs: number;
  dbSizeMb: number;
  activeConnections: number;
  errors24h: number;
  warns24h: number;
  rateLimitBlocks: number;
  loginAttempts24h: number;
}

interface AuditLog {
  id: string;
  ts: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  ip: string;
  meta: Record<string, unknown>;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
const levelToSeverity = (level: string): 'High' | 'Medium' | 'Low' => {
  if (level === 'error') return 'High';
  if (level === 'warn')  return 'Medium';
  return 'Low';
};

const toDisplayLog = (log: ErrorLog): DisplayLog => ({
  id: log.id,
  time: new Date(log.ts).toTimeString().slice(0, 8),
  type: log.message,
  path: log.source,
  severity: levelToSeverity(log.level),
});

/* ── Diagnostic checks — derived from the real /api/system-stats response, not
   fabricated. Previously this was a hardcoded list ('SSL expires in 18 days', '62% disk
   used', etc.) that never changed between runs and could mask or fabricate real issues —
   this app has no way to actually check SSL/disk/firewall/backups, so those checks are
   replaced with the metrics it genuinely can verify. ─────────────────────────────────── */
type CheckStatus = 'pass' | 'warn' | 'fail';
function buildDiagnosticChecks(stats: SystemStats | null): { label: string; status: CheckStatus; detail: string }[] {
  if (!stats) {
    return [{ label: 'Database connection', status: 'warn', detail: 'Stats not loaded yet' }];
  }
  const dbStatus: CheckStatus = stats.dbLatencyMs < 200 ? 'pass' : stats.dbLatencyMs < 800 ? 'warn' : 'fail';
  const connStatus: CheckStatus = stats.activeConnections < 8 ? 'pass' : stats.activeConnections < 15 ? 'warn' : 'fail';
  const errStatus: CheckStatus = stats.errors24h === 0 ? 'pass' : stats.errors24h < 10 ? 'warn' : 'fail';
  const warnStatus: CheckStatus = stats.warns24h === 0 ? 'pass' : stats.warns24h < 20 ? 'warn' : 'fail';
  const rateLimitStatus: CheckStatus = stats.rateLimitBlocks === 0 ? 'pass' : 'warn';
  const dbSizeStatus: CheckStatus = stats.dbSizeMb < 400 ? 'pass' : stats.dbSizeMb < 480 ? 'warn' : 'fail';
  const loginStatus: CheckStatus = stats.loginAttempts24h < 30 ? 'pass' : 'warn';
  return [
    { label: 'Database connection',     status: dbStatus,        detail: `PostgreSQL responding in ${stats.dbLatencyMs}ms` },
    { label: 'API server reachability', status: 'pass',          detail: 'Vercel Serverless — this request succeeded' },
    { label: 'Active DB connections',   status: connStatus,      detail: `${stats.activeConnections} active connection${stats.activeConnections === 1 ? '' : 's'}` },
    { label: 'Errors (24h)',            status: errStatus,       detail: `${stats.errors24h} error${stats.errors24h === 1 ? '' : 's'} logged` },
    { label: 'Warnings (24h)',          status: warnStatus,      detail: `${stats.warns24h} warning${stats.warns24h === 1 ? '' : 's'} logged` },
    { label: 'Rate-limit blocks',       status: rateLimitStatus, detail: `${stats.rateLimitBlocks} key(s) currently locked out` },
    { label: 'Database storage',        status: dbSizeStatus,    detail: `${stats.dbSizeMb} MB in use` },
    { label: 'Login attempts (24h)',    status: loginStatus,     detail: `${stats.loginAttempts24h} login attempt${stats.loginAttempts24h === 1 ? '' : 's'} recorded` },
  ];
}

/* ── Toast component ────────────────────────────────────────────────────── */
const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const { log } = toast;
  const colors =
    log.severity === 'High'   ? { border: 'border-red-400',    bg: 'bg-red-50',     badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500' } :
    log.severity === 'Medium' ? { border: 'border-amber-400',  bg: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' } :
                                { border: 'border-slate-300',  bg: 'bg-white',      badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };

  return (
    <div className={`flex items-start gap-3 w-80 p-4 rounded-2xl shadow-2xl border-l-4 ${colors.border} ${colors.bg} animate-in slide-in-from-right-4 duration-300`}>
      <div className={`w-2 h-2 rounded-full mt-1 shrink-0 animate-pulse ${colors.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${colors.badge}`}>{log.severity}</span>
          <span className="text-[9px] text-slate-400 font-mono">{log.time}</span>
        </div>
        <p className="text-xs font-black text-slate-900 leading-snug truncate">{log.type}</p>
        <p className="text-[10px] text-slate-500 font-medium italic mt-0.5 truncate">{log.path}</p>
      </div>
      <button type="button" title="Dismiss" onClick={() => onDismiss(toast.id)} className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors mt-0.5">
        <X size={14} />
      </button>
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────────────────── */
const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'Admin';

  /* error log state */
  const [logs, setLogs] = useState<DisplayLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const lastSeenId = useRef<string | null>(null);

  /* system stats */
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  /* active tab */
  const [activeTab, setActiveTab] = useState<'errors' | 'activity'>('errors');

  /* audit log state */
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  /* debug mode */
  const [debugMode, setDebugMode] = useState(false);
  const debugModeRef = useRef(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* diagnostics */
  const [diagRunning,   setDiagRunning]   = useState(false);
  const [diagProgress,  setDiagProgress]  = useState(0);
  const [diagDone,      setDiagDone]      = useState(false);
  const [showDiagModal, setShowDiagModal] = useState(false);

  /* security audit */
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  /* derived */
  const DIAGNOSTIC_CHECKS = buildDiagnosticChecks(stats);
  const passCount = DIAGNOSTIC_CHECKS.filter(c => c.status === 'pass').length;
  const warnCount = DIAGNOSTIC_CHECKS.filter(c => c.status === 'warn').length;
  const failCount = DIAGNOSTIC_CHECKS.filter(c => c.status === 'fail').length;

  /* ── Fetch logs ───────────────────────────────────────────────────────── */
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchLogs = useCallback(async (isPolling = false) => {
    try {
      const res = await api.get<ErrorLog[]>('/api/error-logs');
      const display = res.data.map(toDisplayLog);

      if (isPolling && lastSeenId.current) {
        const prevIdx = display.findIndex(l => l.id === lastSeenId.current);
        const newEntries = prevIdx > 0 ? display.slice(0, prevIdx) : [];
        if (newEntries.length > 0 && debugModeRef.current) {
          setToasts(prev => [
            ...newEntries.map(l => ({ id: `toast-${l.id}`, log: l })),
            ...prev,
          ].slice(0, 6));
        }
      }

      if (display.length > 0) lastSeenId.current = display[0].id;
      setLogs(display);
    } catch {
      /* silent — will show empty state */
    } finally {
      setLogsLoading(false);
    }
  }, []);

  /* keep ref in sync so fetchLogs closure always reads current value */
  useEffect(() => { debugModeRef.current = debugMode; }, [debugMode]);

  /* fetch system stats */
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<SystemStats>('/api/system-stats');
      setStats(res.data);
    } catch {
      /* silent */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* fetch audit logs */
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await api.get<AuditLog[]>('/api/audit-logs');
      setAuditLogs(res.data);
    } catch {
      /* silent */
    } finally {
      setAuditLoading(false);
    }
  }, []);

  /* initial load */
  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs(false);
      fetchStats();
    }
  }, [isSuperAdmin, fetchLogs, fetchStats]);

  /* load audit logs on first tab switch */
  useEffect(() => {
    if (activeTab === 'activity' && isSuperAdmin && auditLogs.length === 0 && !auditLoading) {
      fetchAuditLogs();
    }
  }, [activeTab, isSuperAdmin, auditLogs.length, auditLoading, fetchAuditLogs]);

  /* debug-mode polling every 30 s */
  useEffect(() => {
    if (!debugMode || !isSuperAdmin) return;
    const interval = setInterval(() => fetchLogs(true), 30_000);
    return () => clearInterval(interval);
  }, [debugMode, isSuperAdmin, fetchLogs]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleExportLogs = () => {
    const header = 'Time,Type,Path,Severity';
    const rows = logs.map(l => `${l.time},"${l.type}","${l.path}",${l.severity}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ramzon-error-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleRunDiagnostics = () => {
    setDiagRunning(true);
    setDiagProgress(0);
    setDiagDone(false);
    setShowDiagModal(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setDiagProgress(step);
      if (step >= DIAGNOSTIC_CHECKS.length) {
        clearInterval(interval);
        setDiagRunning(false);
        setDiagDone(true);
      }
    }, 350);
  };

  /* ── Access guard ─────────────────────────────────────────────────────── */
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center shadow-inner">
          <Lock size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 font-medium max-w-sm">System Health monitoring is reserved for Admin accounts only.</p>
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <>
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
          <p className="text-slate-500 text-sm">Monitor server performance, security incidents and logs</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Debug toggle */}
          <button
            type="button"
            onClick={() => setDebugMode(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm active:scale-95 ${
              debugMode
                ? 'bg-amber-500 text-white border-amber-500 shadow-amber-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bug size={15} className={debugMode ? 'animate-pulse' : ''} />
            Debug {debugMode ? 'ON' : 'OFF'}
            {debugMode && (
              <span className="flex items-center gap-1 text-[9px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">
                <BellRing size={10} /> live
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportLogs}
            className="bg-white border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <FileSearch size={16} /> Export Error Log
          </button>
          <button
            type="button"
            onClick={handleRunDiagnostics}
            disabled={diagRunning}
            className="bg-brand-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-xl active:scale-95 disabled:opacity-70"
          >
            <RefreshCcw size={16} className={diagRunning ? 'animate-spin' : ''} />
            {diagRunning ? 'Running…' : 'Run Diagnostics'}
          </button>
        </div>
      </div>

      {/* Debug info bar */}
      {debugMode && (
        <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800 animate-in slide-in-from-top-2 duration-300">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          Debug mode active — error logs poll every 30 seconds. New entries appear as notification prompts in the top-right corner.
          <button type="button" onClick={() => fetchLogs(true)} className="ml-auto text-amber-600 hover:text-amber-900 font-black uppercase tracking-widest text-[10px]">
            Refresh now
          </button>
        </div>
      )}

      {/* Stat cards — real data from /api/system-stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(() => {
          const loading = statsLoading || logsLoading;
          const latency = stats?.dbLatencyMs ?? null;
          const blocks  = stats?.rateLimitBlocks ?? null;
          const err24   = stats?.errors24h ?? null;
          const dbMb    = stats?.dbSizeMb ?? null;

          const cards = [
            {
              label: 'DB Latency',
              value: loading ? '…' : latency !== null ? `${latency}ms` : '—',
              status: latency === null ? 'Unavailable' : latency < 100 ? 'Optimal' : latency < 300 ? 'Acceptable' : 'Slow',
              icon: Database,
              color: latency !== null && latency >= 300 ? 'text-red-500' : latency !== null && latency >= 100 ? 'text-amber-500' : 'text-purple-500',
              bg:    latency !== null && latency >= 300 ? 'bg-red-50'   : latency !== null && latency >= 100 ? 'bg-amber-50'   : 'bg-purple-50',
              dot:   latency !== null && latency >= 300 ? 'bg-red-500'  : 'bg-green-500',
            },
            {
              label: 'Rate Limit Blocks',
              value: loading ? '…' : blocks !== null ? String(blocks) : '—',
              status: blocks === 0 ? 'No active blocks' : blocks === 1 ? '1 IP blocked' : `${blocks} IPs blocked`,
              icon: ShieldCheck,
              color: blocks !== null && blocks > 0 ? 'text-amber-500' : 'text-blue-500',
              bg:    blocks !== null && blocks > 0 ? 'bg-amber-50'   : 'bg-blue-50',
              dot:   blocks !== null && blocks > 0 ? 'bg-amber-500'  : 'bg-green-500',
            },
            {
              label: 'Errors (24h)',
              value: loading ? '…' : err24 !== null ? String(err24) : '—',
              status: err24 === 0 ? 'All clear' : err24 === 1 ? '1 error logged' : `${err24} errors logged`,
              icon: Activity,
              color: err24 !== null && err24 > 0 ? 'text-red-500' : 'text-green-500',
              bg:    err24 !== null && err24 > 0 ? 'bg-red-50'   : 'bg-green-50',
              dot:   err24 !== null && err24 > 0 ? 'bg-red-500'  : 'bg-green-500',
            },
            {
              label: 'DB Size',
              value: loading ? '…' : dbMb !== null ? `${dbMb} MB` : '—',
              status: dbMb !== null ? `${Math.min(100, Math.round(dbMb / 5.12))}% of 512MB` : 'Unavailable',
              icon: HardDrive,
              color: 'text-slate-600',
              bg: 'bg-slate-50',
              dot: 'bg-green-500',
            },
          ];

          return cards.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} shadow-inner shrink-0`}>
                <stat.icon size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${stat.dot}`} />
                  <span className="text-[10px] font-bold text-slate-500">{stat.status}</span>
                </div>
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Tabbed panel: Error Log + User Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('errors')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    activeTab === 'errors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Activity size={13} /> Error Log
                  {logs.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'errors' ? 'bg-red-50 text-red-600' : 'bg-slate-200 text-slate-500'}`}>{logs.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    activeTab === 'activity' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Users size={13} /> User Activity
                  {auditLogs.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'activity' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{auditLogs.length}</span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'errors' && (
                  <>
                    <span className={`w-2 h-2 rounded-full ${debugMode ? 'bg-amber-500 animate-ping' : 'bg-red-500 animate-ping'}`} />
                    <span className={`text-[10px] font-bold uppercase ${debugMode ? 'text-amber-600' : 'text-red-600'}`}>{debugMode ? 'Debug' : 'Live'}</span>
                  </>
                )}
                {activeTab === 'activity' && (
                  <button type="button" onClick={fetchAuditLogs} title="Refresh" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                    <RefreshCcw size={13} className={auditLoading ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>
            </div>

            {/* Error log tab */}
            {activeTab === 'errors' && (
              <>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-16 text-slate-400">
                    <RefreshCcw size={20} className="animate-spin mr-2" />
                    <span className="text-sm font-bold">Loading logs…</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                    <CheckCircle size={32} className="text-emerald-400" />
                    <p className="text-sm font-black text-slate-500">No errors logged</p>
                    <p className="text-[10px] text-slate-400 font-medium">System is running clean</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {logs.slice(0, 20).map((log) => (
                      <div key={log.id} className="px-6 py-4 flex items-center justify-between text-xs group hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-slate-400 font-mono font-bold shrink-0">{log.time}</span>
                          <div className="flex flex-col min-w-0">
                            <span className={`font-black text-sm tracking-tight truncate ${log.severity === 'High' ? 'text-red-600' : 'text-slate-900'}`}>{log.type}</span>
                            <span className="text-slate-400 truncate max-w-[220px] font-bold italic">{log.path}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ml-3 ${
                          log.severity === 'High'   ? 'bg-red-100 text-red-700' :
                          log.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>{log.severity}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-4 bg-slate-50/30 border-t border-slate-50 text-center">
                  <button type="button" onClick={handleExportLogs} className="text-xs font-black text-slate-500 hover:text-brand-primary transition-colors">
                    Download Full Log CSV →
                  </button>
                </div>
              </>
            )}

            {/* User activity tab */}
            {activeTab === 'activity' && (() => {
              const ACTION_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
                login:   { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
                create:  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                update:  { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
                delete:  { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
              };

              const fmt = (ts: string) => {
                const d = new Date(ts);
                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + d.toTimeString().slice(0, 8);
              };

              return auditLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <RefreshCcw size={20} className="animate-spin mr-2" />
                  <span className="text-sm font-bold">Loading activity…</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <ClipboardList size={32} className="text-slate-300" />
                  <p className="text-sm font-black text-slate-500">No activity recorded yet</p>
                  <p className="text-[10px] text-slate-400 font-medium">Actions will appear here as users interact with the system</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                    {auditLogs.map((log) => {
                      const style = ACTION_STYLE[log.action] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
                      return (
                        <div key={log.id} className="px-6 py-3.5 flex items-center gap-4 text-xs hover:bg-slate-50 transition-colors">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                          <span className="text-slate-400 font-mono font-bold shrink-0 w-36">{fmt(log.ts)}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${style.bg} ${style.text}`}>{log.action}</span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-bold text-slate-900 truncate">{log.userName}</span>
                            <span className="text-slate-400 truncate">{log.resource}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ''}</span>
                          </div>
                          {log.ip && log.ip !== 'unknown' && (
                            <span className="text-[10px] text-slate-300 font-mono shrink-0">{log.ip}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">{auditLogs.length} events</span>
                    <button
                      type="button"
                      onClick={() => {
                        const header = 'Time,User,Action,Resource,ResourceID,IP';
                        const csvRows = auditLogs.map(l => `"${fmt(l.ts)}","${l.userName}",${l.action},${l.resource},${l.resourceId},"${l.ip}"`);
                        const csv = [header, ...csvRows].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ramzon-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(url), 0);
                      }}
                      className="text-xs font-black text-slate-500 hover:text-brand-primary transition-colors"
                    >
                      Download Audit CSV →
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">DB Metrics</h3>
              {!statsLoading && stats && (
                <button type="button" onClick={fetchStats} title="Refresh metrics" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                  <RefreshCcw size={13} />
                </button>
              )}
            </div>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <RefreshCcw size={16} className="animate-spin" />
                <span className="text-xs font-bold">Loading…</span>
              </div>
            ) : stats ? (() => {
              const connPct  = Math.min(100, Math.round((stats.activeConnections / 10) * 100));
              const errPct   = Math.min(100, Math.round((stats.errors24h / 50) * 100));
              const sizePct  = Math.min(100, Math.round((stats.dbSizeMb / 512) * 100));
              const bars = [
                { label: 'Active connections', val: connPct, display: `${stats.activeConnections} / 10`, icon: PlugZap, color: connPct > 80 ? 'bg-red-500' : 'bg-blue-600' },
                { label: 'Errors (24h)',        val: errPct,  display: `${stats.errors24h} errors`,      icon: Activity, color: errPct > 50 ? 'bg-red-500' : errPct > 20 ? 'bg-amber-500' : 'bg-purple-600' },
                { label: 'DB storage',          val: sizePct, display: `${stats.dbSizeMb} MB / 512 MB`,  icon: HardDrive, color: sizePct > 80 ? 'bg-red-500' : 'bg-green-600' },
              ];
              return (
                <div className="space-y-6">
                  {bars.map((m) => (
                    <div key={m.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                          <m.icon size={14} /> {m.label}
                        </div>
                        <span className="text-xs font-black text-slate-900">{m.display}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full ${m.color} transition-all duration-1000 ease-out`} style={{ width: `${m.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })() : (
              <p className="text-xs text-slate-400 text-center py-8">Could not load metrics</p>
            )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Master Security</h4>
            <p className="text-white text-sm font-bold leading-relaxed mb-6">
              {logs.filter(l => l.severity === 'High').length === 0
                ? 'System integrity is 100%. No critical errors in the log.'
                : `${logs.filter(l => l.severity === 'High').length} critical error(s) detected — review required.`}
            </p>
            <button
              type="button"
              onClick={() => setShowSecurityModal(true)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black transition-all border border-white/10 active:scale-95"
            >
              Security Audit
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ── Toast notification stack (top-right) ──────────────────────────── */}
    <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>

    {/* ── Diagnostics Modal ────────────────────────────────────────────── */}
    {showDiagModal && (
      <div className="fixed inset-0 z-[900] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">System Diagnostics</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {diagRunning
                  ? `Running checks… (${diagProgress}/${DIAGNOSTIC_CHECKS.length})`
                  : `Completed — ${passCount} pass · ${warnCount} warn · ${failCount} fail`}
              </p>
            </div>
            {diagDone && (
              <button type="button" onClick={() => setShowDiagModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            )}
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary transition-all duration-300 ease-out"
              style={{ width: `${(diagProgress / DIAGNOSTIC_CHECKS.length) * 100}%` }}
            />
          </div>

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
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
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
              type="button"
              onClick={() => setShowDiagModal(false)}
              className="w-full py-3 bg-brand-primary text-white rounded-xl text-sm font-black hover:opacity-90 transition-all active:scale-95"
            >
              Close
            </button>
          )}
        </div>
      </div>
    )}

    {/* ── Security Audit Modal ─────────────────────────────────────────── */}
    {showSecurityModal && (
      <div className="fixed inset-0 z-[900] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Security Audit Report</h2>
            <button type="button" onClick={() => setShowSecurityModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Rate-limited login attempts (24h)', value: String(stats?.loginAttempts24h ?? '—'), ok: (stats?.loginAttempts24h ?? 0) < 10 },
              { label: 'Locked-out rate-limit keys',        value: String(stats?.rateLimitBlocks ?? '—'),  ok: (stats?.rateLimitBlocks ?? 0) === 0 },
              { label: 'Errors logged (24h)',               value: String(stats?.errors24h ?? '—'),        ok: (stats?.errors24h ?? 0) === 0 },
              { label: 'Recent admin actions logged',       value: String(auditLogs.length),               ok: true },
              { label: 'Error log entries (recent)',        value: String(logs.length), ok: logs.length === 0 },
              { label: 'Critical errors',                   value: String(logs.filter(l => l.severity === 'High').length), ok: logs.filter(l => l.severity === 'High').length === 0 },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <span className="text-xs font-bold text-slate-600">{row.label}</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${row.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${logs.filter(l => l.severity === 'High').length === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {logs.filter(l => l.severity === 'High').length === 0
              ? <><CheckCircle size={16} /> System integrity is 100%. No critical threats detected.</>
              : <><XCircle size={16} /> Critical errors found — review required.</>}
          </div>
          <button
            type="button"
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
