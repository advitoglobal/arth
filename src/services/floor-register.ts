import type { Tx } from "@/db/with-tenant";
import { firstResponseDue, revisitDayToInstant, type DayHours } from "@/domain/clock";
import { deskAssignmentMode, isHandOnMode } from "@/domain/handover";
import { pointsFor } from "@/domain/points";
import { stagesFor } from "@/domain/ladders";
import { consentRefusalCopy } from "@/domain/whatsapp-loop";
import { cardNotifyWhy, handoverCard } from "@/services/handover";
import { bookDepartmentForLane, isQualifyLane, qualifyStageForBook } from "@/domain/qualify";

export function emiPaise(principalPaise: number, rateBps: number, tenureMonths: number) {
  const r = rateBps / 10000 / 12;
  const n = tenureMonths;
  if (n <= 0 || principalPaise <= 0) return 0;
  if (r === 0) return Math.round(principalPaise / n);
  const pow = (1 + r) ** n;
  return Math.round((principalPaise * r * pow) / (pow - 1));
}

export async function writeAudit(
  tx: Tx,
  action: string,
  entity: string,
  payload: Record<string, unknown>,
  actorId: string,
) {
  await tx`
    INSERT INTO audit_logs (tenant_id, actor_id, action, entity, payload)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${actorId}::uuid,
      ${action},
      ${entity},
      ${JSON.stringify(payload)}::jsonb
    )
  `;
}

export async function recordMovement(
  tx: Tx,
  input: { userId: string; amount: number; reasonKey: string; note: string; leadId?: string },
) {
  if (input.amount === 0) return;
  await tx`
    INSERT INTO point_movements (tenant_id, user_id, lead_id, amount, reason_key, note)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.userId}::uuid,
      ${input.leadId ?? null}::uuid,
      ${input.amount},
      ${input.reasonKey},
      ${input.note}
    )
  `;
}

export async function assignmentMode(tx: Tx, branchId: string, sourceKey: string) {
  const [row] = await tx<{ mode: string }[]>`
    SELECT arth_assignment_mode(${branchId}::uuid, ${sourceKey}) AS mode
  `;
  return deskAssignmentMode(row?.mode);
}

async function handoverDueAt(tx: Tx, branchId: string) {
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
  return firstResponseDue(
    new Date(),
    hours.map((h) => ({
      dayOfWeek: Number(h.dayOfWeek),
      opensAt: h.opensAt,
      closesAt: h.closesAt,
    })),
    th?.value_int ?? 30,
    branch?.timezone ?? "Asia/Kolkata",
  );
}

async function writeAssistCredit(
  tx: Tx,
  input: { userId: string; leadId: string; amount: number; note: string },
) {
  await tx`
    INSERT INTO assist_credits (tenant_id, lead_id, user_id, amount, reason_key, note)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      ${input.userId}::uuid,
      ${input.amount},
      'assist',
      ${input.note}
    )
  `;
}

async function listDepartmentManagers(tx: Tx, branchId: string, department: string) {
  const roles =
    department === "service"
      ? (["svcmgr", "lead"] as const)
      : department === "insurance"
        ? (["lead"] as const)
        : (["salesmgr", "lead"] as const);
  return tx<{ id: string; full_name: string; role_key: string }[]>`
    SELECT u.id::text, u.full_name, u.role_key
    FROM users u
    JOIN positions p ON p.id = u.position_id
    WHERE u.is_active
      AND p.branch_id = ${branchId}::uuid
      AND u.role_key = ANY(${roles}::text[])
    ORDER BY u.full_name
  `;
}

