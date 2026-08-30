/**
 * Connected under 20 seconds scores nothing. A scoring connect writes points.
 */
import postgres from "postgres";
import { recordDisposition } from "../src/services/telecalling";
import { markDial } from "../src/services/conversion";
import type { Tx } from "../src/db/with-tenant";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const TENANT = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const RAMESH = "ffffffff-ffff-ffff-ffff-fffffffffff1";

async function main() {
  await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${TENANT}, true)`;
    await tx`SELECT set_config('app.user_id', ${IYER}, true)`;

    const short = await recordDisposition(tx as unknown as Tx, {
      leadId: RAMESH,
      userId: IYER,
      dispositionKey: "connected_callback",
      note: "Hung up. Prove 20 second floor.",
      callSeconds: 10,
      revisitAt: "2026-09-03",
    });
    if (short.points !== 0) {
      throw new Error(`10 second connect must score 0, got ${short.points}`);
    }

    await markDial(tx as unknown as Tx, RAMESH, IYER);
    const long = await recordDisposition(tx as unknown as Tx, {
      leadId: RAMESH,
      userId: IYER,
      dispositionKey: "connected_callback",
      note: "Spoke about Grand Vitara Zeta quotation.",
      callSeconds: 25,
      revisitAt: "2026-09-03",
    });
    if (!long.points || long.points <= 0) {
      throw new Error("25 second connect must score points");
    }

    const [shortRow] = await tx<{ points: number }[]>`
      SELECT (payload->>'points')::int AS points
      FROM lead_events
      WHERE lead_id = ${RAMESH}::uuid
        AND note = 'Hung up. Prove 20 second floor.'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (shortRow?.points !== 0) {
      throw new Error("Ledger must store zero points for the short call");
    }
  });

  console.log("POINTS_OK 20 second floor holds; scoring connect writes points");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
