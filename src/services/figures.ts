import type { Tx } from "@/db/with-tenant";
import { pointsAreOfficial, unofficialScoresCopy } from "@/vendors/status";
import { promiseAccuracy } from "@/services/delivery";

export type Figure = {
  label: string;
  value: string;
  source: string;
  period: string;
  exclusion?: string;
};

export async function junkRates(tx: Tx) {
  return tx<{ source_key: string; n: string; junk: string }[]>`
    SELECT
      source_key,
      count(*)::text AS n,
      count(*) FILTER (WHERE is_not_enquiry)::text AS junk
    FROM leads
    GROUP BY source_key
    ORDER BY source_key
  `;
}

export async function junkByTelecaller(tx: Tx) {
  return tx<{ full_name: string; n: string; junk: string }[]>`
    SELECT
      COALESCE(u.full_name, 'Unowned') AS full_name,
      count(*)::text AS n,
      count(*) FILTER (WHERE l.is_not_enquiry)::text AS junk
    FROM leads l
    LEFT JOIN users u ON u.id = l.owner_user_id
    GROUP BY u.full_name
    ORDER BY count(*) FILTER (WHERE l.is_not_enquiry) DESC
  `;
}

export async function seatFigures(tx: Tx, roleKey: string, userId: string): Promise<Figure[]> {
  const period = "today in India Standard Time";
  const [queue] = await tx<{ due: string; late: string }[]>`
    SELECT
      count(*) FILTER (
        WHERE COALESCE(is_not_enquiry, false) = false AND lost_reason_key IS NULL
      )::text AS due,
      count(*) FILTER (
        WHERE COALESCE(is_not_enquiry, false) = false
          AND lost_reason_key IS NULL
          AND (
            (next_action_at IS NOT NULL AND next_action_at < now())
            OR (first_response_due IS NOT NULL AND first_responded_at IS NULL AND first_response_due < now())
          )
      )::text AS late
    FROM leads
    WHERE owner_user_id = ${userId}::uuid
       OR (owner_user_id IS NULL AND first_responded_at IS NULL)
  `;
  const [points] = await tx<{ pts: string }[]>`
    SELECT COALESCE(sum(amount), 0)::text AS pts
    FROM point_movements
    WHERE user_id = ${userId}::uuid
      AND created_at >= date_trunc('month', timezone('Asia/Kolkata', now())::timestamp)
  `;
  const [outcomes] = await tx<{ n: string }[]>`
    SELECT count(*)::text AS n FROM lead_events
    WHERE actor_id = ${userId}::uuid
      AND event_type = 'disposition'
      AND timezone('Asia/Kolkata', created_at)::date = timezone('Asia/Kolkata', now())::date
  `;
  const figures: Figure[] = [];
  if (["tele", "svctele", "instele"].includes(roleKey)) {
    figures.push(
      {
        label: "Queue remaining",
        value: queue?.due ?? "0",
        source: "your Today list, real enquiries only",
        period,
      },
      { label: "Late", value: queue?.late ?? "0", source: "your Today list", period },
      {
        label: "Outcomes logged today",
        value: outcomes?.n ?? "0",
        source: "your disposition ledger",
        period,
      },
      {
        label: "Points this month",
        value: points?.pts ?? "0",
        source: "point movements",
        period: "this calendar month, IST",
        exclusion: pointsAreOfficial() ? undefined : unofficialScoresCopy(),
      },
    );
  }
  if (["mgr", "lead", "salesmgr", "gm", "owner"].includes(roleKey)) {
    const junk = await junkRates(tx);
    const junkLine = junk.map((j) => `${j.source_key} ${j.junk}/${j.n}`).join(", ") || "none yet";
    figures.push({
      label: "Junk rate by source",
      value: junkLine,
      source: "leads.is_not_enquiry against all arrivals",
      period: "all recorded enquiries at this dealer",
    });
  }
  if (["gm", "owner"].includes(roleKey)) {
    const acc = await promiseAccuracy(tx);
    figures.push({
      label: "Delivery promises moved",
      value: acc.moved,
      source: "delivery_promises, more than one row on a booking",
      period: "booked and delivered, junk excluded",
      exclusion: `External blocks ${acc.external_blocks} excluded from accuracy and counted. Internal blocks ${acc.internal_blocks}.`,
    });
  }
  return figures;
}
