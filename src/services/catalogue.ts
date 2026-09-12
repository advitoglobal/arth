import type { Tx } from "@/db/with-tenant";

const STALE_DAYS = 30;

export type PriceBreakup = {
  model: string;
  variant: string;
  colour: string | null;
  exShowroomPaise: number;
  rtoPaise: number;
  insurancePaise: number;
  accessoriesPaise: number;
  onRoadPaise: number;
  confirmedAt: Record<string, string>;
  stale: boolean;
  oldestConfirm: string | null;
};

export function computeOnRoad(parts: {
  exShowroomPaise: number;
  rtoPaise: number;
  insurancePaise: number;
  accessoriesPaise: number;
}) {
  return parts.exShowroomPaise + parts.rtoPaise + parts.insurancePaise + parts.accessoriesPaise;
}

function staleDate(iso: string | null | undefined) {
  if (!iso) return true;
  const d = new Date(iso);
  return Date.now() - d.getTime() > STALE_DAYS * 24 * 60 * 60 * 1000;
}

export async function listCatalogue(tx: Tx) {
  return tx<{ oem_key: string; model: string; variant: string; vehicle_type: string }[]>`
    SELECT oem_key, model, variant, vehicle_type FROM oem_catalogue ORDER BY model, variant
  `;
}

export async function listCatalogueModels(tx: Tx) {
  return tx<{ model: string }[]>`
    SELECT DISTINCT model FROM oem_catalogue ORDER BY model
  `;
}

export async function listCatalogueVariants(tx: Tx, model?: string) {
  return tx<{ model: string; variant: string }[]>`
    SELECT model, variant FROM oem_catalogue
    WHERE ${model || null}::text IS NULL OR model = ${model ?? ""}
    ORDER BY model, variant
  `;
}

export async function listPriceColours(tx: Tx, model?: string) {
  return tx<{ model: string; colour: string }[]>`
    SELECT DISTINCT model, colour FROM price_master
    WHERE colour IS NOT NULL
      AND (${model || null}::text IS NULL OR model = ${model ?? ""})
    ORDER BY model, colour
  `;
}

export async function onRoadFor(
  tx: Tx,
  model: string,
  variant?: string | null,
): Promise<PriceBreakup | null> {
  const master = await tx<{
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
    WHERE model = ${model}
      AND (${variant || null}::text IS NULL OR variant = ${variant ?? ""})
    ORDER BY variant
    LIMIT 1
  `;
  const rows = await tx<{
    model: string;
    variant: string;
    colour: string | null;
    component_key: string;
    amount_paise: string;
    confirmed_at: string;
  }[]>`
    SELECT
      p.model,
      p.variant,
      p.colour,
      c.component_key,
      c.amount_paise::text,
      c.confirmed_at::text
    FROM price_master p
    JOIN price_components c ON c.price_master_id = p.id
    WHERE p.model = ${model}
      AND (${variant || null}::text IS NULL OR p.variant = ${variant ?? ""})
    ORDER BY p.variant
  `;
  if (rows.length === 0) {
    const p = master[0];
    if (!p) return null;
    const breakup = {
      exShowroomPaise: Number(p.ex_showroom_paise),
      rtoPaise: Number(p.rto_paise),
      insurancePaise: Number(p.insurance_paise),
      accessoriesPaise: Number(p.accessories_paise),
    };
    const day = String(p.confirmed_at).slice(0, 10);
    return {
      model: p.model,
      variant: p.variant,
      colour: p.colour,
      ...breakup,
      onRoadPaise: computeOnRoad(breakup),
      confirmedAt: {
        ex_showroom: day,
        rto: day,
        insurance: day,
        accessories: day,
      },
      stale: staleDate(day),
      oldestConfirm: day,
    };
  }
  const parts: Record<string, number> = {};
  const dates: Record<string, string> = {};
  for (const row of rows) {
    parts[row.component_key] = Number(row.amount_paise);
    dates[row.component_key] = String(row.confirmed_at).slice(0, 10);
  }
  const breakup = {
    exShowroomPaise: parts.ex_showroom ?? 0,
    rtoPaise: parts.rto ?? 0,
    insurancePaise: parts.insurance ?? 0,
    accessoriesPaise: parts.accessories ?? 0,
  };
  const oldest = Object.values(dates).sort()[0] ?? null;
  return {
    model: rows[0].model,
    variant: rows[0].variant,
    colour: rows[0].colour,
    ...breakup,
    onRoadPaise: computeOnRoad(breakup),
    confirmedAt: dates,
    stale: Object.values(dates).some(staleDate),
    oldestConfirm: oldest,
  };
}

export async function freezeOnRoadQuote(tx: Tx, leadId: string, actorId: string) {
  const [lead] = await tx<{ model_interest: string | null; variant_interest: string | null }[]>`
    SELECT model_interest, variant_interest FROM leads WHERE id = ${leadId}::uuid
  `;
  if (!lead?.model_interest) throw new Error("This enquiry has no model to quote.");
  const price = await onRoadFor(tx, lead.model_interest, lead.variant_interest);
  if (!price) {
    throw new Error("No price is on the master for this model. The dealer admin enters it. A guessed price is not issued.");
  }
  const frozen = {
    ...price,
    frozen_at: new Date().toISOString(),
    note: "This quotation will not reprice itself later. On-road was computed, not stored as a field.",
  };
  await tx`
    INSERT INTO quotations (tenant_id, lead_id, frozen, actor_id)
    VALUES (current_setting('app.tenant_id')::uuid, ${leadId}::uuid, ${tx.json(frozen)}, ${actorId}::uuid)
  `;
  return frozen;
}
