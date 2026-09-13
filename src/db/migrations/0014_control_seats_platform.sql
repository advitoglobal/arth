-- Digital desk manager and dealer principal landings.
-- Advito platform operators live outside any dealer tenant.
-- Support enters one dealer at a time through an ops shadow seat.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'live';

CREATE TABLE IF NOT EXISTS platform_users (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role_key TEXT NOT NULL CHECK (role_key IN ('adv_admin', 'adv_support')),
  workspace_key TEXT NOT NULL DEFAULT 'adealers',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS platform_users_username_unique ON platform_users (lower(username));

CREATE TABLE IF NOT EXISTS platform_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id UUID NOT NULL REFERENCES platform_users(id),
  action TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id),
  note TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_self ON platform_users;
CREATE POLICY platform_self ON platform_users
  USING (id = NULLIF(current_setting('app.platform_user_id', true), '')::uuid);

ALTER TABLE platform_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_audit_self ON platform_audit;
CREATE POLICY platform_audit_self ON platform_audit
  USING (platform_user_id = NULLIF(current_setting('app.platform_user_id', true), '')::uuid)
  WITH CHECK (platform_user_id = NULLIF(current_setting('app.platform_user_id', true), '')::uuid);

GRANT SELECT ON platform_users TO arth_app;
GRANT SELECT, INSERT ON platform_audit TO arth_app;

INSERT INTO platform_users (id, full_name, username, password_hash, role_key) VALUES
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    'Advito admin',
    'advito',
    'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a',
    'adv_admin'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
    'Advito support',
    'support',
    'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a',
    'adv_support'
  )
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role_key = EXCLUDED.role_key,
  is_active = true;

UPDATE users SET workspace_key = 'desk', role_key = 'mgr'
WHERE id IN (
  'dddddddd-dddd-dddd-dddd-ddddddddddd7',
  'dddddddd-dddd-dddd-dddd-ddddddddddd9'
);
UPDATE users SET workspace_key = 'prin'
WHERE id IN (
  'dddddddd-dddd-dddd-dddd-ddddddddddd8',
  'dddddddd-dddd-dddd-dddd-dddddddddd10'
);
UPDATE positions SET title = 'Digital desk manager'
WHERE id IN (
  'cccccccc-cccc-cccc-cccc-ccccccccccc7',
  'cccccccc-cccc-cccc-cccc-ccccccccccc9'
);

INSERT INTO users (
  id, tenant_id, position_id, full_name, phone, role_key, workspace_key, is_active
) VALUES
  (
    'dddddddd-dddd-dddd-dddd-dddddddddd11',
    '11111111-1111-1111-1111-111111111111',
    'cccccccc-cccc-cccc-cccc-ccccccccccc8',
    'Advito support on this dealer',
    '0000000001',
    'ops',
    'desk',
    true
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddd12',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccc10',
    'Advito support on this dealer',
    '0000000002',
    'ops',
    'desk',
    true
  )
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION arth_lead_visible(p_lead_id uuid)
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
  l_tenant uuid;
  l_branch uuid;
  l_owner uuid;
  l_responded timestamptz;
