-- Search must find names the telecaller handed on. Rec-by-id already could.
-- This does not widen another telecaller's book.

CREATE OR REPLACE FUNCTION arth_lead_book_visible(
  p_tenant uuid,
  p_branch uuid,
  p_owner uuid,
  p_responded timestamptz,
  p_handed uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    arth_lead_row_visible(p_tenant, p_branch, p_owner, p_responded)
    OR (
      p_handed IS NOT NULL
      AND p_handed = NULLIF(current_setting('app.user_id', true), '')::uuid
      AND NULLIF(current_setting('app.role_key', true), '') IN ('tele', 'svctele', 'instele')
    );
$$;
ALTER FUNCTION arth_lead_book_visible(uuid, uuid, uuid, timestamptz, uuid) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_lead_book_visible(uuid, uuid, uuid, timestamptz, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_lead_book_visible(uuid, uuid, uuid, timestamptz, uuid) TO arth_app;

CREATE OR REPLACE FUNCTION arth_search_lead_ids(
  p_phone text,
  p_name text,
  p_enquiry8 text,
  p_enquiry_tail text,
  p_source text,
  p_stage text,
  p_model text,
  p_overdue text,
  p_parked text,
  p_from date,
  p_to date,
  p_on text
)
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
BEGIN
  IF tid IS NULL THEN
    RETURN;
  END IF;

  IF p_phone IS NOT NULL AND p_name IS NULL AND p_enquiry8 IS NULL AND p_enquiry_tail IS NULL THEN
    RETURN QUERY
    SELECT l.id
    FROM customers c
    JOIN leads l ON l.customer_id = c.id AND l.tenant_id = c.tenant_id
    WHERE c.tenant_id = tid
      AND c.phone LIKE '%' || p_phone || '%'
      AND arth_lead_book_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at, l.handed_on_by)
      AND arth_dept_ok(l.department_key)
      AND (p_source IS NULL OR l.source_key = p_source)
      AND (p_stage IS NULL OR l.stage_key = p_stage)
      AND (
        p_model IS NULL
        OR l.model_interest ILIKE '%' || p_model || '%'
        OR l.variant_interest ILIKE '%' || p_model || '%'
      )
      AND (
        p_overdue IS NULL
        OR (p_overdue = 'yes' AND (
          (l.next_action_at IS NOT NULL AND l.next_action_at < now())
          OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
        ))
        OR (p_overdue = 'no' AND NOT (
          (l.next_action_at IS NOT NULL AND l.next_action_at < now())
          OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
        ))
      )
      AND (
        p_parked IS NULL
        OR (p_parked = 'yes' AND l.last_disposition_key = 'postponed' AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now())
        OR (p_parked = 'no' AND NOT (l.last_disposition_key = 'postponed' AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now()))
      )
      AND (p_from IS NULL OR (CASE WHEN p_on = 'due' THEN (timezone('Asia/Kolkata', l.next_action_at))::date ELSE (timezone('Asia/Kolkata', l.created_at))::date END) >= p_from)
      AND (p_to IS NULL OR (CASE WHEN p_on = 'due' THEN (timezone('Asia/Kolkata', l.next_action_at))::date ELSE (timezone('Asia/Kolkata', l.created_at))::date END) <= p_to)
    ORDER BY l.created_at DESC
    LIMIT 80;
    RETURN;
  END IF;

  IF p_enquiry8 IS NOT NULL AND p_phone IS NULL AND p_name IS NULL THEN
    RETURN QUERY
    SELECT l.id
    FROM leads l
    WHERE l.tenant_id = tid
      AND upper(right(replace(l.id::text, '-', ''), 8)) = p_enquiry8
      AND arth_lead_book_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at, l.handed_on_by)
      AND arth_dept_ok(l.department_key)
    ORDER BY l.created_at DESC
    LIMIT 80;
    RETURN;
  END IF;

  IF p_name IS NOT NULL AND p_phone IS NULL THEN
    RETURN QUERY
    SELECT q.id
    FROM (
      SELECT l.id, l.created_at
      FROM customers c
      JOIN leads l ON l.customer_id = c.id AND l.tenant_id = c.tenant_id
      WHERE c.tenant_id = tid
        AND c.full_name ILIKE '%' || p_name || '%'
        AND arth_lead_book_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at, l.handed_on_by)
        AND arth_dept_ok(l.department_key)
        AND (p_source IS NULL OR l.source_key = p_source)
        AND (p_stage IS NULL OR l.stage_key = p_stage)
      UNION ALL
      SELECT l.id, l.created_at
      FROM leads l
      WHERE l.tenant_id = tid
        AND l.model_interest ILIKE '%' || p_name || '%'
        AND arth_lead_book_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at, l.handed_on_by)
        AND arth_dept_ok(l.department_key)
        AND (p_source IS NULL OR l.source_key = p_source)
        AND (p_stage IS NULL OR l.stage_key = p_stage)
      UNION ALL
      SELECT l.id, l.created_at
      FROM leads l
      WHERE l.tenant_id = tid
        AND l.variant_interest ILIKE '%' || p_name || '%'
        AND arth_lead_book_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at, l.handed_on_by)
        AND arth_dept_ok(l.department_key)
        AND (p_source IS NULL OR l.source_key = p_source)
        AND (p_stage IS NULL OR l.stage_key = p_stage)
    ) q
    ORDER BY q.created_at DESC
    LIMIT 80;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT l.id
  FROM leads l
  JOIN customers c ON c.id = l.customer_id AND c.tenant_id = l.tenant_id
  WHERE l.tenant_id = tid
    AND arth_lead_book_visible(l.tenant_id, l.branch_id, l.owner_user_id, l.first_responded_at, l.handed_on_by)
    AND arth_dept_ok(l.department_key)
    AND (
      (p_phone IS NULL AND p_name IS NULL AND p_enquiry8 IS NULL AND p_enquiry_tail IS NULL)
      OR (p_phone IS NOT NULL AND c.phone LIKE '%' || p_phone || '%')
      OR (p_name IS NOT NULL AND (
        c.full_name ILIKE '%' || p_name || '%'
        OR l.model_interest ILIKE '%' || p_name || '%'
        OR l.variant_interest ILIKE '%' || p_name || '%'
      ))
      OR (p_enquiry8 IS NOT NULL AND upper(right(replace(l.id::text, '-', ''), 8)) = p_enquiry8)
      OR (p_enquiry_tail IS NOT NULL AND replace(l.id::text, '-', '') LIKE '%' || p_enquiry_tail)
    )
    AND (p_source IS NULL OR l.source_key = p_source)
    AND (p_stage IS NULL OR l.stage_key = p_stage)
    AND (
      p_model IS NULL
      OR l.model_interest ILIKE '%' || p_model || '%'
      OR l.variant_interest ILIKE '%' || p_model || '%'
    )
    AND (
      p_overdue IS NULL
      OR (p_overdue = 'yes' AND (
        (l.next_action_at IS NOT NULL AND l.next_action_at < now())
        OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
      ))
      OR (p_overdue = 'no' AND NOT (
        (l.next_action_at IS NOT NULL AND l.next_action_at < now())
        OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
      ))
    )
    AND (
      p_parked IS NULL
      OR (p_parked = 'yes' AND l.last_disposition_key = 'postponed' AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now())
      OR (p_parked = 'no' AND NOT (l.last_disposition_key = 'postponed' AND l.last_revisit_at IS NOT NULL AND l.last_revisit_at > now()))
    )
    AND (p_from IS NULL OR (CASE WHEN p_on = 'due' THEN (timezone('Asia/Kolkata', l.next_action_at))::date ELSE (timezone('Asia/Kolkata', l.created_at))::date END) >= p_from)
    AND (p_to IS NULL OR (CASE WHEN p_on = 'due' THEN (timezone('Asia/Kolkata', l.next_action_at))::date ELSE (timezone('Asia/Kolkata', l.created_at))::date END) <= p_to)
  ORDER BY l.created_at DESC
  LIMIT 80;
END;
$$;
ALTER FUNCTION arth_search_lead_ids(text, text, text, text, text, text, text, text, text, date, date, text) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION arth_search_lead_ids(text, text, text, text, text, text, text, text, text, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_search_lead_ids(text, text, text, text, text, text, text, text, text, date, date, text) TO arth_app;
