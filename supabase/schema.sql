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
