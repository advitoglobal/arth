import {
  applyHostedMigrations,
  applySqlFile,
  hostedDatabaseUrl,
  migrationFiles,
} from "./apply-sql";

async function main() {
  const files = migrationFiles(process.argv[2]);
  if (files.length === 0) {
    console.error("no migration matched");
    process.exit(1);
  }
  if (hostedDatabaseUrl()) {
    await applyHostedMigrations(files);
    return;
  }
  for (const file of files) {
    await applySqlFile(file);
    console.log("applied", file.split(/[/\\]/).pop());
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
