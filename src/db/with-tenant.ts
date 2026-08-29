import postgres from "postgres";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = postgres(url, {
  max: 48,
  idle_timeout: 20,
  connect_timeout: 10,
});

export type Tx = postgres.TransactionSql<Record<string, unknown>>;

export function isSessionGuardError(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  return (
    message.includes("Session is incomplete") ||
    message.includes("does not belong to this dealer") ||
    message.includes("not an Advito operator") ||
    message.includes("No signed-in seat") ||
    message.includes("never a dealer book")
  );
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireSessionId(value: string) {
  const id = value.trim();
  if (!id || !UUID.test(id)) {
    throw new Error("Session is incomplete. Sign in again.");
  }
  return id;
}

export async function withTenant<T>(
  ctx: { tenantId: string; userId: string },
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  const tenantId = requireSessionId(ctx.tenantId ?? "");
  const userId = requireSessionId(ctx.userId ?? "");

  return sql.begin(async (tx) => {
    await tx`SELECT set_config('statement_timeout', '8000', true)`;
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SELECT set_config('app.user_id', ${userId}, true)`;
    await tx`SELECT set_config('app.platform_user_id', '', true)`;
    const [seat] = await tx<{
      id: string;
      role_key: string;
      branch_id: string | null;
      position_id: string | null;
    }[]>`
      SELECT
        u.id::text,
        u.role_key,
        p.branch_id::text,
        u.position_id::text
      FROM users u
      LEFT JOIN positions p ON p.id = u.position_id
      WHERE u.id = ${userId}::uuid
        AND u.tenant_id = ${tenantId}::uuid
        AND u.is_active
    `;
    if (!seat) {
      throw new Error("This seat does not belong to this dealer.");
    }
    await tx`SELECT set_config('app.role_key', ${seat.role_key}, true)`;
    await tx`SELECT set_config('app.branch_id', ${seat.branch_id ?? ""}, true)`;
    await tx`SELECT set_config('app.position_id', ${seat.position_id ?? ""}, true)`;
    return fn(tx);
  }) as Promise<T>;
}

export async function withPlatform<T>(
  platformUserId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  const id = requireSessionId(platformUserId);

  return sql.begin(async (tx) => {
    await tx`SELECT set_config('statement_timeout', '8000', true)`;
    await tx`SELECT set_config('app.platform_user_id', ${id}, true)`;
    await tx`SELECT set_config('app.tenant_id', '', true)`;
    await tx`SELECT set_config('app.user_id', '', true)`;
    await tx`SELECT set_config('app.role_key', '', true)`;
    await tx`SELECT set_config('app.branch_id', '', true)`;
    await tx`SELECT set_config('app.position_id', '', true)`;
    const [row] = await tx<{ id: string }[]>`
      SELECT id::text FROM platform_users
      WHERE id = ${id}::uuid AND is_active
    `;
    if (!row) {
      throw new Error("This is not an Advito operator seat.");
    }
    return fn(tx);
  }) as Promise<T>;
}

export async function withPlatformDealer<T>(
  ctx: { platformUserId: string; tenantId: string },
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  const platformUserId = requireSessionId(ctx.platformUserId ?? "");
  const tenantId = requireSessionId(ctx.tenantId ?? "");

  return sql.begin(async (tx) => {
    await tx`SELECT set_config('statement_timeout', '8000', true)`;
    await tx`SELECT set_config('app.platform_user_id', ${platformUserId}, true)`;
    await tx`SELECT set_config('app.tenant_id', '', true)`;
    await tx`SELECT set_config('app.user_id', '', true)`;
    const [plat] = await tx<{ role_key: string }[]>`
      SELECT role_key FROM platform_users
      WHERE id = ${platformUserId}::uuid AND is_active
    `;
    if (plat?.role_key === "adv_onboard") {
      throw new Error("Advito onboarding sees configuration, never a dealer book.");
    }
    const [ops] = await tx<{ id: string | null }[]>`
      SELECT arth_platform_ops_user(${tenantId}::uuid)::text AS id
    `;
    if (!ops?.id) {
      throw new Error("This dealer has no support seat.");
    }
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SELECT set_config('app.user_id', ${ops.id}, true)`;
    const [seat] = await tx<{
      role_key: string;
      branch_id: string | null;
      position_id: string | null;
    }[]>`
      SELECT u.role_key, p.branch_id::text, u.position_id::text
      FROM users u
      LEFT JOIN positions p ON p.id = u.position_id
      WHERE u.id = ${ops.id}::uuid
    `;
    await tx`SELECT set_config('app.role_key', ${seat?.role_key ?? "ops"}, true)`;
    await tx`SELECT set_config('app.branch_id', ${seat?.branch_id ?? ""}, true)`;
    await tx`SELECT set_config('app.position_id', ${seat?.position_id ?? ""}, true)`;
    return fn(tx);
  }) as Promise<T>;
}
