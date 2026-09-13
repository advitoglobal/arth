-- Behaviour score and ranking boards. Enquiry walls stay in force: a board
-- only contains seats on the signed-in dealer (and branch, for tele and desk).
-- Advito dealer ranks are wall aggregates, never mixed enquiry rows.

CREATE OR REPLACE FUNCTION arth_behaviour_score(
  p_points int,
  p_connects int,
  p_handoffs int,
  p_shorts int,
  p_late int,
  p_unowned int
)
RETURNS int
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(0,
    COALESCE(p_points, 0)
    + COALESCE(p_connects, 0) * 10
    + COALESCE(p_handoffs, 0) * 12
    - COALESCE(p_shorts, 0) * 6
    - COALESCE(p_late, 0) * 4
    - COALESCE(p_unowned, 0) * 2
  );
$$;

CREATE OR REPLACE FUNCTION arth_score_users(p_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  uid uuid := NULLIF(current_setting('app.user_id', true), '')::uuid;
  today date := (timezone('Asia/Kolkata', now()))::date;
  board jsonb := '[]'::jsonb;
BEGIN
  IF tid IS NULL OR uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  IF p_ids IS NULL OR cardinality(p_ids) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.rank, r.full_name), '[]'::jsonb)
  INTO board
  FROM (
    SELECT
      s.user_id,
      s.full_name,
      s.username,
      s.branch,
      s.role_key,
      s.owned,
      s.late,
      s.connects_today,
      s.points_today,
      s.handoffs_today,
      s.short_connects_today,
      s.unowned_bucket,
      arth_behaviour_score(
        s.points_today,
        s.connects_today,
        s.handoffs_today,
        s.short_connects_today,
        s.late,
        s.unowned_bucket
      ) AS score,
      rank() OVER (
        ORDER BY arth_behaviour_score(
          s.points_today,
          s.connects_today,
          s.handoffs_today,
          s.short_connects_today,
          s.late,
          s.unowned_bucket
        ) DESC,
        s.late ASC,
        s.full_name ASC
      ) AS rank,
      (s.user_id = uid) AS you
    FROM (
      SELECT
        u.id AS user_id,
        u.full_name,
        u.username,
        b.name AS branch,
        u.role_key,
        (
          SELECT count(*)::int FROM leads l
          WHERE l.tenant_id = tid AND l.owner_user_id = u.id
        ) AS owned,
        (
          SELECT count(*)::int FROM leads l
          WHERE l.tenant_id = tid AND l.owner_user_id = u.id
            AND (
              (l.next_action_at IS NOT NULL AND l.next_action_at < now())
              OR (
                l.first_response_due IS NOT NULL
                AND l.first_responded_at IS NULL
                AND l.first_response_due < now()
              )
            )
        ) AS late,
        (
          SELECT count(*)::int FROM lead_events e
          WHERE e.tenant_id = tid AND e.actor_id = u.id
            AND (timezone('Asia/Kolkata', e.created_at))::date = today
            AND coalesce(e.payload->>'scoring_connected', 'false') = 'true'
        ) AS connects_today,
        (
          SELECT coalesce(sum((e.payload->>'points')::int), 0)::int FROM lead_events e
          WHERE e.tenant_id = tid AND e.actor_id = u.id
            AND (timezone('Asia/Kolkata', e.created_at))::date = today
            AND e.payload->>'points' IS NOT NULL
        ) AS points_today,
        (
          SELECT count(*)::int FROM lead_events e
          WHERE e.tenant_id = tid AND e.actor_id = u.id
            AND (timezone('Asia/Kolkata', e.created_at))::date = today
            AND e.event_type = 'handoff'
        ) AS handoffs_today,
        (
          SELECT count(*)::int FROM lead_events e
          WHERE e.tenant_id = tid AND e.actor_id = u.id
            AND (timezone('Asia/Kolkata', e.created_at))::date = today
            AND e.event_type = 'disposition'
            AND e.call_seconds IS NOT NULL
            AND e.call_seconds > 0
            AND e.call_seconds < 20
            AND e.disposition_key IN ('connected_callback', 'postponed', 'lost')
        ) AS short_connects_today,
        CASE
          WHEN u.role_key = 'mgr' AND p.branch_id IS NOT NULL THEN (
            SELECT count(*)::int FROM leads l
            WHERE l.tenant_id = tid AND l.branch_id = p.branch_id
              AND l.owner_user_id IS NULL AND l.first_responded_at IS NULL
              AND l.lost_reason_key IS NULL
          )
          WHEN u.role_key IN ('owner', 'admin', 'adv') THEN (
            SELECT count(*)::int FROM leads l
            WHERE l.tenant_id = tid
              AND l.owner_user_id IS NULL AND l.first_responded_at IS NULL
              AND l.lost_reason_key IS NULL
          )
          ELSE 0
        END AS unowned_bucket
      FROM users u
      LEFT JOIN positions p ON p.id = u.position_id
      LEFT JOIN branches b ON b.id = p.branch_id
      WHERE u.tenant_id = tid
        AND u.is_active
        AND u.id = ANY(p_ids)
    ) s
  ) r;

  RETURN board;
