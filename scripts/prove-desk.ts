/**
 * Digital desk is the telecalling team at one branch.
 * Dealer principal is this dealer only.
 */
import postgres from "postgres";
import { controlSnapshot } from "../src/services/control";
import { placeWithTelecaller } from "../src/services/assignment";
import { withTenant } from "../src/db/with-tenant";
import { searchEnquiries } from "../src/services/telecalling";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const COASTAL = "22222222-2222-2222-2222-222222222222";
const GUPTA = "dddddddd-dddd-dddd-dddd-ddddddddddd7";
const FERNANDES = "dddddddd-dddd-dddd-dddd-ddddddddddd9";
const SHAH = "dddddddd-dddd-dddd-dddd-ddddddddddd8";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const ANITA = "ffffffff-ffff-ffff-ffff-fffffffffff6";

const sql = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

async function main() {
  const desk = await withTenant({ tenantId: WHITEFIELD, userId: GUPTA }, (tx) =>
    controlSnapshot(tx),
  );
  if (desk.team.length < 2) {
    throw new Error("Digital desk must see Whitefield telecallers");
  }
  if (desk.team.some((t) => t.full_name.includes("Pinto"))) {
    throw new Error("Whitefield digital desk must not see Coastal telecallers");
  }

  const coastal = await withTenant({ tenantId: COASTAL, userId: FERNANDES }, (tx) =>
    controlSnapshot(tx),
  );
  if (coastal.rows.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Coastal digital desk must not see Whitefield enquiries");
  }

  const principal = await withTenant({ tenantId: WHITEFIELD, userId: SHAH }, (tx) =>
    controlSnapshot(tx),
  );
  if (!principal.people.some((p) => p.role_key === "mgr")) {
    throw new Error("Dealer principal must see the digital desk seat");
  }

  await sql.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${WHITEFIELD}, true)`;
    await tx`SELECT set_config('app.user_id', ${GUPTA}, true)`;
    await tx`
      UPDATE leads SET owner_user_id = NULL, first_responded_at = NULL
      WHERE id = ${ANITA}::uuid
    `;
  });

  await withTenant({ tenantId: WHITEFIELD, userId: GUPTA }, (tx) =>
    placeWithTelecaller(tx, { leadId: ANITA, teleId: IYER, actorId: GUPTA }),
  );

  const nair = await withTenant(
    { tenantId: WHITEFIELD, userId: "dddddddd-dddd-dddd-dddd-ddddddddddd3" },
    (tx) => searchEnquiries(tx, { q: "Anita" }),
  );
  if (nair.some((r) => r.customer_name === "Anita Desai")) {
    throw new Error("After the desk places Anita, Nair must not search her");
  }

  console.log("DESK_OK digital desk is branch-bound; principal is dealer-bound; place hides from others");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
