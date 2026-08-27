import type { Tx } from "@/db/with-tenant";
import { LATE_LIST_LIMIT, hydrateLeads, type LeadRow } from "@/services/telecalling";

export type TeamSeat = {
  id: string;
  full_name: string;
  username: string | null;
  role_key: string;
  branch: string | null;
  owned: number;
  late: number;
};

export async function controlSnapshot(tx: Tx) {
  const [actor] = await tx<{ id: string; role_key: string; branch_id: string | null }[]>`
    SELECT u.id::text, u.role_key, p.branch_id::text
    FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = NULLIF(current_setting('app.user_id', true), '')::uuid
  `;
  if (!actor) {
    throw new Error("This seat does not belong to this dealer.");
  }

  const people =
    actor.role_key === "mgr" && actor.branch_id
      ? await tx<{
          id: string;
          full_name: string;
          username: string | null;
          role_key: string;
          branch: string | null;
        }[]>`
          SELECT
            u.id::text,
            u.full_name,
            u.username,
            u.role_key,
            b.name AS branch
          FROM users u
          LEFT JOIN positions p ON p.id = u.position_id
          LEFT JOIN branches b ON b.id = p.branch_id
          WHERE u.is_active
            AND u.role_key IN ('tele', 'lead', 'mgr', 'sales', 'owner')
            AND p.branch_id = ${actor.branch_id}::uuid
          ORDER BY u.full_name
        `
      : await tx<{
          id: string;
          full_name: string;
          username: string | null;
          role_key: string;
          branch: string | null;
        }[]>`
          SELECT
            u.id::text,
            u.full_name,
            u.username,
            u.role_key,
            b.name AS branch
          FROM users u
          LEFT JOIN positions p ON p.id = u.position_id
          LEFT JOIN branches b ON b.id = p.branch_id
          WHERE u.is_active
            AND u.role_key IN ('tele', 'lead', 'mgr', 'sales', 'owner')
          ORDER BY u.full_name
        `;

  const [book] = await tx<{ names: string; unowned: string; late: string }[]>`
    SELECT
      count(*)::text AS names,
      count(*) FILTER (WHERE owner_user_id IS NULL)::text AS unowned,
      count(*) FILTER (
        WHERE
          (next_action_at IS NOT NULL AND next_action_at < now())
          OR (
            first_response_due IS NOT NULL
            AND first_responded_at IS NULL
            AND first_response_due < now()
          )
      )::text AS late
    FROM leads
  `;

  const perOwner = await tx<{ owner_user_id: string; owned: string; late: string }[]>`
    SELECT
      owner_user_id::text,
      count(*)::text AS owned,
      count(*) FILTER (
        WHERE
          (next_action_at IS NOT NULL AND next_action_at < now())
          OR (
            first_response_due IS NOT NULL
            AND first_responded_at IS NULL
            AND first_response_due < now()
          )
      )::text AS late
    FROM leads
    WHERE owner_user_id IS NOT NULL
    GROUP BY owner_user_id
  `;
  const load = new Map(perOwner.map((r) => [r.owner_user_id, r]));

  const teles = people.filter((p) => p.role_key === "tele");
  const team: TeamSeat[] = teles.map((t) => {
    const row = load.get(t.id);
    return {
      ...t,
      owned: Number(row?.owned ?? 0),
      late: Number(row?.late ?? 0),
    };
  });

  const unownedIds = await tx<{ id: string }[]>`
    SELECT id FROM leads
    WHERE owner_user_id IS NULL
    ORDER BY created_at DESC
    LIMIT 12
  `;
  const lateIds = await tx<{ id: string }[]>`
    SELECT id FROM leads
    WHERE
      (next_action_at IS NOT NULL AND next_action_at < now())
      OR (
        first_response_due IS NOT NULL
        AND first_responded_at IS NULL
        AND first_response_due < now()
      )
    ORDER BY next_action_at ASC NULLS LAST
    LIMIT ${LATE_LIST_LIMIT}
  `;

  const unowned = await hydrateLeads(
    tx,
    unownedIds.map((r) => String(r.id)),
  );
  const late = await hydrateLeads(
    tx,
    lateIds.map((r) => String(r.id)),
  );
  const rows: LeadRow[] = [...unowned, ...late];

  return {
    actor,
    people,
    team,
    rows,
    unowned,
    late,
    counts: {
      names: Number(book?.names ?? 0),
      unowned: Number(book?.unowned ?? 0),
      late: Number(book?.late ?? 0),
      teles: team.length,
    },
  };
}
