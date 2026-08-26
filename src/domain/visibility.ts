/**
 * Visibility buckets for every department. Postgres arth_lead_visible is the wall.
 * Application code must not invent a wider path.
 */
export const VISIBILITY_ROLES = {
  dealer: ["owner", "adv", "admin"],
  branch: ["mgr"],
  team: ["lead"],
  personal: ["tele", "sales", "svctele"],
} as const;

export function isDealerRole(roleKey: string) {
  return (VISIBILITY_ROLES.dealer as readonly string[]).includes(roleKey);
}

export function isBranchRole(roleKey: string) {
  return (VISIBILITY_ROLES.branch as readonly string[]).includes(roleKey);
}

export function isTeamRole(roleKey: string) {
  return (VISIBILITY_ROLES.team as readonly string[]).includes(roleKey);
}

export function isPersonalRole(roleKey: string) {
  return (VISIBILITY_ROLES.personal as readonly string[]).includes(roleKey);
}
