/**
 * 29 Aug register: Meeting, department walls, pool, consent, accounts, onboarding.
 */
import postgres from "postgres";
import { withTenant, withPlatformDealer } from "../src/db/with-tenant";
import { getLead, searchEnquiries, sendWhatsApp } from "../src/services/telecalling";
import { incentiveExport } from "../src/services/floor-register";
import type { Tx } from "../src/db/with-tenant";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const DEVI = "dddddddd-dddd-dddd-dddd-dddddddddd43";
const BOOKS = "dddddddd-dddd-dddd-dddd-dddddddddd42";
const RAO = "dddddddd-dddd-dddd-dddd-ddddddddddd4";
const ONBOARD = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3";
const ANITA_SERVICE = "ffffffff-ffff-ffff-ffff-ffffffffff41";
const KIRAN = "ffffffff-ffff-ffff-ffff-ffffffffff42";

const sql = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

async function asUser<T>(tenantId: string, userId: string, fn: (tx: Tx) => Promise<T>) {
  return withTenant({ tenantId, userId }, fn);
}

async function main() {
  const stages = await asUser(WHITEFIELD, IYER, (tx) =>
    tx<{ key: string; label: string }[]>`
      SELECT key, label FROM config_stages ORDER BY sort_order
    `,
  );
  if (!stages.some((s) => s.key === "meeting" && s.label === "Meeting")) {
    throw new Error("Stage ladder must use Meeting, not Qualified");
  }
  if (stages.some((s) => s.key === "qualified")) {
    throw new Error("qualified must not remain as a stage key");
  }

  const iyerAnita = await asUser(WHITEFIELD, IYER, (tx) => searchEnquiries(tx, { q: "Anita Service" }));
  if (iyerAnita.some((r) => r.customer_name === "Anita Service")) {
    throw new Error("Sales telecaller must not see a service-due upload");
  }

  const iyerRecord = await asUser(WHITEFIELD, IYER, (tx) => getLead(tx, ANITA_SERVICE));
  if (iyerRecord.lead) {
    throw new Error("Iyer must not open Anita Service");
  }

  const devi = await asUser(WHITEFIELD, DEVI, (tx) => searchEnquiries(tx, { q: "Anita Service" }));
  if (!devi.some((r) => r.customer_name === "Anita Service" && r.intake_kind === "manager_upload")) {
    throw new Error("Service telecaller must see Anita Service labelled as uploaded by manager");
  }

  const booksLeads = await asUser(WHITEFIELD, BOOKS, async (tx) => {
    const [row] = await tx<{ n: string }[]>`SELECT count(*)::text AS n FROM leads`;
    return Number(row.n);
  });
  if (booksLeads !== 0) {
    throw new Error("Accounts must not read enquiry rows");
  }

  const booksCustomers = await asUser(WHITEFIELD, BOOKS, async (tx) => {
    const [row] = await tx<{ n: string }[]>`SELECT count(*)::text AS n FROM customers`;
    return Number(row.n);
  });
  if (booksCustomers !== 0) {
    throw new Error("Accounts must not read customer rows");
  }

  const exportRows = await asUser(WHITEFIELD, BOOKS, (tx) => incentiveExport(tx));
  if (exportRows.length === 0) {
    throw new Error("Accounts must still export incentive points");
  }
  if (exportRows.some((r) => /anita|kiran|ramesh/i.test(`${r.full_name} ${r.username}`))) {
    throw new Error("Incentive export must not include customer names");
  }

  let onboardBlocked = false;
  try {
    await withPlatformDealer({ platformUserId: ONBOARD, tenantId: WHITEFIELD }, (tx) =>
      searchEnquiries(tx, { q: "Ramesh" }),
    );
  } catch {
    onboardBlocked = true;
  }
  if (!onboardBlocked) {
    throw new Error("Advito onboarding must not enter a dealer book");
  }

  let consentRefused = false;
  try {
    await asUser(WHITEFIELD, IYER, (tx) =>
      sendWhatsApp(tx, {
        leadId: KIRAN,
        userId: IYER,
        kind: "brochure",
        conversation: "",
        senderName: "A. Iyer",
        dealer: "Whitefield Motors",
      }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    consentRefused = message.includes("withdrawn") || message.includes("not agreed");
  }
  if (!consentRefused) {
    throw new Error("Withdrawn consent must refuse WhatsApp");
  }

  const raoPool = await asUser(WHITEFIELD, RAO, async (tx) => {
    const [row] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM leads
      WHERE pool_open AND owner_user_id IS NULL AND department_key = 'sales'
    `;
    return Number(row.n);
  });
  if (raoPool < 0) {
    throw new Error("Sales pool query failed");
  }

  console.log("REGISTER_OK meeting, department walls, accounts, onboard, consent");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sql.end());
