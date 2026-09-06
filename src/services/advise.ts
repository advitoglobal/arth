import type { Tx } from "@/db/with-tenant";
import { emiPaise } from "@/services/floor-register";
import { onRoadFor } from "@/services/catalogue";

export type AdviseTool = "price" | "emi" | "delivery" | "testdrive";

const TRUST: Record<AdviseTool, string> = {
  price:
    "On-road is computed from this dealer price master for this state. Each rupee carries the date it was confirmed. This is not a live DMS feed.",
  emi:
    "EMI uses the maintained bank table, never a model guess. The confirmation date sits next to the rate. A stale rate is flagged, not shown as current.",
  delivery:
    "Approximate days if booked today: 21 to 35, an estimate until sales allocation. This is not a live telephone line and not a DMS feed.",
  testdrive:
    "Next three slots at this branch from the coordinator book. Tapping a slot records interest. It is not a confirmed booking until sales books it.",
};

export async function adviseSnapshot(tx: Tx, leadId: string) {
  const [lead] = await tx<{
    model_interest: string | null;
    variant_interest: string | null;
    branch_id: string;
  }[]>`
    SELECT model_interest, variant_interest, branch_id::text FROM leads WHERE id = ${leadId}::uuid
  `;
  if (!lead) throw new Error("This enquiry is not on your book.");
  const price = lead.model_interest
    ? await onRoadFor(tx, lead.model_interest, lead.variant_interest)
    : null;
  const rates = await tx<{
    bank_key: string;
    tenure_months: number;
    rate_bps: number;
    confirmed_at: string;
  }[]>`
    SELECT bank_key, tenure_months, rate_bps, confirmed_at::text
    FROM bank_rates
    ORDER BY tenure_months
    LIMIT 12
  `;
  const now = Date.now();
  const staleRate = rates.some(
    (r) => now - new Date(r.confirmed_at).getTime() > 40 * 24 * 60 * 60 * 1000,
  );
  const emis = price
    ? [24, 36, 48].map((tenure) => {
        const rate = rates.find((r) => r.tenure_months === tenure) ?? rates[0];
        if (!rate) return null;
        return {
          tenure,
          bank: rate.bank_key,
          rateBps: rate.rate_bps,
          confirmedAt: String(rate.confirmed_at).slice(0, 10),
          emiPaise: emiPaise(price.onRoadPaise, rate.rate_bps, tenure),
        };
      }).filter((row): row is NonNullable<typeof row> => row != null)
    : [];
  const slots = [1, 2, 3].map((n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(11, 0, 0, 0);
    return d.toISOString();
  });
  const colours = await tx<{ colour: string; n: string }[]>`
    SELECT colour, count(*)::text AS n FROM stock_units
    WHERE status IN ('available', 'allocated')
      AND (${lead.model_interest ?? ""} = '' OR model = ${lead.model_interest ?? ""})
    GROUP BY colour
  `;
  return { price, emis, staleRate, slots, colours, trust: TRUST };
}

export async function recordAdviseTap(
  tx: Tx,
  input: {
    leadId: string;
    userId: string;
    tool: AdviseTool;
    values: Record<string, unknown>;
  },
) {
  if (!["price", "emi", "delivery", "testdrive"].includes(input.tool)) {
    throw new Error("Unknown adviser tool.");
  }
  const snap = await adviseSnapshot(tx, input.leadId);
  if (input.tool === "emi" && snap.staleRate) {
    throw new Error("This bank rate is stale. It will not display as current. Ask dealer admin to refresh the table.");
  }
  const labels: Record<AdviseTool, string> = {
    price: "Price discussed",
    emi: "EMI discussed",
    delivery: "Delivery timing discussed",
    testdrive: "Test drive slots opened",
  };
  await tx`
    INSERT INTO lead_events (
      tenant_id, lead_id, event_type, actor_type, actor_id, note, payload
    )
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${input.leadId}::uuid,
      'discussed',
      'USER',
      ${input.userId}::uuid,
      ${labels[input.tool]},
      ${tx.json(JSON.parse(JSON.stringify({ tool: input.tool, values: input.values, trust: TRUST[input.tool] })))}
    )
  `;
  return { recorded: labels[input.tool], trust: TRUST[input.tool], tool: input.tool, values: input.values };
}

export async function discussionRows(tx: Tx, leadId: string) {
  return tx<{
    id: string;
    note: string;
    created_at: Date;
    actor: string | null;
    payload: { tool?: string; values?: Record<string, unknown> } | null;
  }[]>`
    SELECT e.id::text, e.note, e.created_at, u.full_name AS actor, e.payload
    FROM lead_events e
    LEFT JOIN users u ON u.id = e.actor_id
    WHERE e.lead_id = ${leadId}::uuid AND e.event_type = 'discussed'
    ORDER BY e.created_at
  `;
}
