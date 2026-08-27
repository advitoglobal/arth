/**
 * New enquiries stay in a shared book until a telecaller reaches the customer.
 * After-hours delay is charged to the branch. Clock waits for Monday open.
 */
import postgres from "postgres";
import { armUnownedClocks } from "../src/services/assignment";
import { listQueue, recordDisposition } from "../src/services/telecalling";
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
    await tx`
      UPDATE leads SET
        owner_user_id = NULL,
        assigned_at = NULL,
        first_responded_at = NULL,
        first_response_due = NULL,
        next_action_at = NULL,
        stage_key = 'new',
        lost_reason_key = NULL
      WHERE id = ${ANITA}::uuid
    `;
    await armUnownedClocks(tx as unknown as Tx);

    const [lead] = await tx<{
      owner_user_id: string | null;
      first_response_due: Date;
      difficulty_band: string;
    }[]>`
      SELECT owner_user_id::text, first_response_due, difficulty_band
      FROM leads WHERE id = ${ANITA}::uuid
    `;
    if (!lead) throw new Error("Anita Desai enquiry missing. Apply 0003.");
    if (lead.owner_user_id) {
      throw new Error(`Anita must stay unowned until a connect, got ${lead.owner_user_id}`);
    }
    if (lead.first_response_due.toISOString() !== "2026-08-24T04:30:00.000Z") {
      throw new Error(`Clock must start Monday 10:00 IST, got ${lead.first_response_due.toISOString()}`);
    }
    if (lead.difficulty_band !== "warm") {
      throw new Error("Google source freezes as warm when the clock is armed");
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

    const iyerQ = await listQueue(tx as unknown as Tx, IYER);
    const nairQ = await listQueue(tx as unknown as Tx, NAIR);
    if (!iyerQ.some((r) => r.id === ANITA)) {
      throw new Error("Anita must be on Iyer Today while unowned");
    }
    if (!nairQ.some((r) => r.id === ANITA)) {
      throw new Error("Anita must be on Nair Today while unowned");
    }

    const reached = await recordDisposition(tx as unknown as Tx, {
      leadId: ANITA,
      userId: IYER,
      dispositionKey: "connected_callback",
      note: "Reached Anita. Wants the Brezza Lxi brochure.",
      callSeconds: 25,
      revisitAt: "2026-09-03",
    });
    if (!reached.points || reached.points <= 0) {
      throw new Error("A 25 second connect must score points");
    }

    const [after] = await tx<{ owner_user_id: string | null }[]>`
      SELECT owner_user_id::text FROM leads WHERE id = ${ANITA}::uuid
    `;
    if (after.owner_user_id !== IYER) {
      throw new Error(`Anita should belong to Iyer after reach, got ${after.owner_user_id}`);
    }

    const nairAfter = await listQueue(tx as unknown as Tx, NAIR);
    if (nairAfter.some((r) => r.id === ANITA)) {
      throw new Error("Anita must leave Nair Today after Iyer reached her");
    }

    let blocked = false;
    try {
      await recordDisposition(tx as unknown as Tx, {
        leadId: ANITA,
        userId: NAIR,
        dispositionKey: "busy",
        note: "Should not write.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("do not own")) throw err;
      blocked = true;
    }
    if (!blocked) throw new Error("Nair must not log on Anita after Iyer reached her");
  });

  console.log("ASSIGN_OK shared pool until connect; Anita -> A. Iyer; clock Monday 10:00 IST; delay on branch");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
