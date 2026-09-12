"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CONFIRM_MS } from "@/domain/confirm";
import { InPlaceConfirm } from "@/components/in-place-confirm";

export function ClaimButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!msg || !eventId) return;
    const t = window.setTimeout(() => {
      setMsg(null);
      setEventId(null);
      router.refresh();
    }, CONFIRM_MS);
    return () => window.clearTimeout(t);
  }, [msg, eventId, router]);

  async function claim() {
    setError(null);
    const res = await fetch("/api/v1/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not claimed.");
      return;
    }
    setEventId(data.eventId ?? null);
    setMsg(data.recorded);
  }

  async function undo() {
    if (!eventId) return;
    const res = await fetch("/api/v1/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, eventId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Undo failed.");
      return;
    }
    setMsg(null);
    setEventId(null);
    router.refresh();
  }

  if (msg) {
    return (
      <InPlaceConfirm
        line={msg}
        next="After this window this enquiry stays on your book."
        onUndo={() => void undo()}
      />
    );
  }

  return (
    <div>
      <Button type="button" onClick={() => void claim()}>
        Claim this enquiry
      </Button>
      {error ? <p className="mt-2 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
