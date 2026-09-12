/**
 * In-place confirmation lasts 1.5 seconds. Destructive telecalling
 * actions undo as a correcting entry.
 */
import { withTenant } from "../src/db/with-tenant";
import { createOwnedEnquiry, handoffToSales } from "../src/services/assignment";
import { advanceStage, recordDisposition, undoDisposition } from "../src/services/telecalling";
import { markDial } from "../src/services/conversion";
import {
  CONFIRM_ACTIONS,
  CONFIRM_MS,
  UNDO_LINE,
  isDestructive,
  rendererKeys,
} from "../src/domain/confirm";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const RAO = "dddddddd-dddd-dddd-dddd-ddddddddddd4";

async function main() {
  const keys = rendererKeys();
  for (const row of CONFIRM_ACTIONS) {
    if (!keys.includes(row.key)) throw new Error(`Confirm action ${row.key} has no renderer`);
  }
  if (CONFIRM_MS !== 1500) throw new Error("Confirmation window must be 1500ms");
  if (UNDO_LINE !== "Undo writes a correcting entry. The original row stays.") {
    throw new Error("Pass 2 forbids rewriting the undo sentence");
  }
  if (UNDO_LINE.includes("—")) throw new Error("Product copy must not use an em dash");
  if (!isDestructive("handoff") || isDestructive("whatsapp")) {
    throw new Error("Handoff undoes. A sent WhatsApp template does not.");
  }

  const phone = `5${String(Date.now()).slice(-9)}`;
  let leadId = "";

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Confirm Undo",
      phone,
      modelInterest: "Fronx",
      variantInterest: "Delta",
      sourceKey: "google",
      sourceDetail: "prove confirm",
      expectedValuePaise: 0,
    });
    leadId = made.leadId;
    await markDial(tx, made.leadId, IYER);
    await recordDisposition(tx, {
      leadId,
      userId: IYER,
      dispositionKey: "interested_continuing",
      note: "Wants a showroom visit.",
      revisitAt: "2026-09-20",
      callSeconds: 40,
    });
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
    const handed = await handoffToSales(tx, {
      leadId,
      userId: IYER,
      note: "Ready for Rao.",
      salesUserId: RAO,
      mode: "direct",
    });
    if (!handed.eventId) throw new Error("Handoff must return the ledger row id");
    const [after] = await tx<{ owner_user_id: string | null }[]>`
      SELECT owner_user_id::text FROM leads WHERE id = ${leadId}::uuid
    `;
    if (after?.owner_user_id !== RAO) throw new Error("Handoff must name Rao");
    await undoDisposition(tx, { leadId, userId: IYER, eventId: handed.eventId });
    const [restored] = await tx<{
      owner_user_id: string | null;
      handed_on_at: Date | null;
      handover_mode: string | null;
    }[]>`
      SELECT owner_user_id::text, handed_on_at, handover_mode
      FROM leads WHERE id = ${leadId}::uuid
    `;
    if (restored?.owner_user_id !== IYER) throw new Error("Undo must return the enquiry to the telecaller");
    if (restored?.handed_on_at) throw new Error("Undo must clear handed_on_at");
    if (restored?.handover_mode) throw new Error("Undo must clear handover_mode");
    const [corr] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM lead_events
      WHERE lead_id = ${leadId}::uuid AND event_type = 'correction'
    `;
    if (Number(corr?.n ?? 0) < 1) throw new Error("Undo must write a correction row");
  });

  console.log("CONFIRM_OK 1500ms window, handoff undo restores the telecaller");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
