
import { Invoice, Client, WoodProduct, User, Expense, MediaItem, Estimate, Payment, Credit } from '../types';

// ─── Ramzon Services Catalog ───────────────────────────────────────────────
export const RAMZON_SERVICES = [
  { id: 'svc1', name: 'Drogen',               unit: 'm³',  price: 150, description: 'Hout drogen in droogkamer' },
  { id: 'svc2', name: 'Heat Treatment',        unit: 'm³',  price: 200, description: 'ISPM-15 warmtebehandeling / fytosanitair' },
  { id: 'svc3', name: 'Schaverij',             unit: 'm²',  price: 35,  description: 'Herschaven en profileren van hout' },
  { id: 'svc4', name: 'Zaagwerk',              unit: 'm³',  price: 80,  description: 'Op maat zagen (bandzaag / cirkelzaag)' },
  { id: 'svc5', name: 'Impregneren',           unit: 'm³',  price: 120, description: 'Chemische houtbescherming (buiten/tropisch)' },
  { id: 'svc6', name: 'Levering Paramaribo',   unit: 'rit', price: 250, description: 'Transport en bezorging — Paramaribo district' },
  { id: 'svc7', name: 'Levering Binnenland',   unit: 'rit', price: 600, description: 'Transport naar binnenland / districten' },
];

// ─── Ramzon Product Catalog ────────────────────────────────────────────────
export const RAMZON_HOUTSOORTEN = ['Teak', 'Oak', 'Mahogany', 'Pine', 'Kopi', 'Purpleheart', 'Wenge', 'Ipe'];

export const RAMZON_PRODUCT_CATALOG = [
  {
    category: 'Deuren',
    icon: '🚪',
    subcategories: [
      { name: 'Enkele Deur',   specs: ['60x200cm', '70x200cm', '80x200cm', '90x200cm'], basePrice: 850 },
      { name: 'Dubbele Deur',  specs: ['120x200cm', '140x200cm', '160x200cm'],          basePrice: 1600 },
      { name: 'Schuifdeur',    specs: ['80x210cm', '90x210cm', '100x210cm'],            basePrice: 950 },
      { name: 'Terrasdeur',    specs: ['90x215cm', '100x215cm'],                        basePrice: 1100 },
    ],
  },
  {
    category: 'Mouldings',
    icon: '📐',
    subcategories: [
      { name: 'Kroonlijst',  specs: ['per m'], basePrice: 18 },
      { name: 'Plintlijst',  specs: ['per m'], basePrice: 12 },
      { name: 'Hoeklijst',   specs: ['per m'], basePrice: 10 },
      { name: 'Architraaf',  specs: ['per m'], basePrice: 15 },
    ],
  },
  {
    category: 'Lijsten',
    icon: '📏',
    subcategories: [
      { name: 'Vlaklijst',      specs: ['20x40mm', '25x50mm', '30x60mm', '40x80mm'], basePrice: 8 },
      { name: 'Profiellijst',   specs: ['25mm', '35mm', '50mm'],                     basePrice: 14 },
      { name: 'Jaloezielatten', specs: ['per m²'],                                   basePrice: 45 },
    ],
  },
  {
    category: 'Kozijnen',
    icon: '🪟',
    subcategories: [
      { name: 'Raamkozijn',   specs: ['60x90cm', '80x100cm', '100x120cm', '120x140cm'], basePrice: 380 },
      { name: 'Deurkozijn',   specs: ['80x200cm', '90x210cm', '100x210cm'],              basePrice: 290 },
      { name: 'Stalenkozijn', specs: ['per m²'],                                         basePrice: 520 },
    ],
  },
  {
    category: 'Crating',
    icon: '📦',
    subcategories: [
      { name: 'Standaard Krat',  specs: ['Klein', 'Medium', 'Groot'], basePrice: 120 },
      { name: 'Zeewaardig Krat', specs: ['Klein', 'Medium', 'Groot'], basePrice: 220 },
      { name: 'ISPM-15 Krat',    specs: ['Klein', 'Medium', 'Groot'], basePrice: 280 },
    ],
  },
];

