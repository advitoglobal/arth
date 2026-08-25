import { actorLabel, eventLabel } from "@/lib/labels";
import { istDateTime } from "@/lib/format";

type Payload = {
  lost_fact?: string | null;
  callback_reason?: string | null;
  charged_to?: string | null;
  delay_minutes?: number | null;
};

export function LedgerLine({
  ev,
}: {
  ev: Record<string, unknown>;
}) {
  const payload = (ev.payload ?? null) as Payload | null;
  const facts = [
    ev.disposition_label
      ? String(ev.disposition_label)
      : ev.disposition_key
        ? String(ev.disposition_key)
        : null,
    payload?.lost_fact ? `Fact: ${payload.lost_fact}` : null,
    payload?.callback_reason ? `Callback reason: ${payload.callback_reason}` : null,
    payload?.charged_to ? `Delay charged to ${payload.charged_to}` : null,
    payload?.delay_minutes != null ? `${payload.delay_minutes} minutes deferred` : null,
    ev.note ? String(ev.note) : null,
  ].filter(Boolean);

  return (
    <li className="border-b border-[var(--arth-n10)] px-4 py-3 text-sm">
      <span className="font-data">{istDateTime(String(ev.created_at))}</span>
      {" · "}
      {actorLabel(String(ev.actor_type ?? ""))}
      {ev.actor_name ? ` · ${String(ev.actor_name)}` : ""}
      {" · "}
      {eventLabel(String(ev.event_type ?? ""))}
      {facts.length > 0 ? ` · ${facts.join(" · ")}` : ""}
    </li>
  );
}
