-- VyapaarAI Database Schema
-- Run with: psql -d vyapaarai -f schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Businesses ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone           VARCHAR(20) UNIQUE NOT NULL,  -- WhatsApp phone number (with country code)
  name            VARCHAR(255),
  gstin           VARCHAR(15),
  address         TEXT,
  language        VARCHAR(20) DEFAULT 'hindi',
  plan            VARCHAR(20) DEFAULT 'free',   -- free | starter | growth | enterprise
  plan_expires_at TIMESTAMP,
  razorpay_sub_id VARCHAR(100),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ── Customers ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  phone        VARCHAR(20),
  gstin        VARCHAR(15),
  address      TEXT,
  total_billed NUMERIC(12, 2) DEFAULT 0,
  total_paid   NUMERIC(12, 2) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ── Invoices ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id    UUID REFERENCES customers(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date       DATE,
  subtotal       NUMERIC(12, 2) NOT NULL,
  gst_rate       NUMERIC(5, 2) DEFAULT 18,
  gst_amount     NUMERIC(12, 2) NOT NULL,
  total          NUMERIC(12, 2) NOT NULL,
  status         VARCHAR(20) DEFAULT 'unpaid',  -- unpaid | paid | overdue | cancelled
  irn            VARCHAR(100),  -- Invoice Reference Number from IRP (e-invoice)
  pdf_url        TEXT,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- ── Invoice Items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID REFERENCES invoices(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  quantity    NUMERIC(10, 2) DEFAULT 1,
  price       NUMERIC(12, 2) NOT NULL,
  total       NUMERIC(12, 2) NOT NULL
);

-- ── Inventory ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  item_name     VARCHAR(255) NOT NULL,
  quantity      NUMERIC(10, 2) DEFAULT 0,
  price_per_unit NUMERIC(12, 2) DEFAULT 0,
  total_value   NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  last_updated  TIMESTAMP DEFAULT NOW(),
  UNIQUE (business_id, item_name)
);

-- ── Inventory Transactions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  UUID REFERENCES businesses(id) ON DELETE CASCADE,
  item_name    VARCHAR(255) NOT NULL,
  tx_type      VARCHAR(10) NOT NULL,  -- purchase | sale
  quantity     NUMERIC(10, 2) NOT NULL,
  price        NUMERIC(12, 2),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ── Payment Reminders ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_reminders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id    UUID REFERENCES invoices(id),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  amount        NUMERIC(12, 2),
  scheduled_at  TIMESTAMP NOT NULL,
  sent_at       TIMESTAMP,
  status        VARCHAR(20) DEFAULT 'pending',  -- pending | sent | failed
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_businesses_phone ON businesses(phone);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_inventory_business_id ON inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON payment_reminders(scheduled_at) WHERE status = 'pending';
