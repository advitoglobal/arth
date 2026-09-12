/**
 * Four handover ways: desk enables one of direct, pool, queue. Nurture always.
 * Assist credit is permanent. First-contact clock sits with sales. Missed window
 * escalates to the sales team leader, never back to the telecaller.
 */
import { withTenant } from "../src/db/with-tenant";
import { recordAdviseTap } from "../src/services/advise";
import { handoverCard } from "../src/services/handover";
import { createOwnedEnquiry, handoffToSales } from "../src/services/assignment";
import { advanceStage, getLead, listQueue, recordDisposition } from "../src/services/telecalling";
import { markDial } from "../src/services/conversion";
import {
  bounceToPool,
  escalateHandoverContact,
  reassignLead,
  setAssignmentMode,
} from "../src/services/floor-register";
import { HANDOVER_MODES, rendererKeys } from "../src/domain/handover";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const BRANCH = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const RAO = "dddddddd-dddd-dddd-dddd-ddddddddddd4";
const GUPTA = "dddddddd-dddd-dddd-dddd-ddddddddddd7";
const LAL = "dddddddd-dddd-dddd-dddd-dddddddddd52";

function assertBidirectional() {
  const keys = rendererKeys();
  for (const mode of HANDOVER_MODES) {
    if (!keys.modes.includes(mode.key)) throw new Error(`Mode ${mode.key} has no renderer`);
  }
}

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
  assertBidirectional();

  const phone = `5${String(Date.now()).slice(-9)}`;
  let directId = "";

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Handover Proof",
      phone,
      modelInterest: "Fronx",
      variantInterest: "Delta",
      sourceKey: "google",
      sourceDetail: "prove handover",
      expectedValuePaise: 0,
    });
    directId = made.leadId;
    await recordAdviseTap(tx, {
      leadId: made.leadId,
      userId: IYER,
      tool: "emi",
      values: { tenure: 36, emiPaise: 3043500 },
    });
    await recordAdviseTap(tx, {
      leadId: made.leadId,
      userId: IYER,
      tool: "price",
      values: { onRoadPaise: 1 },
    });
    await markDial(tx, made.leadId, IYER);
    await recordDisposition(tx, {
      leadId: made.leadId,
      userId: IYER,
      dispositionKey: "interested_continuing",
      note: "Wants to decide before Diwali.",
      revisitAt: "2026-09-20",
      callSeconds: 40,
    });
    const card = await handoverCard(tx, made.leadId);
    if (card.lines.length < 2) throw new Error("A handed-on enquiry must carry its discussion rows");
    if (!card.emi || !card.price) throw new Error("Card must record price and EMI taps");
    if (card.completeness.filled < 2) throw new Error("Card completeness must count filled facts");
    if (!card.recordingLine.includes("telephony")) {
      throw new Error("Recording line must wait for a contracted provider");
    }
    await readyForHandoff(tx, made.leadId);
    await handoffToSales(tx, {
      leadId: made.leadId,
      userId: IYER,
      note: "Ready for Rao.",
      salesUserId: RAO,
      mode: "direct",
    });
  });

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const seen = await getLead(tx, directId);
    if (!seen.lead) throw new Error("Telecaller who handed on must still read the enquiry");
    if (String(seen.lead.owner_user_id) !== RAO) throw new Error("Direct handoff must name the executive");
    if (String(seen.lead.handover_mode) !== "direct") throw new Error("Handover mode must freeze as direct");
    if (!seen.lead.handover_contact_due) throw new Error("First-contact clock must sit with the receiver");
    const queue = await listQueue(tx, IYER);
    if (queue.some((r) => r.id === directId)) throw new Error("Handed-on names must leave Today");
    const [assist] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM assist_credits
      WHERE lead_id = ${directId}::uuid AND user_id = ${IYER}::uuid
    `;
    if (Number(assist?.n ?? 0) < 1) throw new Error("Assist credit must be a permanent row");
    let worked = false;
    try {
      await recordDisposition(tx, {
        leadId: directId,
        userId: IYER,
        dispositionKey: "interested_continuing",
        note: "Trying to work it after handoff.",
        revisitAt: "2026-09-21",
        callSeconds: 40,
      });
      worked = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("own")) throw err;
    }
    if (worked) throw new Error("Handed-on telecaller must not work the enquiry");
  });

  await withTenant({ tenantId: WHITEFIELD, userId: RAO }, async (tx) => {
    await bounceToPool(tx, {
      leadId: directId,
      actorId: RAO,
      reason: "Customer asked for another executive.",
    });
    const [bounced] = await tx<{ pool_open: boolean; owner_user_id: string | null }[]>`
      SELECT pool_open, owner_user_id::text FROM leads WHERE id = ${directId}::uuid
    `;
    if (!bounced?.pool_open || bounced.owner_user_id) {
      throw new Error("Bounce must return the enquiry to the pool with a reason");
    }
  });

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const nurture = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Nurture Proof",
      phone: `5${String(Date.now() + 1).slice(-9)}`,
      modelInterest: "Brezza",
      variantInterest: "Zxi",
      sourceKey: "google",
      sourceDetail: "prove nurture",
      expectedValuePaise: 0,
    });
    await handoffToSales(tx, {
      leadId: nurture.leadId,
      userId: IYER,
      note: "Not ready.",
      mode: "nurture",
      revisitAt: "2026-10-01",
    });
    const [kept] = await tx<{ owner_user_id: string | null; handover_mode: string | null }[]>`
      SELECT owner_user_id::text, handover_mode FROM leads WHERE id = ${nurture.leadId}::uuid
    `;
    if (kept?.owner_user_id !== IYER || kept.handover_mode !== "nurture") {
      throw new Error("Keep and nurture must stay on her book with a revisit date");
    }
  });

  await withTenant({ tenantId: WHITEFIELD, userId: GUPTA }, async (tx) => {
    await setAssignmentMode(tx, GUPTA, BRANCH, "queue");
  });

  let queueId = "";
  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Queue Proof",
      phone: `5${String(Date.now() + 2).slice(-9)}`,
      modelInterest: "Grand Vitara",
      variantInterest: "Smart",
      sourceKey: "google",
      sourceDetail: "prove queue",
      expectedValuePaise: 0,
    });
    queueId = made.leadId;
    await readyForHandoff(tx, made.leadId);
    await handoffToSales(tx, {
      leadId: made.leadId,
      userId: IYER,
      note: "Fleet-sized. Manager assigns.",
      mode: "queue",
    });
    const [row] = await tx<{ owner_user_id: string | null; pool_open: boolean; handover_mode: string | null }[]>`
      SELECT owner_user_id::text, pool_open, handover_mode FROM leads WHERE id = ${made.leadId}::uuid
    `;
    if (row?.owner_user_id || row?.pool_open || row?.handover_mode !== "queue") {
      throw new Error("Department queue must be unowned and not a pool");
    }
  });

  await withTenant({ tenantId: WHITEFIELD, userId: LAL }, async (tx) => {
    const [note] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM notifications
      WHERE user_id = ${LAL}::uuid AND href = ${"/w/rec?id=" + queueId}
    `;
    if (Number(note?.n ?? 0) < 1) throw new Error("Sales manager must be told about the department queue");
    await reassignLead(tx, {
      leadId: queueId,
      actorId: LAL,
      toUserId: RAO,
      reason: "Assigning Rao as the named executive.",
    });
  });

  await withTenant({ tenantId: WHITEFIELD, userId: RAO }, async (tx) => {
    await markDial(tx, queueId, RAO);
    const [row] = await tx<{ handover_contacted_at: Date | null }[]>`
      SELECT handover_contacted_at FROM leads WHERE id = ${queueId}::uuid
    `;
    if (!row?.handover_contacted_at) throw new Error("Receiver dial must stop the first-contact clock");
  });

  await withTenant({ tenantId: WHITEFIELD, userId: LAL }, async (tx) => {
    await tx`
      UPDATE leads SET
        handover_contact_due = now() - interval '1 hour',
        handover_contacted_at = NULL
      WHERE id = ${queueId}::uuid
    `;
    const n = await escalateHandoverContact(tx);
    if (n < 1) throw new Error("Missed handover clock must escalate");
    const notes = await tx<{ user_id: string }[]>`
      SELECT user_id::text FROM notifications
      WHERE href = ${"/w/rec?id=" + queueId}
        AND why LIKE '%does not return to the telecaller%'
    `;
    if (!notes.some((r) => r.user_id === LAL)) {
      throw new Error("Escalation must tell the sales manager");
    }
    if (notes.some((r) => r.user_id === IYER)) {
      throw new Error("Escalation must never return to the telecaller who handed it on");
    }
  });

  await withTenant({ tenantId: WHITEFIELD, userId: GUPTA }, async (tx) => {
    await setAssignmentMode(tx, GUPTA, BRANCH, "direct");
  });

  console.log(
    "HANDOVER_OK four ways, assist credit, receiver clock, bounce, and missed window to his team leader",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
