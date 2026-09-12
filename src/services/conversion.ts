import type { Tx } from "@/db/with-tenant";
import { consentPurposeForDepartment, isInsideWorkingHours } from "@/domain/call-flow";
import type { DayHours } from "@/domain/clock";
import { stagesFor } from "@/domain/ladders";
import { writeAudit, recordMovement } from "@/services/floor-register";
import { autoAssignLapsedRecent } from "@/services/assignment";

export async function findByPhone(tx: Tx, phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return [];
  return tx<{ id: string; customer_name: string; department_key: string }[]>`
    SELECT l.id::text, c.full_name AS customer_name, l.department_key
    FROM customers c
    JOIN leads l ON l.customer_id = c.id
    WHERE c.phone LIKE ${"%" + digits}
    ORDER BY l.created_at DESC
    LIMIT 5
  `;
}

export async function runEscalations(tx: Tx) {
  const pool = await tx<{ id: string; customer_name: string; department_key: string; branch_id: string }[]>`
    SELECT l.id::text, c.full_name AS customer_name, l.department_key, l.branch_id::text
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.pool_open AND l.owner_user_id IS NULL
      AND l.first_response_due IS NOT NULL AND l.first_response_due < now()
      AND l.escalate_level = 'none'
      AND l.lost_reason_key IS NULL
      AND COALESCE(l.is_not_enquiry, false) = false
    LIMIT 40
  `;
  let n = 0;
  for (const row of pool) {
    await tx`
      UPDATE leads SET escalate_level = 'lead', escalate_at = now()
      WHERE id = ${row.id}::uuid
    `;
    await notifyRoles(tx, row.branch_id, ["lead"], `${row.customer_name} is unclaimed`, row.id);
    n += 1;
  }
  n += await autoAssignLapsedRecent(tx);

  const rungs: { from: string; to: string; wait: string; roles: string[] }[] = [
    { from: "lead", to: "mgr", wait: "4 hours", roles: ["mgr", "salesmgr", "svcmgr"] },
    { from: "mgr", to: "gm", wait: "1 day", roles: ["gm"] },
    { from: "gm", to: "owner", wait: "1 day", roles: ["owner", "admin"] },
  ];
  for (const rung of rungs) {
    const due = await tx<{ id: string; customer_name: string; branch_id: string }[]>`
      SELECT l.id::text, c.full_name AS customer_name, l.branch_id::text
      FROM leads l JOIN customers c ON c.id = l.customer_id
      WHERE l.escalate_level = ${rung.from}
        AND l.escalate_at IS NOT NULL
        AND l.escalate_at < now() - CASE ${rung.to}
          WHEN 'mgr' THEN interval '4 hours'
          ELSE interval '1 day'
        END
        AND (l.pool_open OR l.next_action_at < now())
        AND l.lost_reason_key IS NULL
      LIMIT 40
    `;
    for (const row of due) {
      await tx`
        UPDATE leads SET escalate_level = ${rung.to}, escalate_at = now()
        WHERE id = ${row.id}::uuid
      `;
      await notifyRoles(
        tx,
        row.branch_id,
        rung.roles,
        `${row.customer_name} still has no owner. Decide whether to reassign.`,
        row.id,
      );
      n += 1;
    }
  }
  const owned = await tx<{ id: string; customer_name: string; branch_id: string }[]>`
    SELECT l.id::text, c.full_name AS customer_name, l.branch_id::text
    FROM leads l JOIN customers c ON c.id = l.customer_id
    WHERE l.owner_user_id IS NOT NULL
      AND l.next_action_at IS NOT NULL AND l.next_action_at < now()
      AND l.escalate_level = 'none'
      AND l.lost_reason_key IS NULL
    LIMIT 40
  `;
  for (const row of owned) {
    await tx`
      UPDATE leads SET escalate_level = 'lead', escalate_at = now()
      WHERE id = ${row.id}::uuid
    `;
    await notifyRoles(
      tx,
      row.branch_id,
      ["lead"],
      `${row.customer_name} is overdue with an owner`,
      row.id,
    );
    n += 1;
  }

  return n;
}

