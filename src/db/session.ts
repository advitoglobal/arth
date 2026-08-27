import { cookies } from "next/headers";
import {
  withTenant,
  withPlatform,
  withPlatformDealer,
  type Tx,
} from "@/db/with-tenant";
import { canOpen, canSeeValue, canPlaceEnquiry } from "@/lib/access";
import {
  DEMO_USERS,
  hasDemoSession,
  landingPath,
  resolveSeatKey,
  roleLabel,
  type Seat,
  type SeatKey,
} from "@/lib/seats";
import { sql } from "@/db/with-tenant";

export { canOpen, canSeeValue, canPlaceEnquiry, DEMO_USERS, landingPath };
export type { Seat, SeatKey };

async function seatFromUsername(username: string): Promise<Seat | null> {
  const [row] = await sql<{
    user_id: string;
    tenant_id: string | null;
    role_key: string;
    workspace_key: string;
    full_name: string;
    tenant_name: string;
    kind: string;
  }[]>`
    SELECT
      user_id::text,
      tenant_id::text,
      role_key,
      workspace_key,
      full_name,
      tenant_name,
      kind
    FROM arth_session_seat(${username})
  `;
  if (!row) return null;
  const kind = row.kind === "platform" ? "platform" : "dealer";
  return {
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
  };
}

export async function currentSeat(): Promise<Seat> {
  const jar = await cookies();
  const raw = jar.get("arth_seat")?.value?.trim().toLowerCase() ?? "";
  if (!hasDemoSession(raw)) {
    throw new Error("No signed-in seat.");
  }
  const fromDb = await seatFromUsername(raw);
  if (fromDb) return fromDb;
  const key = resolveSeatKey(raw);
  if (key) return DEMO_USERS[key];
  throw new Error("No signed-in seat.");
}

export async function viewTenantId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get("arth_view_tenant")?.value?.trim() ?? "";
  return raw.length ? raw : null;
}

export async function asSeat<T>(fn: (tx: Tx, seat: Seat) => Promise<T>): Promise<T> {
  const seat = await currentSeat();
  if (seat.kind === "platform") {
    const view = await viewTenantId();
    if (view) {
      return withPlatformDealer(
        { platformUserId: seat.userId, tenantId: view },
        (tx) => fn(tx, seat),
      );
    }
    return withPlatform(seat.userId, (tx) => fn(tx, seat));
  }
  return withTenant({ tenantId: seat.tenantId, userId: seat.userId }, (tx) =>
    fn(tx, seat),
  );
}

export async function asPlatform<T>(fn: (tx: Tx, seat: Seat) => Promise<T>): Promise<T> {
  const seat = await currentSeat();
  if (seat.kind !== "platform") {
    throw new Error("This is not an Advito operator seat.");
  }
  return withPlatform(seat.userId, (tx) => fn(tx, seat));
}
