export function canOpen(roleKey: string, screen: string): boolean {
  const access: Record<string, string[]> = {
    dayb: ["tele"],
    tele: ["tele", "mgr", "svctele", "ops"],
    pipe: ["tele", "lead", "mgr", "sales", "owner", "ops"],
    rec: ["tele", "lead", "mgr", "sales", "owner", "ops"],
    search: ["tele", "sales", "adv", "lead", "mgr", "owner", "ops"],
    new: ["tele"],
    notif: ["tele", "sales", "svc", "lead", "mgr", "owner"],
    profile: ["tele", "lead", "mgr", "owner", "adv_admin", "adv_support"],
    perf: ["tele", "sales", "lead", "mgr", "owner", "ops"],
    desk: ["mgr", "ops"],
    prin: ["owner"],
    adealers: ["adv_admin", "adv_support"],
    aonboard: ["adv_admin"],
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
