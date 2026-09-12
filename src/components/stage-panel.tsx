"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { stagesFor } from "@/domain/ladders";
import { stageLabel } from "@/lib/labels";
import { CONFIRM_MS } from "@/domain/confirm";
import { InPlaceConfirm } from "@/components/in-place-confirm";

export function StagePanel({
  leadId,
  stageKey,
  department,
}: {
  leadId: string;
  stageKey: string;
  department?: string | null;
}) {
  const router = useRouter();
  const ladder = stagesFor(department);
  const fromKey = stageKey === "qualified" ? "meeting" : stageKey;
  const from = ladder.indexOf(fromKey);
  const next = from >= 0 && from < ladder.length - 1 ? ladder[from + 1] : null;
  const [confirm, setConfirm] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirm || !eventId) return;
    const t = window.setTimeout(() => {
      setConfirm(null);
      setEventId(null);
      router.refresh();
    }, CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [confirm, eventId, router]);

  if (!next || next === "lost") {
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
      <InPlaceConfirm
        line={confirm}
        next="The enquiry returns to the previous stage."
        onUndo={() => void undo()}
      />
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
