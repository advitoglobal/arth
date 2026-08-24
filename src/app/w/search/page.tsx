import { asSeat, canOpen } from "@/db/session";
import { searchEnquiries } from "@/services/telecalling";
import { EnquiryRow, RowHead } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";
import { Forbidden } from "@/components/forbidden";
import { STAGE_KEYS } from "@/domain/clock";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    source?: string;
    stage?: string;
    overdue?: string;
    parked?: string;
    model?: string;
  }>;
}) {
  const filters = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "search")) return <Forbidden />;
    const rows = await searchEnquiries(tx, filters);
    const active =
      Boolean(filters.q) ||
      Boolean(filters.source) ||
      Boolean(filters.stage) ||
      Boolean(filters.overdue) ||
      Boolean(filters.parked) ||
      Boolean(filters.model);
    return (
      <div className="space-y-6">
        <RuleHeading>Search</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Phone first, then the six working filters. Four digits or three letters. This tenant only.
        </p>
        <form method="get" className="grid gap-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm sm:col-span-2 lg:col-span-1">
            Phone or name
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Example: 0001 or Priya"
              className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
            />
          </label>
          <label className="block text-sm">
            Source
            <select name="source" defaultValue={filters.source ?? ""} className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2">
              <option value="">Any</option>
              <option value="google">google</option>
              <option value="meta">meta</option>
              <option value="walk_in">walk_in</option>
            </select>
          </label>
          <label className="block text-sm">
            Stage
            <select name="stage" defaultValue={filters.stage ?? ""} className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2">
              <option value="">Any</option>
              {STAGE_KEYS.map((s) => (
                <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Overdue
            <select name="overdue" defaultValue={filters.overdue ?? ""} className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2">
              <option value="">Any</option>
              <option value="yes">Overdue</option>
              <option value="no">Not overdue</option>
            </select>
          </label>
          <label className="block text-sm">
            Parked
            <select name="parked" defaultValue={filters.parked ?? ""} className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2">
              <option value="">Any</option>
              <option value="yes">Parked</option>
              <option value="no">Not parked</option>
            </select>
          </label>
          <label className="block text-sm">
            Vehicle
            <input
              name="model"
              defaultValue={filters.model}
              placeholder="Example: Brezza"
              className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
            />
          </label>
          <div className="flex items-end">
            <Button type="submit" className="h-11">Search</Button>
          </div>
        </form>
        {!active ? (
          <p>Enter a number, a name, or a filter. New inbound calls start here.</p>
        ) : null}
        {active && rows.length === 0 ? (
          <p>No enquiries match. Widen the filters or try another four digits.</p>
        ) : null}
        {rows.length > 0 ? (
          <div>
            <p className="mb-2 text-sm text-[var(--arth-n60)]">
              {rows.length} in this tenant. Source: customers and leads, current query.
            </p>
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
          </div>
        ) : null}
      </div>
    );
  });
}