async function notifyRoles(tx: Tx, branchId: string, roles: string[], title: string, leadId: string) {
  const people = await tx<{ id: string }[]>`
    SELECT u.id::text FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.is_active AND u.role_key = ANY(${roles}::text[])
      AND (p.branch_id = ${branchId}::uuid OR p.branch_id IS NULL OR u.role_key IN ('owner','admin','gm'))
  `;
  for (const person of people) {
    await tx`
      INSERT INTO notifications (tenant_id, user_id, title, why, href)
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${person.id}::uuid,
        ${title},
        'The clock moved this name up. Reassign only if you decide. The product will not steal it.',
        ${"/w/rec?id=" + leadId}
      )
    `;
  }
}

export async function listEscalations(tx: Tx) {
  return tx<{
    id: string;
    customer_name: string;
    department_key: string;
    escalate_level: string;
    escalate_at: Date | null;
  }[]>`
    SELECT l.id::text, c.full_name AS customer_name, l.department_key, l.escalate_level, l.escalate_at
    FROM leads l JOIN customers c ON c.id = l.customer_id
    WHERE l.escalate_level <> 'none' AND l.lost_reason_key IS NULL
      AND COALESCE(l.is_not_enquiry, false) = false
    ORDER BY l.escalate_at ASC NULLS LAST
    LIMIT 80
  `;
}

export async function costPerBooking(tx: Tx) {
  return tx<{ source_key: string; spend_paise: string; bookings: string; cost_paise: string }[]>`
    SELECT
      s.source_key,
      s.spend_paise::text,
      count(l.id) FILTER (WHERE l.stage_key IN ('booked','delivered','issued','renewed'))::text AS bookings,
      CASE
        WHEN count(l.id) FILTER (WHERE l.stage_key IN ('booked','delivered','issued','renewed')) = 0 THEN s.spend_paise::text
        ELSE (s.spend_paise / count(l.id) FILTER (WHERE l.stage_key IN ('booked','delivered','issued','renewed')))::text
      END AS cost_paise
    FROM source_costs s
    LEFT JOIN leads l ON l.tenant_id = s.tenant_id AND l.source_key = s.source_key
      AND COALESCE(l.is_not_enquiry, false) = false
      AND date_trunc('month', timezone('Asia/Kolkata', l.created_at)) = s.month
    WHERE s.month = date_trunc('month', timezone('Asia/Kolkata', now()))::date
    GROUP BY s.source_key, s.spend_paise
    ORDER BY s.source_key
  `;
}

export async function departmentCounts(tx: Tx) {
  return tx<{ department_key: string; n: string; late: string }[]>`
    SELECT
      department_key,
      count(*)::text AS n,
      count(*) FILTER (
        WHERE (next_action_at IS NOT NULL AND next_action_at < now())
           OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
      )::text AS late
    FROM leads
    WHERE lost_reason_key IS NULL
      AND COALESCE(is_not_enquiry, false) = false
      AND stage_key NOT IN ('delivered','renewed')
    GROUP BY department_key
    ORDER BY department_key
  `;
}

export async function listStock(tx: Tx) {
  return tx<{
    id: string;
    vin: string;
    model: string;
    variant: string | null;
    colour: string | null;
    status: string;
    booked_lead_id: string | null;
  }[]>`
    SELECT id::text, vin, model, variant, colour, status, booked_lead_id::text
    FROM stock_units
    ORDER BY status, model
  `;
}

export async function bookStock(tx: Tx, leadId: string, stockId: string, actorId: string) {
  const [role] = await tx<{ role_key: string }[]>`SELECT role_key FROM users WHERE id = ${actorId}::uuid`;
  if (!role || !["sales", "salesmgr", "lead", "owner", "gm"].includes(role.role_key)) {
    throw new Error("Only sales can book a car.");
  }
  const [car] = await tx<{ id: string }[]>`
    UPDATE stock_units SET status = 'booked', booked_lead_id = ${leadId}::uuid
    WHERE id = ${stockId}::uuid AND status IN ('available','allocated')
    RETURNING id::text
  `;
  if (!car) throw new Error("That car is not free.");
  await tx`
    UPDATE leads SET vehicle_id = ${stockId}::uuid, stage_key = CASE
      WHEN stage_key IN ('new','assigned','contacted','meeting','test_drive','quotation','negotiation') THEN 'booked'
      ELSE stage_key
    END
    WHERE id = ${leadId}::uuid
  `;
  await writeAudit(tx, "stock_booked", leadId, { stockId }, actorId);
  return { recorded: "This car is booked against the enquiry. Only a sales manager can release it." };
}

