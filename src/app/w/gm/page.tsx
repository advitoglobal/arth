import { asSeat, canOpen, canSeeValue } from "@/db/session";
import { loadPerformance } from "@/services/performance";
import { PerformancePanel } from "@/components/performance-panel";
import { RuleHeading } from "@/components/brand/type";
import { FigureSource } from "@/components/figure-source";
import { Forbidden } from "@/components/forbidden";
import { ActionButton } from "@/components/action-button";
import { costPerBooking, departmentCounts, listEscalations } from "@/services/conversion";
import { inr } from "@/lib/format";
import { seatFigures } from "@/services/figures";
import { FiguresStrip } from "@/components/figures-strip";

export default async function GmPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "gm")) return <Forbidden landing="/w/pipe" screen="gm" />;
    const showValue = canSeeValue(seat.roleKey);
    const perf = await loadPerformance(tx);
    const costs = await costPerBooking(tx);
    const depts = await departmentCounts(tx);
    const escalations = await listEscalations(tx);
    const figures = await seatFigures(tx, seat.roleKey, seat.userId);

    return (
      <div className="space-y-8">
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            General manager · {seat.tenantName}
          </p>
          <RuleHeading className="mt-3">All departments</RuleHeading>
          <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
            This is the operations view: every department&apos;s enquiries, what is late, what is escalated, and cost per booking. Reassign stays a decision. The clock only notifies.
          </p>
        </div>
        <FigureSource source="this dealer book" period="open enquiries, this month spend" />
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Departments</h2>
          {depts.length === 0 ? (
            <p>No open enquiries.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {depts.map((d) => (
                <li key={d.department_key} className="flex justify-between px-4 py-3">
                  <span className="capitalize">{d.department_key}</span>
                  <span className="font-data text-sm">{d.n} open · {d.late} late</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Cost per booking</h2>
          {!showValue ? (
            <p>Value is hidden for this seat.</p>
          ) : costs.length === 0 ? (
            <p>No source spend this month.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {costs.map((c) => (
                <li key={c.source_key} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                  <span className="capitalize">{c.source_key.replaceAll("_", " ")}</span>
                  <span className="font-data text-sm">
                    {inr(Number(c.cost_paise) / 100)} per booking · {c.bookings} bookings
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Needs a decision</h2>
          {escalations.length === 0 ? (
            <p>Nothing is escalated.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {escalations.map((e) => (
                <li key={e.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                  <a className="hover:underline" href={`/w/rec?id=${e.id}`}>{e.customer_name}</a>
                  <span className="text-sm text-[var(--arth-n60)]">{e.department_key} · {e.escalate_level}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <FiguresStrip figures={figures} />
        <ActionButton href="/w/pipe">Open the full book</ActionButton>
        <PerformancePanel view={perf} />
      </div>
    );
  });
}
