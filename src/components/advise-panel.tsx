"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/format";

type Snap = {
  price: {
    onRoadPaise: number;
    stale: boolean;
    confirmedAt: Record<string, string>;
    model: string;
    variant: string;
    exShowroomPaise: number;
    rtoPaise: number;
    insurancePaise: number;
    accessoriesPaise: number;
  } | null;
  emis: { tenure: number; bank: string; rateBps: number; confirmedAt: string; emiPaise: number }[];
  staleRate: boolean;
  slots: string[];
  colours: { colour: string; n: string }[];
  trust: Record<string, string>;
};

export function AdvisePanel({
  leadId,
  snap,
  onTap,
}: {
  leadId: string;
  snap: Snap;
  onTap?: (tool: string, values: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function tap(tool: string, values: Record<string, unknown>) {
    setErr(null);
    const res = await fetch("/api/v1/advise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, tool, values }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "Not recorded.");
      return;
    }
    setMsg(data.recorded);
    onTap?.(tool, values);
  }

  return (
    <div className="space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Adviser panel
      </p>
      <p className="text-sm text-[var(--arth-n60)]">
        One tap answers the customer and writes that you discussed it. You type nothing here.
      </p>
      <div className="flex flex-wrap gap-2">
        {["price", "emi", "delivery", "testdrive"].map((tool) => (
          <Button key={tool} type="button" variant="outline" onClick={() => setOpen(tool)}>
            {tool === "price" ? "Price" : tool === "emi" ? "EMI" : tool === "delivery" ? "When" : "Drive"}
          </Button>
        ))}
      </div>
      {open === "price" ? (
        <div className="space-y-2 text-sm">
          {snap.price ? (
            <>
              <p>
                On-road {inr(snap.price.onRoadPaise / 100)} · {snap.price.model} {snap.price.variant}
                {snap.price.stale ? " · A component is older than 30 days. Treat as flagged, not current." : ""}
              </p>
              <p className="text-[var(--arth-n60)]">
                Ex-showroom {inr(snap.price.exShowroomPaise / 100)} confirmed {snap.price.confirmedAt.ex_showroom}.
                RTO {inr(snap.price.rtoPaise / 100)} confirmed {snap.price.confirmedAt.rto}.
              </p>
              <p className="text-[var(--arth-n60)]">{snap.trust.price}</p>
              <Button type="button" onClick={() => tap("price", { onRoadPaise: snap.price?.onRoadPaise, variant: snap.price?.variant })}>
                Use this on the call
              </Button>
            </>
          ) : (
            <p>No price on the master for this model yet.</p>
          )}
        </div>
      ) : null}
      {open === "emi" ? (
        <div className="space-y-2 text-sm">
          {snap.staleRate ? (
            <p className="text-[var(--arth-overdue)]">
              The bank table is stale. It will not display as current until dealer admin refreshes it.
            </p>
          ) : snap.emis.length === 0 ? (
            <p>No bank rate on the table yet.</p>
          ) : (
            snap.emis.map((e) => (
              <button
                key={e.tenure}
                type="button"
                className="block w-full border border-[var(--arth-n10)] px-3 py-2 text-left"
                onClick={() => tap("emi", { tenure: e.tenure, emiPaise: e.emiPaise, bank: e.bank })}
              >
                {e.tenure} months · {inr(e.emiPaise / 100)} · {e.bank} {(e.rateBps / 100).toFixed(2)} percent · confirmed {e.confirmedAt}
              </button>
            ))
          )}
          <p className="text-[var(--arth-n60)]">{snap.trust.emi}</p>
        </div>
      ) : null}
      {open === "delivery" ? (
        <div className="space-y-2 text-sm">
          <p>Approximate days if booked today: 21 to 35.</p>
          <p className="text-[var(--arth-n60)]">{snap.trust.delivery}</p>
          <Button type="button" onClick={() => tap("delivery", { days: "21-35" })}>
            Use this on the call
          </Button>
        </div>
      ) : null}
      {open === "testdrive" ? (
        <div className="space-y-2 text-sm">
          {snap.slots.map((slot) => (
            <button
              key={slot}
              type="button"
              className="block w-full border border-[var(--arth-n10)] px-3 py-2 text-left"
              onClick={() => tap("testdrive", { slot })}
            >
              {new Date(slot).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </button>
          ))}
          {snap.colours.length > 0 ? (
            <p className="text-[var(--arth-n60)]">
              In stock: {snap.colours.map((c) => `${c.colour} (${c.n})`).join(", ")}
            </p>
          ) : (
            <p className="text-[var(--arth-n60)]">No free stock colours on this model.</p>
          )}
          <p className="text-[var(--arth-n60)]">{snap.trust.testdrive}</p>
        </div>
      ) : null}
      {msg ? <p className="text-sm">{msg}</p> : null}
      {err ? <p className="text-sm text-[var(--arth-overdue)]">{err}</p> : null}
    </div>
  );
}
