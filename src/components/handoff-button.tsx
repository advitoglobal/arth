"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function ready(stageKey: string, department?: string | null) {
  if (department === "service") {
    return ["appointment", "arrived", "in_work", "waiting_parts", "ready"].includes(stageKey);
  }
  if (department === "insurance") {
    return ["quoted", "recommended", "issued"].includes(stageKey);
  }
  return ["meeting", "qualified", "test_drive", "quotation", "negotiation"].includes(stageKey);
}

export function HandoffButton({
  leadId,
  stageKey,
  department,
  salesPeople,
  mode,
}: {
  leadId: string;
  stageKey: string;
  department?: string | null;
  salesPeople: { id: string; full_name: string }[];
  mode: string;
}) {
  const router = useRouter();
  const can = ready(stageKey, department);
  const [salesUserId, setSalesUserId] = useState(salesPeople[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const label =
    department === "service"
      ? "service advisor"
      : department === "insurance"
        ? "insurance executive"
        : "sales consultant";

  async function send() {
    setError(null);
    const res = await fetch("/api/v1/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        note: "Ready. Handed on for conversion.",
        salesUserId: mode === "direct" ? salesUserId : undefined,
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
        Hand on
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        A telecaller job ends at assignment. {mode === "pool"
          ? `This branch is on pool. First ${label} to claim owns it.`
          : `Direct mode. Name the receiving ${label}.`}
      </p>
      {mode === "direct" && salesPeople.length > 0 ? (
        <label className="mt-3 block text-sm">
          {label}
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={salesUserId}
            onChange={(e) => setSalesUserId(e.target.value)}
          >
            {salesPeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {confirm ? <p className="mt-3 font-medium">{confirm}</p> : null}
      {error ? <p className="mt-3 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
      <Button className="mt-3" type="button" disabled={!can || Boolean(confirm)} onClick={send}>
        {mode === "pool" ? "Send to pool" : `Hand to ${label}`}
      </Button>
      {!can ? (
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Stage is not ready to hand on. Use the stage panel.
        </p>
      ) : null}
    </div>
  );
}
