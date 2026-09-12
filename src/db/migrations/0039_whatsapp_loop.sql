-- WhatsApp loop: message reply clock, receipts as new rows, customer media on the record.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS message_reply_due TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS message_replied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_valid_until TIMESTAMPTZ;

INSERT INTO config_thresholds (tenant_id, key, value_int)
SELECT t.id, 'message_reply_minutes', 30
FROM tenants t
ON CONFLICT (tenant_id, key) DO NOTHING;

CREATE TABLE IF NOT EXISTS customer_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  kind TEXT NOT NULL CHECK (kind IN ('photo_car', 'rc', 'licence')),
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE customer_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_media FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON customer_media;
CREATE POLICY tenant_isolation ON customer_media
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (lead_id IS NULL OR arth_lead_visible(lead_id))
  )
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

GRANT SELECT, INSERT ON customer_media TO arth_app;
