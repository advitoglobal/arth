"use client";

import { useCallback, useState } from "react";
import { CallTimer } from "@/components/call-timer";
import { DispositionPanel } from "@/components/disposition-panel";
import { HandoffButton } from "@/components/handoff-button";
import { StagePanel } from "@/components/stage-panel";
import { WhatsAppSend } from "@/components/whatsapp-send";

export function CallDesk({
  leadId,
  phone,
  stageKey,
  nextLeadId,
  nextName,
  autoContinue,
  dispositions,
  lostReasons,
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
}) {
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState("");
  const onSeconds = useCallback((n: number) => setSeconds(n), []);

  return (
    <div className="space-y-4">
      <CallTimer phone={phone} onSeconds={onSeconds} />
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
          Recording an outcome and moving a stage are two different acts. This panel is only the stage. Qualify here before you hand to sales.
        </p>
        <StagePanel leadId={leadId} stageKey={stageKey} />
      </div>
      <HandoffButton leadId={leadId} stageKey={stageKey} />
    </div>
  );
}