export async function saveEnquiryDepth(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    colour?: string;
    variant?: string;
    altModel?: string;
    altVariant?: string;
    buyerType?: string;
    exchangeVehicle?: string;
    exchangeEvalNeeded?: boolean;
    exchangeEvalAt?: string;
    exchangePlace?: string;
    meetingKind?: string;
    meetingAt?: string;
    testdriveNeeded?: boolean;
    testdrivePrefDate?: string;
    financeNeeded?: boolean;
    financeBankKey?: string;
    expectedBookingDate?: string;
    expectedDeliveryDate?: string;
    whoElseDecides?: string;
    seenVehicle?: boolean;
    intakeSaid?: string;
  },
) {
  const [lead] = await tx<{ owner_user_id: string | null }[]>`
    SELECT owner_user_id::text FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead || (lead.owner_user_id && lead.owner_user_id !== input.userId)) {
    throw new Error("This enquiry is not on your book.");
  }
  await tx`
    UPDATE leads SET
      colour = COALESCE(${input.colour || null}, colour),
      variant_interest = COALESCE(${input.variant || null}, variant_interest),
      alt_model = COALESCE(${input.altModel || null}, alt_model),
      alt_variant = COALESCE(${input.altVariant || null}, alt_variant),
      buyer_type = COALESCE(${input.buyerType || null}, buyer_type),
      exchange_vehicle = COALESCE(${input.exchangeVehicle || null}, exchange_vehicle),
      exchange_eval_needed = COALESCE(${input.exchangeEvalNeeded ?? null}, exchange_eval_needed),
      exchange_eval_at = COALESCE(${input.exchangeEvalAt || null}::date, exchange_eval_at),
      exchange_place = COALESCE(${input.exchangePlace || null}, exchange_place),
      meeting_kind = COALESCE(${input.meetingKind || null}, meeting_kind),
      meeting_at = COALESCE(${input.meetingAt || null}::timestamptz, meeting_at),
      testdrive_needed = COALESCE(${input.testdriveNeeded ?? null}, testdrive_needed),
      testdrive_pref_date = COALESCE(${input.testdrivePrefDate || null}::date, testdrive_pref_date),
      finance_needed = COALESCE(${input.financeNeeded ?? null}, finance_needed),
      finance_bank_key = COALESCE(${input.financeBankKey || null}, finance_bank_key),
      expected_booking_date = COALESCE(${input.expectedBookingDate || null}::date, expected_booking_date),
      expected_delivery_date = COALESCE(${input.expectedDeliveryDate || null}::date, expected_delivery_date),
      who_else_decides = COALESCE(${input.whoElseDecides || null}, who_else_decides),
      seen_vehicle = COALESCE(${input.seenVehicle ?? null}, seen_vehicle),
      intake_said = COALESCE(${input.intakeSaid?.trim() || null}, intake_said)
    WHERE id = ${input.leadId}::uuid
  `;
  const said = input.intakeSaid?.trim();
  if (said) {
    await tx`
      INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${input.leadId}::uuid,
        'note',
        'USER',
        ${input.userId}::uuid,
        ${said},
        ${tx.json({ kind: "what_he_said" })}
      )
    `;
  }
  return { recorded: "Saved on the enquiry." };
}

export async function listReceivers(tx: Tx, branchId: string, department: string) {
  const role =
    department === "service" ? "svc" : department === "insurance" ? "ins" : "sales";
  return tx<{ id: string; full_name: string }[]>`
    SELECT u.id::text, u.full_name
    FROM users u
    JOIN positions p ON p.id = u.position_id
    WHERE u.role_key = ${role} AND u.is_active AND p.branch_id = ${branchId}::uuid
    ORDER BY u.full_name
  `;
}

export async function listSalesReceivers(tx: Tx, branchId: string) {
  return listReceivers(tx, branchId, "sales");
}

async function insertLeadEvent(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    eventType: string;
    note: string;
    payload: Record<string, unknown>;
  },
) {
  const [row] = await tx<{ id: string }[]>`
    INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      ${input.eventType},
      'USER',
      ${input.userId}::uuid,
      ${input.note},
      ${tx.json(JSON.parse(JSON.stringify(input.payload)))}
    )
    RETURNING id::text
  `;
  if (!row) throw new Error("The ledger row did not write.");
  return row.id;
}

function isoStamp(value: Date | string | null | undefined) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function previousOwnerPayload(lead: {
  owner_user_id: string | null;
  next_action_at?: Date | string | null;
  pool_open?: boolean | null;
  handed_on_at?: Date | string | null;
  handed_on_by?: string | null;
  handover_mode?: string | null;
  handover_contact_due?: Date | string | null;
}) {
  return {
    previous_owner_user_id: lead.owner_user_id,
    previous_next_action_at: isoStamp(lead.next_action_at),
    previous_pool_open: Boolean(lead.pool_open),
    previous_handed_on_at: isoStamp(lead.handed_on_at),
    previous_handed_on_by: lead.handed_on_by,
    previous_handover_mode: lead.handover_mode,
    previous_handover_contact_due: isoStamp(lead.handover_contact_due),
  };
}

export async function keepAndNurture(
  tx: Tx,
  input: { leadId: string; userId: string; revisitAt: string; note?: string },
) {
  const revisit = revisitDayToInstant(input.revisitAt);
  if (!revisit) throw new Error("Keep and nurture needs a revisit date.");
  const [lead] = await tx<{
    owner_user_id: string | null;
    next_action_at: Date | null;
    pool_open: boolean;
    handed_on_at: Date | null;
    handed_on_by: string | null;
    handover_mode: string | null;
    handover_contact_due: Date | null;
  }[]>`
    SELECT
      owner_user_id::text,
      next_action_at,
      pool_open,
      handed_on_at,
      handed_on_by::text,
      handover_mode,
      handover_contact_due
    FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not in your tenant.");
  if (lead.owner_user_id !== input.userId) {
    throw new Error("Only the telecaller who reached this customer can keep it.");
  }
  await tx`
    UPDATE leads SET
      handover_mode = 'nurture',
      next_action_at = ${revisit}::timestamptz,
      pool_open = false
    WHERE id = ${input.leadId}::uuid
  `;
  const eventId = await insertLeadEvent(tx, {
    leadId: input.leadId,
    userId: input.userId,
    eventType: "nurture",
    note: input.note?.trim() || "Not ready. Kept on the telecaller book with a revisit date.",
    payload: { mode: "nurture", revisit_at: revisit, ...previousOwnerPayload(lead) },
  });
  return {
    recorded: "Kept on your book. The revisit date is the next clock.",
    mode: "nurture" as const,
    eventId,
  };
}

