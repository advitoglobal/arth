import type { Tx } from "@/db/with-tenant";
import { isOnDayQueue, isParked, needsCallbackReason, STAGE_KEYS } from "@/domain/clock";
import { scheduleNextAction } from "@/services/assignment";

export type LeadRow = {
  id: string;
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
      e.note AS last_event,
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
      SELECT note, created_at, disposition_key, revisit_at
      FROM lead_events
      WHERE lead_id = l.id
      ORDER BY created_at DESC
      LIMIT 1
    ) e ON true
    WHERE l.owner_user_id = ${ownerId}
      AND l.stage_key <> 'delivered'
      AND l.lost_reason_key IS NULL
    ORDER BY l.next_action_at ASC NULLS LAST
  `;
  return rows.filter((r) => {
    if (isParked(r) && r.next_action_at && new Date(r.next_action_at) > new Date()) {
      return false;
    }
    return isOnDayQueue(r.next_action_at);
  });
}

export async function listPipeline(tx: Tx, ownerId: string) {
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
      e.note AS last_event,
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
      SELECT note, created_at, disposition_key, revisit_at
      FROM lead_events
      WHERE lead_id = l.id
      ORDER BY created_at DESC
      LIMIT 1
    ) e ON true
    WHERE l.owner_user_id = ${ownerId}
    ORDER BY l.expected_value_paise DESC
  `;
}

export async function searchByPhone(tx: Tx, q: string) {
  const needle = q.replace(/\D/g, "");
  if (needle.length < 4) return [];
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
      e.note AS last_event,
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
      SELECT note, created_at, disposition_key, revisit_at
      FROM lead_events
      WHERE lead_id = l.id
      ORDER BY created_at DESC
      LIMIT 1
    ) e ON true
    WHERE c.phone LIKE ${"%" + needle + "%"}
    ORDER BY l.created_at DESC
    LIMIT 20
  `;
}

export async function getLead(tx: Tx, id: string) {
  const [row] = await tx`
    SELECT
      l.*,
      c.full_name AS customer_name,
      c.phone,
      u.full_name AS owner_name,
      s.label AS stage_label
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN users u ON u.id = l.owner_user_id
    LEFT JOIN config_stages s ON s.tenant_id = l.tenant_id AND s.key = l.stage_key
    WHERE l.id = ${id}::uuid
  `;
  const events = await tx`
    SELECT e.*, u.full_name AS actor_name
    FROM lead_events e
    LEFT JOIN users u ON u.id = e.actor_id
    WHERE e.lead_id = ${id}::uuid
    ORDER BY e.created_at DESC
  `;
  return { lead: row, events };
}

async function assertOwner(tx: Tx, leadId: string, userId: string) {
  const [lead] = await tx<{ owner_user_id: string | null }[]>`
    SELECT owner_user_id::text FROM leads WHERE id = ${leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not in your tenant.");
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
  },
) {
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
  await assertOwner(tx, input.leadId, input.userId);
  if (disp.requires_revisit && !input.revisitAt) {
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
  if (needsCallbackReason(input.revisitAt ?? null) && !input.callbackReason?.trim()) {
    throw new Error("A reason is required when the callback is more than 14 days away.");
  }

  const [before] = await tx<{ next_action_at: Date | null; stage_key: string }[]>`
    SELECT next_action_at, stage_key FROM leads WHERE id = ${input.leadId}::uuid
  `;

  const previous = {
    previous_next_action_at: before?.next_action_at
      ? new Date(before.next_action_at).toISOString()
      : null,
    previous_stage_key: before?.stage_key ?? null,
    callback_reason: input.callbackReason ?? null,
    lost_fact: input.lostFact ?? null,
  };

  const [inserted] = await tx<{ id: string }[]>`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id,
      disposition_key, revisit_at, note, payload
    )
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'disposition',
      'USER',
      ${input.userId}::uuid,
      ${input.dispositionKey},
      ${input.revisitAt ?? null},
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
  } else if (input.revisitAt) {
    const revisit = await scheduleNextAction(
      tx,
      input.leadId,
      new Date(input.revisitAt),
    );
    await tx`
      UPDATE leads SET
        first_responded_at = COALESCE(first_responded_at, now()),
        stage_key = CASE WHEN stage_key IN ('new','assigned') THEN 'contacted' ELSE stage_key END,
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
        first_responded_at = COALESCE(first_responded_at, now()),
        stage_key = CASE WHEN stage_key IN ('new','assigned') THEN 'contacted' ELSE stage_key END,
        next_action_at = ${next.toISOString()}::timestamptz
      WHERE id = ${input.leadId}::uuid
    `;
  }

  return { recorded: disp.label, eventId: inserted?.id };
}

export async function undoDisposition(
  tx: Tx,
  input: { leadId: string; userId: string; eventId: string },
) {
  const [event] = await tx<{
    id: string;
    payload: {
      previous_next_action_at?: string | null;
      previous_stage_key?: string | null;
    } | null;
  }[]>`
    SELECT id::text, payload
    FROM lead_events
    WHERE id = ${input.eventId}::bigint AND lead_id = ${input.leadId}::uuid
  `;
  if (!event) throw new Error("Nothing to undo.");

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
      'Undo of last disposition. Original row stands.',
      ${tx.json(undoOf)}
    )
  `;

  const prev = event.payload?.previous_next_action_at ?? null;
  const stage = event.payload?.previous_stage_key ?? null;
  await tx`
    UPDATE leads SET
      next_action_at = ${prev}::timestamptz,
      stage_key = COALESCE(${stage}, stage_key),
      lost_reason_key = NULL
    WHERE id = ${input.leadId}::uuid
  `;
  return { recorded: "Correction written" };
}

export async function advanceStage(
  tx: Tx,
  input: { leadId: string; userId: string; to: string },
) {
  await assertOwner(tx, input.leadId, input.userId);
  const [lead] = await tx<{ stage_key: string }[]>`
    SELECT stage_key FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not in your tenant.");
  const from = STAGE_KEYS.indexOf(lead.stage_key as (typeof STAGE_KEYS)[number]);
  const to = STAGE_KEYS.indexOf(input.to as (typeof STAGE_KEYS)[number]);
  if (from < 0 || to < 0) throw new Error("Unknown stage.");
  if (to !== from + 1) {
    throw new Error("Stage moves one step forward. It is not edited.");
  }
  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'stage_change',
      'USER',
      ${input.userId}::uuid,
      ${"Moved to " + input.to.replaceAll("_", " ") + "."},
      ${tx.json({ from: lead.stage_key, to: input.to })}
    )
  `;
  await tx`
    UPDATE leads SET stage_key = ${input.to} WHERE id = ${input.leadId}::uuid
  `;
  return { recorded: `Stage is now ${input.to.replaceAll("_", " ")}` };
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
        ${row.customer_name + " is past first response"},
        'You own this enquiry and first response is overdue. The clock ran through working hours.',
        ${href}
      )
    `;
    raised += 1;
  }
  return { raised };
}

export async function listNotifications(tx: Tx, userId: string) {
  return tx`
    SELECT * FROM notifications
    WHERE user_id = ${userId}::uuid
    ORDER BY created_at DESC
  `;
}
