-- 0001 tenancy, working hours, leads, forced RLS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL
);

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata'
);

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID REFERENCES branches(id),
  title TEXT NOT NULL,
  reports_to UUID REFERENCES positions(id)
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  position_id UUID REFERENCES positions(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role_key TEXT NOT NULL,
  workspace_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (tenant_id, phone)
);

CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at TIME,
  closes_at TIME,
  UNIQUE (branch_id, day_of_week),
  CHECK (opens_at IS NULL OR closes_at IS NULL OR closes_at > opens_at)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  email TEXT,
  household_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, phone)
);
CREATE INDEX ON customers (tenant_id, phone);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID REFERENCES customers(id),
  registration TEXT,
  chassis TEXT,
  model TEXT,
  variant TEXT
);

CREATE TABLE config_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order SMALLINT NOT NULL,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (tenant_id, key)
);

CREATE TABLE config_lost_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  requires_fact TEXT NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE config_dispositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  connected BOOLEAN NOT NULL,
  requires_revisit BOOLEAN NOT NULL DEFAULT false,
  requires_lost_reason BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE config_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL,
  value_int INTEGER NOT NULL,
  UNIQUE (tenant_id, key)
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  source_key TEXT NOT NULL,
  source_detail TEXT,
  model_interest TEXT,
  variant_interest TEXT,
  stage_key TEXT NOT NULL DEFAULT 'new',
  owner_user_id UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  difficulty_band TEXT CHECK (difficulty_band IN ('hot','warm','cold','very_cold')),
  difficulty_locked_at TIMESTAMPTZ,
  expected_value_paise BIGINT NOT NULL DEFAULT 0,
  first_response_due TIMESTAMPTZ,
  first_responded_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  lost_reason_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON leads (tenant_id, owner_user_id, next_action_at);
CREATE INDEX ON leads (tenant_id, branch_id, stage_key);

CREATE TABLE lead_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('USER','SYSTEM')),
  actor_id UUID,
  disposition_key TEXT,
  call_seconds INTEGER,
  revisit_at TIMESTAMPTZ,
  note TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (actor_type <> 'SYSTEM' OR actor_id IS NULL),
  CHECK (actor_type <> 'USER' OR actor_id IS NOT NULL),
  CHECK (disposition_key <> 'postponed' OR revisit_at IS NOT NULL)
);
CREATE INDEX ON lead_events (tenant_id, lead_id, created_at DESC);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  why TEXT NOT NULL,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forced RLS on every tenant-scoped table. Tenants keyed by id.
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenants
  USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'brands','branches','positions','users','working_hours','customers','vehicles',
    'config_stages','config_lost_reasons','config_dispositions','config_thresholds',
    'leads','lead_events','notifications'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)',
      t
    );
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO arth_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO arth_app;
REVOKE UPDATE, DELETE ON lead_events FROM arth_app;
GRANT SELECT, INSERT ON lead_events TO arth_app;
