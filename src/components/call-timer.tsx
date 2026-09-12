"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONNECT_FLOOR_SECONDS } from "@/domain/points";
import { callPhaseLabel, type CallPhase } from "@/domain/call-flow";

export function CallTimer({
  phone,
  leadId,
  onSeconds,
  onPhase,
}: {
  phone: string;
  leadId: string;
  onSeconds: (n: number) => void;
  onPhase?: (phase: CallPhase) => void;
}) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [notice, setNotice] = useState(
    "This call is recorded. Both of you hear that before anyone speaks. It is the law, not a setting.",
  );
  const [error, setError] = useState<string | null>(null);
  const started = useRef<number | null>(null);

  function go(next: CallPhase) {
    setPhase(next);
    onPhase?.(next);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/dial?leadId=${encodeURIComponent(leadId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.blocks)) setBlocks(data.blocks);
        if (Array.isArray(data.warnings)) setWarnings(data.warnings);
        if (data.recordingNotice) setNotice(data.recordingNotice);
      })
      .catch(() => {
        if (!cancelled) setBlocks(["Dial checks could not run. Refresh and try again."]);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  useEffect(() => {
    if (phase !== "connected") return;
    const t = window.setInterval(() => {
      if (started.current == null) return;
      const n = Math.floor((Date.now() - started.current) / 1000);
      setSeconds(n);
      onSeconds(n);
    }, 250);
    return () => window.clearInterval(t);
  }, [phase, onSeconds]);

  const digits = phone.replace(/\D/g, "");
  const tel = digits.length === 10 ? `tel:+91${digits}` : `tel:${digits}`;
  const blocked = blocks.length > 0;
  const underFloor = phase === "ended" && seconds > 0 && seconds < CONNECT_FLOOR_SECONDS;

  async function start() {
    setError(null);
    go("dialling");
    const res = await fetch("/api/v1/dial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Dial refused.");
      go("idle");
      return;
    }
    go("ringing");
    window.setTimeout(() => {
      started.current = Date.now();
      setSeconds(0);
      onSeconds(0);
      go("connected");
    }, 1200);
    window.location.href = tel;
  }

  function stop() {
    if (started.current != null) {
      const n = Math.floor((Date.now() - started.current) / 1000);
      setSeconds(n);
      onSeconds(n);
    }
    go("ended");
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Call
      </p>
      <p className="mt-2 text-sm">{notice}</p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        One button, named Dial. Until a telephone vendor is connected this is a desk simulation. Connected points still need Dial, not the timer alone.
      </p>
      <p className="font-display mt-3 text-[22px] font-semibold">
        {callPhaseLabel(phase, seconds)}
      </p>
      {underFloor ? (
        <p className="mt-2 text-sm text-[var(--arth-overdue)]">
          Under {CONNECT_FLOOR_SECONDS} seconds counts as not connected. No points, and no penalty.
        </p>
      ) : null}
      {warnings.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-[var(--arth-n60)]">
          {warnings.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      {blocked ? (
        <ul className="mt-3 space-y-1 text-sm text-[var(--arth-overdue)]">
          {blocks.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {phase === "idle" || phase === "ended" ? (
          <Button type="button" onClick={start} disabled={blocked}>
            Dial
          </Button>
        ) : null}
        {phase === "connected" ? (
          <Button type="button" variant="outline" onClick={stop}>
            End
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
