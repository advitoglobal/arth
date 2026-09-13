-- Four handover ways, assist credit, first-contact clock on the receiver.
-- Telecaller who handed on can still read the enquiry, not work it.

ALTER TABLE assignment_rules DROP CONSTRAINT IF EXISTS assignment_rules_mode_check;
ALTER TABLE assignment_rules ADD CONSTRAINT assignment_rules_mode_check
  CHECK (mode IN ('direct', 'pool', 'queue'));

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS handed_on_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handed_on_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS handover_mode TEXT,
  ADD COLUMN IF NOT EXISTS handover_contact_due TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handover_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handover_bounced_at TIMESTAMPTZ;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_handover_mode_chk;
ALTER TABLE leads ADD CONSTRAINT leads_handover_mode_chk
  CHECK (handover_mode IS NULL OR handover_mode IN ('direct', 'pool', 'queue', 'nurture'));

CREATE TABLE IF NOT EXISTS assist_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  reason_key TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE assist_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE assist_credits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON assist_credits;
CREATE POLICY tenant_isolation ON assist_credits
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT ON assist_credits TO arth_app;
REVOKE UPDATE, DELETE ON assist_credits FROM arth_app;

DROP POLICY IF EXISTS tele_handed_read ON leads;
CREATE POLICY tele_handed_read ON leads
  FOR SELECT
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND handed_on_by = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND NULLIF(current_setting('app.role_key', true), '') IN ('tele', 'svctele', 'instele')
  );

CREATE OR REPLACE FUNCTION arth_lead_visible(p_lead_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l_tenant uuid;
  l_branch uuid;
  l_owner uuid;
  l_responded timestamptz;
  l_handed uuid;
  uid uuid;
  u_role text;
BEGIN
  BEGIN
    uid := NULLIF(current_setting('app.user_id', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  u_role := NULLIF(current_setting('app.role_key', true), '');
  SELECT tenant_id, branch_id, owner_user_id, first_responded_at, handed_on_by
    INTO l_tenant, l_branch, l_owner, l_responded, l_handed
  FROM leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF arth_lead_row_visible(l_tenant, l_branch, l_owner, l_responded) THEN
    RETURN true;
  END IF;
  IF uid IS NULL OR l_handed IS DISTINCT FROM uid THEN
    RETURN false;
  END IF;
  IF u_role IS NULL THEN
    SELECT role_key INTO u_role FROM users WHERE id = uid AND is_active;
  END IF;
  RETURN u_role IN ('tele', 'svctele', 'instele');
END;
$$;
ALTER FUNCTION arth_lead_visible(uuid) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_lead_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_lead_visible(uuid) TO arth_app;

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
      AND NOT (
        l.handed_on_by = p_owner
        AND COALESCE(l.handover_mode, '') IN ('direct', 'pool', 'queue')
      )
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
    AND NOT (
      l.handed_on_by = p_owner
      AND COALESCE(l.handover_mode, '') IN ('direct', 'pool', 'queue')
    )
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
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role IN ('mgr', 'salesmgr', 'svcmgr') AND bid IS NOT NULL THEN
    RETURN QUERY
    SELECT l.id FROM leads l
    WHERE l.tenant_id = tid AND l.branch_id = bid
      AND arth_dept_ok(l.department_key)
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role IN ('owner', 'adv', 'admin', 'ops', 'gm') THEN
    RETURN QUERY
    SELECT l.id FROM leads l
    WHERE l.tenant_id = tid
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  ELSIF role = 'lead' THEN
    RETURN QUERY
    SELECT l.id FROM leads l
    WHERE l.tenant_id = tid
      AND arth_lead_row_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at)
      AND (p_stage IS NULL OR p_stage = '' OR l.stage_key = p_stage)
    ORDER BY l.expected_value_paise DESC
    LIMIT cap;
  END IF;
END;
$$;
ALTER FUNCTION arth_pipeline_lead_ids(boolean, text, integer) OWNER TO CURRENT_USER;
GRANT EXECUTE ON FUNCTION arth_pipeline_lead_ids(boolean, text, integer) TO arth_app;
