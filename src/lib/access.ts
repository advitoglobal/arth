export function canOpen(roleKey: string, screen: string): boolean {
  const access: Record<string, string[]> = {
    dayb: ["tele", "svctele"],
    tele: ["tele", "mgr", "svctele", "ops"],
    pipe: ["tele", "svctele", "lead", "mgr", "sales", "owner", "ops", "admin"],
    rec: ["tele", "svctele", "lead", "mgr", "sales", "owner", "ops", "admin"],
    search: ["tele", "svctele", "sales", "adv", "lead", "mgr", "owner", "ops", "admin"],
    new: ["tele", "svctele"],
    notif: ["tele", "svctele", "sales", "svc", "lead", "mgr", "owner", "admin"],
    profile: ["tele", "svctele", "sales", "lead", "mgr", "owner", "admin", "acct", "adv_admin", "adv_support", "adv_onboard"],
    perf: ["tele", "svctele", "sales", "lead", "mgr", "owner", "ops", "admin"],
    desk: ["mgr", "ops"],
    prin: ["owner"],
    admin: ["admin", "owner"],
    books: ["acct", "owner", "admin"],
    upload: ["mgr", "owner", "admin"],
    adealers: ["adv_admin", "adv_support", "adv_onboard"],
    aonboard: ["adv_admin", "adv_onboard"],
  };
  return (access[screen] ?? []).includes(roleKey);
}

/** Expected value is for digital desk and the dealer principal, not the floor. */
export function canSeeValue(roleKey: string) {
  return roleKey === "mgr" || roleKey === "owner" || roleKey === "adv" || roleKey === "ops";
}

export function canPlaceEnquiry(roleKey: string) {
  return roleKey === "mgr" || roleKey === "owner" || roleKey === "ops";
}
