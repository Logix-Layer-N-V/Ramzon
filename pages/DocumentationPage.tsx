
import React, { useState, useMemo } from 'react';
import {
  BookOpen, ChevronRight, Receipt, ClipboardList, Wallet, Coins,
  Package, Settings2, Users, BarChart3, FileText, Tag, Layers,
  HelpCircle, Zap, Globe2, Landmark, TrendingUp, LayoutTemplate,
  AlertTriangle, Lightbulb, ArrowRight, Settings, Search, Shield
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface Section {
  id: string;
  icon: React.ElementType;
  color: string;
  group: string;
  title: string;
  subtitle: string;
  content: string;
}

// ── Nav groups ───────────────────────────────────────────────────────────────
const groups = [
  { id: 'start',   label: 'Getting Started' },
  { id: 'billing', label: 'Billing' },
  { id: 'finance', label: 'Finance' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'system',  label: 'System' },
];

// ── Sections ─────────────────────────────────────────────────────────────────
const sections: Section[] = [
  {
    id: 'quickstart', icon: Zap, color: 'amber', group: 'start',
    title: 'Quick Start Guide',
    subtitle: 'From login to first invoice in 5 steps',
    content: `
### Step 1 — Log In
Navigate to the application URL and sign in with your admin credentials.

> Default admin: use the credentials set during initial installation.

### Step 2 — Fill in Company Profile
PATH: Settings → Company Profile

Complete all company fields — they appear on every invoice and quote:
- **Company name, address, phone, email, website**
- **KKF number & VAT/BTW number**
- **Logo** — upload a PNG or JPG (transparent background recommended)

### Step 3 — Add Products or Services
PATH: Products → + New Product

Build your catalog before creating invoices:
1. Choose a category (Doors / Mouldings / Boards / Frames / Crating)
2. Choose a wood species (Teak / Mahogany / Oak / etc.)
3. Add model and dimensions with a unit price

### Step 4 — Create Your First Client
PATH: CRM → + New Client

Fill in name, company, contact details, VAT number and preferred currency.

### Step 5 — Create an Invoice or Quote
PATH: Billing → Invoices → + New Invoice

1. Select a client
2. Add line items using the Product / Service / Item picker
3. Verify totals and VAT
4. Save and send

> Use the **Quick Create button** (+ icon, top right) to jump to any create screen instantly.`
  },
  {
    id: 'dashboard', icon: BarChart3, color: 'blue', group: 'billing',
    title: 'Dashboard',
    subtitle: 'Real-time financial overview',
    content: `
### KPI Cards
The four cards at the top show your key numbers at a glance:
- **Revenue this month** — sum of payments received in the current month
- **Open invoices** — invoices not yet fully paid
- **Expected receipts** — outstanding amounts to be collected
- **Credit balance** — total outstanding credit notes

### Revenue Chart
Monthly revenue bar chart comparing the current year. Hover over a bar to see the exact amount.

### Top Clients Panel
Shows the top 5 clients by revenue. Click any client to navigate to their detail page.

### Recent Activity
Live feed of the latest invoices, payments and quotes entered in the system.

### Overdue Invoices
A red alert card highlights invoices past their due date without payment.

> KPI figures refresh automatically on every page navigation — no manual reload needed.`
  },
  {
    id: 'crm', icon: Users, color: 'purple', group: 'billing',
    title: 'Client Management (CRM)',
    subtitle: 'Manage clients, contacts and custom pricing',
    content: `
### Create a New Client
PATH: CRM → + New Client

**Required fields:**
- Name (person or company)
- Email address

**Optional fields:**
- Company name
- Phone, address (street, city, country)
- KKF number, VAT/BTW number
- Preferred currency (USD / EUR / SRD / USDT)
- Notes

> The **preferred currency** is auto-selected when creating new invoices for this client.

### Client Detail Page
Click any client to open their detail view:
1. **Invoices** — all invoices for this client
2. **Payments** — all received payments
3. **Credit Notes** — outstanding and processed credits
4. **Custom Pricing** — client-specific rates

### Custom Pricing per Client
Set unique rates per product category for a specific client:
1. Open client detail → tab **Pricing**
2. Click **+ Add Price**
3. Choose category and wood species
4. Enter the agreed price per m² or lm

! Custom prices override catalog prices automatically for invoices and quotes for that client.

### Search & Filter Clients
Use the search bar at the top of the CRM page to search by name, company or email.`
  },
  {
    id: 'estimates', icon: ClipboardList, color: 'violet', group: 'billing',
    title: 'Estimates (Quotes)',
    subtitle: 'Create and manage client proposals',
    content: `
### Create a New Estimate
PATH: Billing → Estimates → + New Estimate

1. Select client
2. Set date and expiry date
3. Choose currency (USD / EUR / SRD)
4. Add line items (see below)
5. Review subtotal, VAT and total
6. Save as Draft

### Adding Line Items
Three types of line items are available:
- 📦 **Product** — opens the product picker: choose category → wood species → model → dimension. Price is calculated automatically.
- ⚙️ **Service** — choose a processing service (Kiln Drying, Heat Treatment, Planing). Price per unit.
- 📝 **Item** — fully free-form description and price.

### Product Picker
1. Click **+ Add Product**
2. Choose **category** (Doors, Mouldings, Boards, Frames, Crating)
3. Choose **wood species** (Teak, Mahogany, Oak, etc.)
4. Choose **model** or **dimension**
5. Price is auto-calculated: dimension × wood species rate
6. Adjust **quantity** and click **Add**

### Status Flow
- **Draft** — not yet sent
- **Sent** — delivered to client
- **Accepted** — client agreed
- **Converted** — turned into an invoice
- **Expired** — past expiry date without action
- **Cancelled** — manually cancelled

### Convert to Invoice
PATH: Estimate detail → **Convert to Invoice** button

All line items, client data and amounts are carried over. Estimate status changes to "Converted".

> You can also **duplicate** any estimate — useful for similar repeat orders.`
  },
  {
    id: 'invoices', icon: Receipt, color: 'emerald', group: 'billing',
    title: 'Invoices',
    subtitle: 'Professional invoicing and follow-up',
    content: `
### Create an Invoice
PATH: Billing → Invoices → + New Invoice

**Fields:**
- **Client** — select from CRM
- **Invoice date** and **due date**
- **Currency** — USD, EUR, SRD (or USDT if enabled)
- **Exchange rate** — auto-loaded for non-SRD invoices
- **Reference** — optional PO or reference number
- **VAT rate** — select from configured rates
- **Discount** — percentage or fixed amount

### Product Picker
Same as estimates:
1. Category → Wood Species → Model → Dimension
2. Automatic price calculation:
   - **Doors**: width × height × base price (per m²)
   - **Boards / Frames**: length × price (per lm)
   - **Crating**: fixed price per piece
3. Client-specific price loads automatically if configured

### Currency & Exchange Rate
When selecting a non-SRD currency:
1. Enter the **exchange rate** (e.g. USD/SRD = 36.50)
2. The invoice stores this rate as a historical record
3. When payment is received in SRD, the **forex difference** is calculated automatically

### Invoice Status
- **Draft** — not sent
- **Sent** — delivered to client
- **Partial** — one or more payments received
- **Paid** — fully settled
- **Overdue** — past due date unpaid
- **Cancelled** — voided

### Link a Payment
From the invoice detail page, click **+ Payment** to record a payment. The link to the invoice is made automatically.

### Forex Difference
For foreign-currency invoices, the detail page shows a forex difference block after payment:
- 🟢 **Exchange gain** — you received more SRD than invoiced
- 🟠 **Exchange loss** — you received less SRD than invoiced

! The forex difference is informational. Book it manually in your external accounting system.`
  },
  {
    id: 'payments', icon: Wallet, color: 'emerald', group: 'billing',
    title: 'Payments',
    subtitle: 'Record and link incoming payments',
    content: `
### Record a Payment
PATH: Billing → Payments → + New Payment

1. **Client** — select from CRM
2. **Invoice** — link to open invoice (amount auto-loads)
3. **Amount** — adjust for partial payments
4. **Currency** — payment currency
5. **Date** — date received
6. **Payment method** — see table below
7. **Account** — bank account or cash register
8. **Reference** — transaction number / reference

### Payment Methods
- **Bank Transfer** — wire transfer
- **Cash** — physical cash payment
- **iDeal** — online payment
- **PayPal** — PayPal transaction
- **Cheque** — cheque payment
- **USDT** — Tether crypto *(requires "Crypto Payments" enabled in Settings)*

> **Enable USDT**: Go to Settings → toggle **"Crypto Payments (Tether)"** on.

### Partial Payments
An invoice can receive multiple partial payments:
1. Record the first payment with a partial amount
2. Invoice status changes to **Partial**
3. Record additional payments until fully covered
4. Invoice status automatically changes to **Paid**

### Payment Receipt
The payment detail page generates a complete receipt including:
- Company details and logo
- Client information
- Invoice reference
- Payment reference, date and amount

Use **Print** or **Download PDF** for an official document.`
  },
  {
    id: 'credits', icon: Coins, color: 'orange', group: 'billing',
    title: 'Credit Notes',
    subtitle: 'Reversals, returns and quality corrections',
    content: `
### What is a Credit Note?
A credit note partially or fully reverses an invoice. Use it when goods are returned, damaged, or a billing correction is needed.

### Create a Credit Note
PATH: Billing → Credit Notes → + New Credit Note

1. **Client** — select recipient
2. **Invoice** *(optional)* — link to specific invoice
3. **Amount** — amount to reverse
4. **Reason** — required, select from list

### Credit Note Reasons
- **Goods return** — client returns products
- **Damaged goods** — damage in delivery
- **Quality complaint** — product does not meet specifications
- **Overpayment** — client paid too much
- **Discount correction** — retroactive discount applied
- **Cancellation** — order cancelled after invoicing
- **Other** — free-form description

### Effect on Client Balance
After creating a credit note:
- Client balance is reduced by the credit amount
- Visible in client detail under **Credit Notes** tab
- Can be offset against the next invoice

! A credit note cannot be deleted after creation. Create a counter-invoice if a reversal is needed.`
  },
  {
    id: 'expenses', icon: Tag, color: 'red', group: 'finance',
    title: 'Expenses',
    subtitle: 'Track and categorize business costs',
    content: `
### Record an Expense
PATH: Expenses → + New Expense

**Fields:**
- **Description** — what the expense is for
- **Amount** and **currency**
- **Date** — when incurred
- **Category** — see categories below
- **Vendor** — link to a vendor
- **Payment method** — bank or cash
- **Reference** — vendor invoice number
- **Notes** — additional information

### Manage Categories
PATH: Expenses → Categories

Build your own category structure:
1. Click **+ New Category**
2. Choose an icon via the **icon picker** (100+ options in 10 groups)
3. Enter a name and save

**Default categories:**
- 🚛 Logistics & Transport
- 📦 Materials & Inventory
- 👷 Personnel costs
- 🏢 Office & Administration
- 🔧 Maintenance & Repairs
- ⚡ Utilities

> **Choosing an icon**: Click the icon field left of the name when creating a category. A picker opens with 100+ icons across 10 groups (Transport, Office, IT, Maintenance, etc.).

### Manage Vendors
PATH: Expenses → Vendors

Register vendor details for quick linking:
- Name, contact person
- Email, phone
- Address, VAT number
- Payment terms`
  },
  {
    id: 'finance', icon: Landmark, color: 'slate', group: 'finance',
    title: 'Internal Finance',
    subtitle: 'Bank accounts, cash registers and transfers',
    content: `
### Manage Bank Accounts
PATH: Internal Finance → Accounts

Register all company bank accounts:
- **Bank name** (e.g. Republic Bank, Hakrinbank)
- **Account number**
- **Opening balance**
- **Currency**

### Cash Registers
Manage multiple cash registers or counters:
- Cash Register 1 (EUR), Cash Register 2 (SRD), etc.
- Opening and closing balance per day

### Linking Accounts to Payments
When recording a payment, select which account receives the funds. This keeps account balances up to date.

### Internal Transfers
Transfer funds between accounts:
1. Select source account
2. Select destination account
3. Enter amount and date
4. Optionally enter exchange rate for currency conversions

> All transactions are visible in the **Account Overview** per account — date, description and running balance.`
  },
  {
    id: 'products', icon: Layers, color: 'amber', group: 'catalog',
    title: 'Products & Catalog',
    subtitle: 'Wood products, categories and pricing',
    content: `
### Product Hierarchy
The catalog is structured in layers:

**Level 1 — Category:**
Doors · Mouldings · Boards · Frames · Crating

**Level 2 — Wood Species:**
Teak · Mahogany (Crabwood) · Oak · Pine · Wana · Purpleheart

**Level 3 — Model / Dimension:**
Category-specific models or standard dimensions

### Create a New Product
PATH: Products → + New Product

1. Choose **category**
2. Choose **wood species**
3. Enter **model name** or **dimension**
4. Set **unit price** (per m², per lm, or per piece)
5. Optionally add an image and description

### Pricing by Category
- **Doors** — width × height × price/m²
- **Boards / Frames / Mouldings** — length × price/lm
- **Crating** — fixed price per piece

### Manage Categories
PATH: Products → Categories

Create subcategories for further product organisation.

### Client-Specific Pricing
PATH: CRM → Client Detail → Pricing Tab

Set different rates per client per product category. These automatically override catalog prices on invoices for that client.

> Keep wood species base prices up to date — they are the foundation of all invoice pricing.`
  },
  {
    id: 'services', icon: Settings2, color: 'purple', group: 'catalog',
    title: 'Services',
    subtitle: 'Processing services and rates',
    content: `
### Available Services
- 🌡️ **Kiln Drying** — thermal treatment for wood stabilisation (per m³)
- 🔥 **Heat Treatment** — phytosanitary treatment required for export (per m³)
- ✂️ **Planing / Profiling (Schaverij)** — surface processing (per m² or lm)
- 🔧 **Custom service** — any other bespoke processing work

### Create a Service
PATH: Services → + New Service

1. **Name** — service description
2. **Unit** — per piece / m² / lm / m³ / hour
3. **Base price** — standard rate
4. **Category** — for grouping in the overview

### Add to an Invoice or Estimate
When creating an invoice:
1. Click **⚙️ Add Service**
2. Select the service
3. Enter quantity
4. Price is calculated automatically

> Client-specific pricing also applies to services — configure via CRM → Client Detail → Pricing.

### Service Categories
PATH: Services → Categories

Group services into categories for cleaner management.`
  },
  {
    id: 'appearance', icon: LayoutTemplate, color: 'pink', group: 'system',
    title: 'Document Styles',
    subtitle: 'Customise invoice and quote appearance',
    content: `
### Document Styles
PATH: Document Styles (in navigation)

Choose from 4 professional invoice layouts:
- **Classic** — traditional business layout with header bar
- **Modern** — clean minimalist design
- **Compact** — space-efficient table layout
- **Executive** — premium dark header style

### Preview
Click any style for a live preview showing your company details and logo.

### Colour Themes
Choose an accent colour for your documents:
- Blue (default) · Green · Red/Orange · Purple · Grey/Monochrome

### Logo on Documents
The company logo uploaded in **Settings** appears automatically on all documents.

> Use a PNG with transparent background for the best result on printed documents.

### Print Settings
The **Print** button on any document detail page opens a print-optimised view without navigation elements.`
  },
  {
    id: 'currencies', icon: Globe2, color: 'blue', group: 'system',
    title: 'Multi-Currency & Exchange Rates',
    subtitle: 'Invoice in USD, EUR, SRD and USDT',
    content: `
### Enable Multi-Currency
PATH: Settings → Multi-Currency toggle → Enable

After enabling, you can create invoices in multiple currencies.

### Available Currencies
- **SRD** — Surinamese Dollar (base currency)
- **USD** — US Dollar
- **EUR** — Euro
- **USDT** — Tether *(requires separate Crypto Payments toggle in Settings)*

### Enter Exchange Rates
PATH: Billing → Exchange Rates

Enter daily rates for accurate bookkeeping:
1. Click **+ Add Rate**
2. Select **date**
3. Enter **USD/SRD** rate (e.g. 36.50)
4. Enter **EUR/SRD** rate (e.g. 39.80)
5. EUR/USD is calculated automatically
6. Click **Save**

### Exchange Rate on Invoices
When creating a USD or EUR invoice:
1. The **latest available rate** is loaded automatically
2. You can manually adjust the rate if needed
3. The applied rate is stored with the invoice

### Forex Difference (Exchange Gain/Loss)
After payment of a foreign-currency invoice, the system automatically calculates the difference:
- **Invoiced**: 1,000 USD × 36.50 = SRD 36,500
- **Received**: SRD 37,000
- **Exchange gain**: SRD 500 ✅

! The forex difference is informational. Record it manually in your external accounting.

### Rate History
The rate table shows a complete history of entered daily rates. Rates can be deleted via the trash icon.`
  },
  {
    id: 'insights', icon: TrendingUp, color: 'emerald', group: 'system',
    title: 'Business Insights',
    subtitle: 'Revenue analytics and performance intelligence',
    content: `
### Business Insights Dashboard
PATH: Insights (navigation)

Real-time analytics of your business performance — all data is read live from your invoices, payments and expenses.

### Period Filter
Use the **This month / This year / All** toggle (top right) to adjust all KPIs and charts.

### KPI Cards
- **Revenue received** — sum of payments in the selected period
- **Open AR** — outstanding accounts receivable (invoices not fully paid)
- **Avg. invoice value** — total invoiced ÷ invoice count
- **Avg. payment days** — average days from invoice date to payment date

### Monthly Revenue Chart
12-month bar chart for the current year. The current month is highlighted in blue. Hover to see exact amounts.

### Invoice Status Distribution
Horizontal bar showing Paid / Outstanding / Overdue / Draft as percentages of total invoices.

### Top 5 Clients
Ranked by total invoiced amount with payment percentage and progress bar.

### Payment Method Breakdown
Shows how clients pay — Bank Transfer, Cash, iDeal, PayPal, USDT, Cheque — with counts and percentages.

### Revenue vs Expenses (last 6 months)
Side-by-side bars per month: green = revenue, orange = costs. Net result shown below each month.`
  },
  {
    id: 'reports', icon: BarChart3, color: 'blue', group: 'system',
    title: 'Reports',
    subtitle: 'Financial analysis and exports',
    content: `
### Finance Reports
PATH: Reports → Finance

**Available reports:**
- **Revenue overview** — monthly, by client, by product
- **Cost analysis** — expenses by category
- **Profit & Loss** — revenue minus costs per period
- **VAT summary** — VAT due per period for filing
- **Open invoices aging** — 0–30 / 30–60 / 60+ days
- **Top clients** — ranked list by revenue

### Filters
- **Period** — week / month / quarter / year / custom
- **Currency** — filter by invoice currency
- **Client** — one specific client
- **Status** — paid / open / overdue

### Export
Via the **Download** button export to:
- 📄 **PDF** — for sharing externally
- 📊 **Excel** — for further spreadsheet analysis

### System Health
PATH: Reports → System Health

Technical indicators:
- User activity log
- Document counts by type
- Storage usage
- Recent error logs

> Export your VAT summary every quarter for your tax filing.`
  },
  {
    id: 'users', icon: Users, color: 'slate', group: 'system',
    title: 'User Management',
    subtitle: 'Manage access and permissions',
    content: `
### Manage Users
PATH: Users (navigation or header menu)

### Add a User
1. Click **+ New User**
2. Enter **name** and **email address**
3. Set a **password**
4. Choose a **role** (see below)
5. Save

### User Roles
- **Admin** — full access including settings and user management
- **Manager** — all modules except user management and system settings
- **Staff** — invoices, quotes, payments — read + create only
- **Viewer** — read-only access to all modules

### Edit a User
Click any user in the list to:
- Update name and email
- Change role
- Reset password
- Deactivate account

! Never delete the only Admin account without creating another Admin first — you will be locked out.`
  },
  {
    id: 'settings', icon: Settings, color: 'slate', group: 'system',
    title: 'Settings',
    subtitle: 'System configuration and company profile',
    content: `
### Company Profile
PATH: Settings → Company Profile

All fields here appear on your invoices and quotes:
- **Company name** · **Address** · **Phone** · **Email** · **Website**
- **KKF number** — Chamber of Commerce registration
- **VAT/BTW number** — fiscal registration

### Upload a Logo
1. Click the logo upload area
2. Select a PNG or JPG (max 2 MB)
3. Logo is saved and appears on all documents
4. Use **Remove logo** to revert to text display

> Use a PNG with transparent background for the cleanest result.

### VAT / BTW Rates
PATH: Settings → VAT Rates

Configure tax rates for your region:
1. Click **+ Add Rate**
2. Enter name (e.g. "VAT 21%") and percentage
3. Set one rate as the **default** via the toggle

**Default rates:**
- Standard VAT: 21%
- Export VAT: 0%

### Currency Settings
- **Default currency** — pre-selected on new invoices
- **Multi-currency** — toggle to activate multiple currencies

### Crypto Payments
Toggle to enable **USDT (Tether)** as a payment option. After enabling, USDT appears in all currency and payment method dropdowns.

### Language
- **English** (default)
- **Nederlands**

Language preference is stored locally per user.`
  },
  {
    id: 'faq', icon: HelpCircle, color: 'slate', group: 'system',
    title: 'FAQ',
    subtitle: 'Frequently asked questions',
    content: `
### How do I convert an estimate to an invoice?
PATH: Billing → Estimates → Open estimate → **Convert to Invoice** button

The estimate must have status **Accepted**. All line items and client data are carried over automatically.

---

### How do I record a partial payment?
PATH: Billing → Payments → + New Payment

Enter an amount lower than the open invoice amount. The invoice status changes to **Partial**. Repeat for additional payments.

---

### How do I enable USDT / crypto payments?
PATH: Settings → toggle **"Crypto Payments (Tether)"** on

After enabling, USDT appears as an option in all currency dropdowns.

---

### How do I set a client-specific price?
PATH: CRM → Click client → **Pricing** tab → + Add Price

Enter category, wood species and agreed price. This price loads automatically on invoices for that client.

---

### Where do I find the forex difference on an invoice?
Open the **invoice detail page** of a fully paid foreign-currency invoice. The forex block appears below the payment history.

---

### How do I export a report to PDF?
PATH: Reports → Finance Reports → **Download → PDF** button

---

### How do I change the invoice design?
PATH: Document Styles (navigation) → Choose style → Click **Activate**

---

### Can I add multiple VAT rates?
Yes. PATH: Settings → VAT Rates → + Add Rate

Multiple rates can coexist. One rate is the default; the rest are selectable per invoice line item.

---

### How do I delete an exchange rate?
PATH: Billing → Exchange Rates → Click the 🗑️ icon on the rate row

---

### How do I upload a company logo?
PATH: Settings → Logo field → Click to upload

Supported: PNG, JPG (recommended: PNG with transparency, max 2 MB).`
  },
];

// ── Color map ─────────────────────────────────────────────────────────────────
const colorMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue:   { bg: 'bg-blue-500',   text: 'text-blue-600',   border: 'border-blue-100',   light: 'bg-blue-50'   },
  purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-100', light: 'bg-purple-50' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-100', light: 'bg-violet-50' },
  emerald:{ bg: 'bg-emerald-500',text: 'text-emerald-600',border: 'border-emerald-100',light: 'bg-emerald-50'},
  orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-100', light: 'bg-orange-50' },
  red:    { bg: 'bg-red-500',    text: 'text-red-600',    border: 'border-red-100',    light: 'bg-red-50'    },
  amber:  { bg: 'bg-amber-500',  text: 'text-amber-600',  border: 'border-amber-100',  light: 'bg-amber-50'  },
  slate:  { bg: 'bg-slate-700',  text: 'text-slate-600',  border: 'border-slate-200',  light: 'bg-slate-100' },
  pink:   { bg: 'bg-pink-500',   text: 'text-pink-600',   border: 'border-pink-100',   light: 'bg-pink-50'   },
};

