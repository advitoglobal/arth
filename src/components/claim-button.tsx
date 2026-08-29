"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ClaimButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  async function claim() {
    const res = await fetch("/api/v1/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Not claimed.");
      return;
    }
    setMsg(data.recorded);
    router.refresh();
  }
  return (
    <div>
      <Button type="button" onClick={claim}>
        Claim this enquiry
      </Button>
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </div>
  );
}
