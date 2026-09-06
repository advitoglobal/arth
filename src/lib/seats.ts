export type SeatKind = "dealer" | "platform";

export type Seat = {
  seatKey: string;
  kind: SeatKind;
  tenantId: string;
  userId: string;
  name: string;
  roleKey: string;
  roleLabel: string;
  workspaceKey: string;
  tenantName: string;
  username: string;
};

export const ROLE_LABEL: Record<string, string> = {
  tele: "telecaller",
  svctele: "service telecaller",
  instele: "insurance telecaller",
  sales: "sales consultant",
  salesmgr: "sales manager",
  svc: "service advisor",
  svcmgr: "service manager",
  ins: "insurance executive",
  tdcoord: "test drive coordinator",
  lead: "team leader",
  mgr: "digital desk manager",
  gm: "general manager",
  owner: "dealer principal",
  admin: "dealer admin",
  acct: "accounts",
  ops: "Advito support on this dealer",
  adv_admin: "Advito admin",
  adv_support: "Advito support",
  adv_onboard: "Advito onboarding",
};

export function roleLabel(roleKey: string) {
  return ROLE_LABEL[roleKey] ?? roleKey;
}

export function landingPath(seat: Pick<Seat, "kind" | "workspaceKey" | "roleKey">) {
  if (seat.kind === "platform") {
    if (seat.roleKey === "adv_onboard") return "/a/onboard";
    return "/a/dealers";
  }
  if (seat.workspaceKey === "dayb") return "/w/dayb";
  if (seat.workspaceKey === "desk") return "/w/desk";
  if (seat.workspaceKey === "prin") return "/w/prin";
  if (seat.workspaceKey === "tele") return "/w/tele";
  if (seat.workspaceKey === "admin") return "/w/admin";
  if (seat.workspaceKey === "books") return "/w/books";
  if (seat.workspaceKey === "gm") return "/w/gm";
  if (seat.workspaceKey === "svc") return "/w/svc";
  if (seat.workspaceKey === "ins") return "/w/ins";
  if (seat.workspaceKey === "drive") return "/w/drive";
  return "/w/pipe";
}

