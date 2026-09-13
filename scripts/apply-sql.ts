import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

function hostedSql(url: string) {
  return postgres(url, {
    max: 1,
    ssl: "require",
    prepare: false,
    connect_timeout: 30,
    idle_timeout: 20,
    onnotice: () => {},
  });
}

function rewriteHostedSql(body: string) {
  return body.replace(/OWNER TO postgres;/g, "OWNER TO CURRENT_USER;");
}

async function applyHostedFile(sql: ReturnType<typeof postgres>, absPath: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "arth-sql-"));
  const tmp = path.join(dir, path.basename(absPath));
  try {
    writeFileSync(tmp, rewriteHostedSql(readFileSync(absPath, "utf8")));
    await sql.file(tmp, { cache: false });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function applySqlFile(absPath: string) {
  const hosted = hostedDatabaseUrl();
  if (hosted) {
    const sql = hostedSql(directDatabaseUrl(hosted));
    try {
      await applyHostedFile(sql, absPath);
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

/** Neon has neondb_owner, not the local postgres role. Resume after a mid-run failure. */
export async function applyHostedMigrations(files: string[]) {
  const hosted = hostedDatabaseUrl();
  if (!hosted) {
    throw new Error("applyHostedMigrations needs a Neon DATABASE_URL.");
  }
  const sql = hostedSql(directDatabaseUrl(hosted));
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS arth_schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await sql.unsafe(`REVOKE ALL ON TABLE arth_schema_migrations FROM PUBLIC`);

    const [{ leads }] = await sql<{ leads: boolean }[]>`
      SELECT to_regclass('public.leads') IS NOT NULL AS leads
    `;
    const [{ n }] = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM arth_schema_migrations
    `;
    if (leads && n === 0) {
      const names = files
        .map((file) => path.basename(file))
        .filter((name) => name < "0011");
      for (const name of names) {
        await sql`
          INSERT INTO arth_schema_migrations (filename) VALUES (${name})
          ON CONFLICT DO NOTHING
        `;
      }
      console.log(
        `resume: recorded ${names.length} migrations already on this Neon database`,
      );
    }

    for (const file of files) {
      const name = path.basename(file);
      const seen = await sql`
        SELECT 1 FROM arth_schema_migrations WHERE filename = ${name}
      `;
      if (seen.length > 0) {
        console.log("skip", name);
        continue;
      }
      await applyHostedFile(sql, file);
      await sql`
        INSERT INTO arth_schema_migrations (filename) VALUES (${name})
      `;
      console.log("applied", name);
    }
  } finally {
    await sql.end({ timeout: 5 });
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
