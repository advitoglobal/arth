/**
 * On-road is computed. A quotation freezes versions. Stale is flagged.
 */
import { withTenant } from "../src/db/with-tenant";
import { onRoadFor, freezeOnRoadQuote, computeOnRoad } from "../src/services/catalogue";
import { createOwnedEnquiry } from "../src/services/assignment";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";

async function main() {
  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const first = await onRoadFor(tx, "Grand Vitara", "Zeta") ?? await onRoadFor(tx, "Fronx", "Delta");
    if (!first) throw new Error("Need a price master row");
    const recomputed = computeOnRoad({
      exShowroomPaise: first.exShowroomPaise,
      rtoPaise: first.rtoPaise,
      insurancePaise: first.insurancePaise,
      accessoriesPaise: first.accessoriesPaise,
    });
    if (recomputed !== first.onRoadPaise) throw new Error("On-road must be the sum of components");

    await tx`
      UPDATE price_components SET amount_paise = amount_paise + 100
      WHERE component_key = 'rto' AND price_master_id IN (
        SELECT id FROM price_master WHERE model = ${first.model} AND variant = ${first.variant}
      )
    `;
    const second = await onRoadFor(tx, first.model, first.variant);
    if (!second || second.onRoadPaise !== first.onRoadPaise + 100) {
      throw new Error("On-road must recompute when a component changes");
    }
    await tx`
      UPDATE price_components SET amount_paise = amount_paise - 100
      WHERE component_key = 'rto' AND price_master_id IN (
        SELECT id FROM price_master WHERE model = ${first.model} AND variant = ${first.variant}
      )
    `;

    await tx`
      UPDATE price_components SET confirmed_at = CURRENT_DATE - 40
      WHERE component_key = 'insurance' AND price_master_id IN (
        SELECT id FROM price_master WHERE model = ${first.model} AND variant = ${first.variant}
      )
    `;
    const stale = await onRoadFor(tx, first.model, first.variant);
    if (!stale?.stale) throw new Error("A stale component must be flagged rather than shown as current");
    await tx`
      UPDATE price_components SET confirmed_at = CURRENT_DATE
      WHERE component_key = 'insurance' AND price_master_id IN (
        SELECT id FROM price_master WHERE model = ${first.model} AND variant = ${first.variant}
      )
    `;

    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Quote Freeze",
      phone: `8${String(Date.now()).slice(-9)}`,
      modelInterest: first.model,
      variantInterest: first.variant,
      sourceKey: "walk_in",
      sourceDetail: "prove catalogue",
      expectedValuePaise: 0,
    });
    const frozen = await freezeOnRoadQuote(tx, made.leadId, IYER);
    if (frozen.onRoadPaise !== first.onRoadPaise) {
      throw new Error("Frozen quotation must keep the computed on-road");
    }
  });
  console.log("CATALOGUE_OK on-road recomputes; quotation freezes versions; stale is flagged");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
