"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function send() {
    const res = await fetch("/api/v1/floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "forgot", username }),
    });
    const data = await res.json();
    setMsg(data.recorded ?? data.error ?? "If that username exists, the manager has been told.");
  }
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Forgot password
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        The manager, dealer admin, or principal is told. They set a temporary password. They never hold your live password. You must change it on first use.
      </p>
      <label className="mt-3 block text-sm">
        Username
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <Button className="mt-3" type="button" variant="outline" onClick={send}>
        Tell my manager
      </Button>
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </div>
  );
}

export function ProfileForm({
  fullName,
  whatsappPhone,
}: {
  fullName: string;
  whatsappPhone: string;
}) {
  const [name, setName] = useState(fullName);
  const [phone, setPhone] = useState(whatsappPhone);
  const [msg, setMsg] = useState<string | null>(null);
  async function save() {
    const res = await fetch("/api/v1/floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "profile", fullName: name, whatsappPhone: phone }),
    });
    const data = await res.json();
    setMsg(data.recorded ?? data.error ?? "Not saved.");
  }
  return (
    <div className="max-w-lg space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Name and WhatsApp
      </p>
      <p className="text-sm text-[var(--arth-n60)]">
        Role, scope, and working hours stay as the admin set them.
      </p>
      <label className="block text-sm">
        Name
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        WhatsApp number for notices
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2 font-data"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10 digits"
        />
      </label>
      <Button type="button" onClick={save}>
        Save
      </Button>
      {msg ? <p className="text-sm">{msg}</p> : null}
    </div>
  );
}

export function AssignmentModeForm({ current }: { current: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  async function setMode(mode: "direct" | "pool" | "queue") {
    const res = await fetch("/api/v1/floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mode", mode }),
    });
    const data = await res.json();
    setMsg(data.recorded ?? data.error ?? "Not saved.");
  }
  const label = current === "pool" ? "Pool" : current === "queue" ? "Department queue" : "Direct";
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Assignment mode
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        Direct: the telecaller names the receiving executive. Pool: first to reach owns it. Department queue: the sales manager assigns. Keep and nurture is always available on the telecaller desk.
      </p>
      <p className="mt-2 text-sm">Current: {label}.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setMode("direct")}>
          Direct
        </Button>
        <Button type="button" variant="outline" onClick={() => setMode("pool")}>
          Pool
        </Button>
        <Button type="button" variant="outline" onClick={() => setMode("queue")}>
          Department queue
        </Button>
      </div>
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </div>
  );
}

export function UploadBatchForm() {
  const [batchName, setBatchName] = useState("Service due");
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function send() {
    const res = await fetch("/api/v1/floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upload", batchName, csv }),
    });
    const data = await res.json();
    setMsg(data.recorded ?? data.error ?? "Not uploaded.");
  }
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Upload service due
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        Lands only in service. Each name is labelled Uploaded by manager with this batch name. Format: name, phone, model. One row per line.
      </p>
      <label className="mt-3 block text-sm">
        Batch name
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
        />
      </label>
      <label className="mt-3 block text-sm">
        Rows
        <textarea
          className="mt-1 h-28 w-full rounded-[3px] border border-[var(--arth-n50)] px-2 py-2 font-data text-sm"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="Meera Joshi, 9845001122, Swift"
        />
      </label>
      <Button className="mt-3" type="button" onClick={send}>
        Upload
      </Button>
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </div>
  );
}

export function QuoteButton({ leadId }: { leadId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  async function freeze() {
    const res = await fetch("/api/v1/floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "quote", leadId }),
    });
    const data = await res.json();
    setMsg(data.recorded ?? data.error ?? "Not frozen.");
  }
  return (
    <div>
      <Button type="button" variant="outline" onClick={freeze}>
        Freeze quotation at live prices
      </Button>
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </div>
  );
}

export function ReassignForm({
  leadId,
  people,
}: {
  leadId: string;
  people: { id: string; full_name: string; role_key: string }[];
}) {
  const [toUserId, setToUserId] = useState(people[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function send() {
    const res = await fetch("/api/v1/floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reassign", leadId, toUserId, reason }),
    });
    const data = await res.json();
    setMsg(data.recorded ?? data.error ?? "Not reassigned.");
  }
  if (people.length === 0) return null;
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Reassign
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        Always with a reason. The reason is written on the ledger.
      </p>
      <label className="mt-3 block text-sm">
        New owner
        <select
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={toUserId}
          onChange={(e) => setToUserId(e.target.value)}
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} · {p.role_key}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm">
        Reason
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <Button type="button" onClick={send}>
        Reassign
      </Button>
      {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
    </div>
  );
}

export function BounceToPoolForm({ leadId }: { leadId: string }) {
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function send() {
    const res = await fetch("/api/v1/floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bounce", leadId, reason }),
    });
    const data = await res.json();
    setMsg(data.recorded ?? data.error ?? "Not bounced.");
  }
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Bounce to pool
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        Returns to the branch pool with a reason. It does not go back to the telecaller who handed it on.
      </p>
      <label className="mt-3 block text-sm">
        Reason
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <Button className="mt-3" type="button" onClick={send}>
        Bounce to pool
      </Button>
      {msg ? <p className="mt-3 font-medium">{msg}</p> : null}
    </div>
  );
}
