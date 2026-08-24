/** Working hours gate every clock. SPEC Architecture §4.3 */

export type DayHours = {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
};

function parseTime(t: string, on: Date) {
  const [h, m, s] = t.split(":").map(Number);
  const d = new Date(on);
  d.setHours(h, m, s || 0, 0);
  return d;
}

export function nextWorkingOpen(arrivedAt: Date, hours: DayHours[]): Date {
  for (let add = 0; add < 8; add++) {
    const day = new Date(arrivedAt);
    day.setDate(day.getDate() + add);
    const dow = day.getDay();
    const row = hours.find((h) => h.dayOfWeek === dow);
    if (!row || !row.opensAt || !row.closesAt) continue;
    const open = parseTime(row.opensAt, day);
    const close = parseTime(row.closesAt, day);
    if (add === 0 && arrivedAt >= open && arrivedAt < close) {
      return arrivedAt;
    }
    if (add === 0 && arrivedAt < open) return open;
    if (add > 0) return open;
  }
  return arrivedAt;
}

export function firstResponseDue(
  arrivedAt: Date,
  hours: DayHours[],
  minutes: number,
): Date {
  const start = nextWorkingOpen(arrivedAt, hours);
  return new Date(start.getTime() + minutes * 60 * 1000);
}

export function isParked(latest: {
  disposition_key: string | null;
  revisit_at: Date | string | null;
} | null): boolean {
  if (!latest || latest.disposition_key !== "postponed" || !latest.revisit_at) {
    return false;
  }
  return new Date(latest.revisit_at).getTime() > Date.now();
}

export const STAGE_KEYS = [
  "new",
  "assigned",
  "contacted",
  "qualified",
  "test_drive",
  "quotation",
  "negotiation",
  "booked",
  "delivered",
] as const;

export function difficultyAtAssignment(sourceKey: string): "hot" | "warm" | "cold" | "very_cold" {
  if (sourceKey === "walk_in") return "hot";
  if (sourceKey === "google") return "warm";
  if (sourceKey === "meta") return "cold";
  return "very_cold";
}
