import { asSeat, canOpen } from "@/db/session";
import { listQueue, raiseFirstResponseBreaches } from "@/services/telecalling";
import { assignUnowned } from "@/services/assignment";
import { EnquiryRow, RowHead } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { isFirstResponseLate, isFollowUpLate } from "@/domain/clock";
import type { LeadRow } from "@/services/telecalling";

function countLabel(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function todayBrief(breaching: number, promised: number, assigned: number) {
  const parts: string[] = [];
  if (breaching > 0) {
    parts.push(
      `${countLabel(breaching, "enquiry is", "enquiries are")} late. Call ${breaching === 1 ? "this one" : "these"} first.`,
    );
  } else {
    parts.push("Nothing is late.");
  }
  if (promised > 0) {
    parts.push(
      `${countLabel(promised, "enquiry still needs", "enquiries still need")} a call later today.`,
    );
  } else if (breaching === 0) {
    parts.push("Nothing else is due today.");
  }
  if (assigned > 0) {
    parts.push(
      `${countLabel(assigned, "new enquiry was", "new enquiries were")} just assigned to you.`,
    );
  }
  return parts.join(" ");
}

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
            <EnquiryRow key={row.id} row={row} canCall />
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
            {new Date().toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="mt-3 max-w-[68ch]">
            {todayBrief(breaching.length, promised.length, assignment.assigned)}
          </p>
        </div>
        <RuleHeading>Today</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Your list for today: late calls first, then what you still promised to do today. The rest of your book is in My enquiries.
        </p>
        {rows.length === 0 ? (
          <p>No enquiries are due. New ones appear here when they are assigned.</p>
        ) : (
          <>
            <Block
              title="Late"
              note="First call missed, or a follow-up already late. Start here."
              rows={breaching}
            />
            <Block
              title="Due later today"
              note="You still owe a call today. It is not late yet."
              rows={promised}
            />
            {rest.length > 0 ? (
              <Block
                title="Also due"
                note="On today without a timed follow-up."
                rows={rest}
              />
            ) : null}
          </>
        )}
      </div>
    );
  });
}
