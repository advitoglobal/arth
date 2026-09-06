-- Director product (6 Sep 2026). Additive. RLS, ledgers, clocks, paise stay.
-- Vendors are not connected. SMS/telephony/WhatsApp stay as adapters.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS is_not_enquiry BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS not_enquiry_reason TEXT,
  ADD COLUMN IF NOT EXISTS click_id TEXT,
  ADD COLUMN IF NOT EXISTS campaign_key TEXT,
  ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_intake_kind_chk;
ALTER TABLE leads ADD CONSTRAINT leads_intake_kind_chk
  CHECK (intake_kind IN (
    'tele_push', 'manager_upload', 'platform', 'inbound', 'walk_in', 'referral'
  ));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_not_enquiry_reason_chk;
ALTER TABLE leads ADD CONSTRAINT leads_not_enquiry_reason_chk
  CHECK (
    NOT is_not_enquiry
    OR not_enquiry_reason IN (
      'wrong_number', 'misclick', 'not_a_customer', 'route_other_dept', 'duplicate'
    )
  );

INSERT INTO config_dispositions (tenant_id, key, label, connected, requires_revisit, requires_lost_reason, sort_order, department_key)
SELECT t.id, 'not_an_enquiry', 'Not an enquiry', false, false, false, 90, 'sales'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM config_dispositions x
  WHERE x.tenant_id = t.id AND x.key = 'not_an_enquiry'
);

INSERT INTO config_dispositions (tenant_id, key, label, connected, requires_revisit, requires_lost_reason, sort_order, department_key)
SELECT t.id, 'interested_continuing', 'Interested, continuing', true, true, false, 5, 'sales'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM config_dispositions x
  WHERE x.tenant_id = t.id AND x.key = 'interested_continuing'
);

CREATE TABLE IF NOT EXISTS price_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  price_master_id UUID NOT NULL REFERENCES price_master(id) ON DELETE CASCADE,
  component_key TEXT NOT NULL CHECK (component_key IN ('ex_showroom', 'rto', 'insurance', 'accessories')),
  amount_paise BIGINT NOT NULL,
  confirmed_at DATE NOT NULL,
  UNIQUE (price_master_id, component_key)
);
ALTER TABLE price_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_components FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON price_components;
CREATE POLICY tenant_isolation ON price_components
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

INSERT INTO price_components (tenant_id, price_master_id, component_key, amount_paise, confirmed_at)
SELECT p.tenant_id, p.id, 'ex_showroom', p.ex_showroom_paise, p.confirmed_at FROM price_master p
ON CONFLICT DO NOTHING;
INSERT INTO price_components (tenant_id, price_master_id, component_key, amount_paise, confirmed_at)
SELECT p.tenant_id, p.id, 'rto', p.rto_paise, p.confirmed_at FROM price_master p
ON CONFLICT DO NOTHING;
INSERT INTO price_components (tenant_id, price_master_id, component_key, amount_paise, confirmed_at)
SELECT p.tenant_id, p.id, 'insurance', p.insurance_paise, p.confirmed_at FROM price_master p
ON CONFLICT DO NOTHING;
INSERT INTO price_components (tenant_id, price_master_id, component_key, amount_paise, confirmed_at)
SELECT p.tenant_id, p.id, 'accessories', p.accessories_paise, p.confirmed_at FROM price_master p
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS oem_catalogue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oem_key TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'car',
  UNIQUE (oem_key, model, variant)
);

