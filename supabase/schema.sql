-- ─── Agenze Plano10k — Schema ───────────────────────────────────
-- Rode no SQL Editor do Supabase (https://supabase.com/dashboard)

-- 1. Leads (contato + score do quiz)
CREATE TABLE IF NOT EXISTS leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  profile_id  TEXT NOT NULL,
  score       JSONB NOT NULL DEFAULT '{}',
  answers     JSONB NOT NULL DEFAULT '{}',
  objetivo    TEXT,
  nicho       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);

-- 2. Planos gerados pela IA
CREATE TABLE IF NOT EXISTS plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  profile_id  TEXT NOT NULL,
  content     JSONB NOT NULL DEFAULT '{}',
  aula_count  INT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plans_lead_id_idx ON plans(lead_id);

-- 3. Progresso do checklist
CREATE TABLE IF NOT EXISTS plan_progress (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  lead_id        UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  checked_aulas  JSONB NOT NULL DEFAULT '{}',
  checked_impls  JSONB NOT NULL DEFAULT '{}',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS plan_progress_plan_id_idx ON plan_progress(plan_id);

-- ─── RLS Policies ────────────────────────────────────────────────
ALTER TABLE leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_progress ENABLE ROW LEVEL SECURITY;

-- Leads: qualquer um pode inserir e ler pelo email
CREATE POLICY "insert_leads" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "select_leads" ON leads FOR SELECT TO anon USING (true);

-- Plans: qualquer um pode inserir e ler pelo id
CREATE POLICY "insert_plans" ON plans FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "select_plans" ON plans FOR SELECT TO anon USING (true);

-- Progress: inserir e atualizar pelo plan_id
CREATE POLICY "insert_progress" ON plan_progress FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_progress" ON plan_progress FOR UPDATE TO anon USING (true);
CREATE POLICY "select_progress" ON plan_progress FOR SELECT TO anon USING (true);

-- 4. LastLink → compras (webhook; sem políticas anon — só service role na Edge Function)
-- Migrations: 20260324120000_lastlink_purchases.sql, 20260325120000_lastlink_purchases_event_audit.sql
CREATE TABLE IF NOT EXISTS lastlink_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lastlink_event_id TEXT NOT NULL,
  is_test BOOLEAN,
  event TEXT,
  event_created_at TIMESTAMPTZ,
  buyer_id TEXT,
  buyer_email TEXT,
  buyer_name TEXT,
  buyer_phone TEXT,
  buyer_document TEXT,
  buyer_address_zip_code TEXT,
  buyer_address_street TEXT,
  buyer_address_street_number TEXT,
  buyer_address_complement TEXT,
  buyer_address_district TEXT,
  buyer_address_city TEXT,
  buyer_address_state TEXT,
  seller_id TEXT,
  seller_email TEXT,
  payment_id TEXT,
  purchase_recurrency INTEGER,
  purchase_payment_date TIMESTAMPTZ,
  purchase_next_billing TIMESTAMPTZ,
  purchase_chargeback_date TIMESTAMPTZ,
  purchase_original_price_value NUMERIC(14, 2),
  purchase_price_value NUMERIC(14, 2),
  purchase_payment_number_of_installments INTEGER,
  purchase_payment_method TEXT,
  purchase_payment_interest_rate_amount NUMERIC(14, 2),
  offer_id TEXT,
  offer_name TEXT,
  offer_url TEXT,
  affiliate_id TEXT,
  affiliate_email TEXT,
  utm_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  device_user_agent TEXT,
  device_ip TEXT,
  product_1_id TEXT,
  product_1_name TEXT,
  product_1_price NUMERIC(14, 2),
  product_2_id TEXT,
  product_2_name TEXT,
  product_2_price NUMERIC(14, 2),
  product_3_id TEXT,
  product_3_name TEXT,
  product_3_price NUMERIC(14, 2),
  commission_1_source TEXT,
  commission_1_value NUMERIC(14, 2),
  commission_2_source TEXT,
  commission_2_value NUMERIC(14, 2),
  commission_3_source TEXT,
  commission_3_value NUMERIC(14, 2),
  commission_4_source TEXT,
  commission_4_value NUMERIC(14, 2),
  commission_5_source TEXT,
  commission_5_value NUMERIC(14, 2),
  subscription_1_id TEXT,
  subscription_1_product_id TEXT,
  subscription_2_id TEXT,
  subscription_2_product_id TEXT,
  plan_tier TEXT,
  circle_status TEXT,
  circle_error TEXT,
  circle_synced_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lastlink_purchases_event_id_key ON lastlink_purchases (lastlink_event_id);
CREATE INDEX IF NOT EXISTS lastlink_purchases_payment_id_idx ON lastlink_purchases (payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS lastlink_purchases_buyer_email_idx ON lastlink_purchases (buyer_email);

ALTER TABLE lastlink_purchases ENABLE ROW LEVEL SECURITY;
