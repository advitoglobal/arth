/**
 * Today is six published bands. Order is not a client sort.
 */
import postgres from "postgres";
import { classifyQueueBand } from "../src/domain/queue-bands";
import { listQueue } from "../src/services/telecalling";
import type { Tx } from "../src/db/with-tenant";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const TENANT = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const NOW = new Date("2026-09-12T04:30:00.000Z");

function expectBand(
  name: string,
  row: Parameters<typeof classifyQueueBand>[0],
  key: string,
) {
  const got = classifyQueueBand(row, NOW);
  if (got.key !== key) {
    throw new Error(`${name}: want ${key}, got ${got.key} (${got.reason})`);
  }
}

function clockChecks() {
  expectBand(
    "breaching",
    {
      owner_user_id: null,
      first_response_due: new Date(NOW.getTime() + 5 * 60_000).toISOString(),
      first_responded_at: null,
      next_action_at: null,
      lost_reason_key: null,
    },
    "breaching",
  );
  expectBand(
    "late first call",
    {
      owner_user_id: IYER,
      first_response_due: new Date(NOW.getTime() - 60 * 60_000).toISOString(),
      first_responded_at: null,
      next_action_at: null,
      lost_reason_key: null,
    },
    "late",
  );
  expectBand(
    "promised today",
    {
      owner_user_id: IYER,
      first_response_due: new Date(NOW.getTime() - 2 * 24 * 60 * 60_000).toISOString(),
      first_responded_at: new Date(NOW.getTime() - 24 * 60 * 60_000).toISOString(),
      next_action_at: new Date("2026-09-12T12:00:00.000Z").toISOString(),
      lost_reason_key: null,
    },
    "promised",
  );
  expectBand(
    "new in pool",
    {
      owner_user_id: null,
      first_response_due: new Date(NOW.getTime() + 2 * 60 * 60_000).toISOString(),
      first_responded_at: null,
      next_action_at: null,
      lost_reason_key: null,
    },
    "pool",
  );
  expectBand(
    "revival",
    {
      owner_user_id: IYER,
      first_response_due: null,
      first_responded_at: null,
      next_action_at: null,
      lost_reason_key: "bought_elsewhere",
    },
    "revival",
  );
}

async function main() {
  clockChecks();

  await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${TENANT}, true)`;
    await tx`SELECT set_config('app.user_id', ${IYER}, true)`;
    await tx`SELECT set_config('app.role_key', 'tele', true)`;
    const rows = await listQueue(tx as unknown as Tx, IYER);
    if (rows.length === 0) {
      throw new Error("Iyer queue is empty.");
    }
    let prev = 0;
    for (const row of rows) {
      const band = classifyQueueBand(row);
      if (row.queue_band !== band.key) {
        throw new Error("Queue row band must match the published classifier.");
      }
      if (!row.queue_reason) {
        throw new Error("Every Today row must name why it is here.");
      }
      if (band.rank < prev) {
        throw new Error(
          `Queue skipped a band. Saw rank ${band.rank} after ${prev} on ${row.customer_name}.`,
        );
      }
      prev = band.rank;
    }
    if (rows.some((r) => !r.intake_kind)) {
      throw new Error("Every enquiry on Today must carry an intake label.");
    }
  });

  console.log("QUEUE_BANDS_OK six published bands, no skip, intake on every row");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