INSERT INTO oem_catalogue (oem_key, model, variant, vehicle_type) VALUES
  ('maruti', 'Grand Vitara', 'Zeta', 'car'),
  ('maruti', 'Grand Vitara', 'Alpha', 'car'),
  ('maruti', 'Fronx', 'Delta', 'car'),
  ('maruti', 'Fronx', 'Zeta', 'car'),
  ('maruti', 'Swift', 'VXI', 'car'),
  ('maruti', 'Brezza', 'ZXi', 'car')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS delivery_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  lane TEXT NOT NULL CHECK (lane IN ('finance', 'vehicle', 'prep')),
  step_key TEXT NOT NULL,
  sort_order SMALLINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'blocked')),
  block_reason TEXT,
  block_kind TEXT CHECK (block_kind IS NULL OR block_kind IN ('internal', 'external')),
  completed_at TIMESTAMPTZ,
  UNIQUE (lead_id, lane, step_key)
);
ALTER TABLE delivery_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_steps FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON delivery_steps;
CREATE POLICY tenant_isolation ON delivery_steps
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND arth_lead_visible(lead_id)
  )
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS delivery_promises (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  promised_on DATE NOT NULL,
  reason TEXT NOT NULL,
  actor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE delivery_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_promises FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON delivery_promises;
CREATE POLICY tenant_isolation ON delivery_promises
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND arth_lead_visible(lead_id)
  )
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS point_waivers (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  grantor_id UUID NOT NULL REFERENCES users(id),
  user_id UUID NOT NULL REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE point_waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_waivers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON point_waivers;
CREATE POLICY tenant_isolation ON point_waivers
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS auth_attempts (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_attempts_key_at ON auth_attempts (key, failed_at DESC);

CREATE TABLE IF NOT EXISTS vendor_adapters (
  key TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'stub' CHECK (status IN ('stub', 'live')),
  note TEXT NOT NULL
);
INSERT INTO vendor_adapters (key, status, note) VALUES
  ('sms', 'stub', 'Prem plugs the SMS vendor. Until then OTP is shown once on screen.'),
  ('telephony', 'stub', 'Prem plugs the exchange. Dial is a desk button. Points stay unofficial.'),
  ('whatsapp', 'stub', 'Prem plugs WhatsApp Business. Send opens wa.me until then.'),
  ('payments', 'stub', 'Invoicing later.'),
  ('vehicle_lookup', 'stub', 'Registration verification later.')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS offboarding_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  actor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  row_count INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE offboarding_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_exports FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON offboarding_exports;
CREATE POLICY tenant_isolation ON offboarding_exports
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND NULLIF(current_setting('app.role_key', true), '') IN ('owner', 'admin', 'ops', 'adv', 'acct')
  )
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- Human seed language. Do not leave developer words on the floor.
UPDATE lead_events SET note = 'Assigned to this seat.'
WHERE note LIKE 'Seed ladder: assigned%';
UPDATE lead_events SET note = 'Called, reached the customer.'
WHERE note LIKE 'Seed ladder: first connected%';
UPDATE lead_events SET note = regexp_replace(note, '^Seed ladder: moved to ', 'Moved to ')
WHERE note LIKE 'Seed ladder: moved to %';
UPDATE lead_events SET note = 'Called, no answer.'
WHERE note LIKE 'Seed ladder:%';

-- A believable book: most due later, some late. Leave proof fixtures alone.
UPDATE leads l
SET
  next_action_at = now() + ((ascii(substring(l.id::text FROM 10 FOR 1)) % 20) + 4) * interval '1 hour',
  first_responded_at = COALESCE(first_responded_at, created_at + interval '18 minutes')
WHERE l.tenant_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  )
  AND l.id <> 'ffffffff-ffff-ffff-ffff-fffffffffff1'
  AND l.next_action_at IS NOT NULL
  AND l.next_action_at < now()
  AND (ascii(substring(l.id::text FROM 1 FOR 1)) % 3) <> 0;

UPDATE leads
SET tracking_token = replace(gen_random_uuid()::text, '-', '')
WHERE stage_key IN ('booked', 'delivered') AND tracking_token IS NULL;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO arth_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO arth_app;
REVOKE UPDATE, DELETE ON lead_events FROM arth_app;
GRANT SELECT, INSERT ON lead_events TO arth_app;
REVOKE UPDATE, DELETE ON delivery_promises FROM arth_app;
GRANT SELECT, INSERT ON delivery_promises TO arth_app;
REVOKE UPDATE, DELETE ON point_movements FROM arth_app;
GRANT SELECT, INSERT ON point_movements TO arth_app;
REVOKE UPDATE, DELETE ON audit_logs FROM arth_app;
GRANT SELECT, INSERT ON audit_logs TO arth_app;
