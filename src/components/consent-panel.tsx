"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const PURPOSES = [
  { key: "sales_enquiry", label: "Sales enquiry" },
  { key: "service_reminders", label: "Service reminders" },
  { key: "insurance_renewal", label: "Insurance renewal" },
  { key: "offers", label: "Offers" },
];

export function ConsentPanel({
  leadId,
  initial,
  onToggle,
}: {
  leadId: string;
  initial: { purpose_key: string; granted: boolean }[];
  onToggle?: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function toggle(purpose: string, granted: boolean) {
    setError(null);
    const res = await fetch("/api/v1/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "consent", leadId, purpose, granted }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      return;
    }
    setRows((prev) => {
      const next = prev.filter((r) => r.purpose_key !== purpose);
      next.push({ purpose_key: purpose, granted });
      return next;
    });
    router.refresh();
    onToggle?.();
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        WhatsApp consent
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        One tap per purpose. Offers never ride on enquiry consent. Same row on a phone and on a wide screen.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {PURPOSES.map((p) => {
          const granted = rows.find((r) => r.purpose_key === p.key)?.granted ?? false;
          return (
            <li
              key={p.key}
              className="flex min-h-11 items-center justify-between gap-3 border border-[var(--arth-n10)] px-3 py-2 text-sm"
            >
              <span>{p.label}</span>
              <Button type="button" variant="outline" onClick={() => toggle(p.key, !granted)}>
                {granted ? "Allowed" : "Off"}
              </Button>
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-2 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
