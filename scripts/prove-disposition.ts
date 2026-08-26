/**
 * The panel must refuse to save with no outcome chosen.
 */
import postgres from "postgres";
import { recordDisposition } from "../src/services/telecalling";
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
    let failed = false;
    try {
      await recordDisposition(tx as unknown as Tx, {
        leadId: RAMESH,
        userId: IYER,
        dispositionKey: "",
        note: "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message !== "Select an outcome.") {
        throw new Error(`Wanted Select an outcome., got ${message}`);
      }
      failed = true;
    }
    if (!failed) {
      throw new Error("Empty outcome must not write a disposition");
    }

    const after = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM lead_events
      WHERE lead_id = ${RAMESH}::uuid AND disposition_key = 'connected_callback'
        AND note = ''
        AND created_at > now() - interval '5 seconds'
    `;
    if (Number(after[0]?.n) > 0) {
      throw new Error("A blank outcome wrote a connected_callback row");
    }
  });

  console.log("DISPOSITION_OK empty outcome is refused and writes nothing");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
