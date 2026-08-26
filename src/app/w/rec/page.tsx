import { asSeat, canOpen, canSeeValue } from "@/db/session";
import { getLead } from "@/services/telecalling";
import { RuleHeading, StatusStamp } from "@/components/brand/type";
import { inr, istDateTime, indianMobile } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { enquiryNo, sourceLabel } from "@/lib/labels";
import { LedgerLine } from "@/components/ledger-line";
import { Forbidden } from "@/components/forbidden";
import { FigureSource } from "@/components/figure-source";

export default async function RecPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "rec")) return <Forbidden />;
    if (!id) {
      return (
        <div>
          <RuleHeading>Enquiry record</RuleHeading>
          <p className="mt-4">Open a name from Today, My enquiries, or Search.</p>
        </div>
      );
    }
    const { lead, events } = await getLead(tx, id);
    if (!lead) {
      return (
        <div>
          <RuleHeading>Enquiry record</RuleHeading>
          <p className="mt-4">This enquiry is not in your tenant.</p>
        </div>
      );
    }
    const overdue =
      lead.first_response_due &&
      !lead.first_responded_at &&
      new Date(String(lead.first_response_due)).getTime() < Date.now();
    const settled = lead.stage_key === "delivered";

    return (
      <div className="space-y-6">
        <RuleHeading>Enquiry record</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Full enquiry: customer, owner, clock, and every action taken. Nothing here is edited. A correction writes a new row.
        </p>
        <FigureSource source="this enquiry" period="full activity ledger" />
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-[28px] font-semibold">{lead.customer_name}</p>
            {settled ? <StatusStamp state="settled" /> : null}
            {overdue && !settled ? <StatusStamp state="overdue" /> : null}
          </div>
          <p className="font-data">{indianMobile(String(lead.phone))}</p>
          <p className="mt-1 font-data text-sm text-[var(--arth-n60)]">
            Enquiry {enquiryNo(String(lead.id))}
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Vehicle</dt>
              <dd>{lead.model_interest} · {lead.variant_interest}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Source</dt>
              <dd>{sourceLabel(String(lead.source_key))} · {lead.source_detail}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Stage</dt>
              <dd>{lead.stage_label ?? lead.stage_key}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Owner</dt>
              <dd>{lead.owner_name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Arrived</dt>
              <dd className="font-data">{istDateTime(lead.created_at)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Call by</dt>
              <dd className="font-data">{istDateTime(lead.first_response_due)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">First call logged</dt>
              <dd className="font-data">{istDateTime(lead.first_responded_at)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Next action</dt>
              <dd className="font-data">{istDateTime(lead.next_action_at)}</dd>
            </div>
            {canSeeValue(seat.roleKey) ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Expected value</dt>
              <dd className="font-data">{inr(Number(lead.expected_value_paise) / 100)}</dd>
            </div>
            ) : null}
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Assigned</dt>
              <dd className="font-data">{istDateTime(lead.assigned_at)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Lost reason</dt>
              <dd>{lead.lost_reason_label ?? (lead.lost_reason_key ? String(lead.lost_reason_key) : "Open")}</dd>
            </div>
          </dl>
          {canOpen(seat.roleKey, "tele") && String(lead.owner_user_id ?? "") === seat.userId ? (
            <div className="mt-6">
              <ActionButton href={`/w/tele?id=${lead.id}`} variant="default">
                Log a call
              </ActionButton>
            </div>
          ) : null}
        </div>
        <h2 className="font-display text-[20px] font-semibold">Activity ledger</h2>
        {events.length === 0 ? (
          <p>No rows yet. The first call writes the first row. Rows are never edited.</p>
        ) : (
          <ul className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {events.map((ev) => (
              <LedgerLine key={String(ev.id)} ev={ev as Record<string, unknown>} />
            ))}
          </ul>
        )}
      </div>
    );
  });
}
