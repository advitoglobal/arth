-- Six-band Today queue. Intake kinds for the eight ways in. Additive.

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_intake_kind_chk;
ALTER TABLE leads ADD CONSTRAINT leads_intake_kind_chk
  CHECK (intake_kind IN (
    'tele_push', 'manager_upload', 'platform', 'inbound', 'walk_in', 'referral',
    'paid_form', 'inbound_call', 'missed_inbound', 'whatsapp_inbound',
    'website', 'filed'
  ));

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
  morning boolean := EXTRACT(HOUR FROM timezone('Asia/Kolkata', now())) < 13;
  n integer := 0;
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
        WHEN l.first_responded_at IS NULL
          AND l.first_response_due IS NOT NULL
          AND l.first_response_due > now()
          AND l.first_response_due <= now() + interval '10 minutes' THEN 1
        WHEN (l.first_responded_at IS NULL AND l.first_response_due IS NOT NULL AND l.first_response_due < now())
          OR (l.next_action_at IS NOT NULL AND l.next_action_at < now()) THEN 2
        WHEN l.owner_user_id IS NOT NULL
          AND l.next_action_at IS NOT NULL
          AND l.next_action_at >= now()
          AND l.next_action_at < until_at THEN 3
        WHEN l.owner_user_id IS NULL AND l.first_responded_at IS NULL THEN 4
        ELSE 5
      END AS band_rank,
      l.expected_value_paise,
      l.created_at,
      CASE
        WHEN morning THEN
          CASE l.difficulty_band
            WHEN 'very_cold' THEN 0
            WHEN 'cold' THEN 1
            WHEN 'warm' THEN 2
            WHEN 'hot' THEN 3
            ELSE 4
          END
        ELSE 0
      END AS hard_first,
      l.first_response_due
    FROM leads l
    WHERE l.tenant_id = tid
      AND l.stage_key <> 'delivered'
      AND l.lost_reason_key IS NULL
      AND COALESCE(l.is_not_enquiry, false) = false
      AND (l.next_action_at IS NULL OR l.next_action_at < until_at)
      AND (
        l.owner_user_id = p_owner
        OR (
          bid IS NOT NULL
          AND l.owner_user_id IS NULL
          AND l.first_responded_at IS NULL
          AND l.branch_id = bid
          AND l.department_key = dept
        )
      )
  ) q
  ORDER BY
    q.band_rank,
    q.expected_value_paise DESC NULLS LAST,
    q.created_at ASC,
    q.hard_first,
    q.first_response_due ASC NULLS LAST
  LIMIT 200;

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n > 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT l.id
  FROM leads l
  WHERE l.tenant_id = tid
    AND l.stage_key <> 'delivered'
    AND COALESCE(l.is_not_enquiry, false) = false
    AND l.lost_reason_key IS NOT NULL
    AND l.department_key = dept
    AND (
      l.owner_user_id = p_owner
      OR (
        bid IS NOT NULL
        AND l.owner_user_id IS NULL
        AND l.branch_id = bid
      )
    )
    AND COALESCE(
      (
        SELECT MAX(ev.created_at)
        FROM lead_events ev
        WHERE ev.lead_id = l.id
          AND (
            ev.disposition_key IN ('lost', 'not_interested', 'bought_elsewhere')
            OR ev.event_type = 'disposition'
          )
      ),
      l.created_at
    ) < now() - interval '90 days'
  ORDER BY l.expected_value_paise DESC NULLS LAST, l.created_at ASC
  LIMIT 80;
END;
$$;
ALTER FUNCTION arth_queue_lead_ids(uuid) OWNER TO CURRENT_USER;
GRANT EXECUTE ON FUNCTION arth_queue_lead_ids(uuid) TO arth_app;