BEGIN
  BEGIN
    uid := NULLIF(current_setting('app.user_id', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT u.role_key, u.tenant_id, p.branch_id, u.position_id
    INTO u_role, u_tenant, u_branch, u_position
  FROM users u
  LEFT JOIN positions p ON p.id = u.position_id
  WHERE u.id = uid AND u.is_active;
  IF u_role IS NULL THEN
    RETURN false;
  END IF;

  SELECT tenant_id, branch_id, owner_user_id, first_responded_at
    INTO l_tenant, l_branch, l_owner, l_responded
  FROM leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF l_tenant IS DISTINCT FROM u_tenant THEN
    RETURN false;
  END IF;

  IF u_role IN ('owner', 'adv', 'admin', 'ops') THEN
    RETURN true;
  END IF;

  IF u_role = 'mgr' THEN
    RETURN u_branch IS NOT NULL AND l_branch = u_branch;
  END IF;

  IF u_role = 'lead' THEN
    IF l_owner = uid THEN
      RETURN true;
    END IF;
    IF u_branch IS NOT NULL AND l_branch = u_branch AND l_owner IS NULL AND l_responded IS NULL THEN
      RETURN true;
    END IF;
    RETURN EXISTS (
      SELECT 1
      FROM users ru
      JOIN positions rp ON rp.id = ru.position_id
      WHERE ru.id = l_owner AND rp.reports_to = u_position
    );
  END IF;

  IF u_role IN ('tele', 'svctele') THEN
    IF l_owner = uid THEN
      RETURN true;
    END IF;
    RETURN l_owner IS NULL AND l_responded IS NULL
      AND u_branch IS NOT NULL AND l_branch = u_branch;
  END IF;

  IF u_role = 'sales' THEN
    RETURN l_owner = uid;
  END IF;

  RETURN false;
END;
$$;

ALTER FUNCTION arth_lead_visible(uuid) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_lead_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_lead_visible(uuid) TO arth_app;

DROP FUNCTION IF EXISTS arth_session_seat(text);
DROP FUNCTION IF EXISTS arth_authenticate(text);

CREATE OR REPLACE FUNCTION arth_authenticate(p_username text)
RETURNS TABLE (
  user_id uuid,
  tenant_id uuid,
  password_hash text,
  role_key text,
  workspace_key text,
  full_name text,
  tenant_name text,
  kind text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.tenant_id,
    u.password_hash,
    u.role_key,
    u.workspace_key,
    u.full_name,
    t.name,
    'dealer'::text
  FROM users u
  JOIN tenants t ON t.id = u.tenant_id
  WHERE u.username IS NOT NULL
    AND lower(u.username) = lower(trim(p_username))
    AND u.is_active
    AND u.role_key <> 'ops'
    AND t.status = 'live'
  UNION ALL
  SELECT
    p.id,
    NULL::uuid,
    p.password_hash,
    p.role_key,
    p.workspace_key,
    p.full_name,
    'Advito'::text,
    'platform'::text
  FROM platform_users p
  WHERE lower(p.username) = lower(trim(p_username))
    AND p.is_active
  LIMIT 1;
$$;

ALTER FUNCTION arth_authenticate(text) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_authenticate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_authenticate(text) TO arth_app;

CREATE OR REPLACE FUNCTION arth_session_seat(p_username text)
RETURNS TABLE (
  user_id uuid,
  tenant_id uuid,
  role_key text,
  workspace_key text,
  full_name text,
  tenant_name text,
  kind text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, tenant_id, role_key, workspace_key, full_name, tenant_name, kind
  FROM arth_authenticate(p_username);
$$;

ALTER FUNCTION arth_session_seat(text) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_session_seat(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_session_seat(text) TO arth_app;

CREATE OR REPLACE FUNCTION arth_platform_is_admin()
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
      AND role_key = 'adv_admin'
  );
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
      AND role_key IN ('adv_admin', 'adv_support')
  );
$$;

CREATE OR REPLACE FUNCTION arth_platform_dealers()
RETURNS TABLE (
  id uuid,
  name text,
  plan_key text,
  status text,
  created_at timestamptz,
  branch_count bigint,
  seat_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT arth_platform_is_operator() THEN
    RAISE EXCEPTION 'Platform operators only';
  END IF;
  RETURN QUERY
    SELECT
      t.id,
      t.name,
      t.plan_key,
      t.status,
      t.created_at,
      (SELECT count(*) FROM branches b WHERE b.tenant_id = t.id),
      (SELECT count(*) FROM users u WHERE u.tenant_id = t.id AND u.role_key <> 'ops' AND u.is_active)
    FROM tenants t
    ORDER BY t.name;
END;
$$;

CREATE OR REPLACE FUNCTION arth_platform_dealer(p_tenant uuid)
RETURNS TABLE (
  id uuid,
  name text,
  plan_key text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT arth_platform_is_operator() THEN
    RAISE EXCEPTION 'Platform operators only';
  END IF;
  RETURN QUERY
    SELECT t.id, t.name, t.plan_key, t.status, t.created_at
    FROM tenants t
    WHERE t.id = p_tenant;
END;
$$;

CREATE OR REPLACE FUNCTION arth_platform_ops_user(p_tenant uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oid uuid;
BEGIN
  IF NOT arth_platform_is_operator() THEN
    RAISE EXCEPTION 'Platform operators only';
  END IF;
  SELECT u.id INTO oid
  FROM users u
  WHERE u.tenant_id = p_tenant AND u.role_key = 'ops' AND u.is_active
  LIMIT 1;
  RETURN oid;
END;
$$;

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
  IF NOT arth_platform_is_admin() THEN
    RAISE EXCEPTION 'Advito admin only';
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

ALTER FUNCTION arth_platform_is_admin() OWNER TO CURRENT_USER;
ALTER FUNCTION arth_platform_is_operator() OWNER TO CURRENT_USER;
ALTER FUNCTION arth_platform_dealers() OWNER TO CURRENT_USER;
ALTER FUNCTION arth_platform_dealer(uuid) OWNER TO CURRENT_USER;
ALTER FUNCTION arth_platform_ops_user(uuid) OWNER TO CURRENT_USER;
ALTER FUNCTION arth_onboard_dealer(text, text, text, text, text, text, text, text, text, text, text, text) OWNER TO CURRENT_USER;

REVOKE ALL ON FUNCTION arth_platform_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_platform_is_operator() FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_platform_dealers() FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_platform_dealer(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_platform_ops_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_onboard_dealer(text, text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION arth_platform_is_admin() TO arth_app;
GRANT EXECUTE ON FUNCTION arth_platform_is_operator() TO arth_app;
GRANT EXECUTE ON FUNCTION arth_platform_dealers() TO arth_app;
GRANT EXECUTE ON FUNCTION arth_platform_dealer(uuid) TO arth_app;
GRANT EXECUTE ON FUNCTION arth_platform_ops_user(uuid) TO arth_app;
GRANT EXECUTE ON FUNCTION arth_onboard_dealer(text, text, text, text, text, text, text, text, text, text, text, text) TO arth_app;

CREATE OR REPLACE FUNCTION arth_platform_log(p_action text, p_tenant uuid, p_note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT arth_platform_is_operator() THEN
    RAISE EXCEPTION 'Platform operators only';
  END IF;
  INSERT INTO platform_audit (platform_user_id, action, tenant_id, note)
  VALUES (
    NULLIF(current_setting('app.platform_user_id', true), '')::uuid,
    p_action,
    p_tenant,
    p_note
  );
END;
$$;

ALTER FUNCTION arth_platform_log(text, uuid, text) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_platform_log(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_platform_log(text, uuid, text) TO arth_app;
