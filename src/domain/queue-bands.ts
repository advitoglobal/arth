/** Six-band Today queue. Order is published. SPEC telecaller views 01 and 02. */

export const QUEUE_BANDS = [
  { key: "breaching", rank: 1, label: "Breaching now" },
  { key: "late", rank: 2, label: "Already late" },
  { key: "promised", rank: 3, label: "Promised today" },
  { key: "pool", rank: 4, label: "New in pool" },
  { key: "due", rank: 5, label: "Due today" },
  { key: "revival", rank: 6, label: "Revival" },
] as const;

export type QueueBandKey = (typeof QUEUE_BANDS)[number]["key"];

export type QueueLeadClock = {
  owner_user_id: string | null;
  first_response_due: Date | string | null;
  first_responded_at: Date | string | null;
  next_action_at: Date | string | null;
  created_at?: Date | string | null;
  lost_reason_key: string | null;
  is_not_enquiry?: boolean | null;
};

const IST = "Asia/Kolkata";

function at(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const n = new Date(value).getTime();
  return Number.isFinite(n) ? n : null;
}

function endOfTodayIst(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return new Date(`${get("year")}-${get("month")}-${get("day")}T23:59:59+05:30`).getTime();
}

function minutesUntil(due: number, now: number) {
  return Math.max(1, Math.ceil((due - now) / 60_000));
}

function followUpDate(due: Date) {
  return due.toLocaleDateString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
  });
}

export function classifyQueueBand(
  row: QueueLeadClock,
  now = new Date(),
): { key: QueueBandKey; rank: number; label: string; reason: string } {
  const band = (key: QueueBandKey, reason: string) => {
    const meta = QUEUE_BANDS.find((b) => b.key === key)!;
    return { key, rank: meta.rank, label: meta.label, reason };
  };

  if (row.lost_reason_key || row.is_not_enquiry) {
    return band("revival", "Cold name. Offered because nothing else is due.");
  }

  const nowMs = now.getTime();
  const until = endOfTodayIst(now);
  const firstDue = at(row.first_response_due);
  const firstDone = at(row.first_responded_at);
  const nextDue = at(row.next_action_at);
  const unreached = firstDone === null;
  const tenMin = 10 * 60_000;

  if (
    unreached &&
    firstDue !== null &&
    firstDue > nowMs &&
    firstDue <= nowMs + tenMin
  ) {
    return band(
      "breaching",
      `First call due in ${minutesUntil(firstDue, nowMs)} minutes.`,
    );
  }

  if (
    (unreached && firstDue !== null && firstDue < nowMs) ||
    (nextDue !== null && nextDue < nowMs)
  ) {
    if (unreached && firstDue !== null && firstDue < nowMs) {
      return band("late", "First call missed.");
    }
    return band(
      "late",
      `Follow-up due ${followUpDate(new Date(nextDue!))}.`,
    );
  }

  if (
    row.owner_user_id &&
    nextDue !== null &&
    nextDue >= nowMs &&
    nextDue < until
  ) {
    return band("promised", "You promised to ring today.");
  }

  if (!row.owner_user_id && unreached) {
    return band("pool", "New in the shared book.");
  }

  return band("due", "Callback due today.");
}

export function groupQueueByBand<T extends { queue_band?: string | null }>(
  rows: T[],
): { key: QueueBandKey; label: string; rows: T[] }[] {
  return QUEUE_BANDS.map((band) => ({
    key: band.key,
    label: band.label,
    rows: rows.filter((r) => r.queue_band === band.key),
  }));
}
