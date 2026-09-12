import type { Tx } from "@/db/with-tenant";
import { firstResponseDue, nextWorkingOpen, type DayHours } from "@/domain/clock";
import { isInsideWorkingHours as hoursOpen } from "@/domain/call-flow";
import {
  MESSAGE_REPLY_MINUTES,
  MEDIA_KIND_LABEL,
  QUOTE_VALID_DAYS,
  autoReplyText,
  pointsKindForWhatsApp,
  whatsappPurpose,
} from "@/domain/whatsapp-loop";
import { pointsFor } from "@/domain/points";
import { inr, istDate, istDateTime } from "@/lib/format";
import { whatsappKindLabel, whatsappMessage, type WhatsAppKind } from "@/lib/whatsapp";
import { freezeQuotation, recordMovement, requireConsent } from "@/services/floor-register";
import { findDuplicatesByPhone } from "@/services/conversion";
import { onRoadFor } from "@/services/catalogue";

function isKind(value: string): value is WhatsAppKind {
  return [
    "brochure",
    "price",
    "quotation",
    "alternative",
    "offer",
    "location",
    "testdrive",
    "service_reminder",
    "insurance_quote",
  ].includes(value);
}

async function hoursForLead(tx: Tx, leadId: string) {
  const [row] = await tx<{
    branch_id: string;
    timezone: string;
    branch: string;
  }[]>`
    SELECT l.branch_id::text, b.timezone, b.name AS branch
    FROM leads l
    JOIN branches b ON b.id = l.branch_id
    WHERE l.id = ${leadId}::uuid
  `;
  if (!row) throw new Error("This enquiry is not on your book.");
  const hours = await tx<DayHours[]>`
    SELECT day_of_week AS "dayOfWeek",
           opens_at::text AS "opensAt",
           closes_at::text AS "closesAt"
    FROM working_hours
    WHERE branch_id = ${row.branch_id}::uuid
    ORDER BY day_of_week
  `;
  const [th] = await tx<{ value_int: number }[]>`
    SELECT value_int FROM config_thresholds WHERE key = 'message_reply_minutes'
  `;
  return {
    hours: hours.map((h) => ({
      dayOfWeek: Number(h.dayOfWeek),
      opensAt: h.opensAt,
      closesAt: h.closesAt,
    })),
    timeZone: row.timezone || "Asia/Kolkata",
    branchName: row.branch,
    replyMinutes: th?.value_int ?? MESSAGE_REPLY_MINUTES,
  };
}

function hoursLine(hours: DayHours[], branchName: string) {
  const open = hours.find((h) => h.opensAt && h.closesAt);
  if (!open?.opensAt || !open.closesAt) return `${branchName}. Working hours are on the branch board.`;
  return `${branchName}. Open ${open.opensAt.slice(0, 5)} to ${open.closesAt.slice(0, 5)} on working days.`;
}

async function notifyOwnerOrPool(tx: Tx, leadId: string, title: string) {
  const [lead] = await tx<{ owner_user_id: string | null; branch_id: string; customer_name: string }[]>`
    SELECT l.owner_user_id::text, l.branch_id::text, c.full_name AS customer_name
    FROM leads l JOIN customers c ON c.id = l.customer_id
    WHERE l.id = ${leadId}::uuid
  `;
  if (!lead) return;
  const ids: string[] = [];
  if (lead.owner_user_id) ids.push(lead.owner_user_id);
  else {
    const pool = await tx<{ id: string }[]>`
      SELECT u.id::text FROM users u
      JOIN positions p ON p.id = u.position_id
      WHERE u.is_active AND p.branch_id = ${lead.branch_id}::uuid
        AND u.role_key IN ('tele', 'svctele', 'instele', 'lead')
    `;
    ids.push(...pool.map((p) => p.id));
  }
  for (const userId of ids) {
    await tx`
      INSERT INTO notifications (tenant_id, user_id, title, why, href)
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${userId}::uuid,
        ${title},
        'A WhatsApp reply belongs to the enquiry, not to a person. The message clock is separate from the call clock.',
        ${"/w/msg?id=" + leadId}
      )
    `;
  }
}

