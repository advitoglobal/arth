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
