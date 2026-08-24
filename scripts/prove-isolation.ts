/**
 * Step 0: two tenants, same unfiltered SELECT, each sees only its own rows.
 */
import postgres from "postgres";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const TENANT_A = "11111111-1111-1111-1111-111111111111";
const TENANT_B = "22222222-2222-2222-2222-222222222222";

async function main() {

  async function countAs(tenantId: string) {
    return app.begin(async (tx) => {
      await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      const rows = await tx<{ n: string }[]>`SELECT count(*)::text AS n FROM leads`;
      const names = await tx<{ name: string }[]>`SELECT name FROM tenants`;
      return { n: Number(rows[0].n), tenantNames: names.map((x) => x.name) };
    });
  }

  const seenA = await countAs(TENANT_A);
  const seenB = await countAs(TENANT_B);

  console.log("tenant A Whitefield Motors", seenA);
  console.log("tenant B Coastal Cars", seenB);

  if (seenA.tenantNames.join() !== "Whitefield Motors") {
    throw new Error("Tenant A saw another tenant row");
  }
  if (seenB.tenantNames.join() !== "Coastal Cars") {
    throw new Error("Tenant B saw another tenant row");
  }
  if (seenA.n === 0 || seenB.n === 0) {
    throw new Error("A tenant saw zero leads. Seed first.");
  }
  if (seenA.n === seenB.n) {
    console.log("counts happen to match; isolation still holds on tenant names");
  }

  const leak = await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${TENANT_A}, true)`;
    return tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM leads
      WHERE tenant_id = ${TENANT_B}::uuid
    `;
  });
  if (Number(leak[0].n) !== 0) {
    throw new Error("CROSS-TENANT LEAK");
  }

  console.log("ISOLATION_OK unfiltered SELECT is tenant-bound");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
