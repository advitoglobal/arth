-- Closed junk leaves Today. Public tracking is token-only. Additive.

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
  role text := NULLIF(current_setting('app.role_key', true), '');
  dept text := CASE
    WHEN role = 'svctele' THEN 'service'
    WHEN role = 'instele' THEN 'insurance'
    ELSE 'sales'
  END;
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
    SELECT l.id,
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
      AND COALESCE(l.is_not_enquiry, false) = false
      AND (l.next_action_at IS NULL OR l.next_action_at < until_at)
    UNION ALL
    SELECT l.id,
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
      AND COALESCE(l.is_not_enquiry, false) = false
      AND l.branch_id = bid
      AND l.department_key = dept
      AND l.stage_key <> 'delivered'
      AND (l.next_action_at IS NULL OR l.next_action_at < until_at)
  ) q
  ORDER BY q.late_rank, q.next_action_at NULLS LAST
  LIMIT 200;
END;
$$;
ALTER FUNCTION arth_queue_lead_ids(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION arth_queue_lead_ids(uuid) TO arth_app;

CREATE OR REPLACE FUNCTION arth_track_by_token(p_token text)
RETURNS TABLE (
  customer_name text,
  model text,
  promised_on date,
  lane text,
  step_key text,
  status text,
  block_kind text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.full_name,
    l.model_interest,
    (
      SELECT p.promised_on FROM delivery_promises p
      WHERE p.lead_id = l.id
      ORDER BY p.id DESC
      LIMIT 1
    ) AS promised_on,
    s.lane,
    s.step_key,
    s.status,
    s.block_kind
  FROM leads l
  JOIN customers c ON c.id = l.customer_id
  LEFT JOIN delivery_steps s ON s.lead_id = l.id
  WHERE l.tracking_token = p_token
    AND l.stage_key IN ('booked', 'delivered')
    AND COALESCE(
      (SELECT MAX(x.completed_at) FROM delivery_steps x WHERE x.lead_id = l.id AND x.step_key = 'delivery'),
      now()
    ) > now() - interval '30 days';
END;
$$;
ALTER FUNCTION arth_track_by_token(text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION arth_track_by_token(text) TO arth_app;

GRANT SELECT ON oem_catalogue TO arth_app;
GRANT SELECT, INSERT ON auth_attempts TO arth_app;
