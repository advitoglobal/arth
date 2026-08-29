"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DailyWelcome({
  late,
  due,
  firstName,
  yesterdayOutcomes,
}: {
  late: number;
  due: number;
  firstName: string | null;
  yesterdayOutcomes: number;
}) {
  const [gone, setGone] = useState(false);
  if (gone) return null;

  const good =
    yesterdayOutcomes > 0
      ? `Yesterday you logged ${yesterdayOutcomes} ${yesterdayOutcomes === 1 ? "outcome" : "outcomes"}. That is on the ledger.`
      : null;
  const today =
    late > 0
      ? `${late} late, ${due} due${firstName ? `. ${firstName} first.` : "."}`
      : due > 0
        ? `Today holds ${due} due${firstName ? `. ${firstName} first.` : "."}`
        : "Today is clear on your book.";
  const line = good
    ? "Keep the clocks inside the working day."
    : "Yesterday was hard. Today is still a list you can finish.";

  async function dismiss() {
    await fetch("/api/v1/welcome", { method: "POST" });
    setGone(true);
  }

  return (
    <aside className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        This morning
      </p>
      {good ? <p className="mt-2 text-sm">{good}</p> : null}
      <p className="mt-2 text-sm">{today}</p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">{line}</p>
      <Button className="mt-3" variant="outline" type="button" onClick={dismiss}>
        I have read this
      </Button>
    </aside>
  );
}
