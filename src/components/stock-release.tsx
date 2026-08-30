"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function StockRelease({
  rows,
}: {
  rows: { id: string; vin: string; model: string }[];
}) {
  const router = useRouter();
  const [id, setId] = useState(rows[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    const res = await fetch("/api/v1/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release_stock", stockId: id, reason }),
    });
    const data = await res.json();
    setMsg(data.recorded ?? data.error);
    router.refresh();
  }

  if (rows.length === 0) return <p className="text-sm text-[var(--arth-n60)]">No booked cars to release.</p>;

  return (
    <div className="space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <label className="block text-sm">
        Booked car
        <select className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2" value={id} onChange={(e) => setId(e.target.value)}>
          {rows.map((r) => (
            <option key={r.id} value={r.id}>
              {r.model} · {r.vin}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Why
        <input className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <Button type="button" onClick={run}>Release</Button>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}
