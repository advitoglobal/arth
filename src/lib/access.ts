export const ACCESS_SCREENS: Record<string, string[]> = {
  dayb: ["tele", "svctele", "instele"],
  tele: ["tele", "mgr", "svctele", "instele", "ops"],
  pipe: [
    "tele", "svctele", "instele", "lead", "mgr", "sales", "salesmgr", "svc", "svcmgr",
    "ins", "owner", "gm", "ops", "admin", "tdcoord",
  ],
  rec: [
    "tele", "svctele", "instele", "lead", "mgr", "sales", "salesmgr", "svc", "svcmgr",
    "ins", "owner", "gm", "ops", "admin", "tdcoord",
  ],
  delivery: ["sales", "salesmgr", "tdcoord", "owner", "gm", "admin"],
  search: [
    "tele", "svctele", "instele", "sales", "salesmgr", "svc", "svcmgr", "ins", "adv",
    "lead", "mgr", "owner", "gm", "ops", "admin", "tdcoord",
  ],
  new: ["tele", "svctele", "instele"],
  msg: ["tele", "svctele", "instele", "sales", "lead", "mgr", "salesmgr", "ops"],
  notif: [
    "tele", "svctele", "instele", "sales", "svc", "ins", "lead", "mgr", "owner", "gm",
    "admin", "salesmgr", "svcmgr", "tdcoord",
  ],
  profile: [
    "tele", "svctele", "instele", "sales", "svc", "ins", "lead", "mgr", "owner", "gm",
    "admin", "acct", "salesmgr", "svcmgr", "tdcoord", "adv_admin", "adv_support", "adv_onboard",
  ],
  perf: [
    "tele", "svctele", "instele", "sales", "svc", "ins", "lead", "mgr", "owner", "gm",
    "ops", "admin", "salesmgr", "svcmgr", "tdcoord",
  ],
  desk: ["mgr", "ops"],
  prin: ["owner"],
  gm: ["gm", "owner"],
  admin: ["admin", "owner"],
  books: ["acct", "owner", "admin", "gm"],
  upload: ["mgr", "owner", "admin", "svcmgr", "salesmgr"],
  svc: ["svc", "svcmgr", "svctele", "owner", "gm"],
  ins: ["ins", "instele", "owner", "gm"],
  stock: ["sales", "salesmgr", "tdcoord", "owner", "gm", "admin"],
  drive: ["tdcoord", "sales", "salesmgr", "owner", "gm"],
  bot: ["owner", "gm", "admin"],
  loop: ["tele", "svctele", "instele", "lead", "mgr", "gm", "ops"],
  adealers: ["adv_admin", "adv_support", "adv_onboard"],
  aonboard: ["adv_admin", "adv_onboard"],
};

export function canOpen(roleKey: string, screen: string): boolean {
  return (ACCESS_SCREENS[screen] ?? []).includes(roleKey);
}

export function canSeeValue(roleKey: string) {
  return ["mgr", "owner", "adv", "ops", "gm", "salesmgr"].includes(roleKey);
}

export function canSeeMargin(roleKey: string) {
  return ["owner", "admin", "gm"].includes(roleKey);
}

export function canPlaceEnquiry(roleKey: string) {
  return ["mgr", "owner", "ops", "svcmgr", "salesmgr"].includes(roleKey);
}

export function canApproveDiscount(roleKey: string) {
  return ["salesmgr", "lead", "owner", "gm"].includes(roleKey);
}
