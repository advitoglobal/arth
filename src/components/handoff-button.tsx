"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function HandoffButton({
  leadId,
  stageKey,
}: {
  leadId: string;
  stageKey: string;
}) {
  const router = useRouter();
  const ready = ["qualified", "test_drive", "quotation", "negotiation"].includes(stageKey);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  async function send() {
    setError(null);
    const res = await fetch("/api/v1/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        note: "Qualified. Handed to sales to convert.",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not handed over.");
      return;
    }
    setConfirm(data.recorded);
    window.setTimeout(() => router.push("/w/dayb"), 1500);
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Hand to sales
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        Telecalling qualifies. Sales converts. Move the stage to Qualified first, then hand it over. After that this name leaves your book.
      </p>
      {confirm ? <p className="mt-3 font-medium">{confirm}</p> : null}
      {error ? <p className="mt-3 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
      <Button className="mt-3" type="button" disabled={!ready || Boolean(confirm)} onClick={send}>
        Hand to sales
      </Button>
      {!ready ? (
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Stage is not Qualified yet. Use the stage panel.
        </p>
      ) : null}
    </div>
  );
}
