/** Weekly coaching loop. SPEC telecaller view 09. Compared to her own past, never the floor. */

export const LOOP_METRICS = [
  {
    key: "connect_rate",
    label: "Connect rate",
    detail: "Connected calls of 20 seconds or more, over dials.",
  },
  {
    key: "first_response",
    label: "First response on time",
    detail: "First reach inside the working-hours window.",
  },
  {
    key: "outcomes_per_day",
    label: "Outcomes per day",
    detail: "Recorded outcomes, divided by days she logged one.",
  },
  {
    key: "handoff_conversion",
    label: "Conversion of what she hands on",
    detail: "Enquiries she handed on that later booked or delivered.",
  },
] as const;

export type LoopMetricKey = (typeof LOOP_METRICS)[number]["key"];

export const LOOP_STEPS = [
  { key: "measure", n: 1, label: "Measure" },
  { key: "one_thing", n: 2, label: "Find the one thing" },
  { key: "cause", n: 3, label: "Find the cause" },
  { key: "action", n: 4, label: "One action" },
  { key: "practise", n: 5, label: "She practises" },
  { key: "remeasure", n: 6, label: "Re-measure, same day next week" },
] as const;

export const LOOP_RULES = [
  {
    key: "one_thing",
    label: "One thing at a time",
    detail: "A person given five things to improve improves none of them.",
  },
  {
    key: "own_past",
    label: "Compared to her own past",
    detail: "Never to the top of the floor. A gap to yourself is closeable.",
  },
  {
    key: "own_calls",
    label: "The cause comes from her own calls",
    detail: "Evidence, not an opinion. Recordings stay gated until telephony is connected.",
  },
  {
    key: "say_it",
    label: "Re-measure is said either way",
    detail: "Silence after success kills the loop faster than criticism.",
  },
] as const;

export const REVIEW_CRITERIA = [
  { key: "opening", label: "Opening" },
  { key: "discovery", label: "Discovery" },
  { key: "listening", label: "Listening" },
  { key: "next_step", label: "Next step named" },
  { key: "outcome", label: "Outcome recorded as it happened" },
  { key: "handover", label: "Handover card" },
] as const;

export const CAUSE_KEYS = [
  "cold_afternoon",
  "first_response_window",
  "outcome_before_next",
  "thin_card",
  "steady",
] as const;

export type CauseKey = (typeof CAUSE_KEYS)[number];

export function metricLabel(key: string) {
  return LOOP_METRICS.find((m) => m.key === key)?.label ?? key.replaceAll("_", " ");
}

export function median(values: number[]): number | null {
  const nums = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2 === 1) return nums[mid];
  return (nums[mid - 1] + nums[mid]) / 2;
}

/** How far current sits below the median. Positive means she is down. */
export function gapBelow(current: number | null, medianValue: number | null) {
  if (current == null || medianValue == null) return null;
  const scale = Math.max(Math.abs(medianValue), 0.01);
  return (medianValue - current) / scale;
}

export function pickOneThing(
  rows: { key: LoopMetricKey; current: number | null; median: number | null }[],
) {
  const scored = rows
    .map((row) => ({ ...row, gap: gapBelow(row.current, row.median) }))
    .filter((row) => row.gap != null) as {
    key: LoopMetricKey;
    current: number;
    median: number;
    gap: number;
  }[];
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.gap - a.gap);
  return scored[0];
}

export function causeFor(metric: LoopMetricKey, evidence: { morningConnect?: number | null; afternoonConnect?: number | null }): CauseKey {
  if (metric === "connect_rate") {
    const morning = evidence.morningConnect;
    const afternoon = evidence.afternoonConnect;
    if (morning != null && afternoon != null && morning > afternoon + 0.05) return "cold_afternoon";
  }
  if (metric === "first_response") return "first_response_window";
  if (metric === "outcomes_per_day") return "outcome_before_next";
  if (metric === "handoff_conversion") return "thin_card";
  return "steady";
}

