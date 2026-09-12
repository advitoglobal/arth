"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CallTimer } from "@/components/call-timer";
import { DispositionPanel } from "@/components/disposition-panel";
import { HandoffButton } from "@/components/handoff-button";
import { StagePanel } from "@/components/stage-panel";
import { WhatsAppSend } from "@/components/whatsapp-send";
import { QuoteButton } from "@/components/register-forms";
import { ConsentPanel } from "@/components/consent-panel";
import { AdvisePanel } from "@/components/advise-panel";
import { proposeFromTaps } from "@/domain/propose";
import { WRAP_UP_SECONDS, type CallPhase } from "@/domain/call-flow";
import { Button } from "@/components/ui/button";

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
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [wrapLeft, setWrapLeft] = useState<number | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [skipError, setSkipError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ReturnType<typeof proposeFromTaps>>(null);
  const onSeconds = useCallback((n: number) => setSeconds(n), []);
  const router = useRouter();
  const sales = (department ?? "sales") === "sales";
  const wrapping = phase === "ended";

  useEffect(() => {
    if (!wrapping) {
      setWrapLeft(null);
      return;
    }
    setWrapLeft(WRAP_UP_SECONDS);
    const t = window.setInterval(() => {
      setWrapLeft((n) => (n == null || n <= 0 ? 0 : n - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [wrapping, leadId]);

  async function skipWrap() {
    setSkipError(null);
    const res = await fetch("/api/v1/dispositions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, skipWrap: true, skipReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSkipError(data.error ?? "Not skipped.");
      return;
    }
    if (nextLeadId) {
      router.push(autoContinue ? `/w/tele?id=${nextLeadId}&auto=1` : `/w/tele?id=${nextLeadId}`);
    } else {
      router.push("/w/dayb");
    }
  }

  return (
    <div className="space-y-4">
      <CallTimer phone={phone} leadId={leadId} onSeconds={onSeconds} onPhase={setPhase} />
      {wrapping ? (
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            Wrap-up
          </p>
          <p className="mt-2 text-sm">
            {wrapLeft == null || wrapLeft > 0
              ? `${wrapLeft ?? WRAP_UP_SECONDS} seconds to record the outcome. The next name does not load until you do, or until you skip with a reason.`
              : "The wrap-up window has ended. Record an outcome or skip with a reason. The next name still waits."}
          </p>
          <label className="mt-3 block text-sm">
            Skip wrap-up
            <input
              className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Why the next name is loading without an outcome"
            />
          </label>
          <Button className="mt-3" type="button" variant="outline" onClick={skipWrap}>
            Skip with reason
          </Button>
          {skipError ? <p className="mt-2 text-sm text-[var(--arth-overdue)]">{skipError}</p> : null}
        </div>
      ) : null}
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
        wrapOpen={wrapping}
        underFloor={seconds > 0 && seconds < 20}
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
