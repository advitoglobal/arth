CREATE OR REPLACE FUNCTION arth_request_password_reset(p_username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_id uuid;
  u_tenant uuid;
  u_name text;
  m RECORD;
BEGIN
  SELECT id, tenant_id, full_name INTO u_id, u_tenant, u_name
  FROM users
  WHERE lower(username) = lower(trim(p_username)) AND is_active;
  IF u_id IS NULL THEN
    RETURN;
  END IF;
  FOR m IN
    SELECT id FROM users
    WHERE tenant_id = u_tenant AND is_active AND role_key IN ('mgr', 'owner', 'admin')
  LOOP
    INSERT INTO notifications (tenant_id, user_id, title, why, href)
    VALUES (
      u_tenant,
      m.id,
      u_name || ' asked to reset a password',
      'Set a temporary password. They must change it on first use. You never hold their live password.',
      '/w/admin'
    );
  END LOOP;
END;
$$;
ALTER FUNCTION arth_request_password_reset(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_request_password_reset(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_request_password_reset(text) TO arth_app;
GRANT EXECUTE ON FUNCTION arth_dept_ok(text) TO arth_app;
