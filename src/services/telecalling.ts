import type { Tx } from "@/db/with-tenant";
import {
  isFirstResponseLate,
  isFollowUpLate,
  isOnDayQueue,
  isParked,
  needsCallbackReason,
  revisitDayToInstant,
  STAGE_KEYS,
} from "@/domain/clock";
import { isScoringConnect, pointsFor, pointsLine } from "@/domain/points";
import { isPersonalRole } from "@/domain/visibility";
import { claimOnReach, scheduleNextAction } from "@/services/assignment";
import { enquiryNo, stageLabel } from "@/lib/labels";
import {
  type WhatsAppKind,
  waMeUrl,
  whatsappKindLabel,
  whatsappMessage,
} from "@/lib/whatsapp";

export type LeadRow = {
  id: string;
  enquiryNo?: string;
  customer_name: string;
  phone: string;
  model_interest: string | null;
  variant_interest: string | null;
  source_key: string;
  source_detail: string | null;
  stage_key: string;
  stage_label: string | null;
  stage_order: number | null;
  last_event: string | null;
  last_event_at: Date | null;
  next_action_at: Date | null;
  difficulty_band: string | null;
  expected_value_paise: string;
  owner_user_id: string | null;
  disposition_key: string | null;
  revisit_at: Date | null;
  first_response_due: Date | null;
  first_responded_at: Date | null;
  lost_reason_key: string | null;
  created_at?: Date | null;
};

export async function listQueue(tx: Tx, ownerId: string) {
  const rows = await tx<LeadRow[]>`
    SELECT
      l.id,
      c.full_name AS customer_name,
      c.phone,
      l.model_interest,
      l.variant_interest,
      l.source_key,
      l.source_detail,
      l.stage_key,
      s.label AS stage_label,
      s.sort_order AS stage_order,
      e.last_event,
      e.created_at AS last_event_at,
      l.next_action_at,
      l.difficulty_band,
      l.expected_value_paise::text,
      l.owner_user_id,
      e.disposition_key,
      e.revisit_at,
      l.first_response_due,
      l.first_responded_at,
      l.lost_reason_key
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN config_stages s ON s.tenant_id = l.tenant_id AND s.key = l.stage_key
    LEFT JOIN LATERAL (
      SELECT
        CASE
          WHEN d.label IS NOT NULL THEN d.label
          WHEN ev.event_type = 'assigned' THEN 'Assigned'
          WHEN ev.event_type = 'clock_deferred' THEN 'Clock deferred'
          WHEN ev.event_type = 'correction' THEN 'Correction'
          WHEN ev.event_type = 'created' THEN 'Filed'
          WHEN ev.event_type = 'whatsapp' THEN 'WhatsApp sent'
          WHEN ev.event_type = 'handoff' THEN 'Handed to sales'
          WHEN ev.event_type = 'stage_change' THEN COALESCE(NULLIF(ev.note, ''), 'Stage moved')
          ELSE COALESCE(NULLIF(ev.note, ''), 'Activity')
        END AS last_event,
        ev.created_at,
        ev.disposition_key,
        ev.revisit_at
      FROM lead_events ev
      LEFT JOIN config_dispositions d
        ON d.tenant_id = ev.tenant_id AND d.key = ev.disposition_key
      WHERE ev.lead_id = l.id
      ORDER BY ev.created_at DESC
      LIMIT 1
    ) e ON true
    WHERE (
        l.owner_user_id = ${ownerId}
        OR (
          l.owner_user_id IS NULL
          AND l.first_responded_at IS NULL
          AND l.lost_reason_key IS NULL
          AND l.branch_id = (
            SELECT p.branch_id FROM users u
            JOIN positions p ON p.id = u.position_id
            WHERE u.id = ${ownerId}::uuid
          )
        )
      )
      AND l.stage_key <> 'delivered'
      AND l.lost_reason_key IS NULL
    ORDER BY l.next_action_at ASC NULLS LAST
  `;
  return rows
    .filter((r) => {
      if (isParked(r) && r.next_action_at && new Date(r.next_action_at) > new Date()) {
        return false;
      }
      return isOnDayQueue(r.next_action_at);
    })
    .sort((a, b) => {
      const lateA =
        isFirstResponseLate(a) || isFollowUpLate(a.next_action_at) ? 0 : 1;
      const lateB =
        isFirstResponseLate(b) || isFollowUpLate(b.next_action_at) ? 0 : 1;
      if (lateA !== lateB) return lateA - lateB;
      const ta = a.next_action_at ? new Date(a.next_action_at).getTime() : 0;
      const tb = b.next_action_at ? new Date(b.next_action_at).getTime() : 0;
      return ta - tb;
    });
}

