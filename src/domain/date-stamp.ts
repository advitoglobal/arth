import { istDateTime } from "@/lib/format";
import { eventLabel } from "@/lib/labels";

/** Every date on a record names the event that produced it. Never a bare timestamp. */
export const DATE_STAMP_KEYS = [
  { key: "filed", label: "Filed" },
  { key: "assigned", label: "Assigned" },
  { key: "clock_deferred", label: "Clock deferred, charged to the branch" },
  { key: "first_call_due", label: "First call due" },
  { key: "first_call_logged", label: "First call logged" },
  { key: "follow_up_due", label: "Follow-up due" },
] as const;

export function rendererKeys() {
  return DATE_STAMP_KEYS.map((row) => row.key);
}

export function stampLabel(key: (typeof DATE_STAMP_KEYS)[number]["key"]) {
  return DATE_STAMP_KEYS.find((row) => row.key === key)?.label ?? key;
}

export function withEvent(event: string, at: Date | string | null | undefined): string {
  const name = event.trim() || "Activity";
  if (!at) return `${name} · not recorded`;
  return `${name} · ${istDateTime(at)}`;
}

export function isBareDate(value: string): boolean {
  return !value.includes(" · ");
}

export type LedgerEvent = {
  event_type?: string | null;
  created_at?: Date | string | null;
  disposition_key?: string | null;
  disposition_label?: string | null;
  note?: string | null;
  payload?: unknown;
};

export function enquiryDateStamps(input: {
  createdAt: Date | string | null | undefined;
  assignedAt: Date | string | null | undefined;
  firstResponseDue: Date | string | null | undefined;
  firstRespondedAt: Date | string | null | undefined;
  nextActionAt: Date | string | null | undefined;
  events: LedgerEvent[];
}) {
  const chronological = [...input.events].reverse();
  const created = chronological.find((e) => e.event_type === "created");
  const assigned = chronological.find((e) => e.event_type === "assigned");
  const deferred = chronological.find((e) => e.event_type === "clock_deferred");
  const chargedTo =
    deferred?.payload &&
    typeof deferred.payload === "object" &&
    deferred.payload &&
    "charged_to" in deferred.payload
      ? String((deferred.payload as { charged_to?: string }).charged_to ?? "")
      : "";
  const firstOutcome = chronological.find(
    (e) => e.event_type === "disposition" || e.event_type === "call_attempt",
  );
  const latestOutcome = input.events.find(
    (e) => e.event_type === "disposition" || e.event_type === "call_attempt",
  );

  const arrivedEvent = created ? eventLabel("created") : stampLabel("filed");
  const assignedEvent = assigned ? eventLabel("assigned") : stampLabel("assigned");
  const callByEvent = deferred
    ? chargedTo === "branch"
      ? stampLabel("clock_deferred")
      : eventLabel("clock_deferred")
    : stampLabel("first_call_due");
  const firstCallEvent =
    firstOutcome?.disposition_label?.trim() ||
    (firstOutcome?.event_type ? eventLabel(firstOutcome.event_type) : stampLabel("first_call_logged"));
  const nextEvent =
    latestOutcome?.disposition_label?.trim()
      ? `${latestOutcome.disposition_label} follow-up`
      : stampLabel("follow_up_due");

  return {
    arrived: withEvent(arrivedEvent, input.createdAt),
    assigned: withEvent(assignedEvent, input.assignedAt),
    callBy: withEvent(callByEvent, input.firstResponseDue),
    firstCall: withEvent(firstCallEvent, input.firstRespondedAt),
    next: withEvent(nextEvent, input.nextActionAt),
  };
}
