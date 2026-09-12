/**
 * Dial checks, wrap-up skip, and connected facts.
 */
import postgres from "postgres";
import { dialPreflight } from "../src/services/conversion";
import { recordDisposition, skipWrapUp } from "../src/services/telecalling";
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
    const t = tx as unknown as Tx;

    const open = await dialPreflight(t, RAMESH, IYER);
    if (!open.ok) {
      throw new Error(`Ramesh must be dialable, got ${open.blocks.join("; ")}`);
    }
    if (!open.recordingNotice?.includes("recorded")) {
      throw new Error("Recording notice must travel with Dial.");
    }

    let skipFailed = false;
    try {
      await skipWrapUp(t, { leadId: RAMESH, userId: IYER, reason: "no" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("why the next name")) {
        throw new Error(`Wanted skip reason error, got ${message}`);
      }
      skipFailed = true;
    }
    if (!skipFailed) throw new Error("Wrap skip without a reason must refuse.");

    let meetingFailed = false;
    try {
      await recordDisposition(t, {
        leadId: RAMESH,
        userId: IYER,
        dispositionKey: "meeting_booked",
        note: "Saturday at the showroom.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("Meeting needs")) {
        throw new Error(`Wanted meeting fact error, got ${message}`);
      }
      meetingFailed = true;
    }
    if (!meetingFailed) throw new Error("Meeting booked without a slot must refuse.");
  });

  console.log("CALL_WRAP_OK dial notice, wrap skip, meeting fact");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