export async function releaseStock(tx: Tx, stockId: string, actorId: string, reason: string) {
  if (reason.trim().length < 8) throw new Error("Write why this booking is released.");
  const [role] = await tx<{ role_key: string }[]>`SELECT role_key FROM users WHERE id = ${actorId}::uuid`;
  if (!role || !["salesmgr", "owner", "gm", "admin"].includes(role.role_key)) {
    throw new Error("Only a sales manager, GM, principal, or dealer admin can release a booked car.");
  }
  const [car] = await tx<{ booked_lead_id: string | null }[]>`
    UPDATE stock_units SET status = 'available', booked_lead_id = NULL
    WHERE id = ${stockId}::uuid AND status = 'booked'
    RETURNING booked_lead_id::text
  `;
  if (!car) throw new Error("That car is not booked.");
  if (car.booked_lead_id) {
    await tx`UPDATE leads SET vehicle_id = NULL WHERE id = ${car.booked_lead_id}::uuid`;
  }
  await writeAudit(tx, "stock_released", stockId, { reason }, actorId);
  return { recorded: "Car released back to free stock." };
}

export async function scheduleTestDrive(
  tx: Tx,
  input: { leadId: string; actorId: string; slotAt: string; stockId?: string },
) {
  const [coord] = await tx<{ id: string }[]>`
    SELECT id::text FROM users WHERE role_key = 'tdcoord' AND is_active LIMIT 1
  `;
  await tx`
    INSERT INTO testdrives (tenant_id, lead_id, vehicle_id, slot_at, coordinator_id)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      ${input.stockId ? input.stockId : null}::uuid,
      ${input.slotAt}::timestamptz,
      ${coord?.id ?? null}::uuid
    )
  `;
  await tx`
    UPDATE leads SET testdrive_at = ${input.slotAt}::timestamptz, testdrive_status = 'booked',
      stage_key = CASE WHEN stage_key IN ('new','assigned','contacted','meeting') THEN 'test_drive' ELSE stage_key END
    WHERE id = ${input.leadId}::uuid
  `;
  if (coord) {
    await tx`
      INSERT INTO notifications (tenant_id, user_id, title, why, href)
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${coord.id}::uuid,
        'Test drive booked',
        'Prepare the car. Cleanliness is your job, not service telecalling.',
        ${"/w/drive"}
      )
    `;
  }
  return { recorded: "Test drive booked. The coordinator owns the car and the slot." };
}

export async function listTestDrives(tx: Tx) {
  return tx<{
    id: string;
    customer_name: string;
    slot_at: Date;
    status: string;
    model: string | null;
    lead_id: string;
  }[]>`
    SELECT t.id::text, c.full_name AS customer_name, t.slot_at, t.status, s.model, t.lead_id::text
    FROM testdrives t
    JOIN leads l ON l.id = t.lead_id
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN stock_units s ON s.id = t.vehicle_id
    WHERE t.status = 'booked'
    ORDER BY t.slot_at
  `;
}

export async function requestDiscount(tx: Tx, leadId: string, actorId: string, amountPaise: number, reason: string) {
  if (reason.trim().length < 8) throw new Error("Write why this discount is needed.");
  await tx`
    INSERT INTO discount_requests (tenant_id, lead_id, amount_paise, reason, actor_id)
    VALUES (current_setting('app.tenant_id')::uuid, ${leadId}::uuid, ${amountPaise}, ${reason.trim()}, ${actorId}::uuid)
  `;
  await tx`UPDATE leads SET discount_paise = ${amountPaise}, discount_status = 'pending' WHERE id = ${leadId}::uuid`;
  return { recorded: "Discount sent to the sales manager. It is not applied until they approve." };
}