// ─── Clients ───────────────────────────────────────────────────────────────
export const mockClients: Client[] = [
  { id: 'c1', name: 'John Doe',      company: 'Build-It Ltd',              email: 'john@buildit.com',      vatNumber: 'NL123456789B01',  address: 'Main St 1, Amsterdam',                  totalSpent: 28400, status: 'Active', phone: '+31 20 123 4567', preferredCurrency: 'USD' },
  { id: 'c2', name: 'Sarah Miller',  company: 'Miller Furniture',          email: 'sarah@miller.com',      vatNumber: 'NL987654321B01',  address: 'Woodway 42, Rotterdam',                 totalSpent: 15200, status: 'Active', phone: '+31 10 987 6543', preferredCurrency: 'SRD' },
  { id: 'c3', name: 'Dinesh Abhelak',company: 'Abhelak Constructions',     email: 'dinesh@abhelak.com',    vatNumber: 'SR-ABHELAK-001',  address: 'Kanaalstraat 14, Paramaribo',           totalSpent: 38600, status: 'Active', phone: '+597 8594052',    preferredCurrency: 'SRD' },
  { id: 'c4', name: 'Kamal Jiawan',  company: 'Jiawan Interiors',          email: 'kamal@jiawan.com',      vatNumber: 'SR-JI-002',       address: 'Henck Arronstraat 88, Paramaribo',     totalSpent: 18750, status: 'Active', phone: '+597 7213344',    preferredCurrency: 'EUR' },
  { id: 'c5', name: 'Devon Charles', company: 'Caribbean Furniture Group', email: 'devon@caribfurniture.com', vatNumber: 'SR-CFG-003',   address: 'Tourtonnelaan 22, Paramaribo',          totalSpent: 41200, status: 'Active', phone: '+597 4512678',    preferredCurrency: 'USD' },
  { id: 'c6', name: 'Ravi Sewnandan',company: 'Tropical Wood NV',          email: 'ravi@tropwood.sr',      vatNumber: 'SR-TW-004',       address: 'Industrieweg Noord 5, Paramaribo',     totalSpent: 9800,  status: 'Active', phone: '+597 6671234',    preferredCurrency: 'SRD' },
  { id: 'c7', name: 'Marco Fernandes',company: 'Fernandes Bouw & Interieur',email: 'marco@fernandes.sr',  vatNumber: 'SR-FBI-005',       address: 'Kwattaweg 177, Paramaribo',            totalSpent: 12300, status: 'Active', phone: '+597 5559012',    preferredCurrency: 'EUR' },
];

// ─── Wood Products ─────────────────────────────────────────────────────────
export const mockWoodProducts: WoodProduct[] = [
  { id: 'p1', name: 'Premium Teak Planks',    woodType: 'Teak',     thickness: 25,  width: 150, length: 2400, unit: 'm³',  pricePerUnit: 4500, stock: 12.5 },
  { id: 'p2', name: 'Oak Flooring Grade A',   woodType: 'Oak',      thickness: 20,  width: 180, length: 2000, unit: 'm²',  pricePerUnit: 85,   stock: 450 },
  { id: 'p3', name: 'Mahogany Beams',         woodType: 'Mahogany', thickness: 100, width: 100, length: 3000, unit: 'pcs', pricePerUnit: 120,  stock: 45 },
  { id: 'p4', name: 'Purpleheart Planks',     woodType: 'Purpleheart',thickness: 30, width: 120, length: 2400, unit: 'm³', pricePerUnit: 3800, stock: 8 },
  { id: 'p5', name: 'Wenge Boards 40x80mm',   woodType: 'Wenge',    thickness: 40,  width: 80,  length: 2000, unit: 'pcs', pricePerUnit: 28,   stock: 320 },
];

