"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DispositionPanel({
  leadId,
  dispositions,
  lostReasons,
}: {
  leadId: string;
  dispositions: { key: string; label: string; requires_revisit: boolean; requires_lost_reason: boolean }[];
  lostReasons: { key: string; label: string }[];
}) {
  const [key, setKey] = useState(dispositions[0]?.key ?? "no_answer");
  const [revisit, setRevisit] = useState("");
  const [lost, setLost] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = dispositions.find((d) => d.key === key);

  async function save() {
    setError(null);
    const res = await fetch("/api/v1/dispositions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        dispositionKey: key,
        note,
        revisitAt: revisit || undefined,
        lostReasonKey: lost || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      return;
    }
    setConfirm(`${data.recorded}. Next action is on the queue.`);
    window.setTimeout(() => setConfirm(null), 1500);
  }

  if (confirm) {
    return (
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="font-medium">{confirm}</p>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Undo in this window writes a correcting entry. It does not delete the original.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Disposition
      </p>
      <label className="block text-sm">
        Outcome
        <select
          className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] bg-[var(--arth-n00)] px-2"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        >
          {dispositions.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      {selected?.requires_revisit ? (
        <label className="block text-sm">
          Revisit at
          <input
            type="datetime-local"
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={revisit}
            onChange={(e) => setRevisit(e.target.value)}
          />
        </label>
      ) : null}
      {selected?.requires_lost_reason ? (
        <label className="block text-sm">
          Lost reason
          <select
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={lost}
            onChange={(e) => setLost(e.target.value)}
          >
            <option value="">Select</option>
            {lostReasons.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-sm">
        Note
        <textarea
          className="mt-1 block min-h-20 w-full rounded-[3px] border border-[var(--arth-n50)] px-2 py-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Example: asked for a Saturday test drive"
        />
      </label>
      {error ? <p className="text-sm text-[var(--arth-overdue)]">{error}</p> : null}
      <Button onClick={save}>Record outcome</Button>
    </div>
  );
}
