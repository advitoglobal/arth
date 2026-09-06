"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OffboardButton() {
  const [csv, setCsv] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function run() {
    const res = await fetch("/api/v1/offboard", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "Export failed.");
      return;
    }
    setCsv(data.csv);
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--arth-n60)]">
        Contractual offboarding: one CSV of this dealer&apos;s enquiries. The export itself is an audit row.
      </p>
      <Button type="button" variant="outline" onClick={run}>
        Export this dealer
      </Button>
      {err ? <p className="text-sm text-[var(--arth-overdue)]">{err}</p> : null}
      {csv ? <pre className="overflow-x-auto border border-[var(--arth-n10)] p-3 font-data text-sm">{csv}</pre> : null}
    </div>
  );
}
