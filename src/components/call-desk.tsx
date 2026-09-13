"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CallTimer } from "@/components/call-timer";
import { DispositionPanel } from "@/components/disposition-panel";
import { HandoffButton } from "@/components/handoff-button";
import { StagePanel } from "@/components/stage-panel";
import { WhatsAppSend } from "@/components/whatsapp-send";
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
  queuedMessages = [],
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
  queuedMessages?: { id: string; note: string }[];
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
    router.refresh();
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
              ? `${wrapLeft ?? WRAP_UP_SECONDS} seconds to record the outcome. This enquiry stays open until you save or choose Next lead.`
              : "The wrap-up window has ended. Record an outcome or skip with a reason. The next name still waits until you choose it."}
          </p>
          {queuedMessages.length > 0 ? (
            <div className="mt-3 space-y-1 text-sm">
              <p>WhatsApp replies waited. Nothing popped up while you were talking.</p>
              {queuedMessages.map((m) => (
                <p key={m.id} className="text-[var(--arth-n60)]">
                  {m.note}
                </p>
              ))}
            </div>
          ) : null}
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
      {sales ? (
        adviseSnap ? (
          <AdvisePanel
            leadId={leadId}
            snap={adviseSnap}
            onTap={(tool, values) => {
              setProposal(proposeFromTaps([{ payload: { tool, values } }]));
            }}
          />
        ) : (
          <p className="text-sm text-[var(--arth-n60)]">
            No price master for this model yet. Built-in numbers appear here when the catalogue has them.
          </p>
        )
      ) : null}
      <ConsentPanel leadId={leadId} initial={consents ?? []} />
      <WhatsAppSend leadId={leadId} department={department} />
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
          Recording an outcome, the stage, qualify, and a preferred test-drive date save together.
          {sales ? " Qualify means the information is collected, the customer is willing, and the enquiry is ready for that department." : " Use this department ladder only."}
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
    </div>
  );
}