export async function decideDiscount(tx: Tx, requestId: string, actorId: string, approve: boolean) {
  const [role] = await tx<{ role_key: string }[]>`SELECT role_key FROM users WHERE id = ${actorId}::uuid`;
  if (!role || !["salesmgr", "lead", "owner", "gm"].includes(role.role_key)) {
    throw new Error("Only a sales manager, team leader, GM, or principal can decide a discount.");
  }
  const [row] = await tx<{ lead_id: string }[]>`
    UPDATE discount_requests SET status = ${approve ? "approved" : "refused"}, decided_by = ${actorId}::uuid
    WHERE id = ${requestId}::uuid AND status = 'pending'
    RETURNING lead_id::text
  `;
  if (!row) throw new Error("That request is already decided.");
  await tx`
    UPDATE leads SET discount_status = ${approve ? "approved" : "refused"}
    WHERE id = ${row.lead_id}::uuid
  `;
  return { recorded: approve ? "Discount approved." : "Discount refused." };
}

export async function listDiscounts(tx: Tx) {
  return tx<{
    id: string;
    customer_name: string;
    amount_paise: string;
    reason: string;
    status: string;
    lead_id: string;
  }[]>`
    SELECT d.id::text, c.full_name AS customer_name, d.amount_paise::text, d.reason, d.status, d.lead_id::text
    FROM discount_requests d
    JOIN leads l ON l.id = d.lead_id
    JOIN customers c ON c.id = l.customer_id
    WHERE d.status = 'pending'
    ORDER BY d.created_at
  `;
}

export async function setDelivery(tx: Tx, leadId: string, lane: string, status: string) {
  await tx`
    UPDATE leads SET delivery_lane = ${lane}, delivery_status = ${status}
    WHERE id = ${leadId}::uuid
  `;
  return { recorded: "Delivery status saved. Sales decides the date. The stock unit stays booked." };
}

export async function insuranceCatalogue(tx: Tx, showMargin: boolean) {
  const rows = await tx<{
    id: string;
    name: string;
    insurer: string;
    premium_paise: string;
    dealer_margin_bps: number;
    claim_ratio_bps: number;
    cashless_own_workshop: boolean;
    renewal_stability: string;
    confirmed_at: string;
  }[]>`
    SELECT id::text, name, insurer, premium_paise::text, dealer_margin_bps, claim_ratio_bps,
           cashless_own_workshop, renewal_stability, confirmed_at::text
    FROM insurance_products
    ORDER BY dealer_margin_bps DESC, claim_ratio_bps DESC
  `;
  const ranked = [...rows].sort((a, b) => {
    const score = (p: typeof a) =>
      p.dealer_margin_bps * 2 + p.claim_ratio_bps + (p.cashless_own_workshop ? 400 : 0);
    return score(b) - score(a);
  });
  return ranked.map((p, i) => ({
    ...p,
    dealer_margin_bps: showMargin ? p.dealer_margin_bps : null,
    suggested: i < 3,
    reason:
      i < 3
        ? [
            p.cashless_own_workshop ? "Cashless at this workshop" : "Not cashless at this workshop",
            `Claim settlement ${(p.claim_ratio_bps / 100).toFixed(1)} percent`,
            `Renewal ${p.renewal_stability}`,
            "Dealer-preferred among products that also hold up for the customer",
          ].join(". ")
        : "On the book. Offer it if the customer asks. Do not hide it.",
  }));
}

export async function ringingCalls(tx: Tx, department: string) {
  return tx<{
    id: string;
    from_phone: string;
    label: string;
    did: string;
    created_at: Date;
  }[]>`
    SELECT c.id::text, c.from_phone, l.label, l.did, c.created_at
    FROM inbound_calls c
    JOIN inbound_lines l ON l.id = c.line_id
    WHERE c.status = 'ringing' AND l.department_key = ${department}
    ORDER BY c.created_at DESC
    LIMIT 20
  `;
}

export async function simulateInbound(tx: Tx, department: string, fromPhone: string) {
  const [line] = await tx<{ id: string }[]>`
    SELECT id::text FROM inbound_lines WHERE department_key = ${department} LIMIT 1
  `;
  if (!line) throw new Error("No inbound number is mapped for this department.");
  const [call] = await tx<{ id: string }[]>`
    INSERT INTO inbound_calls (tenant_id, line_id, from_phone, status)
    VALUES (current_setting('app.tenant_id')::uuid, ${line.id}::uuid, ${fromPhone}, 'ringing')
    RETURNING id::text
  `;
  return { recorded: "Inbound is ringing on the mapped number. Answer from Today. A live exchange waits on the telephone vendor.", callId: call?.id };
}

