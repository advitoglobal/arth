import { sql } from "@/db/with-tenant";
import { verifyPassword } from "@/lib/password";
import { roleLabel, type Seat, type SeatKind } from "@/lib/seats";

const fails = new Map<string, { n: number; until: number }>();

export async function authenticateSeat(
  username: string,
  password: string,
): Promise<{ ok: true; seat: Seat } | { ok: false; error: string }> {
  const key = username.trim().toLowerCase();
  if (!key || !password) {
    return { ok: false, error: "Enter a username and a password." };
  }
  const gate = fails.get(key);
  if (gate && gate.until > Date.now()) {
    return { ok: false, error: "Too many attempts. Wait a minute and try again." };
  }

  const [row] = await sql<{
    user_id: string;
    tenant_id: string | null;
    password_hash: string | null;
    role_key: string;
    workspace_key: string;
    full_name: string;
    tenant_name: string;
    kind: string;
  }[]>`
    SELECT
      user_id::text,
      tenant_id::text,
      password_hash,
      role_key,
      workspace_key,
      full_name,
      tenant_name,
      kind
    FROM arth_authenticate(${key})
  `;
  const pass = row ? verifyPassword(password, row.password_hash) : false;
  if (!row || !pass) {
    const n = (gate?.n ?? 0) + 1;
    fails.set(key, {
      n,
      until: n >= 8 ? Date.now() + 60_000 : 0,
    });
    return { ok: false, error: "That username or password is not right." };
  }
  fails.delete(key);
  const kind: SeatKind = row.kind === "platform" ? "platform" : "dealer";
  return {
    ok: true,
    seat: {
      seatKey: key,
      kind,
      tenantId: row.tenant_id ?? "",
      userId: row.user_id,
      name: row.full_name,
      roleKey: row.role_key,
      roleLabel: roleLabel(row.role_key),
      workspaceKey: row.workspace_key,
      tenantName: row.tenant_name,
      username: key,
    },
  };
}
