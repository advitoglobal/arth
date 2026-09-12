-- Add enquiry chips: intake note, decision facts, tenant-bound phone duplicates.
-- Duplicate check is intake-only. Search still uses the four walls.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS intake_said TEXT,
  ADD COLUMN IF NOT EXISTS who_else_decides TEXT,
  ADD COLUMN IF NOT EXISTS seen_vehicle BOOLEAN;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_buyer_type_chk;
ALTER TABLE leads ADD CONSTRAINT leads_buyer_type_chk
  CHECK (buyer_type IS NULL OR buyer_type IN (
    'first_time', 'additional', 'replacement', 'exchange', 'fleet'
  ));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_who_else_decides_chk;
ALTER TABLE leads ADD CONSTRAINT leads_who_else_decides_chk
  CHECK (who_else_decides IS NULL OR who_else_decides IN (
    'self', 'spouse', 'parent', 'partner'
  ));

CREATE OR REPLACE FUNCTION arth_phone_duplicates(p_phone text)
RETURNS TABLE (
  lead_id uuid,
  customer_name text,
  department_key text,
  stage_key text,
  model_interest text,
  owner_user_id uuid,
  cars text,
  event_count integer,
  filed_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  digits text := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
BEGIN
  IF tid IS NULL OR length(digits) < 6 THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT
    l.id,
    c.full_name,
    l.department_key,
    l.stage_key,
    l.model_interest,
    l.owner_user_id,
    (
      SELECT string_agg(DISTINCT v.model, ', ' ORDER BY v.model)
      FROM vehicles v
      WHERE v.customer_id = c.id AND v.tenant_id = tid
    ) AS cars,
    (SELECT count(*)::int FROM lead_events e WHERE e.lead_id = l.id) AS event_count,
    l.created_at
  FROM customers c
  JOIN leads l ON l.customer_id = c.id
  WHERE l.tenant_id = tid
    AND regexp_replace(c.phone, '[^0-9]', '', 'g') LIKE '%' || digits
  ORDER BY l.created_at DESC
  LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION arth_phone_duplicates(text) TO arth_app;
