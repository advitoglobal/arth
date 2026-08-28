import { ActionButton } from "@/components/action-button";
import { FigureSource } from "@/components/figure-source";
import { PerformanceCharts } from "@/components/performance-charts";
import { clockMix, stageMix, type PerformanceView, type RankRow } from "@/services/performance";

function RankTable({
  title,
  hint,
  rows,
}: {
  title: string;
  hint: string;
  rows: RankRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h3 className="font-display text-[20px] font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-[var(--arth-n60)]">{hint}</p>
      <div className="mt-3 overflow-x-auto border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--arth-ink)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
              <th className="px-4 py-2">Rank</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2 text-right">Score</th>
              <th className="px-4 py-2 text-right">Late</th>
              <th className="px-4 py-2 text-right">Connects</th>
              <th className="px-4 py-2 text-right">On book</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.user_id}
                className={row.you ? "bg-[var(--arth-brass-wash)]" : "border-t border-[var(--arth-n10)]"}
              >
                <td className="px-4 py-2 font-data tabular-nums">{row.rank}</td>
                <td className="px-4 py-2">
                  {row.full_name}
                  {row.you ? <span className="ml-2 text-[var(--arth-n60)]">you</span> : null}
                  {row.branch ? <span className="ml-2 text-[var(--arth-n60)]">{row.branch}</span> : null}
                </td>
                <td className="px-4 py-2 text-right font-data tabular-nums">{row.score}</td>
                <td className="px-4 py-2 text-right font-data tabular-nums">{row.late}</td>
                <td className="px-4 py-2 text-right font-data tabular-nums">{row.connects_today}</td>
                <td className="px-4 py-2 text-right font-data tabular-nums">{row.owned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PerformancePanel({
  view,
  title = "Performance analysis",
}: {
  view: PerformanceView;
  title?: string;
}) {
  const snap = view.snapshot;
  const mix = stageMix(snap);
  const ranks = view.ranks;
  const you = ranks.you;
  const figures: [string, number | string][] = [
    ["Score today", you?.score ?? 0],
    [
      "Rank",
      you && ranks.board.length > 0 ? `${you.rank} of ${ranks.board.length}` : "n/a",
    ],
    ["In this bucket", snap.book],
    ["Late", snap.late],
    ["Due today", snap.due_today],
    ["Parked", snap.parked],
  ];
  if (snap.role === "tele" || snap.role === "svctele" || snap.role === "sales" || snap.role === "lead") {
    figures.splice(2, 0, ["You own", snap.owned]);
  }
  if (snap.role === "tele" || snap.role === "svctele" || snap.role === "lead" || snap.role === "mgr" || snap.role === "owner" || snap.role === "ops") {
    figures.push(["Still shared", snap.unowned]);
  }
  figures.push(["Scoring connects today", snap.today_connects]);
  figures.push(["Points today", snap.today_points]);
  if (snap.teles > 0) figures.push(["Telecallers", snap.teles]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          {title}
        </p>
        <p className="mt-2 max-w-[68ch] text-sm text-[var(--arth-n60)]">
          What is true on this seat now, against the book you are allowed to see. Score and rank use the same walls. Another dealer never appears. Figures are live, not a target sheet. Targets still come from your manager; this is the current state those targets have to move.
        </p>
      </div>
      <FigureSource source={snap.scope} period="India Standard Time, now, plus today" />
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {figures.map(([label, value]) => (
          <div key={label} className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
              {label}
            </dt>
            <dd className="mt-2 font-data text-2xl tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="max-w-[68ch] text-sm text-[var(--arth-n60)]">
        Score is live behaviour on this wall: points and scoring connects today, plus handoffs to sales, minus connected calls under 20 seconds, late clocks, and unreached names where this seat owns that bucket. It is not incentive pay and it is not a monthly rating.
      </p>
      <PerformanceCharts
        clock={clockMix(snap)}
        stages={mix.map((row) => ({ label: row.label, n: row.n, fill: "var(--arth-ink)" }))}
        board={ranks.board.map((row) => ({
          name: row.you ? `${row.full_name} (you)` : row.full_name,
          score: row.score,
          you: row.you,
        }))}
        team={snap.team.map((t) => ({
          name: t.full_name,
          late: t.late,
          connects: t.connects_today,
        }))}
        boardLabel={ranks.board_label}
      />
      <RankTable
        title={`Ranking: ${ranks.board_label}`}
        hint="Same formula for every name on this board. Coastal never appears on a Whitefield board."
        rows={ranks.board}
      />
      {ranks.managed.map((board) => (
        <RankTable
          key={board.kind + board.label}
          title={`Ranking: ${board.label}`}
          hint="People you can see on this wall. Use it to coach, not to mix dealers."
          rows={board.rows}
        />
      ))}
      {mix.length > 0 ? (
        <div>
          <h3 className="font-display text-[20px] font-semibold">Stage mix</h3>
          <p className="mt-1 text-sm text-[var(--arth-n60)]">
            Counts in {snap.scope}. Use Search for a person.
          </p>
          <ul className="mt-3 divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {mix.map((row) => (
              <li key={row.key} className="flex items-baseline justify-between gap-3 px-4 py-2">
                <span>{row.label}</span>
                <span className="font-data tabular-nums">{row.n}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {snap.team.length > 0 ? (
        <div>
          <h3 className="font-display text-[20px] font-semibold">People on this read</h3>
          <p className="mt-1 text-sm text-[var(--arth-n60)]">
            Late is the clock. Scoring connects today are reaches of 20 seconds or more.
          </p>
          <ul className="mt-3 divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {snap.team.map((t) => (
              <li key={t.username ?? t.full_name} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                <span>
                  {t.full_name}
                  {t.branch ? <span className="ml-2 text-sm text-[var(--arth-n60)]">{t.branch}</span> : null}
                </span>
                <span className="text-sm text-[var(--arth-n60)]">
                  {t.owned} on book · {t.late} late · {t.connects_today} connects today
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <h3 className="font-display text-[20px] font-semibold">Holding</h3>
          <p className="mt-1 text-sm text-[var(--arth-n60)]">What is already true and should be kept.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {view.holding.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <h3 className="font-display text-[20px] font-semibold">Gaps</h3>
          <p className="mt-1 text-sm text-[var(--arth-n60)]">What a superior can still challenge.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {view.gaps.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <h3 className="font-display text-[20px] font-semibold">Plan from here</h3>
          <p className="mt-1 text-sm text-[var(--arth-n60)]">Execute against the figures above, not against a guess.</p>
          <ul className="mt-3 space-y-3 text-sm">
            {view.plan.map((step) => (
              <li key={step.text}>
                <p>{step.text}</p>
                {step.href ? (
                  <span className="mt-2 block">
                    <ActionButton href={step.href}>Open</ActionButton>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {snap.today_outcomes > 0 || snap.today_handoffs > 0 || snap.today_short_connects > 0 ? (
        <p className="text-sm text-[var(--arth-n60)]">
          Today on the ledger: {snap.today_outcomes} outcomes, {snap.today_handoffs} handoffs to sales
          {snap.today_short_connects > 0 ? `, ${snap.today_short_connects} connected under 20 seconds` : ""}.
        </p>
      ) : (
        <p className="text-sm text-[var(--arth-n60)]">
          No outcomes are on the ledger for this seat today yet. The book figures above are still the live state.
        </p>
      )}
    </section>
  );
}