// ─── Invoices (Jan – Mar 2026) ─────────────────────────────────────────────
export const mockInvoices: Invoice[] = [
  // ── January 2026 ──
  {
    id: 'inv1', invoiceNumber: 'INV-2026-001', clientId: 'c1', clientName: 'Build-It Ltd',
    date: '2026-01-03', dueDate: '2026-01-17', subtotal: 1350, taxRate: 10, taxAmount: 135, totalAmount: 1485, status: 'Paid',
    items: [
      { id: 'i1', productId: 'p1', description: 'Hout drogen — Kopi 2 m³', quantity: 2, unitPrice: 150, total: 300 },
      { id: 'i2', productId: 'p2', description: 'Schaverij vloerhout 30 m²', quantity: 30, unitPrice: 35, total: 1050 },
    ]
  },
  {
    id: 'inv2', invoiceNumber: 'INV-2026-002', clientId: 'c3', clientName: 'Abhelak Constructions',
    date: '2026-01-08', dueDate: '2026-01-22', subtotal: 5120, taxRate: 10, taxAmount: 512, totalAmount: 5632, status: 'Paid',
    items: [
      { id: 'i3', productId: 'p1', description: 'Teak Raamkozijn 100×120 cm', quantity: 8,  unitPrice: 380, total: 3040 },
      { id: 'i4', productId: 'p3', description: 'Teak Enkele Deur 80×200 cm', quantity: 2,  unitPrice: 850, total: 1700 },
      { id: 'i5', productId: 'p2', description: 'Plintlijst per m',           quantity: 20, unitPrice: 19,  total: 380  },
    ]
  },
  {
    id: 'inv3', invoiceNumber: 'INV-2026-003', clientId: 'c5', clientName: 'Caribbean Furniture Group',
    date: '2026-01-15', dueDate: '2026-01-29', subtotal: 8280, taxRate: 10, taxAmount: 828, totalAmount: 9108, status: 'Paid',
    items: [
      { id: 'i6', productId: 'p3', description: 'Mahogany Dubbele Deur 120×200 cm', quantity: 4, unitPrice: 1600, total: 6400 },
      { id: 'i7', productId: 'p1', description: 'ISPM-15 Krat Groot',               quantity: 4, unitPrice: 280,  total: 1120 },
      { id: 'i8', productId: 'p2', description: 'Raamkozijn 60×90 cm',              quantity: 2, unitPrice: 380,  total: 760  },
    ]
  },
  {
    id: 'inv4', invoiceNumber: 'INV-2026-004', clientId: 'c2', clientName: 'Miller Furniture',
    date: '2026-01-20', dueDate: '2026-02-03', subtotal: 2100, taxRate: 10, taxAmount: 210, totalAmount: 2310, status: 'Paid',
    items: [
      { id: 'i9',  productId: 'p4', description: 'Purpleheart Kroonlijst per m', quantity: 80, unitPrice: 18, total: 1440 },
      { id: 'i10', productId: 'p5', description: 'Wenge Plintlijst per m',       quantity: 40, unitPrice: 12, total: 480  },
      { id: 'i11', productId: 'p5', description: 'Hoeklijst per m',              quantity: 20, unitPrice: 9,  total: 180  },
    ]
  },
  // ── February 2026 ──
  {
    id: 'inv5', invoiceNumber: 'INV-2026-005', clientId: 'c4', clientName: 'Jiawan Interiors',
    date: '2026-02-04', dueDate: '2026-02-18', subtotal: 3800, taxRate: 10, taxAmount: 380, totalAmount: 4180, status: 'Paid',
    items: [
      { id: 'i12', productId: 'p4', description: 'Purpleheart Schuifdeur 90×210 cm', quantity: 4, unitPrice: 950, total: 3800 },
    ]
  },
  {
    id: 'inv6', invoiceNumber: 'INV-2026-006', clientId: 'c6', clientName: 'Tropical Wood NV',
    date: '2026-02-10', dueDate: '2026-02-24', subtotal: 1650, taxRate: 10, taxAmount: 165, totalAmount: 1815, status: 'Paid',
    items: [
      { id: 'i13', productId: 'p5', description: 'Wenge Vlaklijst 40×80 mm',   quantity: 120, unitPrice: 8.5, total: 1020 },
      { id: 'i14', productId: 'p3', description: 'Architraaf Mahogany per m', quantity: 42,  unitPrice: 15,  total: 630  },
    ]
  },
  {
    id: 'inv7', invoiceNumber: 'INV-2026-007', clientId: 'c1', clientName: 'Build-It Ltd',
    date: '2026-02-14', dueDate: '2026-02-28', subtotal: 9060, taxRate: 10, taxAmount: 906, totalAmount: 9966, status: 'Paid',
    items: [
      { id: 'i15', productId: 'p1', description: 'ISPM-15 Krat Groot',               quantity: 12, unitPrice: 280, total: 3360 },
      { id: 'i16', productId: 'p1', description: 'Heat Treatment 3 m³ Teak',         quantity: 3,  unitPrice: 200, total: 600  },
      { id: 'i17', productId: 'p1', description: 'Teak Enkele Deur 80×200 cm',       quantity: 6,  unitPrice: 850, total: 5100 },
    ]
  },
  {
    id: 'inv8', invoiceNumber: 'INV-2026-008', clientId: 'c7', clientName: 'Fernandes Bouw & Interieur',
    date: '2026-02-20', dueDate: '2026-03-06', subtotal: 4720, taxRate: 10, taxAmount: 472, totalAmount: 5192, status: 'Overdue',
    items: [
      { id: 'i18', productId: 'p3', description: 'Deurkozijn 90×210 cm',    quantity: 6,  unitPrice: 290, total: 1740 },
      { id: 'i19', productId: 'p1', description: 'Stalenkozijn per m²',     quantity: 4,  unitPrice: 520, total: 2080 },
      { id: 'i20', productId: 'p4', description: 'Kroonlijst Purpleheart',  quantity: 50, unitPrice: 18,  total: 900  },
    ]
  },
  {
    id: 'inv9', invoiceNumber: 'INV-2026-009', clientId: 'c3', clientName: 'Abhelak Constructions',
    date: '2026-02-25', dueDate: '2026-03-11', subtotal: 6170, taxRate: 10, taxAmount: 617, totalAmount: 6787, status: 'Overdue',
    items: [
      { id: 'i21', productId: 'p1', description: 'Teak Terrasdeur 100×215 cm',   quantity: 4, unitPrice: 1100, total: 4400 },
      { id: 'i22', productId: 'p1', description: 'Zeewaardig Krat Medium',        quantity: 6, unitPrice: 220,  total: 1320 },
      { id: 'i23', productId: 'p1', description: 'Hout drogen 3 m³',             quantity: 3, unitPrice: 150,  total: 450  },
    ]
  },
  // ── March 2026 ──
  {
    id: 'inv10', invoiceNumber: 'INV-2026-010', clientId: 'c5', clientName: 'Caribbean Furniture Group',
    date: '2026-03-03', dueDate: '2026-03-17', subtotal: 11040, taxRate: 10, taxAmount: 1104, totalAmount: 12144, status: 'Pending',
    items: [
      { id: 'i24', productId: 'p3', description: 'Mahogany Dubbele Deur 140×200 cm', quantity: 5, unitPrice: 1600, total: 8000 },
      { id: 'i25', productId: 'p1', description: 'ISPM-15 Krat Groot',               quantity: 8, unitPrice: 280,  total: 2240 },
      { id: 'i26', productId: 'p1', description: 'Heat Treatment 4 m³',              quantity: 4, unitPrice: 200,  total: 800  },
    ]
  },
  {
    id: 'inv11', invoiceNumber: 'INV-2026-011', clientId: 'c4', clientName: 'Jiawan Interiors',
    date: '2026-03-06', dueDate: '2026-03-20', subtotal: 2800, taxRate: 10, taxAmount: 280, totalAmount: 3080, status: 'Pending',
    items: [
      { id: 'i27', productId: 'p2', description: 'Raamkozijn 80×100 cm',     quantity: 5,  unitPrice: 380, total: 1900 },
      { id: 'i28', productId: 'p2', description: 'Jaloezielatten per m²',    quantity: 20, unitPrice: 45,  total: 900  },
    ]
  },
  {
    id: 'inv12', invoiceNumber: 'INV-2026-012', clientId: 'c2', clientName: 'Miller Furniture',
    date: '2026-03-10', dueDate: '2026-03-24', subtotal: 1960, taxRate: 10, taxAmount: 196, totalAmount: 2156, status: 'Draft',
    items: [
      { id: 'i29', productId: 'p5', description: 'Profiellijst 35 mm',     quantity: 60,  unitPrice: 14, total: 840  },
      { id: 'i30', productId: 'p5', description: 'Vlaklijst 20×40 mm',     quantity: 140, unitPrice: 8,  total: 1120 },
    ]
  },
];

