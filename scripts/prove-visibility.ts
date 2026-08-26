/**
 * Walls: telecaller cannot search another telecaller's owned enquiry.
 * Manager is branch-bound. Principal is dealer-bound. No user_id sees nothing.
 */
import postgres from "postgres";
import { getLead, searchEnquiries } from "../src/services/telecalling";
import type { Tx } from "../src/db/with-tenant";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const COASTAL = "22222222-2222-2222-2222-222222222222";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const NAIR = "dddddddd-dddd-dddd-dddd-ddddddddddd3";
const MENON = "dddddddd-dddd-dddd-dddd-ddddddddddd6";
const GUPTA = "dddddddd-dddd-dddd-dddd-ddddddddddd7";
const SHAH = "dddddddd-dddd-dddd-dddd-ddddddddddd8";
const KAMATH = "dddddddd-dddd-dddd-dddd-dddddddddd10";
const RAMESH = "ffffffff-ffff-ffff-ffff-fffffffffff1";

async function asUser<T>(tenantId: string, userId: string, fn: (tx: Tx) => Promise<T>) {
  return app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SELECT set_config('app.user_id', ${userId}, true)`;
    return fn(tx as unknown as Tx);
  });
}

async function main() {
  const closed = await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${WHITEFIELD}, true)`;
    await tx`SELECT set_config('app.user_id', '', true)`;
    return tx<{ n: string }[]>`SELECT count(*)::text AS n FROM leads`;
  });
  if (Number(closed[0].n) !== 0) {
    throw new Error("Fail closed: no user_id must see zero enquiries");
  }

  const iyer = await asUser(WHITEFIELD, IYER, (tx) => searchEnquiries(tx, { q: "Ramesh" }));
  if (!iyer.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Iyer must find Ramesh Kumar on his book");
  }

  const nair = await asUser(WHITEFIELD, NAIR, (tx) => searchEnquiries(tx, { q: "Ramesh" }));
  if (nair.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Nair must not search Ramesh Kumar after Iyer owns him");
  }

  const nairRecord = await asUser(WHITEFIELD, NAIR, (tx) => getLead(tx, RAMESH));
  if (nairRecord.lead) {
    throw new Error("Nair must not open Ramesh Kumar's enquiry record");
  }

  const menon = await asUser(WHITEFIELD, MENON, (tx) => searchEnquiries(tx, { q: "Ramesh" }));
  if (!menon.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Team leader must see Iyer's book");
  }

  const gupta = await asUser(WHITEFIELD, GUPTA, (tx) => searchEnquiries(tx, { q: "Ramesh" }));
  if (!gupta.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Branch manager must see this branch");
  }

  const shah = await asUser(WHITEFIELD, SHAH, (tx) => searchEnquiries(tx, { q: "Ramesh" }));
  if (!shah.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Dealer principal must see this dealer");
  }

  const kamath = await asUser(COASTAL, KAMATH, (tx) => searchEnquiries(tx, { q: "Ramesh" }));
  if (kamath.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Coastal principal must not see Whitefield enquiries");
  }

  const cross = await asUser(WHITEFIELD, SHAH, async (tx) => {
    return tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM leads
      WHERE tenant_id = ${COASTAL}::uuid
    `;
  });
  if (Number(cross[0].n) !== 0) {
    throw new Error("CROSS-TENANT LEAK through principal seat");
  }

  console.log("WALLS_OK tele search is owned-book only; team/branch/dealer buckets; fail closed");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
