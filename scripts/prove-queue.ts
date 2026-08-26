/**
 * The queue is their day. It decrements when a call is logged.
 */
import postgres from "postgres";
import { listQueue, recordDisposition } from "../src/services/telecalling";
import type { Tx } from "../src/db/with-tenant";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const TENANT = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";

async function main() {
  await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${TENANT}, true)`;
    await tx`SELECT set_config('app.user_id', ${IYER}, true)`;
    const before = await listQueue(tx as unknown as Tx, IYER);
    if (before.length === 0) {
      throw new Error("Iyer queue is empty. Cannot prove decrement.");
    }
    const target = before.find((r) => r.stage_key !== "delivered" && !r.lost_reason_key);
    if (!target) {
      throw new Error("No callable enquiry on Iyer's queue");
    }
    await recordDisposition(tx as unknown as Tx, {
      leadId: target.id,
      userId: IYER,
      dispositionKey: "busy",
      note: "Prove queue decrement.",
    });
    const after = await listQueue(tx as unknown as Tx, IYER);
    if (after.length !== before.length - 1) {
      throw new Error(
        `Queue must fall by one. Before ${before.length}, after ${after.length}`,
      );
    }
    if (after.some((r) => r.id === target.id)) {
      throw new Error("Logged enquiry is still on Today");
    }
  });

  console.log("QUEUE_OK logging a disposition removes that enquiry from Today");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
