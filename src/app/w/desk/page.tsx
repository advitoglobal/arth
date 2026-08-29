import { asSeat, canOpen, canSeeValue } from "@/db/session";
import { controlSnapshot } from "@/services/control";
import { loadPerformance } from "@/services/performance";
import { PerformancePanel } from "@/components/performance-panel";
import { EnquiryList } from "@/components/enquiry-row";
import { PlaceForm } from "@/components/place-form";
import { RuleHeading } from "@/components/brand/type";
import { FigureSource } from "@/components/figure-source";
import { Forbidden } from "@/components/forbidden";
import { ActionButton } from "@/components/action-button";
import { enquiryNo } from "@/lib/labels";
import { assignmentMode, whyWeLose } from "@/services/floor-register";
import { AssignmentModeForm, UploadBatchForm } from "@/components/register-forms";

export default async function DeskPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "desk") && seat.kind !== "platform") {
      return <Forbidden landing="/w/pipe" />;
    }
    if (seat.kind === "platform") {
      return <Forbidden landing="/a/dealers" />;
    }
    const snap = await controlSnapshot(tx);
    const showValue = canSeeValue(seat.roleKey);
    const perf = await loadPerformance(tx);
    const lose = await whyWeLose(tx);
    const [pos] = await tx<{ branch_id: string | null }[]>`
      SELECT p.branch_id::text FROM users u
      LEFT JOIN positions p ON p.id = u.position_id
      WHERE u.id = ${seat.userId}::uuid
    `;
    const mode = pos?.branch_id ? await assignmentMode(tx, pos.branch_id, "*") : "direct";

    return (
      <div className="space-y-8">
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            Digital desk · telecalling only
          </p>
          <RuleHeading className="mt-3">The floor</RuleHeading>
          <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
            You run the telecalling team at this branch. New names stay shared until someone reaches the customer, unless you place a name with a telecaller. You cannot see another branch or another dealer.
          </p>
        </div>
        <FigureSource source="this branch book" period="open enquiries, now" />
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
          <h2 className="font-display text-[20px] font-semibold">The team</h2>
          {snap.team.length === 0 ? (
            <p>No telecallers are active on this branch.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {snap.team.map((t) => (
                <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <span>
                    {t.full_name}
                    {t.username ? (
                      <span className="ml-2 font-data text-sm text-[var(--arth-n60)]">{t.username}</span>
                    ) : null}
                  </span>
                  <span className="text-sm text-[var(--arth-n60)]">
                    {t.owned} on book · {t.late} late
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Shared book</h2>
          <p className="text-sm text-[var(--arth-n60)]">
            These names have not been reached. Place one with a telecaller when the floor needs a direction. Until then every telecaller at the branch can see them.
          </p>
          {snap.unowned.length === 0 ? (
            <p>Nothing is waiting in the shared book.</p>
          ) : (
            <>
              {snap.counts.unowned > snap.unowned.length ? (
                <p className="text-sm text-[var(--arth-n60)]">
                  {snap.counts.unowned} still shared. Showing the newest {snap.unowned.length}.
                </p>
              ) : null}
            <ul className="space-y-4">
              {snap.unowned.slice(0, 12).map((row) => (
                <li key={row.id} className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
                  <p className="font-semibold">{row.customer_name}</p>
                  <p className="text-sm text-[var(--arth-n60)]">
                    Enquiry {enquiryNo(row.id)} · {row.model_interest ?? "No model"} · {row.stage_label ?? row.stage_key}
                  </p>
                  <div className="mt-3">
                    <PlaceForm leadId={row.id} teles={snap.team} returnTo="/w/desk" />
                  </div>
                </li>
              ))}
            </ul>
            </>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Late</h2>
          {snap.late.length === 0 ? (
            <p>Nothing is late on this desk.</p>
          ) : (
            <>
              {snap.counts.late > snap.late.length ? (
                <p className="text-sm text-[var(--arth-n60)]">
                  {snap.counts.late} late on this desk. Showing {snap.late.length}. Use Search for a name.
                </p>
              ) : null}
              <EnquiryList rows={snap.late} canCall={false} showValue={showValue} />
            </>
          )}
        </section>
        <ActionButton href="/w/pipe">Open the full book</ActionButton>
        <AssignmentModeForm current={mode} />
        <UploadBatchForm />
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Why we lose</h2>
          <p className="text-sm text-[var(--arth-n60)]">
            Lost reasons on this branch book, with the last note. A lost enquiry is not a penalty.
          </p>
          {lose.length === 0 ? (
            <p>No lost reasons recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {lose.map((row) => (
                <li key={row.key} className="px-4 py-3">
                  <p className="font-semibold">
                    {row.label} · {row.n}
                  </p>
                  {row.sample ? (
                    <p className="text-sm text-[var(--arth-n60)]">{row.sample}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        <PerformancePanel view={perf} />
      </div>
    );
  });
}
