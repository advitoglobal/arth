-- Weekly loop artefacts. Coaching notes stay inside the department.
-- Sampled reviews are append-only. Audio is not on file until telephony is connected.

CREATE TABLE IF NOT EXISTS weekly_loop_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  week_start DATE NOT NULL,
  metric_key TEXT,
  current_value DOUBLE PRECISION,
  median_value DOUBLE PRECISION,
  cause_key TEXT,
  cause_text TEXT NOT NULL DEFAULT '',
  action_text TEXT NOT NULL DEFAULT '',
  one_thing_text TEXT NOT NULL DEFAULT '',
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  self_report TEXT,
  remeasure_text TEXT,
  incomplete BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, week_start)
);
ALTER TABLE weekly_loop_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_loop_notes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS weekly_loop_read ON weekly_loop_notes;
CREATE POLICY weekly_loop_read ON weekly_loop_notes
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
      OR NULLIF(current_setting('app.role_key', true), '') IN ('lead', 'mgr', 'gm', 'ops')
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
      OR NULLIF(current_setting('app.role_key', true), '') IN ('lead', 'mgr', 'gm', 'ops')
    )
  );

CREATE TABLE IF NOT EXISTS sampled_call_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  event_id BIGINT REFERENCES lead_events(id),
  reviewee_id UUID NOT NULL REFERENCES users(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  week_start DATE NOT NULL,
  scores JSONB NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  audio_line TEXT NOT NULL DEFAULT 'Audio is not on file until telephony is connected.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE sampled_call_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sampled_call_reviews FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sampled_review_read ON sampled_call_reviews;
CREATE POLICY sampled_review_read ON sampled_call_reviews
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      reviewee_id = NULLIF(current_setting('app.user_id', true), '')::uuid
      OR reviewer_id = NULLIF(current_setting('app.user_id', true), '')::uuid
      OR NULLIF(current_setting('app.role_key', true), '') IN ('lead', 'mgr', 'gm', 'ops')
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND reviewer_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND NULLIF(current_setting('app.role_key', true), '') IN ('lead', 'mgr', 'ops')
  );

GRANT SELECT, INSERT, UPDATE ON weekly_loop_notes TO arth_app;
GRANT SELECT, INSERT ON sampled_call_reviews TO arth_app;
REVOKE UPDATE, DELETE ON sampled_call_reviews FROM arth_app;
REVOKE DELETE ON weekly_loop_notes FROM arth_app;

CREATE TABLE IF NOT EXISTS config_review_criteria (
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, key)
);
ALTER TABLE config_review_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_review_criteria FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON config_review_criteria;
CREATE POLICY tenant_isolation ON config_review_criteria
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
GRANT SELECT ON config_review_criteria TO arth_app;

INSERT INTO config_review_criteria (tenant_id, key, label, sort_order)
SELECT t.id, c.key, c.label, c.sort
FROM tenants t
CROSS JOIN (VALUES
  ('opening', 'Opening', 1),
  ('discovery', 'Discovery', 2),
  ('listening', 'Listening', 3),
  ('next_step', 'Next step named', 4),
  ('outcome', 'Outcome recorded as it happened', 5),
  ('handover', 'Handover card', 6)
) AS c(key, label, sort)
ON CONFLICT DO NOTHING;
