import { asSeat, canOpen } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { EnquiryRow, RowHead } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";

export default async function PipePage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "pipe")) return <Forbidden />;
    const rows = await listPipeline(tx, seat.userId);
    return (
      <div className="space-y-6">
        <RuleHeading>My enquiries</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          The full book, nine stages. The queue is only what is due today.
        </p>
        {rows.length === 0 ? (
          <p>No enquiries are assigned to you.</p>
        ) : (
          <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            <RowHead />
            {rows.map((row) => (
              <EnquiryRow key={row.id} row={row} showBand={false} />
            ))}
          </div>
        )}
      </div>
    );
  });
}
