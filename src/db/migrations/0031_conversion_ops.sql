-- Conversion ops: departments as first-class work, activity clocks, inventory,
-- insurance catalogue, inbound lines, OTP, source costs. Walls stay dealer-bound.
-- Reassign is still a superior's act. Escalation notifies and surfaces; it does not steal.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS escalate_level TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS escalate_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS testdrive_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS testdrive_status TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_id UUID,
  ADD COLUMN IF NOT EXISTS discount_paise BIGINT,
  ADD COLUMN IF NOT EXISTS discount_status TEXT,
  ADD COLUMN IF NOT EXISTS delivery_lane TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT;

ALTER TABLE config_dispositions
  ADD COLUMN IF NOT EXISTS department_key TEXT NOT NULL DEFAULT 'sales';

ALTER TABLE config_stages
  ADD COLUMN IF NOT EXISTS department_key TEXT NOT NULL DEFAULT 'sales';

-- Shared keys (new, assigned, contacted, delivered) stay unique per tenant.
-- Service and insurance add only the stages sales does not already have.
INSERT INTO config_stages (tenant_id, key, label, sort_order, is_terminal, department_key)
SELECT t.id, s.key, s.label, s.sort_order, s.is_terminal, s.dept
FROM tenants t
CROSS JOIN (VALUES
  ('appointment','Appointment',4,false,'service'),
  ('arrived','Arrived',5,false,'service'),
  ('in_work','In work',6,false,'service'),
  ('waiting_parts','Waiting parts',7,false,'service'),
  ('ready','Ready',8,false,'service'),
  ('quoted','Quoted',4,false,'insurance'),
  ('recommended','Recommended',5,false,'insurance'),
  ('issued','Issued',6,false,'insurance'),
  ('endorsed','Endorsed',7,false,'insurance'),
  ('renewed','Renewed',8,true,'insurance'),
  ('lost','Lost',9,true,'insurance')
) AS s(key, label, sort_order, is_terminal, dept)
ON CONFLICT (tenant_id, key) DO NOTHING;

INSERT INTO config_dispositions (
  tenant_id, key, label, connected, requires_revisit, requires_lost_reason, sort_order, department_key
)
SELECT t.id, d.key, d.label, d.connected, d.revisit, d.lost, d.sort, d.dept
FROM tenants t
CROSS JOIN (VALUES
  ('svc_due','Due reminder completed',true,false,false,1,'service'),
  ('svc_booked','Appointment booked',true,true,false,2,'service'),
  ('svc_no_answer','No answer',false,true,false,3,'service'),
  ('svc_wrong','Wrong number',false,false,false,4,'service'),
  ('svc_done','Job closed with customer',true,false,false,5,'service'),
  ('svc_lost','Could not book',true,false,true,6,'service'),
  ('ins_quoted','Quote explained',true,false,false,1,'insurance'),
  ('ins_taken','Policy taken',true,false,false,2,'insurance'),
  ('ins_callback','Call back',true,true,false,3,'insurance'),
  ('ins_no_answer','No answer',false,true,false,4,'insurance'),
  ('ins_lost','Declined',true,false,true,5,'insurance')
) AS d(key, label, connected, revisit, lost, sort, dept)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS stock_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  vin TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  colour TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','allocated','booked','delivered')),
  booked_lead_id UUID REFERENCES leads(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, vin)
);
ALTER TABLE stock_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_units FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON stock_units;
CREATE POLICY tenant_isolation ON stock_units
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON stock_units TO arth_app;

CREATE TABLE IF NOT EXISTS insurance_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  insurer TEXT NOT NULL,
  premium_paise BIGINT NOT NULL,
  dealer_margin_bps INTEGER NOT NULL,
  claim_ratio_bps INTEGER NOT NULL,
  cashless_own_workshop BOOLEAN NOT NULL DEFAULT true,
  renewal_stability TEXT NOT NULL DEFAULT 'stable',
  confirmed_at DATE NOT NULL,
  UNIQUE (tenant_id, name)
);
ALTER TABLE insurance_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_products FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON insurance_products;
CREATE POLICY tenant_isolation ON insurance_products
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON insurance_products TO arth_app;