export async function sendWhatsAppLoop(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    kind: string;
    senderName: string;
    dealer: string;
  },
) {
  if (!isKind(input.kind)) throw new Error("Unknown WhatsApp template.");
  const [lead] = await tx<{
    owner_user_id: string | null;
    customer_name: string;
    phone: string;
    model_interest: string | null;
    variant_interest: string | null;
    alt_model: string | null;
    difficulty_band: string | null;
    department_key: string;
    testdrive_pref_date: string | null;
    meeting_at: string | null;
    customer_id: string;
  }[]>`
    SELECT
      l.owner_user_id::text,
      c.full_name AS customer_name,
      c.phone,
      l.model_interest,
      l.variant_interest,
      l.alt_model,
      l.difficulty_band,
      l.department_key,
      l.testdrive_pref_date::text,
      l.meeting_at::text,
      l.customer_id::text
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not on your book.");
  if (lead.owner_user_id && lead.owner_user_id !== input.userId) {
    throw new Error("You do not own this enquiry. Only the owner can send on this thread.");
  }

  const purpose = whatsappPurpose(input.kind, lead.department_key);
  await requireConsent(tx, input.leadId, purpose);

  if (input.kind === "alternative" && !lead.alt_model) {
    throw new Error("Add an alternative choice on the enquiry first.");
  }
  if (input.kind === "testdrive" && !lead.testdrive_pref_date && !lead.meeting_at) {
    throw new Error("Book a test drive slot first.");
  }

  const clock = await hoursForLead(tx, input.leadId);
  let priceLine: string | null = null;
  let quoteUntil: string | null = null;
  if (input.kind === "price" || input.kind === "quotation" || input.kind === "alternative") {
    const model = input.kind === "alternative" ? lead.alt_model : lead.model_interest;
    const price = model ? await onRoadFor(tx, model, input.kind === "alternative" ? null : lead.variant_interest) : null;
    if (!price) {
      throw new Error("No price is on the master for this model. The dealer admin enters it. A guessed price is not issued.");
    }
    const ex = price.confirmedAt.ex_showroom ?? price.oldestConfirm;
    priceLine = `On-road ${inr(price.onRoadPaise / 100)}. Ex-showroom confirmed ${ex ?? "on the master"}.`;
  }
  if (input.kind === "quotation") {
    await freezeQuotation(tx, input.leadId, input.userId);
    const until = new Date();
    until.setUTCDate(until.getUTCDate() + QUOTE_VALID_DAYS);
    quoteUntil = istDate(until);
    await tx`
      UPDATE leads SET
        quote_valid_until = ${until.toISOString()}::timestamptz,
        next_action_at = ${until.toISOString()}::timestamptz
      WHERE id = ${input.leadId}::uuid
    `;
  }

  const text = whatsappMessage({
    kind: input.kind,
    customerName: lead.customer_name,
    model: lead.model_interest,
    variant: lead.variant_interest,
    dealer: input.dealer,
    sender: input.senderName,
    altModel: lead.alt_model,
    priceLine,
    hoursLine: hoursLine(clock.hours, clock.branchName),
    slotLine: lead.testdrive_pref_date
      ? istDate(lead.testdrive_pref_date)
      : lead.meeting_at
        ? istDateTime(lead.meeting_at)
        : null,
    quoteUntil,
  });

  const pointsKind = pointsKindForWhatsApp(input.kind);
  const points = pointsKind ? pointsFor({ kind: pointsKind, difficulty: lead.difficulty_band }) : 0;
  const [inserted] = await tx<{ id: string; created_at: Date }[]>`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'whatsapp',
      'USER',
      ${input.userId}::uuid,
      ${whatsappKindLabel(input.kind) + " sent from the dealership number."},
      ${tx.json({
        kind: input.kind,
        text,
        points,
        channel: "whatsapp",
        sender: "dealership",
        template: true,
      })}
    )
    RETURNING id::text, created_at
  `;
  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'whatsapp_receipt',
      'SYSTEM',
      NULL,
      ${"Delivered. A Cloud API is not connected yet. This receipt is the desk record."},
      ${tx.json({
        status: "delivered",
        of: inserted?.id,
        channel: "whatsapp",
      })}
    )
  `;
  if (points > 0) {
    await recordMovement(tx, {
      userId: input.userId,
      amount: points,
      reasonKey: "quotation_issued",
      note: "Quotation sent on WhatsApp.",
      leadId: input.leadId,
    });
  }
  await tx`
    UPDATE leads SET
      message_replied_at = now()
    WHERE id = ${input.leadId}::uuid
      AND message_reply_due IS NOT NULL
      AND message_replied_at IS NULL
  `;
  return {
    recorded: `${whatsappKindLabel(input.kind)} sent from the dealership number. A Cloud API is not connected yet. The template and the delivery receipt are on the enquiry.`,
    eventId: inserted?.id,
    points,
    text,
    url: null as string | null,
  };
}

