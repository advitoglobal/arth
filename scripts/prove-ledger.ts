/**
 * A lead past contacted must have events. Stage is a consequence of history.
 */
import postgres from "postgres";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const COASTAL = "22222222-2222-2222-2222-222222222222";
const SHAH = "dddddddd-dddd-dddd-dddd-ddddddddddd8";
const KAMATH = "dddddddd-dddd-dddd-dddd-dddddddddd10";

async function emptyBeyondContacted(tenantId: string) {
  return app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SELECT set_config('app.user_id', ${tenantId.startsWith("1111") ? SHAH : KAMATH}, true)`;
    return tx<{ customer: string; stage: string; n: string }[]>`
      SELECT c.full_name AS customer, l.stage_key AS stage, count(e.id)::text AS n
      FROM leads l
      JOIN customers c ON c.id = l.customer_id
      JOIN config_stages s ON s.tenant_id = l.tenant_id AND s.key = l.stage_key
      LEFT JOIN lead_events e ON e.lead_id = l.id
      WHERE s.sort_order > (
        SELECT sort_order FROM config_stages
        WHERE tenant_id = l.tenant_id AND key = 'contacted'
      )
      GROUP BY c.full_name, l.stage_key, s.sort_order
      HAVING count(e.id) = 0
    `;
  });
}

async function thinHistory(tenantId: string) {
  return app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SELECT set_config('app.user_id', ${tenantId.startsWith("1111") ? SHAH : KAMATH}, true)`;
    return tx<{ customer: string; stage: string; n: string; need: string }[]>`
      SELECT c.full_name AS customer, l.stage_key AS stage,
             count(e.id)::text AS n, (s.sort_order - 1)::text AS need
      FROM leads l
      JOIN customers c ON c.id = l.customer_id
      JOIN config_stages s ON s.tenant_id = l.tenant_id AND s.key = l.stage_key
      LEFT JOIN lead_events e ON e.lead_id = l.id
      WHERE s.sort_order > (
        SELECT sort_order FROM config_stages
        WHERE tenant_id = l.tenant_id AND key = 'contacted'
      )
      GROUP BY c.full_name, l.stage_key, s.sort_order
      HAVING count(e.id) < (s.sort_order - 1)
    `;
  });
}

async function main() {
  for (const tenant of [WHITEFIELD, COASTAL]) {
    const empty = await emptyBeyondContacted(tenant);
    if (empty.length > 0) {
      throw new Error(
        `Lead past contacted with zero events: ${empty.map((r) => `${r.customer} ${r.stage}`).join("; ")}`,
      );
    }
    const thin = await thinHistory(tenant);
    if (thin.length > 0) {
      throw new Error(
        `Lead past contacted with too few events: ${thin.map((r) => `${r.customer} ${r.stage} has ${r.n} need ${r.need}`).join("; ")}`,
      );
    }
  }
  console.log("LEDGER_OK no lead past contacted sits without the events that carry it there");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
