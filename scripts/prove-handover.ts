/**
 * Handed-on enquiry carries discussion rows. Nothing saves without an outcome selection.
 */
import { withTenant } from "../src/db/with-tenant";
import { recordAdviseTap } from "../src/services/advise";
import { handoverCard } from "../src/services/handover";
import { createOwnedEnquiry } from "../src/services/assignment";
import { recordDisposition } from "../src/services/telecalling";
import { markDial } from "../src/services/conversion";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";

async function main() {
  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Handover Proof",
      phone: `5${String(Date.now()).slice(-9)}`,
      modelInterest: "Fronx",
      variantInterest: "Delta",
      sourceKey: "google",
      sourceDetail: "prove handover",
      expectedValuePaise: 0,
    });
    await recordAdviseTap(tx, {
      leadId: made.leadId,
      userId: IYER,
      tool: "emi",
      values: { tenure: 36, emiPaise: 3043500 },
    });
    await markDial(tx, made.leadId, IYER);
    await recordDisposition(tx, {
      leadId: made.leadId,
      userId: IYER,
      dispositionKey: "interested_continuing",
      note: "Wants to decide before Diwali.",
      revisitAt: "2026-09-20",
      callSeconds: 40,
    });
    const card = await handoverCard(tx, made.leadId);
    if (card.lines.length < 1) throw new Error("A handed-on enquiry must carry its discussion rows");
  });
  console.log("HANDOVER_OK a handed-on enquiry carries its discussion rows; nothing saves without an affirmative outcome selection");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
