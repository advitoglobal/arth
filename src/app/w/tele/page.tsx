import { asSeat, canOpen } from "@/db/session";
import { getLead, listQueue } from "@/services/telecalling";
import { DispositionPanel } from "@/components/disposition-panel";
import { StagePanel } from "@/components/stage-panel";
import { RuleHeading } from "@/components/brand/type";
import { istDateTime, indianMobile } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { Forbidden } from "@/components/forbidden";
import { LedgerLine } from "@/components/ledger-line";
import { enquiryNo } from "@/lib/labels";
import Link from "next/link";

export default async function TelePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "tele")) return <Forbidden />;
    const queue = await listQueue(tx, seat.userId);
    const leadId = id ?? queue[0]?.id;
    const dispositions = await tx<{ key: string; label: string; requires_revisit: boolean; requires_lost_reason: boolean; connected: boolean }[]>`
      SELECT key, label, requires_revisit, requires_lost_reason, connected FROM config_dispositions ORDER BY sort_order
    `;
    const lostReasons = await tx<{ key: string; label: string; requires_fact: string }[]>`
      SELECT key, label, requires_fact FROM config_lost_reasons
    `;
    if (!leadId) {
      return (
        <div>
          <RuleHeading>Log a call</RuleHeading>
          <p className="mt-4">No enquiries are due. New ones appear here when they are assigned.</p>
        </div>
      );
    }
    const { lead, events } = await getLead(tx, leadId);
    if (!lead) {
      return (
        <div>
          <RuleHeading>Log a call</RuleHeading>
          <p className="mt-4">This enquiry is not in your tenant.</p>
        </div>
      );
    }

    const owns = String(lead.owner_user_id ?? "") === seat.userId;
    const remaining = queue.filter((r) => r.id !== leadId);
    const nextUp = remaining[0];

    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <RuleHeading>Log a call</RuleHeading>
          <p className="mt-2 text-sm text-[var(--arth-n60)]">
            Dial on the desk phone, then record what happened here. This is not a live phone line.
          </p>
          <div className="mt-6 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
            <Link
              href={`/w/rec?id=${leadId}`}
              className="font-display text-[28px] font-semibold hover:underline"
            >
              {lead.customer_name}
            </Link>
            <p className="font-data mt-1">{indianMobile(String(lead.phone))}</p>
            <p className="mt-1 font-data text-sm text-[var(--arth-n60)]">
              Enquiry {enquiryNo(String(lead.id))}
            </p>
            <p className="mt-3 text-sm">
              {lead.model_interest} · {lead.stage_label ?? lead.stage_key}
            </p>
            <p className="mt-2 text-sm text-[var(--arth-n60)]">
              Owner {lead.owner_name ?? "unassigned"} · call by {istDateTime(lead.first_response_due)}
            </p>
          </div>
          {owns && remaining.length > 0 ? (
            <div className="mt-6 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
                Still in Today
              </p>
              <p className="mt-2 text-sm text-[var(--arth-n60)]">
                {remaining.length} after this one. The queue decrements when you record an outcome.
              </p>
              {nextUp ? (
                <div className="mt-3">
                  <ActionButton href={`/w/tele?id=${nextUp.id}`} variant="default">
                    Next: {nextUp.customer_name}
                  </ActionButton>
                </div>
              ) : null}
            </div>
          ) : null}
          <h2 className="mt-8 font-display text-[20px] font-semibold">History</h2>
          {events.length === 0 ? (
            <p className="mt-3 text-sm">No activity recorded yet. The first call writes the first row.</p>
          ) : (
            <ul className="mt-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {events.map((ev) => (
                <LedgerLine key={String(ev.id)} ev={ev as Record<string, unknown>} />
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-4">
          {owns ? (
            <>
              <DispositionPanel
                leadId={leadId}
                nextLeadId={nextUp?.id}
                nextName={nextUp?.customer_name}
                dispositions={dispositions}
                lostReasons={lostReasons}
              />
              <StagePanel leadId={leadId} stageKey={String(lead.stage_key)} />
            </>
          ) : (
            <p>
              You do not own this enquiry. {lead.owner_name ?? "Another seat"} logs outcomes. Search can still open the record.
            </p>
          )}
        </div>
      </div>
    );
  });
}
