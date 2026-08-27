-- Capacity: 20 lakh enquiries per dealer must stay indexed and bounded.
-- Visibility checks the lead row, not a second lookup by id.
-- last_disposition_* lets Search and Today filter parked without scanning the ledger.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS last_disposition_key TEXT,
  ADD COLUMN IF NOT EXISTS last_revisit_at TIMESTAMPTZ;

UPDATE leads l
SET
  last_disposition_key = e.disposition_key,
  last_revisit_at = e.revisit_at
FROM (
  SELECT DISTINCT ON (lead_id)
    lead_id,
    disposition_key,
    revisit_at
  FROM lead_events
  WHERE event_type = 'disposition'
  ORDER BY lead_id, created_at DESC
) e
WHERE e.lead_id = l.id
  AND l.last_disposition_key IS NULL;

CREATE OR REPLACE FUNCTION arth_stamp_last_disposition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.event_type = 'disposition' THEN
    UPDATE leads
    SET
      last_disposition_key = NEW.disposition_key,
      last_revisit_at = NEW.revisit_at
    WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_events_stamp_disposition ON lead_events;
CREATE TRIGGER lead_events_stamp_disposition
  AFTER INSERT ON lead_events
  FOR EACH ROW
  EXECUTE FUNCTION arth_stamp_last_disposition();

CREATE OR REPLACE FUNCTION arth_lead_row_visible(
  p_tenant uuid,
  p_branch uuid,
  p_owner uuid,
  p_responded timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  u_role text;
  u_tenant uuid;
  u_branch uuid;
  u_position uuid;
BEGIN
  BEGIN
    uid := NULLIF(current_setting('app.user_id', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  u_role := NULLIF(current_setting('app.role_key', true), '');
  IF u_role IS NOT NULL THEN
    BEGIN
      u_tenant := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
      u_branch := NULLIF(current_setting('app.branch_id', true), '')::uuid;
      u_position := NULLIF(current_setting('app.position_id', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
      u_tenant := NULL;
    END;
  END IF;

  IF u_role IS NULL OR u_tenant IS NULL THEN
    SELECT u.role_key, u.tenant_id, p.branch_id, u.position_id
      INTO u_role, u_tenant, u_branch, u_position
    FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = uid AND u.is_active;
  END IF;

  IF u_role IS NULL THEN
    RETURN false;
  END IF;
  IF p_tenant IS DISTINCT FROM u_tenant THEN
    RETURN false;
  END IF;

  IF u_role IN ('owner', 'adv', 'admin', 'ops') THEN
    RETURN true;
  END IF;

  IF u_role = 'mgr' THEN
    RETURN u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;

  IF u_role = 'lead' THEN
    IF p_owner = uid THEN
      RETURN true;
    END IF;
    IF u_branch IS NOT NULL AND p_branch = u_branch AND p_owner IS NULL AND p_responded IS NULL THEN
      RETURN true;
    END IF;
    RETURN EXISTS (
      SELECT 1
      FROM users ru
      JOIN positions rp ON rp.id = ru.position_id
      WHERE ru.id = p_owner AND rp.reports_to = u_position
    );
  END IF;

  IF u_role IN ('tele', 'svctele') THEN
    IF p_owner = uid THEN
      RETURN true;
    END IF;
    RETURN p_owner IS NULL AND p_responded IS NULL
      AND u_branch IS NOT NULL AND p_branch = u_branch;
  END IF;

  IF u_role = 'sales' THEN
    RETURN p_owner = uid;
  END IF;

  RETURN false;
END;
$$;

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
BEGIN
  SELECT tenant_id, branch_id, owner_user_id, first_responded_at
    INTO l_tenant, l_branch, l_owner, l_responded
  FROM leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  RETURN arth_lead_row_visible(l_tenant, l_branch, l_owner, l_responded);
END;
$$;

ALTER FUNCTION arth_lead_row_visible(uuid, uuid, uuid, timestamptz) OWNER TO postgres;
ALTER FUNCTION arth_lead_visible(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_lead_row_visible(uuid, uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION arth_lead_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_lead_row_visible(uuid, uuid, uuid, timestamptz) TO arth_app;
GRANT EXECUTE ON FUNCTION arth_lead_visible(uuid) TO arth_app;

DROP POLICY IF EXISTS tenant_isolation ON leads;
CREATE POLICY tenant_isolation ON leads
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND arth_lead_row_visible(tenant_id, branch_id, owner_user_id, first_responded_at)
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

CREATE INDEX IF NOT EXISTS leads_tenant_created_idx
  ON leads (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_tenant_owner_next_idx
  ON leads (tenant_id, owner_user_id, next_action_at);
CREATE INDEX IF NOT EXISTS leads_tenant_branch_stage_idx
  ON leads (tenant_id, branch_id, stage_key);
CREATE INDEX IF NOT EXISTS leads_tenant_stage_value_idx
  ON leads (tenant_id, stage_key, expected_value_paise DESC);
CREATE INDEX IF NOT EXISTS leads_customer_id_idx
  ON leads (customer_id);
CREATE INDEX IF NOT EXISTS leads_tenant_unowned_idx
  ON leads (tenant_id, branch_id, created_at DESC)
  WHERE owner_user_id IS NULL;
CREATE INDEX IF NOT EXISTS leads_tenant_next_open_idx
  ON leads (tenant_id, next_action_at)
  WHERE lost_reason_key IS NULL AND stage_key <> 'delivered';
CREATE INDEX IF NOT EXISTS leads_enquiry_tail_idx
  ON leads (tenant_id, (upper(right(replace(id::text, '-', ''), 8))));
CREATE INDEX IF NOT EXISTS leads_model_trgm_idx
  ON leads USING gin (model_interest gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_variant_trgm_idx
  ON leads USING gin (variant_interest gin_trgm_ops);

CREATE INDEX IF NOT EXISTS customers_phone_trgm_idx
  ON customers USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS customers_name_trgm_idx
  ON customers USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (user_id)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS users_tenant_role_idx
  ON users (tenant_id, role_key);
CREATE INDEX IF NOT EXISTS lead_events_lead_created_idx
  ON lead_events (lead_id, created_at DESC);