export function actionFor(cause: CauseKey) {
  if (cause === "cold_afternoon") {
    return "Move your cold block to the morning for one week.";
  }
  if (cause === "first_response_window") {
    return "Open Today at the breaching band before anything else, for one week.";
  }
  if (cause === "outcome_before_next") {
    return "Record the outcome before the next dial, for one week.";
  }
  if (cause === "thin_card") {
    return "Fill price and what he said on the handover card before you hand on, for one week.";
  }
  return "Keep last week's behaviour for one more week.";
}

export function causeLine(
  cause: CauseKey,
  extras: { morningConnectPct?: number | null; metricLabel?: string; current?: string; median?: string },
) {
  if (cause === "cold_afternoon") {
    const pct = extras.morningConnectPct != null ? Math.round(extras.morningConnectPct) : null;
    return pct != null
      ? `You are calling cold names after lunch. Your connect rate before noon is ${pct}.`
      : "You are calling cold names after lunch. Morning connects sit higher on your own book.";
  }
  if (cause === "first_response_window") {
    return "The first-response window is closing before the first dial. The delay is on the first attempt.";
  }
  if (cause === "outcome_before_next") {
    return "Dials are piling up without an outcome on the same names.";
  }
  if (cause === "thin_card") {
    return "Enquiries leave her book with a thin handover card. Sales inherits a name, not a conversation.";
  }
  return "Nothing is off your own median. The loop still names one behaviour to keep.";
}

export function oneThingLine(input: {
  key: LoopMetricKey;
  current: number;
  median: number;
}) {
  const label = metricLabel(input.key).toLowerCase();
  const fmt = input.key === "outcomes_per_day" ? fmtNum : fmtPct;
  if (input.current >= input.median) {
    return `Your ${label} sits at ${fmt(input.current)} against your own median of ${fmt(input.median)}.`;
  }
  return `Your ${label} fell from ${fmt(input.median)} to ${fmt(input.current)}.`;
}

export function remeasureLine(input: {
  key: string;
  last: number | null;
  now: number | null;
}) {
  const label = metricLabel(input.key).toLowerCase();
  if (input.last == null || input.now == null) {
    return "Last week's loop has no figure to re-measure yet. Incomplete.";
  }
  const moved = input.now > input.last + 0.005;
  const same = Math.abs(input.now - input.last) <= 0.005;
  const fmt = input.key === "outcomes_per_day" ? fmtNum : fmtPct;
  if (moved) return `It moved. ${label} went from ${fmt(input.last)} to ${fmt(input.now)}.`;
  if (same) return `It did not move. ${label} is still ${fmt(input.now)}.`;
  return `It did not move. ${label} went from ${fmt(input.last)} to ${fmt(input.now)}.`;
}

function fmtPct(n: number) {
  return String(Math.round(n * 100));
}

function fmtNum(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

/** Monday 00:00 in India Standard Time for the week containing `at`. */
export function weekStartIst(at = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = map[get("weekday")] ?? at.getUTCDay();
  const back = dow === 0 ? 6 : dow - 1;
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day")) - back;
  const utc = Date.UTC(y, m - 1, d);
  const day = new Date(utc);
  const ymd = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
  return new Date(`${ymd}T00:00:00+05:30`);
}

export function addDays(start: Date, days: number) {
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export function weekLabel(start: Date) {
  return start.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function istYmd(at: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function sampleReviewCount(connects: number) {
  if (connects <= 0) return 0;
  const n = Math.round(connects * 0.05);
  if (connects >= 8) return Math.max(1, n);
  return n;
}

export function floorPatternThreshold(teamSize: number) {
  if (teamSize <= 1) return 2;
  if (teamSize < 6) return Math.max(2, Math.ceil(teamSize * 0.75));
  return 6;
}

export function rendererKeys() {
  return {
    metrics: LOOP_METRICS.map((m) => m.key),
    steps: LOOP_STEPS.map((s) => s.key),
    rules: LOOP_RULES.map((r) => r.key),
    criteria: REVIEW_CRITERIA.map((c) => c.key),
    causes: [...CAUSE_KEYS],
  };
}
