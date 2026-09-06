/**
 * Promise ledger is append-only. External blocks counted. No date without a reason.
 */
import { withTenant } from "../src/db/with-tenant";
import { writePromise, moveDeliveryStep, currentPromise, promiseAccuracy } from "../src/services/delivery";
import { createOwnedEnquiry } from "../src/services/assignment";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";

async function main() {
  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Promise Proof",
      phone: `7${String(Date.now()).slice(-9)}`,
      modelInterest: "Fronx",
      variantInterest: "Delta",
      sourceKey: "walk_in",
      sourceDetail: "prove promise",
      expectedValuePaise: 0,
    });
    let refused = false;
    try {
      await writePromise(tx, {
        leadId: made.leadId,
        actorId: IYER,
        promisedOn: "2026-10-12",
        reason: "",
      });
    } catch {
      refused = true;
    }
    if (!refused) throw new Error("A date cannot be set without a reason");
    await writePromise(tx, {
      leadId: made.leadId,
      actorId: IYER,
      promisedOn: "2026-10-12",
      reason: "First booking promise",
    });
    await writePromise(tx, {
      leadId: made.leadId,
      actorId: IYER,
      promisedOn: "2026-10-20",
      reason: "RTO delay, moved",
    });
    const cur = await currentPromise(tx, made.leadId);
    if (cur?.promised_on.slice(0, 10) !== "2026-10-20") {
      throw new Error("Current promise must be the latest row");
    }
    const [n] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM delivery_promises WHERE lead_id = ${made.leadId}::uuid
    `;
    if (Number(n?.n ?? 0) !== 2) throw new Error("A moved promise writes rather than updates");
    await moveDeliveryStep(tx, {
      leadId: made.leadId,
      actorId: IYER,
      stepKey: "rto",
      status: "blocked",
      blockReason: "RTO strike",
      blockKind: "external",
    });
    const acc = await promiseAccuracy(tx);
    if (Number(acc.external_blocks) < 1) {
      throw new Error("External blocks must be counted");
    }
  });
  console.log("PROMISE_OK latest row is current; move writes; external blocks counted; no date without reason");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
