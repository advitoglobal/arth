"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function CallTimer({
  phone,
  onSeconds,
}: {
  phone: string;
  onSeconds: (n: number) => void;
}) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const started = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      if (started.current == null) return;
      const n = Math.floor((Date.now() - started.current) / 1000);
      setSeconds(n);
      onSeconds(n);
    }, 250);
    return () => window.clearInterval(t);
  }, [running, onSeconds]);

  const digits = phone.replace(/\D/g, "");
  const tel = digits.length === 10 ? `tel:+91${digits}` : `tel:${digits}`;

  function start() {
    started.current = Date.now() - seconds * 1000;
    setRunning(true);
    window.location.href = tel;
  }

  function stop() {
    setRunning(false);
    if (started.current != null) {
      const n = Math.floor((Date.now() - started.current) / 1000);
      setSeconds(n);
      onSeconds(n);
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Call
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        Dial on this device or the desk phone. The timer is the duration Arth will store. There is no recording file until a telephone provider is connected.
      </p>
      <p className="font-data mt-3 text-[28px]">{mm}:{ss}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={start}>
          {running ? "Dial again" : "Dial"}
        </Button>
        {running ? (
          <Button type="button" variant="outline" onClick={stop}>
            Stop timer
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-[var(--arth-n60)]">
        A connected call under 20 seconds earns no points.
      </p>
    </div>
  );
}
