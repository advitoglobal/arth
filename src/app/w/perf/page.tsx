import { asSeat, canOpen } from "@/db/session";
import { loadPerformance } from "@/services/performance";
import { PerformancePanel } from "@/components/performance-panel";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { seatFigures } from "@/services/figures";
import { FiguresStrip } from "@/components/figures-strip";

export default async function PerformancePage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "perf")) return <Forbidden screen="perf" />;
    const view = await loadPerformance(tx);
    const figures = await seatFigures(tx, seat.roleKey, seat.userId);
    return (
      <div className="space-y-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            {seat.roleLabel} · {seat.tenantName}
          </p>
          <RuleHeading className="mt-3">Performance analysis</RuleHeading>
          <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
            {seat.name}, this is the live read for your seat. It is not a CRM dashboard and it is not another dealer. Holding, gaps, and the plan are written from the book you can see, so you can plan the next hours against what a superior will ask.
          </p>
        </div>
        <FiguresStrip figures={figures} />
        <PerformancePanel view={view} title="Now on your seat" />
      </div>
    );
  });
}
