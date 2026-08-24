import type { Tx } from "@/db/with-tenant";
import { isParked } from "@/domain/clock";

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
      e.revisit_at
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
    ORDER BY l.next_action_at ASC NULLS LAST
  `;
  return rows.filter((r) => !isParked(r) || (r.next_action_at && new Date(r.next_action_at) <= new Date()));
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
      e.revisit_at
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
      e.revisit_at
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
      c.phone
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.id = ${id}::uuid
  `;
  const events = await tx`
    SELECT * FROM lead_events WHERE lead_id = ${id}::uuid ORDER BY created_at DESC
  `;
  return { lead: row, events };
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
  if (disp.requires_revisit && !input.revisitAt) {
    throw new Error("A revisit date is required for postponed.");
  }
  if (disp.requires_lost_reason && !input.lostReasonKey) {
    throw new Error("A lost reason is needed before this enquiry can be closed.");
  }

  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id,
      disposition_key, revisit_at, note
    )
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'disposition',
      'USER',
      ${input.userId}::uuid,
      ${input.dispositionKey},
      ${input.revisitAt ?? null},
      ${input.note}
    )
  `;

  if (disp.requires_lost_reason) {
    await tx`
      UPDATE leads
      SET lost_reason_key = ${input.lostReasonKey ?? null},
          next_action_at = NULL
      WHERE id = ${input.leadId}::uuid
    `;
  } else if (disp.requires_revisit && input.revisitAt) {
    await tx`
      UPDATE leads SET next_action_at = ${input.revisitAt}::timestamptz
      WHERE id = ${input.leadId}::uuid
    `;
  } else {
    await tx`
      UPDATE leads SET
        first_responded_at = COALESCE(first_responded_at, now()),
        stage_key = CASE WHEN stage_key IN ('new','assigned') THEN 'contacted' ELSE stage_key END,
        next_action_at = now() + interval '1 day'
      WHERE id = ${input.leadId}::uuid
    `;
  }

  return { recorded: disp.label };
}

export async function listNotifications(tx: Tx, userId: string) {
  return tx`
    SELECT * FROM notifications
    WHERE user_id = ${userId}::uuid
    ORDER BY created_at DESC
  `;
}
