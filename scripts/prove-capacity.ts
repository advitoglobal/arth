/**
 * Floor actions against a 20 lakh enquiry book on the capacity dealer.
 * Demo dealers are not loaded. Fail if a hot path is slower than the budget.
 */
import { withTenant, type Tx } from "../src/db/with-tenant";
import {
  controlSnapshot,
} from "../src/services/control";
import {
  getLead,
  listPipeline,
  listQueue,
  searchEnquiries,
} from "../src/services/telecalling";
import {
  CAP_DESK,
  CAP_PRIN,
  CAP_TELE,
  CAP_TENANT,
  NEEDLE_LEAD,
  NEEDLE_NAME,
  NEEDLE_PHONE,
  ensureCapacityBook,
} from "./load-capacity";

async function asCap<T>(userId: string, fn: (tx: Tx) => Promise<T>) {
  return withTenant({ tenantId: CAP_TENANT, userId }, fn);
}
const QUEUE_MS = 800;
const GET_MS = 400;
const SNAP_MS = 1500;
const PIPE_MS = 800;
const BURST_MS = 4000;

async function timed<T>(label: string, budget: number, fn: () => Promise<T>) {
  const t0 = Date.now();
  const value = await fn();
  const ms = Date.now() - t0;
  console.log(`${label} ${ms}ms (budget ${budget}ms)`);
  if (ms > budget) {
    throw new Error(`${label} took ${ms}ms, budget is ${budget}ms`);
  }
  return { value, ms };
}

const SEARCH_MS = 800;

async function main() {
  const target = Number(process.env.ARTH_CAPACITY_N ?? 2_000_000);
  const n = await ensureCapacityBook(target);
  if (n < Math.min(target, 1_800_000) && target >= 1_800_000) {
    throw new Error(`capacity book is ${n}, need about 20 lakh`);
  }
  if (n < target && target < 1_800_000) {
    console.log(`capacity proving against ${n} rows (ARTH_CAPACITY_N=${target})`);
  }

  const search = await timed("search phone", SEARCH_MS, () =>
    asCap(CAP_TELE, (tx) => searchEnquiries(tx, { q: NEEDLE_PHONE })),
  );
  if (!search.value.some((r) => r.customer_name === NEEDLE_NAME)) {
    throw new Error("phone search missed Capacity Needle in the 20 lakh book");
  }

  const byName = await timed("search name", SEARCH_MS, () =>
    asCap(CAP_TELE, (tx) => searchEnquiries(tx, { q: NEEDLE_NAME })),
  );
  if (!byName.value.some((r) => String(r.id) === NEEDLE_LEAD)) {
    throw new Error("name search missed Capacity Needle");
  }

  const oldDump = await timed("search old dump name", SEARCH_MS, () =>
    asCap(CAP_TELE, (tx) => searchEnquiries(tx, { q: "Load 1500000" })),
  );
  if (target >= 1_500_000 && oldDump.value.length === 0) {
    throw new Error("search must find a name from the old dump, not only the newest 80");
  }

  await timed("queue", QUEUE_MS, () => asCap(CAP_TELE, (tx) => listQueue(tx, CAP_TELE)));
  await timed("getLead", GET_MS, () => asCap(CAP_TELE, (tx) => getLead(tx, NEEDLE_LEAD)));
  await timed("pipeline counts", PIPE_MS, () =>
    asCap(CAP_TELE, (tx) => listPipeline(tx, CAP_TELE)),
  );
  const snap = await timed("desk snapshot", SNAP_MS, () =>
    asCap(CAP_DESK, (tx) => controlSnapshot(tx)),
  );
  if (snap.value.counts.names < n - 1) {
    throw new Error("desk counts must use SQL COUNT, not a truncated list");
  }
  if (snap.value.late.length > 40) {
    throw new Error("desk must not send the whole late book to the browser");
  }
  const prin = await timed("principal snapshot", SNAP_MS, () =>
    asCap(CAP_PRIN, (tx) => controlSnapshot(tx)),
  );
  if (prin.value.counts.names !== snap.value.counts.names) {
    throw new Error("principal and desk should count the same capacity dealer book");
  }

  const burstN = 24;
  const burst = await timed("24 concurrent searches", BURST_MS, async () => {
    await Promise.all(
      Array.from({ length: burstN }, (_, i) =>
        asCap(CAP_TELE, (tx) =>
          searchEnquiries(tx, { q: i % 2 === 0 ? NEEDLE_PHONE : NEEDLE_NAME }),
        ),
      ),
    );
    return true;
  });

  const walls = await asCap(CAP_TELE, async (tx) => {
    return tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM leads
      WHERE tenant_id = '11111111-1111-1111-1111-111111111111'::uuid
    `;
  });
  if (Number(walls[0]?.n ?? 0) !== 0) {
    throw new Error("capacity telecaller must not see Whitefield rows");
  }

  console.log(
    `CAPACITY_OK book=${n} search=${search.ms}ms queue burst=${burst.ms}ms`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