// ─── Estimates (Jan – Mar 2026) ────────────────────────────────────────────
export const mockEstimates: Estimate[] = [
  {
    id: 'e1', estimateNumber: 'EST-2026-001', clientId: 'c1', clientName: 'Build-It Ltd',
    date: '2026-01-05', subtotal: 5830, taxRate: 10, taxAmount: 583, total: 6413, status: 'Sent',
    items: [
      { id: 'ei1', productId: 'p1', description: 'Teak Enkele Deur 80×200 cm',    quantity: 4, unitPrice: 850, total: 3400 },
      { id: 'ei2', productId: 'p1', description: 'ISPM-15 Krat Groot',            quantity: 6, unitPrice: 280, total: 1680 },
      { id: 'ei3', productId: 'p1', description: 'Hout drogen 5 m³',             quantity: 5, unitPrice: 150, total: 750  },
    ]
  },
  {
    id: 'e2', estimateNumber: 'EST-2026-002', clientId: 'c2', clientName: 'Miller Furniture',
    date: '2026-01-12', subtotal: 1270, taxRate: 10, taxAmount: 127, total: 1397, status: 'Accepted',
    items: [
      { id: 'ei4', productId: 'p5', description: 'Profiellijst 35 mm',   quantity: 45, unitPrice: 14, total: 630 },
      { id: 'ei5', productId: 'p5', description: 'Vlaklijst 20×40 mm',   quantity: 80, unitPrice: 8,  total: 640 },
    ]
  },
  {
    id: 'e3', estimateNumber: 'EST-2026-003', clientId: 'c3', clientName: 'Abhelak Constructions',
    date: '2026-01-22', subtotal: 8340, taxRate: 10, taxAmount: 834, total: 9174, status: 'Sent',
    items: [
      { id: 'ei6', productId: 'p1', description: 'Raamkozijn 100×120 cm', quantity: 10, unitPrice: 380, total: 3800 },
      { id: 'ei7', productId: 'p3', description: 'Deurkozijn 90×210 cm',  quantity: 6,  unitPrice: 290, total: 1740 },
      { id: 'ei8', productId: 'p2', description: 'Schaverij 80 m²',       quantity: 80, unitPrice: 35,  total: 2800 },
    ]
  },
  {
    id: 'e4', estimateNumber: 'EST-2026-004', clientId: 'c4', clientName: 'Jiawan Interiors',
    date: '2026-02-03', subtotal: 3800, taxRate: 10, taxAmount: 380, total: 4180, status: 'Accepted',
    items: [
      { id: 'ei9', productId: 'p4', description: 'Purpleheart Schuifdeur 90×210 cm', quantity: 4, unitPrice: 950, total: 3800 },
    ]
  },
  {
    id: 'e5', estimateNumber: 'EST-2026-005', clientId: 'c5', clientName: 'Caribbean Furniture Group',
    date: '2026-02-15', subtotal: 14440, taxRate: 10, taxAmount: 1444, total: 15884, status: 'Sent',
    items: [
      { id: 'ei10', productId: 'p3', description: 'Mahogany Dubbele Deur 140×200 cm', quantity: 7, unitPrice: 1600, total: 11200 },
      { id: 'ei11', productId: 'p1', description: 'ISPM-15 Krat Groot',               quantity: 8, unitPrice: 280,  total: 2240  },
      { id: 'ei12', productId: 'p1', description: 'Heat Treatment 5 m³',              quantity: 5, unitPrice: 200,  total: 1000  },
    ]
  },
  {
    id: 'e6', estimateNumber: 'EST-2026-006', clientId: 'c6', clientName: 'Tropical Wood NV',
    date: '2026-02-28', subtotal: 2800, taxRate: 10, taxAmount: 280, total: 3080, status: 'Draft',
    items: [
      { id: 'ei13', productId: 'p1', description: 'Zeewaardig Krat Medium',      quantity: 8,   unitPrice: 220, total: 1760 },
      { id: 'ei14', productId: 'p5', description: 'Wenge Vlaklijst 40×80 mm',    quantity: 130, unitPrice: 8,   total: 1040 },
    ]
  },
  {
    id: 'e7', estimateNumber: 'EST-2026-007', clientId: 'c7', clientName: 'Fernandes Bouw & Interieur',
    date: '2026-03-01', subtotal: 7050, taxRate: 10, taxAmount: 705, total: 7755, status: 'Sent',
    items: [
      { id: 'ei15', productId: 'p1', description: 'Stalenkozijn per m²',          quantity: 8,  unitPrice: 520, total: 4160 },
      { id: 'ei16', productId: 'p3', description: 'Deurkozijn 90×210 cm',         quantity: 5,  unitPrice: 290, total: 1450 },
      { id: 'ei17', productId: 'p4', description: 'Purpleheart Kroonlijst per m', quantity: 80, unitPrice: 18,  total: 1440 },
    ]
  },
  {
    id: 'e8', estimateNumber: 'EST-2026-008', clientId: 'c2', clientName: 'Miller Furniture',
    date: '2026-03-05', subtotal: 3200, taxRate: 10, taxAmount: 320, total: 3520, status: 'Draft',
    items: [
      { id: 'ei18', productId: 'p5', description: 'Profiellijst 50 mm',         quantity: 100, unitPrice: 14, total: 1400 },
      { id: 'ei19', productId: 'p3', description: 'Architraaf Mahogany per m',  quantity: 60,  unitPrice: 15, total: 900  },
      { id: 'ei20', productId: 'p2', description: 'Jaloezielatten per m²',      quantity: 20,  unitPrice: 45, total: 900  },
    ]
  },
];

