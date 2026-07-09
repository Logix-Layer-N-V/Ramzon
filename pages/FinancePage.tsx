import React, { useState, useMemo } from 'react';
import { Landmark, Globe2, Plus, Check, X, TrendingUp, TrendingDown, Wallet, DollarSign, Filter, Download, FileSpreadsheet, FileText, ChevronDown, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Minus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { usePayments } from '../lib/hooks/usePayments';
import { useBankAccounts, useCreateBankAccount, useUpdateBankAccount, useDeleteBankAccount } from '../lib/hooks/useBankAccounts';
import type { BankAccountRow } from '../lib/hooks/useBankAccounts';
import { useBankTransactions, useCreateBankTransaction, useDeleteBankTransaction } from '../lib/hooks/useBankTransactions';
import { useExchangeRates, useCreateExchangeRate, useDeleteExchangeRate } from '../lib/hooks/useExchangeRates';
import { exportCSV } from '../lib/csvExport';

const KNOWN_BANKS = ['DSB Bank', 'HKB Hakrinbank', 'Cash', 'Other'];

const CURRENCY_COLORS: Record<string, string> = {
  SRD: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  USD: 'bg-blue-50 text-blue-700 border-blue-100',
  EUR: 'bg-purple-50 text-purple-700 border-purple-100',
};

const BANK_COLORS: Record<string, string> = {
  'DSB Bank': 'bg-brand-primary',
  'HKB Hakrinbank': 'bg-emerald-600',
  'Cash': 'bg-brand-primary',
};

const TX_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; sign: string }> = {
  deposit:    { icon: ArrowDownLeft,   color: 'text-emerald-600', bg: 'bg-emerald-50',  label: 'Deposit',    sign: '+' },
  withdrawal: { icon: ArrowUpRight,    color: 'text-red-500',     bg: 'bg-red-50',      label: 'Withdrawal', sign: '-' },
  fee:        { icon: Minus,           color: 'text-amber-600',   bg: 'bg-amber-50',    label: 'Bank Fee',   sign: '-' },
  transfer:   { icon: ArrowRightLeft,  color: 'text-blue-600',    bg: 'bg-blue-50',     label: 'Transfer',   sign: '±' },
};

