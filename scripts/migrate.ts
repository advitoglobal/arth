import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

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
for (const f of run) {
  const r = spawnSync(
    "sudo",
    ["-u", "postgres", "psql", "-d", "arth", "-v", "ON_ERROR_STOP=1"],
    { input: readFileSync(path.join(dir, f), "utf8"), encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(f, r.stderr || r.stdout);
    process.exit(r.status ?? 1);
  }
  console.log("applied", f);
}
