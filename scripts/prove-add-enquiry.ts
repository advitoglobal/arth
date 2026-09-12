/**
 * Add enquiry: capture four fields, live phone duplicates across departments,
 * qualify chips save as they go. Search walls stay closed.
 */
import { withTenant } from "../src/db/with-tenant";
import { createOwnedEnquiry } from "../src/services/assignment";
import { findDuplicatesByPhone } from "../src/services/conversion";
import { saveEnquiryDepth } from "../src/services/floor-register";
import { searchEnquiries } from "../src/services/telecalling";
import {
  BUYER_TYPE_LABEL,
  CHIP_GROUPS,
  CAPTURE_FIELDS,
  WHO_DECIDES_LABEL,
  captureReady,
  chipGroupLabel,
  enquiryProgress,
  exchangeVisible,
  rendererKeys,
} from "../src/domain/add-enquiry";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const COASTAL = "22222222-2222-2222-2222-222222222222";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const PINTO = "dddddddd-dddd-dddd-dddd-ddddddddddd2";

function assertBidirectional() {
  const keys = rendererKeys();
  for (const field of CAPTURE_FIELDS) {
    if (!keys.capture.includes(field.key)) throw new Error(`Capture ${field.key} has no renderer`);
  }
  for (const group of CHIP_GROUPS) {
    if (chipGroupLabel(group.key) !== group.label) {
      throw new Error(`Chip group ${group.key} label mismatch`);
    }
  }
  for (const key of Object.keys(BUYER_TYPE_LABEL)) {
    if (!keys.buyer.includes(key)) throw new Error(`Buyer ${key} has no renderer`);
  }
  for (const key of Object.keys(WHO_DECIDES_LABEL)) {
    if (!keys.who.includes(key)) throw new Error(`Who ${key} has no renderer`);
  }
  if (exchangeVisible("first_time")) throw new Error("First-time buyer must not open exchange chips");
  if (!exchangeVisible("exchange") || !exchangeVisible("replacement")) {
    throw new Error("Exchange and replacement must open exchange chips");
  }
  if (captureReady({ phone: "98450", name: "A", model: "Swift", source: "google" })) {
    throw new Error("Short mobile must not capture");
  }
  const before = enquiryProgress({
    captured: false,
    capture: { phone: "9845011122", name: "Test", model: "Swift", source: "inbound_call" },
    qualify: {},
    department: "sales",
  });
  if (before.captureNow !== 4 || before.requiredDone) {
    throw new Error("Unsaved capture must not count as required done");
  }
  const after = enquiryProgress({
    captured: true,
    capture: { phone: "9845011122", name: "Test", model: "Swift", source: "inbound_call" },
    qualify: { buyerType: "first_time", financePath: "cash" },
    department: "sales",
  });
  if (!after.requiredDone || after.qualifyNow < 2) {
    throw new Error("Saved capture plus chips must move progress");
  }
}

async function main() {
  assertBidirectional();

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const dups = await findDuplicatesByPhone(tx, "9845099041");
    if (!dups.some((r) => r.customer_name === "Anita Service" && r.department_key === "service")) {
      throw new Error("Intake duplicate check must see the Service book");
    }

    const search = await searchEnquiries(tx, { q: "Anita Service" });
    if (search.some((r) => r.customer_name === "Anita Service")) {
      throw new Error("Search must still hide Anita Service from sales telecalling");
    }

    let blocked = false;
    try {
      await createOwnedEnquiry(tx, {
        userId: IYER,
        customerName: "Should Not File",
        phone: "9845099041",
        modelInterest: "Swift",
        variantInterest: "",
        sourceKey: "inbound_call",
        sourceDetail: "",
        expectedValuePaise: 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("Service book")) {
        throw new Error(`Wanted Service book refusal, got ${message}`);
      }
      blocked = true;
    }
    if (!blocked) throw new Error("A known number must not open a second enquiry");

    const coastal = await findDuplicatesByPhone(tx, "9876500099");
    if (coastal.length) {
      throw new Error("Whitefield must not see a Coastal Cars number");
    }
  });

  await withTenant({ tenantId: COASTAL, userId: PINTO }, async (tx) => {
    const anita = await findDuplicatesByPhone(tx, "9845099041");
    if (anita.length) {
      throw new Error("Coastal Cars must not see a Whitefield number");
    }
  });

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const phone = `6${String(Date.now()).slice(-9)}`;
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Chip Proof",
      phone,
      modelInterest: "Fronx",
      variantInterest: "",
      sourceKey: "inbound_call",
      sourceDetail: "",
      expectedValuePaise: 0,
    });
    await saveEnquiryDepth(tx, {
      leadId: made.leadId,
      userId: IYER,
      buyerType: "exchange",
      colour: "Nexa Blue",
      variant: "Delta",
      financeNeeded: true,
      financeBankKey: "HDFC",
      whoElseDecides: "spouse",
      seenVehicle: true,
      intakeSaid: "Wants the brochure tonight.",
    });
    const [row] = await tx<{
      buyer_type: string | null;
      intake_said: string | null;
      who_else_decides: string | null;
      seen_vehicle: boolean | null;
      owner_user_id: string | null;
    }[]>`
      SELECT buyer_type, intake_said, who_else_decides, seen_vehicle, owner_user_id::text
      FROM leads WHERE id = ${made.leadId}::uuid
    `;
    if (row.buyer_type !== "exchange") throw new Error("Buyer type chip must persist");
    if (row.intake_said !== "Wants the brochure tonight.") throw new Error("What he said must persist");
    if (row.who_else_decides !== "spouse") throw new Error("Decision chip must persist");
    if (row.seen_vehicle !== true) throw new Error("Seen-it chip must persist");
    if (row.owner_user_id !== IYER) throw new Error("Capture must own the enquiry");
    const notes = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM lead_events
      WHERE lead_id = ${made.leadId}::uuid AND event_type = 'note'
    `;
    if (Number(notes[0]?.n ?? 0) < 1) throw new Error("What he said must write a ledger row");
  });

  console.log("ADD_ENQUIRY_OK capture, chips, phone duplicates, search walls");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
