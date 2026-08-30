export const SALES_STAGES = [
  "new",
  "assigned",
  "contacted",
  "meeting",
  "test_drive",
  "quotation",
  "negotiation",
  "booked",
  "delivered",
] as const;

export const SERVICE_STAGES = [
  "new",
  "assigned",
  "contacted",
  "appointment",
  "arrived",
  "in_work",
  "waiting_parts",
  "ready",
  "delivered",
] as const;

export const INSURANCE_STAGES = [
  "new",
  "assigned",
  "contacted",
  "quoted",
  "recommended",
  "issued",
  "endorsed",
  "renewed",
  "lost",
] as const;

export type DeptKey = "sales" | "service" | "insurance" | "used" | "accessories";

export function stagesFor(dept: string | null | undefined): readonly string[] {
  if (dept === "service") return SERVICE_STAGES;
  if (dept === "insurance") return INSURANCE_STAGES;
  return SALES_STAGES;
}

export function departmentOfRole(roleKey: string): DeptKey | "all" {
  if (["svctele", "svc", "svcmgr"].includes(roleKey)) return "service";
  if (["instele", "ins"].includes(roleKey)) return "insurance";
  if (["owner", "admin", "gm", "ops", "adv"].includes(roleKey)) return "all";
  return "sales";
}
