-- Seed two tenants. Run as postgres (superuser bypasses RLS for insert).
-- Whitefield Motors and Coastal Cars.

INSERT INTO tenants (id, name, plan_key) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Whitefield Motors', 'professional'),
  ('22222222-2222-2222-2222-222222222222', 'Coastal Cars', 'professional');

INSERT INTO brands (id, tenant_id, name) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'Maruti Suzuki'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222222', 'Maruti Suzuki');

INSERT INTO branches (id, tenant_id, brand_id, name) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Whitefield'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Mangalore');

INSERT INTO positions (id, tenant_id, branch_id, title) VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Telecaller'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Telecaller');

INSERT INTO users (id, tenant_id, position_id, full_name, phone, role_key, workspace_key) VALUES
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'A. Iyer', '9845011111', 'tele', 'dayb'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'M. Pinto', '9845022222', 'tele', 'dayb');

INSERT INTO working_hours (tenant_id, branch_id, day_of_week, opens_at, closes_at)
SELECT t.tid, t.bid, d, CASE WHEN d = 0 THEN NULL ELSE TIME '09:30' END, CASE WHEN d = 0 THEN NULL ELSE TIME '18:30' END
FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid)
) AS t(tid, bid)
CROSS JOIN generate_series(0, 6) AS d;

INSERT INTO config_stages (tenant_id, key, label, sort_order, is_terminal)
SELECT tid, k, lab, s, term FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid)
) v(tid)
CROSS JOIN (VALUES
  ('new','New',1,false),
  ('assigned','Assigned',2,false),
  ('contacted','Contacted',3,false),
  ('qualified','Qualified',4,false),
  ('test_drive','Test drive',5,false),
  ('quotation','Quotation',6,false),
  ('negotiation','Negotiation',7,false),
  ('booked','Booked',8,false),
  ('delivered','Delivered',9,true)
) s(k, lab, s, term);

INSERT INTO config_lost_reasons (tenant_id, key, label, requires_fact)
SELECT tid, k, lab, fact FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid)
) v(tid)
CROSS JOIN (VALUES
  ('no_contact','No contact was ever made','attempt count'),
  ('price','Price','quoted amount'),
  ('finance','Finance rejected','financier name'),
  ('bought_elsewhere','Bought elsewhere','competitor if known'),
  ('not_in_market','Not in market','stated timeline'),
  ('product','Product mismatch','model asked for'),
  ('unknown','Reason not known','none')
) r(k, lab, fact);

INSERT INTO config_dispositions (tenant_id, key, label, connected, requires_revisit, requires_lost_reason, sort_order)
SELECT tid, k, lab, c, rv, lr, s FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid)
) v(tid)
CROSS JOIN (VALUES
  ('connected_callback','Connected, callback', true, false, false, 1),
  ('postponed','Postponed', true, true, false, 2),
  ('lost','Lost', true, false, true, 3),
  ('busy','Not connected, busy', false, false, false, 4),
  ('switched_off','Not connected, switched off', false, false, false, 5),
  ('no_answer','Not connected, no answer', false, false, false, 6)
) d(k, lab, c, rv, lr, s);

INSERT INTO config_thresholds (tenant_id, key, value_int)
SELECT tid, 'first_response_minutes', 30 FROM (VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid)
) v(tid);

INSERT INTO customers (id, tenant_id, full_name, phone) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '11111111-1111-1111-1111-111111111111', 'Ramesh Kumar', '9876500001'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', '11111111-1111-1111-1111-111111111111', 'S. Nayak', '9876500002'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', '11111111-1111-1111-1111-111111111111', 'Meera Joshi', '9876500003'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', '11111111-1111-1111-1111-111111111111', 'Lakshmi Rao', '9876500004'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', '22222222-2222-2222-2222-222222222222', 'Fazal Ahmed', '9876500099');

INSERT INTO leads (
  id, tenant_id, branch_id, customer_id, source_key, source_detail, model_interest, variant_interest,
  stage_key, owner_user_id, assigned_at, difficulty_band, difficulty_locked_at,
  expected_value_paise, first_response_due, next_action_at, created_at
) VALUES
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff1',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    'google', 'Grand Vitara Search', 'Grand Vitara', 'Zeta',
    'contacted', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', now() - interval '3 days', 'warm', now() - interval '3 days',
    1120000, now() - interval '61 hours', now() - interval '1 hour', now() - interval '3 days'
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff2',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
    'meta', 'Brezza lead form', 'Brezza', 'Zxi',
    'qualified', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', now() - interval '1 day', 'cold', now() - interval '1 day',
    840000, now() + interval '2 hours', now() + interval '2 hours', now() - interval '1 day'
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff3',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3',
    'walk_in', 'Indiranagar', 'Fronx', 'Alpha',
    'negotiation', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', now() - interval '2 days', 'hot', now() - interval '2 days',
    910000, now() + interval '4 hours', now() + interval '4 hours', now() - interval '2 days'
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff4',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4',
    'google', 'Fronx Search', 'Fronx', 'Sigma',
    'delivered', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', now() - interval '20 days', 'warm', now() - interval '20 days',
    810000, now() - interval '19 days', now() - interval '12 days', now() - interval '20 days'
  ),
  (
    'ffffffff-ffff-ffff-ffff-fffffffffff5',
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5',
    'meta', 'Coastal campaign', 'Dzire', 'Vxi',
    'assigned', 'dddddddd-dddd-dddd-dddd-ddddddddddd2', now() - interval '2 hours', 'cold', now() - interval '2 hours',
    620000, now() + interval '1 hour', now() + interval '1 hour', now() - interval '2 hours'
  );

INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, disposition_key, note)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'call_attempt', 'USER', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'no_answer', 'No contact for 61 hours'),
  ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff4', 'stage_change', 'USER', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', NULL, 'Delivered 02 Aug. Promise met'),
  ('22222222-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-fffffffffff5', 'assigned', 'SYSTEM', NULL, NULL, 'Round robin');

INSERT INTO notifications (tenant_id, user_id, title, why, href)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
   'Ramesh Kumar is past first response',
   'You own this enquiry and first response was due 61 hours ago.',
   '/w/rec?id=ffffffff-ffff-ffff-ffff-fffffffffff1');
