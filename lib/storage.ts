/**
 * Typed localStorage helpers for all ERP data.
 * Structured for easy migration to PocketBase — replace getList/saveList
 * with pb.collection() calls when the VPS backend is ready.
 */

export function getList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveList<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveItem<T>(key: string, item: T): void {
  localStorage.setItem(key, JSON.stringify(item));
}

// ── Domain types ───────────────────────────────────────────────────────────

/** Persisted note template (iconName is a string key, NOT a React component). */
export interface NoteTemplate {
  name: string;
  content: string;
  iconName: string;
}

// ── Collection keys ────────────────────────────────────────────────────────
export const KEYS = {
  invoices:        'erp_invoices',
  estimates:       'erp_estimates',
  payments:        'erp_payments',
  credits:         'erp_credits',
  expenses:        'erp_expenses',
  clients:         'erp_clients',
  products:        'erp_products',
  bankAccounts:    'erp_bank_accounts',
  exchangeRates:   'erp_exchange_rates',
  woodSpecies:     'erp_wood_species',
  doorModels:      'erp_door_models',
  profileSizes:    'erp_profile_sizes',
  doorPriceMatrix: 'erp_door_price_matrix',
  noteTemplates:   'erp_note_templates',
} as const;

// ── Typed accessors ────────────────────────────────────────────────────────
import type {
  Invoice, Estimate, Payment, Credit, Expense, Client,
  BankAccount, ExchangeRate, WoodSpecies, DoorModel, ProfileSize, DoorPriceEntry, WoodProduct,
} from '../types';

export const storage = {
  invoices:   { get: () => getList<Invoice>(KEYS.invoices),   save: (v: Invoice[])   => saveList(KEYS.invoices, v) },
  estimates:  { get: () => getList<Estimate>(KEYS.estimates), save: (v: Estimate[])  => saveList(KEYS.estimates, v) },
  payments:   { get: () => getList<Payment>(KEYS.payments),   save: (v: Payment[])   => saveList(KEYS.payments, v) },
  credits:    { get: () => getList<Credit>(KEYS.credits),     save: (v: Credit[])    => saveList(KEYS.credits, v) },
  expenses:   { get: () => getList<Expense>(KEYS.expenses),   save: (v: Expense[])   => saveList(KEYS.expenses, v) },
  clients:    { get: () => getList<Client>(KEYS.clients),     save: (v: Client[])    => saveList(KEYS.clients, v) },
  products:   { get: () => getList<WoodProduct>(KEYS.products), save: (v: WoodProduct[]) => saveList(KEYS.products, v) },

  bankAccounts:    { get: () => getList<BankAccount>(KEYS.bankAccounts),       save: (v: BankAccount[])    => saveList(KEYS.bankAccounts, v) },
  exchangeRates:   { get: () => getList<ExchangeRate>(KEYS.exchangeRates),     save: (v: ExchangeRate[])   => saveList(KEYS.exchangeRates, v) },
  woodSpecies:     { get: () => getList<WoodSpecies>(KEYS.woodSpecies),         save: (v: WoodSpecies[])    => saveList(KEYS.woodSpecies, v) },
  doorModels:      { get: () => getList<DoorModel>(KEYS.doorModels),           save: (v: DoorModel[])      => saveList(KEYS.doorModels, v) },
  profileSizes:    { get: () => getList<ProfileSize>(KEYS.profileSizes),       save: (v: ProfileSize[])    => saveList(KEYS.profileSizes, v) },
  doorPriceMatrix: { get: () => getList<DoorPriceEntry>(KEYS.doorPriceMatrix), save: (v: DoorPriceEntry[]) => saveList(KEYS.doorPriceMatrix, v) },
  noteTemplates:   { get: () => getList<NoteTemplate>(KEYS.noteTemplates),     save: (v: NoteTemplate[])   => saveList(KEYS.noteTemplates, v) },
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Get latest exchange rate row (most recent date). */
export function getLatestExchangeRate(): ExchangeRate | null {
  const rates = storage.exchangeRates.get();
  if (!rates.length) return null;
  return rates.sort((a, b) => b.date.localeCompare(a.date))[0];
}

/**
 * Convert amount from any currency to a target base currency.
 * SRD is used internally as the common denominator for all cross-rates.
 * baseCurrency defaults to 'SRD' — matching the company's home currency.
 */
export function toBase(
  amount: number,
  fromCurrency: string,
  baseCurrency: string = 'SRD',
  rate?: ExchangeRate | null
): number {
  const r = rate ?? getLatestExchangeRate();
  if (!r) return amount;

  // Step 1: convert to SRD (internal common denominator)
  let srdAmount: number;
  switch (fromCurrency) {
    case 'SRD':  srdAmount = amount; break;
    case 'USD':  srdAmount = amount * r.usdSrd; break;
    case 'EUR':  srdAmount = amount * r.eurSrd; break;
    case 'USDT': srdAmount = amount * r.usdSrd; break; // USDT ≈ USD
    default:     srdAmount = amount;
  }

  // Step 2: convert SRD → target base currency
  switch (baseCurrency) {
    case 'SRD': return srdAmount;
    case 'USD': return r.usdSrd > 0 ? srdAmount / r.usdSrd : srdAmount;
    case 'EUR': return r.eurSrd > 0 ? srdAmount / r.eurSrd : srdAmount;
    default:    return srdAmount;
  }
}

/** Backwards-compatible alias: convert to SRD. */
export function toSRD(amount: number, currency: string, rate?: ExchangeRate | null): number {
  return toBase(amount, currency, 'SRD', rate);
}

/** Get total paid on an invoice from payments list. */
export function getInvoicePaidTotal(invoiceId: string): number {
  return storage.payments.get()
    .filter(p => p.invoiceId === invoiceId && p.status !== 'Refunded')
    .reduce((sum, p) => sum + toSRD(p.amount, p.currency), 0);
}
