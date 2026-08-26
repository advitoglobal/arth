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
    username: "iyer",
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
    username: "nair",
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
    username: "pinto",
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
    username: "rao",
  },
  dsouza: {
    seatKey: "dsouza",
    tenantId: "22222222-2222-2222-2222-222222222222",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd5",
    name: "M. Dsouza",
    roleKey: "sales",
    roleLabel: "sales consultant",
    workspaceKey: "pipe",
    tenantName: "Coastal Cars",
    username: "dsouza",
  },
  menon: {
    seatKey: "menon",
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd6",
    name: "P. Menon",
    roleKey: "lead",
    roleLabel: "team leader",
    workspaceKey: "pipe",
    tenantName: "Whitefield Motors",
    username: "menon",
  },
  gupta: {
    seatKey: "gupta",
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd7",
    name: "R. Gupta",
    roleKey: "mgr",
    roleLabel: "branch manager",
    workspaceKey: "pipe",
    tenantName: "Whitefield Motors",
    username: "gupta",
  },
  shah: {
    seatKey: "shah",
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd8",
    name: "D. Shah",
    roleKey: "owner",
    roleLabel: "dealer principal",
    workspaceKey: "pipe",
    tenantName: "Whitefield Motors",
    username: "shah",
  },
  fernandes: {
    seatKey: "fernandes",
    tenantId: "22222222-2222-2222-2222-222222222222",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd9",
    name: "L. Fernandes",
    roleKey: "mgr",
    roleLabel: "branch manager",
    workspaceKey: "pipe",
    tenantName: "Coastal Cars",
    username: "fernandes",
  },
  kamath: {
    seatKey: "kamath",
    tenantId: "22222222-2222-2222-2222-222222222222",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd10",
    name: "A. Kamath",
    roleKey: "owner",
    roleLabel: "dealer principal",
    workspaceKey: "pipe",
    tenantName: "Coastal Cars",
    username: "kamath",
  },
} as const;

export type SeatKey = keyof typeof DEMO_USERS;
export type Seat = (typeof DEMO_USERS)[SeatKey];

export function hasDemoSession(rawSeat: string | undefined): boolean {
  return resolveSeatKey(rawSeat) !== null;
}

export function resolveSeatKey(rawSeat: string | undefined): SeatKey | null {
  if (rawSeat && rawSeat in DEMO_USERS) return rawSeat as SeatKey;
  return null;
}

export function screenFromPath(pathname: string): string | null {
  const map: Record<string, string> = {
    "/w/dayb": "dayb",
    "/w/tele": "tele",
    "/w/pipe": "pipe",
    "/w/rec": "rec",
    "/w/search": "search",
    "/w/new": "new",
    "/w/notif": "notif",
    "/w/profile": "profile",
  };
  return map[pathname] ?? null;
}
