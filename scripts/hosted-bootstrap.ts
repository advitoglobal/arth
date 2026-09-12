/**
 * One-time Neon setup. Uses the owner (direct) URL in DATABASE_URL.
 * Gives arth_app a login password so Vercel does not connect as the Neon owner.
 *
 * DATABASE_URL may be Neon's pooled URI. This script switches to the direct host.
 * Do not commit ARTH_APP_PASSWORD.
 */
import postgres from "postgres";
import { spawnSync } from "node:child_process";
import { directDatabaseUrl, hostedDatabaseUrl } from "./apply-sql";

async function main() {
  const url = hostedDatabaseUrl();
  if (!url) {
    throw new Error("Set DATABASE_URL to the Neon connection string first.");
  }
  const direct = directDatabaseUrl(url);
  if (url.includes("-pooler")) {
    console.log("Using the Neon direct host for migrations (pooler is for Vercel only).");
  }
  const password = process.env.ARTH_APP_PASSWORD?.trim();
  if (!password || password.length < 16) {
    throw new Error("Set ARTH_APP_PASSWORD to at least 16 characters. Do not commit it.");
  }

  const sql = postgres(direct, {
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
