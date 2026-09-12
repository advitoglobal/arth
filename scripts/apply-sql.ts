import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import postgres from "postgres";

export function hostedDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (/neon\.tech|sslmode=require/i.test(url) || process.env.VERCEL) return url;
  return null;
}

export function isNeonUrl(url: string | undefined | null) {
  return Boolean(url && /neon\.tech/i.test(url));
}

/** Neon copies the pooler URI by default. DDL needs the compute host. */
export function directDatabaseUrl(url: string) {
  let out = url
    .replace(/-pooler\./gi, ".")
    .replace(/[?&]pgbouncer=true/gi, "")
    .replace(/[?&]channel_binding=require/gi, "")
    .replace(/\?&/g, "?");
  if (!out.includes("?") && out.includes("&")) {
    const amp = out.indexOf("&");
    out = `${out.slice(0, amp)}?${out.slice(amp + 1)}`;
  }
  return out.replace(/[?&]$/, "");
}

export function databaseHost(url: string) {
  const at = url.lastIndexOf("@");
  if (at < 0) return "(unknown)";
  const rest = url.slice(at + 1);
  return rest.split("/")[0]?.split("?")[0] ?? "(unknown)";
}

export async function applySqlFile(absPath: string) {
  const hosted = hostedDatabaseUrl();
  if (hosted) {
    const direct = directDatabaseUrl(hosted);
    const sql = postgres(direct, {
      max: 1,
      ssl: "require",
      prepare: false,
      connect_timeout: 30,
      idle_timeout: 20,
      onnotice: () => {},
    });
    try {
      await sql.file(absPath, { cache: false });
    } finally {
      await sql.end({ timeout: 5 });
    }
    return;
  }

  const r = spawnSync(
    "sudo",
    ["-u", "postgres", "psql", "-d", "arth", "-v", "ON_ERROR_STOP=1"],
    { input: readFileSync(absPath, "utf8"), encoding: "utf8" },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `psql failed on ${absPath}`);
  }
}

export function migrationFiles(only?: string) {
  const dir = path.join(process.cwd(), "src/db/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const run = only ? files.filter((f) => f.startsWith(only)) : files;
  return run.map((f) => path.join(dir, f));
}