export async function routeEnquiry(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    note: string;
    salesUserId?: string;
    department?: string;
    mode?: string;
    revisitAt?: string;
    qualifyDesk?: boolean;
  },
) {
  if (input.mode === "nurture") {
    return keepAndNurture(tx, {
      leadId: input.leadId,
      userId: input.userId,
      revisitAt: input.revisitAt ?? "",
      note: input.note,
    });
  }

  const [lead] = await tx<{
    owner_user_id: string | null;
    stage_key: string;
    branch_id: string;
    customer_name: string;
    difficulty_band: string | null;
    source_key: string;
    department_key: string;
    next_action_at: Date | null;
    pool_open: boolean;
    handed_on_at: Date | null;
    handed_on_by: string | null;
    handover_mode: string | null;
    handover_contact_due: Date | null;
  }[]>`
    SELECT
      l.owner_user_id::text,
      l.stage_key,
      l.branch_id::text,
      c.full_name AS customer_name,
      l.difficulty_band,
      l.source_key,
      l.department_key,
      l.next_action_at,
      l.pool_open,
      l.handed_on_at,
      l.handed_on_by::text,
      l.handover_mode,
      l.handover_contact_due
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not in your tenant.");
  if (lead.owner_user_id !== input.userId) {
    throw new Error("Only the telecaller who reached this customer can route it.");
  }
  const dept = input.department || lead.department_key || "sales";
  const ladder = stagesFor(dept);
  const readyKey = dept === "service" ? "appointment" : dept === "insurance" ? "quoted" : "meeting";
  const meetingAt = ladder.indexOf(readyKey);
  const at = ladder.indexOf(lead.stage_key === "qualified" ? "meeting" : lead.stage_key);
  if (!input.qualifyDesk && meetingAt >= 0 && (at < 0 || at < meetingAt)) {
    throw new Error(
      dept === "service"
        ? "Move the stage to Appointment before handing it on."
        : dept === "insurance"
          ? "Move the stage to Quoted before handing it on."
          : "Move the stage to Meeting before handing it on.",
    );
  }
  const mode = await assignmentMode(tx, lead.branch_id, lead.source_key);
  if (input.mode && isHandOnMode(input.mode) && input.mode !== mode) {
    throw new Error("The digital desk sets whether this is direct, pool, or department queue.");
  }
  const points = pointsFor({ kind: "handoff", difficulty: lead.difficulty_band });
  const card = await handoverCard(tx, input.leadId);
  const due = await handoverDueAt(tx, lead.branch_id);
  const dueIso = due.toISOString();
  const cardPayload = {
    mode,
    department: dept,
    points,
    completeness: card.completeness,
    price: card.price,
    emi: card.emi,
    testdrive: card.testdrive,
    exchange: card.exchange,
    said: card.said,
    ...previousOwnerPayload(lead),
  };

  if (mode === "pool") {
    await tx`
      UPDATE leads SET
        owner_user_id = NULL,
        pool_open = true,
        department_key = ${dept},
        first_responded_at = COALESCE(first_responded_at, now()),
        handed_on_at = now(),
        handed_on_by = ${input.userId}::uuid,
        handover_mode = 'pool',
        handover_contact_due = ${dueIso}::timestamptz,
        handover_contacted_at = NULL,
        next_action_at = ${dueIso}::timestamptz
      WHERE id = ${input.leadId}::uuid
    `;
    const eventId = await insertLeadEvent(tx, {
      leadId: input.leadId,
      userId: input.userId,
      eventType: "handoff",
      note: input.note.trim() || "Meeting done. Assigned to the branch pool. First to reach owns it.",
      payload: cardPayload,
    });
    await recordMovement(tx, {
      userId: input.userId,
      amount: points,
      reasonKey: "handoff",
      note: "Handed to the branch pool",
      leadId: input.leadId,
    });
    await writeAssistCredit(tx, {
      userId: input.userId,
      leadId: input.leadId,
      amount: points,
      note: "Assist credit. Permanent. Conversion is not her measure.",
    });
    const team = await listReceivers(tx, lead.branch_id, dept);
    for (const person of team) {
      await tx`
        INSERT INTO notifications (tenant_id, user_id, title, why, href)
        VALUES (
          current_setting('app.tenant_id')::uuid,
          ${person.id}::uuid,
          ${lead.customer_name + " is in the " + dept + " pool"},
          ${"First to reach owns it. " + cardNotifyWhy(card) + " Missed window escalates to the sales team leader, never back to telecalling."},
          ${"/w/rec?id=" + input.leadId}
        )
      `;
    }
    return { recorded: `In the ${dept} pool. First consultant to reach owns it.`, points, mode: "pool", eventId };
  }

  if (mode === "queue") {
    await tx`
      UPDATE leads SET
        owner_user_id = NULL,
        pool_open = false,
        department_key = ${dept},
        first_responded_at = COALESCE(first_responded_at, now()),
        handed_on_at = now(),
        handed_on_by = ${input.userId}::uuid,
        handover_mode = 'queue',
        handover_contact_due = ${dueIso}::timestamptz,
        handover_contacted_at = NULL,
        next_action_at = ${dueIso}::timestamptz
      WHERE id = ${input.leadId}::uuid
    `;
    const eventId = await insertLeadEvent(tx, {
      leadId: input.leadId,
      userId: input.userId,
      eventType: "handoff",
      note: input.note.trim() || "Meeting done. In the department queue for the sales manager to assign.",
      payload: cardPayload,
    });
    await recordMovement(tx, {
      userId: input.userId,
      amount: points,
      reasonKey: "handoff",
      note: "Handed to the department queue",
      leadId: input.leadId,
    });
    await writeAssistCredit(tx, {
      userId: input.userId,
      leadId: input.leadId,
      amount: points,
      note: "Assist credit. Permanent. Conversion is not her measure.",
    });
    const managers = await listDepartmentManagers(tx, lead.branch_id, dept);
    for (const person of managers) {
      await tx`
        INSERT INTO notifications (tenant_id, user_id, title, why, href)
        VALUES (
          current_setting('app.tenant_id')::uuid,
          ${person.id}::uuid,
          ${lead.customer_name + " is in the department queue"},
          ${"Assign a named executive. " + cardNotifyWhy(card)},
          ${"/w/rec?id=" + input.leadId}
        )
      `;
    }
    return {
      recorded: "In the department queue. The sales manager assigns the receiving executive.",
      points,
      mode: "queue",
      eventId,
    };
  }

  if (!input.salesUserId) {
    throw new Error("Direct mode needs a named receiving executive.");
  }

  await tx`
    UPDATE leads SET
      owner_user_id = ${input.salesUserId}::uuid,
      pool_open = false,
      department_key = ${dept},
      first_responded_at = COALESCE(first_responded_at, now()),
      handed_on_at = now(),
      handed_on_by = ${input.userId}::uuid,
      handover_mode = 'direct',
      handover_contact_due = ${dueIso}::timestamptz,
      handover_contacted_at = NULL,
      next_action_at = ${dueIso}::timestamptz
    WHERE id = ${input.leadId}::uuid
  `;
  const eventId = await insertLeadEvent(tx, {
    leadId: input.leadId,
    userId: input.userId,
    eventType: "handoff",
    note: input.note.trim() || "Meeting done. Handed to sales to convert.",
    payload: { ...cardPayload, sales_user_id: input.salesUserId },
  });
  await recordMovement(tx, {
    userId: input.userId,
    amount: points,
    reasonKey: "handoff",
    note: "Handed to a named sales consultant",
    leadId: input.leadId,
  });
  await writeAssistCredit(tx, {
    userId: input.userId,
    leadId: input.leadId,
    amount: points,
    note: "Assist credit. Permanent. Conversion is not her measure.",
  });
  await tx`
    INSERT INTO notifications (tenant_id, user_id, title, why, href)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.salesUserId}::uuid,
      ${lead.customer_name + " is ready for you"},
      ${"First-contact clock is on you. " + cardNotifyWhy(card)},
      ${"/w/rec?id=" + input.leadId}
    )
  `;
  return { recorded: "Handed to the named executive. Conversion is now their job.", points, mode: "direct", eventId };
}

export async function qualifyLead(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    lane: string;
    note: string;
    send?: boolean;
    testdrivePrefDate?: string;
    extras?: Record<string, string>;
    salesUserId?: string;
    mode?: string;
  },
) {
  if (!isQualifyLane(input.lane)) {
    throw new Error("Name the department this enquiry is ready for.");
  }
  const book = bookDepartmentForLane(input.lane);
  const stage = qualifyStageForBook(book);
  const pref = input.testdrivePrefDate?.trim().slice(0, 10) || null;
  const extras = input.extras ?? {};
  const lines = [
    input.note.trim(),
    input.testdrivePrefDate ? `Preferred test-drive date ${pref}. Sales books the slot.` : "",
    extras.regNo ? `Registration ${extras.regNo}` : "",
    extras.complaint ? `Complaint ${extras.complaint}` : "",
    extras.policyExpiry ? `Policy expiry ${extras.policyExpiry}` : "",
    extras.currentCar ? `Current car ${extras.currentCar}` : "",
    extras.licence ? `Licence ${extras.licence}` : "",
  ].filter(Boolean);
  const note =
    lines.join(". ") ||
    "Qualified: information collected, customer willing, ready for that department.";

  await tx`
    UPDATE leads SET
      department_key = ${book},
      stage_key = ${stage},
      testdrive_pref_date = COALESCE(${pref}::date, testdrive_pref_date)
    WHERE id = ${input.leadId}::uuid
  `;
  const eventId = await insertLeadEvent(tx, {
    leadId: input.leadId,
    userId: input.userId,
    eventType: "qualify",
    note,
    payload: {
      lane: input.lane,
      book,
      testdrive_pref_date: pref,
      extras,
    },
  });
  if (!input.send) {
    return {
      recorded: `Qualified for ${input.lane.replaceAll("_", " ")}. Still on this book until you send it.`,
      eventId,
      sent: false,
    };
  }
  const [lead] = await tx<{ branch_id: string; source_key: string }[]>`
    SELECT branch_id::text, source_key FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not in your tenant.");
  const mode = input.mode ?? (await assignmentMode(tx, lead.branch_id, lead.source_key));
  let salesUserId = input.salesUserId;
  if (mode === "direct" && !salesUserId) {
    const people = await listReceivers(tx, lead.branch_id, book);
    salesUserId = people[0]?.id;
  }
  const routed = await routeEnquiry(tx, {
    leadId: input.leadId,
    userId: input.userId,
    note,
    department: book,
    salesUserId,
    mode,
    qualifyDesk: true,
  });
  return { ...routed, eventId: routed.eventId, qualifyEventId: eventId, sent: true };
}

