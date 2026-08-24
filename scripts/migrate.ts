import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const file = path.join(process.cwd(), "src/db/migrations/0001_core.sql");
const sql = readFileSync(file, "utf8");
const r = spawnSync("sudo", ["-u", "postgres", "psql", "-d", "arth", "-v", "ON_ERROR_STOP=1"], {
  input: sql,
  encoding: "utf8",
});
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(r.status ?? 1);
}
console.log("migration 0001 applied");