// ─── Payments (Jan – Mar 2026) ─────────────────────────────────────────────
export const mockPayments: Payment[] = [
  { id: 'pay1',  clientId: 'c1', amount: 1485,  currency: 'USD', bankAccountId: 'dsb_usd', date: '2026-01-17', method: 'Bank Transfer',  reference: 'INV-2026-001 — Full Payment',          status: 'Completed' },
  { id: 'pay2',  clientId: 'c3', amount: 3000,  currency: 'SRD', bankAccountId: 'dsb_srd', date: '2026-01-22', method: 'Bank Transfer',  reference: 'INV-2026-002 — Advance 53%',           status: 'Completed' },
  { id: 'pay3',  clientId: 'c3', amount: 2632,  currency: 'SRD', bankAccountId: 'dsb_srd', date: '2026-01-30', method: 'Bank Transfer',  reference: 'INV-2026-002 — Balance',               status: 'Completed' },
  { id: 'pay4',  clientId: 'c5', amount: 9108,  currency: 'USD', bankAccountId: 'dsb_usd', date: '2026-01-29', method: 'Wire Transfer',  reference: 'INV-2026-003 — Full Payment',          status: 'Completed' },
  { id: 'pay5',  clientId: 'c2', amount: 2310,  currency: 'SRD', bankAccountId: 'hkb_srd', date: '2026-02-03', method: 'Cash',           reference: 'INV-2026-004 — Full Payment',          status: 'Completed' },
  { id: 'pay6',  clientId: 'c6', amount: 1815,  currency: 'SRD', bankAccountId: 'dsb_srd', date: '2026-02-12', method: 'Bank Transfer',  reference: 'INV-2026-006 — Full Payment',          status: 'Completed' },
  { id: 'pay7',  clientId: 'c4', amount: 4180,  currency: 'EUR', bankAccountId: 'ing_eur', date: '2026-02-18', method: 'iDEAL',          reference: 'INV-2026-005 — Full Payment',          status: 'Completed' },
  { id: 'pay8',  clientId: 'c1', amount: 9966,  currency: 'USD', bankAccountId: 'dsb_usd', date: '2026-02-28', method: 'Wire Transfer',  reference: 'INV-2026-007 — Full Payment',          status: 'Completed' },
  { id: 'pay9',  clientId: 'c1', amount: 800,   currency: 'USDT',bankAccountId: 'crypto',  date: '2026-02-22', method: 'Crypto (USDT)', reference: 'Misc. advance payment',                status: 'Completed' },
  { id: 'pay10', clientId: 'c5', amount: 6000,  currency: 'USD', bankAccountId: 'dsb_usd', date: '2026-03-01', method: 'Wire Transfer',  reference: 'INV-2026-010 — Advance 50%',           status: 'Completed' },
  { id: 'pay11', clientId: 'c4', amount: 1500,  currency: 'SRD', bankAccountId: 'hkb_srd', date: '2026-03-02', method: 'Cash',           reference: 'INV-2026-011 — Down Payment',          status: 'Completed' },
  { id: 'pay12', clientId: 'c3', amount: 2500,  currency: 'SRD', bankAccountId: 'dsb_srd', date: '2026-03-04', method: 'Bank Transfer',  reference: 'INV-2026-009 — Partial Payment',       status: 'Completed' },
];

