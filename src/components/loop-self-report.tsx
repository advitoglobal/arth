"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONFIRM_MS } from "@/domain/confirm";

export function LoopSelfReport({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const dirty = text !== saved;

  useEffect(() => {
    setText(initial);
    setSaved(initial);
  }, [initial]);

  async function save() {
    const res = await fetch("/api/v1/loop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "self", text }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Not saved.");
      return;
    }
    setSaved(text);
    setMsg(data.recorded);
    window.setTimeout(() => setMsg(null), CONFIRM_MS);
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        What is getting in your way
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        The most ignored input, and often the only one with the real answer in it.
      </p>
      <textarea
        className="mt-3 min-h-[88px] w-full rounded-[3px] border border-[var(--arth-n50)] p-3 text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {dirty ? (
        <p className="mt-2 text-sm">Unsaved changes. Save this week&apos;s note or they stay on this screen.</p>
      ) : null}
      {msg ? <p className="mt-2 font-medium">{msg}</p> : null}
      <Button className="mt-3" type="button" disabled={!dirty} onClick={save}>
        Save
      </Button>
    </div>
  );
}
