-- Role-scoped performance figures. Enquiry walls stay in force: the function
-- only returns the bucket for the signed-in seat (own book, team, branch, or dealer).

CREATE OR REPLACE FUNCTION arth_performance_snapshot()
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
  until_at timestamptz :=
    (((timezone('Asia/Kolkata', now()))::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata');
  today date := (timezone('Asia/Kolkata', now()))::date;
  book bigint := 0;
  owned bigint := 0;
  late bigint := 0;
  parked bigint := 0;
  due_today bigint := 0;
  unowned bigint := 0;
  today_outcomes bigint := 0;
  today_connects bigint := 0;
  today_short bigint := 0;
  today_points bigint := 0;
  today_handoffs bigint := 0;
  teles bigint := 0;
  stages jsonb := '{}'::jsonb;
  team jsonb := '[]'::jsonb;
  scope text := 'your book';
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

  IF role IN ('tele', 'svctele', 'sales') THEN
    scope := 'your book';
    SELECT
      count(*),
      count(*) FILTER (
        WHERE (next_action_at IS NOT NULL AND next_action_at < now())
           OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
      ),
      count(*) FILTER (
        WHERE last_disposition_key = 'postponed'
          AND last_revisit_at IS NOT NULL
          AND last_revisit_at > now()
      ),
      count(*) FILTER (
        WHERE lost_reason_key IS NULL
          AND stage_key <> 'delivered'
          AND (next_action_at IS NULL OR next_action_at < until_at)
          AND NOT (
            last_disposition_key = 'postponed'
            AND last_revisit_at IS NOT NULL
            AND last_revisit_at > now()
            AND next_action_at IS NOT NULL
            AND next_action_at > now()
          )
      )
    INTO owned, late, parked, due_today
    FROM leads
    WHERE tenant_id = tid AND owner_user_id = uid;

    book := owned;

    IF role IN ('tele', 'svctele') AND bid IS NOT NULL THEN
      SELECT count(*) INTO unowned
      FROM leads
      WHERE tenant_id = tid
        AND branch_id = bid
        AND owner_user_id IS NULL
        AND first_responded_at IS NULL
        AND lost_reason_key IS NULL;
    END IF;

    SELECT coalesce(jsonb_object_agg(stage_key, n), '{}'::jsonb) INTO stages
    FROM (
      SELECT stage_key, count(*) AS n
      FROM leads
      WHERE tenant_id = tid AND owner_user_id = uid
      GROUP BY stage_key
    ) s;

  ELSIF role = 'lead' THEN
    scope := 'your team';
    SELECT
      count(*),
      count(*) FILTER (
        WHERE (next_action_at IS NOT NULL AND next_action_at < now())
           OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
      ),
      count(*) FILTER (
        WHERE last_disposition_key = 'postponed'
          AND last_revisit_at IS NOT NULL
          AND last_revisit_at > now()
      )
    INTO book, late, parked
    FROM leads l
    WHERE l.tenant_id = tid
      AND (
        l.owner_user_id = uid
        OR l.owner_user_id IN (
          SELECT ru.id FROM users ru
          JOIN positions rp ON rp.id = ru.position_id
          WHERE rp.reports_to = pos
        )
        OR (l.owner_user_id IS NULL AND l.first_responded_at IS NULL AND l.branch_id = bid)
      );

    SELECT count(*) INTO owned FROM leads WHERE tenant_id = tid AND owner_user_id = uid;
    SELECT count(*) INTO unowned
    FROM leads
    WHERE tenant_id = tid AND bid IS NOT NULL AND branch_id = bid
      AND owner_user_id IS NULL AND first_responded_at IS NULL AND lost_reason_key IS NULL;
    SELECT count(*) INTO due_today
    FROM leads l
    WHERE l.tenant_id = tid
      AND l.lost_reason_key IS NULL AND l.stage_key <> 'delivered'
      AND (l.next_action_at IS NULL OR l.next_action_at < until_at)
      AND (
        l.owner_user_id = uid
        OR l.owner_user_id IN (
          SELECT ru.id FROM users ru
          JOIN positions rp ON rp.id = ru.position_id
          WHERE rp.reports_to = pos
        )
        OR (l.owner_user_id IS NULL AND l.first_responded_at IS NULL AND l.branch_id = bid)
      );

    SELECT coalesce(jsonb_object_agg(stage_key, n), '{}'::jsonb) INTO stages
    FROM (
      SELECT stage_key, count(*) AS n FROM leads l
      WHERE l.tenant_id = tid
        AND (
          l.owner_user_id = uid
          OR l.owner_user_id IN (
            SELECT ru.id FROM users ru
            JOIN positions rp ON rp.id = ru.position_id
            WHERE rp.reports_to = pos
          )
        )
      GROUP BY stage_key
    ) s;

    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO team
    FROM (
      SELECT
        u.full_name,
        u.username,
        (SELECT count(*) FROM leads l WHERE l.tenant_id = tid AND l.owner_user_id = u.id) AS owned,
        (SELECT count(*) FROM leads l WHERE l.tenant_id = tid AND l.owner_user_id = u.id
          AND (
            (l.next_action_at IS NOT NULL AND l.next_action_at < now())
            OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
          )) AS late,
        (SELECT count(*) FROM lead_events e
          WHERE e.tenant_id = tid AND e.actor_id = u.id
            AND (timezone('Asia/Kolkata', e.created_at))::date = today
            AND coalesce(e.payload->>'scoring_connected', 'false') = 'true') AS connects_today
      FROM users u
      JOIN positions p ON p.id = u.position_id
      WHERE u.tenant_id = tid AND u.is_active AND p.reports_to = pos AND u.role_key = 'tele'
      ORDER BY u.full_name
    ) t;

  ELSIF role = 'mgr' THEN
    scope := 'this branch';
    IF bid IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'no branch');
    END IF;
    SELECT
      count(*),
      count(*) FILTER (WHERE owner_user_id IS NULL),
      count(*) FILTER (
        WHERE (next_action_at IS NOT NULL AND next_action_at < now())
           OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
      ),
      count(*) FILTER (
        WHERE last_disposition_key = 'postponed'
          AND last_revisit_at IS NOT NULL
          AND last_revisit_at > now()
      ),
      count(*) FILTER (
        WHERE lost_reason_key IS NULL AND stage_key <> 'delivered'
          AND (next_action_at IS NULL OR next_action_at < until_at)
      )
    INTO book, unowned, late, parked, due_today
    FROM leads
    WHERE tenant_id = tid AND branch_id = bid;

    owned := book - unowned;
    SELECT count(*) INTO teles FROM users u
    JOIN positions p ON p.id = u.position_id
    WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'tele' AND p.branch_id = bid;

    SELECT coalesce(jsonb_object_agg(stage_key, n), '{}'::jsonb) INTO stages
    FROM (
      SELECT stage_key, count(*) AS n FROM leads
      WHERE tenant_id = tid AND branch_id = bid
      GROUP BY stage_key
    ) s;

    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO team
    FROM (
      SELECT
        u.full_name,
        u.username,
        (SELECT count(*) FROM leads l WHERE l.tenant_id = tid AND l.owner_user_id = u.id) AS owned,
        (SELECT count(*) FROM leads l WHERE l.tenant_id = tid AND l.owner_user_id = u.id
          AND (
            (l.next_action_at IS NOT NULL AND l.next_action_at < now())
            OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
          )) AS late,
        (SELECT count(*) FROM lead_events e
          WHERE e.tenant_id = tid AND e.actor_id = u.id
            AND (timezone('Asia/Kolkata', e.created_at))::date = today
            AND coalesce(e.payload->>'scoring_connected', 'false') = 'true') AS connects_today
      FROM users u
      JOIN positions p ON p.id = u.position_id
      WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'tele' AND p.branch_id = bid
      ORDER BY u.full_name
    ) t;

  ELSE
    scope := 'this dealer';
    SELECT
      count(*),
      count(*) FILTER (WHERE owner_user_id IS NULL),
      count(*) FILTER (
        WHERE (next_action_at IS NOT NULL AND next_action_at < now())
           OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
      ),
      count(*) FILTER (
        WHERE last_disposition_key = 'postponed'
          AND last_revisit_at IS NOT NULL
          AND last_revisit_at > now()
      ),
      count(*) FILTER (
        WHERE lost_reason_key IS NULL AND stage_key <> 'delivered'
          AND (next_action_at IS NULL OR next_action_at < until_at)
      )
    INTO book, unowned, late, parked, due_today
    FROM leads
    WHERE tenant_id = tid;

    owned := book - unowned;
    SELECT count(*) INTO teles FROM users
    WHERE tenant_id = tid AND is_active AND role_key = 'tele';

    SELECT coalesce(jsonb_object_agg(stage_key, n), '{}'::jsonb) INTO stages
    FROM (
      SELECT stage_key, count(*) AS n FROM leads WHERE tenant_id = tid GROUP BY stage_key
    ) s;

    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO team
    FROM (
      SELECT
        u.full_name,
        u.username,
        b.name AS branch,
        (SELECT count(*) FROM leads l WHERE l.tenant_id = tid AND l.owner_user_id = u.id) AS owned,
        (SELECT count(*) FROM leads l WHERE l.tenant_id = tid AND l.owner_user_id = u.id
          AND (
            (l.next_action_at IS NOT NULL AND l.next_action_at < now())
            OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
          )) AS late,
        (SELECT count(*) FROM lead_events e
          WHERE e.tenant_id = tid AND e.actor_id = u.id
            AND (timezone('Asia/Kolkata', e.created_at))::date = today
            AND coalesce(e.payload->>'scoring_connected', 'false') = 'true') AS connects_today
      FROM users u
      LEFT JOIN positions p ON p.id = u.position_id
      LEFT JOIN branches b ON b.id = p.branch_id
      WHERE u.tenant_id = tid AND u.is_active AND u.role_key = 'tele'
      ORDER BY u.full_name
    ) t;
  END IF;

  SELECT
    count(*) FILTER (WHERE e.event_type = 'disposition'),
    count(*) FILTER (WHERE coalesce(e.payload->>'scoring_connected', 'false') = 'true'),
    count(*) FILTER (
      WHERE e.event_type = 'disposition'
        AND e.disposition_key IN ('connected_callback', 'postponed', 'lost')
        AND coalesce(e.payload->>'scoring_connected', 'false') <> 'true'
        AND coalesce((e.payload->>'scoring_connected')::text, '') IS NOT NULL
        AND e.call_seconds IS NOT NULL
        AND e.call_seconds > 0
        AND e.call_seconds < 20
    ),
    coalesce(sum((e.payload->>'points')::int) FILTER (WHERE e.payload->>'points' IS NOT NULL), 0),
    count(*) FILTER (WHERE e.event_type = 'handoff')
  INTO today_outcomes, today_connects, today_short, today_points, today_handoffs
  FROM lead_events e
  WHERE e.tenant_id = tid
    AND (timezone('Asia/Kolkata', e.created_at))::date = today
    AND (
      role IN ('owner', 'adv', 'admin', 'ops', 'mgr', 'lead')
      OR e.actor_id = uid
    )
    AND (
      role <> 'mgr'
      OR EXISTS (
        SELECT 1 FROM leads l
        WHERE l.id = e.lead_id AND l.branch_id = bid
      )
      OR e.actor_id IN (
        SELECT u.id FROM users u
        JOIN positions p ON p.id = u.position_id
        WHERE u.tenant_id = tid AND p.branch_id = bid
      )
    );

  IF role IN ('tele', 'svctele', 'sales') THEN
    SELECT
      count(*) FILTER (WHERE e.event_type = 'disposition'),
      count(*) FILTER (WHERE coalesce(e.payload->>'scoring_connected', 'false') = 'true'),
      count(*) FILTER (
        WHERE e.event_type = 'disposition'
          AND e.call_seconds IS NOT NULL
          AND e.call_seconds > 0
          AND e.call_seconds < 20
          AND e.disposition_key IN ('connected_callback', 'postponed', 'lost')
      ),
      coalesce(sum((e.payload->>'points')::int) FILTER (WHERE e.payload->>'points' IS NOT NULL), 0),
      count(*) FILTER (WHERE e.event_type = 'handoff')
    INTO today_outcomes, today_connects, today_short, today_points, today_handoffs
    FROM lead_events e
    WHERE e.tenant_id = tid
      AND e.actor_id = uid
      AND (timezone('Asia/Kolkata', e.created_at))::date = today;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'role', role,
    'scope', scope,
    'book', book,
    'owned', owned,
    'late', late,
    'parked', parked,
    'due_today', due_today,
    'unowned', unowned,
    'teles', teles,
    'stages', stages,
    'team', team,
    'today_outcomes', today_outcomes,
    'today_connects', today_connects,
    'today_short_connects', today_short,
    'today_points', today_points,
    'today_handoffs', today_handoffs
  );
END;
$$;

ALTER FUNCTION arth_performance_snapshot() OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_performance_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_performance_snapshot() TO arth_app;