// ─── Credits ───────────────────────────────────────────────────────────────
export const mockCredits: Credit[] = [
  { id: 'cr1', clientId: 'c1', amount: 250,  date: '2026-01-20', reason: 'Damaged boards — refund',                status: 'Available' },
  { id: 'cr2', clientId: 'c2', amount: 175,  date: '2026-01-28', reason: 'Size correction Oak Flooring',           status: 'Used'      },
  { id: 'cr3', clientId: 'c3', amount: 600,  date: '2026-02-10', reason: 'Cancellation 2 frames — refund',         status: 'Available' },
  { id: 'cr4', clientId: 'c4', amount: 90,   date: '2026-02-16', reason: 'Quality discount Venetian blinds',       status: 'Available' },
  { id: 'cr5', clientId: 'c5', amount: 420,  date: '2026-02-22', reason: 'Door size mismatch — size credit',       status: 'Available' },
  { id: 'cr6', clientId: 'c6', amount: 130,  date: '2026-03-05', reason: 'Cutting waste compensation',             status: 'Used'      },
  { id: 'cr7', clientId: 'c7', amount: 320,  date: '2026-03-08', reason: 'Return damaged moulding batch',          status: 'Available' },
];

// ─── Users ─────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: '1', name: 'Alex Ramzon',  email: 'alex@ramzon.nv',  role: 'Admin',     status: 'Active', avatar: 'https://picsum.photos/seed/alex/100/100',  joinedDate: '2023-01-12' },
  { id: '2', name: 'Sesar Varma',  email: 'sesar@ramzon.nv', role: 'Sales',     status: 'Active', avatar: 'https://picsum.photos/seed/sesar/100/100', joinedDate: '2023-05-20' },
  { id: '3', name: 'Jenny Wilson', email: 'jenny@ramzon.nv', role: 'Accountant',status: 'Active', avatar: 'https://picsum.photos/seed/jenny/100/100', joinedDate: '2024-02-05' },
  { id: '4', name: 'Priya Dassoo', email: 'priya@ramzon.nv', role: 'Accountant',status: 'Active', avatar: 'https://picsum.photos/seed/priya/100/100', joinedDate: '2025-08-14' },
];

