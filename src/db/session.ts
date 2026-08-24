import { cookies } from "next/headers";
import { withTenant, type Tx } from "@/db/with-tenant";
import { canOpen } from "@/lib/access";
import { DEMO_USERS, resolveSeatKey, type Seat, type SeatKey } from "@/lib/seats";

export { canOpen, DEMO_USERS };
export type { Seat, SeatKey };

export async function currentSeat(): Promise<Seat> {
  const jar = await cookies();
  const key = resolveSeatKey(jar.get("arth_seat")?.value, jar.get("arth_tenant")?.value);
  return DEMO_USERS[key];
}

export async function asSeat<T>(fn: (tx: Tx, seat: Seat) => Promise<T>): Promise<T> {
  const seat = await currentSeat();
  return withTenant({ tenantId: seat.tenantId, userId: seat.userId }, (tx) =>
    fn(tx, seat),
  );
}