export async function answerInbound(tx: Tx, callId: string, userId: string) {
  const [call] = await tx<{ from_phone: string; department_key: string }[]>`
    UPDATE inbound_calls SET status = 'answered', answered_by = ${userId}::uuid
    WHERE id = ${callId}::uuid AND status = 'ringing'
    RETURNING from_phone, (SELECT department_key FROM inbound_lines WHERE id = inbound_calls.line_id) AS department_key
  `;
  if (!call) throw new Error("That call is no longer ringing.");
  const matches = await findByPhone(tx, call.from_phone);
  const hit = matches.find((m) => m.department_key === call.department_key) ?? matches[0];
  return {
    ...call,
    leadId: hit?.id ?? null,
    customer_name: hit?.customer_name ?? null,
  };
}

export async function listConsents(tx: Tx, leadId: string) {
  return tx<{ purpose_key: string; granted: boolean; withdrawn_at: Date | null }[]>`
    SELECT cc.purpose_key, cc.granted, cc.withdrawn_at
    FROM customer_consents cc
    JOIN leads l ON l.customer_id = cc.customer_id
    WHERE l.id = ${leadId}::uuid
    ORDER BY cc.purpose_key
  `;
}

export async function setConsent(tx: Tx, leadId: string, purpose: string, granted: boolean) {
  await tx`
    INSERT INTO customer_consents (tenant_id, customer_id, purpose_key, granted, withdrawn_at)
    SELECT l.tenant_id, l.customer_id, ${purpose}, ${granted}, CASE WHEN ${granted} THEN NULL ELSE now() END
    FROM leads l WHERE l.id = ${leadId}::uuid
    ON CONFLICT (customer_id, purpose_key) DO UPDATE
      SET granted = EXCLUDED.granted,
          withdrawn_at = EXCLUDED.withdrawn_at
  `;
  return { recorded: granted ? "This purpose is allowed." : "This purpose is withdrawn. WhatsApp for it will refuse." };
}

export async function markDial(tx: Tx, leadId: string, userId: string) {
  const pre = await dialPreflight(tx, leadId, userId);
  if (!pre.ok) {
    throw new Error(pre.blocks[0] ?? "This number cannot be dialled.");
  }
  await tx`
    INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${leadId}::uuid,
      'call_attempt',
      'USER',
      ${userId}::uuid,
      'Dial started from Arth.',
      ${tx.json({ source: "dial_button", duration_source: "desk_simulation" })}
    )
  `;
}

export async function dialPreflight(tx: Tx, leadId: string, userId: string) {
  const blocks: string[] = [];
  const warnings: string[] = [];
  const [lead] = await tx<{
    owner_user_id: string | null;
    branch_id: string;
    department_key: string | null;
    customer_id: string;
  }[]>`
    SELECT owner_user_id::text, branch_id::text, department_key, customer_id::text
    FROM leads WHERE id = ${leadId}::uuid
  `;
  if (!lead) {
    return { ok: false, blocks: ["This enquiry is not on your book."] };
  }
  if (lead.owner_user_id && lead.owner_user_id !== userId) {
    blocks.push("Somebody else owns this enquiry. Help is assist credit, not a second owner.");
  }
  const [busy] = await tx<{ n: string }[]>`
    SELECT count(*)::text AS n FROM lead_events
    WHERE lead_id = ${leadId}::uuid
      AND event_type = 'call_attempt'
      AND actor_id IS DISTINCT FROM ${userId}::uuid
      AND created_at > now() - interval '5 minutes'
  `;
  if (Number(busy?.n ?? 0) > 0) {
    blocks.push("Somebody else is already on this lead.");
  }
  const purpose = consentPurposeForDepartment(lead.department_key);
  const [consent] = await tx<{ ok: boolean }[]>`
    SELECT arth_consent_ok(${lead.customer_id}::uuid, ${purpose}) AS ok
  `;
  if (!consent?.ok) {
    blocks.push("This customer has withdrawn consent for calls, or never granted it.");
  }
  const hours = await tx<DayHours[]>`
    SELECT day_of_week AS "dayOfWeek",
           opens_at::text AS "opensAt",
           closes_at::text AS "closesAt"
    FROM working_hours
    WHERE branch_id = ${lead.branch_id}::uuid
    ORDER BY day_of_week
  `;
  const [branch] = await tx<{ timezone: string }[]>`
    SELECT timezone FROM branches WHERE id = ${lead.branch_id}::uuid
  `;
  const mapped = hours.map((h) => ({
    dayOfWeek: Number(h.dayOfWeek),
    opensAt: h.opensAt,
    closesAt: h.closesAt,
  }));
  const zone = branch?.timezone ?? "Asia/Kolkata";
  if (mapped.length > 0 && !isInsideWorkingHours(new Date(), mapped, zone)) {
    warnings.push("Outside working hours for this branch. The first-response clock does not run against her.");
  }
  return {
    ok: blocks.length === 0,
    blocks,
    warnings,
    recordingNotice:
      "This call is recorded. Both of you hear that before anyone speaks. It is the law, not a setting.",
  };
}

