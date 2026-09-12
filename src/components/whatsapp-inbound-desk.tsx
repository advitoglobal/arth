"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WhatsAppInboundDesk({ defaultPhone = "" }: { defaultPhone?: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState(defaultPhone);
  const [text, setText] = useState("Interested. Send the brochure.");
  const [media, setMedia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function run() {
    setError(null);
    setSaved(null);
    const res = await fetch("/api/v1/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "inbound",
        fromPhone: phone,
        text,
        mediaKind: media || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not received.");
      return;
    }
    if (data.needsCapture) {
      router.push(`/w/new?phone=${encodeURIComponent(data.phone ?? phone)}`);
      return;
    }
    setSaved(data.recorded);
    if (data.leadId) router.push(`/w/msg?id=${data.leadId}`);
  }

  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Desk inbound
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        A Cloud API is not connected. This records a customer reply on the enquiry, the same way Dial is a desk simulation.
      </p>
      <label className="mt-3 block text-sm">
        From
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3 font-data"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10 digits"
        />
      </label>
      <label className="mt-3 block text-sm">
        What he said
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <label className="mt-3 block text-sm">
        Media on the customer record
        <select
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={media}
          onChange={(e) => setMedia(e.target.value)}
        >
          <option value="">None</option>
          <option value="photo_car">Photo of the car</option>
          <option value="rc">RC book</option>
          <option value="licence">Licence</option>
        </select>
      </label>
      <Button className="mt-3" type="button" variant="outline" onClick={run}>
        Record inbound
      </Button>
      {saved ? <p className="mt-2 text-sm font-medium">{saved}</p> : null}
      {error ? <p className="mt-2 text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
