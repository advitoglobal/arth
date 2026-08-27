CREATE OR REPLACE FUNCTION arth_book_counts()
RETURNS TABLE (names bigint, unowned bigint, late bigint)
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
  IF role IN ('owner', 'adv', 'admin', 'ops') THEN
    RETURN QUERY
    SELECT
      count(*),
      count(*) FILTER (WHERE owner_user_id IS NULL),
      count(*) FILTER (
        WHERE (next_action_at IS NOT NULL AND next_action_at < now())
           OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
      )
    FROM leads
    WHERE tenant_id = tid;
  ELSIF role = 'mgr' AND bid IS NOT NULL THEN
    RETURN QUERY
    SELECT
      count(*),
      count(*) FILTER (WHERE owner_user_id IS NULL),
      count(*) FILTER (
        WHERE (next_action_at IS NOT NULL AND next_action_at < now())
           OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
      )
    FROM leads
    WHERE tenant_id = tid AND branch_id = bid;
  ELSE
    RETURN QUERY
    SELECT
      count(*),
      count(*) FILTER (WHERE owner_user_id IS NULL),
      count(*) FILTER (
        WHERE (next_action_at IS NOT NULL AND next_action_at < now())
           OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
      )
    FROM leads
    WHERE tenant_id = tid
      AND arth_lead_row_visible(tenant_id, branch_id, owner_user_id, first_responded_at);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION arth_owner_load()
RETURNS TABLE (owner_user_id uuid, owned bigint, late bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  role text := NULLIF(current_setting('app.role_key', true), '');
  bid uuid := NULLIF(current_setting('app.branch_id', true), '')::uuid;
BEGIN
  IF tid IS NULL THEN
    RETURN;
  END IF;
  IF role = 'mgr' AND bid IS NOT NULL THEN
    RETURN QUERY
    SELECT
      l.owner_user_id,
      count(*),
      count(*) FILTER (
        WHERE (l.next_action_at IS NOT NULL AND l.next_action_at < now())
           OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
      )
    FROM leads l
    WHERE l.tenant_id = tid AND l.branch_id = bid AND l.owner_user_id IS NOT NULL
    GROUP BY l.owner_user_id;
  ELSIF role IN ('owner', 'adv', 'admin', 'ops') THEN
    RETURN QUERY
    SELECT
      l.owner_user_id,
      count(*),
      count(*) FILTER (
        WHERE (l.next_action_at IS NOT NULL AND l.next_action_at < now())
           OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
      )
    FROM leads l
    WHERE l.tenant_id = tid AND l.owner_user_id IS NOT NULL
    GROUP BY l.owner_user_id;
  END IF;
END;
$$;

ALTER FUNCTION arth_book_counts() OWNER TO postgres;
ALTER FUNCTION arth_owner_load() OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_book_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_owner_load() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_book_counts() TO arth_app;
GRANT EXECUTE ON FUNCTION arth_owner_load() TO arth_app;
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
    WHERE l.tenant_id = tid AND l.owner_user_id = uid
    GROUP BY l.stage_key;
  ELSIF role = 'mgr' AND bid IS NOT NULL THEN
    RETURN QUERY
    SELECT l.stage_key, count(*)
    FROM leads l
    WHERE l.tenant_id = tid AND l.branch_id = bid
    GROUP BY l.stage_key;
  ELSIF role IN ('owner', 'adv', 'admin', 'ops', 'lead') THEN
    RETURN QUERY
    SELECT l.stage_key, count(*)
    FROM leads l
    WHERE l.tenant_id = tid
      AND (
        role IN ('owner', 'adv', 'admin', 'ops')
        OR arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at)
      )
    GROUP BY l.stage_key;
  END IF;
END;
$$;

ALTER FUNCTION arth_pipeline_counts(boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_pipeline_counts(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_pipeline_counts(boolean) TO arth_app;
