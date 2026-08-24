INSERT INTO positions (id, tenant_id, branch_id, title) VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Telecaller');

INSERT INTO users (id, tenant_id, position_id, full_name, phone, role_key, workspace_key) VALUES
  ('dddddddd-dddd-dddd-dddd-ddddddddddd3', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc3', 'K. Nair', '9845011112', 'tele', 'dayb');

INSERT INTO customers (id, tenant_id, full_name, phone) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6', '11111111-1111-1111-1111-111111111111', 'Anita Desai', '9876500006');

-- Arrived Sunday 21:40 IST. Clock must not start until Monday open.
INSERT INTO leads (
  id, tenant_id, branch_id, customer_id, source_key, source_detail, model_interest, variant_interest,
  stage_key, owner_user_id, expected_value_paise, created_at
) VALUES (
  'ffffffff-ffff-ffff-ffff-fffffffffff6',
  '11111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6',
  'google', 'Night form', 'Brezza', 'Lxi',
  'new', NULL, 700000,
  TIMESTAMPTZ '2026-08-23 21:40:00+05:30'
);
