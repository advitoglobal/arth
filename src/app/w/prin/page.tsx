import { asSeat, canOpen, canSeeValue } from "@/db/session";
import { controlSnapshot } from "@/services/control";
import { EnquiryList } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { FigureSource } from "@/components/figure-source";
import { Forbidden } from "@/components/forbidden";
import { ActionButton } from "@/components/action-button";
import { roleLabel } from "@/lib/seats";

export default async function PrincipalPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "prin")) return <Forbidden landing="/w/pipe" />;
    const snap = await controlSnapshot(tx);
    const showValue = canSeeValue(seat.roleKey);

    return (
      <div className="space-y-8">
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            Dealer principal · {seat.tenantName}
          </p>
          <RuleHeading className="mt-3">Telecalling at this dealer</RuleHeading>
          <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
            This dealer only. The digital desk runs the floor. You see the book, who is late, and who sits in telecalling. Other dealers never appear. Other departments are not on this screen yet.
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
            <EnquiryList rows={snap.late} canCall={false} showValue={showValue} />
          )}
        </section>
        <ActionButton href="/w/pipe">Open the full book</ActionButton>
      </div>
    );
  });
}