export async function hadRecentDial(tx: Tx, leadId: string, userId: string) {
  const [row] = await tx<{ n: string }[]>`
    SELECT count(*)::text AS n FROM lead_events
    WHERE lead_id = ${leadId}::uuid AND actor_id = ${userId}::uuid
      AND event_type = 'call_attempt' AND created_at > now() - interval '15 minutes'
  `;
  return Number(row?.n ?? 0) > 0;
}

export async function reportRows(
  tx: Tx,
  kind: "late" | "cost" | "departments" | "stock" | "escalations",
) {
  if (kind === "late") {
    return tx<{ customer_name: string; department_key: string; stage_key: string }[]>`
      SELECT c.full_name AS customer_name, l.department_key, l.stage_key
      FROM leads l JOIN customers c ON c.id = l.customer_id
      WHERE (
        (l.next_action_at IS NOT NULL AND l.next_action_at < now())
        OR (l.first_response_due IS NOT NULL AND l.first_responded_at IS NULL AND l.first_response_due < now())
      )
      AND l.lost_reason_key IS NULL
      AND COALESCE(l.is_not_enquiry, false) = false
      ORDER BY l.next_action_at ASC NULLS LAST
      LIMIT 200
    `;
  }
  if (kind === "cost") return costPerBooking(tx);
  if (kind === "departments") return departmentCounts(tx);
  if (kind === "stock") return listStock(tx);
  return listEscalations(tx);
}

export async function reassignBySuperior(
  tx: Tx,
  input: { leadId: string; actorId: string; toUserId: string; reason: string },
) {
  if (input.reason.trim().length < 8) throw new Error("Write why you are moving this enquiry.");
  const [actor] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${input.actorId}::uuid
  `;
  if (!actor || !["lead", "mgr", "salesmgr", "svcmgr", "gm", "owner", "admin"].includes(actor.role_key)) {
    throw new Error("Only a superior can reassign. The clock notifies. It does not steal.");
  }
  const [to] = await tx<{ full_name: string }[]>`
    SELECT full_name FROM users WHERE id = ${input.toUserId}::uuid AND is_active
  `;
  if (!to) throw new Error("That seat is not active.");
  await tx`
    UPDATE leads SET
      owner_user_id = ${input.toUserId}::uuid,
      pool_open = false,
      escalate_level = 'none',
      escalate_at = NULL,
      assigned_at = COALESCE(assigned_at, now())
    WHERE id = ${input.leadId}::uuid
  `;
  await writeAudit(tx, "reassigned", input.leadId, { toUserId: input.toUserId, reason: input.reason }, input.actorId);
  return { recorded: `Moved to ${to.full_name}. The superior decided. The clock did not steal it.` };
}

export async function listInboundLines(tx: Tx) {
  return tx<{ id: string; did: string; department_key: string; label: string }[]>`
    SELECT id::text, did, department_key, label FROM inbound_lines ORDER BY department_key
  `;
}

export function nextStage(dept: string | null | undefined, current: string) {
  const ladder = stagesFor(dept);
  const from = ladder.indexOf(current === "qualified" ? "meeting" : current);
  if (from < 0 || from >= ladder.length - 1) return null;
  return ladder[from + 1];
}