export async function undoHandoff(
  tx: Tx,
  input: { leadId: string; userId: string; eventId: string },
) {
  const [event] = await tx<{
    id: string;
    event_type: string;
    actor_id: string | null;
    payload: {
      previous_owner_user_id?: string | null;
      previous_next_action_at?: string | null;
      previous_pool_open?: boolean;
      previous_handed_on_at?: string | null;
      previous_handed_on_by?: string | null;
      previous_handover_mode?: string | null;
      previous_handover_contact_due?: string | null;
      points?: number;
      sales_user_id?: string;
      mode?: string;
    } | null;
  }[]>`
    SELECT id::text, event_type, actor_id::text, payload
    FROM lead_events
    WHERE id = ${input.eventId}::bigint AND lead_id = ${input.leadId}::uuid
  `;
  if (!event || (event.event_type !== "handoff" && event.event_type !== "nurture")) {
    throw new Error("Nothing to undo.");
  }
  if (event.actor_id !== input.userId) {
    throw new Error("Only the person who wrote that row can undo it in this window.");
  }

  const [lead] = await tx<{
    owner_user_id: string | null;
    handed_on_by: string | null;
    handover_contacted_at: Date | null;
    handover_mode: string | null;
  }[]>`
    SELECT owner_user_id::text, handed_on_by::text, handover_contacted_at, handover_mode
    FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not on your book.");
  if (event.event_type === "handoff") {
    if (lead.handover_contacted_at) {
      throw new Error("Sales already made first contact. Ask the digital desk.");
    }
    const prevOwner = event.payload?.previous_owner_user_id ?? input.userId;
    const named = event.payload?.sales_user_id;
    if (
      lead.owner_user_id &&
      lead.owner_user_id !== prevOwner &&
      lead.owner_user_id !== named
    ) {
      throw new Error("Another seat already owns this enquiry. Ask the digital desk.");
    }
  }

  const prev = event.payload;
  const [restored] = await tx<{ ok: boolean }[]>`
    SELECT arth_restore_handoff(${input.leadId}::uuid, ${input.eventId}::bigint) AS ok
  `;
  if (!restored?.ok) {
    throw new Error("The enquiry could not be restored. Ask the digital desk.");
  }

  await insertLeadEvent(tx, {
    leadId: input.leadId,
    userId: input.userId,
    eventType: "correction",
    note:
      event.event_type === "nurture"
        ? "Undo of last keep-and-nurture. Original row stands."
        : "Undo of last handoff. Original row stands.",
    payload: { undo_of: input.eventId },
  });

  const points = Number(prev?.points ?? 0);
  if (event.event_type === "handoff" && points) {
    await recordMovement(tx, {
      userId: input.userId,
      amount: -points,
      reasonKey: "correction",
      note: "Undo of last handoff. Original movement stays.",
      leadId: input.leadId,
    });
    await writeAssistCredit(tx, {
      userId: input.userId,
      leadId: input.leadId,
      amount: -points,
      note: "Undo of last handoff. Original assist row stays.",
    });
  }

  return { recorded: "Correction written" };
}

export async function bounceToPool(
  tx: Tx,
  input: { leadId: string; actorId: string; reason: string },
) {
  const reason = input.reason.trim();
  if (reason.length < 8) {
    throw new Error("A bounce always needs a reason. Write why, at least eight characters.");
  }
  const [actor] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${input.actorId}::uuid AND is_active
  `;
  if (!actor || !["sales", "svc", "ins", "salesmgr", "svcmgr", "lead", "mgr", "owner", "gm"].includes(actor.role_key)) {
    throw new Error("Only the receiving executive or a superior can bounce this to the pool.");
  }
  const [lead] = await tx<{ owner_user_id: string | null; handed_on_at: Date | null }[]>`
    SELECT owner_user_id::text, handed_on_at FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not in your bucket.");
  if (["sales", "svc", "ins"].includes(actor.role_key) && lead.owner_user_id !== input.actorId) {
    throw new Error("Only the owner can bounce this enquiry to the pool.");
  }
  await tx`
    UPDATE leads SET
      owner_user_id = NULL,
      pool_open = true,
      handover_mode = 'pool',
      handover_bounced_at = now(),
      handover_contacted_at = NULL
    WHERE id = ${input.leadId}::uuid
  `;
  await tx`
    INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'bounce',
      'USER',
      ${input.actorId}::uuid,
      ${reason},
      ${tx.json({ previous_owner_user_id: lead.owner_user_id, mode: "pool" })}
    )
  `;
  return { recorded: "Returned to the branch pool. The reason is on the ledger." };
}

export async function escalateHandoverContact(tx: Tx) {
  const due = await tx<{ id: string; branch_id: string; department_key: string; customer_name: string; handed_on_by: string | null }[]>`
    SELECT l.id::text, l.branch_id::text, l.department_key, c.full_name AS customer_name, l.handed_on_by::text
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.handed_on_at IS NOT NULL
      AND l.handover_contact_due IS NOT NULL
      AND l.handover_contact_due < now()
      AND l.handover_contacted_at IS NULL
      AND l.lost_reason_key IS NULL
      AND l.handover_mode IN ('direct', 'pool', 'queue')
      AND NOT EXISTS (
        SELECT 1 FROM lead_events e
        WHERE e.lead_id = l.id AND e.event_type = 'escalation' AND e.payload->>'kind' = 'handover_contact'
      )
    LIMIT 20
  `;
  let n = 0;
  for (const lead of due) {
    await tx`
      INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${lead.id}::uuid,
        'escalation',
        'SYSTEM',
        NULL,
        'Handover first-contact window missed. Escalated to the receiving team leader, never back to the telecaller.',
        ${tx.json({ kind: "handover_contact", handed_on_by: lead.handed_on_by })}
      )
    `;
    const managers = await listDepartmentManagers(tx, lead.branch_id, lead.department_key);
    for (const person of managers) {
      if (lead.handed_on_by && person.id === lead.handed_on_by) continue;
      await tx`
        INSERT INTO notifications (tenant_id, user_id, title, why, href)
        VALUES (
          current_setting('app.tenant_id')::uuid,
          ${person.id}::uuid,
          ${lead.customer_name + " was not contacted after handover"},
          'The first-contact clock sat with sales. It does not return to the telecaller who handed it on.',
          ${"/w/rec?id=" + lead.id}
        )
      `;
    }
    n += 1;
  }
  return n;
}

export async function claimPool(tx: Tx, leadId: string, userId: string) {
  const [role] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${userId}::uuid
  `;
  const dept =
    role?.role_key === "svc"
      ? "service"
      : role?.role_key === "ins"
        ? "insurance"
        : "sales";
  if (!role || !["sales", "svc", "ins"].includes(role.role_key)) {
    throw new Error("Only the receiving executive in that department can claim a pooled enquiry.");
  }
  const [row] = await tx<{ id: string }[]>`
    UPDATE leads SET
      owner_user_id = ${userId}::uuid,
      pool_open = false,
      assigned_at = COALESCE(assigned_at, now())
    WHERE id = ${leadId}::uuid
      AND pool_open
      AND owner_user_id IS NULL
      AND department_key = ${dept}
    RETURNING id::text
  `;
  if (!row) throw new Error("This name is already claimed, or it is not in the pool.");
  const eventId = await insertLeadEvent(tx, {
    leadId,
    userId,
    eventType: "assigned",
    note: "Claimed from the branch pool.",
    payload: { claimed_from: "pool", previous_owner_user_id: null, previous_pool_open: true },
  });
  return { recorded: "You own this enquiry now.", eventId };
}

