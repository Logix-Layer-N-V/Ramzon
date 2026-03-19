# Ramzon ERP — Full-Stack Migration Design

**Date:** 2026-03-19
**Status:** Approved
**Scope:** 6 improvements — Backend API, JWT Auth, Error Boundaries, Zod Validation, Rep/Partial on Quotes, Real PDF Generation

---

## 1. Monorepo Structure

```
ramzon/updated/
├── client/                  ← current app moves here (all existing files)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types.ts         ← re-exports from shared/
│   ├── vite.config.ts
│   └── package.json
├── server/                  ← new Express + PostgreSQL API
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/          ← auth, clients, invoices, estimates, payments, credits, expenses, products
│   │   ├── middleware/      ← jwt.ts, roles.ts
│   │   └── db/              ← pool.ts, schema.sql, migrations/
│   └── package.json
├── shared/
│   └── types.ts             ← moved from client — both sides import from here
├── package.json             ← npm workspaces root
└── .env                     ← DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
```

---

## 2. Backend (Express + PostgreSQL + JWT)

### Database
PostgreSQL with tables mirroring `types.ts`:
- `users`, `clients`, `invoices`, `invoice_items`, `estimates`, `estimate_items`
- `payments`, `credits`, `expenses`, `products`
- Single `schema.sql` migration file for initial setup

### Auth Flow
- `POST /api/auth/login` → validates credentials → returns `accessToken` (15min, response body) + `refreshToken` (7 days, httpOnly cookie)
- `POST /api/auth/refresh` → reads httpOnly cookie → issues new access token
- `POST /api/auth/logout` → clears cookie
- Frontend stores access token in **React state only** (never localStorage — avoids XSS risk)

### Role Guards (middleware)
| Role | Permissions |
|------|-------------|
| Admin | Full access to all routes |
| Sales | Create/edit invoices, estimates, clients, products |
| Accountant | Read all; create payments, credits, expenses |

### API Routes
All prefixed `/api/`, all require JWT except `/api/auth/login`.
Standard REST pattern: `GET`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id` for each resource.

---

## 3. Frontend Integration (React Query + API Client)

### `lib/api.ts`
- Axios instance with `VITE_API_URL` base URL
- Request interceptor: attaches `Authorization: Bearer <token>` from memory
- Response interceptor: on 401 → calls `/api/auth/refresh` → retries request → logs out if refresh fails

### `lib/auth.tsx`
- `AuthContext` + `useAuth` hook replacing mock auth in `App.tsx`
- Stores access token in React state (never localStorage)
- Exposes: `user` (with `role`), `login()`, `logout()`, `isAuthenticated`
- `<RequireAuth role="Admin">` route guard component

### Data Fetching
- React Query (`@tanstack/react-query`) replaces `mock-data.ts`
- One hook per resource: `useInvoices()`, `useClients()`, `useProducts()`, etc.
- Mutations auto-invalidate relevant query cache on success
- `mock-data.ts` deleted after migration complete

### `App.tsx` Changes
- Add `QueryClientProvider` wrapper
- Replace `isAuthenticated` state with `useAuth()`
- Wrap each `<Route>` in `<RequireAuth>` with appropriate role

---

## 4. Quick Wins

### Error Boundaries
- Single `components/ErrorBoundary.tsx` class component
- Shows clean "Something went wrong" card with retry button
- Wrapped around each `<Route>` in `App.tsx`
- Optional `fallback` prop for custom per-page error UI

### Zod Validation (`lib/schemas.ts`)
- `InvoiceSchema` — required clientId, date, dueDate, ≥1 item, positive amounts
- `QuoteSchema` — same minus dueDate, plus validUntil
- `ClientSchema` — required name, valid email, optional phone/VAT
- Inline field errors shown below each input; submit blocked until valid
- Used in: `CreateInvoicePage`, `CreateQuotePage`, `ClientsPage`

### Rep + Partial Payment on Quotes
- Mirror `CreateInvoicePage` — Sales Rep `<select>` + Partial Payment `<input>`
- Populated from `GET /api/users` (mockUsers during transition)
- Both passed as props to `DocPDFModal` (already accepts `rep` and `paidAmount`)

---

## 5. Real PDF Generation (@react-pdf/renderer)

### New `components/DocPDF.tsx`
- Uses `@react-pdf/renderer` v3 primitives: `Document`, `Page`, `View`, `Text`, `Image`
- Reads same localStorage keys as current `DocPDFModal` (accent color, font, layout, column visibility/order, custom titles, footer)
- Matches current visual design

### Integration
- `DocPDFModal` gets a **"Download PDF"** button alongside existing "Print"
- Click: `pdf(<DocPDF {...props} />).toBlob()` → object URL → opens as real `.pdf` in new tab
- Print button kept as fallback
- `DocPDFModalProps` interface unchanged — same callers, same props

### Library
- `@react-pdf/renderer` v3 — client-side only, no server dependency

---

## New Dependencies

### Client
```json
"@tanstack/react-query": "^5",
"axios": "^1",
"zod": "^3",
"@react-pdf/renderer": "^3"
```

### Server
```json
"express": "^4",
"pg": "^8",
"jsonwebtoken": "^9",
"bcryptjs": "^2",
"cors": "^2",
"dotenv": "^16",
"tsx": "^4"
```

### Dev (server)
```json
"@types/express": "^4",
"@types/pg": "^8",
"@types/jsonwebtoken": "^9",
"@types/bcryptjs": "^2",
"typescript": "^5"
```

---

## New localStorage Keys Added
None — all document style settings remain in localStorage as-is. Backend stores business data only.

---

## Migration Order
1. Error Boundaries (no dependencies)
2. Rep + Partial Payment on Quotes (no dependencies)
3. Zod validation (no dependencies)
4. Real PDF generation (no dependencies)
5. Monorepo restructure (scaffold server/, shared/, update client/)
6. Backend API + database schema
7. JWT auth
8. Replace mock-data with React Query hooks
