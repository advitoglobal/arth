"use client";

import { useCallback, useState } from "react";
import { CallTimer } from "@/components/call-timer";
import { DispositionPanel } from "@/components/disposition-panel";
import { HandoffButton } from "@/components/handoff-button";
import { StagePanel } from "@/components/stage-panel";
import { WhatsAppSend } from "@/components/whatsapp-send";
import { QuoteButton } from "@/components/register-forms";

export function CallDesk({
  leadId,
  phone,
  stageKey,
  nextLeadId,
  nextName,
  autoContinue,
  dispositions,
  lostReasons,
  salesPeople = [],
  mode = "direct",
  priceLine,
  emiLine,
}: {
  leadId: string;
  phone: string;
  stageKey: string;
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
}) {
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState("");
  const onSeconds = useCallback((n: number) => setSeconds(n), []);

  return (
    <div className="space-y-4">
      <CallTimer phone={phone} onSeconds={onSeconds} />
      {priceLine ? (
        <p className="text-sm text-[var(--arth-n60)]">{priceLine} This is not a live telephone line and not a DMS feed.</p>
      ) : null}
      {emiLine ? <p className="text-sm">{emiLine} Rates are a maintained table, never inferred by a model.</p> : null}
      <WhatsAppSend leadId={leadId} conversation={note} />
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
          Recording an outcome and moving a stage are two different acts. This panel is only the stage.           Qualify here before you hand on. Meeting is the floor word for this step.
        </p>
        <StagePanel leadId={leadId} stageKey={stageKey} />
      </div>
      <HandoffButton leadId={leadId} stageKey={stageKey} salesPeople={salesPeople} mode={mode} />
      <QuoteButton leadId={leadId} />
    </div>
  );
}
