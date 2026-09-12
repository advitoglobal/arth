import path from "node:path";
import { applySqlFile } from "./apply-sql";

async function main() {
  await applySqlFile(path.join(process.cwd(), "src/db/migrations/0002_seed.sql"));
  console.log("seed applied");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
