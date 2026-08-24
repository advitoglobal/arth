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

export function resolveSeatKey(
  rawSeat: string | undefined,
  rawTenant: string | undefined,
): SeatKey {
  if (rawSeat && rawSeat in DEMO_USERS) return rawSeat as SeatKey;
  if (rawTenant === "coastal") return "pinto";
  if (rawTenant === "whitefield") return "iyer";
  return "iyer";
}

export function screenFromPath(pathname: string): string | null {
  const map: Record<string, string> = {
    "/w/dayb": "dayb",
    "/w/tele": "tele",
    "/w/pipe": "pipe",
    "/w/rec": "rec",
    "/w/search": "search",
    "/w/notif": "notif",
    "/w/profile": "profile",
  };
  return map[pathname] ?? null;
}
