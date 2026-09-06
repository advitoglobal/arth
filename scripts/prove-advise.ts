/**
 * Each adviser tap writes a discussion row. A stale rate refuses to display as current.
 */
import { withTenant } from "../src/db/with-tenant";
import { recordAdviseTap } from "../src/services/advise";
import { createOwnedEnquiry } from "../src/services/assignment";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";

async function main() {
  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Advise Proof",
      phone: `6${String(Date.now()).slice(-9)}`,
      modelInterest: "Fronx",
      variantInterest: "Delta",
      sourceKey: "google",
      sourceDetail: "prove advise",
      expectedValuePaise: 0,
    });
    await recordAdviseTap(tx, {
      leadId: made.leadId,
      userId: IYER,
      tool: "price",
      values: { onRoadPaise: 1 },
    });
    await recordAdviseTap(tx, {
      leadId: made.leadId,
      userId: IYER,
      tool: "delivery",
      values: { days: "21-35" },
    });
    const rows = await tx<{ note: string; payload: { tool?: string } }[]>`
      SELECT note, payload FROM lead_events
      WHERE lead_id = ${made.leadId}::uuid AND event_type = 'discussed'
      ORDER BY created_at
    `;
    if (rows.length < 2) throw new Error("Each tap must write a row");
    if (!rows[0]?.payload?.tool) throw new Error("The row must name the tool");

    await tx`UPDATE bank_rates SET confirmed_at = CURRENT_DATE - 50`;
    let stale = false;
    try {
      await recordAdviseTap(tx, {
        leadId: made.leadId,
        userId: IYER,
        tool: "emi",
        values: { tenure: 36 },
      });
    } catch (err) {
      stale = String(err).includes("stale");
    }
    await tx`UPDATE bank_rates SET confirmed_at = CURRENT_DATE`;
    if (!stale) throw new Error("A stale rate must refuse to display as current");
  });
  console.log("ADVISE_OK each tap writes a row; the row names the tool; a stale rate refuses");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
