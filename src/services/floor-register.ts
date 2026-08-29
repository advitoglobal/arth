import type { Tx } from "@/db/with-tenant";
import { pointsFor } from "@/domain/points";
import { STAGE_KEYS } from "@/domain/clock";

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
      ${tx.json(payload)}
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
  return row?.mode === "pool" ? "pool" : "direct";
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
      expected_delivery_date = COALESCE(${input.expectedDeliveryDate || null}::date, expected_delivery_date)
    WHERE id = ${input.leadId}::uuid
  `;
  return { recorded: "Qualification saved. The enquiry was already on the book." };
}

export async function listSalesReceivers(tx: Tx, branchId: string) {
  return tx<{ id: string; full_name: string }[]>`
    SELECT u.id::text, u.full_name
    FROM users u
    JOIN positions p ON p.id = u.position_id
    WHERE u.role_key = 'sales' AND u.is_active AND p.branch_id = ${branchId}::uuid
    ORDER BY u.full_name
  `;
}

export async function routeEnquiry(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    note: string;
    salesUserId?: string;
    department?: string;
  },
) {
  const [lead] = await tx<{
    owner_user_id: string | null;
    stage_key: string;
    branch_id: string;
    customer_name: string;
    difficulty_band: string | null;
    source_key: string;
  }[]>`
    SELECT
      l.owner_user_id::text,
      l.stage_key,
      l.branch_id::text,
      c.full_name AS customer_name,
      l.difficulty_band,
      l.source_key
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    WHERE l.id = ${input.leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not in your tenant.");
  if (lead.owner_user_id !== input.userId) {
    throw new Error("Only the telecaller who reached this customer can route it.");
  }
  const meetingAt = STAGE_KEYS.indexOf("meeting");
  const at = STAGE_KEYS.indexOf(lead.stage_key as (typeof STAGE_KEYS)[number]);
  if (at >= 0 && at < meetingAt) {
    throw new Error("Move the stage to Meeting before handing it on.");
  }
  const dept = input.department || "sales";
  const mode = await assignmentMode(tx, lead.branch_id, lead.source_key);
  const points = pointsFor({ kind: "handoff", difficulty: lead.difficulty_band });

  if (mode === "pool" || !input.salesUserId) {
    await tx`
      UPDATE leads SET
        owner_user_id = NULL,
        pool_open = true,
        department_key = ${dept},
        first_responded_at = COALESCE(first_responded_at, now())
      WHERE id = ${input.leadId}::uuid
    `;
    await tx`
      INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${input.leadId}::uuid,
        'handoff',
        'USER',
        ${input.userId}::uuid,
        ${input.note.trim() || "Meeting done. Assigned to the branch pool. First to claim owns it."},
        ${tx.json({ mode: "pool", department: dept, points })}
      )
    `;
    await recordMovement(tx, {
      userId: input.userId,
      amount: points,
      reasonKey: "handoff",
      note: "Handed to the branch pool",
      leadId: input.leadId,
    });
    const team = await listSalesReceivers(tx, lead.branch_id);
    for (const person of team) {
      await tx`
        INSERT INTO notifications (tenant_id, user_id, title, why, href)
        VALUES (
          current_setting('app.tenant_id')::uuid,
          ${person.id}::uuid,
          ${lead.customer_name + " is in the sales pool"},
          'First to claim owns it. Unclaimed names escalate after the first-response window.',
          ${"/w/rec?id=" + input.leadId}
        )
      `;
    }
    return { recorded: "In the branch pool. First sales consultant to claim owns it.", points, mode: "pool" };
  }

  await tx`
    UPDATE leads SET
      owner_user_id = ${input.salesUserId}::uuid,
      pool_open = false,
      department_key = ${dept}
    WHERE id = ${input.leadId}::uuid
  `;
  await tx`
    INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'handoff',
      'USER',
      ${input.userId}::uuid,
      ${input.note.trim() || "Meeting done. Handed to sales to convert."},
      ${tx.json({ mode: "direct", sales_user_id: input.salesUserId, department: dept, points })}
    )
  `;
  await recordMovement(tx, {
    userId: input.userId,
    amount: points,
    reasonKey: "handoff",
    note: "Handed to a named sales consultant",
    leadId: input.leadId,
  });
  await tx`
    INSERT INTO notifications (tenant_id, user_id, title, why, href)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.salesUserId}::uuid,
      ${lead.customer_name + " is ready for you"},
      'Telecalling finished the meeting and handed this enquiry to you. Conversion is now your job.',
      ${"/w/rec?id=" + input.leadId}
    )
  `;
  return { recorded: "Handed to the named sales consultant. Conversion is now a sales job.", points, mode: "direct" };
}

export async function claimPool(tx: Tx, leadId: string, userId: string) {
  const [role] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${userId}::uuid
  `;
  if (role?.role_key !== "sales") {
    throw new Error("Only a sales consultant can claim a pooled sales enquiry.");
  }
  const [row] = await tx<{ id: string }[]>`
    UPDATE leads SET
      owner_user_id = ${userId}::uuid,
      pool_open = false,
      assigned_at = COALESCE(assigned_at, now())
    WHERE id = ${leadId}::uuid
      AND pool_open
      AND owner_user_id IS NULL
      AND department_key = 'sales'
    RETURNING id::text
  `;
  if (!row) throw new Error("This name is already claimed, or it is not in the pool.");
  await tx`
    INSERT INTO lead_events (tenant_id, lead_id, event_type, actor_type, actor_id, note, payload)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${leadId}::uuid,
      'assigned',
      'USER',
      ${userId}::uuid,
      'Claimed from the branch pool.',
      ${tx.json({ claimed_from: "pool" })}
    )
  `;
  return { recorded: "You own this enquiry now." };
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
  if (!actor || !["lead", "mgr", "owner", "admin", "ops"].includes(actor.role_key)) {
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
    throw new Error(
      "This customer has not agreed to a sales enquiry message, or they have withdrawn. The button refuses rather than sending.",
    );
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

export async function setAssignmentMode(tx: Tx, actorId: string, branchId: string, mode: "direct" | "pool") {
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
  return { recorded: mode === "pool" ? "Pool mode. First to claim owns it." : "Direct mode. The telecaller names the receiving executive." };
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