export async function listPipeline(tx: Tx, ownerId: string) {
  const [viewer] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${ownerId}::uuid
  `;
  if (!viewer) {
    throw new Error("This seat does not belong to this dealer.");
  }
  const personal = isPersonalRole(viewer.role_key);
  return tx<LeadRow[]>`
    SELECT
      l.id,
      c.full_name AS customer_name,
      c.phone,
      l.model_interest,
      l.variant_interest,
      l.source_key,
      l.source_detail,
      l.stage_key,
      s.label AS stage_label,
      s.sort_order AS stage_order,
      e.last_event,
      e.created_at AS last_event_at,
      l.next_action_at,
      l.difficulty_band,
      l.expected_value_paise::text,
      l.owner_user_id,
      e.disposition_key,
      e.revisit_at,
      l.first_response_due,
      l.first_responded_at,
      l.lost_reason_key
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN config_stages s ON s.tenant_id = l.tenant_id AND s.key = l.stage_key
    LEFT JOIN LATERAL (
      SELECT
        CASE
          WHEN d.label IS NOT NULL THEN d.label
          WHEN ev.event_type = 'assigned' THEN 'Assigned'
          WHEN ev.event_type = 'clock_deferred' THEN 'Clock deferred'
          WHEN ev.event_type = 'correction' THEN 'Correction'
          WHEN ev.event_type = 'created' THEN 'Filed'
          WHEN ev.event_type = 'whatsapp' THEN 'WhatsApp sent'
          WHEN ev.event_type = 'handoff' THEN 'Handed to sales'
          WHEN ev.event_type = 'stage_change' THEN COALESCE(NULLIF(ev.note, ''), 'Stage moved')
          ELSE COALESCE(NULLIF(ev.note, ''), 'Activity')
        END AS last_event,
        ev.created_at,
        ev.disposition_key,
        ev.revisit_at
      FROM lead_events ev
      LEFT JOIN config_dispositions d
        ON d.tenant_id = ev.tenant_id AND d.key = ev.disposition_key
      WHERE ev.lead_id = l.id
      ORDER BY ev.created_at DESC
      LIMIT 1
    ) e ON true
    WHERE (
      ${personal} = false
      OR l.owner_user_id = ${ownerId}
    )
    ORDER BY l.expected_value_paise DESC
  `;
}

export async function searchByPhone(tx: Tx, q: string) {
  return searchEnquiries(tx, { q });
}

export type SearchFilters = {
  q?: string;
  source?: string;
  stage?: string;
  overdue?: string;
  parked?: string;
  model?: string;
  from?: string;
  to?: string;
  on?: string;
};

function istDay(value: Date | string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function present(value?: string) {
  const v = value?.trim() ?? "";
  return v.length ? v : "";
}

function matchesSearchBox(row: LeadRow, q: string) {
  const raw = q.trim();
  if (!raw) return true;
  const digits = raw.replace(/\D/g, "");
  const text = raw.toLowerCase();
  const compact = raw.replace(/-/g, "").toLowerCase();
  const hay = `${row.customer_name} ${row.model_interest ?? ""} ${row.variant_interest ?? ""}`.toLowerCase();
  const id = String(row.id).replace(/-/g, "").toLowerCase();
  const phoneHit = digits.length >= 4 && String(row.phone).includes(digits);
  const textHit = text.length >= 2 && hay.includes(text);
  const no = enquiryNo(String(row.id)).toLowerCase();
  const idHit =
    (compact.length === 8 && no === compact) ||
    (compact.length >= 12 && id.endsWith(compact));
  return phoneHit || textHit || idHit;
}

export async function searchEnquiries(tx: Tx, filters: SearchFilters) {
  const q = present(filters.q);
  const source = present(filters.source);
  const stage = present(filters.stage);
  const overdue = present(filters.overdue);
  const parked = present(filters.parked);
  const model = present(filters.model);
  const from = present(filters.from);
  const to = present(filters.to);
  const on = present(filters.on);
  const hasQ = q.length >= 2;
  const hasFilter = Boolean(source || stage || overdue || parked || model || from || to);
  if (!hasQ && !hasFilter) return [];

  const rows = await tx<LeadRow[]>`
    SELECT
      l.id,
      c.full_name AS customer_name,
      c.phone,
      l.model_interest,
      l.variant_interest,
      l.source_key,
      l.source_detail,
      l.stage_key,
      s.label AS stage_label,
      s.sort_order AS stage_order,
      e.last_event,
      e.created_at AS last_event_at,
      l.next_action_at,
      l.difficulty_band,
      l.expected_value_paise::text,
      l.owner_user_id,
      e.disposition_key,
      e.revisit_at,
      l.first_response_due,
      l.first_responded_at,
      l.lost_reason_key,
      l.created_at AS created_at
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN config_stages s ON s.tenant_id = l.tenant_id AND s.key = l.stage_key
    LEFT JOIN LATERAL (
      SELECT
        CASE
          WHEN d.label IS NOT NULL THEN d.label
          WHEN ev.event_type = 'assigned' THEN 'Assigned'
          WHEN ev.event_type = 'clock_deferred' THEN 'Clock deferred'
          WHEN ev.event_type = 'correction' THEN 'Correction'
          WHEN ev.event_type = 'created' THEN 'Filed'
          WHEN ev.event_type = 'whatsapp' THEN 'WhatsApp sent'
          WHEN ev.event_type = 'handoff' THEN 'Handed to sales'
          WHEN ev.event_type = 'stage_change' THEN COALESCE(NULLIF(ev.note, ''), 'Stage moved')
          ELSE COALESCE(NULLIF(ev.note, ''), 'Activity')
        END AS last_event,
        ev.created_at,
        ev.disposition_key,
        ev.revisit_at
      FROM lead_events ev
      LEFT JOIN config_dispositions d
        ON d.tenant_id = ev.tenant_id AND d.key = ev.disposition_key
      WHERE ev.lead_id = l.id
      ORDER BY ev.created_at DESC
      LIMIT 1
    ) e ON true
    ORDER BY l.created_at DESC
    LIMIT 80
  `;

  return rows.filter((r) => {
    if (!matchesSearchBox(r, q)) return false;
    if (source && r.source_key !== source) return false;
    if (stage && r.stage_key !== stage) return false;
    if (model) {
      const m = model.toLowerCase();
      const hay = `${r.model_interest ?? ""} ${r.variant_interest ?? ""}`.toLowerCase();
      if (!hay.includes(m)) return false;
    }
    const late =
      (!!r.next_action_at && new Date(r.next_action_at).getTime() < Date.now()) ||
      (!!r.first_response_due &&
        !r.first_responded_at &&
        new Date(r.first_response_due).getTime() < Date.now());
    if (overdue === "yes" && !late) return false;
    if (overdue === "no" && late) return false;
    const isParkedRow = isParked(r);
    if (parked === "yes" && !isParkedRow) return false;
    if (parked === "no" && isParkedRow) return false;
    const pivot = on === "due" ? r.next_action_at : (r.created_at ?? null);
    const day = istDay(pivot);
    if (from && (!day || day < from)) return false;
    if (to && (!day || day > to)) return false;
    return true;
  }).map((r) => ({ ...r, enquiryNo: enquiryNo(r.id) }));
}

export async function getLead(tx: Tx, id: string) {
  const [row] = await tx`
    SELECT
      l.*,
      c.full_name AS customer_name,
      c.phone,
      u.full_name AS owner_name,
      s.label AS stage_label,
      lr.label AS lost_reason_label
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN users u ON u.id = l.owner_user_id
    LEFT JOIN config_stages s ON s.tenant_id = l.tenant_id AND s.key = l.stage_key
    LEFT JOIN config_lost_reasons lr ON lr.tenant_id = l.tenant_id AND lr.key = l.lost_reason_key
    WHERE l.id = ${id}::uuid
  `;
  if (!row) return { lead: null, events: [] };
  const events = await tx`
    SELECT e.*, u.full_name AS actor_name, d.label AS disposition_label
    FROM lead_events e
    LEFT JOIN users u ON u.id = e.actor_id
    LEFT JOIN config_dispositions d ON d.tenant_id = e.tenant_id AND d.key = e.disposition_key
    WHERE e.lead_id = ${id}::uuid
    ORDER BY e.created_at DESC
  `;
  return { lead: row, events };
}

async function assertCanLog(tx: Tx, leadId: string, userId: string) {
  const [lead] = await tx<{ owner_user_id: string | null }[]>`
    SELECT owner_user_id::text FROM leads WHERE id = ${leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not on your book.");
  if (lead.owner_user_id && lead.owner_user_id !== userId) {
    throw new Error("You do not own this enquiry. Only the owner can log an outcome.");
  }
}

export async function recordDisposition(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    dispositionKey: string;
    note: string;
    revisitAt?: string;
    lostReasonKey?: string;
    callbackReason?: string;
    lostFact?: string;
    callSeconds?: number;
  },
) {
  if (!input.dispositionKey?.trim()) {
    throw new Error("Select an outcome.");
  }
  const revisitAt = revisitDayToInstant(input.revisitAt) ?? input.revisitAt;
  const callSeconds = Math.max(0, Math.floor(Number(input.callSeconds ?? 0) || 0));
  const [disp] = await tx<{
    requires_revisit: boolean;
    requires_lost_reason: boolean;
    connected: boolean;
    label: string;
  }[]>`
    SELECT requires_revisit, requires_lost_reason, connected, label
    FROM config_dispositions WHERE key = ${input.dispositionKey}
  `;
  if (!disp) throw new Error("Unknown disposition");
  await assertCanLog(tx, input.leadId, input.userId);
  if (disp.connected && !input.note.trim()) {
    throw new Error("Write what was said on this call. It is stored on the enquiry history.");
  }
  if (disp.requires_revisit && !revisitAt) {
    throw new Error("A revisit date is required for postponed.");
  }
  if (disp.requires_lost_reason && !input.lostReasonKey) {
    throw new Error("A lost reason is needed before this enquiry can be closed.");
  }
  if (disp.requires_lost_reason && input.lostReasonKey) {
    const [reason] = await tx<{ requires_fact: string; label: string }[]>`
      SELECT requires_fact, label FROM config_lost_reasons WHERE key = ${input.lostReasonKey}
    `;
    if (reason && reason.requires_fact !== "none" && !input.lostFact?.trim()) {
      throw new Error(`Record the ${reason.requires_fact} before closing as lost.`);
    }
  }
  if (needsCallbackReason(revisitAt ?? null) && !input.callbackReason?.trim()) {
    throw new Error("A reason is required when the callback is more than 14 days away.");
  }

  const [before] = await tx<{
    next_action_at: Date | null;
    stage_key: string;
    difficulty_band: string | null;
  }[]>`
    SELECT next_action_at, stage_key, difficulty_band FROM leads WHERE id = ${input.leadId}::uuid
  `;

  const scoringConnect = isScoringConnect(disp.connected, callSeconds);
  if (scoringConnect) {
    await claimOnReach(tx, input.leadId, input.userId);
  }

  const points = pointsFor({
    kind: input.dispositionKey,
    connected: disp.connected,
    callSeconds,
    difficulty: before?.difficulty_band ?? null,
  });

  const previous = {
    previous_next_action_at: before?.next_action_at
      ? new Date(before.next_action_at).toISOString()
      : null,
    previous_stage_key: before?.stage_key ?? null,
    callback_reason: input.callbackReason ?? null,
    lost_fact: input.lostFact ?? null,
    points,
    scoring_connected: scoringConnect,
    connect_floor_seconds: 20,
  };

  const [inserted] = await tx<{ id: string }[]>`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id,
      disposition_key, call_seconds, revisit_at, note, payload
    )
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'disposition',
      'USER',
      ${input.userId}::uuid,
      ${input.dispositionKey},
      ${callSeconds},
      ${revisitAt ?? null},
      ${input.note},
      ${tx.json(previous)}
    )
    RETURNING id::text
  `;

  if (disp.requires_lost_reason) {
    await tx`
      UPDATE leads
      SET lost_reason_key = ${input.lostReasonKey ?? null},
          next_action_at = NULL
      WHERE id = ${input.leadId}::uuid
    `;
  } else if (revisitAt) {
    const revisit = await scheduleNextAction(
      tx,
      input.leadId,
      new Date(revisitAt),
    );
    await tx`
      UPDATE leads SET
        next_action_at = ${revisit.toISOString()}::timestamptz
      WHERE id = ${input.leadId}::uuid
    `;
  } else {
    const next = await scheduleNextAction(
      tx,
      input.leadId,
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );
    await tx`
      UPDATE leads SET
        next_action_at = ${next.toISOString()}::timestamptz
      WHERE id = ${input.leadId}::uuid
    `;
  }

  const earned = pointsLine(points, scoringConnect, disp.connected);
  return {
    recorded: disp.label,
    eventId: inserted?.id,
    points,
    confirm: `${disp.label}. ${earned} Next action is on the queue.`,
  };
}

