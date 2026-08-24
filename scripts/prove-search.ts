/**
 * Search is tenant-bound. Phone partial match. Parked is derived.
 */
import postgres from "postgres";
import { searchEnquiries } from "../src/services/telecalling";
import type { Tx } from "../src/db/with-tenant";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const COASTAL = "22222222-2222-2222-2222-222222222222";

async function main() {
  const wf = await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${WHITEFIELD}, true)`;
    return searchEnquiries(tx as unknown as Tx, { q: "0001" });
  });
  if (!wf.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Whitefield search 0001 should find Ramesh Kumar");
  }

  const parked = await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${WHITEFIELD}, true)`;
    return searchEnquiries(tx as unknown as Tx, { parked: "yes" });
  });
  if (!parked.some((r) => r.customer_name === "Joseph Abel")) {
    throw new Error("Parked filter should include Joseph Abel");
  }

  const coastal = await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${COASTAL}, true)`;
    return searchEnquiries(tx as unknown as Tx, { q: "0001" });
  });
  if (coastal.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Coastal must not see Ramesh Kumar");
  }

  console.log("SEARCH_OK phone, parked, tenant bound");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
