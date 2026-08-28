/**
 * Performance analysis is seat-scoped. Another dealer never appears.
 */
import { withTenant } from "../src/db/with-tenant";
import { loadPerformance } from "../src/services/performance";
import { canOpen } from "../src/lib/access";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const COASTAL = "22222222-2222-2222-2222-222222222222";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const PINTO = "dddddddd-dddd-dddd-dddd-ddddddddddd2";
const RAO = "dddddddd-dddd-dddd-dddd-ddddddddddd4";
const MENON = "dddddddd-dddd-dddd-dddd-ddddddddddd6";
const GUPTA = "dddddddd-dddd-dddd-dddd-ddddddddddd7";
const SHAH = "dddddddd-dddd-dddd-dddd-ddddddddddd8";
const KAMATH = "dddddddd-dddd-dddd-dddd-dddddddddd10";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  assert(canOpen("tele", "perf"), "telecaller opens Performance");
  assert(canOpen("sales", "perf"), "sales opens Performance");
  assert(canOpen("lead", "perf"), "team leader opens Performance");
  assert(canOpen("mgr", "perf"), "digital desk opens Performance");
  assert(canOpen("owner", "perf"), "principal opens Performance");
  assert(!canOpen("adv_admin", "perf"), "Advito admin uses the dealers list, not the floor Performance screen");

  const iyer = await withTenant({ tenantId: WHITEFIELD, userId: IYER }, (tx) => loadPerformance(tx));
  assert(iyer.snapshot.role === "tele", "Iyer snapshot is telecaller");
  assert(iyer.snapshot.scope === "your book", "telecaller scope is own book");
  assert(iyer.snapshot.owned > 0, "Iyer must have a book");
  assert(iyer.gaps.length > 0, "telecaller analysis must name gaps or a clear-day line");
  assert(iyer.plan.length > 0, "telecaller analysis must give a plan");

  const pinto = await withTenant({ tenantId: COASTAL, userId: PINTO }, (tx) => loadPerformance(tx));
  assert(pinto.snapshot.owned !== iyer.snapshot.owned || pinto.snapshot.book !== iyer.snapshot.book, "Coastal book must not copy Whitefield");
  assert(!pinto.holding.some((l) => l.includes("Whitefield")), "Coastal copy must not name Whitefield");

  const rao = await withTenant({ tenantId: WHITEFIELD, userId: RAO }, (tx) => loadPerformance(tx));
  assert(rao.snapshot.role === "sales", "Rao is sales");
  assert(rao.snapshot.unowned === 0, "sales does not count the shared telecalling book as owned work");

  const menon = await withTenant({ tenantId: WHITEFIELD, userId: MENON }, (tx) => loadPerformance(tx));
  assert(menon.snapshot.role === "lead", "Menon is team leader");
  assert(menon.snapshot.team.length >= 2, "team leader must see Whitefield telecallers");
  assert(!menon.snapshot.team.some((t) => (t.full_name ?? "").includes("Pinto")), "team leader must not see Coastal");

  const gupta = await withTenant({ tenantId: WHITEFIELD, userId: GUPTA }, (tx) => loadPerformance(tx));
  assert(gupta.snapshot.scope === "this branch", "digital desk is branch");
  assert(gupta.snapshot.book >= iyer.snapshot.owned, "desk book is at least the telecaller book");

  const shah = await withTenant({ tenantId: WHITEFIELD, userId: SHAH }, (tx) => loadPerformance(tx));
  const kamath = await withTenant({ tenantId: COASTAL, userId: KAMATH }, (tx) => loadPerformance(tx));
  assert(shah.snapshot.scope === "this dealer", "principal is dealer");
  assert(shah.snapshot.book !== kamath.snapshot.book, "principals must not see the same dealer book");

  console.log("PERF_OK analysis is seat-scoped; Coastal cannot read Whitefield");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