export async function receiveWhatsApp(
  tx: Tx,
  input: {
    fromPhone: string;
    text: string;
    mediaKind?: string | null;
    userId: string;
    at?: Date;
  },
) {
  const now = input.at ?? new Date();
  const dups = await findDuplicatesByPhone(tx, input.fromPhone);
  if (dups.length === 0) {
    return {
      needsCapture: true as const,
      phone: input.fromPhone.replace(/\D/g, "").slice(-10),
      recorded: "This number is not on the book. Capture opens with the number filled.",
    };
  }
  const hit = dups[0];
  const clock = await hoursForLead(tx, hit.id);
  const inside = hoursOpen(now, clock.hours, clock.timeZone);
  const due = firstResponseDue(now, clock.hours, clock.replyMinutes, clock.timeZone);
  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${hit.id}::uuid,
      'whatsapp_inbound',
      'SYSTEM',
      NULL,
      ${input.text.trim() || "WhatsApp reply on the enquiry."},
      ${tx.json({
        from: input.fromPhone,
        text: input.text,
        mediaKind: input.mediaKind ?? null,
        channel: "whatsapp",
      })}
    )
  `;
  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${hit.id}::uuid,
      'whatsapp_receipt',
      'SYSTEM',
      NULL,
      ${"Read. The customer opened the thread by replying."},
      ${tx.json({ status: "read", channel: "whatsapp" })}
    )
  `;
  if (input.mediaKind && MEDIA_KIND_LABEL[input.mediaKind]) {
    await tx`
      INSERT INTO customer_media (tenant_id, customer_id, lead_id, kind, label)
      SELECT l.tenant_id, l.customer_id, l.id, ${input.mediaKind}, ${MEDIA_KIND_LABEL[input.mediaKind]}
      FROM leads l WHERE l.id = ${hit.id}::uuid
    `;
  }
  await tx`
    UPDATE leads SET
      message_reply_due = ${due.toISOString()}::timestamptz,
      message_replied_at = NULL
    WHERE id = ${hit.id}::uuid
  `;
  let autoReply: string | null = null;
  if (!inside) {
    const openAt = nextWorkingOpen(now, clock.hours, clock.timeZone);
    autoReply = autoReplyText(istDateTime(openAt));
    await tx`
      INSERT INTO lead_events (
        tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
      ) VALUES (
        current_setting('app.tenant_id')::uuid,
        ${hit.id}::uuid,
        'whatsapp_auto',
        'SYSTEM',
        NULL,
        ${autoReply},
        ${tx.json({ kind: "auto_reply", text: autoReply, channel: "whatsapp" })}
      )
    `;
  }
  await notifyOwnerOrPool(tx, hit.id, `${hit.customer_name} replied on WhatsApp`);
  return {
    needsCapture: false as const,
    leadId: hit.id,
    customer_name: hit.customer_name,
    queuedForWrap: true,
    autoReply,
    messageReplyDue: due.toISOString(),
    recorded: autoReply
      ? "Reply is on the enquiry. Out of hours, an auto-reply went out. Silence is not sent."
      : "Reply is on the enquiry, against his name. It waits in wrap-up if a call is live.",
  };
}

export async function listMessageInbox(tx: Tx, userId: string) {
  return tx<{
    id: string;
    customer_name: string;
    phone: string;
    department_key: string;
    message_reply_due: Date | null;
    message_replied_at: Date | null;
    owner_user_id: string | null;
    last_note: string | null;
  }[]>`
    SELECT
      l.id::text,
      c.full_name AS customer_name,
      c.phone,
      l.department_key,
      l.message_reply_due,
      l.message_replied_at,
      l.owner_user_id::text,
      (
        SELECT e.note FROM lead_events e
        WHERE e.lead_id = l.id AND e.event_type IN ('whatsapp_inbound', 'whatsapp', 'whatsapp_auto')
        ORDER BY e.created_at DESC LIMIT 1
      ) AS last_note
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.message_reply_due IS NOT NULL
      AND l.message_replied_at IS NULL
      AND (l.owner_user_id = ${userId}::uuid OR l.owner_user_id IS NULL)
    ORDER BY l.message_reply_due ASC
    LIMIT 80
  `;
}

export async function queuedInbound(tx: Tx, leadId: string) {
  return tx<{ id: string; note: string; created_at: Date }[]>`
    SELECT id::text, note, created_at
    FROM lead_events
    WHERE lead_id = ${leadId}::uuid
      AND event_type = 'whatsapp_inbound'
      AND created_at > now() - interval '2 hours'
    ORDER BY created_at DESC
    LIMIT 8
  `;
}

export async function escalateUnansweredMessages(tx: Tx) {
  const due = await tx<{ id: string; customer_name: string; branch_id: string }[]>`
    SELECT l.id::text, c.full_name AS customer_name, l.branch_id::text
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.message_reply_due IS NOT NULL
      AND l.message_replied_at IS NULL
      AND l.message_reply_due < now()
      AND l.lost_reason_key IS NULL
    LIMIT 40
  `;
  let n = 0;
  for (const row of due) {
    await tx`
      UPDATE leads SET escalate_level = CASE WHEN escalate_level = 'none' THEN 'lead' ELSE escalate_level END,
        escalate_at = COALESCE(escalate_at, now())
      WHERE id = ${row.id}::uuid
    `;
    await notifyOwnerOrPool(tx, row.id, `${row.customer_name} WhatsApp reply is past its window`);
    n += 1;
  }
  return n;
}
