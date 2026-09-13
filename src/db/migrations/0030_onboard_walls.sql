-- Onboarding may list dealers and provision them. It must never become an ops seat.
-- Accounts must not read customer rows. Existing customers get a sales-enquiry consent
-- so WhatsApp on the live book is honest; one withdrawn name proves the refusal.

CREATE OR REPLACE FUNCTION arth_platform_can_onboard()
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
      AND role_key IN ('adv_admin', 'adv_onboard')
  );
$$;
ALTER FUNCTION arth_platform_can_onboard() OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_platform_can_onboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_platform_can_onboard() TO arth_app;

CREATE OR REPLACE FUNCTION arth_platform_ops_user(p_tenant uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oid uuid;
  plat_role text;
BEGIN
  SELECT role_key INTO plat_role
  FROM platform_users
  WHERE id = NULLIF(current_setting('app.platform_user_id', true), '')::uuid
    AND is_active;
  IF plat_role IS NULL THEN
    RAISE EXCEPTION 'Platform operators only';
  END IF;
  IF plat_role = 'adv_onboard' THEN
    RAISE EXCEPTION 'Advito onboarding sees configuration, never a dealer book.';
  END IF;
  IF plat_role NOT IN ('adv_admin', 'adv_support') THEN
    RAISE EXCEPTION 'Platform operators only';
  END IF;
  SELECT u.id INTO oid
  FROM users u
  WHERE u.tenant_id = p_tenant AND u.role_key = 'ops' AND u.is_active
  LIMIT 1;
  RETURN oid;
END;
$$;
ALTER FUNCTION arth_platform_ops_user(uuid) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_platform_ops_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_platform_ops_user(uuid) TO arth_app;

CREATE OR REPLACE FUNCTION arth_onboard_dealer(
  p_dealer_name text,
  p_branch_name text,
  p_principal_name text,
  p_principal_phone text,
  p_principal_username text,
  p_desk_name text,
  p_desk_phone text,
  p_desk_username text,
  p_tele_name text,
  p_tele_phone text,
  p_tele_username text,
  p_password_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template uuid := '11111111-1111-1111-1111-111111111111';
  new_tenant uuid := gen_random_uuid();
  new_brand uuid := gen_random_uuid();
  new_branch uuid := gen_random_uuid();
  pos_tele uuid := gen_random_uuid();
  pos_desk uuid := gen_random_uuid();
  pos_prin uuid := gen_random_uuid();
  d int;
BEGIN
  IF NOT arth_platform_can_onboard() THEN
    RAISE EXCEPTION 'Advito admin or onboarding only';
  END IF;
  IF length(trim(p_dealer_name)) < 3 THEN
    RAISE EXCEPTION 'Dealer name is required';
  END IF;
  IF p_password_hash IS NULL OR p_password_hash NOT LIKE 'scrypt$%' THEN
    RAISE EXCEPTION 'Password hash is required';
  END IF;
  IF EXISTS (
    SELECT 1 FROM users WHERE username IS NOT NULL AND lower(username) IN (
      lower(trim(p_principal_username)), lower(trim(p_desk_username)), lower(trim(p_tele_username))
    )
  ) OR EXISTS (
    SELECT 1 FROM platform_users WHERE lower(username) IN (
      lower(trim(p_principal_username)), lower(trim(p_desk_username)), lower(trim(p_tele_username))
    )
  ) THEN
    RAISE EXCEPTION 'That username is already in use';
  END IF;

  INSERT INTO tenants (id, name, plan_key, status)
  VALUES (new_tenant, trim(p_dealer_name), 'professional', 'live');

  INSERT INTO brands (id, tenant_id, name) VALUES (new_brand, new_tenant, 'Maruti Suzuki');
  INSERT INTO branches (id, tenant_id, brand_id, name, timezone)
  VALUES (new_branch, new_tenant, new_brand, trim(p_branch_name), 'Asia/Kolkata');

  INSERT INTO positions (id, tenant_id, branch_id, title, reports_to) VALUES
    (pos_prin, new_tenant, NULL, 'Dealer principal', NULL),
    (pos_desk, new_tenant, new_branch, 'Digital desk manager', pos_prin),
    (pos_tele, new_tenant, new_branch, 'Telecaller', pos_desk);

  FOR d IN 0..6 LOOP
    INSERT INTO working_hours (tenant_id, branch_id, day_of_week, opens_at, closes_at)
    VALUES (
      new_tenant,
      new_branch,
      d,
      CASE WHEN d = 0 THEN NULL ELSE TIME '09:30' END,
      CASE WHEN d = 0 THEN NULL ELSE TIME '18:30' END
    );
  END LOOP;

  INSERT INTO config_stages (tenant_id, key, label, sort_order, is_terminal)
  SELECT new_tenant, key, label, sort_order, is_terminal
  FROM config_stages WHERE tenant_id = template;

  INSERT INTO config_lost_reasons (tenant_id, key, label, requires_fact)
  SELECT new_tenant, key, label, requires_fact
  FROM config_lost_reasons WHERE tenant_id = template;

  INSERT INTO config_dispositions (
    tenant_id, key, label, connected, requires_revisit, requires_lost_reason, sort_order
  )
  SELECT new_tenant, key, label, connected, requires_revisit, requires_lost_reason, sort_order
  FROM config_dispositions WHERE tenant_id = template;

  INSERT INTO config_thresholds (tenant_id, key, value_int)
  SELECT new_tenant, key, value_int FROM config_thresholds WHERE tenant_id = template;

  INSERT INTO users (
    tenant_id, position_id, full_name, phone, role_key, workspace_key, username, password_hash
  ) VALUES
    (new_tenant, pos_prin, trim(p_principal_name), trim(p_principal_phone), 'owner', 'prin', lower(trim(p_principal_username)), p_password_hash),
    (new_tenant, pos_desk, trim(p_desk_name), trim(p_desk_phone), 'mgr', 'desk', lower(trim(p_desk_username)), p_password_hash),
    (new_tenant, pos_tele, trim(p_tele_name), trim(p_tele_phone), 'tele', 'dayb', lower(trim(p_tele_username)), p_password_hash),
    (new_tenant, pos_prin, 'Advito support on this dealer', '0000000000', 'ops', 'desk', NULL, NULL);

  INSERT INTO platform_audit (platform_user_id, action, tenant_id, note)
  VALUES (
    NULLIF(current_setting('app.platform_user_id', true), '')::uuid,
    'onboard_dealer',
    new_tenant,
    trim(p_dealer_name)
  );

  RETURN new_tenant;
END;
$$;
ALTER FUNCTION arth_onboard_dealer(text, text, text, text, text, text, text, text, text, text, text, text) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_onboard_dealer(text, text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_onboard_dealer(text, text, text, text, text, text, text, text, text, text, text, text) TO arth_app;

DROP POLICY IF EXISTS tenant_isolation ON customers;
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND NULLIF(current_setting('app.role_key', true), '') IS DISTINCT FROM 'acct'
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND NULLIF(current_setting('app.role_key', true), '') IS DISTINCT FROM 'acct'
  );

INSERT INTO customer_consents (tenant_id, customer_id, purpose_key, granted)
SELECT c.tenant_id, c.id, 'sales_enquiry', true
FROM customers c
ON CONFLICT DO NOTHING;

INSERT INTO customers (id, tenant_id, full_name, phone)
VALUES (
  'ffffffff-ffff-ffff-ffff-fffffffff042',
  '11111111-1111-1111-1111-111111111111',
  'Kiran Withdrawn',
  '9845099042'
)
ON CONFLICT (tenant_id, phone) DO NOTHING;

INSERT INTO leads (
  id, tenant_id, branch_id, customer_id, source_key, source_detail,
  model_interest, stage_key, department_key, intake_kind,
  owner_user_id, assigned_at, first_response_due, next_action_at, first_responded_at
)
SELECT
  'ffffffff-ffff-ffff-ffff-ffffffffff42',
  '11111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  c.id,
  'inbound_call',
  'Consent withdrawn walk-through',
  'Fronx',
  'contacted',
  'sales',
  'tele_push',
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  now() - interval '2 hours',
  now() - interval '1 hour',
  now() + interval '4 hours',
  now() - interval '90 minutes'
FROM customers c
WHERE c.phone = '9845099042' AND c.tenant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (id) DO NOTHING;

INSERT INTO customer_consents (tenant_id, customer_id, purpose_key, granted, withdrawn_at)
SELECT c.tenant_id, c.id, 'sales_enquiry', false, now()
FROM customers c
WHERE c.phone = '9845099042' AND c.tenant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (customer_id, purpose_key) DO UPDATE
  SET granted = false, withdrawn_at = now();

GRANT EXECUTE ON FUNCTION arth_dept_ok(text) TO arth_app;
GRANT EXECUTE ON FUNCTION arth_request_password_reset(text) TO arth_app;
