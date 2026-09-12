import { asSeat, canOpen } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { FigureSource } from "@/components/figure-source";
import { LOOP_RULES, LOOP_STEPS } from "@/domain/weekly-loop";
import {
  floorPattern,
  listCoaching,
  listReviewCriteria,
  loadWeeklyNote,
  sampledDue,
} from "@/services/weekly-loop";
import { LoopSelfReport } from "@/components/loop-self-report";
import { SampledReviewForm } from "@/components/sampled-review-form";
import { enquiryNo } from "@/lib/labels";
import Link from "next/link";

function NoteCard({
  note,
  canSelf,
}: {
  note: Awaited<ReturnType<typeof loadWeeklyNote>>;
  canSelf: boolean;
}) {
  return (
    <div className="space-y-6">
      {note.remeasure ? (
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            {LOOP_STEPS[5].n} · {LOOP_STEPS[5].label}
          </p>
          <p className="mt-3">{note.remeasure}</p>
        </div>
      ) : null}
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          {LOOP_STEPS[0].n} · {LOOP_STEPS[0].label}
        </p>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">
          Against her own four-week median. Not against the floor.
        </p>
        {note.incomplete ? (
          <p className="mt-3 text-sm">Incomplete figures. Fewer than four of her own weeks are on the book.</p>
        ) : null}
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {note.metrics.map((m) => (
            <div key={m.key} className="border border-[var(--arth-n10)] p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
                {m.label}
              </dt>
              <dd className="mt-2 font-data text-2xl tabular-nums">
                {m.displayCurrent}
                <span className="ml-2 text-sm font-sans text-[var(--arth-n60)]">
                  median {m.displayMedian}
                </span>
              </dd>
              <p className="mt-1 text-sm text-[var(--arth-n60)]">{m.detail}</p>
            </div>
          ))}
        </dl>
      </div>
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          {LOOP_STEPS[1].n} · {LOOP_STEPS[1].label}
        </p>
        <p className="mt-3">{note.oneThing?.line ?? "No figure yet this week."}</p>
      </div>
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          {LOOP_STEPS[2].n} · {LOOP_STEPS[2].label}
        </p>
        <p className="mt-3">{note.oneThing?.causeLine ?? "Cause waits on a measured week."}</p>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">{note.aiLine}</p>
      </div>
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          {LOOP_STEPS[3].n} · {LOOP_STEPS[3].label}
        </p>
        <p className="mt-3">{note.oneThing?.action ?? "No action until there is one metric."}</p>
      </div>
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          {LOOP_STEPS[4].n} · {LOOP_STEPS[4].label}
        </p>
        {note.examples.length === 0 ? (
          <p className="mt-3">No connected calls of hers this week to practise from yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {note.examples.map((ex) => (
              <li key={ex.leadId}>
                <Link href={`/w/rec?id=${ex.leadId}`} className="font-medium hover:underline">
                  {ex.name}
                </Link>
                <span className="text-sm text-[var(--arth-n60)]">
                  {` · Enquiry ${enquiryNo(ex.leadId)} · ${ex.seconds}s`}
                  {ex.note ? ` · ${ex.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {canSelf ? <LoopSelfReport initial={note.selfReport ?? ""} /> : null}
    </div>
  );
}

export default async function LoopPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const { user } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "loop")) return <Forbidden screen="loop" />;
    const personal = ["tele", "svctele", "instele"].includes(seat.roleKey);
    const leadish = ["lead", "mgr", "gm", "ops"].includes(seat.roleKey);
    const criteria = await listReviewCriteria(tx);

    if (personal) {
      const note = await loadWeeklyNote(tx, seat.userId, seat.userId);
      return (
        <div className="space-y-6">
          <RuleHeading>This week</RuleHeading>
          <p className="max-w-[68ch] text-sm text-[var(--arth-n60)]">
            One metric, one cause, one action, two examples. Compared to your own past, never to the top of the floor.
          </p>
          <FigureSource source="your own calls and handovers" period={note.period} />
          <NoteCard note={note} canSelf />
          <ul className="text-sm text-[var(--arth-n60)]">
            {LOOP_RULES.map((r) => (
              <li key={r.key}>
                <span className="font-medium text-[var(--arth-ink)]">{r.label}.</span> {r.detail}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (!leadish) return <Forbidden screen="loop" />;

    const subject = user && !personal ? user : null;
    const coaching = await listCoaching(tx, seat.userId);
    const pattern = ["mgr", "gm", "ops"].includes(seat.roleKey)
      ? await floorPattern(tx, seat.userId)
      : null;
    const samples = ["lead", "mgr", "ops"].includes(seat.roleKey)
      ? await sampledDue(tx, seat.userId)
      : [];
    const note = subject ? await loadWeeklyNote(tx, seat.userId, subject) : null;

    return (
      <div className="space-y-8">
        <RuleHeading>This week</RuleHeading>
        <p className="max-w-[68ch] text-sm text-[var(--arth-n60)]">
          Ranked by who moved furthest from their own median, not by who is lowest. The lowest performer may be perfectly steady.
        </p>
        {pattern ? (
          <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
              Floor pattern
            </p>
            <p className="mt-3">{pattern.line}</p>
            {pattern.names.length > 0 ? (
              <p className="mt-2 text-sm text-[var(--arth-n60)]">{pattern.names.join(", ")}</p>
            ) : null}
          </div>
        ) : null}
        <FigureSource
          source="this branch telecalling book"
          period="this week in India Standard Time, versus each person's four-week median"
        />
        {coaching.length === 0 ? (
          <p>No telecallers on this branch.</p>
        ) : (
          <div className="overflow-x-auto border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--arth-ink)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">One thing</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {coaching.map((row) => (
                  <tr key={row.userId} className="border-t border-[var(--arth-n10)]">
                    <td className="px-4 py-3">
                      <Link href={`/w/loop?user=${row.userId}`} className="font-medium hover:underline">
                        {row.name}
                      </Link>
                      {row.incomplete ? (
                        <span className="ml-2 text-[var(--arth-n60)]">Incomplete</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{row.line}</td>
                    <td className="px-4 py-3">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {note ? (
          <div>
            <h2 className="font-display text-[20px] font-semibold">{note.name}</h2>
            <FigureSource source={`${note.name}'s own calls`} period={note.period} />
            <div className="mt-4">
              <NoteCard note={note} canSelf={false} />
            </div>
          </div>
        ) : null}
        {samples.length > 0 ? (
          <section className="space-y-4">
            <h2 className="font-display text-[20px] font-semibold">Sampled call review</h2>
            <p className="text-sm text-[var(--arth-n60)]">
              Five percent of connected calls. Six criteria, one to five. {criteria.map((c) => c.label).join(", ")}.
            </p>
            {samples.map((s) => (
              <SampledReviewForm
                key={s.eventId}
                eventId={s.eventId}
                name={s.name}
                reviewee={s.reviewee}
              />
            ))}
          </section>
        ) : ["lead", "mgr", "ops"].includes(seat.roleKey) ? (
          <p className="text-sm text-[var(--arth-n60)]">
            No sampled reviews due. Five percent of connected calls, when there are enough this week.
          </p>
        ) : null}
      </div>
    );
  });
}
