"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { REVIEW_CRITERIA } from "@/domain/weekly-loop";

export function SampledReviewForm({
  eventId,
  name,
  reviewee,
}: {
  eventId: string;
  name: string;
  reviewee: string;
}) {
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(REVIEW_CRITERIA.map((c) => [c.key, "3"])),
  );
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    const body: Record<string, number> = {};
    for (const c of REVIEW_CRITERIA) body[c.key] = Number(scores[c.key]);
    const res = await fetch("/api/v1/loop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review", eventId, scores: body, note }),
    });
    const data = await res.json();
    setMsg(data.recorded ?? data.error ?? "Not saved.");
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="font-medium">
        {name} · {reviewee}
      </p>
      <p className="mt-1 text-sm text-[var(--arth-n60)]">
        Audio is not on file until telephony is connected. Score the call that is on the ledger.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {REVIEW_CRITERIA.map((c) => (
          <label key={c.key} className="text-sm">
            {c.label}
            <select
              className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={scores[c.key]}
              onChange={(e) => setScores((s) => ({ ...s, [c.key]: e.target.value }))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <label className="mt-3 block text-sm">
        Note
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {msg ? <p className="mt-3 font-medium">{msg}</p> : null}
      <Button className="mt-3" type="button" disabled={Boolean(msg)} onClick={save}>
        Save review
      </Button>
    </div>
  );
}
