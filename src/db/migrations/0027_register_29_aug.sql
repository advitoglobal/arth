-- 29 Aug register: Meeting stage, enquiry depth, intake labels, pool assignment,
-- consent by purpose, price/EMI masters, audit log, wallet, extra seats.
-- Walls stay in force. Live telephony is not connected.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS department_key TEXT NOT NULL DEFAULT 'sales',
  ADD COLUMN IF NOT EXISTS intake_kind TEXT NOT NULL DEFAULT 'tele_push',
  ADD COLUMN IF NOT EXISTS intake_batch_name TEXT,
  ADD COLUMN IF NOT EXISTS intake_batch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS colour TEXT,
  ADD COLUMN IF NOT EXISTS alt_model TEXT,
  ADD COLUMN IF NOT EXISTS alt_variant TEXT,
  ADD COLUMN IF NOT EXISTS buyer_type TEXT,
  ADD COLUMN IF NOT EXISTS exchange_vehicle TEXT,
  ADD COLUMN IF NOT EXISTS exchange_eval_needed BOOLEAN,
  ADD COLUMN IF NOT EXISTS exchange_eval_at DATE,
  ADD COLUMN IF NOT EXISTS exchange_place TEXT,
  ADD COLUMN IF NOT EXISTS meeting_kind TEXT,
  ADD COLUMN IF NOT EXISTS meeting_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS testdrive_needed BOOLEAN,
  ADD COLUMN IF NOT EXISTS testdrive_pref_date DATE,
  ADD COLUMN IF NOT EXISTS finance_needed BOOLEAN,
  ADD COLUMN IF NOT EXISTS finance_bank_key TEXT,
  ADD COLUMN IF NOT EXISTS expected_booking_date DATE,
  ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
  ADD COLUMN IF NOT EXISTS pool_open BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS availability_days_estimate INTEGER,
  ADD COLUMN IF NOT EXISTS quote_frozen_at TIMESTAMPTZ;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_intake_kind_chk;
ALTER TABLE leads ADD CONSTRAINT leads_intake_kind_chk
  CHECK (intake_kind IN ('tele_push', 'manager_upload'));
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_department_key_chk;
ALTER TABLE leads ADD CONSTRAINT leads_department_key_chk
  CHECK (department_key IN ('sales', 'service', 'insurance', 'used', 'accessories'));

UPDATE config_stages SET key = 'meeting', label = 'Meeting' WHERE key = 'qualified';
UPDATE leads SET stage_key = 'meeting' WHERE stage_key = 'qualified';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_prefs JSONB NOT NULL DEFAULT '{"assigned": true, "commitment": true}'::jsonb;

CREATE TABLE IF NOT EXISTS assignment_rules (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  source_key TEXT NOT NULL DEFAULT '*',
  mode TEXT NOT NULL CHECK (mode IN ('direct', 'pool')),
  PRIMARY KEY (tenant_id, branch_id, source_key)
);
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rules FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON assignment_rules;
CREATE POLICY tenant_isolation ON assignment_rules
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

INSERT INTO assignment_rules (tenant_id, branch_id, source_key, mode)
SELECT b.tenant_id, b.id, '*', 'direct'
FROM branches b
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS customer_consents (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  purpose_key TEXT NOT NULL CHECK (purpose_key IN (
    'sales_enquiry', 'service_reminders', 'insurance_renewal', 'offers'
  )),
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  PRIMARY KEY (customer_id, purpose_key)
);
ALTER TABLE customer_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_consents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON customer_consents;
CREATE POLICY tenant_isolation ON customer_consents
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

