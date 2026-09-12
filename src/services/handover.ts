import type { Tx } from "@/db/with-tenant";
import { cardCompleteness } from "@/domain/handover";

export type HandoverCardView = {
  customerName: string;
  model: string | null;
  variant: string | null;
  ownerName: string | null;
  discussedAt: Date | null;
  minutes: number | null;
  lines: {
    tool: string;
    text: string;
    values: Record<string, unknown>;
    at: Date;
    actor: string | null;
  }[];
  price: boolean;
  emi: boolean;
  testdrive: boolean;
  exchange: boolean;
  said: string | null;
  completeness: { filled: number; total: number; percent: number };
  recordingLine: string;
};

export async function handoverCard(tx: Tx, leadId: string): Promise<HandoverCardView> {
  const [lead] = await tx<{
    customer_name: string;
    model_interest: string | null;
    variant_interest: string | null;
    owner_name: string | null;
    intake_said: string | null;
    testdrive_needed: boolean | null;
    exchange_vehicle: string | null;
  }[]>`
    SELECT
      c.full_name AS customer_name,
      l.model_interest,
      l.variant_interest,
      u.full_name AS owner_name,
      l.intake_said,
      l.testdrive_needed,
      l.exchange_vehicle
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN users u ON u.id = l.owner_user_id
    WHERE l.id = ${leadId}::uuid
  `;
  const rows = await tx<{
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
  const [last] = await tx<{ call_seconds: number | null; created_at: Date; actor: string | null }[]>`
    SELECT e.call_seconds, e.created_at, u.full_name AS actor
    FROM lead_events e
    LEFT JOIN users u ON u.id = e.actor_id
    WHERE e.lead_id = ${leadId}::uuid AND e.event_type = 'disposition'
    ORDER BY e.created_at DESC
    LIMIT 1
  `;
  const [saidRow] = await tx<{ note: string }[]>`
    SELECT note FROM lead_events
    WHERE lead_id = ${leadId}::uuid
      AND (payload->>'kind' = 'what_he_said' OR event_type = 'note')
      AND note IS NOT NULL AND length(trim(note)) > 0
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const tools = new Set(rows.map((r) => r.payload?.tool).filter(Boolean));
  const price = tools.has("price");
  const emi = tools.has("emi");
  const testdrive = tools.has("testdrive") || Boolean(lead?.testdrive_needed);
  const exchange = tools.has("valuation") || Boolean(lead?.exchange_vehicle);
  const said = lead?.intake_said?.trim() || saidRow?.note?.trim() || null;
  const completeness = cardCompleteness({
    price,
    emi,
    testdrive,
    said: Boolean(said),
  });
  return {
    customerName: lead?.customer_name ?? "",
    model: lead?.model_interest ?? null,
    variant: lead?.variant_interest ?? null,
    ownerName: last?.actor ?? lead?.owner_name ?? null,
    discussedAt: last?.created_at ?? rows[0]?.created_at ?? null,
    minutes: last?.call_seconds ? Math.round(last.call_seconds / 60) : null,
    lines: rows.map((r) => ({
      tool: r.payload?.tool ?? "note",
      text: r.note,
      values: r.payload?.values ?? {},
      at: r.created_at,
      actor: r.actor,
    })),
    price,
    emi,
    testdrive,
    exchange,
    said,
    completeness,
    recordingLine: "Recording is not on file until telephony is connected.",
  };
}

export function cardNotifyWhy(card: HandoverCardView) {
  const bits = [
    card.price ? "price" : null,
    card.emi ? "EMI" : null,
    card.testdrive ? "test drive" : null,
    card.said ? "what he said" : null,
  ].filter(Boolean);
  const filled = `${card.completeness.filled} of ${card.completeness.total} card facts`;
  if (bits.length === 0) return `${filled}. Adviser taps were empty.`;
  return `${filled}: ${bits.join(", ")}.`;
}
