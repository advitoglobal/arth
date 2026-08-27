/**
 * Dedicated capacity dealer. Demo walk-throughs stay on Whitefield and Coastal.
 * Default book size is 20 lakh (2,000,000) enquiries. Override with ARTH_CAPACITY_N.
 */
import { spawnSync } from "node:child_process";

export const CAP_TENANT = "33333333-3333-3333-3333-333333333333";
export const CAP_BRANCH = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3";
export const CAP_TELE = "dddddddd-dddd-dddd-dddd-dddddddddd31";
export const CAP_TELE2 = "dddddddd-dddd-dddd-dddd-dddddddddd32";
export const CAP_DESK = "dddddddd-dddd-dddd-dddd-dddddddddd33";
export const CAP_PRIN = "dddddddd-dddd-dddd-dddd-dddddddddd34";
export const NEEDLE_LEAD = "ffffffff-ffff-ffff-ffff-fffffffff331";
export const NEEDLE_PHONE = "9111199911";
export const NEEDLE_NAME = "Capacity Needle";

const HASH =
  "scrypt$16384$8$1$617274682d64656d6f2d73616c743136$474428d5bf552d45f7dd656dbf19916864b165e9eb785987bb869edf09b0407a";

function psql(sql: string) {
  const r = spawnSync(
    "sudo",
    ["-u", "postgres", "psql", "-d", "arth", "-v", "ON_ERROR_STOP=1", "-q"],
    { input: sql, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "psql failed");
  }
  return (r.stdout ?? "").trim();
}

function countLeads() {
  const r = spawnSync(
    "sudo",
    [
      "-u",
      "postgres",
      "psql",
      "-d",
      "arth",
      "-t",
      "-A",
      "-c",
      `SELECT count(*) FROM leads WHERE tenant_id = '${CAP_TENANT}'::uuid`,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "count failed");
  }
  return Number((r.stdout ?? "").trim());
}

function ensureSkeleton() {
  psql(`
INSERT INTO tenants (id, name, plan_key, status) VALUES
  ('${CAP_TENANT}', 'Capacity Motors', 'professional', 'live')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO brands (id, tenant_id, name) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '${CAP_TENANT}', 'Maruti Suzuki')
ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (id, tenant_id, brand_id, name, timezone) VALUES
  ('${CAP_BRANCH}', '${CAP_TENANT}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Capacity Yard', 'Asia/Kolkata')
ON CONFLICT (id) DO NOTHING;

INSERT INTO positions (id, tenant_id, branch_id, title, reports_to) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc34', '${CAP_TENANT}', NULL, 'Dealer principal', NULL),
  ('cccccccc-cccc-cccc-cccc-cccccccccc33', '${CAP_TENANT}', '${CAP_BRANCH}', 'Digital desk manager', 'cccccccc-cccc-cccc-cccc-cccccccccc34'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc31', '${CAP_TENANT}', '${CAP_BRANCH}', 'Telecaller', 'cccccccc-cccc-cccc-cccc-cccccccccc33'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc32', '${CAP_TENANT}', '${CAP_BRANCH}', 'Telecaller', 'cccccccc-cccc-cccc-cccc-cccccccccc33')
ON CONFLICT (id) DO NOTHING;

INSERT INTO working_hours (tenant_id, branch_id, day_of_week, opens_at, closes_at)
SELECT '${CAP_TENANT}'::uuid, '${CAP_BRANCH}'::uuid, d,
  CASE WHEN d = 0 THEN NULL ELSE TIME '09:30' END,
  CASE WHEN d = 0 THEN NULL ELSE TIME '18:30' END
FROM generate_series(0, 6) AS d
ON CONFLICT (branch_id, day_of_week) DO NOTHING;

INSERT INTO config_stages (tenant_id, key, label, sort_order, is_terminal)
SELECT '${CAP_TENANT}', key, label, sort_order, is_terminal
FROM config_stages WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (tenant_id, key) DO NOTHING;

INSERT INTO config_lost_reasons (tenant_id, key, label, requires_fact)
SELECT '${CAP_TENANT}', key, label, requires_fact
FROM config_lost_reasons WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (tenant_id, key) DO NOTHING;

INSERT INTO config_dispositions (tenant_id, key, label, connected, requires_revisit, requires_lost_reason, sort_order)
SELECT '${CAP_TENANT}', key, label, connected, requires_revisit, requires_lost_reason, sort_order
FROM config_dispositions WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (tenant_id, key) DO NOTHING;

INSERT INTO config_thresholds (tenant_id, key, value_int)
SELECT '${CAP_TENANT}', key, value_int
FROM config_thresholds WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
ON CONFLICT (tenant_id, key) DO NOTHING;

INSERT INTO users (id, tenant_id, position_id, full_name, phone, role_key, workspace_key, username, password_hash) VALUES
  ('${CAP_TELE}', '${CAP_TENANT}', 'cccccccc-cccc-cccc-cccc-cccccccccc31', 'C. Patel', '9845090001', 'tele', 'dayb', 'captele', '${HASH}'),
  ('${CAP_TELE2}', '${CAP_TENANT}', 'cccccccc-cccc-cccc-cccc-cccccccccc32', 'R. Sen', '9845090002', 'tele', 'dayb', 'captele2', '${HASH}'),
  ('${CAP_DESK}', '${CAP_TENANT}', 'cccccccc-cccc-cccc-cccc-cccccccccc33', 'M. Desai', '9845090003', 'mgr', 'desk', 'capdesk', '${HASH}'),
  ('${CAP_PRIN}', '${CAP_TENANT}', 'cccccccc-cccc-cccc-cccc-cccccccccc34', 'K. Mehta', '9845090004', 'owner', 'prin', 'capprin', '${HASH}'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd35', '${CAP_TENANT}', 'cccccccc-cccc-cccc-cccc-cccccccccc34', 'Advito support on this dealer', '0000000033', 'ops', 'desk', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role_key = EXCLUDED.role_key;

INSERT INTO customers (id, tenant_id, full_name, phone) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeee331', '${CAP_TENANT}', '${NEEDLE_NAME}', '${NEEDLE_PHONE}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO leads (
  id, tenant_id, branch_id, customer_id, source_key, source_detail, model_interest, variant_interest,
  stage_key, owner_user_id, assigned_at, difficulty_band, difficulty_locked_at,
  expected_value_paise, first_response_due, first_responded_at, next_action_at, created_at
) VALUES (
  '${NEEDLE_LEAD}', '${CAP_TENANT}', '${CAP_BRANCH}',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeee331',
  'google', 'Capacity needle', 'Brezza', 'Zxi',
  'contacted', '${CAP_TELE}', now() - interval '2 days', 'warm', now() - interval '2 days',
  880000, now() - interval '2 days', now() - interval '2 days', now() + interval '3 hours', now() - interval '400 days'
)
ON CONFLICT (id) DO NOTHING;
`);
}

