INSERT INTO customers (id, tenant_id, full_name, phone) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7', '11111111-1111-1111-1111-111111111111', 'Priya Menon', '9876500007'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee8', '11111111-1111-1111-1111-111111111111', 'Vikram Shah', '9876500008'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9', '11111111-1111-1111-1111-111111111111', 'Farah Khan', '9876500009'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee10', '11111111-1111-1111-1111-111111111111', 'Joseph Abel', '9876500010');

INSERT INTO leads (
  id, tenant_id, branch_id, customer_id, source_key, source_detail, model_interest, variant_interest,
  stage_key, owner_user_id, assigned_at, difficulty_band, difficulty_locked_at,
  expected_value_paise, first_response_due, first_responded_at, next_action_at, created_at
) VALUES
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff7',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7',
    'walk_in', 'Whitefield showroom', 'Grand Vitara', 'Alpha',
    'test_drive', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', now() - interval '5 days', 'hot', now() - interval '5 days',
    1240000, now() - interval '5 days', now() - interval '5 days', now() + interval '6 hours', now() - interval '5 days'
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff8',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee8',
    'google', 'Quotation follow', 'Brezza', 'Zxi+',
    'quotation', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', now() - interval '8 days', 'warm', now() - interval '8 days',
    890000, now() - interval '8 days', now() - interval '8 days', now() + interval '1 day', now() - interval '8 days'
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff9',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee9',
    'meta', 'Booking form', 'Fronx', 'Delta',
    'booked', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', now() - interval '12 days', 'cold', now() - interval '12 days',
    760000, now() - interval '12 days', now() - interval '12 days', now() + interval '2 days', now() - interval '12 days'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffff10',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee10',
    'google', 'Night form weekday', 'Dzire', 'Zxi',
    'contacted', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', now() - interval '4 days', 'warm', now() - interval '4 days',
    640000, now() - interval '4 days', now() - interval '4 days', now() + interval '3 days', now() - interval '4 days'
  );

INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, disposition_key, revisit_at, note)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'ffffffff-ffff-ffff-ffff-ffffffffff10',
    'disposition',
    'USER',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'postponed',
    now() + interval '3 days',
    'Asked to call after travel. Parked until then.'
  );
