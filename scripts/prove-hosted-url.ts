import { databaseHost, directDatabaseUrl } from "./apply-sql";

const pooled =
  "postgresql://neondb_owner:secret@ep-demo-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pgbouncer =
  "postgresql://neondb_owner:secret@ep-demo.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true";

const a = directDatabaseUrl(pooled);
const b = directDatabaseUrl(pgbouncer);

if (a.includes("-pooler")) {
  throw new Error("pooler host was not stripped");
}
if (a.includes("channel_binding")) {
  throw new Error("channel_binding was not stripped");
}
if (databaseHost(a) !== "ep-demo.ap-southeast-1.aws.neon.tech") {
  throw new Error(`unexpected host ${databaseHost(a)}`);
}
if (b.includes("pgbouncer")) {
  throw new Error("pgbouncer flag was not stripped");
}

console.log("HOSTED_URL_OK");
