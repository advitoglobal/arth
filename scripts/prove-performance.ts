/**
 * Performance analysis is seat-scoped. Another dealer never appears.
 */
import { withPlatform, withTenant } from "../src/db/with-tenant";
import { loadPerformance, dealerWallRanks } from "../src/services/performance";
import { canOpen } from "../src/lib/access";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const COASTAL = "22222222-2222-2222-2222-222222222222";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const PINTO = "dddddddd-dddd-dddd-dddd-ddddddddddd2";
const NAIR = "dddddddd-dddd-dddd-dddd-ddddddddddd3";
const RAO = "dddddddd-dddd-dddd-dddd-ddddddddddd4";
const MENON = "dddddddd-dddd-dddd-dddd-ddddddddddd6";
const GUPTA = "dddddddd-dddd-dddd-dddd-ddddddddddd7";
const SHAH = "dddddddd-dddd-dddd-dddd-ddddddddddd8";
const KAMATH = "dddddddd-dddd-dddd-dddd-dddddddddd10";
const ADVITO = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1";

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
  assert(iyer.ranks.you !== null && iyer.ranks.you.score >= 0, "Iyer must have a score");
  assert(iyer.ranks.board.length === 2, "Whitefield tele board is Iyer and Nair");
  assert(iyer.ranks.you!.rank >= 1 && iyer.ranks.you!.rank <= 2, "Iyer ranks among Whitefield teles");
  assert(
    iyer.ranks.board.every((r) => r.user_id === IYER || r.user_id === NAIR),
    "Iyer board must not include Coastal",
  );
  assert(!iyer.ranks.board.some((r) => r.user_id === PINTO), "Pinto must not appear on Iyer's board");

  const nair = await withTenant({ tenantId: WHITEFIELD, userId: NAIR }, (tx) => loadPerformance(tx));
  assert(nair.ranks.board.length === 2, "Nair sees the same Whitefield tele board size");
  assert(
    new Set(nair.ranks.board.map((r) => r.user_id)).has(IYER),
    "Nair's board includes Iyer",
  );

  const pinto = await withTenant({ tenantId: COASTAL, userId: PINTO }, (tx) => loadPerformance(tx));
  assert(pinto.snapshot.owned !== iyer.snapshot.owned || pinto.snapshot.book !== iyer.snapshot.book, "Coastal book must not copy Whitefield");
  assert(!pinto.holding.some((l) => l.includes("Whitefield")), "Coastal copy must not name Whitefield");
  assert(!pinto.ranks.board.some((r) => r.user_id === IYER || r.user_id === NAIR), "Pinto must not rank Whitefield teles");

  const rao = await withTenant({ tenantId: WHITEFIELD, userId: RAO }, (tx) => loadPerformance(tx));
  assert(rao.snapshot.role === "sales", "Rao is sales");
  assert(rao.snapshot.unowned === 0, "sales does not count the shared telecalling book as owned work");
  assert(rao.ranks.you !== null && rao.ranks.you.score >= 0, "sales has a score");
  assert(rao.ranks.board.every((r) => r.role_key === "sales"), "sales board is sales only");

  const menon = await withTenant({ tenantId: WHITEFIELD, userId: MENON }, (tx) => loadPerformance(tx));
  assert(menon.snapshot.role === "lead", "Menon is team leader");
  assert(menon.snapshot.team.length >= 2, "team leader must see Whitefield telecallers");
  assert(!menon.snapshot.team.some((t) => (t.full_name ?? "").includes("Pinto")), "team leader must not see Coastal");
  const menonTeles = menon.ranks.managed.find((b) => b.kind === "tele");
  assert(menonTeles !== undefined && menonTeles.rows.length >= 2, "team leader has a tele ranking board");
  assert(!menonTeles!.rows.some((r) => r.user_id === PINTO), "team leader tele board excludes Coastal");

  const gupta = await withTenant({ tenantId: WHITEFIELD, userId: GUPTA }, (tx) => loadPerformance(tx));
  assert(gupta.snapshot.scope === "this branch", "digital desk is branch");
  assert(gupta.snapshot.book >= iyer.snapshot.owned, "desk book is at least the telecaller book");
  assert(gupta.ranks.you !== null, "digital desk has a score");
  assert(!gupta.ranks.managed.flatMap((b) => b.rows).some((r) => r.user_id === PINTO), "desk boards exclude Coastal");

  const shah = await withTenant({ tenantId: WHITEFIELD, userId: SHAH }, (tx) => loadPerformance(tx));
  const kamath = await withTenant({ tenantId: COASTAL, userId: KAMATH }, (tx) => loadPerformance(tx));
  assert(shah.snapshot.scope === "this dealer", "principal is dealer");
  assert(shah.snapshot.book !== kamath.snapshot.book, "principals must not see the same dealer book");
  const shahTeles = shah.ranks.managed.find((b) => b.kind === "tele");
  assert(shahTeles !== undefined, "principal sees a tele ranking board");
  assert(!shahTeles!.rows.some((r) => r.user_id === PINTO), "Shah tele board excludes Pinto");
  assert(shahTeles!.rows.some((r) => r.user_id === IYER), "Shah tele board includes Iyer");
  assert(!kamath.ranks.managed.flatMap((b) => b.rows).some((r) => r.user_id === IYER), "Kamath must not rank Iyer");

  const walls = await withPlatform(ADVITO, (tx) => dealerWallRanks(tx));
  assert(walls.length >= 2, "Advito ranks dealer walls");
  assert(walls.some((w) => w.name === "Whitefield Motors"), "Advito ranks Whitefield as a wall");
  assert(walls.every((w) => w.score >= 0 && w.rank >= 1), "dealer wall scores are non-negative");

  let dealerBlocked = false;
  try {
    await withTenant({ tenantId: WHITEFIELD, userId: SHAH }, (tx) => dealerWallRanks(tx));
  } catch {
    dealerBlocked = true;
  }
  assert(dealerBlocked, "a dealer principal must not rank every dealer on the SaaS");

  console.log("PERF_OK analysis is seat-scoped; score and rank stay inside the wall");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
