"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DELIVERY_LANES } from "@/domain/delivery";

export function DeliveryBoard({
  leadId,
  steps,
  promises,
  trackingToken,
}: {
  leadId: string;
  steps: {
    step_key: string;
    lane: string;
    status: string;
    block_reason: string | null;
    block_kind: string | null;
  }[];
  promises: { promised_on: string; reason: string; created_at: Date }[];
  trackingToken: string | null;
}) {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function move(stepKey: string, status: string, blockKind?: string) {
    setErr(null);
    const res = await fetch("/api/v1/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "step",
        leadId,
        stepKey,
        status,
        blockReason: reason,
        blockKind,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "Not saved.");
      return;
    }
    setMsg(data.recorded);
  }

  async function overridePromise() {
    const res = await fetch("/api/v1/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "promise", leadId, promisedOn: date, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "Not saved.");
      return;
    }
    setMsg(data.recorded);
  }

  return (
    <div className="space-y-6">
      {DELIVERY_LANES.map((lane) => (
        <section key={lane.lane}>
          <h3 className="font-display text-[20px] font-semibold capitalize">{lane.lane}</h3>
          <ul className="mt-2 divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {lane.steps.map((step) => {
              const row = steps.find((s) => s.step_key === step.key);
              return (
                <li key={step.key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span>
                    {step.label}
                    {row ? ` · ${row.status}` : ""}
                    {row?.block_reason ? ` · ${row.block_reason} (${row.block_kind})` : ""}
                  </span>
                  <span className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => move(step.key, "done")}>
                      Done
                    </Button>
                    <Button type="button" variant="outline" onClick={() => move(step.key, "blocked", "internal")}>
                      Block internal
                    </Button>
                    <Button type="button" variant="outline" onClick={() => move(step.key, "blocked", "external")}>
                      Block external
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <label className="block text-sm">
        Reason for a block or a date override
        <input
          className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Override promised day
        <input
          type="date"
          className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <Button type="button" onClick={overridePromise}>
        Write a new promise
      </Button>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          Promise ledger
        </p>
        {promises.length === 0 ? (
          <p className="mt-2 text-sm">No promise yet. Completing a step writes the first date.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {promises.map((p, i) => (
              <li key={i}>
                {p.promised_on} · {p.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
      {trackingToken ? (
        <p className="text-sm">
          Customer page: <a className="underline" href={`/t/${trackingToken}`}>/t/{trackingToken}</a>. No login. Expires thirty days after physical delivery.
        </p>
      ) : null}
      {msg ? <p className="text-sm">{msg}</p> : null}
      {err ? <p className="text-sm text-[var(--arth-overdue)]">{err}</p> : null}
    </div>
  );
}