type FinanceTab = 'accounts' | 'transactions' | 'rates';

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('accounts');

  const { data: accounts = [] } = useBankAccounts();
  const { data: rates = [] } = useExchangeRates();
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const deleteAccount = useDeleteBankAccount();
  const createRate = useCreateExchangeRate();
  const deleteRate = useDeleteExchangeRate();

  // Detail account state declared early so useBankTransactions can reference it
  const [detailAccount, setDetailAccount] = useState<BankAccountRow | null>(null);

  // Bank transactions for detail modal — only fetched when a detail account is open
  const { data: bankTxs = [] } = useBankTransactions(detailAccount?.id);
  const createTx = useCreateBankTransaction();
  const deleteTx = useDeleteBankTransaction();

  // Filter state (accounts tab)
  const [filterBank, setFilterBank] = useState('All');
  const [filterCurrency, setFilterCurrency] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [showExport, setShowExport] = useState(false);

  // Filter state (transactions tab)
  const [txFilterBank, setTxFilterBank] = useState('All');
  const [txFilterCurrency, setTxFilterCurrency] = useState('All');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');

  const uniqueBanks = useMemo(() => ['All', ...Array.from(new Set(accounts.map(a => a.bank)))], [accounts]);

  // Load all payments for transactions tab
  const { data: rawPayments = [] } = usePayments();
  const allPayments = useMemo(() => [...rawPayments].sort((a, b) => b.date.localeCompare(a.date)), [rawPayments]);

  // Each payment carries the SRD rate locked in when it was recorded — use that
  // instead of today's rate so historical totals don't drift as rates change.
  const toSRD = (amount: number, currency: string, exchangeRate?: number) =>
    currency === 'SRD' ? amount : amount * (exchangeRate || 1);

  const filteredAccounts = useMemo(() => accounts.filter(acc => {
    const bankOk = filterBank === 'All' || acc.bank === filterBank;
    const currOk = filterCurrency === 'All' || acc.currency === filterCurrency;
    const isCash = acc.bank === 'Cash';
    const typeOk = filterType === 'All' || (filterType === 'Cash' ? isCash : !isCash);
    return bankOk && currOk && typeOk;
  }), [accounts, filterBank, filterCurrency, filterType]);

  const filteredTransactions = useMemo(() => allPayments.filter(p => {
    const acct = accounts.find(a => a.id === p.bankAccountId);
    const bankOk = txFilterBank === 'All' || acct?.bank === txFilterBank;
    const currOk = txFilterCurrency === 'All' || p.currency === txFilterCurrency;
    const fromOk = !txDateFrom || p.date >= txDateFrom;
    const toOk = !txDateTo || p.date <= txDateTo;
    return bankOk && currOk && fromOk && toOk;
  }), [allPayments, txFilterBank, txFilterCurrency, txDateFrom, txDateTo, accounts]);

  // Account actions menu
  const [menuAccId, setMenuAccId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // Edit account
  const [editAccount, setEditAccount] = useState<BankAccountRow | null>(null);
  const [editBank, setEditBank] = useState('');
  const [editIban, setEditIban] = useState('');
  const [editBalance, setEditBalance] = useState('');

  const openEditAccount = (acc: BankAccountRow) => {
    setEditAccount(acc);
    setEditBank(acc.bank);
    setEditIban(acc.iban);
    setEditBalance(String(acc.balance));
    setMenuAccId(null);
  };

  const handleSaveEdit = () => {
    if (!editAccount) return;
    updateAccount.mutate({ id: editAccount.id, bank: editBank, currency: editAccount.currency, iban: editIban, balance: +editBalance });
    setEditAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    setMenuAccId(null);
    deleteAccount.mutate(id);
  };

  // Add account
  const [addingAccount, setAddingAccount] = useState(false);
  const [newBank, setNewBank] = useState('DSB Bank');
  const [newCurrency, setNewCurrency] = useState('SRD');
  const [newIban, setNewIban] = useState('');
  const [newBalance, setNewBalance] = useState('');

  // Add transaction form (inside detail modal)
  const [addingTx, setAddingTx] = useState(false);
  const [txType, setTxType] = useState<'deposit' | 'withdrawal' | 'fee' | 'transfer'>('deposit');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDesc, setTxDesc] = useState('');
  const [txRef, setTxRef] = useState('');
  const [txToAccId, setTxToAccId] = useState('');

  // Add rate
  const [addingRate, setAddingRate] = useState(false);
  const [rateDate, setRateDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateUsdSrd, setRateUsdSrd] = useState('');
  const [rateEurSrd, setRateEurSrd] = useState('');
  const [rateEurUsd, setRateEurUsd] = useState('');

  const handleAddTransaction = () => {
    if (!detailAccount || !txAmount || !txDate) return;
    createTx.mutate({
      accountId: detailAccount.id,
      type: txType,
      amount: +txAmount,
      date: txDate,
      description: txDesc,
      reference: txRef,
      toAccountId: txType === 'transfer' ? txToAccId : '',
    });
    setAddingTx(false);
    setTxAmount(''); setTxDesc(''); setTxRef(''); setTxToAccId('');
    setTxType('deposit');
  };

  const handleAddAccount = () => {
    if (!newBalance) return;
    createAccount.mutate({ bank: newBank, currency: newCurrency, iban: newIban, balance: +newBalance });
    setNewBank('DSB Bank'); setNewCurrency('SRD'); setNewIban(''); setNewBalance('');
    setAddingAccount(false);
  };

  const handleAddRate = () => {
    if (!rateDate || !rateUsdSrd) return;
    createRate.mutate({ date: rateDate, usdSrd: +rateUsdSrd, eurSrd: +rateEurSrd, eurUsd: +rateEurUsd });
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
        return { Date: p.date, Reference: p.reference, Bank: acct?.bank || p.bankAccountId, Amount: p.amount, Currency: p.currency, ExchangeRate: p.exchangeRate || 1, AmountSRD: toSRD(p.amount, p.currency, p.exchangeRate), Method: p.method, InvoiceId: p.invoiceId || '', Status: p.status };
      })
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Internal Finance</h1>
          <p className="text-sm font-medium text-slate-500 italic">Bank accounts, cash management & exchange rates</p>
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
                <select title="Filter by bank" value={filterBank} onChange={e => setFilterBank(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                  {uniqueBanks.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <select title="Filter by currency" value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                {['All','SRD','USD','EUR'].map(c => <option key={c}>{c}</option>)}
              </select>
              <select title="Filter by type" value={filterType} onChange={e => setFilterType(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                {['All','Bank','Cash'].map(t => <option key={t}>{t}</option>)}
              </select>
              {(filterBank !== 'All' || filterCurrency !== 'All' || filterType !== 'All') && (
                <button type="button" onClick={() => { setFilterBank('All'); setFilterCurrency('All'); setFilterType('All'); }} className="px-2 py-1 bg-brand-primary text-white rounded-lg text-[9px] font-black flex items-center gap-1">
                  <X size={10}/> Reset
                </button>
              )}
              <div className="relative">
                <button type="button" onClick={() => setShowExport(!showExport)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-black hover:opacity-90 transition-all">
                  <Download size={12}/> Export <ChevronDown size={10}/>
                </button>
                {showExport && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-10 min-w-[160px] overflow-hidden">
                    <button type="button" onClick={handleExportAccounts} className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50">
                      <FileText size={13} className="text-emerald-600"/> Export CSV
                    </button>
                    <button type="button" onClick={() => setShowExport(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black text-slate-400 hover:bg-slate-50">
                      <FileSpreadsheet size={13} className="text-blue-500"/> Excel (coming soon)
                    </button>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setAddingAccount(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800">
                <Plus size={12}/> Account
              </button>
            </div>
          </div>
          <div className="px-6 py-2 bg-slate-50/30 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {filteredAccounts.length} OF {accounts.length} ACCOUNTS SHOWN
          </div>

          {addingAccount && (
            <div className="p-4 border-b border-slate-100 bg-blue-50/20">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Bank</label>
                  <select title="Bank name" value={newBank} onChange={e => setNewBank(e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none bg-white">
                    {KNOWN_BANKS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Currency</label>
                  <select title="Currency" value={newCurrency} onChange={e => setNewCurrency(e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none bg-white">
                    <option>SRD</option><option>USD</option><option>EUR</option>
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
                  <button type="button" title="Save account" onClick={handleAddAccount} className="flex-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black"><Check size={14}/></button>
                  <button type="button" title="Cancel" onClick={() => setAddingAccount(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black"><X size={14}/></button>
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
                <th className="px-4 py-3 w-12" aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setDetailAccount(acc)}>
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
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      title="Account actions"
                      onClick={e => {
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const dropW = 180;
                        const menuH = 90;
                        const top = rect.bottom + 4 + menuH > window.innerHeight ? rect.top - menuH - 4 : rect.bottom + 4;
                        const left = Math.max(8, Math.min(rect.right - dropW, window.innerWidth - dropW - 8));
                        setMenuPos({ top, left });
                        setMenuAccId(menuAccId === acc.id ? null : acc.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <MoreVertical size={14}/>
                    </button>
                  </td>
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
              <select title="Filter by bank" value={txFilterBank} onChange={e => setTxFilterBank(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                {uniqueBanks.map(b => <option key={b}>{b}</option>)}
              </select>
              <select title="Filter by currency" value={txFilterCurrency} onChange={e => setTxFilterCurrency(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black outline-none bg-white text-slate-700">
                {['All','SRD','USD','EUR'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="date" value={txDateFrom} onChange={e => setTxDateFrom(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold outline-none bg-white text-slate-700" placeholder="From"/>
              <input type="date" value={txDateTo} onChange={e => setTxDateTo(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold outline-none bg-white text-slate-700" placeholder="To"/>
              <button type="button" onClick={handleExportTransactions} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-black hover:opacity-90">
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
                  const srdAmt = toSRD(p.amount, p.currency, p.exchangeRate);
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
                    SRD {filteredTransactions.reduce((s, p) => s + toSRD(p.amount, p.currency, p.exchangeRate), 0).toFixed(2)}
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
            <button type="button" onClick={() => setAddingRate(!addingRate)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800">
              <Plus size={12}/> Add Rate
            </button>
          </div>

          {addingRate && (
            <div className="p-4 border-b border-slate-100 bg-slate-50/40">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase">Date</label>
                  <input type="date" title="Rate date" value={rateDate} onChange={e => setRateDate(e.target.value)} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold outline-none"/>
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
                  <button type="button" onClick={handleAddRate} className="flex-1 px-3 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-black hover:opacity-90">Save</button>
                  <button type="button" title="Cancel" onClick={() => setAddingRate(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black"><X size={14}/></button>
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
      {/* Bank account detail modal */}
      {detailAccount && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[996] backdrop-blur-sm" onClick={() => { setDetailAccount(null); setAddingTx(false); }} />
          <div className="fixed inset-0 z-[997] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg pointer-events-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-8 pt-8 pb-5 flex-shrink-0">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-14 rounded-full ${BANK_COLORS[detailAccount.bank] || 'bg-slate-300'}`} />
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{detailAccount.bank}</h2>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{detailAccount.iban || '—'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${CURRENCY_COLORS[detailAccount.currency] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>{detailAccount.currency}</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-600">{detailAccount.bank === 'Cash' ? 'Cash' : 'Bank'}</span>
                      </div>
                    </div>
                  </div>
                  <button type="button" title="Close" onClick={() => { setDetailAccount(null); setAddingTx(false); }} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all">
                    <X size={20} />
                  </button>
                </div>
                <div className="bg-slate-50 rounded-2xl px-6 py-5 mb-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                  <p className="text-3xl font-black text-slate-900">{detailAccount.currency} {detailAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { openEditAccount(detailAccount); setDetailAccount(null); setAddingTx(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">
                    <Pencil size={13} /> Edit Account
                  </button>
                  <button type="button" onClick={() => setAddingTx(!addingTx)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${addingTx ? 'bg-slate-900 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                    <Plus size={13} /> Add Transaction
                  </button>
                </div>
              </div>

              {/* Add transaction form */}
              {addingTx && (
                <div className="px-8 pb-5 flex-shrink-0 border-b border-slate-100">
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                        <select
                          title="Transaction type"
                          value={txType}
                          onChange={e => setTxType(e.target.value as typeof txType)}
                          className="w-full mt-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none bg-white focus:border-slate-400"
                        >
                          <option value="deposit">Deposit (inkomst)</option>
                          <option value="withdrawal">Withdrawal (opname)</option>
                          <option value="fee">Bank Fee (kosten)</option>
                          <option value="transfer">Transfer (overschrijving)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount ({detailAccount.currency})</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={txAmount}
                          onChange={e => setTxAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full mt-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                        <input
                          type="date"
                          title="Transaction date"
                          value={txDate}
                          onChange={e => setTxDate(e.target.value)}
                          className="w-full mt-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference</label>
                        <input
                          value={txRef}
                          onChange={e => setTxRef(e.target.value)}
                          placeholder="INV-001, etc."
                          className="w-full mt-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                      <input
                        value={txDesc}
                        onChange={e => setTxDesc(e.target.value)}
                        placeholder="e.g. Eigen inbreng, Bank kosten..."
                        className="w-full mt-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-400"
                      />
                    </div>
                    {txType === 'transfer' && (
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transfer To</label>
                        <select
                          title="Destination account"
                          value={txToAccId}
                          onChange={e => setTxToAccId(e.target.value)}
                          className="w-full mt-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none bg-white focus:border-slate-400"
                        >
                          <option value="">— select account —</option>
                          {accounts.filter(a => a.id !== detailAccount.id).map(a => (
                            <option key={a.id} value={a.id}>{a.bank} · {a.currency} ({a.iban || '—'})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={handleAddTransaction} disabled={!txAmount || !txDate || createTx.isPending}
                        className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black disabled:opacity-40 flex items-center justify-center gap-1.5">
                        <Check size={13} /> Save Transaction
                      </button>
                      <button type="button" title="Cancel" onClick={() => setAddingTx(false)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction history */}
              <div className="border-t border-slate-100 flex flex-col overflow-hidden">
                <div className="px-8 py-3 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction History</p>
                  <span className="text-[9px] font-black text-slate-300">{bankTxs.length} records</span>
                </div>
                {bankTxs.length === 0 ? (
                  <div className="px-8 py-8 text-center">
                    <p className="text-xs font-bold text-slate-400">No transactions yet</p>
                    <p className="text-[10px] text-slate-300 mt-1">Use "Add Transaction" to record deposits, withdrawals, fees, or transfers.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto divide-y divide-slate-50">
                    {bankTxs.map(tx => {
                      const meta = TX_META[tx.type] ?? TX_META.deposit;
                      const TxIcon = meta.icon;
                      const toAcc = tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId) : null;
                      return (
                        <div key={tx.id} className="px-8 py-3 flex items-center gap-3 hover:bg-slate-50/40 transition-colors group">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                            <TxIcon size={13} className={meta.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{tx.description || meta.label}{tx.reference ? ` · ${tx.reference}` : ''}</p>
                            <p className="text-[10px] text-slate-400">{tx.date}{toAcc ? ` → ${toAcc.bank} ${toAcc.currency}` : ''}</p>
                          </div>
                          <p className={`text-sm font-black flex-shrink-0 ${meta.sign === '+' ? 'text-emerald-700' : meta.sign === '-' ? 'text-red-500' : 'text-blue-600'}`}>
                            {meta.sign}{detailAccount.currency} {tx.amount.toFixed(2)}
                          </p>
                          <button type="button" title="Delete transaction" onClick={() => deleteTx.mutate(tx.id)}
                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Account actions dropdown — root level to escape overflow clipping */}
      {menuAccId && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setMenuAccId(null)} />
          <div
            className="fixed w-44 bg-white border border-slate-100 rounded-[18px] shadow-2xl z-[999] py-2 animate-in fade-in zoom-in-95 duration-150"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {(() => {
              const acc = accounts.find(a => a.id === menuAccId);
              if (!acc) return null;
              return (
                <>
                  <button type="button" onClick={() => openEditAccount(acc)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    <Pencil size={13} className="text-blue-500"/> Edit Account
                  </button>
                  <button type="button" onClick={() => handleDeleteAccount(acc.id)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 size={13}/> Delete
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* Edit account modal */}
      {editAccount && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditAccount(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 z-[1001]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black text-slate-900">Edit Account</h2>
              <button type="button" title="Close" onClick={() => setEditAccount(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={15}/>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bank Name</label>
                <select
                  title="Bank name"
                  value={editBank}
                  onChange={e => setEditBank(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary bg-white"
                >
                  {KNOWN_BANKS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IBAN / Reference</label>
                <input
                  value={editIban}
                  onChange={e => setEditIban(e.target.value)}
                  placeholder="SR29..."
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Currency</label>
                <div className="mt-1 px-3 py-2 border border-slate-100 rounded-xl text-sm font-bold text-slate-400 bg-slate-50">
                  {editAccount.currency} <span className="text-[10px] font-medium">(cannot change)</span>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance</label>
                <input
                  type="number"
                  value={editBalance}
                  onChange={e => setEditBalance(e.target.value)}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-brand-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={handleSaveEdit}
                className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-black hover:bg-slate-800 flex items-center justify-center gap-2">
                <Check size={14}/> Save Changes
              </button>
              <button type="button" onClick={() => setEditAccount(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-black hover:bg-slate-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
