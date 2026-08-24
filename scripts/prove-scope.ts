/**
 * Two telecallers on Whitefield: own books stay apart. Search is tenant-wide.
 */
import postgres from "postgres";

const app = postgres(
  process.env.DATABASE_URL ??
    "postgres://arth_app:arth_local_dev_only@127.0.0.1:5432/arth",
);

const TENANT = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const NAIR = "dddddddd-dddd-dddd-dddd-ddddddddddd3";

async function main() {
  await app.begin(async (tx) => {
    await tx`SELECT set_config('app.tenant_id', ${TENANT}, true)`;
    const iyer = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM leads
      WHERE owner_user_id = ${IYER}::uuid AND lost_reason_key IS NULL AND stage_key <> 'delivered'
    `;
    const nair = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM leads
      WHERE owner_user_id = ${NAIR}::uuid AND lost_reason_key IS NULL AND stage_key <> 'delivered'
    `;
    if (Number(iyer[0].n) === 0 || Number(nair[0].n) === 0) {
      throw new Error("Each Whitefield telecaller must have an open book");
    }
    const overlap = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM leads
      WHERE owner_user_id = ${IYER}::uuid
        AND id IN (SELECT id FROM leads WHERE owner_user_id = ${NAIR}::uuid)
    `;
    if (Number(overlap[0].n) !== 0) throw new Error("Books overlap");
  });
  console.log("SCOPE_OK two Whitefield telecallers, separate books");
  await app.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
