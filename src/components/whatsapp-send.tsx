"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WhatsAppKind } from "@/lib/whatsapp";

export function WhatsAppSend({
  leadId,
  conversation,
}: {
  leadId: string;
  conversation: string;
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

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        WhatsApp
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        Sends a prepared message for this model and variant to the customer number. The send is written on the enquiry history. Attach the brochure or quotation PDF from this phone.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => send("brochure")}>
          {busy === "brochure" ? "Opening…" : "Send brochure"}
        </Button>
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => send("quotation")}>
          {busy === "quotation" ? "Opening…" : "Send quotation"}
        </Button>
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => send("both")}>
          {busy === "both" ? "Opening…" : "Send brochure and quotation"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
