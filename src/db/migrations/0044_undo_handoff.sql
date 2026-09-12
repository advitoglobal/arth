-- A telecaller who just handed on can still read the enquiry, but row-level
-- security will not let her UPDATE it: the owner is already the receiver.
-- Undo in the 1.5s window restores her as owner through a definer function.

CREATE OR REPLACE FUNCTION arth_restore_handoff(p_lead_id uuid, p_event_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := NULLIF(current_setting('app.user_id', true), '')::uuid;
  ev record;
  p jsonb;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  SELECT actor_id, event_type, payload
    INTO ev
  FROM lead_events
  WHERE id = p_event_id AND lead_id = p_lead_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF ev.actor_id IS DISTINCT FROM uid THEN
    RETURN false;
  END IF;
  IF ev.event_type NOT IN ('handoff', 'nurture') THEN
    RETURN false;
  END IF;
  p := ev.payload;
  UPDATE leads SET
    owner_user_id = NULLIF(p->>'previous_owner_user_id', '')::uuid,
    pool_open = COALESCE((p->>'previous_pool_open')::boolean, false),
    next_action_at = NULLIF(p->>'previous_next_action_at', '')::timestamptz,
    handed_on_at = NULLIF(p->>'previous_handed_on_at', '')::timestamptz,
    handed_on_by = NULLIF(p->>'previous_handed_on_by', '')::uuid,
    handover_mode = NULLIF(p->>'previous_handover_mode', ''),
    handover_contact_due = NULLIF(p->>'previous_handover_contact_due', '')::timestamptz
  WHERE id = p_lead_id;
  RETURN FOUND;
END;
$$;
ALTER FUNCTION arth_restore_handoff(uuid, bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION arth_restore_handoff(uuid, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION arth_restore_handoff(uuid, bigint) TO arth_app;
