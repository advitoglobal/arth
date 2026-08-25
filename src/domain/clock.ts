/** Working hours gate every clock. SPEC Architecture §4.3 */

export type DayHours = {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
};

const IST_OFFSET = "+05:30";

function ymdInZone(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday");
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    dow: map[weekday] ?? at.getUTCDay(),
  };
}

function atLocal(ymd: { year: string; month: string; day: string }, time: string, timeZone: string) {
  const offset = timeZone === "Asia/Kolkata" ? IST_OFFSET : "+00:00";
  const hhmmss = time.length === 5 ? `${time}:00` : time;
  return new Date(`${ymd.year}-${ymd.month}-${ymd.day}T${hhmmss}${offset}`);
}

function addDaysYmd(ymd: { year: string; month: string; day: string }, days: number) {
  const utc = Date.UTC(Number(ymd.year), Number(ymd.month) - 1, Number(ymd.day) + days);
  const d = new Date(utc);
  return {
    year: String(d.getUTCFullYear()),
    month: String(d.getUTCMonth() + 1).padStart(2, "0"),
    day: String(d.getUTCDate()).padStart(2, "0"),
  };
}

export function nextWorkingOpen(
  arrivedAt: Date,
  hours: DayHours[],
  timeZone = "Asia/Kolkata",
): Date {
  const start = ymdInZone(arrivedAt, timeZone);
  for (let add = 0; add < 8; add++) {
    const ymd = add === 0 ? start : addDaysYmd(start, add);
    const probe = add === 0 ? arrivedAt : atLocal(ymd, "12:00:00", timeZone);
    const dow = add === 0 ? start.dow : ymdInZone(probe, timeZone).dow;
    const row = hours.find((h) => h.dayOfWeek === dow);
    if (!row || !row.opensAt || !row.closesAt) continue;
    const open = atLocal(ymd, row.opensAt, timeZone);
    const close = atLocal(ymd, row.closesAt, timeZone);
    if (add === 0 && arrivedAt >= open && arrivedAt < close) return arrivedAt;
    if (add === 0 && arrivedAt < open) return open;
    if (add > 0) return open;
  }
  return arrivedAt;
}

export function firstResponseDue(
  arrivedAt: Date,
  hours: DayHours[],
  minutes: number,
  timeZone = "Asia/Kolkata",
): Date {
  const start = nextWorkingOpen(arrivedAt, hours, timeZone);
  return new Date(start.getTime() + minutes * 60 * 1000);
}

export function nextActionDue(
  from: Date,
  hours: DayHours[],
  timeZone = "Asia/Kolkata",
): Date {
  return nextWorkingOpen(from, hours, timeZone);
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

/** Queue is due today (IST calendar) plus anything already breaching. */
export function isOnDayQueue(
  nextActionAt: Date | string | null,
  now = new Date(),
  timeZone = "Asia/Kolkata",
): boolean {
  if (!nextActionAt) return true;
  const due = new Date(nextActionAt);
  const today = ymdInZone(now, timeZone);
  const end = atLocal(today, "23:59:59", timeZone);
  return due.getTime() <= end.getTime();
}

export function isFirstResponseLate(row: {
  first_response_due: Date | string | null;
  first_responded_at: Date | string | null;
  now?: Date;
}): boolean {
  if (!row.first_response_due || row.first_responded_at) return false;
  return new Date(row.first_response_due).getTime() < (row.now ?? new Date()).getTime();
}

export function isFollowUpLate(
  nextActionAt: Date | string | null,
  now = new Date(),
): boolean {
  if (!nextActionAt) return false;
  return new Date(nextActionAt).getTime() < now.getTime();
}

export const CALLBACK_REASON_AFTER_DAYS = 14;

export function needsCallbackReason(revisitAt: Date | string | null, now = new Date()) {
  if (!revisitAt) return false;
  const delta = new Date(revisitAt).getTime() - now.getTime();
  return delta > CALLBACK_REASON_AFTER_DAYS * 24 * 60 * 60 * 1000;
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

export function difficultyAtAssignment(
  sourceKey: string,
): "hot" | "warm" | "cold" | "very_cold" {
  if (sourceKey === "walk_in") return "hot";
  if (sourceKey === "google") return "warm";
  if (sourceKey === "meta") return "cold";
  return "very_cold";
}
