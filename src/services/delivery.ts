import type { Tx } from "@/db/with-tenant";
import { DELIVERY_LANES } from "@/domain/delivery";
import { sql } from "@/db/with-tenant";

export async function ensureDeliveryChain(tx: Tx, leadId: string) {
  const [lead] = await tx<{ id: string; tracking_token: string | null; stage_key: string }[]>`
    SELECT id::text, tracking_token, stage_key FROM leads WHERE id = ${leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not on your book.");
  if (!lead.tracking_token) {
    await tx`
      UPDATE leads SET tracking_token = replace(gen_random_uuid()::text, '-', '')
      WHERE id = ${leadId}::uuid AND tracking_token IS NULL
    `;
  }
  const existing = await tx<{ n: string }[]>`
    SELECT count(*)::text AS n FROM delivery_steps WHERE lead_id = ${leadId}::uuid
  `;
  if (Number(existing[0]?.n ?? 0) > 0) return;
  let order = 0;
  for (const lane of DELIVERY_LANES) {
    for (const step of lane.steps) {
      order += 1;
      await tx`
        INSERT INTO delivery_steps (tenant_id, lead_id, lane, step_key, sort_order)
        VALUES (
          current_setting('app.tenant_id')::uuid,
          ${leadId}::uuid,
          ${lane.lane},
          ${step.key},
          ${order}
        )
        ON CONFLICT (lead_id, lane, step_key) DO NOTHING
      `;
    }
  }
}

function longestOpenDays(steps: { lane: string; status: string }[]) {
  const laneDays: Record<string, number> = { finance: 8, vehicle: 12, prep: 5 };
  let longest = 0;
  for (const lane of ["finance", "vehicle", "prep"]) {
    const open = steps.some((s) => s.lane === lane && s.status !== "done");
    if (open) longest = Math.max(longest, laneDays[lane] ?? 0);
  }
  return Math.max(longest, 3);
}

export async function currentPromise(tx: Tx, leadId: string) {
  const [row] = await tx<{ promised_on: string; reason: string; created_at: Date }[]>`
    SELECT promised_on::text, reason, created_at
    FROM delivery_promises
    WHERE lead_id = ${leadId}::uuid
    ORDER BY id DESC
    LIMIT 1
  `;
  return row ?? null;
}

export async function listDelivery(tx: Tx, leadId: string) {
  await ensureDeliveryChain(tx, leadId);
  const steps = await tx<{
    id: string;
    lane: string;
    step_key: string;
    status: string;
    block_reason: string | null;
    block_kind: string | null;
    completed_at: Date | null;
  }[]>`
    SELECT id::text, lane, step_key, status, block_reason, block_kind, completed_at
    FROM delivery_steps WHERE lead_id = ${leadId}::uuid
    ORDER BY sort_order
  `;
  const promises = await tx<{ id: string; promised_on: string; reason: string; created_at: Date }[]>`
    SELECT id::text, promised_on::text, reason, created_at
    FROM delivery_promises WHERE lead_id = ${leadId}::uuid
    ORDER BY id
  `;
  const [lead] = await tx<{ tracking_token: string | null }[]>`
    SELECT tracking_token FROM leads WHERE id = ${leadId}::uuid
  `;
  return { steps, promises, trackingToken: lead?.tracking_token ?? null, current: promises.at(-1) ?? null };
}

export async function moveDeliveryStep(
  tx: Tx,
  input: {
    leadId: string;
    actorId: string;
    stepKey: string;
    status: "open" | "done" | "blocked";
    blockReason?: string;
    blockKind?: "internal" | "external";
  },
) {
  await ensureDeliveryChain(tx, input.leadId);
  if (input.status === "blocked") {
    if (!input.blockReason?.trim()) throw new Error("A block needs a reason.");
    if (!input.blockKind) throw new Error("Say whether this block is internal or external.");
  }
  await tx`
    UPDATE delivery_steps SET
      status = ${input.status},
      block_reason = ${input.status === "blocked" ? input.blockReason ?? null : null},
      block_kind = ${input.status === "blocked" ? input.blockKind ?? null : null},
      completed_at = CASE WHEN ${input.status} = 'done' THEN now() ELSE NULL END
    WHERE lead_id = ${input.leadId}::uuid AND step_key = ${input.stepKey}
  `;
  const steps = await tx<{ lane: string; status: string }[]>`
    SELECT lane, status FROM delivery_steps WHERE lead_id = ${input.leadId}::uuid
  `;
  const days = longestOpenDays(steps);
  const promised = new Date();
  promised.setDate(promised.getDate() + days);
  const reason = `Longest open lane after ${input.stepKey} moved to ${input.status}.`;
  await writePromise(tx, {
    leadId: input.leadId,
    actorId: input.actorId,
    promisedOn: promised.toISOString().slice(0, 10),
    reason,
  });
  return { recorded: "Step saved. A new promise row was written. The old date stays on the ledger." };
}

export async function writePromise(
  tx: Tx,
  input: { leadId: string; actorId: string; promisedOn: string; reason: string },
) {
  if (!input.reason.trim()) {
    throw new Error("A date cannot be set without a reason.");
  }
  if (!input.promisedOn) throw new Error("Pick the promised day.");
  await ensureDeliveryChain(tx, input.leadId);
  await tx`
    INSERT INTO delivery_promises (tenant_id, lead_id, promised_on, reason, actor_id)
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      ${input.promisedOn}::date,
      ${input.reason.trim()},
      ${input.actorId}::uuid
    )
  `;
  await tx`
    UPDATE leads SET delivery_status = ${"promised " + input.promisedOn}
    WHERE id = ${input.leadId}::uuid
  `;
  return { recorded: "Promise written as a new row. Previous promises were not edited." };
}

export async function promiseAccuracy(tx: Tx) {
  const rows = await tx<{
    bookings: string;
    moved: string;
    external_blocks: string;
    internal_blocks: string;
  }[]>`
    SELECT
      count(DISTINCT l.id)::text AS bookings,
      count(*) FILTER (WHERE n.n > 1)::text AS moved,
      count(*) FILTER (WHERE s.block_kind = 'external')::text AS external_blocks,
      count(*) FILTER (WHERE s.block_kind = 'internal')::text AS internal_blocks
    FROM delivery_promises p
    JOIN leads l ON l.id = p.lead_id
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS n FROM delivery_promises x WHERE x.lead_id = l.id
    ) n ON true
    LEFT JOIN delivery_steps s ON s.lead_id = l.id AND s.status = 'blocked'
    WHERE COALESCE(l.is_not_enquiry, false) = false
  `;
  return rows[0] ?? { bookings: "0", moved: "0", external_blocks: "0", internal_blocks: "0" };
}

export async function publicTrack(token: string) {
  const rows = await sql<{
    customer_name: string;
    model: string | null;
    promised_on: string | null;
    lane: string | null;
    step_key: string | null;
    status: string | null;
    block_kind: string | null;
  }[]>`
    SELECT customer_name, model, promised_on::text, lane, step_key, status, block_kind
    FROM arth_track_by_token(${token})
  `;
  if (rows.length === 0) return null;
  return {
    customerName: rows[0].customer_name,
    model: rows[0].model,
    promisedOn: rows[0].promised_on,
    steps: rows.filter((r) => r.step_key).map((r) => ({
      lane: r.lane,
      key: r.step_key,
      status: r.status,
      blockKind: r.block_kind,
    })),
  };
}
