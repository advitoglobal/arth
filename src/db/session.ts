import { cookies } from "next/headers";
import { withTenant, type Tx } from "@/db/with-tenant";

export const DEMO_USERS = {
  whitefield: {
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
    name: "A. Iyer",
    roleKey: "tele",
    workspaceKey: "dayb",
    tenantName: "Whitefield Motors",
  },
  coastal: {
    tenantId: "22222222-2222-2222-2222-222222222222",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd2",
    name: "M. Pinto",
    roleKey: "tele",
    workspaceKey: "dayb",
    tenantName: "Coastal Cars",
  },
} as const;

export type Seat = (typeof DEMO_USERS)[keyof typeof DEMO_USERS];

export async function currentSeat(): Promise<Seat> {
  const jar = await cookies();
  const key = jar.get("arth_tenant")?.value === "coastal" ? "coastal" : "whitefield";
  return DEMO_USERS[key];
}

export function canOpen(roleKey: string, screen: string): boolean {
  const access: Record<string, string[]> = {
    dayb: ["tele"],
    tele: ["tele", "mgr", "svctele"],
    pipe: ["tele", "lead", "mgr", "sales"],
    rec: ["tele", "lead", "mgr", "sales"],
    search: ["tele", "sales", "adv"],
    notif: ["tele", "sales", "svc"],
    profile: ["tele"],
  };
  return (access[screen] ?? []).includes(roleKey);
}

export async function asSeat<T>(fn: (tx: Tx, seat: Seat) => Promise<T>): Promise<T> {
  const seat = await currentSeat();
  return withTenant({ tenantId: seat.tenantId, userId: seat.userId }, (tx) =>
    fn(tx, seat),
  );
}
