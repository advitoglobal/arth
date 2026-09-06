"use client";

import { useCallback, useState } from "react";
import { CallTimer } from "@/components/call-timer";
import { DispositionPanel } from "@/components/disposition-panel";
import { HandoffButton } from "@/components/handoff-button";
import { StagePanel } from "@/components/stage-panel";
import { WhatsAppSend } from "@/components/whatsapp-send";
import { QuoteButton } from "@/components/register-forms";
import { ConsentPanel } from "@/components/consent-panel";
import { AdvisePanel } from "@/components/advise-panel";
import { proposeFromTaps } from "@/domain/propose";

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
  adviseSnap,
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
  adviseSnap?: {
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
}) {
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState("");
  const [proposal, setProposal] = useState<ReturnType<typeof proposeFromTaps>>(null);
  const onSeconds = useCallback((n: number) => setSeconds(n), []);
  const sales = (department ?? "sales") === "sales";

  return (
    <div className="space-y-4">
      <CallTimer phone={phone} leadId={leadId} onSeconds={onSeconds} />
      {sales && adviseSnap ? (
        <AdvisePanel
          leadId={leadId}
          snap={adviseSnap}
          onTap={(tool, values) => {
            setProposal(proposeFromTaps([{ payload: { tool, values } }]));
          }}
        />
      ) : null}
      {priceLine && sales && !adviseSnap ? (
        <p className="text-sm text-[var(--arth-n60)]">{priceLine} This is not a live telephone line and not a DMS feed.</p>
      ) : null}
      {emiLine && sales && !adviseSnap ? <p className="text-sm">{emiLine} Rates are a maintained table, never inferred by a model.</p> : null}
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
        proposal={proposal}
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
