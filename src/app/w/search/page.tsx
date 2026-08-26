import { asSeat, canOpen, canSeeValue } from "@/db/session";
import { searchEnquiries } from "@/services/telecalling";
import { EnquiryList } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/action-button";
import { Forbidden } from "@/components/forbidden";
import { STAGE_KEYS } from "@/domain/clock";
import { sourceLabel, stageLabel } from "@/lib/labels";
import { FigureSource } from "@/components/figure-source";

function keep(name: string, value?: string) {
  if (!value) return null;
  return <input type="hidden" name={name} value={value} />;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    source?: string;
    stage?: string;
    overdue?: string;
    parked?: string;
    from?: string;
    to?: string;
    on?: string;
  }>;
}) {
  const filters = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "search")) return <Forbidden />;
    const rows = await searchEnquiries(tx, filters);
    const q = filters.q?.trim() ?? "";
    const phoneDigits = q.replace(/\D/g, "").slice(0, 10);
    const leftoverLetters = q.replace(/\d/g, "").replace(/\W/g, "").trim();
    const hasSearch = q.length >= 2;
    const hasFilter = Boolean(
      filters.source ||
        filters.stage ||
        filters.overdue ||
        filters.parked ||
        filters.from ||
        filters.to,
    );
    const active = hasSearch || hasFilter;
    const dateOn = filters.on === "due" ? "due" : "arrived";
    const missPhone =
      hasSearch &&
      rows.length === 0 &&
      phoneDigits.length >= 4 &&
      leftoverLetters.length < 3;

    return (
      <div className="space-y-6">
        <RuleHeading>Search</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Type a mobile number, a name, an enquiry number, or a model. Use Filter underneath to narrow the list by source, stage, date, and the rest.
        </p>
        <FigureSource
          source="enquiries in this tenant"
          period="current book"
        />
        <form method="get" className="space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            Search
          </p>
          <label className="block text-sm">
            Number, name, enquiry number, or model
            <input
              name="q"
              defaultValue={filters.q}
              placeholder="Example: 0001, Priya, FFFFFFF1, or Brezza"
              className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
            />
          </label>
          {keep("source", filters.source)}
          {keep("stage", filters.stage)}
          {keep("overdue", filters.overdue)}
          {keep("parked", filters.parked)}
          {keep("from", filters.from)}
          {keep("to", filters.to)}
          {keep("on", hasFilter ? dateOn : undefined)}
          <Button type="submit" className="h-11">
            Search
          </Button>
        </form>
        <form method="get" className="space-y-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            Filter
          </p>
          <p className="text-sm text-[var(--arth-n60)]">
            Source, stage, overdue, parked, and date. Date applies to arrived or to follow-up due.
          </p>
          {keep("q", q || undefined)}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              Source
              <select
                name="source"
                defaultValue={filters.source ?? ""}
                className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              >
                <option value="">Any</option>
                <option value="google">{sourceLabel("google")}</option>
                <option value="meta">{sourceLabel("meta")}</option>
                <option value="walk_in">{sourceLabel("walk_in")}</option>
                <option value="inbound_call">{sourceLabel("inbound_call")}</option>
              </select>
            </label>
            <label className="block text-sm">
              Stage
              <select
                name="stage"
                defaultValue={filters.stage ?? ""}
                className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              >
                <option value="">Any</option>
                {STAGE_KEYS.map((s) => (
                  <option key={s} value={s}>
                    {stageLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Overdue
              <select
                name="overdue"
                defaultValue={filters.overdue ?? ""}
                className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              >
                <option value="">Any</option>
                <option value="yes">Overdue</option>
                <option value="no">Not overdue</option>
              </select>
            </label>
            <label className="block text-sm">
              Parked
              <select
                name="parked"
                defaultValue={filters.parked ?? ""}
                className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              >
                <option value="">Any</option>
                <option value="yes">Parked</option>
                <option value="no">Not parked</option>
              </select>
            </label>
            <label className="block text-sm">
              Date applies to
              <select
                name="on"
                defaultValue={dateOn}
                className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
              >
                <option value="arrived">Arrived</option>
                <option value="due">Follow-up due</option>
              </select>
            </label>
            <label className="block text-sm">
              From
              <input
                type="date"
                name="from"
                defaultValue={filters.from ?? ""}
                className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
              />
            </label>
            <label className="block text-sm">
              To
              <input
                type="date"
                name="to"
                defaultValue={filters.to ?? ""}
                className="mt-1 h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-3"
              />
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit" className="h-11">
                Apply filters
              </Button>
              {active ? (
                <ActionButton href="/w/search">Clear</ActionButton>
              ) : null}
            </div>
          </div>
        </form>
        {!active ? (
          <p>Enter a search or apply a filter. New inbound calls start here.</p>
        ) : null}
        {active && rows.length === 0 ? (
          <div className="space-y-3">
            <p>
              {missPhone
                ? "No enquiry matches that number. File it if this is a new inbound call."
                : "No enquiries match. Widen the filters or try another search."}
            </p>
            {missPhone && canOpen(seat.roleKey, "new") ? (
              <ActionButton
                href={`/w/new?phone=${encodeURIComponent(phoneDigits)}`}
                variant="default"
              >
                File this enquiry
              </ActionButton>
            ) : null}
          </div>
        ) : null}
        {rows.length > 0 ? (
          <div>
            <p className="mb-2 text-sm text-[var(--arth-n60)]">
              {rows.length} in this tenant. Source: enquiries in this tenant. Period: current book.
            </p>
            <EnquiryList
              rows={rows}
              showValue={canSeeValue(seat.roleKey)}
              canCall={(row) =>
                canOpen(seat.roleKey, "tele") &&
                (!row.owner_user_id || row.owner_user_id === seat.userId)
              }
            />
          </div>
        ) : null}
      </div>
    );
  });
}
