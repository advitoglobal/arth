/**
 * Advito operators sit outside every dealer.
 * Entering a dealer is one wall at a time. Onboard creates a new wall.
 */
import postgres from "postgres";
import { withPlatform, withPlatformDealer, withTenant } from "../src/db/with-tenant";
import { listPlatformDealers, onboardDealer } from "../src/services/platform";
import { searchEnquiries } from "../src/services/telecalling";

const ADVITO = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1";
const SUPPORT = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2";
const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const COASTAL = "22222222-2222-2222-2222-222222222222";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const SHAH = "dddddddd-dddd-dddd-dddd-ddddddddddd8";

const sql = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

async function main() {
  const listed = await withPlatform(ADVITO, (tx) => listPlatformDealers(tx));
  if (!listed.some((d) => d.name === "Whitefield Motors")) {
    throw new Error("Advito admin must list Whitefield");
  }
  if (!listed.some((d) => d.name === "Coastal Cars")) {
    throw new Error("Advito admin must list Coastal");
  }

  let dealerBlocked = false;
  try {
    await withTenant({ tenantId: WHITEFIELD, userId: SHAH }, (tx) =>
      listPlatformDealers(tx),
    );
  } catch {
    dealerBlocked = true;
  }
  if (!dealerBlocked) {
    throw new Error("A dealer principal must not list every dealer on the SaaS");
  }

  const supportWhitefield = await withPlatformDealer(
    { platformUserId: SUPPORT, tenantId: WHITEFIELD },
    (tx) => searchEnquiries(tx, { q: "Ramesh" }),
  );
  if (!supportWhitefield.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Support inside Whitefield must see Ramesh Kumar");
  }

  const supportCoastal = await withPlatformDealer(
    { platformUserId: SUPPORT, tenantId: COASTAL },
    (tx) => searchEnquiries(tx, { q: "Ramesh" }),
  );
  if (supportCoastal.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Support inside Coastal must not see Whitefield enquiries");
  }

  let supportOnboard = false;
  try {
    await withPlatform(SUPPORT, (tx) =>
      onboardDealer(tx, {
        dealerName: "Should Fail Motors",
        branchName: "X",
        principalName: "P",
        principalPhone: "9000000001",
        principalUsername: "shouldfailp",
        deskName: "D",
        deskPhone: "9000000002",
        deskUsername: "shouldfaild",
        teleName: "T",
        telePhone: "9000000003",
        teleUsername: "shouldfailt",
        password: "arth-demo-xx",
      }),
    );
  } catch {
    supportOnboard = true;
  }
  if (!supportOnboard) {
    throw new Error("Advito support must not onboard a dealer");
  }

  const stamp = Date.now().toString().slice(-6);
  const tenantId = await withPlatform(ADVITO, (tx) =>
    onboardDealer(tx, {
      dealerName: `Proof Motors ${stamp}`,
      branchName: "Proof branch",
      principalName: "Proof Principal",
      principalPhone: `91${stamp}01`,
      principalUsername: `proofp${stamp}`,
      deskName: "Proof Desk",
      deskPhone: `91${stamp}02`,
      deskUsername: `proofd${stamp}`,
      teleName: "Proof Tele",
      telePhone: `91${stamp}03`,
      teleUsername: `prooft${stamp}`,
      password: "arth-demo",
    }),
  );

  const [tele] = await withPlatformDealer({ platformUserId: ADVITO, tenantId }, (tx) =>
    tx<{ id: string }[]>`
      SELECT id::text FROM users
      WHERE role_key = 'tele' AND is_active
      LIMIT 1
    `,
  );
  if (!tele) throw new Error("Onboard must create a telecaller");

  const leak = await withTenant({ tenantId, userId: tele.id }, (tx) =>
    searchEnquiries(tx, { q: "Ramesh" }),
  );
  if (leak.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("A newly onboarded dealer must not see Whitefield enquiries");
  }

  const iyer = await withTenant({ tenantId: WHITEFIELD, userId: IYER }, (tx) =>
    tx<{ n: string }[]>`SELECT count(*)::text AS n FROM leads WHERE tenant_id = ${tenantId}::uuid`,
  );
  if (Number(iyer[0].n) !== 0) {
    throw new Error("Whitefield must not see the onboarded dealer");
  }

  console.log("PLATFORM_OK Advito lists dealers; support is one dealer at a time; onboard is a new wall");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