export async function undoPoolClaim(
  tx: Tx,
  input: { leadId: string; userId: string; eventId: string },
) {
  const [event] = await tx<{
    event_type: string;
    actor_id: string | null;
    payload: { claimed_from?: string } | null;
  }[]>`
    SELECT event_type, actor_id::text, payload
    FROM lead_events
    WHERE id = ${input.eventId}::bigint AND lead_id = ${input.leadId}::uuid
  `;
  if (!event || event.event_type !== "assigned" || event.payload?.claimed_from !== "pool") {
    throw new Error("Nothing to undo.");
  }
  if (event.actor_id !== input.userId) {
    throw new Error("Only the person who claimed this name can undo it in this window.");
  }
  const [lead] = await tx<{ owner_user_id: string | null }[]>`
    SELECT owner_user_id::text FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!lead || lead.owner_user_id !== input.userId) {
    throw new Error("This enquiry already left your book. Ask the digital desk.");
  }
  await tx`
    UPDATE leads SET owner_user_id = NULL, pool_open = true
    WHERE id = ${input.leadId}::uuid
  `;
  await insertLeadEvent(tx, {
    leadId: input.leadId,
    userId: input.userId,
    eventType: "correction",
    note: "Undo of last pool claim. Original row stands.",
    payload: { undo_of: input.eventId },
  });
  return { recorded: "Correction written" };
}

export async function reassignLead(
  tx: Tx,
  input: { leadId: string; actorId: string; toUserId: string; reason: string },
) {
  const reason = input.reason.trim();
  if (reason.length < 8) {
    throw new Error("Reassignment always needs a reason. Write why, at least eight characters.");
  }
  const [actor] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${input.actorId}::uuid AND is_active
  `;
  if (!actor || !["lead", "mgr", "salesmgr", "svcmgr", "owner", "admin", "ops", "gm"].includes(actor.role_key)) {
    throw new Error("Only a team leader, manager, principal, or Advito support can reassign.");
  }
  const [before] = await tx<{ owner_user_id: string | null }[]>`
    SELECT owner_user_id::text FROM leads WHERE id = ${input.leadId}::uuid
  `;
  if (!before) throw new Error("This enquiry is not in your bucket.");
  await tx`
    UPDATE leads SET owner_user_id = ${input.toUserId}::uuid, pool_open = false
    WHERE id = ${input.leadId}::uuid
  `;
  await tx`
    INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'assigned',
      'USER',
      ${input.actorId}::uuid,
      ${reason},
      ${tx.json({ previous_owner_user_id: before.owner_user_id, owner_user_id: input.toUserId })}
    )
  `;
  await writeAudit(tx, "reassign", input.leadId, { to: input.toUserId, reason }, input.actorId);
  return { recorded: "Reassigned. The reason is on the ledger." };
}

