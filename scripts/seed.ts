import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const file = path.join(process.cwd(), "src/db/migrations/0002_seed.sql");
const r = spawnSync("sudo", ["-u", "postgres", "psql", "-d", "arth", "-v", "ON_ERROR_STOP=1"], {
  input: readFileSync(file, "utf8"),
  encoding: "utf8",
});
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(r.status ?? 1);
}
console.log("seed applied");