END;
$$;

CREATE OR REPLACE FUNCTION arth_performance_ranks()
RETURNS jsonb
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
  pos uuid := NULLIF(current_setting('app.position_id', true), '')::uuid;
  branch_name text := NULL;
  peer_ids uuid[] := ARRAY[]::uuid[];
  board jsonb := '[]'::jsonb;
  you jsonb := NULL;
  managed jsonb := '[]'::jsonb;
  tele_ids uuid[] := ARRAY[]::uuid[];
  sales_ids uuid[] := ARRAY[]::uuid[];
  desk_ids uuid[] := ARRAY[]::uuid[];
  board_label text := 'this wall';
BEGIN
  IF tid IS NULL OR uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no session');
  END IF;

  IF role IS NULL OR bid IS NULL OR pos IS NULL THEN
    SELECT u.role_key, p.branch_id, u.position_id
      INTO role, bid, pos
    FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = uid AND u.tenant_id = tid AND u.is_active;
  END IF;
  IF role IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unknown seat');
  END IF;

  SELECT b.name INTO branch_name FROM branches b WHERE b.id = bid;

  IF role IN ('tele', 'svctele') THEN
    board_label := coalesce(branch_name, 'this branch') || ' telecallers';
    SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO peer_ids
    FROM users u
    JOIN positions p ON p.id = u.position_id
    WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'tele'
      AND p.branch_id = bid;
  ELSIF role = 'sales' THEN
    board_label := 'sales consultants at this dealer';
    SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO peer_ids
    FROM users u
    WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'sales';
  ELSIF role = 'lead' THEN
    board_label := 'team leaders at this dealer';
    SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO peer_ids
    FROM users u
    WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'lead';
  ELSIF role = 'mgr' THEN
    board_label := coalesce(branch_name, 'this branch') || ' digital desk';
    SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO peer_ids
    FROM users u
    JOIN positions p ON p.id = u.position_id
    WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'mgr'
      AND p.branch_id = bid;
  ELSIF role IN ('owner', 'admin', 'adv') THEN
    board_label := 'dealer principals at this dealer';
    SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO peer_ids
    FROM users u
    WHERE u.tenant_id = tid AND u.is_active AND u.role_key IN ('owner', 'admin');
  ELSE
    peer_ids := ARRAY[uid];
    board_label := 'this seat';
  END IF;

  IF peer_ids IS NULL OR cardinality(peer_ids) = 0 OR array_position(peer_ids, uid) IS NULL THEN
    peer_ids := coalesce(peer_ids, ARRAY[]::uuid[]) || uid;
  END IF;

  board := arth_score_users(peer_ids);
  SELECT value INTO you
  FROM jsonb_array_elements(board) AS t(value)
  WHERE (value->>'you')::boolean
  LIMIT 1;

  IF role IN ('lead', 'mgr', 'owner', 'admin', 'adv', 'ops') THEN
    IF role = 'lead' AND pos IS NOT NULL THEN
      SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO tele_ids
      FROM users u
      JOIN positions p ON p.id = u.position_id
      WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'tele'
        AND p.reports_to = pos;
    ELSIF role = 'mgr' AND bid IS NOT NULL THEN
      SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO tele_ids
      FROM users u
      JOIN positions p ON p.id = u.position_id
      WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'tele'
        AND p.branch_id = bid;
      SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO sales_ids
      FROM users u
      JOIN positions p ON p.id = u.position_id
      WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'sales'
        AND p.branch_id = bid;
    ELSE
      SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO tele_ids
      FROM users u
      WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'tele';
      SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO sales_ids
      FROM users u
      WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'sales';
      SELECT coalesce(array_agg(u.id), ARRAY[]::uuid[]) INTO desk_ids
      FROM users u
      WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'mgr';
    END IF;

    managed := '[]'::jsonb;
    IF cardinality(tele_ids) > 0 THEN
      managed := managed || jsonb_build_array(jsonb_build_object(
        'kind', 'tele',
        'label', CASE
          WHEN role IN ('lead', 'mgr') THEN coalesce(branch_name, 'this branch') || ' telecallers'
          ELSE 'telecallers at this dealer'
        END,
        'rows', arth_score_users(tele_ids)
      ));
    END IF;
    IF cardinality(sales_ids) > 0 THEN
      managed := managed || jsonb_build_array(jsonb_build_object(
        'kind', 'sales',
        'label', CASE
          WHEN role = 'mgr' THEN coalesce(branch_name, 'this branch') || ' sales'
          ELSE 'sales consultants at this dealer'
        END,
        'rows', arth_score_users(sales_ids)
      ));
    END IF;
    IF cardinality(desk_ids) > 0 THEN
      managed := managed || jsonb_build_array(jsonb_build_object(
        'kind', 'desk',
        'label', 'digital desks at this dealer',
        'rows', arth_score_users(desk_ids)
      ));
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'board_label', board_label,
    'you', you,
    'board', board,
    'managed', managed
  );
