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
      AND l.owner_user_id = uid
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role = 'mgr' AND bid IS NOT NULL THEN
    RETURN QUERY
    SELECT l.id
    FROM leads l
    WHERE l.tenant_id = tid
      AND l.branch_id = bid
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role IN ('owner', 'adv', 'admin', 'ops') THEN
    RETURN QUERY
    SELECT l.id
    FROM leads l
    WHERE l.tenant_id = tid
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role = 'lead' THEN
    RETURN QUERY
    SELECT l.id
    FROM leads l
    WHERE l.tenant_id = tid
      AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at)
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  END IF;
END;
$$;

ALTER FUNCTION arth_pipeline_lead_ids(boolean, text, integer) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_pipeline_lead_ids(boolean, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_pipeline_lead_ids(boolean, text, integer) TO arth_app;
