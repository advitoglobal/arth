/**
 * Search is tenant-bound. One box (phone, name, enquiry number, model).
 * Filters: source, stage, overdue, parked, date on arrived or follow-up due.
 */
import postgres from "postgres";
import { searchEnquiries } from "../src/services/telecalling";
import { enquiryNo } from "../src/lib/labels";
import type { Tx } from "../src/db/with-tenant";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const COASTAL = "22222222-2222-2222-2222-222222222222";
const RAMESH_ID = "ffffffff-ffff-ffff-ffff-fffffffffff1";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const PINTO = "dddddddd-dddd-dddd-dddd-ddddddddddd2";

function istDay(value: Date | string) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

async function inTenant<T>(tenantId: string, userId: string, fn: (tx: Tx) => Promise<T>) {
  return app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SELECT set_config('app.user_id', ${userId}, true)`;
    return fn(tx as unknown as Tx);
  });
}

async function main() {
  const wf = await inTenant(WHITEFIELD, IYER, (tx) => searchEnquiries(tx, { q: "0001" }));
  if (!wf.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Whitefield search 0001 should find Ramesh Kumar");
  }

  const byName = await inTenant(WHITEFIELD, IYER, (tx) => searchEnquiries(tx, { q: "Ramesh" }));
  if (!byName.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Name search should find Ramesh Kumar");
  }

  const byModel = await inTenant(WHITEFIELD, IYER, (tx) => searchEnquiries(tx, { q: "Brezza" }));
  if (!byModel.some((r) => r.customer_name === "S. Nayak")) {
    throw new Error("Model search should find S. Nayak on Brezza");
  }

  const no = enquiryNo(RAMESH_ID);
  if (no !== "FFFFFFF1") {
    throw new Error(`enquiryNo should be FFFFFFF1, got ${no}`);
  }
  const byEnquiryNo = await inTenant(WHITEFIELD, IYER, (tx) => searchEnquiries(tx, { q: no }));
  if (!byEnquiryNo.some((r) => String(r.id) === RAMESH_ID)) {
    throw new Error("Enquiry number search should find Ramesh Kumar");
  }
  if (byEnquiryNo.some((r) => r.customer_name === "Joseph Abel")) {
    throw new Error("Enquiry number FFFFFFF1 must not match Joseph Abel");
  }

  const google = await inTenant(WHITEFIELD, IYER, (tx) => searchEnquiries(tx, { source: "google" }));
  if (!google.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Source filter google should include Ramesh Kumar");
  }
  if (google.some((r) => r.customer_name === "S. Nayak")) {
    throw new Error("Source filter google should not include S. Nayak");
  }

  const namedGoogle = await inTenant(WHITEFIELD, IYER, (tx) =>
    searchEnquiries(tx, { q: "Ramesh", source: "meta" }),
  );
  if (namedGoogle.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Search plus source filter must not return a mismatched source");
  }

  const parked = await inTenant(WHITEFIELD, IYER, (tx) => searchEnquiries(tx, { parked: "yes" }));
  if (!parked.some((r) => r.customer_name === "Joseph Abel")) {
    throw new Error("Parked filter should include Joseph Abel");
  }

  const ramesh = wf.find((r) => r.customer_name === "Ramesh Kumar");
  if (!ramesh?.created_at) {
    throw new Error("Search rows must include created_at for date filters");
  }
  const arrivedDay = istDay(ramesh.created_at);
  const arrived = await inTenant(WHITEFIELD, IYER, (tx) =>
    searchEnquiries(tx, { from: arrivedDay, to: arrivedDay, on: "arrived" }),
  );
  if (!arrived.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Arrived date filter should include Ramesh Kumar on his arrived day");
  }

  if (!ramesh.next_action_at) {
    throw new Error("Ramesh Kumar must have a follow-up due date");
  }
  const dueDay = istDay(ramesh.next_action_at);
  const dueOnHisDay = await inTenant(WHITEFIELD, IYER, (tx) =>
    searchEnquiries(tx, { from: dueDay, to: dueDay, on: "due" }),
  );
  if (!dueOnHisDay.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Follow-up due date filter should include Ramesh Kumar on his due day");
  }

  const today = istDay(new Date());
  const arrivedToday = await inTenant(WHITEFIELD, IYER, (tx) =>
    searchEnquiries(tx, { from: today, to: today, on: "arrived" }),
  );
  if (arrivedToday.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Arrived today should not include Ramesh Kumar");
  }

  const missPhone = await inTenant(WHITEFIELD, IYER, (tx) => searchEnquiries(tx, { q: "9999888877" }));
  if (missPhone.length !== 0) {
    throw new Error("Unknown phone should return no rows so File this enquiry can show");
  }

  const coastal = await inTenant(COASTAL, PINTO, (tx) => searchEnquiries(tx, { q: "0001" }));
  if (coastal.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Coastal must not see Ramesh Kumar");
  }

  console.log("SEARCH_OK phone, name, model, enquiry number, parked, date, tenant bound");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
