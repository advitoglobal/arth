import { sql } from "@/db/with-tenant";
import { hashPassword, verifyPassword } from "@/lib/password";
import { roleLabel, type Seat, type SeatKind } from "@/lib/seats";
import { randomInt } from "node:crypto";
import { sendOtp } from "@/vendors/sms";

const fails = new Map<string, { n: number; until: number }>();

function gated(key: string): string | null {
  const gate = fails.get(key);
  if (gate && gate.until > Date.now()) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return null;
}

function bumpFail(key: string) {
  const gate = fails.get(key);
  const n = (gate?.n ?? 0) + 1;
  fails.set(key, { n, until: n >= 8 ? Date.now() + 60_000 : 0 });
  void sql`INSERT INTO auth_attempts (key) VALUES (${key})`.catch(() => undefined);
}

export async function authenticateSeat(
  username: string,
  password: string,
): Promise<{ ok: true; seat: Seat } | { ok: false; error: string }> {
  const key = username.trim().toLowerCase();
  if (!key || !password) {
    return { ok: false, error: "Enter a username and a password." };
  }
  const locked = gated(`u:${key}`);
  if (locked) return { ok: false, error: locked };

  const [row] = await sql<{
    user_id: string;
    tenant_id: string | null;
    password_hash: string | null;
    role_key: string;
    workspace_key: string;
    full_name: string;
    tenant_name: string;
    kind: string;
  }[]>`
    SELECT
      user_id::text,
      tenant_id::text,
      password_hash,
      role_key,
      workspace_key,
      full_name,
      tenant_name,
      kind
    FROM arth_authenticate(${key})
  `;
  const pass = row ? verifyPassword(password, row.password_hash) : false;
  if (!row || !pass) {
    bumpFail(`u:${key}`);
    return { ok: false, error: "That username or password is not right." };
  }
  fails.delete(`u:${key}`);
  const kind: SeatKind = row.kind === "platform" ? "platform" : "dealer";
  return {
    ok: true,
    seat: {
      seatKey: key,
      kind,
      tenantId: row.tenant_id ?? "",
      userId: row.user_id,
      name: row.full_name,
      roleKey: row.role_key,
      roleLabel: roleLabel(row.role_key),
      workspaceKey: row.workspace_key,
      tenantName: row.tenant_name,
      username: key,
    },
  };
}

function digitsPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function issueLoginOtp(phone: string): Promise<{ ok: true; demoCode: string } | { ok: false; error: string }> {
  const digits = digitsPhone(phone);
  if (digits.length !== 10) {
    return { ok: false, error: "Use a ten-digit Indian mobile number." };
  }
  const locked = gated(`p:${digits}`);
  if (locked) return { ok: false, error: locked };

  const [found] = await sql<{ user_id: string }[]>`
    SELECT user_id::text FROM arth_authenticate_phone(${digits})
  `;
  const code = String(randomInt(100000, 1000000));
  const hash = hashPassword(code);
  await sql`
    INSERT INTO login_otps (phone, code_hash, expires_at, attempts)
    VALUES (${digits}, ${hash}, now() + interval '5 minutes', 0)
    ON CONFLICT (phone) DO UPDATE SET
      code_hash = EXCLUDED.code_hash,
      expires_at = EXCLUDED.expires_at,
      attempts = 0
  `;
  if (!found) {
    return { ok: true, demoCode: "" };
  }
  const sent = await sendOtp(digits, code);
  return { ok: true, demoCode: sent.demoCode };
}

export async function authenticatePhone(
  phone: string,
  code: string,
): Promise<{ ok: true; seat: Seat } | { ok: false; error: string }> {
  const digits = digitsPhone(phone);
  if (digits.length !== 10 || !code.trim()) {
    return { ok: false, error: "Enter the mobile number and the code." };
  }
  const locked = gated(`p:${digits}`);
  if (locked) return { ok: false, error: locked };

  const [otp] = await sql<{ code_hash: string; expires_at: Date; attempts: number }[]>`
    SELECT code_hash, expires_at, attempts FROM login_otps WHERE phone = ${digits}
  `;
  if (!otp || new Date(otp.expires_at).getTime() < Date.now()) {
    bumpFail(`p:${digits}`);
    return { ok: false, error: "That code is not right or it has expired." };
  }
  if (otp.attempts >= 5) {
    bumpFail(`p:${digits}`);
    return { ok: false, error: "Too many attempts. Wait a minute and try again." };
  }
  if (!verifyPassword(code.trim(), otp.code_hash)) {
    await sql`UPDATE login_otps SET attempts = attempts + 1 WHERE phone = ${digits}`;
    bumpFail(`p:${digits}`);
    return { ok: false, error: "That code is not right or it has expired." };
  }

  const [row] = await sql<{
    user_id: string;
    tenant_id: string | null;
    role_key: string;
    workspace_key: string;
    full_name: string;
    tenant_name: string;
    kind: string;
    username: string;
  }[]>`
    SELECT
      user_id::text,
      tenant_id::text,
      role_key,
      workspace_key,
      full_name,
      tenant_name,
      kind,
      username
    FROM arth_authenticate_phone(${digits})
  `;
  if (!row) {
    bumpFail(`p:${digits}`);
    return { ok: false, error: "That code is not right or it has expired." };
  }
  await sql`DELETE FROM login_otps WHERE phone = ${digits}`;
  fails.delete(`p:${digits}`);
  const kind: SeatKind = row.kind === "platform" ? "platform" : "dealer";
  const username = (row.username || "").toLowerCase();
  return {
    ok: true,
    seat: {
      seatKey: username,
      kind,
      tenantId: row.tenant_id ?? "",
      userId: row.user_id,
      name: row.full_name,
      roleKey: row.role_key,
      roleLabel: roleLabel(row.role_key),
      workspaceKey: row.workspace_key,
      tenantName: row.tenant_name,
      username,
    },
  };
}

