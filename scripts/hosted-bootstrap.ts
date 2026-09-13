/**
 * One-time Neon setup. Uses the owner (direct) URL in DATABASE_URL.
 * Gives arth_app a login password so Vercel does not connect as the Neon owner.
 *
 * Reads `.env.local` from the Neon Cursor plugin (`DATABASE_URL_UNPOOLED`).
 * A pooled URI still works: this script switches to the compute host.
 * Do not commit ARTH_APP_PASSWORD.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { spawnSync } from "node:child_process";
import {
  databaseHost,
  directDatabaseUrl,
  isNeonUrl,
} from "./apply-sql";

function envFile(name: string) {
  const abs = path.join(process.cwd(), name);
  if (!existsSync(abs)) return {} as Record<string, string>;
  const out: Record<string, string> = {};
  for (const line of readFileSync(abs, "utf8").split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key) out[key] = val;
  }
  return out;
}

function neonOwnerUrl() {
  const file = envFile(".env.local");
  const unpooled =
    process.env.DATABASE_URL_UNPOOLED?.trim() || file.DATABASE_URL_UNPOOLED?.trim();
  const pooled = isNeonUrl(process.env.DATABASE_URL)
    ? process.env.DATABASE_URL.trim()
    : file.DATABASE_URL?.trim();
  if (isNeonUrl(unpooled)) {
    return { label: "plugin unpooled", url: directDatabaseUrl(unpooled!) };
  }
  if (isNeonUrl(pooled)) {
    return { label: "pooled (rewritten)", url: directDatabaseUrl(pooled!) };
  }
  return null;
}

async function main() {
  const neon = neonOwnerUrl();
  if (!neon) {
    throw new Error(
      "No Neon URL. Connect the Neon plugin (writes .env.local) or set DATABASE_URL.",
    );
  }
  const direct = neon.url;
  console.log(
    `Using the Neon direct host for migrations: ${databaseHost(direct)} (${neon.label}).`,
  );
  const file = envFile(".env.local");
  const password =
    process.env.ARTH_APP_PASSWORD?.trim() || file.ARTH_APP_PASSWORD?.trim();
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
    env: { ...process.env, DATABASE_URL: direct },
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
