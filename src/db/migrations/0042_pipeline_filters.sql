-- My enquiries filters: source, overdue, parked, owner. Same predicates as Search.
-- Parked stays derived. Owner filter cannot widen a personal book.

CREATE OR REPLACE FUNCTION arth_book_filter_ok(
  p_source text,
  p_overdue text,
  p_parked text,
  p_owner uuid,
  p_source_key text,
  p_next_action_at timestamptz,
  p_first_response_due timestamptz,
  p_first_responded_at timestamptz,
  p_last_disposition_key text,
  p_last_revisit_at timestamptz,
  p_owner_user_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    (p_source IS NULL OR p_source_key = p_source)
    AND (
      p_overdue IS NULL
      OR (p_overdue = 'yes' AND (
        (p_next_action_at IS NOT NULL AND p_next_action_at < now())
        OR (p_first_response_due IS NOT NULL AND p_first_responded_at IS NULL AND p_first_response_due < now())
      ))
      OR (p_overdue = 'no' AND NOT (
        (p_next_action_at IS NOT NULL AND p_next_action_at < now())
        OR (p_first_response_due IS NOT NULL AND p_first_responded_at IS NULL AND p_first_response_due < now())
      ))
    )
    AND (
      p_parked IS NULL
      OR (p_parked = 'yes' AND p_last_disposition_key = 'postponed' AND p_last_revisit_at IS NOT NULL AND p_last_revisit_at > now())
      OR (p_parked = 'no' AND NOT (p_last_disposition_key = 'postponed' AND p_last_revisit_at IS NOT NULL AND p_last_revisit_at > now()))
    )
    AND (p_owner IS NULL OR p_owner_user_id = p_owner);
$$;
ALTER FUNCTION arth_book_filter_ok(text, text, text, uuid, text, timestamptz, timestamptz, timestamptz, text, timestamptz, uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION arth_book_filter_ok(text, text, text, uuid, text, timestamptz, timestamptz, timestamptz, text, timestamptz, uuid) TO arth_app;

DROP FUNCTION IF EXISTS arth_pipeline_lead_ids(boolean, text, integer);
DROP FUNCTION IF EXISTS arth_pipeline_counts(boolean);

CREATE OR REPLACE FUNCTION arth_pipeline_lead_ids(
  p_personal boolean,
  p_stage text,
  p_limit integer,
  p_source text,
  p_overdue text,
  p_parked text,
  p_owner uuid
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
  src text := NULLIF(btrim(COALESCE(p_source, '')), '');
  od text := NULLIF(btrim(COALESCE(p_overdue, '')), '');
  pk text := NULLIF(btrim(COALESCE(p_parked, '')), '');
  own uuid := p_owner;
BEGIN
  IF tid IS NULL OR uid IS NULL THEN
    RETURN;
  END IF;
  -- A personal seat cannot name another owner. That would be a wall bypass.
  IF p_personal AND own IS NOT NULL AND own <> uid THEN
    RETURN;
  END IF;
  IF p_personal THEN
    RETURN QUERY
    SELECT l.id
    FROM leads l
    WHERE l.tenant_id = tid
      AND (
        l.owner_user_id = uid
        OR l.handed_on_by = uid
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
      AND arth_book_filter_ok(
        src, od, pk, own,
        l.source_key, l.next_action_at, l.first_response_due, l.first_responded_at,
        l.last_disposition_key, l.last_revisit_at, l.owner_user_id
      )
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role IN ('mgr', 'salesmgr', 'svcmgr') AND bid IS NOT NULL THEN
    RETURN QUERY
    SELECT l.id FROM leads l
    WHERE l.tenant_id = tid AND l.branch_id = bid
      AND arth_dept_ok(l.department_key)
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
      AND arth_book_filter_ok(
        src, od, pk, own,
        l.source_key, l.next_action_at, l.first_response_due, l.first_responded_at,
        l.last_disposition_key, l.last_revisit_at, l.owner_user_id
      )
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role IN ('owner', 'adv', 'admin', 'ops', 'gm') THEN
    RETURN QUERY
    SELECT l.id FROM leads l
    WHERE l.tenant_id = tid
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
      AND arth_book_filter_ok(
        src, od, pk, own,
        l.source_key, l.next_action_at, l.first_response_due, l.first_responded_at,
        l.last_disposition_key, l.last_revisit_at, l.owner_user_id
      )
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role = 'lead' THEN
    RETURN QUERY
    SELECT l.id FROM leads l
    WHERE l.tenant_id = tid
      AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at)
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
      AND arth_book_filter_ok(
        src, od, pk, own,
        l.source_key, l.next_action_at, l.first_response_due, l.first_responded_at,
        l.last_disposition_key, l.last_revisit_at, l.owner_user_id
      )
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  END IF;
END;
$$;
ALTER FUNCTION arth_pipeline_lead_ids(boolean, text, integer, text, text, text, uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION arth_pipeline_lead_ids(boolean, text, integer, text, text, text, uuid) TO arth_app;

CREATE OR REPLACE FUNCTION arth_pipeline_lead_ids(
  p_personal boolean,
  p_stage text,
  p_limit integer
)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT arth_pipeline_lead_ids(p_personal, p_stage, p_limit, NULL::text, NULL::text, NULL::text, NULL::uuid);
$$;
ALTER FUNCTION arth_pipeline_lead_ids(boolean, text, integer) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION arth_pipeline_lead_ids(boolean, text, integer) TO arth_app;

CREATE OR REPLACE FUNCTION arth_pipeline_counts(
  p_personal boolean,
  p_source text,
  p_overdue text,
  p_parked text,
  p_owner uuid
)
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
  src text := NULLIF(btrim(COALESCE(p_source, '')), '');
  od text := NULLIF(btrim(COALESCE(p_overdue, '')), '');
  pk text := NULLIF(btrim(COALESCE(p_parked, '')), '');
  own uuid := p_owner;
BEGIN
  IF tid IS NULL OR uid IS NULL THEN
    RETURN;
  END IF;
  IF p_personal AND own IS NOT NULL AND own <> uid THEN
    RETURN;
  END IF;
  IF p_personal THEN
    RETURN QUERY
    SELECT l.stage_key, count(*)
    FROM leads l
    WHERE l.tenant_id = tid
      AND (
        l.owner_user_id = uid
        OR l.handed_on_by = uid
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
      AND arth_book_filter_ok(
        src, od, pk, own,
        l.source_key, l.next_action_at, l.first_response_due, l.first_responded_at,
        l.last_disposition_key, l.last_revisit_at, l.owner_user_id
      )
    GROUP BY l.stage_key;
  ELSIF role IN ('mgr', 'salesmgr', 'svcmgr') AND bid IS NOT NULL THEN
    RETURN QUERY
    SELECT l.stage_key, count(*)
    FROM leads l
    WHERE l.tenant_id = tid AND l.branch_id = bid AND arth_dept_ok(l.department_key)
      AND arth_book_filter_ok(
        src, od, pk, own,
        l.source_key, l.next_action_at, l.first_response_due, l.first_responded_at,
        l.last_disposition_key, l.last_revisit_at, l.owner_user_id
      )
    GROUP BY l.stage_key;
  ELSIF role IN ('owner', 'adv', 'admin', 'ops', 'gm') THEN
    RETURN QUERY
    SELECT l.stage_key, count(*)
    FROM leads l
    WHERE l.tenant_id = tid
      AND arth_book_filter_ok(
        src, od, pk, own,
        l.source_key, l.next_action_at, l.first_response_due, l.first_responded_at,
        l.last_disposition_key, l.last_revisit_at, l.owner_user_id
      )
    GROUP BY l.stage_key;
  ELSIF role = 'lead' THEN
    RETURN QUERY
    SELECT l.stage_key, count(*)
    FROM leads l
    WHERE l.tenant_id = tid
      AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at)
      AND arth_book_filter_ok(
        src, od, pk, own,
        l.source_key, l.next_action_at, l.first_response_due, l.first_responded_at,
        l.last_disposition_key, l.last_revisit_at, l.owner_user_id
      )
    GROUP BY l.stage_key;
  END IF;
END;
$$;
ALTER FUNCTION arth_pipeline_counts(boolean, text, text, text, uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION arth_pipeline_counts(boolean, text, text, text, uuid) TO arth_app;

CREATE OR REPLACE FUNCTION arth_pipeline_counts(p_personal boolean)
RETURNS TABLE (stage_key text, n bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM arth_pipeline_counts(p_personal, NULL::text, NULL::text, NULL::text, NULL::uuid);
$$;
ALTER FUNCTION arth_pipeline_counts(boolean) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION arth_pipeline_counts(boolean) TO arth_app;
