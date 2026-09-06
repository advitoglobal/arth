import { asSeat, canOpen, canSeeValue } from "@/db/session";
import { controlSnapshot } from "@/services/control";
import { loadPerformance } from "@/services/performance";
import { PerformancePanel } from "@/components/performance-panel";
import { EnquiryList } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { FigureSource } from "@/components/figure-source";
import { Forbidden } from "@/components/forbidden";
import { ActionButton } from "@/components/action-button";
import { roleLabel } from "@/lib/seats";
import { costPerBooking, departmentCounts, listEscalations } from "@/services/conversion";
import { inr } from "@/lib/format";
import { seatFigures } from "@/services/figures";
import { FiguresStrip } from "@/components/figures-strip";

export default async function PrincipalPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "prin")) return <Forbidden landing="/w/pipe" />;
    const snap = await controlSnapshot(tx);
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
            Dealer principal · {seat.tenantName}
          </p>
          <RuleHeading className="mt-3">Every department at this dealer</RuleHeading>
          <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
            Enquiries are the business: sales, service, insurance, and the rest. Service is often the larger revenue. This dealer only. Cost per booking is spend this month divided by bookings from that source.
          </p>
        </div>
        <FigureSource source="this dealer book" period="open enquiries, now" />
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["On the book", snap.counts.names],
            ["Still shared", snap.counts.unowned],
            ["Late", snap.counts.late],
            ["Telecallers", snap.counts.teles],
          ].map(([label, n]) => (
            <div key={String(label)} className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
                {label}
              </dt>
              <dd className="mt-2 font-data text-2xl tabular-nums">{n}</dd>
            </div>
          ))}
        </dl>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">By department</h2>
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
          <h2 className="font-display text-[20px] font-semibold">Cost per booking this month</h2>
          {costs.length === 0 ? (
            <p>No source spend is on the table for this month.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {costs.map((c) => (
                <li key={c.source_key} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                  <span className="capitalize">{c.source_key.replaceAll("_", " ")}</span>
                  <span className="font-data text-sm">
                    Spend {inr(Number(c.spend_paise) / 100)} · {c.bookings} bookings · cost {inr(Number(c.cost_paise) / 100)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Escalations</h2>
          <p className="text-sm text-[var(--arth-n60)]">
            Clocks move names up. Reassign is your decision. The product does not steal an enquiry.
          </p>
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
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">People</h2>
          {snap.people.length === 0 ? (
            <p>No seats are active at this dealer.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {snap.people.map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <span>
                    {p.full_name}
                    <span className="ml-2 text-sm text-[var(--arth-n60)]">{roleLabel(p.role_key)}</span>
                  </span>
                  <span className="text-sm text-[var(--arth-n60)]">
                    {p.branch ?? "Dealer"}
                    {p.username ? ` · ${p.username}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Late</h2>
          {snap.late.length === 0 ? (
            <p>Nothing is late at this dealer.</p>
          ) : (
            <>
              {snap.counts.late > snap.late.length ? (
                <p className="text-sm text-[var(--arth-n60)]">
                  {snap.counts.late} late at this dealer. Showing {snap.late.length}. Use Search for a name.
                </p>
              ) : null}
              <EnquiryList rows={snap.late} canCall={false} showValue={showValue} />
            </>
          )}
        </section>
        <FiguresStrip figures={figures} />
        <ActionButton href="/w/pipe">Open the full book</ActionButton>
        <PerformancePanel view={perf} />
      </div>
    );
  });
}
