/** Desk qualify: information collected, customer willing, ready for that department. */

export const QUALIFY_LANES = [
  { key: "sales", label: "Sales" },
  { key: "service", label: "Service" },
  { key: "insurance", label: "Insurance" },
  { key: "used", label: "Used car" },
  { key: "driving_school", label: "Driving school" },
] as const;

export type QualifyLane = (typeof QUALIFY_LANES)[number]["key"];

export function isQualifyLane(value: string): value is QualifyLane {
  return QUALIFY_LANES.some((row) => row.key === value);
}

/** RLS and floor pools are sales | service | insurance. Other lanes ride the sales book. */
export function bookDepartmentForLane(lane: string): "sales" | "service" | "insurance" {
  if (lane === "service") return "service";
  if (lane === "insurance") return "insurance";
  return "sales";
}

export function qualifyStageForBook(book: "sales" | "service" | "insurance"): string {
  if (book === "service") return "appointment";
  if (book === "insurance") return "quoted";
  return "meeting";
}
