
export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Cancelled';
export type EstimateStatus = 'Accepted' | 'Sent' | 'Draft' | 'Expired';

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  vatNumber: string;
  address: string;
  totalSpent: number;
  status: 'Active' | 'Inactive';
  phone?: string;
  preferredCurrency?: string;  // 'SRD' | 'USD' | 'EUR' | 'USDT'
}

export interface Payment {
  id: string;
  clientId: string;
  invoiceId?: string;       // linked invoice
  amount: number;
  currency: string;         // 'SRD' | 'USD' | 'EUR' | 'USDT'
  exchangeRate?: number;    // rate to SRD at time of payment
  bankAccountId: string;    // e.g. 'dsb_srd', 'cash_usd'
  date: string;
  method: string;
  reference: string;
  notes?: string;
  status: 'Completed' | 'Refunded';
}

export interface Credit {
  id: string;
  clientId: string;
  amount: number;
  currency?: string;
  date: string;
  reason: string;
  status: 'Available' | 'Used';
}

export interface WoodProduct {
  id: string;
  name: string;
  woodType: string;
  thickness: number; // mm
  width: number;    // mm
  length: number;   // mm
  unit: 'm³' | 'm²' | 'lm' | 'pcs' | 'PCS';
  pricePerUnit: number;
  stock: number;
  category?: string;          // e.g. 'Doors' | 'Mouldings' | 'Frames' | 'Window Frames' | 'Crating'
  sku?: string;               // product SKU code
  calculationType?: 'pcs' | 'm2' | 'lm'; // drives price calculation in quotes/invoices
}

export interface InvoiceItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  dimensions?: { l: number; w: number; t: number };
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  currency?: string;
  exchangeRate?: number;
  estimateId?: string;      // linked estimate
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  rep?: string;        // Sales rep name
  paidAmount?: number; // Advance payment shown in PDF
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  currency?: string;
  exchangeRate?: number;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: EstimateStatus;
  notes?: string;
  rep?: string;        // Sales rep name
  paidAmount?: number; // Advance payment shown in PDF
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'Accountant';
  status: 'Active' | 'Inactive';
  avatar: string;
  joinedDate: string;
}

export interface Expense {
  id: string;
  category: string;
  vendor?: string;
  amount: number;
  currency?: string;
  date: string;
  description: string;
  status: 'Paid' | 'Unpaid';
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  date: string;
}

// ── Bank & Rates ─────────────────────────────────────────────────────────────

export interface BankAccount {
  id: string;
  bank: string;       // 'DSB Bank' | 'HKB Hakrinbank' | 'Petty Cash'
  currency: string;   // 'SRD' | 'USD' | 'EUR'
  iban: string;
  balance: number;
}

export interface ExchangeRate {
  id: string;
  date: string;
  usdSrd: number;
  eurSrd: number;
  eurUsd: number;
}

// ── Door Product Domain ───────────────────────────────────────────────────────

export interface WoodSpecies {
  id: string;
  name: string;
  color?: string;   // display color swatch hex
  markup?: number;  // price markup percentage applied to base price (default 0)
}

export interface DoorModel {
  id: string;
  name: string;
}

export interface ProfileSize {
  id: string;
  label: string;        // e.g. '800×2100mm'
  mmW: number;
  mmH: number;
  measureType?: 'surface' | 'length'; // 'surface' = W×H area, 'length' = linear measurement
}

export interface DoorPriceEntry {
  id: string;
  woodSpeciesId: string;
  modelId: string;
  pricePerM2: number; // in default currency (SRD)
}