CREATE TABLE IF NOT EXISTS source_costs (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  source_key TEXT NOT NULL,
  month DATE NOT NULL,
  spend_paise BIGINT NOT NULL,
  PRIMARY KEY (tenant_id, source_key, month)
);
ALTER TABLE source_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_costs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON source_costs;
CREATE POLICY tenant_isolation ON source_costs
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON source_costs TO arth_app;

CREATE TABLE IF NOT EXISTS inbound_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  did TEXT NOT NULL,
  department_key TEXT NOT NULL,
  label TEXT NOT NULL,
  UNIQUE (tenant_id, did)
);
ALTER TABLE inbound_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_lines FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON inbound_lines;
CREATE POLICY tenant_isolation ON inbound_lines
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON inbound_lines TO arth_app;

CREATE TABLE IF NOT EXISTS inbound_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  line_id UUID NOT NULL REFERENCES inbound_lines(id),
  from_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','answered','missed')),
  answered_by UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE inbound_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_calls FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON inbound_calls;
CREATE POLICY tenant_isolation ON inbound_calls
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON inbound_calls TO arth_app;

CREATE TABLE IF NOT EXISTS login_otps (
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (phone)
);

CREATE TABLE IF NOT EXISTS discount_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  amount_paise BIGINT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','refused')),
  actor_id UUID REFERENCES users(id),
  decided_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE discount_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_requests FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON discount_requests;
CREATE POLICY tenant_isolation ON discount_requests
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON discount_requests TO arth_app;

CREATE TABLE IF NOT EXISTS testdrives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  vehicle_id UUID REFERENCES stock_units(id),
  slot_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','done','no_show','cancelled')),
  coordinator_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE testdrives ENABLE ROW LEVEL SECURITY;
ALTER TABLE testdrives FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON testdrives;
CREATE POLICY tenant_isolation ON testdrives
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON testdrives TO arth_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON login_otps TO arth_app;

INSERT INTO insurance_products (tenant_id, name, insurer, premium_paise, dealer_margin_bps, claim_ratio_bps, cashless_own_workshop, renewal_stability, confirmed_at)
SELECT t.id, p.name, p.insurer, p.prem, p.margin, p.claim, p.cashless, p.stab, DATE '2026-08-24'
FROM tenants t
CROSS JOIN (VALUES
  ('Comprehensive Plus','HDFC Ergo', 4200000, 1800, 9200, true, 'stable'),
  ('Workshop Care','ICICI Lombard', 3900000, 1400, 8900, true, 'stable'),
  ('Value Shield','Bajaj Allianz', 3100000, 2200, 8100, false, 'volatile'),
  ('OEM Shield','Tata AIG', 4500000, 1100, 9400, true, 'stable'),
  ('Basic Third Party add-on','New India', 1800000, 600, 7800, false, 'stable')
) AS p(name, insurer, prem, margin, claim, cashless, stab)
ON CONFLICT DO NOTHING;

