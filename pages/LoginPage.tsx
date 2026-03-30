
import React, { useState, useContext } from 'react';
import { TrendingUp, BarChart3, ArrowUpRight, DollarSign, PieChart, Eye, EyeOff } from 'lucide-react';
import { LanguageContext } from '../lib/context';
import { useAuth } from '../lib/auth';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { companyName, companyLogo } = useContext(LanguageContext);
  const { login } = useAuth();
  const [email, setEmail] = useState(import.meta.env.VITE_DEFAULT_EMAIL ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 md:p-8">
      <div className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        {/* Left Side - Form */}
        <div className="flex-1 p-8 md:p-20 flex flex-col justify-center bg-white relative z-10">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-16">
              {/* Wide landscape logo — geen square */}
              {companyLogo ? (
                <div>
                  <img
                    src={companyLogo}
                    alt="Ramzon Logo"
                    className="h-28 w-auto max-w-[320px] object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-black text-4xl italic tracking-tighter uppercase text-brand-primary">
                    {companyName.substring(0, 2)}
                  </span>
                  <p className="text-xl font-black text-slate-900 uppercase tracking-wide">{companyName}</p>
                </div>
              )}
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Internal ERP System</p>
            </div>
            
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setIsLoading(true);
              try {
                await login(email, password);
                onLogin();
              } catch {
                setError('Invalid email or password');
              } finally {
                setIsLoading(false);
              }
            }}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[10px]">Email Address</label>
                <input 
                  aria-label="E-mailadres"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ramzon.nv"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-accent focus:bg-white outline-none transition-all shadow-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-widest text-[10px]">Password</label>
                </div>
                <div className="relative">
                  <input
                    aria-label="Wachtwoord"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-accent focus:bg-white outline-none transition-all shadow-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs font-bold text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] active:scale-95 mt-6 uppercase tracking-[0.2em] text-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Authenticating...' : 'Authenticate Access'}
              </button>
            </form>

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-center gap-6 text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
              <span className="cursor-default flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></div>
                Secure Gateway Active
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Financial Visual Workspace */}
        <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden p-12 items-center justify-center">
           {/* Background High-End Texture/Photo */}
           <div className="absolute inset-0 z-0 opacity-40">
             <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" className="w-full h-full object-cover" alt="Finance BG" />
           </div>
           <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/40 to-slate-950/90 z-[1]"></div>

           {/* Floating Dashboard Mockup */}
           <div className="relative z-10 w-full max-w-lg space-y-6 animate-in slide-in-from-right-12 duration-1000">
             
             {/* Main Chart Card */}
             <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Revenue Performance</p>
                    <h4 className="text-2xl font-black text-white italic">€842,500.00</h4>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-accent/20 text-brand-accent rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-accent/30">
                    <TrendingUp size={14} /> +24% YTD
                  </div>
                </div>

                {/* SVG Graph Simulation */}
                <div className="h-48 w-full relative group">
                  <svg viewBox="0 0 400 150" className="w-full h-full drop-shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
                    <path 
                      d="M0,130 C40,110 80,140 120,90 C160,40 200,80 240,40 C280,0 320,50 360,20 L400,10" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="6" 
                      className="text-brand-accent transition-all duration-1000"
                      strokeLinecap="round"
                    />
                    <path 
                      d="M0,130 C40,110 80,140 120,90 C160,40 200,80 240,40 C280,0 320,50 360,20 L400,10 V150 H0 Z" 
                      fill="url(#grad)" 
                      className="opacity-20"
                    />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'var(--brand-accent)', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Floating Indicator */}
                  <div className="absolute top-4 right-10 flex flex-col items-center animate-bounce">
                    <div className="bg-white px-3 py-1 rounded-lg shadow-xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-900">Current Goal</span>
                    </div>
                    <div className="w-px h-8 bg-white/40"></div>
                    <div className="w-2 h-2 rounded-full bg-white shadow-glow"></div>
                  </div>
                </div>

                <div className="flex justify-between mt-6 px-2">
                   {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                     <span key={m} className="text-[9px] font-black text-white/40 uppercase tracking-widest">{m}</span>
                   ))}
                </div>
             </div>

             {/* Small KPI Side-by-Side */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Avg. Ticket</p>
                    <p className="text-sm font-black text-white italic">€4,250</p>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <PieChart size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Market Share</p>
                    <p className="text-sm font-black text-white italic">12.5%</p>
                  </div>
                </div>
             </div>

             <div className="pt-4 flex justify-center">
               <div className="px-4 py-2 rounded-full border border-white/5 bg-white/5 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Real-time Ledger Synchronized</span>
               </div>
             </div>
           </div>

           {/* Animated Circles/Effects */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/10 rounded-full blur-[120px] animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
