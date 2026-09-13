"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function InboundRing({
  department,
  calls,
}: {
  department: string;
  calls: { id: string; from_phone: string; label: string; did: string }[];
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("9845011188");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function simulate() {
    setError(null);
    const res = await fetch("/api/v1/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "simulate_inbound", department, fromPhone: phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not ringing.");
      return;
    }
    setNote(data.recorded);
    router.refresh();
  }

  async function answer(callId: string) {
    setError(null);
    const res = await fetch("/api/v1/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "answer_inbound", callId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not answered.");
      return;
    }
    if (data.leadId) {
      router.push(`/w/tele?id=${data.leadId}`);
      return;
    }
    router.push(`/w/new?phone=${encodeURIComponent(data.from_phone ?? phone)}`);
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Desk DID
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        This is the desk DID until a telephone vendor is contracted. It is not SIM pairing. If the number matches a customer, Answer opens their console. If not, capture opens with the number filled.
      </p>
      <label className="mt-3 block text-sm">
        Simulate a ring from
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3 font-data"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <Button className="mt-3" type="button" variant="outline" onClick={simulate}>
        Ring this department
      </Button>
      {calls.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--arth-n60)]">Nothing is ringing.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--arth-n10)]">
          {calls.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-data text-sm">
                {c.from_phone} · {c.did}
                {c.label ? ` · ${c.label}` : ""}
              </span>
              <Button type="button" onClick={() => answer(c.id)}>
                Answer
              </Button>
            </li>
          ))}
        </ul>
      )}
      {note ? <p className="mt-2 text-sm">{note}</p> : null}
      {error ? <p className="mt-2 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
