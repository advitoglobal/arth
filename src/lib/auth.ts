import { sql } from "@/db/with-tenant";
import { verifyPassword } from "@/lib/password";
import { DEMO_USERS, type Seat, type SeatKey } from "@/lib/seats";

const fails = new Map<string, { n: number; until: number }>();

function seatForUserId(userId: string): Seat | null {
  const found = (Object.keys(DEMO_USERS) as SeatKey[]).find(
    (k) => DEMO_USERS[k].userId === userId,
  );
  return found ? DEMO_USERS[found] : null;
}

export async function authenticateSeat(
  username: string,
  password: string,
): Promise<{ ok: true; seat: Seat } | { ok: false; error: string }> {
  const key = username.trim().toLowerCase();
  if (!key || !password) {
    return { ok: false, error: "Enter a username and a password." };
  }
  const gate = fails.get(key);
  if (gate && gate.until > Date.now()) {
    return { ok: false, error: "Too many attempts. Wait a minute and try again." };
  }

  const [row] = await sql<{
    user_id: string;
    password_hash: string | null;
  }[]>`
    SELECT user_id::text, password_hash FROM arth_authenticate(${key})
  `;
  const seat = row ? seatForUserId(row.user_id) : null;
  const pass = row ? verifyPassword(password, row.password_hash) : false;
  if (!row || !seat || !pass) {
    const n = (gate?.n ?? 0) + 1;
    fails.set(key, {
      n,
      until: n >= 8 ? Date.now() + 60_000 : 0,
    });
    return { ok: false, error: "That username or password is not right." };
  }
  fails.delete(key);
  return { ok: true, seat };
}