export async function undoDisposition(
  tx: Tx,
  input: { leadId: string; userId: string; eventId: string },
) {
  const [event] = await tx<{
    id: string;
    event_type: string;
    payload: {
      previous_next_action_at?: string | null;
      previous_stage_key?: string | null;
      from?: string | null;
    } | null;
  }[]>`
    SELECT id::text, event_type, payload
    FROM lead_events
    WHERE id = ${input.eventId}::bigint AND lead_id = ${input.leadId}::uuid
  `;
  if (!event) throw new Error("Nothing to undo.");

  const isStage = event.event_type === "stage_change";
  const undoOf = { undo_of: input.eventId };
  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'correction',
      'USER',
      ${input.userId}::uuid,
      ${isStage
        ? "Undo of last stage move. Original row stands."
        : "Undo of last disposition. Original row stands."},
      ${tx.json(undoOf)}
    )
  `;

  const prevStage =
    event.payload?.previous_stage_key ?? event.payload?.from ?? null;
  if (isStage) {
    await tx`
      UPDATE leads SET
        stage_key = COALESCE(${prevStage}, stage_key)
      WHERE id = ${input.leadId}::uuid
    `;
    return { recorded: "Correction written" };
  }

  const prev = event.payload?.previous_next_action_at ?? null;
  await tx`
    UPDATE leads SET
      next_action_at = ${prev}::timestamptz,
      stage_key = COALESCE(${prevStage}, stage_key),
      lost_reason_key = NULL
    WHERE id = ${input.leadId}::uuid
  `;
  return { recorded: "Correction written" };
}

export async function advanceStage(
  tx: Tx,
  input: { leadId: string; userId: string; to: string },
) {
  await assertCanLog(tx, input.leadId, input.userId);
  const [lead] = await tx<{ stage_key: string }[]>`
    SELECT stage_key FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not on your book.");
  const from = STAGE_KEYS.indexOf(lead.stage_key as (typeof STAGE_KEYS)[number]);
  const to = STAGE_KEYS.indexOf(input.to as (typeof STAGE_KEYS)[number]);
  if (from < 0 || to < 0) throw new Error("Unknown stage.");
  if (to !== from + 1) {
    throw new Error("Stage moves one step forward. It is not edited.");
  }
  const [inserted] = await tx<{ id: string }[]>`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'stage_change',
      'USER',
      ${input.userId}::uuid,
      ${"Moved to " + stageLabel(input.to) + "."},
      ${tx.json({
        previous_stage_key: lead.stage_key,
        from: lead.stage_key,
        to: input.to,
      })}
    )
    RETURNING id::text
  `;
  await tx`
    UPDATE leads SET stage_key = ${input.to} WHERE id = ${input.leadId}::uuid
  `;
  return {
    recorded: `Stage is now ${stageLabel(input.to)}`,
    eventId: inserted?.id,
  };
}

