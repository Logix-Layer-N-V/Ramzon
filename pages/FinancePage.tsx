import React, { useState, useMemo } from 'react';
import { Landmark, Globe2, Plus, Check, X, TrendingUp, TrendingDown, Wallet, DollarSign, Filter, Download, FileSpreadsheet, FileText, ChevronDown, ArrowDownLeft } from 'lucide-react';
import { storage, toSRD } from '../lib/storage';
import { exportCSV } from '../lib/csvExport';
import type { BankAccount, ExchangeRate } from '../types';

const BANK_ACCOUNTS_DEFAULT: BankAccount[] = [
  { id: 'dsb_srd', bank: 'DSB Bank', currency: 'SRD', iban: 'SR29DSB0000001234', balance: 45230 },
  { id: 'dsb_usd', bank: 'DSB Bank', currency: 'USD', iban: 'SR29DSB0000001235', balance: 12800 },
  { id: 'dsb_eur', bank: 'DSB Bank', currency: 'EUR', iban: 'SR29DSB0000001236', balance: 9500 },
  { id: 'hkb_srd', bank: 'HKB Hakrinbank', currency: 'SRD', iban: 'SR29HKB0000005678', balance: 31200 },
  { id: 'hkb_usd', bank: 'HKB Hakrinbank', currency: 'USD', iban: 'SR29HKB0000005679', balance: 7400 },
  { id: 'hkb_eur', bank: 'HKB Hakrinbank', currency: 'EUR', iban: 'SR29HKB0000005680', balance: 4100 },
  { id: 'cash_srd', bank: 'Cash', currency: 'SRD', iban: '—', balance: 1500 },
  { id: 'cash_usd', bank: 'Cash', currency: 'USD', iban: '—', balance: 300 },
  { id: 'cash_eur', bank: 'Cash', currency: 'EUR', iban: '—', balance: 150 },
];

const EXCHANGE_RATES_DEFAULT: ExchangeRate[] = [
  { id: 'r1', date: '2026-03-05', usdSrd: 36.50, eurSrd: 39.80, eurUsd: 1.09 },
  { id: 'r2', date: '2026-03-04', usdSrd: 36.45, eurSrd: 39.75, eurUsd: 1.09 },
  { id: 'r3', date: '2026-03-03', usdSrd: 36.40, eurSrd: 39.70, eurUsd: 1.08 },
];

const CURRENCY_COLORS: Record<string, string> = {
  SRD: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  USD: 'bg-blue-50 text-blue-700 border-blue-100',
  EUR: 'bg-purple-50 text-purple-700 border-purple-100',
  USDT: 'bg-amber-50 text-amber-700 border-amber-100',
};

const BANK_COLORS: Record<string, string> = {
  'DSB Bank': 'bg-brand-primary',
  'HKB Hakrinbank': 'bg-emerald-600',
  'Cash': 'bg-brand-primary',
};

type FinanceTab = 'accounts' | 'transactions' | 'rates';

