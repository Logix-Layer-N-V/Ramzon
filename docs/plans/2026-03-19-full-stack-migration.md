# Ramzon ERP — Full-Stack Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Ramzon ERP React prototype into a production-ready full-stack application with a real Express/PostgreSQL backend, JWT auth, Error Boundaries, Zod validation, Rep+Partial on quotes, and real PDF generation.

**Architecture:** Monorepo (npm workspaces) with `/client` (React+Vite), `/server` (Express+PostgreSQL), `/shared` (TypeScript types). Frontend uses React Query for data fetching with an axios API client. Access tokens live in React state only; refresh tokens in httpOnly cookies.

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, React Query v5, Axios, Zod, @react-pdf/renderer v3 (client) / Node.js, Express 4, PostgreSQL, pg, jsonwebtoken, bcryptjs (server)

---

## Task 1: Error Boundaries

**Files:**
- Create: `components/ErrorBoundary.tsx`
- Modify: `App.tsx` (wrap each Route)

**Step 1: Create the component**

```tsx
// components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Something went wrong</h2>
            <p className="text-sm text-slate-500 mt-1">{this.state.error?.message}</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Step 2: Wrap routes in App.tsx**

In `App.tsx`, add import at top:
```tsx
import { ErrorBoundary } from './components/ErrorBoundary';
```

Wrap the inner `<Routes>` content (lines 244–289) — wrap the entire `<Routes>` block inside `<Layout>`:
```tsx
<Layout ...>
  <ErrorBoundary>
    <Routes>
      {/* all existing routes unchanged */}
    </Routes>
  </ErrorBoundary>
</Layout>
```

**Step 3: Type check**
```bash
cd "D:\apps lab\ramzon\updated"
npx tsc --noEmit
```
Expected: 0 errors

**Step 4: Commit**
```bash
git add components/ErrorBoundary.tsx App.tsx
git commit -m "feat: add ErrorBoundary to isolate page crashes"
```

---

## Task 2: Rep + Partial Payment on Quotes

**Files:**
- Modify: `pages/CreateQuotePage.tsx`

The invoice page (`CreateInvoicePage.tsx`) already has `selectedRep` (line 48) and `paidAmount` (line 51) and passes them to `DocPDFModal`. Mirror this in CreateQuotePage.

**Step 1: Add imports + state**

In `CreateQuotePage.tsx` line 5, `mockClients` is already imported from `mock-data`. Add `mockUsers` to the same import:
```tsx
import { mockClients, mockEstimates, mockUsers, RAMZON_SERVICES, RAMZON_PRODUCT_CATALOG, RAMZON_HOUTSOORTEN } from '../lib/mock-data';
```

After line 51 (`const [docNumber]`), add:
```tsx
const [selectedRep, setSelectedRep] = useState<string>(() =>
  localStorage.getItem('erp_active_user_name') ?? mockUsers.find(u => u.role === 'Admin' && u.status === 'Active')?.name ?? ''
);
const [paidAmount, setPaidAmount] = useState<number>(0);
```

**Step 2: Add UI fields**

Find the section in CreateQuotePage where `client`, `currency`, `validUntil` inputs are rendered. After the `validUntil` date input, add:

```tsx
{/* Sales Rep */}
<div>
  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Sales Rep</label>
  <select
    value={selectedRep}
    onChange={e => { setSelectedRep(e.target.value); localStorage.setItem('erp_active_user_name', e.target.value); }}
    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary/50"
  >
    <option value="">— Select rep —</option>
    {mockUsers.filter(u => u.status === 'Active').map(u => (
      <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
    ))}
  </select>
</div>

{/* Partial Payment */}
<div>
  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">Advance / Paid</label>
  <input
    type="number"
    min={0}
    value={paidAmount || ''}
    onChange={e => setPaidAmount(Number(e.target.value))}
    placeholder="0.00"
    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary/50"
  />
  {paidAmount > 0 && (
    <p className="text-xs text-emerald-600 mt-1 font-medium">
      Saldo: {currencySymbol}{(/* total */ 0 - paidAmount).toFixed(2)}
    </p>
  )}