function insertChunk(from: number, to: number) {
  console.log(`capacity insert ${from}..${to}`);
  psql(`
SET synchronous_commit = off;
INSERT INTO customers (tenant_id, full_name, phone)
SELECT
  '${CAP_TENANT}'::uuid,
  'Load ' || i,
  lpad(i::text, 10, '0')
FROM generate_series(${from}, ${to}) AS i
ON CONFLICT (tenant_id, phone) DO NOTHING;

INSERT INTO leads (
  tenant_id, branch_id, customer_id, source_key, source_detail, model_interest, variant_interest,
  stage_key, owner_user_id, assigned_at, difficulty_band, difficulty_locked_at,
  expected_value_paise, first_response_due, first_responded_at, next_action_at, created_at
)
SELECT
  '${CAP_TENANT}'::uuid,
  '${CAP_BRANCH}'::uuid,
  c.id,
  (ARRAY['google','meta','walk_in','inbound_call'])[1 + ((i - 1) % 4)],
  'Capacity dump',
  (ARRAY['Brezza','Grand Vitara','Fronx','Dzire','Swift'])[1 + ((i - 1) % 5)],
  (ARRAY['Zxi','Alpha','Delta','Vxi','Lxi'])[1 + ((i - 1) % 5)],
  (ARRAY['new','assigned','contacted','qualified','test_drive','quotation','negotiation','booked'])[1 + ((i - 1) % 8)],
  CASE
    WHEN i % 20 = 0 THEN NULL
    WHEN i % 20 = 1 THEN '${CAP_TELE2}'::uuid
    ELSE '${CAP_TELE}'::uuid
  END,
  now() - ((i % 200) || ' days')::interval,
  (ARRAY['hot','warm','cold','very_cold'])[1 + ((i - 1) % 4)],
  now() - ((i % 200) || ' days')::interval,
  (500000 + (i % 900000))::bigint,
  CASE WHEN i % 20 = 0 THEN now() + interval '2 days' ELSE now() - ((i % 30) || ' days')::interval END,
  CASE WHEN i % 20 = 0 THEN NULL ELSE now() - ((i % 30) || ' days')::interval END,
  CASE
    WHEN i % 10000 = 0 THEN now() - ((1 + (i % 6)) || ' hours')::interval
    WHEN i % 20 = 0 THEN now() + ((20 + (i % 200)) || ' days')::interval
    ELSE now() + ((10 + (i % 380)) || ' days')::interval
  END,
  now() - ((i % 400) || ' days')::interval
FROM generate_series(${from}, ${to}) AS i
JOIN customers c
  ON c.tenant_id = '${CAP_TENANT}'::uuid
 AND c.phone = lpad(i::text, 10, '0')
WHERE NOT EXISTS (
  SELECT 1 FROM leads l
  WHERE l.tenant_id = '${CAP_TENANT}'::uuid AND l.customer_id = c.id
);
`);
}

export async function ensureCapacityBook(target: number) {
  ensureSkeleton();
  const have = countLeads();
  if (have >= target) {
    console.log(`capacity book already ${have} (target ${target})`);
    return have;
  }
  psql(`
DROP INDEX IF EXISTS customers_phone_trgm_idx;
DROP INDEX IF EXISTS customers_name_trgm_idx;
DROP INDEX IF EXISTS leads_model_trgm_idx;
DROP INDEX IF EXISTS leads_variant_trgm_idx;
  `);
  const start = Math.max(1, have);
  const chunk = 100_000;
  for (let from = start; from <= target; from += chunk) {
    const to = Math.min(target, from + chunk - 1);
    insertChunk(from, to);
  }
  psql(`
CREATE INDEX IF NOT EXISTS customers_phone_trgm_idx ON customers USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS customers_name_trgm_idx ON customers USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_model_trgm_idx ON leads USING gin (model_interest gin_trgm_ops);
CREATE INDEX IF NOT EXISTS leads_variant_trgm_idx ON leads USING gin (variant_interest gin_trgm_ops);
ANALYZE customers;
ANALYZE leads;
  `);
  const n = countLeads();
  console.log(`capacity book now ${n}`);
  return n;
}

async function main() {
  const target = Number(process.env.ARTH_CAPACITY_N ?? 2_000_000);
  const n = await ensureCapacityBook(target);
  if (n < target) {
    throw new Error(`capacity load stopped at ${n}, wanted ${target}`);
  }
  console.log("CAPACITY_LOAD_OK", n);
}

if (process.argv[1]?.includes("load-capacity")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
