"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DispositionPanel({
  leadId,
  dispositions,
  lostReasons,
}: {
  leadId: string;
  dispositions: { key: string; label: string; requires_revisit: boolean; requires_lost_reason: boolean }[];
  lostReasons: { key: string; label: string; requires_fact: string }[];
}) {
  const initial = dispositions[0]?.key ?? "no_answer";
  const router = useRouter();
  const [key, setKey] = useState(initial);
  const [revisit, setRevisit] = useState("");
  const [lost, setLost] = useState("");
  const [note, setNote] = useState("");
  const [callbackReason, setCallbackReason] = useState("");
  const [lostFact, setLostFact] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const farCallback =
    revisit !== "" &&
    new Date(revisit).getTime() - Date.now() > 14 * 24 * 60 * 60 * 1000;
  const dirty =
    note !== "" ||
    revisit !== "" ||
    lost !== "" ||
    callbackReason !== "" ||
    lostFact !== "" ||
    key !== initial;
  const selected = dispositions.find((d) => d.key === key);
  const selectedLost = lostReasons.find((r) => r.key === lost);
  const showLostFact = selected?.requires_lost_reason && selectedLost && selectedLost.requires_fact !== "none";
  const showRevisit = selected?.requires_revisit || selected?.key === "connected_callback";

  useEffect(() => {
    if (!confirm || !eventId) return;
    const t = window.setTimeout(() => {
      setConfirm(null);
      setEventId(null);
      router.refresh();
    }, 1500);
    return () => window.clearTimeout(t);
  }, [confirm, eventId, router]);

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
        callbackReason: callbackReason || undefined,
        lostFact: lostFact || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      return;
    }
    setEventId(data.eventId ?? null);
    setConfirm(`${data.recorded}. Next action is on the queue.`);
    setNote("");
    setRevisit("");
    setLost("");
    setCallbackReason("");
    setLostFact("");
  }

  async function undo() {
    if (!eventId) return;
    const res = await fetch("/api/v1/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, eventId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Undo failed.");
      return;
    }
    setConfirm(null);
    setEventId(null);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="font-medium">{confirm}</p>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Undo writes a correcting entry. The original row stays.
        </p>
        <Button className="mt-4" variant="outline" onClick={undo}>
          Undo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      {dirty ? (
        <p className="bg-[var(--arth-n05)] px-3 py-2 text-sm">
          Unsaved changes. Record outcome or they stay on this screen.
        </p>
      ) : null}
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
      {showRevisit ? (
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
      {farCallback ? (
        <label className="block text-sm">
          Reason the callback is more than 14 days away
          <input
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={callbackReason}
            onChange={(e) => setCallbackReason(e.target.value)}
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
      {showLostFact ? (
        <label className="block text-sm">
          {selectedLost?.requires_fact}
          <input
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={lostFact}
            onChange={(e) => setLostFact(e.target.value)}
          />
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
      <div className="flex gap-2">
        <Button onClick={save}>Record outcome</Button>
      </div>
    </div>
  );
}
