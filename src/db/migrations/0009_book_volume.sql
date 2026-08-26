-- Thirty-to-forty enquiries per Whitefield telecaller, with events that produce the stage.
-- Idempotent: skips if the volume book is already present.

INSERT INTO customers (id, tenant_id, full_name, phone)
SELECT
  ('00000000-0000-4000-8000-' || lpad(to_hex(20000 + i), 12, '0'))::uuid,
  '11111111-1111-1111-1111-111111111111',
  names.n,
  to_char(9880100000 + i, 'FM9999999999')
FROM generate_series(1, 61) AS i
CROSS JOIN LATERAL (
  SELECT (ARRAY[
    'Ananya Iyer','Rohit Kulkarni','Sana Qureshi','Dev Patel','Kavya Reddy',
    'Imran Sheikh','Nisha Varma','Arjun Nair','Pooja Deshpande','Hassan Ali',
    'Shreya Kamat','Vivek Rao','Leela Krishnan','Omar Farooq','Tanvi Joshi',
    'Karthik Menon','Ayesha Khan','Siddharth Rao','Meenakshi Pillai','Zubin Mistry',
    'Diya Sharma','Nikhil Bhat','Fatima Noor','Raghav Iyer','Ishita Bose',
    'Aditya Kulkarni','Sneha Patil','Yusuf Rahman','Gauri Kulkarni','Manoj Hegde',
    'Ritu Malhotra','Pranav Shah','Hema Sundaram','Kabir Ansari','Lata Gowda',
    'Sahil Kapoor','Anjali Nambiar','Rehan Qadri','Swathi Rao','Deepak Jain',
    'Nandini Das','Farhan Syed','Keerthi Murali','Ajay Bansal','Pallavi Ghosh',
    'Tariq Hussain','Bhavna Mehta','Suresh Pai','Ira Banerjee','Mohit Agarwal',
    'Chitra Venkat','Naveen Shetty','Amina Begum','Gopal Krishna','Rhea Dsouza',
    'Varun Saxena','Jyoti Kaur','Harish Babu','Simran Kaur','Ashok Pillai',
    'Neha Kulkarni'
  ])[i] AS n
) names
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = ('00000000-0000-4000-8000-' || lpad(to_hex(20000 + i), 12, '0'))::uuid
);

INSERT INTO leads (
  id, tenant_id, branch_id, customer_id, source_key, source_detail, model_interest, variant_interest,
  stage_key, owner_user_id, assigned_at, difficulty_band, difficulty_locked_at,
  expected_value_paise, first_response_due, first_responded_at, next_action_at, created_at
)
SELECT
  ('00000000-0000-4000-8000-' || lpad(to_hex(30000 + i), 12, '0'))::uuid,
  '11111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  ('00000000-0000-4000-8000-' || lpad(to_hex(20000 + i), 12, '0'))::uuid,
  (ARRAY['google','meta','walk_in','inbound_call'])[1 + ((i - 1) % 4)],
  (ARRAY['Search form','Lead form','Showroom','Missed call'])[1 + ((i - 1) % 4)],
  (ARRAY['Brezza','Grand Vitara','Fronx','Dzire','Swift'])[1 + ((i - 1) % 5)],
  (ARRAY['Zxi','Alpha','Delta','Vxi','Lxi'])[1 + ((i - 1) % 5)],
  (ARRAY['assigned','contacted','qualified','test_drive','quotation','negotiation','booked','contacted'])[1 + ((i - 1) % 8)],
  CASE WHEN i <= 30 THEN 'dddddddd-dddd-dddd-dddd-ddddddddddd1'::uuid
       ELSE 'dddddddd-dddd-dddd-dddd-ddddddddddd3'::uuid END,
  now() - ((i % 18) || ' days')::interval,
  (ARRAY['hot','warm','cold','very_cold'])[1 + ((i - 1) % 4)],
  now() - ((i % 18) || ' days')::interval,
  (700000 + (i * 11000))::bigint,
  now() - ((i % 18) || ' days')::interval + interval '30 minutes',
  CASE WHEN (ARRAY['assigned','contacted','qualified','test_drive','quotation','negotiation','booked','contacted'])[1 + ((i - 1) % 8)] = 'assigned'
    THEN NULL ELSE now() - ((i % 18) || ' days')::interval + interval '2 hours' END,
  CASE
    WHEN i % 5 = 0 THEN now() + ((1 + (i % 4)) || ' days')::interval
    WHEN i % 5 = 1 THEN now() - ((1 + (i % 6)) || ' hours')::interval
    ELSE now() + ((i % 8) || ' hours')::interval
  END,
  now() - ((i % 18) || ' days')::interval