// ── Inline renderer ───────────────────────────────────────────────────────────
const renderInline = (text: string): React.ReactNode => {
  if (!text.includes('**')) return text;
  return text.split('**').map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-bold text-slate-900">{part}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
};

// ── Rich content renderer ─────────────────────────────────────────────────────
const renderContent = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;

  let bullets: string[]  = [];
  let ordered: string[]  = [];
  let tableLines: string[] = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    result.push(
      <ul key={key++} className="my-2 space-y-1.5 pl-1">
        {bullets.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-[7px] shrink-0" />
            <span className="leading-relaxed">{renderInline(item.replace(/^- /, ''))}</span>
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  const flushOrdered = () => {
    if (!ordered.length) return;
    result.push(
      <ol key={key++} className="my-3 space-y-2">
        {ordered.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
            <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <span className="leading-relaxed">{renderInline(item.replace(/^\d+\.\s+/, ''))}</span>
          </li>
        ))}
      </ol>
    );
    ordered = [];
  };

  const flushTable = () => {
    if (tableLines.length < 2) { tableLines = []; return; }
    const allRows = tableLines.filter(l => !l.match(/^\|[\s|:-]+\|$/));
    if (!allRows.length) { tableLines = []; return; }
    const [header, ...body] = allRows;
    const headers = header.split('|').map(h => h.trim()).filter(Boolean);
    const rows = body.map(l => l.split('|').map(c => c.trim()).filter(Boolean));
    result.push(
      <div key={key++} className="my-3 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-black text-slate-600 text-[10px] uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-slate-600 leading-relaxed">{renderInline(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableLines = [];
  };

  lines.forEach(line => {
    // table
    if (line.trim().startsWith('|')) {
      flushBullets(); flushOrdered();
      tableLines.push(line);
      return;
    } else if (tableLines.length) { flushTable(); }

    // blank line
    if (line.trim() === '') {
      flushBullets(); flushOrdered();
      result.push(<div key={key++} className="h-1.5" />);
      return;
    }

    // ### subheader
    if (line.startsWith('### ')) {
      flushBullets(); flushOrdered();
      result.push(
        <div key={key++} className="flex items-center gap-2 mt-5 mb-2">
          <div className="w-1 h-4 bg-blue-500 rounded-full shrink-0" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{line.slice(4)}</h3>
        </div>
      );
      return;
    }

    // --- divider
    if (line.trim() === '---') {
      flushBullets(); flushOrdered();
      result.push(<hr key={key++} className="my-4 border-slate-100" />);
      return;
    }

    // > tip box
    if (line.startsWith('> ')) {
      flushBullets(); flushOrdered();
      result.push(
        <div key={key++} className="flex gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100 my-2">
          <Lightbulb size={14} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-800 leading-relaxed font-medium">{renderInline(line.slice(2))}</p>
        </div>
      );
      return;
    }

    // ! warning box
    if (line.startsWith('! ')) {
      flushBullets(); flushOrdered();
      result.push(
        <div key={key++} className="flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100 my-2">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed font-medium">{renderInline(line.slice(2))}</p>
        </div>
      );
      return;
    }

    // PATH: navigation breadcrumb
    if (line.startsWith('PATH: ')) {
      flushBullets(); flushOrdered();
      const parts = line.slice(6).split(' → ');
      result.push(
        <div key={key++} className="flex items-center gap-1 flex-wrap my-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Path:</span>
          {parts.map((part, pi) => (
            <React.Fragment key={pi}>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">{part}</span>
              {pi < parts.length - 1 && <ArrowRight size={10} className="text-slate-400 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      );
      return;
    }

    // - bullet
    if (line.startsWith('- ')) {
      flushOrdered();
      bullets.push(line);
      return;
    }

    // 1. numbered
    if (/^\d+\.\s/.test(line)) {
      flushBullets();
      ordered.push(line);
      return;
    }

    // regular paragraph
    flushBullets(); flushOrdered();
    result.push(
      <p key={key++} className="text-sm text-slate-600 leading-relaxed">{renderInline(line)}</p>
    );
  });

  flushBullets();
  flushOrdered();
  if (tableLines.length) flushTable();

  return result;
};

// ── Component ─────────────────────────────────────────────────────────────────
const DocumentationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('quickstart');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    search.trim()
      ? sections.filter(s =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.content.toLowerCase().includes(search.toLowerCase())
        )
      : sections,
    [search]
  );

  const active = sections.find(s => s.id === activeSection) ?? sections[0];
  const c = colorMap[active.color] ?? colorMap.slate;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">

      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0">
          <BookOpen size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Documentation</h1>
          <p className="text-sm font-medium text-slate-500">Complete guide to the Ramzon ERP system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">

            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search docs..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-200 font-medium"
                />
              </div>
            </div>

            {/* Nav */}
            <div className="p-2 max-h-[70vh] overflow-y-auto no-scrollbar">
              {groups.map(g => {
                const groupSections = filtered.filter(s => s.group === g.id);
                if (!groupSections.length) return null;
                return (
                  <div key={g.id} className="mb-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1.5">{g.label}</p>
                    <div className="space-y-0.5">
                      {groupSections.map(s => {
                        const Icon = s.icon;
                        const isActive = activeSection === s.id;
                        return (
                          <button key={s.id} onClick={() => { setActiveSection(s.id); setSearch(''); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                            <Icon size={13} className="shrink-0" />
                            <span className="flex-1 leading-snug">{s.title}</span>
                            {isActive && <ChevronRight size={11} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Section header */}
            <div className={`px-7 py-5 border-b ${c.border} ${c.light} flex items-center gap-4`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
                <active.icon size={17} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">{active.title}</h2>
                <p className="text-[11px] text-slate-500 font-medium">{active.subtitle}</p>
              </div>
            </div>

            {/* Rendered content */}
            <div className="p-7 space-y-0.5">
              {renderContent(active.content)}
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle size={16} className="text-blue-400" />
              <h3 className="font-black text-xs uppercase tracking-widest">Quick Reference</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'New Invoice',      key: 'Invoices → + New',         color: 'bg-emerald-500/20 text-emerald-300' },
                { label: 'Quote → Invoice',  key: 'Estimate → Convert',       color: 'bg-blue-500/20 text-blue-300'    },
                { label: 'Client Pricing',   key: 'CRM → Client → Pricing',   color: 'bg-purple-500/20 text-purple-300' },
                { label: 'Finance Reports',  key: 'Reports → Finance',         color: 'bg-amber-500/20 text-amber-300'  },
              ].map(q => (
                <div key={q.label} className={`${q.color} rounded-xl p-3`}>
                  <p className="font-black text-[9px] uppercase tracking-widest mb-1">{q.label}</p>
                  <p className="text-xs opacity-80 font-medium">{q.key}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