INSERT INTO stock_units (tenant_id, branch_id, vin, model, variant, colour, status)
SELECT b.tenant_id, b.id, v.vin, v.model, v.variant, v.colour, 'available'
FROM branches b
CROSS JOIN (VALUES
  ('MBH26WF0001','Grand Vitara','Zeta','Pearl White'),
  ('MBH26WF0002','Fronx','Delta','Nexa Blue'),
  ('MBH26WF0003','Swift','ZXi','Solid Red'),
  ('MBH26WF0004','Grand Vitara','Zeta','Nexa Blue'),
  ('MBH26CT0001','Fronx','Delta','Pearl White')
) AS v(vin, model, variant, colour)
WHERE (b.id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1' AND v.vin LIKE 'MBH26WF%')
   OR (b.id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2' AND v.vin LIKE 'MBH26CT%')
ON CONFLICT DO NOTHING;

INSERT INTO source_costs (tenant_id, source_key, month, spend_paise)
SELECT t.id, s.src, DATE '2026-08-01', s.spend
FROM tenants t
CROSS JOIN (VALUES
  ('google', 184000000),
  ('meta', 92000000),
  ('inbound_call', 12000000),
  ('walk_in', 0)
) AS s(src, spend)
ON CONFLICT DO NOTHING;

INSERT INTO inbound_lines (tenant_id, branch_id, did, department_key, label)
SELECT b.tenant_id, b.id, l.did, l.dept, l.label
FROM branches b
JOIN (VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1','08047110001','sales','Whitefield sales inbound'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1','08047110002','service','Whitefield service inbound'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1','08047110003','insurance','Whitefield insurance inbound')
) AS l(bid, did, dept, label) ON l.bid = b.id::text
ON CONFLICT DO NOTHING;

INSERT INTO positions (id, tenant_id, branch_id, title) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc51', '11111111-1111-1111-1111-111111111111', NULL, 'GM'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc52', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Sales manager'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc53', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Service advisor'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc54', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Service manager'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc55', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Insurance telecaller'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc56', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Insurance executive'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc57', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Test drive coordinator')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, position_id, full_name, phone, role_key, workspace_key, username, password_hash, is_active)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddd51', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc51', 'V. Kumar', '9845011151', 'gm', 'gm', 'kumar', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd52', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc52', 'R. Lal', '9845011152', 'salesmgr', 'pipe', 'lal', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd53', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc53', 'H. Irfan', '9845011153', 'svc', 'svc', 'irfan', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd54', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc54', 'A. Mehta', '9845011154', 'svcmgr', 'svc', 'mehta', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd55', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc55', 'F. Iqbal', '9845011155', 'instele', 'dayb', 'iqbal', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd56', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc56', 'P. Nanda', '9845011156', 'ins', 'ins', 'nanda', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd57', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccc57', 'S. Ravi', '9845011157', 'tdcoord', 'drive', 'ravi', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a', true)
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, role_key = EXCLUDED.role_key, workspace_key = EXCLUDED.workspace_key, password_hash = EXCLUDED.password_hash;

CREATE OR REPLACE FUNCTION arth_dept_ok(p_dept text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE NULLIF(current_setting('app.role_key', true), '')
    WHEN 'tele' THEN COALESCE(p_dept, 'sales') = 'sales'
    WHEN 'sales' THEN COALESCE(p_dept, 'sales') = 'sales'
    WHEN 'salesmgr' THEN COALESCE(p_dept, 'sales') = 'sales'
    WHEN 'tdcoord' THEN COALESCE(p_dept, 'sales') = 'sales'
    WHEN 'svctele' THEN p_dept = 'service'
    WHEN 'svc' THEN p_dept = 'service'
    WHEN 'svcmgr' THEN p_dept = 'service'
    WHEN 'instele' THEN p_dept = 'insurance'
    WHEN 'ins' THEN p_dept = 'insurance'
    ELSE true
  END;
$$;

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
  IF uid IS NULL THEN RETURN false; END IF;
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
    FROM users u LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = uid AND u.is_active;
  END IF;
  IF u_role IS NULL OR p_tenant IS DISTINCT FROM u_tenant THEN RETURN false; END IF;
  IF u_role IN ('owner', 'adv', 'admin', 'ops', 'gm') THEN RETURN true; END IF;
  IF u_role IN ('mgr', 'salesmgr', 'svcmgr') THEN
    RETURN u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;
  IF u_role = 'lead' THEN
    IF p_owner = uid THEN RETURN true; END IF;
    IF u_branch IS NOT NULL AND p_branch = u_branch AND p_owner IS NULL AND p_responded IS NULL THEN RETURN true; END IF;
    RETURN EXISTS (
      SELECT 1 FROM users ru JOIN positions rp ON rp.id = ru.position_id
      WHERE ru.id = p_owner AND rp.reports_to = u_position
    );
  END IF;
  IF u_role IN ('tele', 'svctele', 'instele', 'sales', 'svc', 'ins', 'tdcoord') THEN
    IF p_owner = uid THEN RETURN true; END IF;
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
        WHEN 'gm' THEN true
        WHEN 'acct' THEN false
        WHEN 'mgr' THEN
          branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        WHEN 'salesmgr' THEN
          branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          AND department_key = 'sales'
        WHEN 'svcmgr' THEN
          branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          AND department_key = 'service'
        WHEN 'lead' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
          OR EXISTS (
            SELECT 1 FROM users ru JOIN positions rp ON rp.id = ru.position_id
            WHERE ru.id = leads.owner_user_id
              AND rp.reports_to = NULLIF(current_setting('app.position_id', true), '')::uuid
          )
        WHEN 'tele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            AND department_key = 'sales'
          )
        WHEN 'svctele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            AND department_key = 'service'
          )
        WHEN 'instele' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NULL
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
            AND department_key = 'insurance'
          )
        WHEN 'sales' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NOT NULL AND pool_open
            AND department_key = 'sales'
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
        WHEN 'svc' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NOT NULL AND pool_open
            AND department_key = 'service'
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
        WHEN 'ins' THEN
          owner_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          OR (
            owner_user_id IS NULL AND first_responded_at IS NOT NULL AND pool_open
            AND department_key = 'insurance'
            AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
          )
        WHEN 'tdcoord' THEN
          testdrive_at IS NOT NULL
          AND department_key = 'sales'
          AND branch_id = NULLIF(current_setting('app.branch_id', true), '')::uuid
        ELSE false
      END
    )
  )
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE OR REPLACE FUNCTION arth_authenticate_phone(p_phone text)
RETURNS TABLE (
  user_id uuid,
  tenant_id uuid,
  role_key text,
  workspace_key text,
  full_name text,
  tenant_name text,
  kind text,
  username text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.tenant_id, u.role_key, u.workspace_key, u.full_name, t.name, 'dealer'::text, u.username
  FROM users u
  JOIN tenants t ON t.id = u.tenant_id
  WHERE regexp_replace(u.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
    AND u.is_active AND u.role_key <> 'ops' AND t.status = 'live'
  LIMIT 1;
$$;
ALTER FUNCTION arth_authenticate_phone(text) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_authenticate_phone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_authenticate_phone(text) TO arth_app;
GRANT EXECUTE ON FUNCTION arth_dept_ok(text) TO arth_app;

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
  dept text := CASE
    WHEN role = 'svctele' THEN 'service'
    WHEN role = 'instele' THEN 'insurance'
    ELSE 'sales'
  END;
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
  ) q
  ORDER BY q.late_rank, q.next_action_at NULLS LAST
  LIMIT 200;
END;
$$;
ALTER FUNCTION arth_queue_lead_ids(uuid) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_queue_lead_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_queue_lead_ids(uuid) TO arth_app;

CREATE OR REPLACE FUNCTION arth_pipeline_lead_ids(
  p_personal boolean,
  p_stage text,
  p_limit integer
)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  uid uuid := NULLIF(current_setting('app.user_id', true), '')::uuid;
  role text := NULLIF(current_setting('app.role_key', true), '');
  bid uuid := NULLIF(current_setting('app.branch_id', true), '')::uuid;
  cap integer := LEAST(GREATEST(COALESCE(p_limit, 80), 1), 200);
BEGIN
  IF tid IS NULL OR uid IS NULL THEN
    RETURN;
  END IF;
  IF p_personal THEN
    RETURN QUERY
    SELECT l.id
    FROM leads l
    WHERE l.tenant_id = tid
      AND (
        l.owner_user_id = uid
        OR (
          role IN ('sales', 'svc', 'ins')
          AND l.pool_open
          AND l.owner_user_id IS NULL
          AND l.first_responded_at IS NOT NULL
          AND l.department_key = CASE role WHEN 'svc' THEN 'service' WHEN 'ins' THEN 'insurance' ELSE 'sales' END
          AND bid IS NOT NULL
          AND l.branch_id = bid
        )
      )
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role IN ('mgr', 'salesmgr', 'svcmgr') AND bid IS NOT NULL THEN
    RETURN QUERY
    SELECT l.id FROM leads l
    WHERE l.tenant_id = tid AND l.branch_id = bid
      AND arth_dept_ok(l.department_key)
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role IN ('owner', 'adv', 'admin', 'ops', 'gm') THEN
    RETURN QUERY
    SELECT l.id FROM leads l
    WHERE l.tenant_id = tid
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role = 'lead' THEN
    RETURN QUERY
    SELECT l.id FROM leads l
    WHERE l.tenant_id = tid
      AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at)
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  END IF;
END;
$$;
ALTER FUNCTION arth_pipeline_lead_ids(boolean, text, integer) OWNER TO CURRENT_USER;
GRANT EXECUTE ON FUNCTION arth_pipeline_lead_ids(boolean, text, integer) TO arth_app;