FROM generate_series(1, 61) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM leads l WHERE l.id = ('00000000-0000-4000-8000-' || lpad(to_hex(30000 + i), 12, '0'))::uuid
);

-- Coastal volume so Pinto has a book that can empty.
INSERT INTO customers (id, tenant_id, full_name, phone)
SELECT
  ('00000000-0000-4000-8000-' || lpad(to_hex(21000 + i), 12, '0'))::uuid,
  '22222222-2222-2222-2222-222222222222',
  (ARRAY[
    'Rafiq Ahmed','Latha Shetty','Pradeep Pai','Asha Dsouza','Vinod Kamath',
    'Nasreen Banu','Girish Rao','Maya Fernandes','Sandeep Kini','Jaya Bhat',
    'Iqbal Shariff','Rekha Alva','Dinesh Suvarna','Shabnam Ali','Ramesh Bhandary',
    'Preeti Salian','Ajith Kumar','Sunita Bangera','Harish Kotian','Fathima Razak',
    'Nithin Poojary','Kavitha Rao','Ashraf Khan','Leena Pinto','Gautam Hegde',
    'Reshma Pai','Santhosh Naik','Anusha K','Javed Hussain','Beena Dsouza'
  ])[i],
  to_char(9880200000 + i, 'FM9999999999')
FROM generate_series(1, 30) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM customers c WHERE c.id = ('00000000-0000-4000-8000-' || lpad(to_hex(21000 + i), 12, '0'))::uuid
);

INSERT INTO leads (
  id, tenant_id, branch_id, customer_id, source_key, source_detail, model_interest, variant_interest,
  stage_key, owner_user_id, assigned_at, difficulty_band, difficulty_locked_at,
  expected_value_paise, first_response_due, first_responded_at, next_action_at, created_at
)
SELECT
  ('00000000-0000-4000-8000-' || lpad(to_hex(31000 + i), 12, '0'))::uuid,
  '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  ('00000000-0000-4000-8000-' || lpad(to_hex(21000 + i), 12, '0'))::uuid,
  (ARRAY['google','meta','walk_in','inbound_call'])[1 + ((i - 1) % 4)],
  'Coastal inbound',
  (ARRAY['Dzire','Brezza','Swift'])[1 + ((i - 1) % 3)],
  'Vxi',
  (ARRAY['assigned','contacted','qualified','test_drive','quotation'])[1 + ((i - 1) % 5)],
  'dddddddd-dddd-dddd-dddd-ddddddddddd2',
  now() - ((i % 12) || ' days')::interval,
  'cold',
  now() - ((i % 12) || ' days')::interval,
  640000,
  now() - ((i % 12) || ' days')::interval + interval '30 minutes',
  now() - ((i % 12) || ' days')::interval + interval '2 hours',
  CASE WHEN i % 3 = 0 THEN now() - interval '2 hours' ELSE now() + ((i % 6) || ' hours')::interval END,
  now() - ((i % 12) || ' days')::interval
FROM generate_series(1, 30) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM leads l WHERE l.id = ('00000000-0000-4000-8000-' || lpad(to_hex(31000 + i), 12, '0'))::uuid
);
