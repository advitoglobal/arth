import Link from "next/link";
import { asSeat, canOpen } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { loadPerformance } from "@/services/performance";
import { PerformancePanel } from "@/components/performance-panel";
import { EnquiryList } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { STAGE_KEYS } from "@/domain/clock";
import { ActionButton } from "@/components/action-button";
import { Forbidden } from "@/components/forbidden";
import { FigureSource } from "@/components/figure-source";
import { STAGE_LABEL } from "@/lib/labels";

export default async function PipePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "pipe")) return <Forbidden />;
    const active = STAGE_KEYS.includes(stage as (typeof STAGE_KEYS)[number])
      ? stage
      : undefined;
    const page = await listPipeline(tx, seat.userId, { stage: active });
    const canCall = canOpen(seat.roleKey, "tele");
    const showPerf = ["sales", "lead"].includes(seat.roleKey);
    const perf = showPerf ? await loadPerformance(tx) : null;

    return (
      <div className="space-y-6">
        <RuleHeading>My enquiries</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          {seat.roleKey === "sales"
            ? "Enquiries handed to you after telecalling qualifies them. Convert them here. Stage moves write to the ledger."
            : seat.roleKey === "tele"
              ? "Your full book, in nine stages. Today is only what is due now. New names stay on Today for every telecaller until you reach the customer. After you qualify, hand the enquiry to sales. Open a name for the history."
              : "Names in your bucket only: team, branch, or this dealer. Never another dealer."}
        </p>
        <p className="text-sm text-[var(--arth-n60)]">
          Counts are the whole book. The list shows the {page.limit} highest-value names in the stage you opened. Use Search for a person, a number, or an enquiry number. A dealer can dump an old book of twenty lakh names; this screen will not load them all.
        </p>
        <FigureSource
          source="your full book"
          period="all nine stages, current"
        />
        {canCall ? (
          <ActionButton href="/w/new" variant="default">
            Add enquiry
          </ActionButton>
        ) : null}
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Link
            href="/w/pipe"
            className={`flex h-11 items-center justify-center rounded-[3px] border px-2 text-center text-sm ${!active ? "border-[var(--arth-ink)] font-semibold" : "border-[var(--arth-n10)]"}`}
          >
            All · {page.total}
          </Link>
          {STAGE_KEYS.map((key) => {
            const n = page.counts[key] ?? 0;
            return (
              <Link
                key={key}
                href={`/w/pipe?stage=${key}`}
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
              ? `No enquiries in ${STAGE_LABEL[active]}. They appear here when the stage moves.`
              : "No enquiries are assigned to you."}
            {canOpen(seat.roleKey, "dayb") && !active ? (
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
