import { spawnSync } from "node:child_process";

const checks: [string, string][] = [
  ["db:isolate", "ISOLATION_OK"],
  ["db:clock", "CLOCK_OK"],
  ["db:assign", "ASSIGN_OK"],
  ["db:access", "ACCESS_OK"],
  ["db:scope", "SCOPE_OK"],
  ["db:search", "SEARCH_OK"],
  ["db:ledger", "LEDGER_OK"],
  ["db:disposition", "DISPOSITION_OK"],
  ["db:queue", "QUEUE_OK"],
];

let failed = 0;
for (const [script, token] of checks) {
  const r = spawnSync("npm", ["run", script], { encoding: "utf8" });
  const out = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
  process.stdout.write(out);
  if (r.status !== 0 || !out.includes(token)) {
    console.error(`FAIL ${script} (want ${token})`);
    failed = 1;
  } else {
    console.log(`PASS ${script}`);
  }
}

if (failed) {
  process.exit(1);
}
console.log("PROVE_OK");
