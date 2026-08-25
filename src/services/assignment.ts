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

export async function createOwnedEnquiry(
  tx: Tx,
  input: {
    userId: string;
    customerName: string;
    phone: string;
    modelInterest: string;
    variantInterest: string;
    sourceKey: string;
    sourceDetail: string;
    expectedValuePaise: number;
  },
) {
  const digits = input.phone.replace(/\D/g, "");
  if (digits.length !== 10) {
    throw new Error("Use a ten-digit Indian mobile number.");
  }
  const name = input.customerName.trim();
  if (name.length < 2) {
    throw new Error("A customer name is required.");
  }

  const [dup] = await tx<{ lead_id: string }[]>`
    SELECT l.id::text AS lead_id
    FROM customers c
    JOIN leads l ON l.customer_id = c.id
    WHERE c.phone = ${digits}
    ORDER BY l.created_at DESC
    LIMIT 1
  `;
  if (dup) {
    const err = new Error("This number is already on the book. Open the existing record.");
    (err as Error & { existingLeadId?: string }).existingLeadId = dup.lead_id;
    throw err;
  }

  const [pos] = await tx<{ branch_id: string }[]>`
    SELECT p.branch_id::text
    FROM users u
    JOIN positions p ON p.id = u.position_id
    WHERE u.id = ${input.userId}::uuid
  `;
  if (!pos?.branch_id) {
    throw new Error("This seat has no branch. The enquiry cannot be filed.");
  }

  const { hours, timeZone, firstResponseMinutes } = await branchHours(tx, pos.branch_id);
  const arrived = new Date();
  const due = firstResponseDue(arrived, hours, firstResponseMinutes, timeZone);
  const band = difficultyAtAssignment(input.sourceKey);

  const [customer] = await tx<{ id: string }[]>`
    INSERT INTO customers (tenant_id, full_name, phone)
    VALUES (current_setting('app.tenant_id')::uuid, ${name}, ${digits})
    RETURNING id::text
  `;

  const [lead] = await tx<{ id: string }[]>`
    INSERT INTO leads (
      tenant_id, branch_id, customer_id, source_key, source_detail,
      model_interest, variant_interest, stage_key, owner_user_id, assigned_at,
      difficulty_band, difficulty_locked_at, expected_value_paise,
      first_response_due, next_action_at
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${pos.branch_id}::uuid,
      ${customer.id}::uuid,
      ${input.sourceKey},
      ${input.sourceDetail || null},
      ${input.modelInterest || null},
      ${input.variantInterest || null},
      'assigned',
      ${input.userId}::uuid,
      now(),
      ${band},
      now(),
      ${input.expectedValuePaise},
      ${due.toISOString()}::timestamptz,
      ${due.toISOString()}::timestamptz
    )
    RETURNING id::text
  `;

  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${lead.id}::uuid,
      'created',
      'USER',
      ${input.userId}::uuid,
      'Filed from Search. Owner is the seat that took the call.',
      ${tx.json({ source_key: input.sourceKey })}
    )
  `;

  return { leadId: lead.id, recorded: `${name} is on your book.` };
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