INSERT INTO customer_consents (tenant_id, customer_id, purpose_key, granted)
SELECT c.tenant_id, c.id, 'sales_enquiry', true
FROM customers c
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS price_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  model TEXT NOT NULL,
  variant TEXT NOT NULL,
  colour TEXT,
  ex_showroom_paise BIGINT NOT NULL,
  rto_paise BIGINT NOT NULL DEFAULT 0,
  insurance_paise BIGINT NOT NULL DEFAULT 0,
  accessories_paise BIGINT NOT NULL DEFAULT 0,
  confirmed_at DATE NOT NULL,
  UNIQUE (tenant_id, model, variant)
);
ALTER TABLE price_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_master FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON price_master;
CREATE POLICY tenant_isolation ON price_master
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS bank_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  bank_key TEXT NOT NULL,
  product TEXT NOT NULL DEFAULT 'retail',
  tenure_months INTEGER NOT NULL,
  rate_bps INTEGER NOT NULL,
  processing_fee_paise BIGINT NOT NULL DEFAULT 0,
  confirmed_at DATE NOT NULL,
  UNIQUE (tenant_id, bank_key, tenure_months)
);
ALTER TABLE bank_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_rates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON bank_rates;
CREATE POLICY tenant_isolation ON bank_rates
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  frozen JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID REFERENCES users(id)
);
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON quotations;
CREATE POLICY tenant_isolation ON quotations
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND arth_lead_visible(lead_id)
  )
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  actor_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'USER',
  action TEXT NOT NULL,
  entity TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON audit_logs;
