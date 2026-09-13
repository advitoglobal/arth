-- Visibility walls: dealer, branch, team, then owner. Fail closed if app.user_id is missing.

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

  IF u_role IN ('owner', 'adv', 'admin') THEN
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

DROP POLICY IF EXISTS tenant_isolation ON leads;
CREATE POLICY tenant_isolation ON leads
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND arth_lead_visible(id)
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

DROP POLICY IF EXISTS tenant_isolation ON customers;
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      NOT EXISTS (SELECT 1 FROM leads l WHERE l.customer_id = customers.id)
      OR EXISTS (SELECT 1 FROM leads l WHERE l.customer_id = customers.id AND arth_lead_visible(l.id))
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

DROP POLICY IF EXISTS tenant_isolation ON lead_events;
CREATE POLICY tenant_isolation ON lead_events
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND arth_lead_visible(lead_id)
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

INSERT INTO positions (id, tenant_id, branch_id, title, reports_to) VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccc6', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Team leader', NULL),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc7', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Branch manager', NULL),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc8', '11111111-1111-1111-1111-111111111111', NULL, 'Dealer principal', NULL),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc9', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Branch manager', NULL),
  ('cccccccc-cccc-cccc-cccc-cccccccccc10', '22222222-2222-2222-2222-222222222222', NULL, 'Dealer principal', NULL)
ON CONFLICT (id) DO NOTHING;

UPDATE positions SET reports_to = 'cccccccc-cccc-cccc-cccc-ccccccccccc7'
WHERE id = 'cccccccc-cccc-cccc-cccc-ccccccccccc6';
UPDATE positions SET reports_to = 'cccccccc-cccc-cccc-cccc-ccccccccccc8'
WHERE id = 'cccccccc-cccc-cccc-cccc-ccccccccccc7';
UPDATE positions SET reports_to = 'cccccccc-cccc-cccc-cccc-ccccccccccc6'
WHERE id IN (
  'cccccccc-cccc-cccc-cccc-ccccccccccc1',
  'cccccccc-cccc-cccc-cccc-ccccccccccc3'
);
UPDATE positions SET reports_to = 'cccccccc-cccc-cccc-cccc-cccccccccc10'
WHERE id = 'cccccccc-cccc-cccc-cccc-ccccccccccc9';

INSERT INTO users (id, tenant_id, position_id, full_name, phone, role_key, workspace_key, username, password_hash) VALUES
  ('dddddddd-dddd-dddd-dddd-ddddddddddd6', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc6', 'P. Menon', '9845011114', 'lead', 'pipe', 'menon', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd7', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc7', 'R. Gupta', '9845011115', 'mgr', 'pipe', 'gupta', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd8', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc8', 'D. Shah', '9845011116', 'owner', 'pipe', 'shah', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd9', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-ccccccccccc9', 'L. Fernandes', '9845022224', 'mgr', 'pipe', 'fernandes', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd10', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccc10', 'A. Kamath', '9845022225', 'owner', 'pipe', 'kamath', 'scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role_key = EXCLUDED.role_key,
  position_id = EXCLUDED.position_id;
