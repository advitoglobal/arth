/**
 * A telecaller who handed on can still find the enquiry in Search.
 * Another telecaller cannot. Dial and outcome stay with the receiver.
 */
import { withTenant } from "../src/db/with-tenant";
import { createOwnedEnquiry, handoffToSales } from "../src/services/assignment";
import { advanceStage, recordDisposition, searchEnquiries } from "../src/services/telecalling";
import { enquiryNo } from "../src/lib/labels";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const NAIR = "dddddddd-dddd-dddd-dddd-ddddddddddd3";
const RAO = "dddddddd-dddd-dddd-dddd-ddddddddddd4";
const PINTO = "dddddddd-dddd-dddd-dddd-ddddddddddd2";
const COASTAL = "22222222-2222-2222-2222-222222222222";

async function readyForHandoff(
  tx: Parameters<typeof advanceStage>[0],
  leadId: string,
) {
  const [row] = await tx<{ stage_key: string }[]>`
    SELECT stage_key FROM leads WHERE id = ${leadId}::uuid
  `;
  let stage = row?.stage_key ?? "";
  if (stage === "assigned") {
    await advanceStage(tx, { leadId, userId: IYER, to: "contacted" });
    stage = "contacted";
  }
  if (stage === "contacted") {
    await advanceStage(tx, { leadId, userId: IYER, to: "meeting" });
  }
}

async function main() {
  const stamp = String(Date.now()).slice(-8);
  const phone = `96${stamp}`;
  const name = `Handed Search ${stamp}`;
  let leadId = "";

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: name,
      phone,
      modelInterest: "Jimny",
      variantInterest: "Alpha",
      sourceKey: "google",
      sourceDetail: "prove handed search",
      expectedValuePaise: 0,
    });
    leadId = made.leadId;
    await readyForHandoff(tx, made.leadId);
    await handoffToSales(tx, {
      leadId: made.leadId,
      userId: IYER,
      note: "Ready for Rao.",
      salesUserId: RAO,
      mode: "direct",
    });
  });

  const byName = await withTenant({ tenantId: WHITEFIELD, userId: IYER }, (tx) =>
    searchEnquiries(tx, { q: name }),
  );
  if (!byName.some((r) => String(r.id) === leadId)) {
    throw new Error("Telecaller who handed on must find the name in Search");
  }

  const byPhone = await withTenant({ tenantId: WHITEFIELD, userId: IYER }, (tx) =>
    searchEnquiries(tx, { q: phone }),
  );
  if (!byPhone.some((r) => String(r.id) === leadId)) {
    throw new Error("Telecaller who handed on must find the number in Search");
  }

  const no = enquiryNo(leadId);
  const byNo = await withTenant({ tenantId: WHITEFIELD, userId: IYER }, (tx) =>
    searchEnquiries(tx, { q: no }),
  );
  if (!byNo.some((r) => String(r.id) === leadId)) {
    throw new Error("Telecaller who handed on must find the enquiry number in Search");
  }

  const nair = await withTenant({ tenantId: WHITEFIELD, userId: NAIR }, (tx) =>
    searchEnquiries(tx, { q: phone }),
  );
  if (nair.some((r) => String(r.id) === leadId)) {
    throw new Error("Another telecaller must not see a handed-on enquiry");
  }

  const coastal = await withTenant({ tenantId: COASTAL, userId: PINTO }, (tx) =>
    searchEnquiries(tx, { q: phone }),
  );
  if (coastal.some((r) => String(r.id) === leadId)) {
    throw new Error("Coastal must not see a Whitefield handed-on enquiry");
  }

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    let worked = false;
    try {
      await recordDisposition(tx, {
        leadId,
        userId: IYER,
        dispositionKey: "interested_continuing",
        note: "Trying to work it from Search.",
        revisitAt: "2026-09-21",
        callSeconds: 40,
      });
      worked = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("own")) throw err;
    }
    if (worked) throw new Error("Finding it in Search must not let her log an outcome");
  });

  console.log("HANDED_SEARCH_OK name, phone, enquiry number, walls, no work");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