export async function requireConsent(tx: Tx, leadId: string, purpose: string) {
  const [row] = await tx<{ customer_id: string; ok: boolean }[]>`
    SELECT l.customer_id::text, arth_consent_ok(l.customer_id, ${purpose}) AS ok
    FROM leads l WHERE l.id = ${leadId}::uuid
  `;
  if (!row?.ok) {
    throw new Error(consentRefusalCopy(purpose));
  }
}

export async function listPrices(tx: Tx) {
  return tx<{
    model: string;
    variant: string;
    colour: string | null;
    ex_showroom_paise: string;
    rto_paise: string;
    insurance_paise: string;
    accessories_paise: string;
    confirmed_at: string;
  }[]>`
    SELECT model, variant, colour, ex_showroom_paise::text, rto_paise::text,
           insurance_paise::text, accessories_paise::text, confirmed_at::text
    FROM price_master
    ORDER BY model, variant
  `;
}

export async function listRates(tx: Tx) {
  return tx<{
    bank_key: string;
    tenure_months: number;
    rate_bps: number;
    processing_fee_paise: string;
    confirmed_at: string;
  }[]>`
    SELECT bank_key, tenure_months, rate_bps, processing_fee_paise::text, confirmed_at::text
    FROM bank_rates
    ORDER BY bank_key, tenure_months
  `;
}

