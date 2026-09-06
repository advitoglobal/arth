import type { Tx } from "@/db/with-tenant";
import { discussionRows } from "@/services/advise";

export async function handoverCard(tx: Tx, leadId: string) {
  const [lead] = await tx<{
    customer_name: string;
    model_interest: string | null;
    variant_interest: string | null;
    owner_name: string | null;
  }[]>`
    SELECT c.full_name AS customer_name, l.model_interest, l.variant_interest, u.full_name AS owner_name
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    LEFT JOIN users u ON u.id = l.owner_user_id
    WHERE l.id = ${leadId}::uuid
  `;
  const rows = await discussionRows(tx, leadId);
  const [last] = await tx<{ call_seconds: number | null; created_at: Date; actor: string | null }[]>`
    SELECT e.call_seconds, e.created_at, u.full_name AS actor
    FROM lead_events e
    LEFT JOIN users u ON u.id = e.actor_id
    WHERE e.lead_id = ${leadId}::uuid AND e.event_type = 'disposition'
    ORDER BY e.created_at DESC
    LIMIT 1
  `;
  return {
    customerName: lead?.customer_name ?? "",
    model: lead?.model_interest,
    variant: lead?.variant_interest,
    ownerName: last?.actor ?? lead?.owner_name,
    discussedAt: last?.created_at ?? rows[0]?.created_at ?? null,
    minutes: last?.call_seconds ? Math.round(last.call_seconds / 60) : null,
    lines: rows.map((r) => ({
      tool: r.payload?.tool ?? "note",
      text: r.note,
      values: r.payload?.values ?? {},
      at: r.created_at,
      actor: r.actor,
    })),
  };
}
