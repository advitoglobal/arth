import type { Tx } from "@/db/with-tenant";
import {
  needsCallbackReason,
  revisitDayToInstant,
  STAGE_KEYS,
} from "@/domain/clock";
import { isScoringConnect, pointsFor, pointsLine } from "@/domain/points";
import { isPersonalRole } from "@/domain/visibility";
import { claimOnReach, scheduleNextAction } from "@/services/assignment";
import { recordMovement, applyConcealmentPenalties, escalateHandoverContact } from "@/services/floor-register";
import { stagesFor, SALES_STAGES, SERVICE_STAGES, INSURANCE_STAGES } from "@/domain/ladders";
import { stageLabel, enquiryNo } from "@/lib/labels";
import { junkReason } from "@/domain/junk";
import { classifyQueueBand, type QueueBandKey } from "@/domain/queue-bands";
import { hadRecentDial } from "@/services/conversion";
import { scheduleTestDrive } from "@/services/conversion";
import { type WhatsAppKind } from "@/lib/whatsapp";
import { sendWhatsAppLoop } from "@/services/whatsapp-loop";

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
  department_key?: string | null;
  intake_kind?: string | null;
  intake_batch_name?: string | null;
  intake_batch_at?: Date | null;
  pool_open?: boolean | null;
  is_not_enquiry?: boolean | null;
  queue_band?: QueueBandKey;
  queue_reason?: string;
};

export const LIST_LIMIT = 80;
export const QUEUE_LIMIT = 200;
export const LATE_LIST_LIMIT = 40;

export async function hydrateLeads(tx: Tx, ids: string[]) {
  if (ids.length === 0) return [] as LeadRow[];
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
      COALESCE(e.disposition_key, l.last_disposition_key) AS disposition_key,
      COALESCE(e.revisit_at, l.last_revisit_at) AS revisit_at,
      l.first_response_due,
      l.first_responded_at,
      l.lost_reason_key,
      l.created_at AS created_at,
      l.department_key,
      l.intake_kind,
      l.intake_batch_name,
      l.intake_batch_at,
      l.pool_open,
      l.is_not_enquiry
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN config_stages s ON s.tenant_id = l.tenant_id AND s.key = l.stage_key
      AND (s.department_key = COALESCE(l.department_key, 'sales')
        OR (s.department_key = 'sales' AND l.stage_key IN ('new','assigned','contacted','delivered')))
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
    WHERE l.id = ANY(${ids}::uuid[])
  `;
  const rank = new Map(ids.map((id, i) => [id, i]));
  return rows.sort((a, b) => (rank.get(String(a.id)) ?? 0) - (rank.get(String(b.id)) ?? 0));
}

export async function listQueue(tx: Tx, ownerId: string) {
  await escalateHandoverContact(tx);
  const found = await tx<{ id: string }[]>`
    SELECT x AS id FROM arth_queue_lead_ids(${ownerId}::uuid) AS x
  `;
  const rows = await hydrateLeads(tx, found.map((r) => String(r.id)));
  const now = new Date();
  return rows.map((row) => {
    const band = classifyQueueBand(row, now);
    return { ...row, queue_band: band.key, queue_reason: band.reason };
  });
}

export type PipelineFilters = {
  stage?: string;
  source?: string;
  overdue?: string;
  parked?: string;
  owner?: string;
  limit?: number;
};

export type PipelineOwner = { id: string; name: string };

export type PipelinePage = {
  rows: LeadRow[];
  total: number;
  counts: Record<string, number>;
  limit: number;
  owners: PipelineOwner[];
  filters: {
    stage: string;
    source: string;
    overdue: string;
    parked: string;
    owner: string;
  };
};

function presentOpt(value?: string) {
  const v = value?.trim() ?? "";
  return v.length ? v : "";
}

export async function listPipeline(
  tx: Tx,
  ownerId: string,
  opts?: PipelineFilters,
): Promise<PipelinePage> {
  await escalateHandoverContact(tx);
  const [viewer] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${ownerId}::uuid
  `;
  if (!viewer) {
    throw new Error("This seat does not belong to this dealer.");
  }
  const personal = isPersonalRole(viewer.role_key);
  const limit = Math.min(200, Math.max(1, opts?.limit ?? LIST_LIMIT));
  const stage = presentOpt(opts?.stage);
  const source = presentOpt(opts?.source);
  const overdue = presentOpt(opts?.overdue);
  const parked = presentOpt(opts?.parked);
  const ownerRaw = presentOpt(opts?.owner);
  const known = new Set<string>([...SALES_STAGES, ...SERVICE_STAGES, ...INSURANCE_STAGES, ...STAGE_KEYS]);
  const stageFilter = known.has(stage) ? stage : "";
  const ownerFilter = /^[0-9a-f-]{36}$/i.test(ownerRaw) ? ownerRaw : "";
  const ownerArg = ownerFilter || null;
  const sourceArg = source || null;
  const overdueArg = overdue || null;
  const parkedArg = parked || null;

  const grouped = await tx<{ stage_key: string; n: string }[]>`
    SELECT stage_key, n::text FROM arth_pipeline_counts(
      ${personal},
      ${sourceArg},
      ${overdueArg},
      ${parkedArg},
      ${ownerArg}::uuid
    )
  `;
  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of grouped) {
    const n = Number(row.n);
    counts[row.stage_key] = n;
    total += n;
  }

  const found = await tx<{ id: string }[]>`
    SELECT x AS id FROM arth_pipeline_lead_ids(
      ${personal},
      ${stageFilter},
      ${limit},
      ${sourceArg},
      ${overdueArg},
      ${parkedArg},
      ${ownerArg}::uuid
    ) AS x
  `;
  const rows = await hydrateLeads(tx, found.map((r) => String(r.id)));
  const owners = personal
    ? []
    : await tx<PipelineOwner[]>`
        SELECT DISTINCT u.id::text AS id, u.full_name AS name
        FROM users u
        JOIN leads l ON l.owner_user_id = u.id
        ORDER BY u.full_name
      `;
  return {
    rows,
    total,
    counts,
    limit,
    owners,
    filters: {
      stage: stageFilter,
      source,
      overdue,
      parked,
      owner: ownerFilter,
    },
  };
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

