"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { WhatsAppKind } from "@/lib/whatsapp";
import { QUICK_LINKS } from "@/domain/whatsapp-loop";
import { CONFIRM_MS } from "@/domain/confirm";
import { InPlaceConfirm } from "@/components/in-place-confirm";

export function WhatsAppSend({
  leadId,
  department,
}: {
  leadId: string;
  department?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState<WhatsAppKind | null>(null);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(null), CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [saved]);

  async function send(kind: WhatsAppKind) {
    setError(null);
    setBusy(kind);
    try {
      const res = await fetch("/api/v1/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, kind }),
      });
      const data = await res.json();
      setBusy(null);
      if (!res.ok) {
        setError(data.error ?? "WhatsApp was not sent.");
        return;
      }
      setSaved(data.recorded ?? "Sent from the dealership number.");
    } catch {
      setBusy(null);
      setError("Not sent. Try again when the line is back.");
    }
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
        : QUICK_LINKS.map((l) => ({ kind: l.key, label: l.label }));

  if (saved) {
    return (
      <InPlaceConfirm
        line={saved}
        next="After this window the templates are here again."
      />
    );
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        WhatsApp
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        One tap. Consent is checked first. Templates only. Sent from the dealership number, never a personal phone. A brochure earns no points. A quotation sent does.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {kinds.map((k) => (
          <Button key={k.kind} type="button" variant="outline" disabled={busy !== null} onClick={() => send(k.kind)}>
            {busy === k.kind ? "Sending…" : k.label}
          </Button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