CREATE OR REPLACE FUNCTION arth_pipeline_counts(p_personal boolean)
RETURNS TABLE (stage_key text, n bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  uid uuid := NULLIF(current_setting('app.user_id', true), '')::uuid;
  role text := NULLIF(current_setting('app.role_key', true), '');
  bid uuid := NULLIF(current_setting('app.branch_id', true), '')::uuid;
BEGIN
  IF tid IS NULL OR uid IS NULL THEN
    RETURN;
  END IF;
  IF p_personal THEN
    RETURN QUERY
    SELECT l.stage_key, count(*)
    FROM leads l
    WHERE l.tenant_id = tid
      AND (
        l.owner_user_id = uid
        OR (
          role IN ('sales', 'svc', 'ins')
          AND l.pool_open
          AND l.owner_user_id IS NULL
          AND l.first_responded_at IS NOT NULL
          AND l.department_key = CASE role WHEN 'svc' THEN 'service' WHEN 'ins' THEN 'insurance' ELSE 'sales' END
          AND bid IS NOT NULL
          AND l.branch_id = bid
        )
      )
    GROUP BY l.stage_key;
  ELSIF role IN ('mgr', 'salesmgr', 'svcmgr') AND bid IS NOT NULL THEN
    RETURN QUERY
    SELECT l.stage_key, count(*)
    FROM leads l
    WHERE l.tenant_id = tid AND l.branch_id = bid AND arth_dept_ok(l.department_key)
    GROUP BY l.stage_key;
  ELSIF role IN ('owner', 'adv', 'admin', 'ops', 'gm', 'lead') THEN
    RETURN QUERY
    SELECT l.stage_key, count(*)
    FROM leads l
    WHERE l.tenant_id = tid
      AND (
        role IN ('owner', 'adv', 'admin', 'ops', 'gm')
        OR arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at)
      )
    GROUP BY l.stage_key;
  END IF;
END;
$$;
ALTER FUNCTION arth_pipeline_counts(boolean) OWNER TO CURRENT_USER;
GRANT EXECUTE ON FUNCTION arth_pipeline_counts(boolean) TO arth_app;

INSERT INTO customers (id, tenant_id, full_name, phone)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeee061',
  '11111111-1111-1111-1111-111111111111',
  'K. Hegde',
  '9845012261'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO leads (
  id, tenant_id, branch_id, customer_id, source_key, source_detail,
  model_interest, stage_key, department_key, intake_kind,
  owner_user_id, first_response_due, next_action_at, expected_value_paise
)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffff61',
  '11111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeee061',
  'inbound_call',
  'Insurance inbound DID 08047110003',
  'Grand Vitara',
  'new',
  'insurance',
  'tele_push',
  NULL,
  now() + interval '2 hours',
  now() + interval '2 hours',
  4200000
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_consents (tenant_id, customer_id, purpose_key, granted)
SELECT c.tenant_id, c.id, p.purpose, true
FROM customers c
CROSS JOIN (VALUES ('service_reminders'), ('insurance_renewal'), ('offers')) AS p(purpose)
WHERE c.tenant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT DO NOTHING;