END;
$$;

-- Advito only. Aggregates per dealer wall. Does not mix enquiry rows.
-- Late is not counted here so a twenty-lakh book cannot stall this list.
CREATE OR REPLACE FUNCTION arth_dealer_wall_ranks()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := (timezone('Asia/Kolkata', now()))::date;
  out jsonb;
BEGIN
  IF NOT arth_platform_is_operator() THEN
    RAISE EXCEPTION 'Platform operators only';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.rank, r.name), '[]'::jsonb)
  INTO out
  FROM (
    SELECT
      s.id,
      s.name,
      s.status,
      s.teles,
      s.unowned,
      s.connects_today,
      arth_behaviour_score(0, s.connects_today, 0, 0, 0, s.unowned) AS score,
      rank() OVER (
        ORDER BY arth_behaviour_score(0, s.connects_today, 0, 0, 0, s.unowned) DESC,
          s.unowned ASC,
          s.name ASC
      ) AS rank
    FROM (
      SELECT
        t.id,
        t.name,
        t.status,
        (SELECT count(*)::int FROM users u
          WHERE u.tenant_id = t.id AND u.is_active AND u.role_key = 'tele') AS teles,
        (SELECT count(*)::int FROM leads l
          WHERE l.tenant_id = t.id
            AND l.owner_user_id IS NULL
            AND l.first_responded_at IS NULL
            AND l.lost_reason_key IS NULL) AS unowned,
        (SELECT count(*)::int FROM lead_events e
          WHERE e.tenant_id = t.id
            AND (timezone('Asia/Kolkata', e.created_at))::date = today
            AND coalesce(e.payload->>'scoring_connected', 'false') = 'true') AS connects_today
      FROM tenants t
    ) s
  ) r;

  RETURN out;
END;
$$;

ALTER FUNCTION arth_behaviour_score(int, int, int, int, int, int) OWNER TO CURRENT_USER;
ALTER FUNCTION arth_score_users(uuid[]) OWNER TO CURRENT_USER;
ALTER FUNCTION arth_performance_ranks() OWNER TO CURRENT_USER;
ALTER FUNCTION arth_dealer_wall_ranks() OWNER TO CURRENT_USER;

REVOKE ALL ON FUNCTION arth_behaviour_score(int, int, int, int, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_score_users(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_performance_ranks() FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_dealer_wall_ranks() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION arth_behaviour_score(int, int, int, int, int, int) TO arth_app;
GRANT EXECUTE ON FUNCTION arth_score_users(uuid[]) TO arth_app;
GRANT EXECUTE ON FUNCTION arth_performance_ranks() TO arth_app;
GRANT EXECUTE ON FUNCTION arth_dealer_wall_ranks() TO arth_app;
