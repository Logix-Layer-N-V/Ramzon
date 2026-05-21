-- Ramzon ERP Database Schema
-- Run in Neon SQL Editor: https://console.neon.tech

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('Admin', 'Sales', 'Accountant')),
  status      TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  avatar      TEXT DEFAULT '',
  joined_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS clients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  company            TEXT DEFAULT '',
  email              TEXT DEFAULT '',
  vat_number         TEXT DEFAULT '',
  address            TEXT DEFAULT '',
  total_spent        NUMERIC(12,2) DEFAULT 0,
  status             TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  phone              TEXT DEFAULT '',
  preferred_currency TEXT DEFAULT 'USD',
  created_at         TIMESTAMPTZ DEFAULT NOW()
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
  houtsoort   TEXT DEFAULT '',
  spec        TEXT DEFAULT '',
  quantity    NUMERIC(10,3) NOT NULL,
  unit        TEXT DEFAULT 'pcs',
  unit_price  NUMERIC(12,2) NOT NULL,
  tax_rate    NUMERIC(5,2) DEFAULT 10,
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
  houtsoort   TEXT DEFAULT '',
  spec        TEXT DEFAULT '',
  quantity    NUMERIC(10,3) NOT NULL,
  unit        TEXT DEFAULT 'pcs',
  unit_price  NUMERIC(12,2) NOT NULL,
  tax_rate    NUMERIC(5,2) DEFAULT 10,
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
  status          TEXT DEFAULT 'Completed' CHECK (status IN ('Completed','Refunded')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID REFERENCES clients(id),
  amount     NUMERIC(12,2) NOT NULL,
  currency   TEXT DEFAULT 'USD',
  date       DATE NOT NULL,
  reason     TEXT DEFAULT '',
  notes      TEXT DEFAULT '',
  status     TEXT DEFAULT 'Available' CHECK (status IN ('Available','Used')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL,
  vendor      TEXT DEFAULT '',
  amount      NUMERIC(12,2) NOT NULL,
  currency    TEXT DEFAULT 'USD',
  date        DATE NOT NULL,
  description TEXT DEFAULT '',
  status      TEXT DEFAULT 'Unpaid' CHECK (status IN ('Paid','Unpaid')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
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
  calculation_type TEXT DEFAULT 'pcs',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add columns to existing tables (safe to re-run, IF NOT EXISTS guards)
ALTER TABLE clients      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payments     ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE credits      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE credits      ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE expenses     ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE products     ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE invoice_items  ADD COLUMN IF NOT EXISTS houtsoort TEXT DEFAULT '';
ALTER TABLE invoice_items  ADD COLUMN IF NOT EXISTS spec      TEXT DEFAULT '';
ALTER TABLE invoice_items  ADD COLUMN IF NOT EXISTS unit      TEXT DEFAULT 'pcs';
ALTER TABLE invoice_items  ADD COLUMN IF NOT EXISTS tax_rate  NUMERIC(5,2) DEFAULT 21;
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS houtsoort     TEXT DEFAULT '';
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS spec          TEXT DEFAULT '';
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS unit          TEXT DEFAULT 'pcs';
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS tax_rate      NUMERIC(5,2) DEFAULT 21;
ALTER TABLE invoice_items  ADD COLUMN IF NOT EXISTS price_by_area BOOLEAN DEFAULT false;
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS price_by_area BOOLEAN DEFAULT false;
ALTER TABLE invoice_items  ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'item';
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'item';

CREATE TABLE IF NOT EXISTS error_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level      TEXT DEFAULT 'error',
  source     TEXT DEFAULT 'api',
  message    TEXT NOT NULL,
  meta       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key            TEXT PRIMARY KEY,
  attempts       INTEGER NOT NULL DEFAULT 0,
  window_start   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  bank        TEXT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'SRD',
  iban        TEXT DEFAULT '',
  balance     NUMERIC(14,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date        DATE NOT NULL,
  usd_srd     NUMERIC(10,4) NOT NULL DEFAULT 0,
  eur_srd     NUMERIC(10,4) DEFAULT 0,
  eur_usd     NUMERIC(10,4) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default bank accounts (safe to re-run)
INSERT INTO bank_accounts (id, bank, currency, iban, balance) VALUES
  ('dsb_srd',  'DSB Bank',      'SRD', 'SR29DSB0000001234', 45230),
  ('dsb_usd',  'DSB Bank',      'USD', 'SR29DSB0000001235', 12800),
  ('dsb_eur',  'DSB Bank',      'EUR', 'SR29DSB0000001236',  9500),
  ('hkb_srd',  'HKB Hakrinbank','SRD', 'SR29HKB0000005678', 31200),
  ('hkb_usd',  'HKB Hakrinbank','USD', 'SR29HKB0000005679',  7400),
  ('hkb_eur',  'HKB Hakrinbank','EUR', 'SR29HKB0000005680',  4100),
  ('cash_srd', 'Cash',          'SRD', '—',                  1500),
  ('cash_usd', 'Cash',          'USD', '—',                   300),
  ('cash_eur', 'Cash',          'EUR', '—',                   150)
ON CONFLICT (id) DO NOTHING;

-- Seed default exchange rates (safe to re-run)
INSERT INTO exchange_rates (id, date, usd_srd, eur_srd, eur_usd) VALUES
  ('r1', '2026-03-05', 36.50, 39.80, 1.09),
  ('r2', '2026-03-04', 36.45, 39.75, 1.09),
  ('r3', '2026-03-03', 36.40, 39.70, 1.08)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id      TEXT NOT NULL,
  user_name    TEXT NOT NULL,
  action       TEXT NOT NULL,
  resource     TEXT NOT NULL,
  resource_id  TEXT DEFAULT '',
  ip           TEXT DEFAULT '',
  meta         JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS audit_logs_ts_idx ON audit_logs (ts DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit_logs (user_id);

-- Seed users (password for all: admin123)
INSERT INTO users (name, email, password, role) VALUES
  ('Admin User', 'admin@ramzon.sr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL548sd2', 'Admin'),
  ('Sales Rep', 'sales@ramzon.sr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL548sd2', 'Sales'),
  ('Accountant', 'accountant@ramzon.sr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL548sd2', 'Accountant')
ON CONFLICT (email) DO NOTHING;
