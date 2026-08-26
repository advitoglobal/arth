import postgres from "postgres";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = postgres(url, {
  max: 8,
  idle_timeout: 20,
  connect_timeout: 10,
});

export type Tx = postgres.TransactionSql<Record<string, unknown>>;

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
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    await tx`SELECT set_config('app.user_id', ${userId}, true)`;
    const [seat] = await tx<{ id: string }[]>`
      SELECT id::text FROM users
      WHERE id = ${userId}::uuid
        AND tenant_id = ${tenantId}::uuid
        AND is_active
    `;
    if (!seat) {
      throw new Error("This seat does not belong to this dealer.");
    }
    return fn(tx);
  }) as Promise<T>;
}
