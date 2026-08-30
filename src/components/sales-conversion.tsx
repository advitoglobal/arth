"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SalesConversion({
  leadId,
  stock,
  discounts,
  canRelease,
  canApprove,
}: {
  leadId: string;
  stock: { id: string; vin: string; model: string; status: string }[];
  discounts?: { id: string; amount_paise: string; reason: string }[];
  canRelease: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [stockId, setStockId] = useState(stock.find((s) => s.status === "available")?.id ?? "");
  const [slot, setSlot] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [lane, setLane] = useState("home");
  const [status, setStatus] = useState("scheduled");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function post(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch("/api/v1/ops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      return;
    }
    setNote(data.recorded);
    router.refresh();
  }

  return (
    <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        After the meeting
      </p>
      <p className="text-sm text-[var(--arth-n60)]">
        Test drive, stock booking, discount, and delivery stay on this enquiry. Service does not see this panel.
      </p>
      <label className="block text-sm">
        Test drive slot
        <input
          type="datetime-local"
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
        />
      </label>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          post({
            action: "schedule_testdrive",
            leadId,
            slotAt: slot ? new Date(slot).toISOString() : new Date(Date.now() + 3600_000).toISOString(),
            stockId: stockId || undefined,
          })
        }
      >
        Book test drive
      </Button>
      <label className="block text-sm">
        Stock unit
        <select
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
          value={stockId}
          onChange={(e) => setStockId(e.target.value)}
        >
          {stock.map((s) => (
            <option key={s.id} value={s.id}>
              {s.model} · {s.vin} · {s.status}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => post({ action: "book_stock", leadId, stockId })}>
          Book this car
        </Button>
        {canRelease ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => post({ action: "release_stock", stockId, reason: reason || "Booking cancelled by customer." })}
          >
            Release booking
          </Button>
        ) : (
          <p className="text-sm text-[var(--arth-n60)]">Only a sales manager can release a booked car.</p>
        )}
      </div>
      <label className="block text-sm">
        Discount rupees
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3 font-data"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Why
        <input
          className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <Button
        type="button"
        variant="outline"
        onClick={() => post({ action: "request_discount", leadId, amountRupees: amount, reason })}
      >
        Ask for discount
      </Button>
      {canApprove
        ? (discounts ?? []).map((d) => (
            <div key={d.id} className="flex flex-wrap gap-2 text-sm">
              <span>₹{Math.round(Number(d.amount_paise) / 100).toLocaleString("en-IN")} · {d.reason}</span>
              <Button type="button" onClick={() => post({ action: "decide_discount", requestId: d.id, approve: true })}>
                Approve
              </Button>
              <Button type="button" variant="outline" onClick={() => post({ action: "decide_discount", requestId: d.id, approve: false })}>
                Refuse
              </Button>
            </div>
          ))
        : null}
      <label className="block text-sm">
        Delivery lane
        <select className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2" value={lane} onChange={(e) => setLane(e.target.value)}>
          <option value="home">Home</option>
          <option value="showroom">Showroom</option>
        </select>
      </label>
      <label className="block text-sm">
        Delivery status
        <select className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="scheduled">Scheduled</option>
          <option value="in_transit">In transit</option>
          <option value="delivered">Delivered</option>
        </select>
      </label>
      <Button type="button" variant="outline" onClick={() => post({ action: "delivery", leadId, lane, status })}>
        Save delivery
      </Button>
      {note ? <p className="text-sm font-medium">{note}</p> : null}
      {error ? <p className="text-sm text-[var(--arth-overdue)]">{error}</p> : null}
    </div>
  );
}
