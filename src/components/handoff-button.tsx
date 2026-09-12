"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { assignmentModesEnabled, handoverModeLabel } from "@/domain/handover";
import { CONFIRM_MS } from "@/domain/confirm";
import { InPlaceConfirm } from "@/components/in-place-confirm";

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
  const canHand = ready(stageKey, department);
  const enabled = assignmentModesEnabled(mode)[0] ?? "direct";
  const [choice, setChoice] = useState<"hand" | "nurture">("hand");
  const [salesUserId, setSalesUserId] = useState(salesPeople[0]?.id ?? "");
  const [revisitAt, setRevisitAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [handedOff, setHandedOff] = useState(false);
  const label =
    department === "service"
      ? "service advisor"
      : department === "insurance"
        ? "insurance executive"
        : "sales consultant";

  useEffect(() => {
    if (!confirm || !eventId) return;
    const t = window.setTimeout(() => {
      setConfirm(null);
      setEventId(null);
      if (handedOff) router.push("/w/dayb");
      else router.refresh();
    }, CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [confirm, eventId, router, handedOff]);

  async function send() {
    setError(null);
    const res = await fetch("/api/v1/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        note:
          choice === "nurture"
            ? "Not ready. Kept on this book with a revisit date."
            : "Ready. Handed on for conversion.",
        mode: choice === "nurture" ? "nurture" : enabled,
        salesUserId: enabled === "direct" && choice === "hand" ? salesUserId : undefined,
        revisitAt: choice === "nurture" ? revisitAt : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not handed over.");
      return;
    }
    setEventId(data.eventId ?? null);
    setHandedOff(choice === "hand");
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
    setHandedOff(false);
    router.refresh();
  }

  const handCopy =
    enabled === "pool"
      ? `This branch is on pool. First ${label} to reach owns it.`
      : enabled === "queue"
        ? "This branch is on the department queue. The sales manager assigns the receiving executive."
        : `Direct mode. Name the receiving ${label}.`;

  if (confirm) {
    return (
      <InPlaceConfirm
        line={confirm}
        next={
          handedOff
            ? "After this window you return to Today."
            : "After this window you stay on this enquiry."
        }
        onUndo={() => void undo()}
      />
    );
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Hand on
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        A telecaller job ends at assignment. The digital desk enables one of three ways. Keep and nurture is always available.
      </p>
      <p className="mt-2 text-sm">{handoverModeLabel(enabled)}. {handCopy}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={choice === "hand" ? "default" : "outline"}
          onClick={() => setChoice("hand")}
        >
          {enabled === "pool" ? "Send to pool" : enabled === "queue" ? "Send to queue" : `Hand to ${label}`}
        </Button>
        <Button
          type="button"
          variant={choice === "nurture" ? "default" : "outline"}
          onClick={() => setChoice("nurture")}
        >
          Keep and nurture
        </Button>
      </div>
      {choice === "hand" && enabled === "direct" && salesPeople.length > 0 ? (
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
      {choice === "nurture" ? (
        <label className="mt-3 block text-sm">
          Revisit date
          <input
            type="date"
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2 font-data"
            value={revisitAt}
            onChange={(e) => setRevisitAt(e.target.value)}
          />
        </label>
      ) : null}
      {error ? <p className="mt-3 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
      <Button
        className="mt-3"
        type="button"
        disabled={choice === "hand" && !canHand}
        onClick={() => void send()}
      >
        {choice === "nurture"
          ? "Keep on my book"
          : enabled === "pool"
            ? "Send to pool"
            : enabled === "queue"
              ? "Send to queue"
              : `Hand to ${label}`}
      </Button>
      {choice === "hand" && !canHand ? (
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Stage is not ready to hand on. Use the stage panel.
        </p>
      ) : null}
    </div>
  );
}
