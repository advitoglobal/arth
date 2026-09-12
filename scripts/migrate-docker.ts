import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const composeArgs = ["compose", "-f", "docker-compose.yml"];

function docker(args: string[], input?: string) {
  return spawnSync("docker", args, {
    input,
    encoding: "utf8",
    cwd: process.cwd(),
  });
}

const dir = path.join(process.cwd(), "src/db/migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
const only = process.argv[2];
const run = only ? files.filter((f) => f.startsWith(only)) : files;
if (run.length === 0) {
  console.error("no migration matched");
  process.exit(1);
}

const probe = docker(["version"]);
if (probe.status !== 0) {
  console.error(
    "docker is not available. Install Docker Desktop and retry.",
    probe.stderr || probe.stdout,
  );
  process.exit(probe.status ?? 1);
}

const up = docker([...composeArgs, "up", "-d", "--wait"]);
if (up.status !== 0) {
  console.error(
    "Could not start Postgres. From the repo root run: docker compose up -d",
    up.stderr || up.stdout,
  );
  process.exit(up.status ?? 1);
}

for (const f of run) {
  const r = docker(
    [
      ...composeArgs,
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "postgres",
      "-d",
      "arth",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    readFileSync(path.join(dir, f), "utf8"),
  );
  if (r.status !== 0) {
    console.error(f, r.stderr || r.stdout);
    process.exit(r.status ?? 1);
  }
  console.log("applied", f);
}
