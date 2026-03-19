# Ramzon N.V. — Admin System

> **Stack:** React 18 + TypeScript + Vite + TailwindCSS (CDN) + React Router v6 (HashRouter) + Node.js/Express + PostgreSQL 17

---

## Quick Start

### Frontend only (mock auth, no backend)
```bash
npm install
npm run dev        # http://localhost:3000
```
Login: any email + any password (mock auth fallback)

### Full stack (real JWT auth + PostgreSQL)
```bash
# 1. Ensure PostgreSQL 17 is running (Windows service: postgresql-x64-17)
# 2. Copy env and set your password
cp .env.example .env      # then edit DATABASE_URL if needed

# 3. Apply database schema (first time only)
PGPASSWORD=postgres psql -U postgres -d ramzon -f server/src/db/schema.sql

# 4. Start both servers
npm run dev:all            # frontend :3000 + backend :4000
```
**Test credentials:** `admin@ramzon.sr` / `admin123`

### Individual servers
```bash
npm run dev            # Vite frontend only — http://localhost:3000
npm run dev:server     # Express backend only — http://localhost:4000
```

### Type check (must be 0 errors before commit)
```bash
npx tsc --noEmit                              # frontend
cd server && npx tsc --noEmit                 # backend
```

---

## Architecture

### Routing (`App.tsx`)
All routes use `HashRouter` (`#/route`). Key route map:

| URL | Page |
|-----|------|
| `#/dashboard` | Financial Overview |
| `#/invoices` / `#/invoices/new` | InvoicesPage / CreateInvoicePage |
| `#/estimates` / `#/estimates/new` | QuotesPage / CreateQuotePage |
| `#/payments` / `#/payments/new` | PaymentsPage / CreatePaymentPage |
| `#/credits` | CreditsPage |
| `#/clients` | ClientsPage |
| `#/expenses` | ExpensesPage |
| `#/products` | ProductsPage |
| `#/appearance` | AppearancePage (Doc Styles) |
| `#/settings` | SettingsPage |

> NOTE: `/quotes` does NOT exist — correct route is `/estimates`

### State Management
- **`LanguageContext`** (`lib/context.ts`) — global: `lang`, `companyName/Logo/Address/Phone/Email/BTW/KKF`, `currencySymbol`, `theme`, `multiCurrency`, date formatting
- **`localStorage`** — all document style settings, note templates (see keys below)
- **`lib/storage.ts`** — typed localStorage wrappers for: `products`, `woodSpecies`, `noteTemplates`, `doorPrices`
- **`lib/mock-data.ts`** — mock data for clients, invoices, estimates, payments, users (used by pages not yet migrated to React Query)
- **`lib/hooks/`** — React Query hooks that call the real Express backend (gradually replacing mock-data imports)

### Key Components
- `components/DocPDFModal.tsx` — full-page PDF renderer used by invoices and quotes
- `components/DocPDF.tsx` — `@react-pdf/renderer` document for real PDF download
- `components/ErrorBoundary.tsx` — catches page crashes; `LocationAwareErrorBoundary` resets on navigation
- `components/Header.tsx` — top nav with search, notifications, user avatar
- `components/Sidebar.tsx` — left nav
- `components/GeminiAssistant.tsx` — AI assistant (requires `GEMINI_API_KEY` env var)

### Frontend API & Auth Layer
- `lib/api.ts` — axios instance → `http://localhost:4000/api`; auto-attaches Bearer token; auto-retries on 401 via refresh cookie
- `lib/auth.tsx` — `AuthProvider` + `useAuth()` hook; restores session from httpOnly refresh cookie on mount
- `lib/schemas.ts` — Zod schemas: `ClientSchema`, `InvoiceSchema`, `QuoteSchema`, `LineItemSchema`
- `lib/hooks/` — React Query hooks per resource (see Backend section below)

---

## Backend

