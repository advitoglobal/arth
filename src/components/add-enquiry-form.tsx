"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/action-button";

export function AddEnquiryForm({
  presetPhone,
  rateLine,
}: {
  presetPhone?: string;
  rateLine?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(presetPhone ?? "");
  const [model, setModel] = useState("");
  const [source, setSource] = useState("inbound_call");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<string | null>(null);
  const [colour, setColour] = useState("");
  const [variant, setVariant] = useState("");
  const [altModel, setAltModel] = useState("");
  const [buyerType, setBuyerType] = useState("");
  const [financeNeeded, setFinanceNeeded] = useState(false);
  const [bank, setBank] = useState("");
  const [booking, setBooking] = useState("");
  const [delivery, setDelivery] = useState("");
  const [exchangeVehicle, setExchangeVehicle] = useState("");
  const [exchangePlace, setExchangePlace] = useState("");
  const [meetingKind, setMeetingKind] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [testdriveNeeded, setTestdriveNeeded] = useState(false);
  const [testdrivePrefDate, setTestdrivePrefDate] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  async function capture() {
    setError(null);
    const res = await fetch("/api/v1/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: name,
        phone,
        modelInterest: model,
        variantInterest: "",
        sourceKey: source,
        sourceDetail: "",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      setExisting(data.existingLeadId ?? null);
      return;
    }
    setLeadId(data.leadId);
    setSaved("The enquiry exists and you own it. Qualify below. It is already usable.");
  }

  async function qualify() {
    if (!leadId) return;
    const res = await fetch("/api/v1/qualify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        colour,
        variant,
        buyerType,
        financeNeeded,
        altModel,
        financeBankKey: bank,
        expectedBookingDate: booking,
        expectedDeliveryDate: delivery,
        exchangeVehicle,
        exchangePlace,
        meetingKind,
        meetingAt: meetingAt || undefined,
        testdriveNeeded,
        testdrivePrefDate,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      return;
    }
    router.push(`/w/tele?id=${leadId}`);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          Stage 1 · Capture
        </p>
        <p className="text-sm text-[var(--arth-n60)]">
          Four fields. Save immediately so nothing is lost on a live call.
        </p>
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
          Customer name
          <input
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Model interest
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Grand Vitara">Grand Vitara</option>
            <option value="Fronx">Fronx</option>
            <option value="Swift">Swift</option>
          </select>
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
        {error ? <p className="text-sm text-[var(--arth-overdue)]">{error}</p> : null}
        {existing ? (
          <ActionButton href={`/w/rec?id=${existing}`} variant="default">
            Open the existing record
          </ActionButton>
        ) : null}
        <Button type="button" onClick={capture} disabled={Boolean(leadId)}>
          Save enquiry
        </Button>
        {saved ? <p className="text-sm font-medium">{saved}</p> : null}
      </div>
      <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          Stage 2 · Qualify
        </p>
        <p className="text-sm text-[var(--arth-n60)]">
          Controlled lists only. A half-qualified enquiry is worth more than a lost one.
        </p>
        <label className="block text-sm">
          Variant
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            disabled={!leadId}
          >
            <option value="">Not yet</option>
            <option value="Zeta">Zeta</option>
            <option value="Delta">Delta</option>
            <option value="ZXi">ZXi</option>
          </select>
        </label>
        <label className="block text-sm">
          Colour
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            disabled={!leadId}
          >
            <option value="">Not yet</option>
            <option value="Pearl White">Pearl White</option>
            <option value="Nexa Blue">Nexa Blue</option>
            <option value="Solid Red">Solid Red</option>
          </select>
        </label>
        <label className="block text-sm">
          Buyer type
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={buyerType}
            onChange={(e) => setBuyerType(e.target.value)}
            disabled={!leadId}
          >
            <option value="">Not yet</option>
            <option value="first_time">First time</option>
            <option value="additional">Additional</option>
            <option value="replacement">Replacement</option>
            <option value="exchange">Exchange</option>
          </select>
        </label>
        <label className="block text-sm">
          Alternative model
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={altModel}
            onChange={(e) => setAltModel(e.target.value)}
            disabled={!leadId}
          >
            <option value="">None</option>
            <option value="Grand Vitara">Grand Vitara</option>
            <option value="Fronx">Fronx</option>
            <option value="Swift">Swift</option>
          </select>
        </label>
        <label className="block text-sm">
          Expected booking date
          <input
            type="date"
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={booking}
            onChange={(e) => setBooking(e.target.value)}
            disabled={!leadId}
          />
        </label>
        <label className="block text-sm">
          Expected delivery date
          <input
            type="date"
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
            disabled={!leadId}
          />
        </label>
        <label className="block text-sm">
          Car to exchange
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={exchangeVehicle}
            onChange={(e) => setExchangeVehicle(e.target.value)}
            disabled={!leadId}
          >
            <option value="">None</option>
            <option value="Swift 2018">Swift 2018</option>
            <option value="Dzire 2019">Dzire 2019</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label className="block text-sm">
          Evaluation place
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={exchangePlace}
            onChange={(e) => setExchangePlace(e.target.value)}
            disabled={!leadId}
          >
            <option value="">Not yet</option>
            <option value="showroom">At showroom</option>
            <option value="customer">At customer&apos;s place</option>
          </select>
        </label>
        <label className="block text-sm">
          Meeting
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={meetingKind}
            onChange={(e) => setMeetingKind(e.target.value)}
            disabled={!leadId}
          >
            <option value="">Not yet</option>
            <option value="showroom">Showroom visit</option>
            <option value="home">Home visit</option>
          </select>
        </label>
        <label className="block text-sm">
          Meeting date and time
          <input
            type="datetime-local"
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={meetingAt}
            onChange={(e) => setMeetingAt(e.target.value)}
            disabled={!leadId}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={testdriveNeeded}
            disabled={!leadId}
            onChange={(e) => setTestdriveNeeded(e.target.checked)}
          />
          Test drive needed
        </label>
        <label className="block text-sm">
          Preferred test drive date
          <input
            type="date"
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={testdrivePrefDate}
            onChange={(e) => setTestdrivePrefDate(e.target.value)}
            disabled={!leadId}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={financeNeeded}
            disabled={!leadId}
            onChange={(e) => setFinanceNeeded(e.target.checked)}
          />
          Finance needed
        </label>
        <label className="block text-sm">
          Bank preference
          <select
            className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            disabled={!leadId}
          >
            <option value="">Not yet</option>
            <option value="HDFC">HDFC</option>
            <option value="SBI">SBI</option>
            <option value="ICICI">ICICI</option>
          </select>
        </label>
        {rateLine ? <p className="text-sm text-[var(--arth-n60)]">{rateLine}</p> : null}
        <Button type="button" variant="outline" onClick={qualify} disabled={!leadId}>
          Save qualification and open the call
        </Button>
      </div>
    </div>
  );
}
