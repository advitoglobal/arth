"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WhatsAppKind } from "@/lib/whatsapp";

export function WhatsAppSend({
  leadId,
  conversation,
  department,
}: {
  leadId: string;
  conversation: string;
  department?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<WhatsAppKind | null>(null);

  async function send(kind: WhatsAppKind) {
    setError(null);
    setBusy(kind);
    const res = await fetch("/api/v1/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, kind, conversation }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "WhatsApp was not prepared.");
      return;
    }
    if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  const kinds: { kind: WhatsAppKind; label: string }[] =
    department === "service"
      ? [
          { kind: "service_reminder", label: "Service reminder" },
          { kind: "offer", label: "Workshop offer" },
        ]
      : department === "insurance"
        ? [
            { kind: "insurance_quote", label: "Insurance quote" },
            { kind: "offer", label: "Renewal offer" },
          ]
        : [
            { kind: "brochure", label: "Send brochure" },
            { kind: "quotation", label: "Send quotation" },
            { kind: "both", label: "Send brochure and quotation" },
            { kind: "offer", label: "Send offer" },
          ];

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        WhatsApp
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        Each purpose has its own consent. Offers are separate from enquiry, service, and insurance messages.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {kinds.map((k) => (
          <Button key={k.kind} type="button" variant="outline" disabled={busy !== null} onClick={() => send(k.kind)}>
            {busy === k.kind ? "Opening…" : k.label}
          </Button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
