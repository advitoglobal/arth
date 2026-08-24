import { cookies } from "next/headers";
import { withTenant, type Tx } from "@/db/with-tenant";
import { canOpen } from "@/lib/access";

export { canOpen };

export const DEMO_USERS = {
  iyer: {
    seatKey: "iyer",
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
    name: "A. Iyer",
    roleKey: "tele",
    roleLabel: "telecaller",
    workspaceKey: "dayb",
    tenantName: "Whitefield Motors",
  },
  nair: {
    seatKey: "nair",
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd3",
    name: "K. Nair",
    roleKey: "tele",
    roleLabel: "telecaller",
    workspaceKey: "dayb",
    tenantName: "Whitefield Motors",
  },
  pinto: {
    seatKey: "pinto",
    tenantId: "22222222-2222-2222-2222-222222222222",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd2",
    name: "M. Pinto",
    roleKey: "tele",
    roleLabel: "telecaller",
    workspaceKey: "dayb",
    tenantName: "Coastal Cars",
  },
  rao: {
    seatKey: "rao",
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd4",
    name: "S. Rao",
    roleKey: "sales",
    roleLabel: "sales consultant",
    workspaceKey: "pipe",
    tenantName: "Whitefield Motors",
  },
} as const;

export type SeatKey = keyof typeof DEMO_USERS;
export type Seat = (typeof DEMO_USERS)[SeatKey];

function resolveSeatKey(rawSeat: string | undefined, rawTenant: string | undefined): SeatKey {
  if (rawSeat && rawSeat in DEMO_USERS) return rawSeat as SeatKey;
  if (rawTenant === "coastal") return "pinto";
  if (rawTenant === "whitefield") return "iyer";
  return "iyer";
}

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