export async function freezeQuotation(tx: Tx, leadId: string, actorId: string) {
  const [lead] = await tx<{ model_interest: string | null; variant_interest: string | null }[]>`
    SELECT model_interest, variant_interest FROM leads WHERE id = ${leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not on your book.");
  const [price] = await tx<{
    model: string;
    variant: string;
    ex_showroom_paise: string;
    rto_paise: string;
    insurance_paise: string;
    accessories_paise: string;
    confirmed_at: string;
  }[]>`
    SELECT model, variant, ex_showroom_paise::text, rto_paise::text,
           insurance_paise::text, accessories_paise::text, confirmed_at::text
    FROM price_master
    WHERE model = ${lead.model_interest ?? ""}
      AND (${lead.variant_interest || null}::text IS NULL OR variant = ${lead.variant_interest ?? ""})
    ORDER BY variant
    LIMIT 1
  `;
  if (!price) {
    throw new Error("No price is on the master for this model. The dealer admin enters it. A guessed price is not issued.");
  }
  const frozen = {
    ...price,
    frozen_at: new Date().toISOString(),
    note: "This quotation will not reprice itself later.",
  };
  await tx`
    INSERT INTO quotations (tenant_id, lead_id, frozen, actor_id)
    VALUES (current_setting('app.tenant_id')::uuid, ${leadId}::uuid, ${tx.json(frozen)}, ${actorId}::uuid)
  `;
  await tx`
    UPDATE leads SET quote_frozen_at = now(), stage_key = CASE
      WHEN stage_key IN ('new','assigned','contacted','meeting','test_drive') THEN 'quotation'
      ELSE stage_key
    END
    WHERE id = ${leadId}::uuid
  `;
  await tx`
    INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${leadId}::uuid,
      'stage_change',
      'USER',
      ${actorId}::uuid,
      'Quotation frozen at the live price and scheme versions.',
      ${tx.json({ frozen, from: "meeting", to: "quotation" })}
    )
  `;
  return { recorded: "Quotation frozen. It will not reprice itself later.", frozen };
}

export async function whyWeLose(tx: Tx) {
  return tx<{ key: string; label: string; n: string; sample: string | null }[]>`
    SELECT
      l.lost_reason_key AS key,
      COALESCE(r.label, l.lost_reason_key) AS label,
      count(*)::text AS n,
      (array_agg(e.note ORDER BY e.created_at DESC) FILTER (WHERE e.note IS NOT NULL))[1] AS sample
    FROM leads l
    LEFT JOIN config_lost_reasons r ON r.tenant_id = l.tenant_id AND r.key = l.lost_reason_key
    LEFT JOIN LATERAL (
      SELECT note FROM lead_events
      WHERE lead_id = l.id AND event_type = 'disposition' AND disposition_key = 'lost'
      ORDER BY created_at DESC
      LIMIT 1
    ) e ON true
    WHERE l.lost_reason_key IS NOT NULL
    GROUP BY l.lost_reason_key, r.label
    ORDER BY count(*) DESC
  `;
}

export async function loadWelcome(tx: Tx, userId: string) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const [seen] = await tx<{ n: string }[]>`
    SELECT count(*)::text AS n FROM welcome_dismissals
    WHERE user_id = ${userId}::uuid AND day = ${today}::date
  `;
  const [queue] = await tx<{ late: string; due: string; first_name: string | null }[]>`
    SELECT
      count(*) FILTER (
        WHERE (next_action_at IS NOT NULL AND next_action_at < now())
           OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
      )::text AS late,
      count(*)::text AS due,
      (array_agg(c.full_name ORDER BY l.next_action_at ASC NULLS LAST))[1] AS first_name
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.owner_user_id = ${userId}::uuid
      AND l.lost_reason_key IS NULL
      AND l.stage_key <> 'delivered'
  `;
  const [yesterday] = await tx<{ outcomes: string }[]>`
    SELECT count(*)::text AS outcomes
    FROM lead_events
    WHERE actor_id = ${userId}::uuid
      AND event_type = 'disposition'
      AND (timezone('Asia/Kolkata', created_at))::date = (${today}::date - 1)
  `;
  return {
    dismissed: Number(seen?.n ?? 0) > 0,
    late: Number(queue?.late ?? 0),
    due: Number(queue?.due ?? 0),
    firstName: queue?.first_name ?? null,
    yesterdayOutcomes: Number(yesterday?.outcomes ?? 0),
    day: today,
  };
}

export async function dismissWelcome(tx: Tx, userId: string) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  await tx`
    INSERT INTO welcome_dismissals (user_id, day)
    VALUES (${userId}::uuid, ${today}::date)
    ON CONFLICT DO NOTHING
  `;
}

export async function walletMovements(tx: Tx, userId: string) {
  const monthStart = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7) + "-01";
  return tx<{ amount: number; reason_key: string; note: string; created_at: Date }[]>`
    SELECT amount, reason_key, note, created_at
    FROM point_movements
    WHERE user_id = ${userId}::uuid
      AND created_at >= ${monthStart}::date
    ORDER BY created_at DESC
    LIMIT 80
  `;
}

export async function applyConcealmentPenalties(tx: Tx, userId: string) {
  const lapsed = await tx<{ id: string }[]>`
    SELECT l.id::text
    FROM leads l
    WHERE l.owner_user_id = ${userId}::uuid
      AND l.first_responded_at IS NULL
      AND l.first_response_due IS NOT NULL
      AND l.first_response_due < now()
      AND NOT EXISTS (
        SELECT 1 FROM point_movements m
        WHERE m.lead_id = l.id AND m.reason_key = 'lapse' AND m.user_id = ${userId}::uuid
      )
    LIMIT 20
  `;
  for (const row of lapsed) {
    await recordMovement(tx, {
      userId,
      amount: -8,
      reasonKey: "lapse",
      note: "First response window lapsed with no attempt. Log an outcome to stop this.",
      leadId: row.id,
    });
  }
  const missed = await tx<{ id: string }[]>`
    SELECT l.id::text
    FROM leads l
    WHERE l.owner_user_id = ${userId}::uuid
      AND l.next_action_at IS NOT NULL
      AND l.next_action_at < now()
      AND l.lost_reason_key IS NULL
      AND l.stage_key <> 'delivered'
      AND NOT EXISTS (
        SELECT 1 FROM lead_events e
        WHERE e.lead_id = l.id
          AND e.event_type = 'disposition'
          AND e.created_at >= l.next_action_at
      )
      AND NOT EXISTS (
        SELECT 1 FROM point_movements m
        WHERE m.lead_id = l.id AND m.reason_key = 'missed_commitment' AND m.user_id = ${userId}::uuid
      )
    LIMIT 20
  `;
  for (const row of missed) {
    await recordMovement(tx, {
      userId,
      amount: -5,
      reasonKey: "missed_commitment",
      note: "A commitment was due and no outcome was logged. Record the call to stop this.",
      leadId: row.id,
    });
  }
  return lapsed.length + missed.length;
}

export async function uploadServiceDue(
  tx: Tx,
  input: {
    actorId: string;
    batchName: string;
    rows: { name: string; phone: string; model?: string }[];
  },
) {
  const [actor] = await tx<{ role_key: string; branch_id: string | null }[]>`
    SELECT u.role_key, p.branch_id::text
    FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = ${input.actorId}::uuid
  `;
  if (!actor || !["mgr", "owner", "admin"].includes(actor.role_key)) {
    throw new Error("Only the desk, principal, or dealer admin can upload a department list.");
  }
  if (!actor.branch_id) throw new Error("This seat has no branch.");
  const [batch] = await tx<{ id: string }[]>`
    INSERT INTO upload_batches (tenant_id, department_key, name, actor_id)
    VALUES (current_setting('app.tenant_id')::uuid, 'service', ${input.batchName}, ${input.actorId}::uuid)
    RETURNING id::text
  `;
  let created = 0;
  for (const row of input.rows) {
    const digits = row.phone.replace(/\D/g, "");
    if (digits.length !== 10 || row.name.trim().length < 2) continue;
    const [cust] = await tx<{ id: string }[]>`
      INSERT INTO customers (tenant_id, full_name, phone)
      VALUES (current_setting('app.tenant_id')::uuid, ${row.name.trim()}, ${digits})
      ON CONFLICT (tenant_id, phone) DO UPDATE SET full_name = customers.full_name
      RETURNING id::text
    `;
    await tx`
      INSERT INTO leads (
        tenant_id, branch_id, customer_id, source_key, source_detail, model_interest,
        stage_key, department_key, intake_kind, intake_batch_name, intake_batch_at
      ) VALUES (
        current_setting('app.tenant_id')::uuid,
        ${actor.branch_id}::uuid,
        ${cust.id}::uuid,
        'inbound_call',
        ${input.batchName},
        ${row.model || null},
        'new',
        'service',
        'manager_upload',
        ${input.batchName},
        now()
      )
    `;
    created += 1;
  }
  await writeAudit(tx, "upload_batch", batch?.id ?? "", { created, name: input.batchName }, input.actorId);
  return { recorded: `${created} service-due names uploaded. They are labelled as uploaded by manager.`, created };
}

export async function setAssignmentMode(
  tx: Tx,
  actorId: string,
  branchId: string,
  mode: "direct" | "pool" | "queue",
) {
  const [actor] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${actorId}::uuid
  `;
  if (!actor || !["mgr", "owner", "admin"].includes(actor.role_key)) {
    throw new Error("Only the digital marketing manager, principal, or dealer admin can set assignment mode.");
  }
  await tx`
    INSERT INTO assignment_rules (tenant_id, branch_id, source_key, mode)
    VALUES (current_setting('app.tenant_id')::uuid, ${branchId}::uuid, '*', ${mode})
    ON CONFLICT (tenant_id, branch_id, source_key) DO UPDATE SET mode = EXCLUDED.mode
  `;
  await writeAudit(tx, "assignment_mode", branchId, { mode }, actorId);
  const recorded =
    mode === "pool"
      ? "Pool mode. First to reach owns it."
      : mode === "queue"
        ? "Department queue. The sales manager assigns."
        : "Direct mode. The telecaller names the receiving executive.";
  return { recorded };
}

