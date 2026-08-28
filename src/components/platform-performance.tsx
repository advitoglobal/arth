import type { PlatformDealer } from "@/services/platform";
import type { DealerWallRank } from "@/services/performance";
import { ActionButton } from "@/components/action-button";
import { DealerRankChart } from "@/components/performance-charts";

export function PlatformPerformance({
  dealers,
  ranks,
  canOnboard,
}: {
  dealers: PlatformDealer[];
  ranks: DealerWallRank[];
  canOnboard: boolean;
}) {
  const live = dealers.filter((d) => d.status === "live");
  const holding: string[] = [];
  const gaps: string[] = [];
  const plan: { text: string; href?: string }[] = [];

  if (live.length > 0) {
    holding.push(
      `${live.length === 1 ? "1 dealer is" : `${live.length} dealers are`} live on Arth. Each is a wall.`,
    );
  }
  const thin = dealers.filter((d) => Number(d.seat_count) < 3);
  if (thin.length > 0) {
    gaps.push(
      `${thin.map((d) => d.name).join(", ")} ${thin.length === 1 ? "has" : "have"} fewer than three seats. The floor may not be fully seated.`,
    );
  }
  if (dealers.length === 0) {
    gaps.push("No dealer wall exists yet. Performance of a floor cannot be read until a dealer is onboarded.");
    if (canOnboard) {
      plan.push({ text: "Onboard the first dealer wall.", href: "/a/onboard" });
    }
  } else {
    plan.push({
      text: "Enter one dealer to read late, shared, score, and team ranking. Leave before opening another. Enquiry rows from two dealers must never sit on one screen.",
    });
  }
  if (canOnboard && dealers.length > 0) {
    plan.push({ text: "Onboard another dealer only when a new wall is required.", href: "/a/onboard" });
  }
  if (!canOnboard) {
    plan.push({ text: "Support cannot onboard. Enter a dealer to fix a floor problem. Every entry is logged." });
  }
  if (holding.length === 0) {
    holding.push("No live dealer is on this read yet.");
  }
  const leader = ranks[0];
  if (leader) {
    holding.push(
      `${leader.name} ranks 1 of ${ranks.length} dealer walls on today's score (${leader.score}). Score here is scoring connects today minus the shared book. Late is read inside the dealer so a twenty-lakh book cannot stall this list.`,
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          Performance analysis
        </p>
        <p className="mt-2 max-w-[68ch] text-sm text-[var(--arth-n60)]">
          Advito reads dealer walls, not a mixed enquiry list. Open one dealer for late, score, and team ranking. That dealer only.
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          ["Dealers on Arth", dealers.length],
          ["Live", live.length],
          ["Seats across dealers", dealers.reduce((s, d) => s + Number(d.seat_count ?? 0), 0)],
        ].map(([label, value]) => (
          <div key={String(label)} className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
              {label}
            </dt>
            <dd className="mt-2 font-data text-2xl tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <DealerRankChart rows={ranks.map((r) => ({ name: r.name, score: r.score }))} />
      {ranks.length > 0 ? (
        <div>
          <h3 className="font-display text-[20px] font-semibold">Dealer wall ranking</h3>
          <p className="mt-1 text-sm text-[var(--arth-n60)]">
            Aggregates only. Open a dealer to see people and late clocks.
          </p>
          <div className="mt-3 overflow-x-auto border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--arth-ink)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
                  <th className="px-4 py-2">Rank</th>
                  <th className="px-4 py-2">Dealer</th>
                  <th className="px-4 py-2 text-right">Score</th>
                  <th className="px-4 py-2 text-right">Shared</th>
                  <th className="px-4 py-2 text-right">Connects today</th>
                  <th className="px-4 py-2 text-right">Telecallers</th>
                </tr>
              </thead>
              <tbody>
                {ranks.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--arth-n10)]">
                    <td className="px-4 py-2 font-data tabular-nums">{row.rank}</td>
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2 text-right font-data tabular-nums">{row.score}</td>
                    <td className="px-4 py-2 text-right font-data tabular-nums">{row.unowned}</td>
                    <td className="px-4 py-2 text-right font-data tabular-nums">{row.connects_today}</td>
                    <td className="px-4 py-2 text-right font-data tabular-nums">{row.teles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <h3 className="font-display text-[20px] font-semibold">Holding</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {holding.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <h3 className="font-display text-[20px] font-semibold">Gaps</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {(gaps.length ? gaps : ["No wall-level gap on this read."]).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <h3 className="font-display text-[20px] font-semibold">Plan from here</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {plan.map((step) => (
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
    </section>
  );
}
