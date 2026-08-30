"use client";

import { useCallback, useState } from "react";
import { CallTimer } from "@/components/call-timer";
import { DispositionPanel } from "@/components/disposition-panel";
import { HandoffButton } from "@/components/handoff-button";
import { StagePanel } from "@/components/stage-panel";
import { WhatsAppSend } from "@/components/whatsapp-send";
import { QuoteButton } from "@/components/register-forms";
import { ConsentPanel } from "@/components/consent-panel";

export function CallDesk({
  leadId,
  phone,
  stageKey,
  department,
  nextLeadId,
  nextName,
  autoContinue,
  dispositions,
  lostReasons,
  salesPeople = [],
  mode = "direct",
  priceLine,
  emiLine,
  consents,
}: {
  leadId: string;
  phone: string;
  stageKey: string;
  department?: string | null;
  nextLeadId?: string;
  nextName?: string;
  autoContinue?: boolean;
  dispositions: {
    key: string;
    label: string;
    requires_revisit: boolean;
    requires_lost_reason: boolean;
    connected: boolean;
  }[];
  lostReasons: { key: string; label: string; requires_fact: string }[];
  salesPeople?: { id: string; full_name: string }[];
  mode?: string;
  priceLine?: string;
  emiLine?: string;
  consents?: { purpose_key: string; granted: boolean }[];
}) {
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState("");
  const onSeconds = useCallback((n: number) => setSeconds(n), []);
  const sales = (department ?? "sales") === "sales";

  return (
    <div className="space-y-4">
      <CallTimer phone={phone} leadId={leadId} onSeconds={onSeconds} />
      {priceLine && sales ? (
        <p className="text-sm text-[var(--arth-n60)]">{priceLine} This is not a live telephone line and not a DMS feed.</p>
      ) : null}
      {emiLine && sales ? <p className="text-sm">{emiLine} Rates are a maintained table, never inferred by a model.</p> : null}
      <ConsentPanel leadId={leadId} initial={consents ?? []} />
      <WhatsAppSend leadId={leadId} conversation={note} department={department} />
      <DispositionPanel
        leadId={leadId}
        nextLeadId={nextLeadId}
        nextName={nextName}
        autoContinue={autoContinue}
        callSeconds={seconds}
        onNote={setNote}
        dispositions={dispositions}
        lostReasons={lostReasons}
      />
      <div className="border-t-2 border-[var(--arth-ink)] pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          Stage, not a call
        </p>
        <p className="mt-2 mb-3 text-sm text-[var(--arth-n60)]">
          Recording an outcome and moving a stage are two different acts.
          {sales ? " Qualify here before you hand on. Meeting is the floor word for this step." : " Use this department ladder only."}
        </p>
        <StagePanel leadId={leadId} stageKey={stageKey} department={department} />
      </div>
      <HandoffButton
        leadId={leadId}
        stageKey={stageKey}
        department={department}
        salesPeople={salesPeople}
        mode={mode}
      />
      {sales ? <QuoteButton leadId={leadId} /> : null}
    </div>
  );
}
