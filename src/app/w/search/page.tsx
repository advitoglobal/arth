import { forbidden } from "next/navigation";
import { asSeat, canOpen } from "@/db/session";
import { searchByPhone } from "@/services/telecalling";
import { EnquiryRow, RowHead } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "search")) forbidden();
    const rows = q ? await searchByPhone(tx, q) : [];
    return (
      <div className="space-y-6">
        <RuleHeading>Search</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Phone first. Four digits is enough for a partial match.
        </p>
        <form method="get" className="flex max-w-md gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Example: 0001"
            className="h-11 flex-1 rounded-[3px] border border-[var(--arth-n50)] px-3"
          />
          <Button type="submit" className="h-11">
            Search
          </Button>
        </form>
        {q && q.replace(/\D/g, "").length < 4 ? (
          <p>Enter at least four digits.</p>
        ) : null}
        {q && rows.length === 0 && (q.replace(/\D/g, "").length >= 4) ? (
          <p>No enquiries match {q}. Try another four digits from the inbound number.</p>
        ) : null}
        {!q ? (
          <p>Enter a number to search this tenant. Four digits is enough.</p>
        ) : null}
        {rows.length > 0 ? (
          <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            <RowHead />
            {rows.map((row) => (
              <EnquiryRow
                key={row.id}
                row={row}
                showBand={false}
                canCall={canOpen(seat.roleKey, "tele") && row.owner_user_id === seat.userId}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  });
}
