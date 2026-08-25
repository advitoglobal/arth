import { asSeat, canOpen } from "@/db/session";
import { listQueue, raiseFirstResponseBreaches } from "@/services/telecalling";
import { assignUnowned } from "@/services/assignment";
import { EnquiryRow, RowHead } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { isFirstResponseLate, isFollowUpLate } from "@/domain/clock";
import type { LeadRow } from "@/services/telecalling";

function Block({
  title,
  note,
  rows,
}: {
  title: string;
  note: string;
  rows: LeadRow[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-[20px] font-semibold">{title}</h2>
      <p className="text-sm text-[var(--arth-n60)]">{note}</p>
      {rows.length === 0 ? (
        <p>None in this list.</p>
      ) : (
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
          <RowHead />
          {rows.map((row) => (
            <EnquiryRow key={row.id} row={row} showBand={false} canCall />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DayPanelPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "dayb")) return <Forbidden />;
    const assignment = await assignUnowned(tx, seat.userId);
    await raiseFirstResponseBreaches(tx, seat.userId);
    const rows = await listQueue(tx, seat.userId);
    const breaching = rows.filter(
      (r) => isFirstResponseLate(r) || isFollowUpLate(r.next_action_at),
    );
    const promised = rows.filter(
      (r) =>
        !isFirstResponseLate(r) &&
        !isFollowUpLate(r.next_action_at) &&
        r.next_action_at,
    );
    const seen = new Set([...breaching, ...promised].map((r) => r.id));
    const rest = rows.filter((r) => !seen.has(r.id));

    return (
      <div className="space-y-8">
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            {seat.name} ·{" "}
            {new Date().toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="mt-3 max-w-[68ch]">
            {breaching.length} breaching, {promised.length} promised for later today.
            Source: next_action_at and first_response_due, Asia/Kolkata.
            {assignment.assigned > 0
              ? ` ${assignment.assigned} unowned ${assignment.assigned === 1 ? "enquiry was" : "enquiries were"} assigned on this floor.`
              : ""}
          </p>
        </div>
        <RuleHeading>Today</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          The queue is due today plus anything already late. Everything else is in My enquiries.
        </p>
        {rows.length === 0 ? (
          <p>No enquiries are due. New ones appear here when they are assigned.</p>
        ) : (
          <>
            <Block
              title="Breaching"
              note="First response missed, or a follow-up already late."
              rows={breaching}
            />
            <Block
              title="Promised"
              note="A next action is still due today and not yet late."
              rows={promised}
            />
            {rest.length > 0 ? (
              <Block
                title="Also on Today"
                note="On the queue without a dated next action."
                rows={rest}
              />
            ) : null}
          </>
        )}
      </div>
    );
  });
}
