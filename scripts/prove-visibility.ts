/**
 * Walls: telecaller cannot search another telecaller's owned enquiry.
 * Manager is branch-bound. Principal is dealer-bound. No user_id sees nothing.
 */
import postgres from "postgres";
import { getLead, searchEnquiries } from "../src/services/telecalling";
import { withTenant } from "../src/db/with-tenant";
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
const PINTO = "dddddddd-dddd-dddd-dddd-ddddddddddd2";
const KAMATH = "dddddddd-dddd-dddd-dddd-dddddddddd10";
const RAMESH = "ffffffff-ffff-ffff-ffff-fffffffffff1";
const COASTAL_LEAD = "ffffffff-ffff-ffff-ffff-fffffffffff5";

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

  const othersNotices = await asUser(WHITEFIELD, IYER, (tx) =>
    tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM notifications
      WHERE user_id <> ${IYER}::uuid
    `,
  );
  if (Number(othersNotices[0].n) !== 0) {
    throw new Error("A telecaller must not read another seat's notifications");
  }

  const iyerCoastal = await asUser(WHITEFIELD, IYER, (tx) => getLead(tx, COASTAL_LEAD));
  if (iyerCoastal.lead) {
    throw new Error("A Whitefield telecaller must not open a Coastal enquiry by id");
  }

  let mixed = false;
  try {
    await withTenant({ tenantId: WHITEFIELD, userId: PINTO }, async () => null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!message.includes("does not belong to this dealer")) {
      throw err;
    }
    mixed = true;
  }
  if (!mixed) {
    throw new Error("A Coastal seat must not open a Whitefield transaction");
  }

  const bound = await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async () => "ok");
  if (bound !== "ok") {
    throw new Error("A matching Whitefield seat must open a Whitefield transaction");
  }

  let incomplete = false;
  try {
    await withTenant({ tenantId: WHITEFIELD, userId: "not-a-uuid" }, async () => null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!message.includes("Session is incomplete")) {
      throw err;
    }
    incomplete = true;
  }
  if (!incomplete) {
    throw new Error("A malformed session must fail closed");
  }

  let crossNotice = false;
  try {
    await asUser(WHITEFIELD, IYER, (tx) => tx`
      INSERT INTO notifications (tenant_id, user_id, title, why)
      VALUES (
        ${WHITEFIELD}::uuid,
        ${PINTO}::uuid,
        'Should not land',
        'A Whitefield seat must not notify a Coastal seat'
      )
    `);
  } catch {
    crossNotice = true;
  }
  if (!crossNotice) {
    throw new Error("A notice must not address a seat at another dealer");
  }

  console.log("WALLS_OK tele search is owned-book only; team/branch/dealer buckets; fail closed");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
