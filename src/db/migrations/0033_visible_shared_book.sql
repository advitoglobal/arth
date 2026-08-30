-- Search uses arth_lead_row_visible. Tele seats must still see the unowned shared book.

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
  IF u_role IN ('tele', 'svctele', 'instele') THEN
    IF p_owner = uid THEN RETURN true; END IF;
    RETURN p_owner IS NULL AND p_responded IS NULL
      AND u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;
  IF u_role IN ('sales', 'svc', 'ins') THEN
    IF p_owner = uid THEN RETURN true; END IF;
    RETURN p_owner IS NULL AND p_responded IS NOT NULL
      AND u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;
  IF u_role = 'tdcoord' THEN
    RETURN u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;
  RETURN false;
END;
$$;
GRANT EXECUTE ON FUNCTION arth_lead_row_visible(uuid, uuid, uuid, timestamptz) TO arth_app;
