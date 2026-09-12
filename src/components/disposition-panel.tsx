"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JUNK_REASONS } from "@/domain/junk";
import { needsCallbackReason } from "@/domain/clock";

export function DispositionPanel({
  leadId,
  nextLeadId,
  nextName,
  autoContinue = false,
  callSeconds = 0,
  wrapOpen = false,
  underFloor = false,
  onNote,
  dispositions,
  lostReasons,
  proposal,
}: {
  leadId: string;
  nextLeadId?: string;
  nextName?: string;
  autoContinue?: boolean;
  callSeconds?: number;
  wrapOpen?: boolean;
  underFloor?: boolean;
  onNote?: (note: string) => void;
  dispositions: {
    key: string;
    label: string;
    requires_revisit: boolean;
    requires_lost_reason: boolean;
    connected: boolean;
  }[];
  lostReasons: { key: string; label: string; requires_fact: string }[];
  proposal?: { dispositionKey: string; revisitAt?: string; reason: string; stageKey?: string } | null;
}) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [revisit, setRevisit] = useState("");
  const [lost, setLost] = useState("");
  const [note, setNote] = useState("");
  const [callbackReason, setCallbackReason] = useState("");
  const [lostFact, setLostFact] = useState("");
  const [junkReason, setJunkReason] = useState("");
  const [mergeLeadId, setMergeLeadId] = useState("");
  const [routeDepartment, setRouteDepartment] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [meetingPlace, setMeetingPlace] = useState("");
  const [testdriveSlot, setTestdriveSlot] = useState("");
  const [testdriveVariant, setTestdriveVariant] = useState("");
  const [quoteRupees, setQuoteRupees] = useState("");
  const [quoteVariant, setQuoteVariant] = useState("");
  const [quoteValidUntil, setQuoteValidUntil] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const farCallback = needsCallbackReason(revisit || null);
  const selected = dispositions.find((d) => d.key === key);
  const selectedLost = lostReasons.find((r) => r.key === lost);
  const junk = JUNK_REASONS.find((r) => r.key === junkReason);
  const showLostFact =
    Boolean(selected?.requires_lost_reason) &&
    Boolean(selectedLost) &&
    selectedLost?.requires_fact !== "none";
  const showRevisit = Boolean(
    selected?.requires_revisit || selected?.key === "connected_callback",
  );
  const needsRevisit = Boolean(
    selected?.requires_revisit || selected?.key === "connected_callback",
  );
  const dirty =
    note !== "" ||
    revisit !== "" ||
    lost !== "" ||
    callbackReason !== "" ||
    lostFact !== "" ||
    junkReason !== "" ||
    key !== "" ||
    meetingAt !== "" ||
    testdriveSlot !== "" ||
    quoteRupees !== "";
  const canSave = Boolean(
    key &&
      (!needsRevisit || revisit) &&
      (!selected?.requires_lost_reason || lost) &&
      (!showLostFact || lostFact.trim()) &&
      (!farCallback || callbackReason.trim()) &&
      (!selected?.connected || note.trim()) &&
      (selected?.key !== "not_an_enquiry" ||
        (junkReason &&
          (junk?.key !== "duplicate" || mergeLeadId.trim()) &&
          (junk?.key !== "route_other_dept" || routeDepartment))) &&
      (selected?.key !== "meeting_booked" || (meetingAt && meetingPlace)) &&
      (selected?.key !== "testdrive_booked" || testdriveSlot) &&
      (selected?.key !== "quotation_sent" ||
        (quoteRupees.trim() && quoteVariant.trim() && quoteValidUntil)),
  );

  useEffect(() => {
    if (!confirm || !eventId) return;
    const t = window.setTimeout(() => {
      setConfirm(null);
      setEventId(null);
      if (nextLeadId) {
        router.push(
          autoContinue ? `/w/tele?id=${nextLeadId}&auto=1` : `/w/tele?id=${nextLeadId}`,
        );
      } else if (autoContinue) {
        router.push("/w/dayb");
      } else {
        router.refresh();
      }
    }, 1500);
    return () => window.clearTimeout(t);
  }, [confirm, eventId, router, nextLeadId, autoContinue]);

  async function save() {
    if (!canSave) return;
    setError(null);
    const res = await fetch("/api/v1/dispositions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        dispositionKey: key,
        note,
        revisitAt: revisit || undefined,
        lostReasonKey: lost || undefined,
        callbackReason: callbackReason || undefined,
        lostFact: lostFact || undefined,
        callSeconds,
        notEnquiryReason: junkReason || undefined,
        mergeLeadId: mergeLeadId || undefined,
        routeDepartment: routeDepartment || undefined,
        meetingAt: meetingAt || undefined,
        meetingPlace: meetingPlace || undefined,
        testdriveSlot: testdriveSlot || undefined,
        testdriveVariant: testdriveVariant || undefined,
        quoteRupees: quoteRupees || undefined,
        quoteVariant: quoteVariant || undefined,
        quoteValidUntil: quoteValidUntil || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Not saved.");
      return;
    }
    setEventId(data.eventId ?? null);
    setConfirm(data.confirm ?? `${data.recorded}. Next action is on the queue.`);
    setNote("");
    setRevisit("");
    setLost("");
    setCallbackReason("");
    setLostFact("");
    setKey("");
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
    setConfirm(null);
    setEventId(null);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="font-medium">{confirm}</p>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Undo writes a correcting entry. The original row stays.
          {nextName
            ? ` After this window the next enquiry is ${nextName}.`
            : autoContinue
              ? " The list is finished. After this window you return to Today."
              : " After this window you stay on Today if nothing else is due."}
        </p>
        <Button className="mt-4" variant="outline" onClick={undo}>
          Undo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      {dirty ? (
        <p className="bg-[var(--arth-n05)] px-3 py-2 text-sm">
          Unsaved changes. Record outcome or they stay on this screen.
        </p>
      ) : null}
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Disposition
      </p>
      {wrapOpen ? (
        <p className="text-sm">
          No outcome, no save. The next enquiry waits here.
        </p>
      ) : null}
      {underFloor ? (
        <p className="text-sm text-[var(--arth-overdue)]">
          Under 20 seconds is not a connected call for scoring. You can still record a not-connected outcome.
        </p>
      ) : null}
      <label className="block text-sm">
        Outcome
          <select
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] bg-[var(--arth-n00)] px-2"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setRevisit("");
              setLost("");
              setLostFact("");
              setCallbackReason("");
            }}
          >
            <option value="">Select an outcome</option>
            <optgroup label="Connected">
              {dispositions.filter((d) => d.connected).map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </optgroup>
            <optgroup label="Not connected">
              {dispositions.filter((d) => !d.connected && d.key !== "not_an_enquiry").map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </optgroup>
            {dispositions.some((d) => d.key === "not_an_enquiry") ? (
              <optgroup label="Neither">
                {dispositions.filter((d) => d.key === "not_an_enquiry").map((d) => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </optgroup>
            ) : null}
          </select>
      </label>
      {showRevisit ? (
        <label className="block text-sm">
          Revisit on
          <input
            type="date"
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={revisit}
            onChange={(e) => setRevisit(e.target.value)}
          />
        </label>
      ) : null}
      {farCallback ? (
        <label className="block text-sm">
          Reason the callback is more than 14 days away
          <input
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={callbackReason}
            onChange={(e) => setCallbackReason(e.target.value)}
          />
        </label>
      ) : null}
      {selected?.requires_lost_reason ? (
        <label className="block text-sm">
          Lost reason
          <select
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={lost}
            onChange={(e) => setLost(e.target.value)}
          >
            <option value="">Select</option>
            {lostReasons.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {showLostFact ? (
        <label className="block text-sm">
          {selectedLost?.requires_fact}
          <input
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            value={lostFact}
            onChange={(e) => setLostFact(e.target.value)}
          />
        </label>
      ) : null}
      {selected?.key === "meeting_booked" ? (
        <>
          <label className="block text-sm">
            Meeting at
            <input
              type="datetime-local"
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={meetingAt}
              onChange={(e) => setMeetingAt(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Where
            <select
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={meetingPlace}
              onChange={(e) => setMeetingPlace(e.target.value)}
            >
              <option value="">Select</option>
              <option value="showroom">Showroom</option>
              <option value="home">Home</option>
            </select>
          </label>
        </>
      ) : null}
      {selected?.key === "testdrive_booked" ? (
        <>
          <label className="block text-sm">
            Slot
            <input
              type="datetime-local"
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={testdriveSlot}
              onChange={(e) => setTestdriveSlot(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Variant
            <input
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={testdriveVariant}
              onChange={(e) => setTestdriveVariant(e.target.value)}
            />
          </label>
        </>
      ) : null}
      {selected?.key === "quotation_sent" ? (
        <>
          <label className="block text-sm">
            Amount in rupees
            <input
              inputMode="numeric"
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={quoteRupees}
              onChange={(e) => setQuoteRupees(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Variant
            <input
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={quoteVariant}
              onChange={(e) => setQuoteVariant(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Valid until
            <input
              type="date"
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={quoteValidUntil}
              onChange={(e) => setQuoteValidUntil(e.target.value)}
            />
          </label>
        </>
      ) : null}
      <label className="block text-sm">
        What was said
        <textarea
          className="mt-1 block min-h-20 w-full rounded-[3px] border border-[var(--arth-n50)] px-2 py-2"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            onNote?.(e.target.value);
          }}
          placeholder="Example: asked for a Saturday test drive and the Zxi brochure"
        />
      </label>
      {selected?.key === "not_an_enquiry" ? (
        <>
          <label className="block text-sm">
            Why this is not an enquiry
            <select
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={junkReason}
              onChange={(e) => setJunkReason(e.target.value)}
            >
              <option value="">Select</option>
              {JUNK_REASONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {junk?.key === "duplicate" ? (
            <label className="block text-sm">
              Existing enquiry id to merge into. A person decides. Nothing auto-merges.
              <input
                className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
                value={mergeLeadId}
                onChange={(e) => setMergeLeadId(e.target.value)}
              />
            </label>
          ) : null}
          {junk?.key === "route_other_dept" ? (
            <label className="block text-sm">
              Route to
              <select
                className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
                value={routeDepartment}
                onChange={(e) => setRouteDepartment(e.target.value)}
              >
                <option value="">Select</option>
                <option value="sales">Sales</option>
                <option value="service">Service</option>
                <option value="insurance">Insurance</option>
              </select>
            </label>
          ) : null}
        </>
      ) : null}
      {proposal ? (
        <p className="bg-[var(--arth-n05)] px-3 py-2 text-sm">
          This looks like {proposal.dispositionKey.replaceAll("_", " ")}
          {proposal.revisitAt ? ` on ${proposal.revisitAt}` : ""}, {proposal.reason}. Correct? Nothing is selected until you choose an outcome.
          {proposal.stageKey
            ? ` After you record, you can confirm a move to ${proposal.stageKey}. Recording an outcome and moving a stage stay two acts.`
            : ""}
        </p>
      ) : null}
      {error ? <p className="text-sm text-[var(--arth-overdue)]">{error}</p> : null}
      <div className="flex gap-2">
        <Button onClick={save} disabled={!canSave}>
          Record outcome
        </Button>
      </div>
    </div>
  );
}