export async function pointsTotal(tx: Tx, userId: string) {
  const [row] = await tx<{ n: string }[]>`
    SELECT COALESCE(sum((payload->>'points')::int), 0)::text AS n
    FROM lead_events
    WHERE actor_id = ${userId}::uuid
      AND payload->>'points' IS NOT NULL
  `;
  return Number(row?.n ?? 0);
}

export async function sendWhatsApp(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    kind: WhatsAppKind;
    conversation: string;
    senderName: string;
    dealer: string;
  },
) {
  await assertCanLog(tx, input.leadId, input.userId);
  const [lead] = await tx<{
    customer_name: string;
    phone: string;
    model_interest: string | null;
    variant_interest: string | null;
    difficulty_band: string | null;
  }[]>`
    SELECT
      c.full_name AS customer_name,
      c.phone,
      l.model_interest,
      l.variant_interest,
      l.difficulty_band
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not on your book.");
  const text = whatsappMessage({
    kind: input.kind,
    customerName: lead.customer_name,
    model: lead.model_interest,
    variant: lead.variant_interest,
    conversation: input.conversation,
    dealer: input.dealer,
    sender: input.senderName,
  });
  const url = waMeUrl(lead.phone, text);
  const points = pointsFor({
    kind: "whatsapp",
    difficulty: lead.difficulty_band,
  });
  const [inserted] = await tx<{ id: string }[]>`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'whatsapp',
      'USER',
      ${input.userId}::uuid,
      ${whatsappKindLabel(input.kind) + " prepared for WhatsApp."},
      ${tx.json({
        kind: input.kind,
        text,
        points,
        channel: "whatsapp",
      })}
    )
    RETURNING id::text
  `;
  return {
    recorded: `${whatsappKindLabel(input.kind)} is on the enquiry history. WhatsApp opens with the prepared message. Attach the PDF from this phone. A WhatsApp Business API is not connected.`,
    eventId: inserted?.id,
    points,
    url,
    text,
  };
}

export async function raiseFirstResponseBreaches(tx: Tx, userId: string) {
  const rows = await tx<{ id: string; customer_name: string }[]>`
    SELECT l.id::text, c.full_name AS customer_name
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.owner_user_id = ${userId}::uuid
      AND l.first_response_due IS NOT NULL
      AND l.first_response_due < now()
      AND l.first_responded_at IS NULL
      AND l.lost_reason_key IS NULL
      AND l.stage_key <> 'delivered'
  `;
  let raised = 0;
  for (const row of rows) {
    const href = `/w/rec?id=${row.id}`;
    const existing = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM notifications
      WHERE user_id = ${userId}::uuid AND href = ${href} AND read_at IS NULL
    `;
    if (Number(existing[0]?.n) > 0) continue;
    await tx`
      INSERT INTO notifications (tenant_id, user_id, title, why, href)
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${userId}::uuid,
        ${row.customer_name + " still needs a first call"},
        'You own this enquiry and the first call is late. The clock only runs while the branch is open.',
        ${href}
      )
    `;
    raised += 1;
  }
  return { raised };
}

