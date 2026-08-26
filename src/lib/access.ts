export function canOpen(roleKey: string, screen: string): boolean {
  const access: Record<string, string[]> = {
    dayb: ["tele"],
    tele: ["tele", "mgr", "svctele"],
    pipe: ["tele", "lead", "mgr", "sales", "owner"],
    rec: ["tele", "lead", "mgr", "sales", "owner"],
    search: ["tele", "sales", "adv", "lead", "mgr", "owner"],
    new: ["tele"],
    notif: ["tele", "sales", "svc", "lead", "mgr", "owner"],
    profile: ["tele", "lead", "mgr", "owner"],
  };
  return (access[screen] ?? []).includes(roleKey);
}

/** Expected value is for managers and the dealer principal, not the floor. */
export function canSeeValue(roleKey: string): boolean {
  return roleKey === "mgr" || roleKey === "owner" || roleKey === "adv";
}