### Directory layout
```
server/
├── src/
│   ├── index.ts              # Express entry — :4000
│   ├── db/
│   │   ├── pool.ts           # pg Pool — reads DATABASE_URL from root .env
│   │   └── schema.sql        # Full schema; apply once with psql command below
│   ├── middleware/
│   │   ├── auth.ts           # requireAuth — validates Bearer JWT, attaches req.user
│   │   └── roles.ts          # requireRole('Admin','Sales','Accountant') factory
│   └── routes/
│       ├── auth.ts           # POST /login /refresh /logout  GET /me
│       ├── clients.ts        # CRUD /api/clients
│       ├── invoices.ts       # CRUD /api/invoices (+ invoice_items)
│       ├── estimates.ts      # CRUD /api/estimates (+ estimate_items)
│       ├── payments.ts       # GET + POST /api/payments
│       ├── credits.ts        # GET + POST /api/credits
│       ├── expenses.ts       # GET + POST + PUT /api/expenses
│       ├── products.ts       # CRUD /api/products
│       └── users.ts          # GET /api/users (Admin only)
shared/
└── types.ts                  # Copy of root types.ts — for future shared use
```

### Environment Variables (`.env` at project root)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ramzon
JWT_SECRET=<long-random-string>
JWT_REFRESH_SECRET=<different-long-random-string>
PORT=4000
CLIENT_URL=http://localhost:3000
GEMINI_API_KEY=your_key_here
```

### Database Setup (PostgreSQL 17)
```bash
# Windows service name: postgresql-x64-17
# Create database (once):
PGPASSWORD=postgres psql -U postgres -c "CREATE DATABASE ramzon;"

# Apply schema (once, or to reset):
PGPASSWORD=postgres psql -U postgres -d ramzon -f server/src/db/schema.sql

# Verify tables:
PGPASSWORD=postgres psql -U postgres -d ramzon -c "\dt"
```

**Seed users** (password for all: `admin123`):

| Email | Role |
|-------|------|
| `admin@ramzon.sr` | Admin |
| `sales@ramzon.sr` | Sales |
| `accountant@ramzon.sr` | Accountant |

### API Endpoints

**Auth** — no token required
```
POST /api/auth/login       { email, password } → { accessToken, user }
POST /api/auth/refresh     (uses httpOnly cookie) → { accessToken }
POST /api/auth/logout      clears cookie
GET  /api/auth/me          → { user }  (requires Bearer token)
```

**Resources** — all require `Authorization: Bearer <accessToken>`
```
GET    /api/clients              All users
POST   /api/clients              Admin, Sales
PUT    /api/clients/:id          Admin, Sales
DELETE /api/clients/:id          Admin only

GET    /api/invoices             All users
GET    /api/invoices/:id         All users (includes items array)
POST   /api/invoices             Admin, Sales
PUT    /api/invoices/:id         Admin, Sales
DELETE /api/invoices/:id         Admin only

GET    /api/estimates            All users
POST   /api/estimates            Admin, Sales

GET    /api/payments             All users
POST   /api/payments             Admin, Sales, Accountant

GET    /api/credits              All users
POST   /api/credits              Admin, Accountant

GET    /api/expenses             All users
POST   /api/expenses             Admin, Accountant
PUT    /api/expenses/:id         Admin, Accountant

GET    /api/products             All users
POST   /api/products             Admin only
PUT    /api/products/:id         Admin only
DELETE /api/products/:id         Admin only

GET    /api/users                Admin only

GET    /health                   No auth — returns { status: 'ok' }
```

### React Query Hooks (`lib/hooks/`)

Each hook file exports a query + mutation hooks:
```ts
// Usage pattern
import { useClients, useCreateClient } from '../lib/hooks/useClients';

const { data: clients = [], isLoading } = useClients();
const createClient = useCreateClient();
createClient.mutate({ name: 'Acme', email: 'acme@example.com' });
```

Available hook files: `useClients`, `useInvoices`, `useEstimates`, `usePayments`, `useCredits`, `useExpenses`, `useProducts`

### JWT Flow
- **Access token** — 15 min lifetime, stored in React state only (never localStorage)
- **Refresh token** — 7 day lifetime, `httpOnly` cookie (not readable by JS)
- On 401: `lib/api.ts` interceptor automatically calls `POST /api/auth/refresh` and retries
- On refresh failure: redirects to `/#/login`
- Session is restored on page reload via the refresh cookie → `AuthProvider` checks `/api/auth/refresh` on mount

---

## localStorage Keys Reference

