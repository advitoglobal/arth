import type { Tx } from "@/db/with-tenant";
import {
  difficultyAtAssignment,
  firstResponseDue,
  nextActionDue,
  type DayHours,
} from "@/domain/clock";
import { assignmentMode, listReceivers, routeEnquiry } from "@/services/floor-register";

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

/** Clocks for unowned names. No owner until a telecaller reaches the customer. */
export async function armUnownedClocks(tx: Tx) {
  const unowned = await tx<{
    id: string;
    branch_id: string;
    source_key: string;
    created_at: Date;
    first_response_due: Date | null;
  }[]>`
    SELECT id, branch_id, source_key, created_at, first_response_due
    FROM leads
    WHERE owner_user_id IS NULL
      AND lost_reason_key IS NULL
      AND first_responded_at IS NULL
      AND (first_response_due IS NULL OR next_action_at IS NULL)
    ORDER BY created_at ASC
    LIMIT 80
  `;

  let armed = 0;
  for (const lead of unowned) {
    const { hours, timeZone, firstResponseMinutes } = await branchHours(
      tx,
      lead.branch_id,
    );
    const arrived = new Date(lead.created_at);
    const due = firstResponseDue(arrived, hours, firstResponseMinutes, timeZone);
    const clockStart = due.getTime() - firstResponseMinutes * 60 * 1000;
    const delayMinutes = Math.max(
      0,
      Math.round((clockStart - arrived.getTime()) / 60000),
    );
    const band = difficultyAtAssignment(lead.source_key);

    await tx`
      UPDATE leads SET
        difficulty_band = COALESCE(difficulty_band, ${band}),
        difficulty_locked_at = COALESCE(difficulty_locked_at, now()),
        first_response_due = COALESCE(first_response_due, ${due.toISOString()}::timestamptz),
        next_action_at = COALESCE(next_action_at, ${due.toISOString()}::timestamptz)
      WHERE id = ${lead.id}::uuid
    `;

    if (delayMinutes > 0) {
      const [exists] = await tx<{ n: string }[]>`
        SELECT count(*)::text AS n FROM lead_events
        WHERE lead_id = ${lead.id}::uuid AND event_type = 'clock_deferred'
      `;
      if (Number(exists?.n ?? 0) === 0) {
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
    }
    armed += 1;
  }
  return { armed };
}

export async function claimOnReach(
  tx: Tx,
  leadId: string,
  userId: string,
) {
  const [pos] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${userId}::uuid
  `;
  if (pos?.role_key !== "tele" && pos?.role_key !== "svctele" && pos?.role_key !== "instele") {
    throw new Error("Only a telecaller can claim a new enquiry.");
  }

  const [lead] = await tx<{
    owner_user_id: string | null;
    source_key: string;
    difficulty_band: string | null;
  }[]>`
    SELECT owner_user_id::text, source_key, difficulty_band
    FROM leads WHERE id = ${leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not in your tenant.");
  if (lead.owner_user_id && lead.owner_user_id !== userId) {
    throw new Error("Another telecaller already reached this customer.");
  }

  const band = lead.difficulty_band ?? difficultyAtAssignment(lead.source_key);

  const [row] = await tx<{ id: string }[]>`
    UPDATE leads SET
      owner_user_id = ${userId}::uuid,
      assigned_at = COALESCE(assigned_at, now()),
      first_responded_at = COALESCE(first_responded_at, now()),
      difficulty_band = COALESCE(difficulty_band, ${band}),
      difficulty_locked_at = COALESCE(difficulty_locked_at, now()),
      stage_key = CASE WHEN stage_key IN ('new','assigned') THEN 'contacted' ELSE stage_key END
    WHERE id = ${leadId}::uuid
      AND (owner_user_id IS NULL OR owner_user_id = ${userId}::uuid)
    RETURNING id::text
  `;
  if (!row) {
    throw new Error("Another telecaller already reached this customer.");
  }

  if (!lead.owner_user_id) {
    await tx`
      INSERT INTO lead_events (
        tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
      ) VALUES (
        current_setting('app.tenant_id')::uuid,
        ${leadId}::uuid,
        'assigned',
        'SYSTEM',
        NULL,
        'Claimed when the telecaller reached the customer.',
        ${tx.json({ owner_user_id: userId, claimed_on: "connected_call" })}
      )
    `;
  }
  return { claimed: true };
}

export async function handoffToSales(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    note: string;
    salesUserId?: string;
    mode?: string;
    revisitAt?: string;
    qualifyDesk?: boolean;
    department?: string;
  },
) {
  const [lead] = await tx<{ branch_id: string; source_key: string; department_key: string }[]>`
    SELECT branch_id::text, source_key, department_key FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not in your tenant.");
  if (input.mode === "nurture") {
    return routeEnquiry(tx, {
      leadId: input.leadId,
      userId: input.userId,
      note: input.note,
      department: lead.department_key || "sales",
      mode: "nurture",
      revisitAt: input.revisitAt,
    });
  }
  const dept = lead.department_key || "sales";
  const mode = await assignmentMode(tx, lead.branch_id, lead.source_key);
  let salesUserId = input.salesUserId;
  if (mode === "direct" && !salesUserId) {
    const sales = await listReceivers(tx, lead.branch_id, dept);
    salesUserId = sales[0]?.id;
    if (!salesUserId) {
      throw new Error("This branch has no executive in that department to receive the enquiry.");
    }
  }
  return routeEnquiry(tx, {
    leadId: input.leadId,
    userId: input.userId,
    note: input.note,
    salesUserId: mode === "direct" ? salesUserId : undefined,
    department: input.department || dept,
    mode,
    revisitAt: input.revisitAt,
    qualifyDesk: input.qualifyDesk,
  });
}

/** Kept for proofs of the old round-robin path. The floor no longer auto-assigns. */
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

/** Master §1.3: after the first-response window, load-weighted RR. Only recent arrivals so the demonstration shared book stays. */
export async function autoAssignLapsedRecent(tx: Tx) {
  const due = await tx<{ id: string; branch_id: string; department_key: string }[]>`
    SELECT id::text, branch_id::text, department_key
    FROM leads
    WHERE owner_user_id IS NULL
      AND first_responded_at IS NULL
      AND first_response_due IS NOT NULL
      AND first_response_due < now()
      AND created_at > now() - interval '7 days'
      AND escalate_level <> 'none'
      AND escalate_at IS NOT NULL
      AND escalate_at < now() - interval '30 minutes'
      AND lost_reason_key IS NULL
      AND COALESCE(is_not_enquiry, false) = false
    ORDER BY first_response_due ASC
    LIMIT 20
  `;
  let n = 0;
  for (const lead of due) {
    const role =
      lead.department_key === "service"
        ? "svctele"
        : lead.department_key === "insurance"
          ? "instele"
          : "tele";
    const [owner] = await tx<{ id: string }[]>`
      SELECT u.id
      FROM users u
      WHERE u.role_key = ${role}
        AND u.is_active = true
        AND u.position_id IN (
          SELECT id FROM positions WHERE branch_id = ${lead.branch_id}::uuid
        )
      ORDER BY (
        SELECT count(*) FROM leads l
        WHERE l.owner_user_id = u.id
          AND l.lost_reason_key IS NULL
          AND COALESCE(l.is_not_enquiry, false) = false
          AND l.stage_key <> 'delivered'
      ) ASC, u.full_name ASC
      LIMIT 1
    `;
    if (!owner) continue;
    await tx`
      UPDATE leads SET
        owner_user_id = ${owner.id}::uuid,
        assigned_at = now(),
        pool_open = false,
        stage_key = CASE WHEN stage_key = 'new' THEN 'assigned' ELSE stage_key END
      WHERE id = ${lead.id}::uuid AND owner_user_id IS NULL
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
        'Auto-assigned after the first-response window. Load-weighted round robin. The team leader was told.',
        ${tx.json({ owner_user_id: owner.id, rule: "first_response_lapse" })}
      )
    `;
    n += 1;
  }
  return n;
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
    departmentKey?: string;
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

  const [dup] = await tx<{ lead_id: string; department_key: string }[]>`
    SELECT lead_id::text, department_key FROM arth_phone_duplicates(${digits}) LIMIT 1
  `;
  if (dup) {
    const dept =
      dup.department_key === "service"
        ? "Service"
        : dup.department_key === "insurance"
          ? "Insurance"
          : "Sales";
    const err = new Error(`This number is already on the ${dept} book. Open the existing record.`);
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

  try {
    const [customer] = await tx<{ id: string }[]>`
      INSERT INTO customers (tenant_id, full_name, phone)
      VALUES (current_setting('app.tenant_id')::uuid, ${name}, ${digits})
      RETURNING id::text
    `;

    const [role] = await tx<{ role_key: string }[]>`
      SELECT role_key FROM users WHERE id = ${input.userId}::uuid
    `;
    const requested = input.departmentKey?.trim() ?? "";
    const department =
      requested === "service" || requested === "insurance" || requested === "sales"
        ? requested
        : role?.role_key === "svctele"
          ? "service"
          : role?.role_key === "instele"
            ? "insurance"
            : "sales";
    const consentPurpose =
      department === "service"
        ? "service_reminders"
        : department === "insurance"
          ? "insurance_renewal"
          : "sales_enquiry";

    const [lead] = await tx<{ id: string }[]>`
      INSERT INTO leads (
        tenant_id, branch_id, customer_id, source_key, source_detail,
        model_interest, variant_interest, stage_key, owner_user_id, assigned_at,
        difficulty_band, difficulty_locked_at, expected_value_paise,
        first_response_due, next_action_at, department_key, intake_kind
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
        ${due.toISOString()}::timestamptz,
        ${department},
        'filed'
      )
      RETURNING id::text
    `;

    await tx`
      INSERT INTO customer_consents (tenant_id, customer_id, purpose_key, granted)
      VALUES (current_setting('app.tenant_id')::uuid, ${customer.id}::uuid, ${consentPurpose}, true)
      ON CONFLICT DO NOTHING
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
        'Filed at the desk. Owner is the seat that took the call.',
        ${tx.json({ source_key: input.sourceKey })}
      )
    `;

    return { leadId: lead.id, recorded: `${name} is on your book.` };
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
    if (code === "23505") {
      throw new Error("This number is already on the book at this branch.");
    }
    throw err;
  }
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

export async function placeWithTelecaller(
  tx: Tx,
  input: { leadId: string; teleId: string; actorId: string },
) {
  const [actor] = await tx<{ role_key: string; branch_id: string | null }[]>`
    SELECT u.role_key, p.branch_id::text
    FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = ${input.actorId}::uuid AND u.is_active
  `;
  if (!actor || !["mgr", "owner", "ops"].includes(actor.role_key)) {
    throw new Error("Only the digital desk, the dealer principal, or Advito support can place a name.");
  }

  const [tele] = await tx<{ role_key: string; branch_id: string | null; full_name: string }[]>`
    SELECT u.role_key, p.branch_id::text, u.full_name
    FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = ${input.teleId}::uuid AND u.is_active
  `;
  if (!tele || tele.role_key !== "tele") {
    throw new Error("Place the name with a telecaller at this dealer.");
  }
  if (actor.role_key === "mgr" && actor.branch_id && tele.branch_id !== actor.branch_id) {
    throw new Error("The digital desk can only place names on this branch.");
  }

  const [lead] = await tx<{ id: string; branch_id: string; owner_user_id: string | null }[]>`
    SELECT id::text, branch_id::text, owner_user_id::text
    FROM leads
    WHERE id = ${input.leadId}::uuid
      AND lost_reason_key IS NULL
  `;
  if (!lead) throw new Error("This enquiry is not in your bucket.");
  if (actor.role_key === "mgr" && actor.branch_id && lead.branch_id !== actor.branch_id) {
    throw new Error("The digital desk can only place names on this branch.");
  }

  const [row] = await tx<{ id: string }[]>`
    UPDATE leads SET
      owner_user_id = ${input.teleId}::uuid,
      assigned_at = COALESCE(assigned_at, now()),
      stage_key = CASE WHEN stage_key = 'new' THEN 'assigned' ELSE stage_key END
    WHERE id = ${input.leadId}::uuid
    RETURNING id::text
  `;
  if (!row) throw new Error("This enquiry is not in your bucket.");

  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    ) VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'assigned',
      'USER',
      ${input.actorId}::uuid,
      ${"Placed with " + tele.full_name + " by the digital desk."},
      ${tx.json({
        owner_user_id: input.teleId,
        previous_owner_user_id: lead.owner_user_id,
        placed_by: actor.role_key,
      })}
    )
  `;

  return { recorded: `Placed with ${tele.full_name}.` };
}
