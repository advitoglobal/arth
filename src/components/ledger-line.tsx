"use client";

import { useState } from "react";
import { actorLabel, eventLabel } from "@/lib/labels";
import { istDateTime } from "@/lib/format";

type Payload = {
  lost_fact?: string | null;
  callback_reason?: string | null;
  charged_to?: string | null;
  delay_minutes?: number | null;
  points?: number | null;
  kind?: string | null;
  status?: string | null;
  scoring_connected?: boolean | null;
  lane?: string | null;
  testdrive_pref_date?: string | null;
  extras?: Record<string, string> | null;
};

export function LedgerLine({
  ev,
}: {
  ev: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
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
    payload?.kind ? String(payload.kind) : null,
    payload?.status ? String(payload.status) : null,
    ev.call_seconds != null ? `${ev.call_seconds}s on the timer` : null,
    payload?.points != null ? `+${payload.points} points` : null,
    payload?.scoring_connected === false && ev.disposition_key
      ? "Under 20 seconds, not scored as connected"
      : null,
    payload?.lane ? `Lane ${String(payload.lane).replaceAll("_", " ")}` : null,
    payload?.testdrive_pref_date ? `Preferred test drive ${payload.testdrive_pref_date}` : null,
    ev.note ? String(ev.note) : null,
  ].filter(Boolean);
  const summary = [
    istDateTime(String(ev.created_at)),
    actorLabel(String(ev.actor_type ?? "")),
    ev.actor_name ? String(ev.actor_name) : null,
    eventLabel(String(ev.event_type ?? "")),
    facts[0] ? String(facts[0]) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="border-b border-[var(--arth-n10)] text-sm">
      <button
        type="button"
        className="w-full px-4 py-3 text-left hover:bg-[var(--arth-n05)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-data">{summary}</span>
        <span className="mt-1 block text-[12.5px] text-[var(--arth-n60)]">
          {open ? "Hide the full note" : "Open the full note. Rows are never edited."}
        </span>
      </button>
      {open ? (
        <div className="space-y-2 bg-[var(--arth-n05)] px-4 py-3 text-sm">
          {facts.map((line) => (
            <p key={String(line)}>{line}</p>
          ))}
          {payload?.extras
            ? Object.entries(payload.extras).map(([k, v]) =>
                v ? (
                  <p key={k}>
                    {k}: {v}
                  </p>
                ) : null,
              )
            : null}
          <p className="text-[var(--arth-n60)]">
            Recording file: not on this desk until a telephone vendor is contracted.
          </p>
        </div>
      ) : null}
    </li>
  );
}
