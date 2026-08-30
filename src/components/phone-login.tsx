"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PhoneLogin() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demo, setDemo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function requestCode() {
    setError(null);
    const res = await fetch("/api/v1/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not sent.");
      return;
    }
    setSent(true);
    setDemo(data.demoCode ?? null);
  }

  async function enter() {
    setError(null);
    const res = await fetch("/api/v1/auth/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not signed in.");
      return;
    }
    window.location.href = data.href ?? "/w/dayb";
  }

  return (
    <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Mobile number
      </p>
      <p className="text-sm text-[var(--arth-n60)]">
        Six-digit code, five minutes, five tries. No SMS vendor is connected. The demonstration code is shown once on this screen.
      </p>
      <label className="block text-sm">
        Mobile
        <input
          className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2 font-data"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="9845011111"
        />
      </label>
      <Button type="button" variant="outline" onClick={requestCode}>
        Send code
      </Button>
      {sent ? (
        <>
          {demo ? <p className="font-data text-sm">Demonstration code: {demo}</p> : (
            <p className="text-sm text-[var(--arth-n60)]">If this number is on a live seat, a code was issued.</p>
          )}
          <label className="block text-sm">
            Code
            <input
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2 font-data"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <Button type="button" onClick={enter}>
            Sign in with code
          </Button>
        </>
      ) : null}
      {error ? <p className="text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
