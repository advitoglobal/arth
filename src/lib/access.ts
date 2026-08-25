export function canOpen(roleKey: string, screen: string): boolean {
  const access: Record<string, string[]> = {
    dayb: ["tele"],
    tele: ["tele", "mgr", "svctele"],
    pipe: ["tele", "lead", "mgr", "sales"],
    rec: ["tele", "lead", "mgr", "sales"],
    search: ["tele", "sales", "adv"],
    new: ["tele"],
    notif: ["tele", "sales", "svc"],
    profile: ["tele"],
  };
  return (access[screen] ?? []).includes(roleKey);
}

/** Expected value is for managers and the dealer principal, not the floor. */
export function canSeeValue(roleKey: string): boolean {
  return roleKey === "mgr" || roleKey === "owner" || roleKey === "adv";
}
