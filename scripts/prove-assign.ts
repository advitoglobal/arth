/**
 * Option A: unowned Sunday-night enquiry is assigned; clock waits for Monday open.
 * Delay is charged to the branch, not the telecaller.
 */
import postgres from "postgres";
import { assignUnowned } from "../src/services/assignment";
import type { Tx } from "../src/db/with-tenant";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const TENANT = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const NAIR = "dddddddd-dddd-dddd-dddd-ddddddddddd3";
const ANITA = "ffffffff-ffff-ffff-ffff-fffffffffff6";

async function main() {
  await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${TENANT}, true)`;
    await tx`SELECT set_config('app.user_id', ${IYER}, true)`;
    await assignUnowned(tx as unknown as Tx, IYER);

    const [lead] = await tx<{
      owner_user_id: string;
      first_response_due: Date;
      difficulty_band: string;
    }[]>`
      SELECT owner_user_id::text, first_response_due, difficulty_band
      FROM leads WHERE id = ${ANITA}::uuid
    `;
    if (!lead) throw new Error("Anita Desai enquiry missing. Apply 0003.");
    if (lead.owner_user_id !== NAIR) {
      throw new Error(`Expected K. Nair (least load), got ${lead.owner_user_id}`);
    }
    if (lead.first_response_due.toISOString() !== "2026-08-24T04:30:00.000Z") {
      throw new Error(`Clock must start Monday 10:00 IST, got ${lead.first_response_due.toISOString()}`);
    }
    if (lead.difficulty_band !== "warm") {
      throw new Error("Google source freezes as warm at assignment");
    }

    const events = await tx<{ event_type: string; payload: unknown }[]>`
      SELECT event_type, payload
      FROM lead_events
      WHERE lead_id = ${ANITA}::uuid
      ORDER BY created_at
    `;
    const deferred = events.find((e) => e.event_type === "clock_deferred");
    if (!deferred) throw new Error("clock_deferred event missing");
    const payload =
      typeof deferred.payload === "string"
        ? (JSON.parse(deferred.payload) as { charged_to?: string })
        : (deferred.payload as { charged_to?: string } | null);
    if (payload?.charged_to !== "branch") {
      throw new Error("After-hours delay must be charged to the branch");
    }

    const [iyerBook] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM leads
      WHERE owner_user_id = ${IYER}::uuid AND lost_reason_key IS NULL
    `;
    const [nairBook] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM leads
      WHERE owner_user_id = ${NAIR}::uuid AND lost_reason_key IS NULL
    `;
    if (Number(iyerBook.n) === Number(nairBook.n)) {
      throw new Error("Two Whitefield telecallers must not share the same book");
    }
  });

  console.log("ASSIGN_OK Anita Desai -> K. Nair, clock Monday 10:00 IST, delay on branch");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
