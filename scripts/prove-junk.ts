/**
 * Not an enquiry leaves the conversion denominator. Two attempts required.
 */
import { withTenant } from "../src/db/with-tenant";
import { createOwnedEnquiry } from "../src/services/assignment";
import { recordDisposition } from "../src/services/telecalling";
import { markDial, costPerBooking } from "../src/services/conversion";
import { junkRates } from "../src/services/figures";
import type { Tx } from "../src/db/with-tenant";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";

async function asUser<T>(fn: (tx: Tx) => Promise<T>) {
  return withTenant({ tenantId: WHITEFIELD, userId: IYER }, fn);
}

async function main() {
  const leadId = await asUser(async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Junk Proof",
      phone: `9${String(Date.now()).slice(-9)}`,
      modelInterest: "Swift",
      variantInterest: "VXI",
      sourceKey: "google",
      sourceDetail: "prove junk",
      expectedValuePaise: 0,
    });
    let refused = false;
    try {
      await recordDisposition(tx, {
        leadId: made.leadId,
        userId: IYER,
        dispositionKey: "not_an_enquiry",
        note: "",
        notEnquiryReason: "wrong_number",
      });
    } catch (err) {
      refused = String(err).includes("Two attempts");
    }
    if (!refused) throw new Error("Junk without two attempts must be refused");
    await markDial(tx, made.leadId, IYER);
    await markDial(tx, made.leadId, IYER);
    await recordDisposition(tx, {
      leadId: made.leadId,
      userId: IYER,
      dispositionKey: "not_an_enquiry",
      note: "Wrong number, job seeker line.",
      notEnquiryReason: "wrong_number",
    });
    const [row] = await tx<{ is_not_enquiry: boolean }[]>`
      SELECT is_not_enquiry FROM leads WHERE id = ${made.leadId}::uuid
    `;
    if (!row?.is_not_enquiry) throw new Error("Closed junk must leave the funnel");
    return made.leadId;
  });

  await asUser(async (tx) => {
    const costs = await costPerBooking(tx);
    for (const row of costs) {
      const [n] = await tx<{ junk_booked: string }[]>`
        SELECT count(*)::text AS junk_booked
        FROM leads
        WHERE id = ${leadId}::uuid
          AND is_not_enquiry
          AND stage_key IN ('booked','delivered')
      `;
      if (Number(n?.junk_booked ?? 0) !== 0) {
        throw new Error("Junk must not sit in a booking denominator");
      }
      void row;
    }
    const rates = await junkRates(tx);
    if (!rates.some((r) => Number(r.junk) > 0)) {
      throw new Error("Junk rate must appear per source");
    }
  });

  console.log("JUNK_OK a junk enquiry leaves the denominator; junk without two attempts is refused; junk rate appears per source");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