const DEMO_HASH_SEATS = {
  iyer: {
    seatKey: "iyer",
    kind: "dealer" as const,
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
    kind: "dealer" as const,
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
    kind: "dealer" as const,
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
    kind: "dealer" as const,
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
    kind: "dealer" as const,
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
    kind: "dealer" as const,
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
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd7",
    name: "R. Gupta",
    roleKey: "mgr",
    roleLabel: "digital desk manager",
    workspaceKey: "desk",
    tenantName: "Whitefield Motors",
    username: "gupta",
  },
  shah: {
    seatKey: "shah",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd8",
    name: "D. Shah",
    roleKey: "owner",
    roleLabel: "dealer principal",
    workspaceKey: "prin",
    tenantName: "Whitefield Motors",
    username: "shah",
  },
  fernandes: {
    seatKey: "fernandes",
    kind: "dealer" as const,
    tenantId: "22222222-2222-2222-2222-222222222222",
    userId: "dddddddd-dddd-dddd-dddd-ddddddddddd9",
    name: "L. Fernandes",
    roleKey: "mgr",
    roleLabel: "digital desk manager",
    workspaceKey: "desk",
    tenantName: "Coastal Cars",
    username: "fernandes",
  },
  kamath: {
    seatKey: "kamath",
    kind: "dealer" as const,
    tenantId: "22222222-2222-2222-2222-222222222222",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd10",
    name: "A. Kamath",
    roleKey: "owner",
    roleLabel: "dealer principal",
    workspaceKey: "prin",
    tenantName: "Coastal Cars",
    username: "kamath",
  },
  advito: {
    seatKey: "advito",
    kind: "platform" as const,
    tenantId: "",
    userId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1",
    name: "Advito admin",
    roleKey: "adv_admin",
    roleLabel: "Advito admin",
    workspaceKey: "adealers",
    tenantName: "Advito",
    username: "advito",
  },
  support: {
    seatKey: "support",
    kind: "platform" as const,
    tenantId: "",
    userId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2",
    name: "Advito support",
    roleKey: "adv_support",
    roleLabel: "Advito support",
    workspaceKey: "adealers",
    tenantName: "Advito",
    username: "support",
  },
  padma: {
    seatKey: "padma",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd41",
    name: "R. Padma",
    roleKey: "admin",
    roleLabel: "dealer admin",
    workspaceKey: "admin",
    tenantName: "Whitefield Motors",
    username: "padma",
  },
  books: {
    seatKey: "books",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd42",
    name: "K. Books",
    roleKey: "acct",
    roleLabel: "accounts",
    workspaceKey: "books",
    tenantName: "Whitefield Motors",
    username: "books",
  },
  devi: {
    seatKey: "devi",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd43",
    name: "S. Devi",
    roleKey: "svctele",
    roleLabel: "service telecaller",
    workspaceKey: "dayb",
    tenantName: "Whitefield Motors",
    username: "devi",
  },
  onboard: {
    seatKey: "onboard",
    kind: "platform" as const,
    tenantId: "",
    userId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3",
    name: "Advito onboarding",
    roleKey: "adv_onboard",
    roleLabel: "Advito onboarding",
    workspaceKey: "aonboard",
    tenantName: "Advito",
    username: "onboard",
  },
  kumar: {
    seatKey: "kumar",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd51",
    name: "V. Kumar",
    roleKey: "gm",
    roleLabel: "general manager",
    workspaceKey: "gm",
    tenantName: "Whitefield Motors",
    username: "kumar",
  },
  lal: {
    seatKey: "lal",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd52",
    name: "R. Lal",
    roleKey: "salesmgr",
    roleLabel: "sales manager",
    workspaceKey: "pipe",
    tenantName: "Whitefield Motors",
    username: "lal",
  },
  irfan: {
    seatKey: "irfan",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd53",
    name: "H. Irfan",
    roleKey: "svc",
    roleLabel: "service advisor",
    workspaceKey: "svc",
    tenantName: "Whitefield Motors",
    username: "irfan",
  },
  mehta: {
    seatKey: "mehta",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd54",
    name: "A. Mehta",
    roleKey: "svcmgr",
    roleLabel: "service manager",
    workspaceKey: "svc",
    tenantName: "Whitefield Motors",
    username: "mehta",
  },
  iqbal: {
    seatKey: "iqbal",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd55",
    name: "F. Iqbal",
    roleKey: "instele",
    roleLabel: "insurance telecaller",
    workspaceKey: "dayb",
    tenantName: "Whitefield Motors",
    username: "iqbal",
  },
  nanda: {
    seatKey: "nanda",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd56",
    name: "P. Nanda",
    roleKey: "ins",
    roleLabel: "insurance executive",
    workspaceKey: "ins",
    tenantName: "Whitefield Motors",
    username: "nanda",
  },
  ravi: {
    seatKey: "ravi",
    kind: "dealer" as const,
    tenantId: "11111111-1111-1111-1111-111111111111",
    userId: "dddddddd-dddd-dddd-dddd-dddddddddd57",
    name: "S. Ravi",
    roleKey: "tdcoord",
    roleLabel: "test drive coordinator",
    workspaceKey: "drive",
    tenantName: "Whitefield Motors",
    username: "ravi",
  },
} satisfies Record<string, Seat>;

export const DEMO_USERS = DEMO_HASH_SEATS;

export type SeatKey = keyof typeof DEMO_USERS;

export function hasDemoSession(rawSeat: string | undefined): boolean {
  return Boolean(rawSeat && /^[a-z0-9._-]{2,40}$/i.test(rawSeat.trim()));
}

export function resolveSeatKey(rawSeat: string | undefined): SeatKey | null {
  const key = rawSeat?.trim().toLowerCase();
  if (key && key in DEMO_USERS) return key as SeatKey;
  return null;
}

export function screenFromPath(pathname: string): string | null {
  const map: Record<string, string> = {
    "/w/dayb": "dayb",
    "/w/tele": "tele",
    "/w/pipe": "pipe",
    "/w/rec": "rec",
    "/w/delivery": "delivery",
    "/w/search": "search",
    "/w/new": "new",
    "/w/notif": "notif",
    "/w/profile": "profile",
    "/w/desk": "desk",
    "/w/prin": "prin",
    "/w/perf": "perf",
    "/w/admin": "admin",
    "/w/books": "books",
    "/w/gm": "gm",
    "/w/svc": "svc",
    "/w/ins": "ins",
    "/w/stock": "stock",
    "/w/drive": "drive",
    "/w/bot": "bot",
  };
  return map[pathname] ?? null;
}

export function isPlatformRole(roleKey: string) {
  return roleKey === "adv_admin" || roleKey === "adv_support" || roleKey === "adv_onboard";
}
