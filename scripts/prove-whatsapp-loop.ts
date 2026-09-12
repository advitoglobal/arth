/**
 * WhatsApp loop: seven templates, dealership number, receipts as new rows,
 * reply clock, capture for unknown numbers. Search walls unchanged.
 */
import { withTenant } from "../src/db/with-tenant";
import { createOwnedEnquiry } from "../src/services/assignment";
import { sendWhatsApp } from "../src/services/telecalling";
import { receiveWhatsApp, escalateUnansweredMessages } from "../src/services/whatsapp-loop";
import { searchEnquiries } from "../src/services/telecalling";
import { QUICK_LINKS, rendererKeys, whatsappPurpose } from "../src/domain/whatsapp-loop";
import { canOpen } from "../src/lib/access";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const KIRAN = "ffffffff-ffff-ffff-ffff-ffffffffff42";

function assertBidirectional() {
  const keys = rendererKeys();
  for (const link of QUICK_LINKS) {
    if (!keys.links.includes(link.key)) throw new Error(`Link ${link.key} has no renderer`);
    if (!keys.labels.includes(link.key)) throw new Error(`Link ${link.key} has no label`);
    if (whatsappPurpose(link.key) !== link.purpose) {
      throw new Error(`Purpose mismatch for ${link.key}`);
    }
  }
  if (QUICK_LINKS.find((l) => l.key === "quotation")?.pointsKind !== "quotation_issued") {
    throw new Error("Quotation sent must be the points action");
  }
  if (QUICK_LINKS.find((l) => l.key === "brochure")?.pointsKind) {
    throw new Error("A brochure sent must not earn points");
  }
  if (!canOpen("tele", "msg") || canOpen("acct", "msg")) {
    throw new Error("Messages access list is wrong");
  }
}

async function main() {
  assertBidirectional();

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    let consentRefused = false;
    try {
      await sendWhatsApp(tx, {
        leadId: KIRAN,
        userId: IYER,
        kind: "brochure",
        senderName: "A. Iyer",
        dealer: "Whitefield Motors",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      consentRefused = message.includes("withdrawn") || message.includes("not agreed");
    }
    if (!consentRefused) throw new Error("Withdrawn consent must refuse with a reason");

    const phone = `7${String(Date.now()).slice(-9)}`;
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "WhatsApp Proof",
      phone,
      modelInterest: "Fronx",
      variantInterest: "Delta",
      sourceKey: "inbound_call",
      sourceDetail: "",
      expectedValuePaise: 0,
    });

    let altFailed = false;
    try {
      await sendWhatsApp(tx, {
        leadId: made.leadId,
        userId: IYER,
        kind: "alternative",
        senderName: "A. Iyer",
        dealer: "Whitefield Motors",
      });
    } catch (err) {
      altFailed = String(err).includes("alternative choice");
    }
    if (!altFailed) throw new Error("Alternative without a second model must refuse");

    const brochure = await sendWhatsApp(tx, {
      leadId: made.leadId,
      userId: IYER,
      kind: "brochure",
      senderName: "A. Iyer",
      dealer: "Whitefield Motors",
    });
    if (brochure.points !== 0) throw new Error("Brochure must score 0");
    if (brochure.url) throw new Error("Must not open a personal WhatsApp link");

    const quote = await sendWhatsApp(tx, {
      leadId: made.leadId,
      userId: IYER,
      kind: "quotation",
      senderName: "A. Iyer",
      dealer: "Whitefield Motors",
    });
    if (quote.points <= 0) throw new Error("Quotation sent must earn points");

    const events = await tx<{ event_type: string; payload: { status?: string; sender?: string } }[]>`
      SELECT event_type, payload FROM lead_events
      WHERE lead_id = ${made.leadId}::uuid
        AND event_type IN ('whatsapp', 'whatsapp_receipt')
      ORDER BY created_at
    `;
    if (!events.some((e) => e.event_type === "whatsapp" && e.payload?.sender === "dealership")) {
      throw new Error("Send must name the dealership number");
    }
    if (!events.some((e) => e.event_type === "whatsapp_receipt" && e.payload?.status === "delivered")) {
      throw new Error("Delivery must be a new receipt row");
    }

    const inbound = await receiveWhatsApp(tx, {
      fromPhone: phone,
      text: "Send the other colour too.",
      userId: IYER,
    });
    if (inbound.needsCapture || inbound.leadId !== made.leadId) {
      throw new Error("Reply must thread to the enquiry");
    }
    const [clock] = await tx<{ message_reply_due: Date | null }[]>`
      SELECT message_reply_due FROM leads WHERE id = ${made.leadId}::uuid
    `;
    if (!clock.message_reply_due) throw new Error("Inbound must start the message clock");

    const unknown = await receiveWhatsApp(tx, {
      fromPhone: "6111122233",
      text: "Price for Swift?",
      userId: IYER,
    });
    if (!unknown.needsCapture) throw new Error("Unknown number must open capture");

    const afterHours = await receiveWhatsApp(tx, {
      fromPhone: phone,
      text: "Still waiting.",
      userId: IYER,
      at: new Date("2026-09-13T16:00:00+05:30"),
    });
    if (!afterHours.autoReply?.includes("will reply at")) {
      throw new Error("Out of hours must auto-reply, never silence");
    }

    await tx`
      UPDATE leads SET message_reply_due = now() - interval '40 minutes', message_replied_at = NULL
      WHERE id = ${made.leadId}::uuid
    `;
    const n = await escalateUnansweredMessages(tx);
    if (n < 1) throw new Error("An unanswered message must escalate");

    const search = await searchEnquiries(tx, { q: "Anita Service" });
    if (search.some((r) => r.customer_name === "Anita Service")) {
      throw new Error("Search walls must still hide Anita Service");
    }
  });

  console.log("WHATSAPP_LOOP_OK templates, receipts, reply clock, capture");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
