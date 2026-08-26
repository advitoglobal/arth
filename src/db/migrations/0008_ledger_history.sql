-- Walk each seeded lead up the stage ladder with events. Stage is a consequence of history.
DO $$
DECLARE
  r RECORD;
  ladder text[] := ARRAY['assigned','contacted','qualified','test_drive','quotation','negotiation','booked','delivered'];
  idx int;
  i int;
  st text;
  t0 timestamptz;
  actor uuid;
  n int;
  labels text[] := ARRAY['Assigned','Contacted','Qualified','Test drive','Quotation','Negotiation','Booked','Delivered'];
BEGIN
  FOR r IN SELECT id, tenant_id, owner_user_id, stage_key, created_at FROM leads LOOP
    idx := array_position(ladder, r.stage_key);
    IF idx IS NULL THEN
      CONTINUE;
    END IF;
    SELECT count(*) INTO n FROM lead_events e WHERE e.lead_id = r.id;
    IF n >= idx THEN
      CONTINUE;
    END IF;
    actor := r.owner_user_id;
    FOR i IN 1..idx LOOP
      st := ladder[i];
      t0 := r.created_at + ((i - 1) * interval '4 hours');
      IF t0 > now() THEN
        t0 := now() - ((idx - i) * interval '2 hours');
      END IF;
      IF i = 1 THEN
        IF NOT EXISTS (
          SELECT 1 FROM lead_events e
          WHERE e.lead_id = r.id AND e.event_type IN ('assigned', 'created')
        ) THEN
          INSERT INTO lead_events (
            tenant_id, lead_id, event_type, actor_type, actor_id, note, created_at
          ) VALUES (
            r.tenant_id, r.id, 'assigned',
            CASE WHEN actor IS NULL THEN 'SYSTEM' ELSE 'USER' END,
            actor,
            'Seed ladder: assigned.',
            t0
          );
        END IF;
      ELSIF i = 2 THEN
        IF NOT EXISTS (
          SELECT 1 FROM lead_events e
          WHERE e.lead_id = r.id AND e.event_type = 'disposition'
        ) THEN
          INSERT INTO lead_events (
            tenant_id, lead_id, event_type, actor_type, actor_id,
            disposition_key, note, created_at
          ) VALUES (
            r.tenant_id, r.id, 'disposition',
            CASE WHEN actor IS NULL THEN 'SYSTEM' ELSE 'USER' END,
            actor,
            'connected_callback',
            'Seed ladder: first connected call.',
            t0
          );
        END IF;
      ELSE
        IF NOT EXISTS (
          SELECT 1 FROM lead_events e
          WHERE e.lead_id = r.id
            AND e.event_type = 'stage_change'
            AND e.note LIKE 'Seed ladder: moved to ' || labels[i] || '%'
        ) THEN
          INSERT INTO lead_events (
            tenant_id, lead_id, event_type, actor_type, actor_id, note, payload, created_at
          ) VALUES (
            r.tenant_id, r.id, 'stage_change',
            CASE WHEN actor IS NULL THEN 'SYSTEM' ELSE 'USER' END,
            actor,
            'Seed ladder: moved to ' || labels[i] || '.',
            jsonb_build_object('to', st, 'from', ladder[i - 1]),
            t0
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;
