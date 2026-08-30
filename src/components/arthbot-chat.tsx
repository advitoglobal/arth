"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ArthbotChat({ tenantName }: { tenantName: string }) {
  const [question, setQuestion] = useState("Show cost per booking this month");
  const [kind, setKind] = useState<string | null>(null);
  const [rows, setRows] = useState<unknown[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setError(null);
    const res = await fetch("/api/v1/bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Refused.");
      setRows([]);
      return;
    }
    setKind(data.kind);
    setRows(data.rows ?? []);
    setNote(data.note);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <label className="block text-sm">
        Ask Arthbot
        <textarea
          className="mt-1 min-h-[88px] w-full rounded-[3px] border border-[var(--arth-n50)] px-3 py-2"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>
      <Button type="button" onClick={ask}>
        Generate report
      </Button>
      {note ? <p className="text-sm text-[var(--arth-n60)]">{note} · {tenantName}</p> : null}
      {error ? <p className="text-sm text-[var(--arth-overdue)]">{error}</p> : null}
      {kind ? (
        <div className="flex flex-wrap gap-2">
          <a className="h-11 rounded-[3px] border border-[var(--arth-ink)] px-4 leading-[44px] text-sm" href={`/api/v1/bot?kind=${kind}&format=csv`}>
            Download Excel (CSV)
          </a>
          <a className="h-11 rounded-[3px] border border-[var(--arth-n10)] px-4 leading-[44px] text-sm" href={`/api/v1/bot?kind=${kind}&format=pdf`}>
            Download PDF
          </a>
        </div>
      ) : null}
      {rows.length > 0 ? (
        <pre className="overflow-auto border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4 font-data text-xs">
          {JSON.stringify(rows.slice(0, 40), null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