CREATE POLICY tenant_isolation ON audit_logs
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND NULLIF(current_setting('app.role_key', true), '') IN ('owner', 'admin', 'ops', 'adv', 'acct')
  )
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS point_movements (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  amount INTEGER NOT NULL,
  reason_key TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE point_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_movements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON point_movements;
CREATE POLICY tenant_isolation ON point_movements
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
      OR NULLIF(current_setting('app.role_key', true), '') IN ('owner', 'admin', 'mgr', 'lead', 'ops', 'acct')
    )
  )
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS welcome_dismissals (
  user_id UUID NOT NULL REFERENCES users(id),
  day DATE NOT NULL,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS figure_grants (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role_key TEXT NOT NULL,
  figure_key TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (tenant_id, role_key, figure_key)
);
ALTER TABLE figure_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE figure_grants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON figure_grants;
CREATE POLICY tenant_isolation ON figure_grants
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  department_key TEXT NOT NULL,
  name TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_batches FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON upload_batches;
CREATE POLICY tenant_isolation ON upload_batches
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

REVOKE UPDATE, DELETE ON audit_logs FROM arth_app;
GRANT SELECT, INSERT ON audit_logs TO arth_app;
GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO arth_app;
REVOKE UPDATE, DELETE ON point_movements FROM arth_app;
GRANT SELECT, INSERT ON point_movements TO arth_app;
GRANT USAGE, SELECT ON SEQUENCE point_movements_id_seq TO arth_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON assignment_rules, customer_consents, price_master, bank_rates, quotations, figure_grants, upload_batches, welcome_dismissals TO arth_app;

INSERT INTO price_master (tenant_id, model, variant, colour, ex_showroom_paise, rto_paise, insurance_paise, accessories_paise, confirmed_at)
SELECT t.id, m.model, m.variant, m.colour, m.ex, m.rto, m.ins, m.acc, DATE '2026-08-24'
FROM tenants t
CROSS JOIN (VALUES
  ('Grand Vitara', 'Zeta', 'Pearl White', 115000000, 9800000, 4200000, 1800000),
  ('Fronx', 'Delta', 'Nexa Blue', 84000000, 7200000, 3100000, 1200000),
  ('Swift', 'ZXi', 'Solid Red', 78000000, 6900000, 2800000, 900000)
) AS m(model, variant, colour, ex, rto, ins, acc)
ON CONFLICT (tenant_id, model, variant) DO NOTHING;

INSERT INTO bank_rates (tenant_id, bank_key, product, tenure_months, rate_bps, processing_fee_paise, confirmed_at)
SELECT t.id, b.bank, 'retail', b.tenure, b.bps, b.fee, DATE '2026-08-24'
FROM tenants t
CROSS JOIN (VALUES
  ('HDFC', 36, 915, 450000),
  ('HDFC', 60, 945, 450000),
  ('SBI', 36, 899, 350000),
  ('SBI', 60, 929, 350000),
  ('ICICI', 48, 939, 400000)
) AS b(bank, tenure, bps, fee)
ON CONFLICT (tenant_id, bank_key, tenure_months) DO NOTHING;

-- Visibility: tele sees sales unowned; service tele sees service unowned;
-- sales sees own book plus an unclaimed pool after a reach (owner null, first_responded set).
CREATE OR REPLACE FUNCTION arth_lead_row_visible(
  p_tenant uuid,
  p_branch uuid,
  p_owner uuid,
  p_responded timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  u_role text;
  u_tenant uuid;
  u_branch uuid;
  u_position uuid;
BEGIN
  BEGIN
    uid := NULLIF(current_setting('app.user_id', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  u_role := NULLIF(current_setting('app.role_key', true), '');
  BEGIN
    u_tenant := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
    u_branch := NULLIF(current_setting('app.branch_id', true), '')::uuid;
    u_position := NULLIF(current_setting('app.position_id', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    u_tenant := NULL;
  END;
  IF u_role IS NULL OR u_tenant IS NULL THEN
    SELECT u.role_key, u.tenant_id, p.branch_id, u.position_id
      INTO u_role, u_tenant, u_branch, u_position
    FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = uid AND u.is_active;
  END IF;
  IF u_role IS NULL OR p_tenant IS DISTINCT FROM u_tenant THEN
    RETURN false;
  END IF;
  IF u_role IN ('owner', 'adv', 'admin', 'ops') THEN
    RETURN true;
  END IF;
  IF u_role = 'mgr' THEN
    RETURN u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;
  IF u_role = 'lead' THEN
    IF p_owner = uid THEN RETURN true; END IF;
    IF u_branch IS NOT NULL AND p_branch = u_branch AND p_owner IS NULL AND p_responded IS NULL THEN
      RETURN true;
    END IF;
    RETURN EXISTS (
      SELECT 1 FROM users ru
      JOIN positions rp ON rp.id = ru.position_id
      WHERE ru.id = p_owner AND rp.reports_to = u_position
    );
  END IF;
  IF u_role = 'tele' THEN
    IF p_owner = uid THEN RETURN true; END IF;
    RETURN p_owner IS NULL AND p_responded IS NULL
      AND u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;
  IF u_role = 'svctele' THEN
    IF p_owner = uid THEN RETURN true; END IF;
    RETURN p_owner IS NULL AND p_responded IS NULL
      AND u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;
  IF u_role = 'sales' THEN
    IF p_owner = uid THEN RETURN true; END IF;
    RETURN p_owner IS NULL AND p_responded IS NOT NULL
      AND u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;
  RETURN false;
END;
$$;

DROP POLICY IF EXISTS tenant_isolation ON leads;
CREATE POLICY tenant_isolation ON leads
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      CASE NULLIF(current_setting('app.role_key', true), '')
        WHEN 'owner' THEN true
        WHEN 'adv' THEN true
        WHEN 'admin' THEN true
        WHEN 'ops' THEN true
        WHEN 'mgr' THEN
          branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        WHEN 'lead' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL
            AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            AND department_key = 'sales'
          )
          OR EXISTS (
            SELECT 1 FROM users ru
            JOIN positions rp ON rp.id = ru.position_id
            WHERE ru.id = leads.owner_user_id
              AND rp.reports_to = NULLIF(current_setting('app.position_id', true), '')::uuid
          )
        WHEN 'tele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL
            AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            AND department_key = 'sales'
          )
        WHEN 'svctele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL
            AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            AND department_key = 'service'
          )
        WHEN 'sales' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL
            AND first_responded_at IS NOT NULL
            AND pool_open
            AND department_key = 'sales'
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
        ELSE arth_lead_row_visible(tenant_id, branch_id, owner_user_id, first_responded_at)
      END
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

DROP POLICY IF EXISTS tenant_isolation ON customers;
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

CREATE OR REPLACE FUNCTION arth_assignment_mode(p_branch uuid, p_source text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT mode FROM assignment_rules
      WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND branch_id = p_branch AND source_key = p_source),
    (SELECT mode FROM assignment_rules
      WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND branch_id = p_branch AND source_key = '*'),
    'direct'
  );
$$;
ALTER FUNCTION arth_assignment_mode(uuid, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_assignment_mode(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_assignment_mode(uuid, text) TO arth_app;

CREATE OR REPLACE FUNCTION arth_consent_ok(p_customer uuid, p_purpose text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM customer_consents
    WHERE customer_id = p_customer
      AND purpose_key = p_purpose
      AND granted
      AND withdrawn_at IS NULL
  );
$$;
ALTER FUNCTION arth_consent_ok(uuid, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_consent_ok(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_consent_ok(uuid, text) TO arth_app;

-- Demo seats: dealer admin, accounts, service telecaller, Advito onboarding.
INSERT INTO positions (id, tenant_id, branch_id, title) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc41', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Dealer admin'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc42', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Accounts'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc43', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Service telecaller')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, position_id, full_name, phone, role_key, workspace_key, username, password_hash, is_active)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddd41', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc41', 'R. Padma', '9845011141', 'admin', 'admin', 'padma', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd42', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc42', 'K. Books', '9845011142', 'acct', 'books', 'books', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd43', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc43', 'S. Devi', '9845011143', 'svctele', 'dayb', 'devi', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash, role_key = EXCLUDED.role_key, workspace_key = EXCLUDED.workspace_key;

ALTER TABLE platform_users DROP CONSTRAINT IF EXISTS platform_users_role_key_check;
ALTER TABLE platform_users ADD CONSTRAINT platform_users_role_key_check
  CHECK (role_key IN ('adv_admin', 'adv_support', 'adv_onboard'));

INSERT INTO platform_users (id, full_name, username, password_hash, role_key, is_active)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
  'Advito onboarding',
  'onboard',
  'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a',
  'adv_onboard',
  true
)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, role_key = EXCLUDED.role_key;

-- One service-due name so Devi has a labelled conversation, not a sales enquiry.
INSERT INTO customers (id, tenant_id, full_name, phone)
VALUES (
  'ffffffff-ffff-ffff-ffff-fffffffff041',
  '11111111-1111-1111-1111-111111111111',
  'Anita Service',
  '9845099041'
)
ON CONFLICT (tenant_id, phone) DO NOTHING;

INSERT INTO leads (
  id, tenant_id, branch_id, customer_id, source_key, source_detail,
  model_interest, stage_key, department_key, intake_kind, intake_batch_name, intake_batch_at,
  first_response_due, next_action_at
)
SELECT
  'ffffffff-ffff-ffff-ffff-ffffffffff41',
  '11111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  c.id,
  'inbound_call',
  'Service due list August',
  'Swift',
  'new',
  'service',
  'manager_upload',
  'Service due Aug 2026',
  now() - interval '1 day',
  now() + interval '2 hours',
  now() + interval '2 hours'
FROM customers c
WHERE c.phone = '9845099041' AND c.tenant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_consents (tenant_id, customer_id, purpose_key, granted)
SELECT tenant_id, id, 'service_reminders', true
FROM customers WHERE phone = '9845099041'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION arth_dept_ok(p_dept text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE NULLIF(current_setting('app.role_key', true), '')
    WHEN 'tele' THEN COALESCE(p_dept, 'sales') = 'sales'
    WHEN 'svctele' THEN p_dept = 'service'
    ELSE true
  END;
$$;

CREATE OR REPLACE FUNCTION arth_platform_is_operator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_users
    WHERE id = NULLIF(current_setting('app.platform_user_id', true), '')::uuid
      AND is_active
      AND role_key IN ('adv_admin', 'adv_support', 'adv_onboard')
  );
$$;

CREATE OR REPLACE FUNCTION arth_queue_lead_ids(p_owner uuid)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  uid uuid := NULLIF(current_setting('app.user_id', true), '')::uuid;
  bid uuid := NULLIF(current_setting('app.branch_id', true), '')::uuid;
  role text := NULLIF(current_setting('app.role_key', true), '');
  dept text := CASE WHEN role = 'svctele' THEN 'service' ELSE 'sales' END;
  until_at timestamptz :=
    (((timezone('Asia/Kolkata', now()))::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata');
BEGIN
  IF tid IS NULL OR uid IS NULL OR p_owner IS DISTINCT FROM uid THEN
    RETURN;
  END IF;
  IF bid IS NULL THEN
    SELECT p.branch_id INTO bid
    FROM users u
    JOIN positions p ON p.id = u.position_id
    WHERE u.id = uid;
  END IF;
  RETURN QUERY
  SELECT q.id
  FROM (
    SELECT l.id,
      CASE
        WHEN l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now() THEN 0
        WHEN l.next_action_at IS NOT NULL AND l.next_action_at < now() THEN 0
        ELSE 1
      END AS late_rank,
      l.next_action_at
    FROM leads l
    WHERE l.tenant_id = tid
      AND l.owner_user_id = p_owner
      AND l.stage_key <> 'delivered'
      AND l.lost_reason_key IS NULL
      AND (l.next_action_at IS NULL OR l.next_action_at < until_at)
      AND NOT (
        l.last_disposition_key = 'postponed'
        AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now()
        AND l.next_action_at IS NOT NULL AND l.next_action_at > now()
      )
    UNION ALL
    SELECT l.id,
      CASE
        WHEN l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now() THEN 0
        WHEN l.next_action_at IS NOT NULL AND l.next_action_at < now() THEN 0
        ELSE 1
      END,
      l.next_action_at
    FROM leads l
    WHERE l.tenant_id = tid
      AND bid IS NOT NULL
      AND l.owner_user_id IS NULL
      AND l.first_responded_at IS NULL
      AND l.lost_reason_key IS NULL
      AND l.branch_id = bid
      AND l.department_key = dept
      AND l.stage_key <> 'delivered'
      AND (l.next_action_at IS NULL OR l.next_action_at < until_at)
      AND NOT (
        l.last_disposition_key = 'postponed'
        AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now()
        AND l.next_action_at IS NOT NULL AND l.next_action_at > now()
      )
  ) q
  ORDER BY q.late_rank, q.next_action_at ASC NULLS LAST
  LIMIT 200;
END;
$$;



-- Search still definer; department wall added.
-- Search as SECURITY DEFINER so phone/name indexes run first. Walls stay in
-- arth_lead_row_visible on the matching rows only.

CREATE OR REPLACE FUNCTION arth_search_lead_ids(
  p_phone text,
  p_name text,
  p_enquiry8 text,
  p_enquiry_tail text,
  p_source text,
  p_stage text,
  p_model text,
  p_overdue text,
  p_parked text,
  p_from date,
  p_to date,
  p_on text
)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
BEGIN
  IF tid IS NULL THEN
    RETURN;
  END IF;

  IF p_phone IS NOT NULL AND p_name IS NULL AND p_enquiry8 IS NULL AND p_enquiry_tail IS NULL THEN
    RETURN QUERY
    SELECT l.id
    FROM customers c
    JOIN leads l ON l.customer_id = c.id AND l.tenant_id = c.tenant_id
    WHERE c.tenant_id = tid
      AND c.phone LIKE '%' || p_phone || '%'
      AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at) AND arth_dept_ok(l.department_key) AND arth_dept_ok(l.department_key)
      AND (p_source IS NULL OR l.source_key = p_source)
      AND (p_stage IS NULL OR l.stage_key = p_stage)
      AND (
        p_model IS NULL
        OR l.model_interest ILIKE '%' || p_model || '%'
        OR l.variant_interest ILIKE '%' || p_model || '%'
      )
      AND (
        p_overdue IS NULL
        OR (p_overdue = 'yes' AND (
          (l.next_action_at IS NOT NULL AND l.next_action_at < now())
          OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
        ))
        OR (p_overdue = 'no' AND NOT (
          (l.next_action_at IS NOT NULL AND l.next_action_at < now())
          OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
        ))
      )
      AND (
        p_parked IS NULL
        OR (p_parked = 'yes' AND l.last_disposition_key = 'postponed' AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now())
        OR (p_parked = 'no' AND NOT (l.last_disposition_key = 'postponed' AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now()))
      )
      AND (p_from IS NULL OR (CASE WHEN p_on = 'due' THEN (timezone('Asia/Kolkata', l.next_action_at))::date ELSE (timezone('Asia/Kolkata', l.created_at))::date END) >= p_from)
      AND (p_to IS NULL OR (CASE WHEN p_on = 'due' THEN (timezone('Asia/Kolkata', l.next_action_at))::date ELSE (timezone('Asia/Kolkata', l.created_at))::date END) <= p_to)
    ORDER BY l.created_at DESC
    LIMIT 80;
    RETURN;
  END IF;

  IF p_enquiry8 IS NOT NULL AND p_phone IS NULL AND p_name IS NULL THEN
    RETURN QUERY
    SELECT l.id
    FROM leads l
    WHERE l.tenant_id = tid
      AND upper(right(replace(l.id::text, '-', ''), 8)) = p_enquiry8
      AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at) AND arth_dept_ok(l.department_key) AND arth_dept_ok(l.department_key)
    ORDER BY l.created_at DESC
    LIMIT 80;
    RETURN;
  END IF;

  IF p_name IS NOT NULL AND p_phone IS NULL THEN
    RETURN QUERY
    SELECT q.id
    FROM (
      SELECT l.id, l.created_at
      FROM customers c
      JOIN leads l ON l.customer_id = c.id AND l.tenant_id = c.tenant_id
      WHERE c.tenant_id = tid
        AND c.full_name ILIKE '%' || p_name || '%'
        AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at) AND arth_dept_ok(l.department_key) AND arth_dept_ok(l.department_key)
        AND (p_source IS NULL OR l.source_key = p_source)
        AND (p_stage IS NULL OR l.stage_key = p_stage)
      UNION ALL
      SELECT l.id, l.created_at
      FROM leads l
      WHERE l.tenant_id = tid
        AND l.model_interest ILIKE '%' || p_name || '%'
        AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at) AND arth_dept_ok(l.department_key) AND arth_dept_ok(l.department_key)
        AND (p_source IS NULL OR l.source_key = p_source)
        AND (p_stage IS NULL OR l.stage_key = p_stage)
      UNION ALL
      SELECT l.id, l.created_at
      FROM leads l
      WHERE l.tenant_id = tid
        AND l.variant_interest ILIKE '%' || p_name || '%'
        AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at) AND arth_dept_ok(l.department_key) AND arth_dept_ok(l.department_key)
        AND (p_source IS NULL OR l.source_key = p_source)
        AND (p_stage IS NULL OR l.stage_key = p_stage)
    ) q
    ORDER BY q.created_at DESC
    LIMIT 80;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT l.id
  FROM leads l
  JOIN customers c ON c.id = l.customer_id AND c.tenant_id = l.tenant_id
  WHERE l.tenant_id = tid
    AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at) AND arth_dept_ok(l.department_key) AND arth_dept_ok(l.department_key)
    AND (
      (p_phone IS NULL AND p_name IS NULL AND p_enquiry8 IS NULL AND p_enquiry_tail IS NULL)
      OR (p_phone IS NOT NULL AND c.phone LIKE '%' || p_phone || '%')
      OR (p_name IS NOT NULL AND (
        c.full_name ILIKE '%' || p_name || '%'
        OR l.model_interest ILIKE '%' || p_name || '%'
        OR l.variant_interest ILIKE '%' || p_name || '%'
      ))
      OR (p_enquiry8 IS NOT NULL AND upper(right(replace(l.id::text, '-', ''), 8)) = p_enquiry8)
      OR (p_enquiry_tail IS NOT NULL AND replace(l.id::text, '-', '') LIKE '%' || p_enquiry_tail)
    )
    AND (p_source IS NULL OR l.source_key = p_source)
    AND (p_stage IS NULL OR l.stage_key = p_stage)
    AND (
      p_model IS NULL
      OR l.model_interest ILIKE '%' || p_model || '%'
      OR l.variant_interest ILIKE '%' || p_model || '%'
    )
    AND (
      p_overdue IS NULL
      OR (p_overdue = 'yes' AND (
        (l.next_action_at IS NOT NULL AND l.next_action_at < now())
        OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
      ))
      OR (p_overdue = 'no' AND NOT (
        (l.next_action_at IS NOT NULL AND l.next_action_at < now())
        OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
      ))
    )
    AND (
      p_parked IS NULL
      OR (p_parked = 'yes' AND l.last_disposition_key = 'postponed' AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now())
      OR (p_parked = 'no' AND NOT (l.last_disposition_key = 'postponed' AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now()))
    )
    AND (p_from IS NULL OR (CASE WHEN p_on = 'due' THEN (timezone('Asia/Kolkata', l.next_action_at))::date ELSE (timezone('Asia/Kolkata', l.created_at))::date END) >= p_from)
    AND (p_to IS NULL OR (CASE WHEN p_on = 'due' THEN (timezone('Asia/Kolkata', l.next_action_at))::date ELSE (timezone('Asia/Kolkata', l.created_at))::date END) <= p_to)
  ORDER BY l.created_at DESC
  LIMIT 80;
END;
$$;

ALTER FUNCTION arth_search_lead_ids(text, text, text, text, text, text, text, text, text, date, date, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_search_lead_ids(text, text, text, text, text, text, text, text, text, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_search_lead_ids(text, text, text, text, text, text, text, text, text, date, date, text) TO arth_app;