</div>
```

**Step 3: Pass to DocPDFModal**

Find the `<DocPDFModal` usage in CreateQuotePage (search for `showPdfModal`). Add the two props:
```tsx
rep={selectedRep || undefined}
paidAmount={paidAmount > 0 ? paidAmount : undefined}
```

**Step 4: Type check**
```bash
npx tsc --noEmit
```
Expected: 0 errors

**Step 5: Commit**
```bash
git add pages/CreateQuotePage.tsx
git commit -m "feat: add Sales Rep and Partial Payment to quotes"
```

---

## Task 3: Zod Validation

**Files:**
- Create: `lib/schemas.ts`
- Modify: `pages/CreateInvoicePage.tsx`
- Modify: `pages/CreateQuotePage.tsx`
- Modify: `pages/CreateClientPage.tsx` (if exists, else `ClientsPage.tsx` add modal)

**Step 1: Install Zod**
```bash
cd "D:\apps lab\ramzon\updated"
npm install zod
```

**Step 2: Create schemas**
```ts
// lib/schemas.ts
import { z } from 'zod';

export const ClientSchema = z.object({
  name:    z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  email:   z.string().email('Valid email required'),
  phone:   z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
});

export const LineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  qty:  z.number().positive('Qty must be > 0'),
  price: z.number().min(0, 'Price must be ≥ 0'),
});

export const InvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  date:     z.string().min(1, 'Date is required'),
  dueDate:  z.string().min(1, 'Due date is required'),
  items:    z.array(LineItemSchema).min(1, 'At least one item required'),
});

