"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/action-button";

export function AddEnquiryForm({
  presetPhone,
}: {
  presetPhone?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(presetPhone ?? "");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [source, setSource] = useState("inbound_call");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const dirty =
    name !== "" ||
    phone !== (presetPhone ?? "") ||
    model !== "" ||
    variant !== "" ||
    detail !== "" ||
    source !== "inbound_call";

  async function save() {
    setError(null);
    const res = await fetch("/api/v1/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: name,
        phone,
        modelInterest: model,
        variantInterest: variant,
        sourceKey: source,
        sourceDetail: detail,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      setExisting(data.existingLeadId ?? null);
      return;
    }
    setExisting(null);
    setConfirm(data.recorded);
    window.setTimeout(() => {
      router.push(`/w/tele?id=${data.leadId}`);
    }, 1500);
  }

  if (confirm) {
    return (
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="font-medium">{confirm}</p>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Opening Log a call. The clock started from the next working hour.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      {dirty ? (
        <p className="bg-[var(--arth-n05)] px-3 py-2 text-sm">
          Unsaved changes. File the enquiry or they stay on this screen.
        </p>
      ) : null}
      <label className="block text-sm">
        Customer name
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Mobile
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3 font-data"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10 digits"
        />
      </label>
      <label className="block text-sm">
        Model
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Variant
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Source
        <select
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="inbound_call">Inbound call</option>
          <option value="walk_in">Walk-in</option>
          <option value="google">Google</option>
          <option value="meta">Meta</option>
        </select>
      </label>
      <label className="block text-sm">
        Source detail
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Example: missed call on showroom line"
        />
      </label>
      {error ? <p className="text-sm text-[var(--arth-overdue)]">{error}</p> : null}
      {existing ? (
        <ActionButton href={`/w/rec?id=${existing}`} variant="default">
          Open the existing record
        </ActionButton>
      ) : null}
      <Button onClick={save}>File enquiry</Button>
    </div>
  );
}