export async function countUnread(tx: Tx, userId: string) {
  const [row] = await tx<{ n: string }[]>`
    SELECT count(*)::text AS n FROM notifications
    WHERE user_id = ${userId}::uuid AND read_at IS NULL
  `;
  return Number(row?.n ?? 0);
}

export async function listNotifications(tx: Tx, userId: string) {
  return tx`
    SELECT * FROM notifications
    WHERE user_id = ${userId}::uuid
    ORDER BY created_at DESC
  `;
}

export async function markNotificationRead(
  tx: Tx,
  userId: string,
  id: string,
) {
  await tx`
    UPDATE notifications
    SET read_at = COALESCE(read_at, now())
    WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
  `;
  return { recorded: "Marked read" };
}

export async function markAllNotificationsRead(tx: Tx, userId: string) {
  await tx`
    UPDATE notifications
    SET read_at = COALESCE(read_at, now())
    WHERE user_id = ${userId}::uuid AND read_at IS NULL
  `;
  return { recorded: "All marked read" };
}

export async function branchHoursForUser(tx: Tx, userId: string) {
  const hours = await tx<{
    day_of_week: number;
    opens_at: string | null;
    closes_at: string | null;
    branch: string;
    timezone: string;
  }[]>`
    SELECT
      wh.day_of_week,
      wh.opens_at::text,
      wh.closes_at::text,
      b.name AS branch,
      b.timezone
    FROM users u
    JOIN positions p ON p.id = u.position_id
    JOIN branches b ON b.id = COALESCE(
      p.branch_id,
      (SELECT id FROM branches WHERE tenant_id = u.tenant_id ORDER BY name LIMIT 1)
    )
    JOIN working_hours wh ON wh.branch_id = b.id
    WHERE u.id = ${userId}::uuid
    ORDER BY wh.day_of_week
  `;
  return hours;
}