export const QuoteSchema = z.object({
  clientId:   z.string().min(1, 'Client is required'),
  date:       z.string().min(1, 'Date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  items:      z.array(LineItemSchema).min(1, 'At least one item required'),
});

export type ClientFormData  = z.infer<typeof ClientSchema>;
export type InvoiceFormData = z.infer<typeof InvoiceSchema>;
export type QuoteFormData   = z.infer<typeof QuoteSchema>;
```

**Step 3: Add validation to CreateInvoicePage**

At the top of the save/send handler in `CreateInvoicePage.tsx`, parse before saving:
```tsx
import { InvoiceSchema } from '../lib/schemas';

// inside save handler, before existing logic:
const result = InvoiceSchema.safeParse({
  clientId: selectedClient,
  date: invoiceDate,
  dueDate: /* dueDate state variable */,
  items: items.map(i => ({ description: i.description, qty: i.qty, price: i.price })),
});
if (!result.success) {
  // Show first error as alert for now (Phase 1 — inline errors in Task 8)
  alert(result.error.errors[0].message);
  return;
}
```

**Step 4: Add validation to CreateQuotePage**

Same pattern with `QuoteSchema`:
```tsx
import { QuoteSchema } from '../lib/schemas';

const result = QuoteSchema.safeParse({
  clientId: client,
  date,
  validUntil,
  items: items.map(i => ({ description: i.description, qty: i.qty, price: i.price })),
});
if (!result.success) {
  alert(result.error.errors[0].message);
  return;
}
```

**Step 5: Type check**
```bash
npx tsc --noEmit
```
Expected: 0 errors

**Step 6: Commit**
```bash
git add lib/schemas.ts pages/CreateInvoicePage.tsx pages/CreateQuotePage.tsx
git commit -m "feat: add Zod validation schemas to invoice and quote forms"
```

---

## Task 4: Real PDF Generation (@react-pdf/renderer)

**Files:**
- Create: `components/DocPDF.tsx`
- Modify: `components/DocPDFModal.tsx` (add Download PDF button)

**Step 1: Install library**
```bash
npm install @react-pdf/renderer
npm install --save-dev @types/react-pdf
```

**Step 2: Create DocPDF.tsx**

```tsx
// components/DocPDF.tsx
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

// Read settings from localStorage (same keys as DocPDFModal)
const accentColor = localStorage.getItem('erp_doc_accent_color') || '#1e40af';
const fontFamily  = localStorage.getItem('erp_doc_font_family')  || 'Helvetica';

const styles = StyleSheet.create({
  page:     { fontFamily: 'Helvetica', fontSize: 9, padding: 40, color: '#1e293b' },
  header:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  title:    { fontSize: 22, fontWeight: 'bold', color: accentColor },
  label:    { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  value:    { fontSize: 9, color: '#1e293b' },
  tableHdr: { flexDirection: 'row', backgroundColor: accentColor, color: 'white', padding: '6 4', borderRadius: 3, marginTop: 16 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', padding: '5 4' },
  totals:   { alignItems: 'flex-end', marginTop: 12 },
  totalRow: { flexDirection: 'row', gap: 40, marginBottom: 3 },
  bold:     { fontWeight: 'bold' },
});

interface DocPDFProps {
  docType: 'invoice' | 'quote';
  docNumber: string;
  date: string;
  validUntil?: string;
  clientName: string;
  clientCompany?: string;
  clientAddress?: string;
  rep?: string;
  paidAmount?: number;
  currency: string;
  currencySymbol: string;
  items: Array<{ description: string; qty: number; unit: string; price: number; total: number }>;
  subtotal: number;
  tax: number;
  total: number;
}

const customTitles: Record<string, string> = (() => {
  try { return JSON.parse(localStorage.getItem('erp_doc_custom_titles') || '{}'); } catch { return {}; }
})();
const defaults: Record<string, string> = { invoice: 'Factuur', quote: 'Offerte' };

export const DocPDF: React.FC<DocPDFProps> = ({ docType, docNumber, date, validUntil, clientName, clientCompany, clientAddress, rep, paidAmount, currency, currencySymbol, items, subtotal, tax, total }) => {
  const title = customTitles[docType] ?? defaults[docType];
  const fmt = (n: number) => `${currencySymbol}${n.toFixed(2)}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.value, { marginTop: 4 }]}>{docNumber}</Text>
            <Text style={styles.label}>{date}</Text>
            {validUntil && <Text style={styles.label}>Geldig t/m {validUntil}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Aan</Text>
            <Text style={[styles.value, styles.bold]}>{clientName}</Text>
            {clientCompany  && <Text style={styles.value}>{clientCompany}</Text>}
            {clientAddress  && <Text style={styles.label}>{clientAddress}</Text>}
          </View>
        </View>

        {/* Meta row */}
        {rep && (
          <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
            <View>
              <Text style={styles.label}>Rep</Text>
              <Text style={styles.value}>{rep}</Text>
            </View>
          </View>
        )}

        {/* Table header */}
        <View style={styles.tableHdr}>
          <Text style={{ flex: 3, color: 'white', fontSize: 7, fontWeight: 'bold' }}>OMSCHRIJVING</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right' }}>QTY</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right' }}>PRIJS</Text>
          <Text style={{ flex: 1, color: 'white', fontSize: 7, textAlign: 'right' }}>TOTAAL</Text>
        </View>

        {/* Table rows */}
        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={{ flex: 3 }}>{item.description}</Text>
            <Text style={{ flex: 1, textAlign: 'right' }}>{item.qty} {item.unit}</Text>
            <Text style={{ flex: 1, textAlign: 'right' }}>{fmt(item.price)}</Text>
            <Text style={{ flex: 1, textAlign: 'right' }}>{fmt(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotaal</Text>
            <Text style={styles.value}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>BTW 21%</Text>
            <Text style={styles.value}>{fmt(tax)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: accentColor, paddingTop: 4, marginTop: 4 }]}>
            <Text style={[styles.value, styles.bold]}>TOTAAL ({currency})</Text>
            <Text style={[styles.value, styles.bold]}>{fmt(total)}</Text>
          </View>
          {paidAmount && paidAmount > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.label}>Betaald</Text>
                <Text style={{ ...styles.value, color: '#10b981' }}>-{fmt(paidAmount)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.value, styles.bold]}>Saldo</Text>
                <Text style={[styles.value, styles.bold]}>{fmt(total - paidAmount)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={{ marginTop: 40, borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 12 }}>
          <Text style={styles.label}>{localStorage.getItem('erp_bank_details') || ''}</Text>
          <Text style={{ ...styles.label, marginTop: 6 }}>{localStorage.getItem('erp_legal_disclaimer') || ''}</Text>
        </View>
      </Page>
    </Document>
  );
};
```

**Step 3: Add Download PDF button to DocPDFModal**

In `components/DocPDFModal.tsx`, add import at top:
```tsx
import { pdf } from '@react-pdf/renderer';
import { DocPDF } from './DocPDF';
```

Find the Print button in DocPDFModal. Add a Download button alongside it:
```tsx
<button
  onClick={async () => {
    const blob = await pdf(
      <DocPDF
        docType={docType}
        docNumber={docNumber}
        date={date}
        validUntil={validUntil}
        clientName={clientName}
        clientCompany={clientCompany}
        clientAddress={clientAddress}
        rep={rep}
        paidAmount={paidAmount}
        currency={currency}
        currencySymbol={currencySymbol}
        items={items.map(i => ({ description: i.description, qty: i.quantity, unit: i.unit || 'pcs', price: i.unitPrice, total: i.total }))}
        subtotal={subtotal}
        tax={tax}
        total={total}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }}
  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
>
  Download PDF
</button>
```

**Step 4: Type check**
```bash
npx tsc --noEmit
```
Expected: 0 errors

**Step 5: Commit**
```bash
git add components/DocPDF.tsx components/DocPDFModal.tsx
git commit -m "feat: add real PDF download via @react-pdf/renderer"
```

---

## Task 5: Monorepo Restructure

**Files:**
- Create: `package.json` (root workspace)
- Create: `server/` directory structure
- Create: `shared/types.ts`
- Move: all current files into `client/`

> **WARNING:** This restructures the project directory. Do a git commit of Tasks 1-4 first. Backup if needed.

**Step 1: Create root package.json**
```json
{
  "name": "ramzon-erp",
  "private": true,
  "workspaces": ["client", "server", "shared"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=client\" \"npm run dev --workspace=server\"",
    "build": "npm run build --workspace=client",
    "typecheck": "npm run typecheck --workspace=client && npm run typecheck --workspace=server"
  },
  "devDependencies": {
    "concurrently": "^8"
  }
}
```

**Step 2: Create shared/package.json**
```json
{
  "name": "@ramzon/shared",
  "version": "1.0.0",
  "main": "types.ts",
  "types": "types.ts"
}
```

**Step 3: Copy current `types.ts` to `shared/types.ts`**
Keep `client/types.ts` as a re-export shim:
```ts
// client/types.ts (after move)
export * from '../shared/types';
```

**Step 4: Create server directory structure**
```bash
mkdir -p server/src/routes server/src/middleware server/src/db
```

**Step 5: Create server/package.json**
```json
{
  "name": "@ramzon/server",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "bcryptjs": "^2",
    "cors": "^2",
    "dotenv": "^16",
    "express": "^4",
    "jsonwebtoken": "^9",
    "pg": "^8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2",
    "@types/cors": "^2",
    "@types/express": "^4",
    "@types/jsonwebtoken": "^9",
    "@types/node": "^20",
    "@types/pg": "^8",
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

**Step 6: Create server/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 7: Install dependencies**
```bash
npm install
npm install --workspace=server
```

**Step 8: Commit**
```bash
git add .
git commit -m "chore: scaffold monorepo structure with server/ and shared/"
```

---

## Task 6: Database Schema + Express Server

**Files:**
- Create: `server/src/db/schema.sql`
- Create: `server/src/db/pool.ts`
- Create: `server/src/index.ts`
- Create: `.env`

**Step 1: Create .env**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ramzon
JWT_SECRET=change-me-in-production-use-long-random-string
JWT_REFRESH_SECRET=another-long-random-string-different-from-above
PORT=4000
CLIENT_URL=http://localhost:3000
```

**Step 2: Create database schema**
```sql
-- server/src/db/schema.sql
-- Run: psql $DATABASE_URL < server/src/db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,  -- bcrypt hash
  role        TEXT NOT NULL CHECK (role IN ('Admin', 'Sales', 'Accountant')),
  status      TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  avatar      TEXT DEFAULT '',
  joined_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS clients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  company           TEXT DEFAULT '',
  email             TEXT DEFAULT '',
  vat_number        TEXT DEFAULT '',
  address           TEXT DEFAULT '',
  total_spent       NUMERIC(12,2) DEFAULT 0,
  status            TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  phone             TEXT DEFAULT '',
  preferred_currency TEXT DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id      UUID REFERENCES clients(id),
  client_name    TEXT NOT NULL,
  date           DATE NOT NULL,
  due_date       DATE NOT NULL,
  currency       TEXT DEFAULT 'USD',
  exchange_rate  NUMERIC(10,4) DEFAULT 1,
  subtotal       NUMERIC(12,2) DEFAULT 0,
  tax_rate       NUMERIC(5,2) DEFAULT 21,
  tax_amount     NUMERIC(12,2) DEFAULT 0,
  total_amount   NUMERIC(12,2) DEFAULT 0,
  status         TEXT DEFAULT 'Draft' CHECK (status IN ('Paid','Pending','Overdue','Draft','Cancelled')),
  notes          TEXT DEFAULT '',
  rep            TEXT DEFAULT '',
  paid_amount    NUMERIC(12,2) DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id  TEXT DEFAULT '',
  description TEXT NOT NULL,
  quantity    NUMERIC(10,3) NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  total       NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS estimates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number TEXT UNIQUE NOT NULL,
  client_id       UUID REFERENCES clients(id),
  client_name     TEXT NOT NULL,
  date            DATE NOT NULL,
  valid_until     DATE,
  currency        TEXT DEFAULT 'USD',
  exchange_rate   NUMERIC(10,4) DEFAULT 1,
  subtotal        NUMERIC(12,2) DEFAULT 0,
  tax_rate        NUMERIC(5,2) DEFAULT 21,
  tax_amount      NUMERIC(12,2) DEFAULT 0,
  total           NUMERIC(12,2) DEFAULT 0,
  status          TEXT DEFAULT 'Draft' CHECK (status IN ('Accepted','Sent','Draft','Expired')),
  notes           TEXT DEFAULT '',
  rep             TEXT DEFAULT '',
  paid_amount     NUMERIC(12,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estimate_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  product_id  TEXT DEFAULT '',
  description TEXT NOT NULL,
  quantity    NUMERIC(10,3) NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL,
  total       NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES clients(id),
  invoice_id      UUID REFERENCES invoices(id),
  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  exchange_rate   NUMERIC(10,4) DEFAULT 1,
  bank_account_id TEXT DEFAULT '',
  date            DATE NOT NULL,
  method          TEXT DEFAULT '',
  reference       TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  status          TEXT DEFAULT 'Completed' CHECK (status IN ('Completed','Refunded'))
);

CREATE TABLE IF NOT EXISTS credits (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  amount    NUMERIC(12,2) NOT NULL,
  currency  TEXT DEFAULT 'USD',
  date      DATE NOT NULL,
  reason    TEXT DEFAULT '',
  status    TEXT DEFAULT 'Available' CHECK (status IN ('Available','Used'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL,
  vendor      TEXT DEFAULT '',
  amount      NUMERIC(12,2) NOT NULL,
  currency    TEXT DEFAULT 'USD',
  date        DATE NOT NULL,
  description TEXT DEFAULT '',
  status      TEXT DEFAULT 'Unpaid' CHECK (status IN ('Paid','Unpaid'))
);

CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  wood_type        TEXT DEFAULT '',
  thickness        NUMERIC(8,2) DEFAULT 0,
  width            NUMERIC(8,2) DEFAULT 0,
  length           NUMERIC(8,2) DEFAULT 0,
  unit             TEXT DEFAULT 'pcs',
  price_per_unit   NUMERIC(12,2) NOT NULL,
  stock            NUMERIC(10,2) DEFAULT 0,
  category         TEXT DEFAULT '',
  sku              TEXT DEFAULT '',
  calculation_type TEXT DEFAULT 'pcs'
);

-- Seed admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
  ('Admin User', 'admin@ramzon.sr', '$2b$10$xLzgSdJuRbBhYw7M5Y3J2eH4mN8kP1qA6vC9dE0fG3hI7jK2lM5nO', 'Admin')
ON CONFLICT (email) DO NOTHING;
```

**Step 3: Create db/pool.ts**
```ts
// server/src/db/pool.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**Step 4: Create server entry point**
```ts
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { clientsRouter } from './routes/clients';
import { invoicesRouter } from './routes/invoices';
import { estimatesRouter } from './routes/estimates';
import { paymentsRouter } from './routes/payments';
import { creditsRouter } from './routes/credits';
import { expensesRouter } from './routes/expenses';
import { productsRouter } from './routes/products';
import { usersRouter } from './routes/users';

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(require('cookie-parser')());

app.use('/api/auth',      authRouter);
app.use('/api/clients',   clientsRouter);
app.use('/api/invoices',  invoicesRouter);
app.use('/api/estimates', estimatesRouter);
app.use('/api/payments',  paymentsRouter);
app.use('/api/credits',   creditsRouter);
app.use('/api/expenses',  expensesRouter);
app.use('/api/products',  productsRouter);
app.use('/api/users',     usersRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Ramzon API running on :${PORT}`));
```

**Step 5: Apply schema**
```bash
# Ensure PostgreSQL is running, then:
psql $DATABASE_URL < server/src/db/schema.sql
```

**Step 6: Commit**
```bash
git add server/ .env.example
git commit -m "feat: add Express server scaffold + PostgreSQL schema"
```

---

## Task 7: JWT Auth (Backend + Frontend)

**Files:**
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/middleware/roles.ts`
- Create: `server/src/routes/auth.ts`
- Create: `server/src/routes/users.ts`
- Create: `client/lib/auth.tsx`
- Create: `client/lib/api.ts`
- Modify: `client/App.tsx`

**Step 1: JWT middleware**
```ts
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; name: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

```ts
// server/src/middleware/roles.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

**Step 2: Auth routes**
```ts
// server/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const signAccess = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
const signRefresh = (payload: object) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1 AND status=$2', [email, 'Active']);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const payload = { id: user.id, role: user.role, name: user.name };
  const accessToken  = signAccess(payload);
  const refreshToken = signRefresh(payload);
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', maxAge: 7 * 86400 * 1000 });
  res.json({ accessToken, user: payload });
});

authRouter.post('/refresh', (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string; role: string; name: string };
    res.json({ accessToken: signAccess({ id: payload.id, role: payload.role, name: payload.name }) });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});
```

**Step 3: Frontend auth context**
```tsx
// client/lib/auth.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api';

interface AuthUser { id: string; role: 'Admin' | 'Sales' | 'Accountant'; name: string; }
interface AuthCtx {
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Step 4: Frontend API client**
```ts
// client/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

// Attach access token (set externally via api.defaults.headers)
let _getToken: (() => string | null) | null = null;
export const setTokenGetter = (fn: () => string | null) => { _getToken = fn; };

api.interceptors.request.use(cfg => {
  const token = _getToken?.();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        // Notify AuthProvider — for now, reload page to re-trigger auth check
        window.location.reload();
        return api(err.config);
      } catch {
        window.location.href = '/#/login';
      }
    }
    return Promise.reject(err);
  }
);
```

**Step 5: Update App.tsx to use AuthProvider**

Replace the mock `isAuthenticated` state with `useAuth()`:
```tsx
// In App.tsx, wrap the LanguageContext.Provider with AuthProvider:
import { AuthProvider, useAuth } from './lib/auth';

// Replace the App component's isAuthenticated state and handlers with:
// <AuthProvider> at root, then use const { isAuthenticated, logout } = useAuth() inside a child component
```

**Step 6: Type check both workspaces**
```bash
npx tsc --noEmit --project client/tsconfig.json
npx tsc --noEmit --project server/tsconfig.json
```
Expected: 0 errors each

**Step 7: Commit**
```bash
git add server/src/middleware/ server/src/routes/auth.ts server/src/routes/users.ts client/lib/auth.tsx client/lib/api.ts client/App.tsx
git commit -m "feat: add JWT auth (backend routes + frontend context)"
```

---

## Task 8: Replace mock-data with React Query Hooks

**Files:**
- Create: `client/lib/hooks/useInvoices.ts`
- Create: `client/lib/hooks/useClients.ts`
- Create: `client/lib/hooks/useEstimates.ts`
- Create: `client/lib/hooks/usePayments.ts`
- Create: `client/lib/hooks/useProducts.ts`
- Create: `server/src/routes/clients.ts` (and invoices, estimates, payments, credits, expenses, products)
- Modify: `client/App.tsx` (add QueryClientProvider)
- Modify: pages that import from mock-data

**Step 1: Install React Query**
```bash
npm install --workspace=client @tanstack/react-query
```

**Step 2: Add QueryClientProvider to App.tsx**
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

// Wrap everything inside:
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <LanguageContext.Provider ...>
      ...
    </LanguageContext.Provider>
  </AuthProvider>
</QueryClientProvider>
```

**Step 3: Create resource hooks (example — clients)**
```ts
// client/lib/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Client } from '../../types';

export const useClients = () =>
  useQuery<Client[]>({ queryKey: ['clients'], queryFn: () => api.get('/clients').then(r => r.data) });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) => api.post('/clients', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Client> & { id: string }) => api.put(`/clients/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
};
```

Repeat the same pattern for: `useInvoices`, `useEstimates`, `usePayments`, `useCredits`, `useExpenses`, `useProducts`.

**Step 4: Create backend CRUD routes (example — clients)**
```ts
// server/src/routes/clients.ts
import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

clientsRouter.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients ORDER BY name');
  res.json(rows);
});

clientsRouter.post('/', requireRole('Admin', 'Sales'), async (req, res) => {
  const { name, company, email, vat_number, address, phone, preferred_currency } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO clients (name,company,email,vat_number,address,phone,preferred_currency) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [name, company, email, vat_number, address, phone, preferred_currency]
  );
  res.status(201).json(rows[0]);
});

clientsRouter.put('/:id', requireRole('Admin', 'Sales'), async (req, res) => {
  const { name, company, email, vat_number, address, phone, status } = req.body;
  const { rows } = await pool.query(
    'UPDATE clients SET name=$1,company=$2,email=$3,vat_number=$4,address=$5,phone=$6,status=$7 WHERE id=$8 RETURNING *',
    [name, company, email, vat_number, address, phone, status, req.params.id]
  );
  res.json(rows[0]);
});

clientsRouter.delete('/:id', requireRole('Admin'), async (req, res) => {
  await pool.query('DELETE FROM clients WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});
```

Repeat for invoices, estimates, payments, credits, expenses, products.

**Step 5: Replace mock-data imports in pages**

For each page that imports from `mock-data`, replace the mock import with the corresponding hook:
```tsx
// Before:
import { mockClients } from '../lib/mock-data';
const clients = mockClients;

// After:
import { useClients } from '../lib/hooks/useClients';
const { data: clients = [], isLoading } = useClients();
```

Add loading states:
```tsx
if (isLoading) return <div className="p-8 text-slate-400">Loading...</div>;
```

**Step 6: Delete mock-data.ts** (only after all imports are replaced)
```bash
# Verify no imports remain:
grep -r "mock-data" client/src/
# Then delete:
rm client/lib/mock-data.ts
```

**Step 7: Type check**
```bash
npx tsc --noEmit --project client/tsconfig.json
npx tsc --noEmit --project server/tsconfig.json
```
Expected: 0 errors each

**Step 8: Final commit**
```bash
git add .
git commit -m "feat: replace mock-data with React Query + Express/PostgreSQL API"
```

---

## Execution Order

```
Task 1 → Task 2 → Task 3 → Task 4   (all frontend-only, no dependencies)
Task 5 → Task 6 → Task 7 → Task 8   (backend, sequential — each depends on previous)
```

Tasks 1-4 can be done independently in any order.
Tasks 5-8 must be done in sequence.

## Verification Checklist

- [ ] `npx tsc --noEmit` → 0 errors (after every task)
- [ ] Error boundary: throw an error in any page component → clean error card appears, other pages unaffected
- [ ] Quote page: Sales Rep dropdown + partial payment input visible and functional
- [ ] Create invoice with empty client → Zod error message shown
- [ ] Download PDF button in DocPDFModal → real PDF opens in new tab
- [ ] `POST /api/auth/login` with valid creds → returns accessToken
- [ ] `GET /api/clients` without token → 401
- [ ] `GET /api/clients` with Admin token → 200 with data
- [ ] `GET /api/clients` with Sales token → 200 (Sales can read)
- [ ] `DELETE /api/clients/:id` with Sales token → 403 (Sales cannot delete)