| Key | Type | Description |
|-----|------|-------------|
| `erp_doc_font_family` | `'sans'\|'serif'\|'mono'` | PDF font |
| `erp_doc_font_size` | `'small'\|'medium'\|'large'` | PDF text scale |
| `erp_doc_font_weight` | `'normal'\|'medium'\|'bold'\|'black'` | PDF weight |
| `erp_doc_header_style` | `'split'\|'centered'` | PDF header layout |
| `erp_doc_logo_align` | `'left'\|'center'\|'right'` | Logo alignment |
| `erp_doc_title_size` | `'sm'\|'md'\|'lg'` | Document title size |
| `erp_doc_title_style` | `'normal'\|'uppercase'\|'stamp'` | Document title style |
| `erp_doc_client_style` | `'clean'\|'boxed'` | Client block style |
| `erp_doc_client_position` | `'right'\|'left'\|'below'` | Client block position |
| `erp_doc_accent_color` | `string` (hex) | Brand color |
| `erp_doc_header_bg` | `'brand'\|'dark'\|'light'\|'none'` | Header background |
| `erp_doc_table_header` | `'dark'\|'brand'\|'light'\|'none'` | Table header style |
| `erp_doc_logo_size` | `'sm'\|'md'\|'lg'` | Logo size |
| `erp_doc_show_fields` | `Record<string,boolean>` | Company field visibility |
| `erp_doc_table_rows` | `'horizontal'\|'grid'\|'none'` | Table row separators |
| `erp_doc_custom_titles` | `Record<string,string>` | Custom doc titles (invoice/estimate/payment/credit) |
| `erp_doc_company_fields_order` | `string[]` | Company field order: name/address/phone/email/btw/kkf |
| `erp_doc_client_fields_order` | `string[]` | Client field order: name/company/address/phone/email/vat |
| `erp_doc_show_client_fields` | `Record<string,boolean>` | Client field visibility |
| `erp_doc_meta_cols_order` | `string[]` | Meta row column order: datum/nr/termijn/vervaldatum/rep/project |
| `erp_doc_show_meta_cols` | `Record<string,boolean>` | Meta column visibility |
| `erp_doc_table_cols_order` | `string[]` | Table column order: omschrijving/afmeting/qty/eenheid/houtsoort/prijs/totaal |
| `erp_doc_show_table_cols` | `Record<string,boolean>` | Table column visibility |
| `erp_bank_details` | `string` | Bank details footer text |
| `erp_legal_disclaimer` | `string` | Legal disclaimer footer text |
| `erp_header_sections_order` | `string[]` | PDF Headers tab section order |
| `erp_active_user_name` | `string` | Last selected Sales Rep (auto-fills on new invoice) |

---

## DocPDFModal Props

```tsx
interface DocPDFModalProps {
  docType: 'quote' | 'invoice';
  docNumber: string;
  date: string;
  validUntil?: string;
  clientName: string;
  clientCompany?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientVAT?: string;
  rep?: string;           // Sales rep name shown in meta row
  paidAmount?: number;    // Partial payment: shows Betaald + Saldo in totals
  currency: string;
  currencySymbol: string;
  items: ModalLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  onClose: () => void;
}
```

All column visibility/order is read from localStorage automatically inside the modal.

---

## AppearancePage — Template Editor Sections

Left panel top to bottom:

1. **DOCUMENT SECTIONS** — drag-reorder + visibility per doc type
2. **KLEUREN & BRANDING** — accent color, header BG, table header
3. **TYPOGRAFIE** — font family, scale, weight
4. **DOCUMENT TITEL** — size, style, custom names per doc type
5. **LOGO & HEADER** — logo size, header layout (split/centered)
6. **BEDRIJFSINFO VELDEN** — drag-reorder + visibility: name/address/phone/email/btw/kkf
7. **CLIENT INFO VELDEN** — drag-reorder + visibility: name/company/address/phone/email/vat
8. **KLANTBLOK** — style (clean/boxed), position (right/left/below)
9. **TABELSTIJL** — row separators (horizontal/grid/none)
10. **META KOLOMMEN** — drag-reorder + visibility: datum/nr/termijn/vervaldatum/rep/project
11. **TABEL KOLOMMEN** — drag-reorder + visibility: omschrijving/afmeting/qty/eenheid/houtsoort/prijs/totaal
12. **FOOTER INHOUD** — bank details + legal disclaimer
13. **OPSLAAN & TOEPASSEN** — saves all settings to localStorage

---

## Translation System