// ─── Expenses (Jan – Mar 2026) ─────────────────────────────────────────────
export const mockExpenses: Expense[] = [
  { id: 'exp1',  category: 'Logistics',        amount: 450,   date: '2026-01-05', description: 'Diesel for transport trucks',                   status: 'Paid'   },
  { id: 'exp2',  category: 'Inventory',        amount: 12000, date: '2026-01-10', description: 'Teak shipment from Brazil',                     status: 'Unpaid' },
  { id: 'exp3',  category: 'Rent & Utilities', amount: 2800,  date: '2026-01-15', description: 'Monthly warehouse rent Paramaribo — January',   status: 'Paid'   },
  { id: 'exp4',  category: 'Tools & Machinery',amount: 3500,  date: '2026-01-18', description: 'Belt sander full maintenance',                  status: 'Paid'   },
  { id: 'exp5',  category: 'Logistics',        amount: 820,   date: '2026-01-22', description: 'Freight costs — delivery Build-It',             status: 'Paid'   },
  { id: 'exp6',  category: 'Marketing',        amount: 650,   date: '2026-01-28', description: 'Social media advertising campaign Q1',          status: 'Paid'   },
  { id: 'exp7',  category: 'Inventory',        amount: 8400,  date: '2026-02-01', description: 'Mahogany purchase batch — Suriname',            status: 'Unpaid' },
  { id: 'exp8',  category: 'Tools & Machinery',amount: 1200,  date: '2026-02-05', description: 'New saw blades set (10 pcs)',                   status: 'Paid'   },
  { id: 'exp9',  category: 'Rent & Utilities', amount: 2800,  date: '2026-02-10', description: 'Monthly warehouse rent Paramaribo — February',  status: 'Paid'   },
  { id: 'exp10', category: 'Logistics',        amount: 560,   date: '2026-02-12', description: 'Fuel costs transport — February',               status: 'Paid'   },
  { id: 'exp11', category: 'Salaries',         amount: 18500, date: '2026-02-18', description: 'Monthly payroll — February 2026',               status: 'Paid'   },
  { id: 'exp12', category: 'Inventory',        amount: 5600,  date: '2026-02-22', description: 'Purpleheart batch purchase from Guyana',        status: 'Paid'   },
  { id: 'exp13', category: 'Rent & Utilities', amount: 2800,  date: '2026-03-01', description: 'Monthly warehouse rent Paramaribo — March',     status: 'Paid'   },
  { id: 'exp14', category: 'Salaries',         amount: 18500, date: '2026-03-03', description: 'Monthly payroll — March 2026',                  status: 'Paid'   },
  { id: 'exp15', category: 'Logistics',        amount: 940,   date: '2026-03-05', description: 'Freight — Caribbean Furniture Group export',    status: 'Paid'   },
  { id: 'exp16', category: 'Tools & Machinery',amount: 2200,  date: '2026-03-08', description: 'CNC blade replacement set (full kit)',          status: 'Unpaid' },
];

// ─── Media ─────────────────────────────────────────────────────────────────
export const mockMedia: MediaItem[] = [
  { id: 'm1', name: 'warehouse-stock.jpg',  url: 'https://picsum.photos/seed/wood1/800/600',  size: '1.2 MB', type: 'image/jpeg', date: '2026-01-10' },
  { id: 'm2', name: 'delivery-truck.png',   url: 'https://picsum.photos/seed/truck/800/600',  size: '850 KB', type: 'image/png',  date: '2026-01-22' },
  { id: 'm3', name: 'team-photo.jpg',       url: 'https://picsum.photos/seed/team/800/600',   size: '2.4 MB', type: 'image/jpeg', date: '2026-02-14' },
  { id: 'm4', name: 'mahogany-batch.jpg',   url: 'https://picsum.photos/seed/mahog/800/600',  size: '1.8 MB', type: 'image/jpeg', date: '2026-02-22' },
];
