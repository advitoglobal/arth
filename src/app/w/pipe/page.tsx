import { asSeat, canOpen } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { loadPerformance } from "@/services/performance";
import { PerformancePanel } from "@/components/performance-panel";
import { EnquiryList } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { STAGE_KEYS } from "@/domain/clock";
import { INSURANCE_STAGES, SERVICE_STAGES, stagesFor, departmentOfRole } from "@/domain/ladders";
import { ActionButton } from "@/components/action-button";
import { Forbidden } from "@/components/forbidden";
import { FigureSource } from "@/components/figure-source";
import { STAGE_LABEL } from "@/lib/labels";
import { PipelineFiltersForm, pipeHref } from "@/components/pipeline-filters";
import Link from "next/link";

export default async function PipePage({
  searchParams,
}: {
  searchParams: Promise<{
    stage?: string;
    source?: string;
    overdue?: string;
    parked?: string;
    owner?: string;
  }>;
}) {
  const filters = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "pipe")) return <Forbidden screen="pipe" />;
    const dept = departmentOfRole(seat.roleKey);
    const ladder =
      dept === "all"
        ? Array.from(new Set([...STAGE_KEYS, ...SERVICE_STAGES, ...INSURANCE_STAGES.filter((s) => s !== "lost")]))
        : [...stagesFor(dept)].filter((s) => s !== "lost");
    const active = ladder.includes(filters.stage ?? "") ? filters.stage : undefined;
    const page = await listPipeline(tx, seat.userId, {
      stage: active,
      source: filters.source,
      overdue: filters.overdue,
      parked: filters.parked,
      owner: filters.owner,
    });
    const canCall = canOpen(seat.roleKey, "tele");
    const showPerf = ["sales", "lead"].includes(seat.roleKey);
    const perf = showPerf ? await loadPerformance(tx) : null;
    const chip = {
      source: page.filters.source || undefined,
      overdue: page.filters.overdue || undefined,
      parked: page.filters.parked || undefined,
      owner: page.filters.owner || undefined,
    };
    const filtered = Boolean(chip.source || chip.overdue || chip.parked || chip.owner);

    return (
      <div className="space-y-6">
        <RuleHeading>My enquiries</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          {seat.roleKey === "sales"
            ? "Enquiries handed to you after telecalling reaches Meeting. Convert them here. Unclaimed pool names at this branch sit here until you claim them. Stage moves write to the ledger."
            : seat.roleKey === "tele"
              ? "Your full book, in nine stages. Today is only what is due now. New names stay on Today for every telecaller until you reach the customer. After Meeting, hand the enquiry to sales. Open a name for the history."
              : "Names in your bucket only: team, branch, or this dealer. Never another dealer."}
        </p>
        <p className="text-sm text-[var(--arth-n60)]">
          Counts are the book after the filters below. The list shows the {page.limit} highest-value names in the stage you opened. Use Search for a person, a number, or an enquiry number. A dealer can dump an old book of twenty lakh names; this screen will not load them all.
        </p>
        <FigureSource
          source={filtered ? "your full book, filtered" : "your full book"}
          period="all nine stages, current"
        />
        {canCall ? (
          <ActionButton href="/w/new" variant="default">
            Add enquiry
          </ActionButton>
        ) : null}
        <PipelineFiltersForm
          stage={active}
          source={page.filters.source || undefined}
          overdue={page.filters.overdue || undefined}
          parked={page.filters.parked || undefined}
          owner={page.filters.owner || undefined}
          owners={page.owners}
        />
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Link
            href={pipeHref(chip)}
            className={`flex h-11 items-center justify-center rounded-[3px] border px-2 text-center text-sm ${!active ? "border-[var(--arth-ink)] font-semibold" : "border-[var(--arth-n10)]"}`}
          >
            All · {page.total}
          </Link>
          {ladder.map((key) => {
            const n = page.counts[key] ?? 0;
            return (
              <Link
                key={key}
                href={pipeHref({ ...chip, stage: key })}
                className={`flex h-11 items-center justify-center rounded-[3px] border px-2 text-center text-sm ${active === key ? "border-[var(--arth-ink)] font-semibold" : "border-[var(--arth-n10)]"}`}
              >
                {STAGE_LABEL[key]} · {n}
              </Link>
            );
          })}
        </nav>
        {page.rows.length === 0 ? (
          <p>
            {active
              ? `No enquiries in ${STAGE_LABEL[active]}${filtered ? " for these filters" : ""}. They appear here when the stage moves, or when you widen the filters.`
              : filtered
                ? "No enquiries match these filters. Widen them, or open Search."
                : "No enquiries are assigned to you."}
            {canOpen(seat.roleKey, "dayb") && !active && !filtered ? (
              <span className="mt-3 block">
                <ActionButton href="/w/dayb">Open Today</ActionButton>
              </span>
            ) : !canCall && !active ? (
              <span className="mt-3 block">
                <ActionButton href="/w/search">Open Search</ActionButton>
              </span>
            ) : null}
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--arth-n60)]">
              Showing {page.rows.length}
              {active ? ` in ${STAGE_LABEL[active]}` : ""} of {active ? (page.counts[active] ?? 0) : page.total}.
            </p>
            <EnquiryList rows={page.rows} canCall={canCall} />
          </>
        )}
        {perf ? <PerformancePanel view={perf} /> : null}
      </div>
    );
  });
}