function getAccounts(): BankAccount[] {
  const saved = storage.bankAccounts.get();
  if (!saved.length) { storage.bankAccounts.save(BANK_ACCOUNTS_DEFAULT); return BANK_ACCOUNTS_DEFAULT; }
  // Migrate: rename old "Petty Cash" → "Cash"
  const migrated = saved.map(a => a.bank === 'Petty Cash' ? { ...a, bank: 'Cash' } : a);
  if (migrated.some((a, i) => a.bank !== saved[i].bank)) storage.bankAccounts.save(migrated);
  return migrated;
}
function getRates(): ExchangeRate[] {
  const saved = storage.exchangeRates.get();
  if (!saved.length) { storage.exchangeRates.save(EXCHANGE_RATES_DEFAULT); return EXCHANGE_RATES_DEFAULT; }
  return saved;
}

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('accounts');
  const [accounts, setAccounts] = useState<BankAccount[]>(getAccounts);
  const [rates, setRates] = useState<ExchangeRate[]>(getRates);
  const [refresh, setRefresh] = useState(0);

  // Filter state (accounts tab)
  const [filterBank, setFilterBank] = useState('Alle');
  const [filterCurrency, setFilterCurrency] = useState('Alle');
  const [filterType, setFilterType] = useState('Alle');
  const [showExport, setShowExport] = useState(false);

  // Filter state (transactions tab)
  const [txFilterBank, setTxFilterBank] = useState('Alle');
  const [txFilterCurrency, setTxFilterCurrency] = useState('Alle');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');

  const uniqueBanks = ['Alle', ...Array.from(new Set(BANK_ACCOUNTS_DEFAULT.map(a => a.bank)))];

  // Load all payments for transactions tab
  const allPayments = useMemo(() => storage.payments.get().sort((a, b) => b.date.localeCompare(a.date)), [refresh]);

  const filteredAccounts = useMemo(() => accounts.filter(acc => {
    const bankOk = filterBank === 'Alle' || acc.bank === filterBank;
    const currOk = filterCurrency === 'Alle' || acc.currency === filterCurrency;
    const isCash = acc.bank === 'Cash';
    const typeOk = filterType === 'Alle' || (filterType === 'Cash' ? isCash : !isCash);
    return bankOk && currOk && typeOk;
  }), [accounts, filterBank, filterCurrency, filterType]);

  const filteredTransactions = useMemo(() => allPayments.filter(p => {
    const acct = accounts.find(a => a.id === p.bankAccountId);
    const bankOk = txFilterBank === 'Alle' || acct?.bank === txFilterBank;
    const currOk = txFilterCurrency === 'Alle' || p.currency === txFilterCurrency;
    const fromOk = !txDateFrom || p.date >= txDateFrom;
    const toOk = !txDateTo || p.date <= txDateTo;
    return bankOk && currOk && fromOk && toOk;
  }), [allPayments, txFilterBank, txFilterCurrency, txDateFrom, txDateTo, accounts]);

  // Add account
  const [addingAccount, setAddingAccount] = useState(false);
  const [newBank, setNewBank] = useState('DSB Bank');
  const [newCurrency, setNewCurrency] = useState('SRD');
  const [newIban, setNewIban] = useState('');
  const [newBalance, setNewBalance] = useState('');

  // Add rate
  const [addingRate, setAddingRate] = useState(false);
  const [rateDate, setRateDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateUsdSrd, setRateUsdSrd] = useState('');
  const [rateEurSrd, setRateEurSrd] = useState('');
  const [rateEurUsd, setRateEurUsd] = useState('');

  const handleAddAccount = () => {
    if (!newIban || !newBalance) return;
    const updated = [...accounts, { id: `acc_${Date.now()}`, bank: newBank, currency: newCurrency, iban: newIban, balance: +newBalance }];
    setAccounts(updated); storage.bankAccounts.save(updated);
    setNewBank('DSB Bank'); setNewCurrency('SRD'); setNewIban(''); setNewBalance('');
    setAddingAccount(false);
  };

  const handleAddRate = () => {
    if (!rateDate || !rateUsdSrd) return;
    const updated = [{ id: `r${Date.now()}`, date: rateDate, usdSrd: +rateUsdSrd, eurSrd: +rateEurSrd, eurUsd: +rateEurUsd }, ...rates];
    setRates(updated); storage.exchangeRates.save(updated);
    setRateDate(''); setRateUsdSrd(''); setRateEurSrd(''); setRateEurUsd('');
    setAddingRate(false);
  };

  // Summary stats (from live accounts)
  const totalBySRD = accounts.filter(a => a.currency === 'SRD').reduce((s, a) => s + a.balance, 0);
  const totalByUSD = accounts.filter(a => a.currency === 'USD').reduce((s, a) => s + a.balance, 0);
  const totalByEUR = accounts.filter(a => a.currency === 'EUR').reduce((s, a) => s + a.balance, 0);
  const latestRate = rates.sort((a, b) => b.date.localeCompare(a.date))[0];

  const handleExportAccounts = () => {
    exportCSV(`accounts-${new Date().toISOString().slice(0,10)}.csv`,
      filteredAccounts.map(a => ({ Bank: a.bank, IBAN: a.iban, Currency: a.currency, Type: a.bank === 'Cash' ? 'Cash' : 'Bank', Balance: a.balance }))
    );
    setShowExport(false);
  };

  const handleExportTransactions = () => {
    exportCSV(`transactions-${new Date().toISOString().slice(0,10)}.csv`,
      filteredTransactions.map(p => {
        const acct = accounts.find(a => a.id === p.bankAccountId);
        return { Date: p.date, Reference: p.reference, Bank: acct?.bank || p.bankAccountId, Amount: p.amount, Currency: p.currency, ExchangeRate: p.exchangeRate || 1, AmountSRD: toSRD(p.amount, p.currency), Method: p.method, InvoiceId: p.invoiceId || '', Status: p.status };
      })
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Interne Finance</h1>
          <p className="text-sm font-medium text-slate-500 italic">Bank rekeningen, kas beheer & wisselkoersen</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total SRD', value: `SRD ${totalBySRD.toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total USD', value: `USD ${totalByUSD.toLocaleString()}`, icon: DollarSign, color: 'text-brand-primary', bg: 'bg-brand-accent-light' },
          { label: 'Total EUR', value: `EUR ${totalByEUR.toLocaleString()}`, icon: Globe2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
              <card.icon size={22}/>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live rate bar */}
      {latestRate && (
        <div className="bg-brand-accent rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2">
            <Globe2 size={14} className="text-white/50"/>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Rates as of {latestRate.date}</span>
          </div>
          {[
            { label: 'USD → SRD', value: latestRate.usdSrd.toFixed(2) },
            { label: 'EUR → SRD', value: latestRate.eurSrd.toFixed(2) },
            { label: 'EUR → USD', value: latestRate.eurUsd.toFixed(2) },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-white/40">{r.label}</span>
              <span className="text-sm font-black text-white">{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 w-fit shadow-inner">
        {[
          { id: 'accounts', label: 'Bank & Cash', icon: Landmark },
          { id: 'transactions', label: 'Transactions', icon: ArrowDownLeft },
          { id: 'rates', label: 'Exchange Rates', icon: Globe2 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as FinanceTab)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'}`}>
            <tab.icon size={14} className={activeTab === tab.id ? 'text-white' : 'opacity-40'}/>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACCOUNTS TAB */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between bg-slate-50/30">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Landmark size={13}/> Bank & Cash Accounts
            </h3>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5">
                <Filter size={11} className="text-slate-400"/>
                <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                  {uniqueBanks.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                {['Alle','SRD','USD','EUR'].map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                {['Alle','Bank','Cash'].map(t => <option key={t}>{t}</option>)}
              </select>
              {(filterBank !== 'Alle' || filterCurrency !== 'Alle' || filterType !== 'Alle') && (
                <button onClick={() => { setFilterBank('Alle'); setFilterCurrency('Alle'); setFilterType('Alle'); }} className="px-2 py-1 bg-brand-primary text-white rounded-lg text-[9px] font-black flex items-center gap-1">
                  <X size={10}/> Reset
                </button>
              )}
              <div className="relative">
                <button onClick={() => setShowExport(!showExport)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-black hover:opacity-90 transition-all">
                  <Download size={12}/> Export <ChevronDown size={10}/>
                </button>
                {showExport && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-10 min-w-[160px] overflow-hidden">
                    <button onClick={handleExportAccounts} className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50">
                      <FileText size={13} className="text-emerald-600"/> Export CSV
                    </button>
                    <button onClick={() => setShowExport(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black text-slate-400 hover:bg-slate-50">
                      <FileSpreadsheet size={13} className="text-blue-500"/> Excel (binnenkort)
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => setAddingAccount(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800">
                <Plus size={12}/> Rekening
              </button>
            </div>
          </div>
          <div className="px-6 py-2 bg-slate-50/30 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {filteredAccounts.length} van {accounts.length} rekeningen getoond
          </div>

          {addingAccount && (
            <div className="p-4 border-b border-slate-100 bg-blue-50/20">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Bank</label>
                  <select value={newBank} onChange={e => setNewBank(e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none bg-white">
                    <option>DSB Bank</option><option>HKB Hakrinbank</option><option>Cash</option><option>Overig</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Currency</label>
                  <select value={newCurrency} onChange={e => setNewCurrency(e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none bg-white">
                    <option>SRD</option><option>USD</option><option>EUR</option><option>USDT</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">IBAN / Ref</label>
                  <input value={newIban} onChange={e => setNewIban(e.target.value)} placeholder="SR29..." className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"/>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Opening Balance</label>
                  <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} placeholder="0" className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"/>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddAccount} className="flex-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black"><Check size={14}/></button>
                  <button onClick={() => setAddingAccount(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black"><X size={14}/></button>
                </div>
              </div>
            </div>
          )}

          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="text-left px-6 py-3">Bank</th>
                <th className="text-left px-4 py-3">IBAN</th>
                <th className="text-center px-4 py-3">Currency</th>
                <th className="text-right px-6 py-3">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${BANK_COLORS[acc.bank] || 'bg-slate-300'}`}></div>
                      <span className="font-bold text-slate-900">{acc.bank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-400 text-[10px]">{acc.iban}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${CURRENCY_COLORS[acc.currency] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>{acc.currency}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right font-black text-slate-900">{acc.currency} {acc.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between bg-slate-50/30">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ArrowDownLeft size={13}/> Transactions
            </h3>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={txFilterBank} onChange={e => setTxFilterBank(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                {uniqueBanks.map(b => <option key={b}>{b}</option>)}
              </select>
              <select value={txFilterCurrency} onChange={e => setTxFilterCurrency(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                {['All','SRD','USD','EUR','USDT'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="date" value={txDateFrom} onChange={e => setTxDateFrom(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold outline-none bg-white text-slate-700" placeholder="From"/>
              <input type="date" value={txDateTo} onChange={e => setTxDateTo(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold outline-none bg-white text-slate-700" placeholder="To"/>
              <button onClick={handleExportTransactions} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-black hover:opacity-90">
                <Download size={12}/> CSV
              </button>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ArrowDownLeft size={32} className="mx-auto mb-3 opacity-20"/>
              <p className="text-sm font-bold">No transactions recorded yet</p>
              <p className="text-xs mt-1">Add payments via the Invoice detail or Payments page.</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-4 py-3">Reference</th>
                  <th className="text-left px-4 py-3">Bank / Account</th>
                  <th className="text-center px-4 py-3">Method</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-right px-5 py-3">In SRD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.map(p => {
                  const acct = accounts.find(a => a.id === p.bankAccountId);
                  const srdAmt = toSRD(p.amount, p.currency);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-700">{p.date}</td>
                      <td className="px-4 py-3.5 font-mono text-[10px] text-slate-500">{p.reference}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-5 rounded-full ${BANK_COLORS[acct?.bank || ''] || 'bg-slate-300'}`}/>
                          <div>
                            <p className="font-bold text-slate-900">{acct?.bank || p.bankAccountId}</p>
                            <p className="text-[10px] text-slate-400">{acct?.iban || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-600">{p.method}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${CURRENCY_COLORS[p.currency] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>{p.currency}</span>
                        <span className="ml-2 font-black text-slate-900">{p.amount.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-emerald-700">SRD {srdAmt.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={5} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</td>
                  <td className="px-5 py-3 text-right font-black text-slate-900">
                    SRD {filteredTransactions.reduce((s, p) => s + toSRD(p.amount, p.currency), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* RATES TAB */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Globe2 size={13}/> Daily Exchange Rates
            </h3>
            <button onClick={() => setAddingRate(!addingRate)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800">
              <Plus size={12}/> Add Rate
            </button>
          </div>

          {addingRate && (
            <div className="p-4 border-b border-slate-100 bg-slate-50/40">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Date</label>
                  <input type="date" value={rateDate} onChange={e => setRateDate(e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"/>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">USD → SRD</label>
                  <input type="number" step="0.01" value={rateUsdSrd} onChange={e => setRateUsdSrd(e.target.value)} placeholder="36.50" className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"/>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">EUR → SRD</label>
                  <input type="number" step="0.01" value={rateEurSrd} onChange={e => setRateEurSrd(e.target.value)} placeholder="39.80" className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"/>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">EUR → USD</label>
                  <input type="number" step="0.01" value={rateEurUsd} onChange={e => setRateEurUsd(e.target.value)} placeholder="1.09" className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"/>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddRate} className="flex-1 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-black hover:opacity-90">Save</button>
                  <button onClick={() => setAddingRate(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black"><X size={14}/></button>
                </div>
              </div>
            </div>
          )}

          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-right px-6 py-3">USD → SRD</th>
                <th className="text-right px-6 py-3">EUR → SRD</th>
                <th className="text-right px-6 py-3">EUR → USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rates.sort((a, b) => b.date.localeCompare(a.date)).map((r, i) => {
                const sorted = [...rates].sort((a, b) => b.date.localeCompare(a.date));
                const prev = sorted[i + 1];
                const usdChange = prev ? r.usdSrd - prev.usdSrd : 0;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{r.date}</td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {usdChange !== 0 && (usdChange > 0
                          ? <TrendingUp size={11} className="text-emerald-500"/>
                          : <TrendingDown size={11} className="text-red-400"/>
                        )}
                        <span className="font-mono font-bold text-slate-700">{r.usdSrd.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-700">{r.eurSrd.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-700">{r.eurUsd.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
