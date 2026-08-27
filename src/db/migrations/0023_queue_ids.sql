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
    SELECT
      l.id,
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
      AND NOT (
        l.last_disposition_key = 'postponed'
        AND l.last_revisit_at IS NOT NULL
        AND l.last_revisit_at > now()
        AND l.next_action_at IS NOT NULL
        AND l.next_action_at > now()
      )
    UNION ALL
    SELECT
      l.id,
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
      AND l.stage_key <> 'delivered'
      AND (l.next_action_at IS NULL OR l.next_action_at < until_at)
      AND NOT (
        l.last_disposition_key = 'postponed'
        AND l.last_revisit_at IS NOT NULL
        AND l.last_revisit_at > now()
        AND l.next_action_at IS NOT NULL
        AND l.next_action_at > now()
      )
  ) q
  ORDER BY q.late_rank, q.next_action_at ASC NULLS LAST
  LIMIT 200;
END;
$$;

ALTER FUNCTION arth_queue_lead_ids(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_queue_lead_ids(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_queue_lead_ids(uuid) TO arth_app;
