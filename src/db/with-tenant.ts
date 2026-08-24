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

export async function withTenant<T>(
  ctx: { tenantId: string; userId: string },
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`;
    await tx`SELECT set_config('app.user_id', ${ctx.userId}, true)`;
    return fn(tx);
  }) as Promise<T>;
}
