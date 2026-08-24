import { asSeat, canOpen } from "@/db/session";
import { listQueue, raiseFirstResponseBreaches } from "@/services/telecalling";
import { assignUnowned } from "@/services/assignment";
import { EnquiryRow, RowHead } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";

export default async function DayPanelPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "dayb")) return <Forbidden />;
    const assignment = await assignUnowned(tx, seat.userId);
    await raiseFirstResponseBreaches(tx, seat.userId);
    const rows = await listQueue(tx, seat.userId);
    const due = rows.filter(
      (r) => r.next_action_at && new Date(r.next_action_at) <= new Date(),
    );

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
            {due.length} in the queue now, oldest first. Counted from next action time, today in Asia/Kolkata, plus anything already late.
            {assignment.assigned > 0
              ? ` ${assignment.assigned} unowned ${assignment.assigned === 1 ? "enquiry was" : "enquiries were"} assigned on this floor.`
              : ""}
          </p>
        </div>
        <RuleHeading>Today</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Due today plus anything breaching. Everything else is in My enquiries.
        </p>
        {rows.length === 0 ? (
          <p>No enquiries are due. New ones appear here when they are assigned.</p>
        ) : (
          <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            <RowHead />
            {rows.map((row) => (
              <EnquiryRow key={row.id} row={row} showBand={false} canCall />
            ))}
          </div>
        )}
      </div>
    );
  });
}
