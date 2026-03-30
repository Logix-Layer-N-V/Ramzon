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

-- Seed users (password for all: admin123)
INSERT INTO users (name, email, password, role) VALUES
  ('Admin User', 'admin@ramzon.sr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL548sd2', 'Admin'),
  ('Sales Rep', 'sales@ramzon.sr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL548sd2', 'Sales'),
  ('Accountant', 'accountant@ramzon.sr', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL548sd2', 'Accountant')
ON CONFLICT (email) DO NOTHING;
