import type { Tx } from "@/db/with-tenant";
import { isFirstResponseLate, isFollowUpLate } from "@/domain/clock";
import { listPipeline, type LeadRow } from "@/services/telecalling";

export type TeamSeat = {
  id: string;
  full_name: string;
  username: string | null;
  role_key: string;
  branch: string | null;
  owned: number;
  late: number;
};

function lateOf(row: LeadRow) {
  return isFirstResponseLate(row) || isFollowUpLate(row.next_action_at);
}

const PEOPLE_SELECT = `
      u.id::text,
      u.full_name,
      u.username,
      u.role_key,
      b.name AS branch
`;

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

  const rows = await listPipeline(tx, actor.id);
  const teles = people.filter((p) => p.role_key === "tele");
  const team: TeamSeat[] = teles.map((t) => {
    const mine = rows.filter((r) => r.owner_user_id === t.id);
    return {
      ...t,
      owned: mine.length,
      late: mine.filter(lateOf).length,
    };
  });

  const unowned = rows.filter((r) => !r.owner_user_id);
  const late = rows.filter(lateOf);

  return {
    actor,
    people,
    team,
    rows,
    unowned,
    late,
    counts: {
      names: rows.length,
      unowned: unowned.length,
      late: late.length,
      teles: team.length,
    },
  };
}
