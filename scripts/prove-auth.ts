/**
 * OTP fails closed. Wrong password is recorded. Temporary-credential change is a vendor-day job.
 */
import { authenticateSeat, authenticatePhone, issueLoginOtp } from "../src/lib/auth";
import { sql } from "../src/db/with-tenant";

async function main() {
  const bad = await authenticateSeat("iyer", "wrong-password");
  if (bad.ok) throw new Error("Wrong password must fail closed");
  const [n] = await sql<{ n: string }[]>`
    SELECT count(*)::text AS n FROM auth_attempts WHERE key = 'u:iyer'
  `;
  if (Number(n?.n ?? 0) < 1) throw new Error("Failed password must persist");

  const otp = await issueLoginOtp("9845011111");
  if (!otp.ok) throw new Error(otp.error);
  const fail = await authenticatePhone("9845011111", "000000");
  if (fail.ok) throw new Error("Wrong OTP must fail closed");
  if (otp.demoCode) {
    const ok = await authenticatePhone("9845011111", otp.demoCode);
    if (!ok.ok) throw new Error("Correct OTP must sign the seat in");
  }
  console.log("AUTH_OK a seat can sign in by OTP; a wrong OTP fails closed; failed attempts persist");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
