import type { Tx } from "@/db/with-tenant";
import {
  difficultyAtAssignment,
  firstResponseDue,
  nextActionDue,
  type DayHours,
} from "@/domain/clock";

async function branchHours(tx: Tx, branchId: string): Promise<{
  hours: DayHours[];
  timeZone: string;
  firstResponseMinutes: number;
}> {
  const hours = await tx<DayHours[]>`
    SELECT day_of_week AS "dayOfWeek",
           opens_at::text AS "opensAt",
           closes_at::text AS "closesAt"
    FROM working_hours
    WHERE branch_id = ${branchId}::uuid
    ORDER BY day_of_week
  `;
  const [branch] = await tx<{ timezone: string }[]>`
    SELECT timezone FROM branches WHERE id = ${branchId}::uuid
  `;
  const [th] = await tx<{ value_int: number }[]>`
    SELECT value_int FROM config_thresholds WHERE key = 'first_response_minutes'
  `;
  return {
    hours: hours.map((h) => ({
      dayOfWeek: Number(h.dayOfWeek),
      opensAt: h.opensAt,
      closesAt: h.closesAt,
    })),
    timeZone: branch?.timezone ?? "Asia/Kolkata",
    firstResponseMinutes: th?.value_int ?? 30,
  };
}

export async function assignUnowned(tx: Tx, actorUserId: string) {
  const unowned = await tx<{
    id: string;
    branch_id: string;
    source_key: string;
    created_at: Date;
  }[]>`
    SELECT id, branch_id, source_key, created_at
    FROM leads
    WHERE owner_user_id IS NULL
      AND lost_reason_key IS NULL
    ORDER BY created_at ASC
  `;

  const assigned: string[] = [];

  for (const lead of unowned) {
    const { hours, timeZone, firstResponseMinutes } = await branchHours(
      tx,
      lead.branch_id,
    );
    const arrived = new Date(lead.created_at);
    const due = firstResponseDue(arrived, hours, firstResponseMinutes, timeZone);
    const clockStart = due.getTime() - firstResponseMinutes * 60 * 1000;
    const delayMinutes = Math.max(0, Math.round((clockStart - arrived.getTime()) / 60000));

    const [owner] = await tx<{ id: string }[]>`
      SELECT u.id
      FROM users u
      WHERE u.role_key = 'tele'
        AND u.is_active = true
        AND u.position_id IN (
          SELECT id FROM positions WHERE branch_id = ${lead.branch_id}::uuid
        )
      ORDER BY (
        SELECT count(*) FROM leads l
        WHERE l.owner_user_id = u.id
          AND l.lost_reason_key IS NULL
          AND l.stage_key <> 'delivered'
      ) ASC, u.full_name ASC
      LIMIT 1
    `;
    if (!owner) continue;

    const band = difficultyAtAssignment(lead.source_key);

    await tx`
      UPDATE leads SET
        owner_user_id = ${owner.id}::uuid,
        assigned_at = now(),
        stage_key = 'assigned',
        difficulty_band = ${band},
        difficulty_locked_at = now(),
        first_response_due = ${due.toISOString()}::timestamptz,
        next_action_at = ${due.toISOString()}::timestamptz
      WHERE id = ${lead.id}::uuid
    `;

    await tx`
      INSERT INTO lead_events (
        tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
      ) VALUES (
        current_setting('app.tenant_id')::uuid,
        ${lead.id}::uuid,
        'assigned',
        'SYSTEM',
        NULL,
        'Round robin by current load.',
        ${tx.json({ owner_user_id: owner.id, delay_minutes: delayMinutes, charged_to: "branch" })}
      )
    `;

    if (delayMinutes > 0) {
      await tx`
        INSERT INTO lead_events (
          tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
        ) VALUES (
          current_setting('app.tenant_id')::uuid,
          ${lead.id}::uuid,
          'clock_deferred',
          'SYSTEM',
          NULL,
          'Clock starts at next working open. Delay is on the branch, not the telecaller.',
          ${tx.json({ delay_minutes: delayMinutes, charged_to: "branch" })}
        )
      `;
    }

    await tx`
      INSERT INTO notifications (tenant_id, user_id, title, why, href)
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${owner.id}::uuid,
        'An enquiry was assigned to you',
        'Round robin by current load. Delay before open hours is charged to the branch, not to you.',
        ${"/w/tele?id=" + lead.id}
      )
    `;

    assigned.push(lead.id);
  }

  return { assigned: assigned.length, actorUserId };
}

export async function scheduleNextAction(
  tx: Tx,
  leadId: string,
  from: Date,
) {
  const [lead] = await tx<{ branch_id: string }[]>`
    SELECT branch_id FROM leads WHERE id = ${leadId}::uuid
  `;
  if (!lead) return from;
  const { hours, timeZone } = await branchHours(tx, lead.branch_id);
  return nextActionDue(from, hours, timeZone);
}
