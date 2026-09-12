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

export function assertDirectUrl(url: string) {
  if (url.includes("-pooler")) {
    throw new Error("Migrations need the Neon direct URL, not the pooler URL.");
  }
}

export async function applySqlFile(absPath: string) {
  const hosted = hostedDatabaseUrl();
  if (hosted) {
    assertDirectUrl(hosted);
    const sql = postgres(hosted, {
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