```tsx
// APPTXT map at top of AppearancePage.tsx (outside component)
const APPTXT: Record<string, Record<string, string>> = { nl: {...}, en: {...} };
(['es', 'fr', 'zh', 'pt', 'de']).forEach(l => { APPTXT[l] = APPTXT.en; });

const L = APPTXT[lang] ?? APPTXT.en;  // inside component
```

`lib/translations.ts` covers global app strings via `t()`. `APPTXT` is local to AppearancePage only.

---

## Environment Variables

```env
GEMINI_API_KEY=your_key_here   # Required for AI assistant
```

Set in `.env` at project root. Injected at build time via `vite.config.ts` define.

---

## Security Issues (Current Prototype State)

> This is a **demo/prototype**. The following must be addressed before production:

### Critical
1. **Hardcoded password** — `LoginPage.tsx` line 61 has `defaultValue="password"`. Auth is fully mock — any input succeeds. No credentials are validated
2. **API key in client bundle** — `GEMINI_API_KEY` is inlined into the JS bundle at build time. Move Gemini calls to a backend proxy before deployment
3. **No real session** — `isAuthenticated` is React state only; cleared on page refresh. Direct URL access bypasses login after reload

### Medium
4. **Sensitive data in localStorage** — company BTW number, bank account details, and legal text are stored in plain localStorage (visible to all scripts)
5. **66 `as any` type casts** — bypasses TypeScript safety across the codebase; audit all before backend integration
6. **No input validation** — no max-length, format enforcement, or sanitization on any form inputs

### Good news (confirmed safe)
7. **No XSS risk** — React JSX auto-escapes all rendered values; no raw HTML injection exists ✅
8. **No console leaks** — only one `console.error` in GeminiAssistant.tsx ✅
9. **No unsafe dynamic code execution** — confirmed absent from all source files ✅

---

## Improvement Roadmap

### High Priority
| Item | Effort | Impact |
|------|--------|--------|
| Backend API (replace mock-data) | High | Critical |
| Real JWT auth + role-based guards | Medium | Critical |
| React Error Boundaries on each page | Low | High |
| Form validation (Zod or yup schemas) | Medium | High |

### Medium Priority
| Item | Notes |
|------|-------|
| Loading skeletons | Pages snap instantly with mock data; API will need loading states |
| Server-side pagination | InvoicesPage / ClientsPage render all records in memory |
| Real PDF generation | Browser print is inconsistent; use react-pdf or server-side renderer |
| PWA manifest + service worker | localStorage used but no offline support |

### Quick Wins
| Item | File | Change |
|------|------|--------|
| Sales Rep + partial payment on quotes | `CreateQuotePage.tsx` | Mirror CreateInvoicePage fields |
| Project field data | `DocPDFModal.tsx` | Add `project` prop, populate from invoice |
| Session storage for active user | `CreateInvoicePage.tsx` | Use sessionStorage instead of localStorage |
| Reduce type casts | Various | Replace `as any` with proper types |

---

## File Structure

```
├── App.tsx                    # Router, auth state, context providers
├── types.ts                   # All TypeScript interfaces
├── CLAUDE.md                  # This file
├── lib/
│   ├── context.ts             # LanguageContext
│   ├── mock-data.ts           # Mock data (replace with real API)
│   ├── storage.ts             # localStorage typed wrappers
│   ├── translations.ts        # Global i18n strings (nl/en/es/fr/zh/pt/de)
│   └── docNumbering.ts        # Invoice/estimate number generation
├── components/
│   ├── DocPDFModal.tsx        # PDF document renderer (invoice + quote)
│   ├── Header.tsx             # Top navigation bar
│   ├── Sidebar.tsx            # Left navigation
│   └── GeminiAssistant.tsx    # AI chat assistant
└── pages/
    ├── AppearancePage.tsx     # Document Styles — Template Editor (~1100 lines)
    ├── CreateInvoicePage.tsx  # New/edit invoice with line items
    ├── CreateQuotePage.tsx    # New/edit estimate/quote
    ├── InvoicesPage.tsx       # Invoice list
    ├── ClientsPage.tsx        # Client list and search
    ├── PaymentsPage.tsx       # Payment records
    ├── CreditsPage.tsx        # Credit notes
    ├── ExpensesPage.tsx       # Expense tracking
    ├── ProductsPage.tsx       # Product catalog
    └── ...                    # 20+ pages total
```
