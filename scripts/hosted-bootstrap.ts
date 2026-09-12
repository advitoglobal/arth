/**
 * One-time Neon setup. Uses the owner (direct) URL in DATABASE_URL.
 * Gives arth_app a login password so Vercel does not connect as the Neon owner.
 *
 * DATABASE_URL must be the direct host, not *-pooler.*.
 * Do not commit ARTH_APP_PASSWORD.
 */
import postgres from "postgres";
import { spawnSync } from "node:child_process";
import { assertDirectUrl, hostedDatabaseUrl } from "./apply-sql";

async function main() {
  const url = hostedDatabaseUrl();
  if (!url) {
    throw new Error("Set DATABASE_URL to the Neon direct connection string first.");
  }
  assertDirectUrl(url);
  const password = process.env.ARTH_APP_PASSWORD?.trim();
  if (!password || password.length < 16) {
    throw new Error("Set ARTH_APP_PASSWORD to at least 16 characters. Do not commit it.");
  }

  const sql = postgres(url, {
    max: 1,
    ssl: "require",
    prepare: false,
    connect_timeout: 30,
    onnotice: () => {},
  });
  try {
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'arth_app') THEN
          CREATE ROLE arth_app NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
        END IF;
      END
      $$;
    `);
    const escaped = password.replaceAll("'", "''");
    await sql.unsafe(`ALTER ROLE arth_app WITH LOGIN PASSWORD '${escaped}'`);
  } finally {
    await sql.end({ timeout: 5 });
  }

  const migrate = spawnSync("npx", ["tsx", "scripts/migrate.ts"], {
    encoding: "utf8",
    stdio: "inherit",
    env: process.env,
  });
  if (migrate.status !== 0) {
    process.exit(migrate.status ?? 1);
  }
  console.log("HOSTED_OK. In Vercel, set DATABASE_URL to the Neon pooled URL with user arth_app.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