export async function saveProfile(
  tx: Tx,
  userId: string,
  input: { fullName: string; whatsappPhone: string },
) {
  const name = input.fullName.trim();
  if (name.length < 2) throw new Error("A name is required.");
  await tx`
    UPDATE users SET
      full_name = ${name},
      whatsapp_phone = ${input.whatsappPhone.replace(/\D/g, "") || null}
    WHERE id = ${userId}::uuid
  `;
  return { recorded: "Name and WhatsApp number saved. Role, scope, and hours stay as the admin set them." };
}

export async function requestPasswordReset(tx: Tx, username: string) {
  await tx`SELECT arth_request_password_reset(${username})`;
  return { recorded: "If that username exists, the manager has been told." };
}

export async function listAudit(tx: Tx) {
  return tx<{ action: string; entity: string | null; payload: unknown; created_at: Date }[]>`
    SELECT action, entity, payload, created_at
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 40
  `;
}

export async function listBranchPeople(tx: Tx, branchId: string) {
  return tx<{ id: string; full_name: string; role_key: string }[]>`
    SELECT u.id::text, u.full_name, u.role_key
    FROM users u
    JOIN positions p ON p.id = u.position_id
    WHERE u.is_active AND p.branch_id = ${branchId}::uuid
      AND u.role_key IN ('tele', 'svctele', 'sales')
    ORDER BY u.full_name
  `;
}

export async function incentiveExport(tx: Tx) {
  return tx<{ full_name: string; username: string; points: string }[]>`
    SELECT u.full_name, u.username, coalesce(sum(m.amount), 0)::text AS points
    FROM users u
    LEFT JOIN point_movements m ON m.user_id = u.id
    WHERE u.role_key IN ('tele', 'svctele', 'sales')
      AND u.is_active
    GROUP BY u.id, u.full_name, u.username
    ORDER BY u.full_name
  `;
}
