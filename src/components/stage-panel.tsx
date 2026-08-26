"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { STAGE_KEYS } from "@/domain/clock";
import { stageLabel } from "@/lib/labels";

export function StagePanel({
  leadId,
  stageKey,
}: {
  leadId: string;
  stageKey: string;
}) {
  const router = useRouter();
  const from = STAGE_KEYS.indexOf(stageKey as (typeof STAGE_KEYS)[number]);
  const next = from >= 0 && from < STAGE_KEYS.length - 1 ? STAGE_KEYS[from + 1] : null;
  const [confirm, setConfirm] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirm || !eventId) return;
    const t = window.setTimeout(() => {
      setConfirm(null);
      setEventId(null);
      router.refresh();
    }, 1500);
    return () => window.clearTimeout(t);
  }, [confirm, eventId, router]);

  if (!next) {
    return (
      <p className="text-sm text-[var(--arth-n60)]">
        This enquiry is at the last stage. Nothing further to move.
      </p>
    );
  }

  async function move() {
    if (!next) return;
    setError(null);
    const res = await fetch("/api/v1/stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, to: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      return;
    }
    setEventId(data.eventId ?? null);
    setConfirm(data.recorded);
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
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
        <p className="font-medium">{confirm}</p>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Undo writes a correcting entry. The original row stays. The enquiry returns to the previous stage.
        </p>
        <Button className="mt-4" variant="outline" onClick={undo}>
          Undo
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Stage
      </p>
      <p className="mt-2 text-sm">
        Next is {stageLabel(next)}. One step only. The move writes a ledger row.
      </p>
      {error ? <p className="mt-2 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
      <Button className="mt-3" variant="outline" onClick={move}>
        Move to {stageLabel(next)}
      </Button>
    </div>
  );
}
