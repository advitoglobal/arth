/**
 * Every figure names source and period. Exclusions are published and counted.
 */
import { withTenant } from "../src/db/with-tenant";
import { seatFigures, junkRates } from "../src/services/figures";
import { promiseAccuracy } from "../src/services/delivery";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const GUPTA = "dddddddd-dddd-dddd-dddd-ddddddddddd7";
const SHAH = "dddddddd-dddd-dddd-dddd-ddddddddddd8";

async function main() {
  await withTenant({ tenantId: WHITEFIELD, userId: GUPTA }, async (tx) => {
    const figures = await seatFigures(tx, "mgr", GUPTA);
    if (figures.some((f) => !f.source || !f.period)) {
      throw new Error("Every figure must name source and period");
    }
    const junk = await junkRates(tx);
    if (!Array.isArray(junk)) throw new Error("Junk rate must be countable");
  });
  await withTenant({ tenantId: WHITEFIELD, userId: SHAH }, async (tx) => {
    const acc = await promiseAccuracy(tx);
    if (acc.external_blocks == null) throw new Error("Exclusion count must itself be reported");
    const figures = await seatFigures(tx, "owner", SHAH);
    const moved = figures.find((f) => f.label.includes("Delivery"));
    if (moved && !moved.exclusion) throw new Error("External blocks must be published on the figure");
  });
  console.log("FIGURES_OK every figure carries source and period; exclusions are published and counted");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
