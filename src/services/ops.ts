import type { Tx } from "@/db/with-tenant";
import { writeAudit } from "@/services/floor-register";

export async function exportOffboarding(tx: Tx, actorId: string) {
  const rows = await tx<{
    enquiry: string;
    customer_name: string;
    phone: string;
    department_key: string;
    stage_key: string;
    source_key: string;
  }[]>`
    SELECT
      l.id::text AS enquiry,
      c.full_name AS customer_name,
      c.phone,
      l.department_key,
      l.stage_key,
      l.source_key
    FROM leads l
    JOIN customers c ON c.id = l.customer_id
    ORDER BY l.created_at
  `;
  await tx`
    INSERT INTO offboarding_exports (tenant_id, actor_id, row_count)
    VALUES (current_setting('app.tenant_id')::uuid, ${actorId}::uuid, ${rows.length})
  `;
  await writeAudit(tx, "offboarding_export", "tenant", { row_count: rows.length }, actorId);
  const csv = [
    "enquiry,customer,phone,department,stage,source",
    ...rows.map((r) =>
      [r.enquiry, r.customer_name, r.phone, r.department_key, r.stage_key, r.source_key].join(","),
    ),
  ].join("\n");
  return {
    recorded: `${rows.length} rows exported. This is the contractual offboarding file.`,
    csv,
    rowCount: rows.length,
  };
}