function present(value?: string) {
  const v = value?.trim() ?? "";
  return v.length ? v : "";
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

  const digits = q.replace(/\D/g, "");
  const compact = q.replace(/-/g, "");
  const text = q.trim();
  const letters = text.replace(/\d/g, "").replace(/\W/g, "").trim();
  const enquiry8 = compact.length === 8 && /^[0-9a-f]+$/i.test(compact);
  const enquiryLong = compact.length >= 12 && /^[0-9a-f-]+$/i.test(compact);
  const phoneOnly = digits.length >= 4;
  const textSearch = letters.length >= 2 && !enquiry8;

  const phoneArg = phoneOnly && !textSearch ? digits : null;
  const nameArg = textSearch ? text : null;
  const enquiry8Arg = enquiry8 ? compact.toUpperCase() : null;
  const enquiryTailArg = enquiryLong ? compact.toLowerCase().replace(/-/g, "") : null;
  const sourceArg = source || null;
  const stageArg = stage || null;
  const modelArg = model || null;
  const overdueArg = overdue || null;
  const parkedArg = parked || null;
  const fromArg = from || null;
  const toArg = to || null;
  const onArg = on || null;

  const found = await tx<{ id: string }[]>`
    SELECT x AS id FROM arth_search_lead_ids(
      ${phoneArg},
      ${nameArg},
      ${enquiry8Arg},
      ${enquiryTailArg},
      ${sourceArg},
      ${stageArg},
      ${modelArg},
      ${overdueArg},
      ${parkedArg},
      ${fromArg},
      ${toArg},
      ${onArg}
    ) AS x
  `;
  const rows = await hydrateLeads(tx, found.map((r) => String(r.id)));
  return rows.map((r) => ({ ...r, enquiryNo: enquiryNo(r.id) }));
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
    LIMIT 400
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
    notEnquiryReason?: string;
    mergeLeadId?: string;
    routeDepartment?: string;
    meetingAt?: string;
    meetingPlace?: string;
    meetingBranch?: string;
    testdriveSlot?: string;
    testdriveVariant?: string;
    quoteRupees?: string;
    quoteVariant?: string;
    quoteValidUntil?: string;
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
  const needsRevisit =
    Boolean(disp.requires_revisit) || disp.label.toLowerCase().includes("callback");
  if (disp.connected && !input.note.trim()) {
    throw new Error("Write what was said on this call. It is stored on the enquiry history.");
  }
  if (needsRevisit && !revisitAt) {
    throw new Error("Pick the revisit day.");
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
  if (input.dispositionKey === "not_an_enquiry") {
    const reason = junkReason(input.notEnquiryReason ?? "");
    if (!reason) throw new Error("Pick why this is not an enquiry.");
    const [attempts] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM lead_events
      WHERE lead_id = ${input.leadId}::uuid
        AND event_type IN ('disposition', 'call_attempt')
    `;
    if (Number(attempts?.n ?? 0) < 2) {
      throw new Error("Two attempts are required before this can be marked not an enquiry.");
    }
    if (reason.key === "duplicate" && !input.mergeLeadId) {
      throw new Error("Name the existing enquiry this duplicates. Arth will not merge two households by itself.");
    }
    if (reason.key === "route_other_dept" && !["sales", "service", "insurance"].includes(input.routeDepartment ?? "")) {
      throw new Error("Name the department this customer belongs in.");
    }
  }
  if (input.dispositionKey === "meeting_booked") {
    if (!input.meetingAt?.trim() || !input.meetingPlace?.trim()) {
      throw new Error("Meeting needs a date, a time, and whether it is showroom or home.");
    }
  }
  if (input.dispositionKey === "testdrive_booked") {
    if (!input.testdriveSlot?.trim()) {
      throw new Error("Test drive needs a slot.");
    }
  }
  if (input.dispositionKey === "quotation_sent") {
    const rupees = Number(String(input.quoteRupees ?? "").replace(/,/g, ""));
    if (!Number.isFinite(rupees) || rupees <= 0 || !input.quoteVariant?.trim() || !input.quoteValidUntil?.trim()) {
      throw new Error("Quotation needs amount in rupees, variant, and validity date.");
    }
  }

  const [before] = await tx<{
    next_action_at: Date | null;
    stage_key: string;
    difficulty_band: string | null;
  }[]>`
    SELECT next_action_at, stage_key, difficulty_band FROM leads WHERE id = ${input.leadId}::uuid
  `;

  const dialled = await hadRecentDial(tx, input.leadId, input.userId);
  const scoringConnect = isScoringConnect(disp.connected, callSeconds) && dialled;
  if (isScoringConnect(disp.connected, callSeconds) && !dialled) {
    // Timer without Dial is activity theatre. Outcome still writes. Points do not.
  }
  if (scoringConnect) {
    await claimOnReach(tx, input.leadId, input.userId);
    await tx`
      UPDATE leads SET handover_contacted_at = COALESCE(handover_contacted_at, now())
      WHERE id = ${input.leadId}::uuid
        AND owner_user_id = ${input.userId}::uuid
        AND handed_on_at IS NOT NULL
        AND handover_contacted_at IS NULL
    `;
  }

  const points = scoringConnect || !disp.connected
    ? pointsFor({
        kind: input.dispositionKey,
        connected: disp.connected,
        callSeconds,
        difficulty: before?.difficulty_band ?? null,
      })
    : 0;
  const earnedPoints = disp.connected && !dialled ? 0 : points;

  const previous = {
    previous_next_action_at: before?.next_action_at
      ? new Date(before.next_action_at).toISOString()
      : null,
    previous_stage_key: before?.stage_key ?? null,
    callback_reason: input.callbackReason ?? null,
    lost_fact: input.lostFact ?? null,
    points: earnedPoints,
    scoring_connected: scoringConnect,
    connect_floor_seconds: 20,
    dialled,
    not_enquiry_reason: input.notEnquiryReason ?? null,
    merge_lead_id: input.mergeLeadId ?? null,
    route_department: input.routeDepartment ?? null,
    duration_source: "desk_simulation",
    meeting_at: input.meetingAt ?? null,
    meeting_place: input.meetingPlace ?? null,
    testdrive_slot: input.testdriveSlot ?? null,
    quote_paise:
      input.dispositionKey === "quotation_sent"
        ? Math.round(Number(String(input.quoteRupees ?? "0").replace(/,/g, "")) * 100)
        : null,
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
          last_disposition_key = ${input.dispositionKey},
          next_action_at = NULL,
          escalate_level = 'none',
          escalate_at = NULL
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
        next_action_at = ${revisit.toISOString()}::timestamptz,
        last_disposition_key = ${input.dispositionKey},
        escalate_level = 'none',
        escalate_at = NULL
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
        next_action_at = ${next.toISOString()}::timestamptz,
        last_disposition_key = ${input.dispositionKey},
        escalate_level = 'none',
        escalate_at = NULL
      WHERE id = ${input.leadId}::uuid
    `;
  }

  if (input.dispositionKey === "not_an_enquiry") {
    const reason = junkReason(input.notEnquiryReason ?? "");
    if (reason?.closes) {
      await tx`
        UPDATE leads SET
          is_not_enquiry = true,
          not_enquiry_reason = ${reason.key},
          next_action_at = NULL,
          escalate_level = 'none',
          escalate_at = NULL
        WHERE id = ${input.leadId}::uuid
      `;
    } else if (reason?.key === "route_other_dept") {
      await tx`
        UPDATE leads SET
          department_key = ${input.routeDepartment ?? "sales"},
          not_enquiry_reason = 'route_other_dept'
        WHERE id = ${input.leadId}::uuid
      `;
    } else if (reason?.key === "duplicate") {
      await tx`
        UPDATE leads SET
          not_enquiry_reason = 'duplicate',
          next_action_at = NULL
        WHERE id = ${input.leadId}::uuid
      `;
    }
  }

  if (input.dispositionKey === "meeting_booked" && input.meetingAt) {
    const place = input.meetingPlace === "home" ? "home" : "showroom";
    await tx`
      UPDATE leads SET
        meeting_at = ${input.meetingAt}::timestamptz,
        meeting_kind = ${place},
        stage_key = CASE WHEN stage_key IN ('new','assigned','contacted') THEN 'meeting' ELSE stage_key END
      WHERE id = ${input.leadId}::uuid
    `;
  }
  if (input.dispositionKey === "testdrive_booked" && input.testdriveSlot) {
    await scheduleTestDrive(tx, {
      leadId: input.leadId,
      actorId: input.userId,
      slotAt: input.testdriveSlot,
    });
  }
  if (input.dispositionKey === "quotation_sent") {
    const paise = Math.round(Number(String(input.quoteRupees ?? "0").replace(/,/g, "")) * 100);
    await tx`
      INSERT INTO quotations (tenant_id, lead_id, frozen, actor_id)
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${input.leadId}::uuid,
        ${tx.json({
          variant: input.quoteVariant,
          on_road_paise: paise,
          valid_until: input.quoteValidUntil,
        })},
        ${input.userId}::uuid
      )
    `;
    await tx`
      UPDATE leads SET
        stage_key = CASE WHEN stage_key IN ('new','assigned','contacted','meeting','test_drive') THEN 'quotation' ELSE stage_key END
      WHERE id = ${input.leadId}::uuid
    `;
  }

  const earned = pointsLine(earnedPoints, scoringConnect, disp.connected);
  await recordMovement(tx, {
    userId: input.userId,
    amount: earnedPoints,
    reasonKey: input.dispositionKey,
    note: `${disp.label}${scoringConnect ? "" : disp.connected ? " (under 20 seconds, no points)" : ""}`,
    leadId: input.leadId,
  });
  return {
    recorded: disp.label,
    eventId: inserted?.id,
    points: earnedPoints,
    confirm: `${disp.label}. ${earned} Next action is on the queue.`,
  };
}

export async function skipWrapUp(
  tx: Tx,
  input: { leadId: string; userId: string; reason: string },
) {
  const reason = input.reason.trim();
  if (reason.length < 4) {
    throw new Error("Say why the next name is loading without an outcome.");
  }
  await assertCanLog(tx, input.leadId, input.userId);
  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'wrap_skip',
      'USER',
      ${input.userId}::uuid,
      ${reason},
      ${tx.json({ wrap_up_seconds: 90 })}
    )
  `;
  return { recorded: "Wrap-up skipped. The skip is on the ledger." };
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
  const [lead] = await tx<{ stage_key: string; department_key: string }[]>`
    SELECT stage_key, department_key FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not on your book.");
  const ladder = stagesFor(lead.department_key);
  const fromKey = lead.stage_key === "qualified" ? "meeting" : lead.stage_key;
  const from = ladder.indexOf(fromKey);
  const to = ladder.indexOf(input.to);
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
    conversation?: string;
    senderName: string;
    dealer: string;
  },
) {
  return sendWhatsAppLoop(tx, {
    leadId: input.leadId,
    userId: input.userId,
    kind: input.kind,
    senderName: input.senderName,
    dealer: input.dealer,
  });
}

export async function raiseFirstResponseBreaches(tx: Tx, userId: string) {
  const inserted = await tx<{ n: string }[]>`
    WITH due AS (
      SELECT l.id, c.full_name AS customer_name
      FROM leads l
      JOIN customers c ON c.id = l.customer_id
      WHERE l.owner_user_id = ${userId}::uuid
        AND l.first_response_due IS NOT NULL
        AND l.first_response_due < now()
        AND l.first_responded_at IS NULL
        AND l.lost_reason_key IS NULL
        AND l.stage_key <> 'delivered'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = ${userId}::uuid
            AND n.href = '/w/rec?id=' || l.id::text
            AND n.read_at IS NULL
        )
      LIMIT 40
    )
    INSERT INTO notifications (tenant_id, user_id, title, why, href)
    SELECT
      current_setting('app.tenant_id')::uuid,
      ${userId}::uuid,
      due.customer_name || ' still needs a first call',
      'You own this enquiry and the first call is late. The clock only runs while the branch is open.',
      '/w/rec?id=' || due.id::text
    FROM due
    RETURNING id
  `;
  const result = { raised: inserted.length };
  await applyConcealmentPenalties(tx, userId);
  return result;
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
    LIMIT 80
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
