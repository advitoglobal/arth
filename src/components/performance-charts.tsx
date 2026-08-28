"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MixRow = { label: string; n: number; fill?: string };
type RankRow = { name: string; score: number; you?: boolean };
type TeamRow = { name: string; late: number; connects: number };

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] px-3 py-2 text-sm shadow-none">
      {label ? <p className="font-semibold">{label}</p> : null}
      {payload.map((p) => (
        <p key={p.name} className="font-data tabular-nums text-[var(--arth-n60)]">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function MixBars({ title, hint, rows, empty }: { title: string; hint: string; rows: MixRow[]; empty: string }) {
  if (rows.length === 0) {
    return (
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
        <h3 className="font-display text-[20px] font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">{empty}</p>
      </div>
    );
  }
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
      <h3 className="font-display text-[20px] font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-[var(--arth-n60)]">{hint}</p>
      <div className="mt-3 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--arth-n10)" />
            <XAxis dataKey="label" tick={{ fill: "var(--arth-n60)", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={48} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--arth-n60)", fontSize: 11 }} width={36} />
            <Tooltip content={<ChartTip />} cursor={{ fill: "var(--arth-n05)" }} />
            <Bar dataKey="n" name="Count" radius={0}>
              {rows.map((row) => (
                <Cell key={row.label} fill={row.fill ?? "var(--arth-ink)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PerformanceCharts({
  clock,
  stages,
  board,
  team,
  boardLabel,
}: {
  clock: MixRow[];
  stages: MixRow[];
  board: RankRow[];
  team: TeamRow[];
  boardLabel: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MixBars
        title="Clock mix"
        hint="Late, due, parked, and still shared on this wall."
        rows={clock}
        empty="No clock mix to plot on this read."
      />
      <MixBars
        title="Stage mix"
        hint="Where names sit on this wall. Use Search for a person."
        rows={stages}
        empty="No stage mix to plot on this read."
      />
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
        <h3 className="font-display text-[20px] font-semibold">Score on this wall</h3>
        <p className="mt-1 text-sm text-[var(--arth-n60)]">
          {boardLabel}. Another dealer never appears. Your bar is brass.
        </p>
        {board.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--arth-n60)]">No peers to rank on this wall.</p>
        ) : (
          <div className="mt-3 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={board} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid horizontal={false} stroke="var(--arth-n10)" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--arth-n60)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={88} tick={{ fill: "var(--arth-ink)", fontSize: 12 }} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "var(--arth-n05)" }} />
                <Bar dataKey="score" name="Score" radius={0}>
                  {board.map((row) => (
                    <Cell key={row.name} fill={row.you ? "var(--arth-brass)" : "var(--arth-ink)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {team.length > 0 ? (
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <h3 className="font-display text-[20px] font-semibold">Team: late and connects</h3>
          <p className="mt-1 text-sm text-[var(--arth-n60)]">
            Late is the clock. Connects are reaches of 20 seconds or more today.
          </p>
          <div className="mt-3 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={team} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--arth-n10)" />
                <XAxis dataKey="name" tick={{ fill: "var(--arth-n60)", fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--arth-n60)", fontSize: 11 }} width={36} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "var(--arth-n05)" }} />
                <Bar dataKey="late" name="Late" fill="var(--arth-overdue)" radius={0} />
                <Bar dataKey="connects" name="Connects today" fill="var(--arth-settled)" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
          <h3 className="font-display text-[20px] font-semibold">Team: late and connects</h3>
          <p className="mt-2 text-sm text-[var(--arth-n60)]">
            This seat has no team board. Your own score is on the chart to the left.
          </p>
        </div>
      )}
    </div>
  );
}

export function DealerRankChart({ rows }: { rows: RankRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
        <h3 className="font-display text-[20px] font-semibold">Dealer wall scores</h3>
        <p className="mt-2 text-sm text-[var(--arth-n60)]">No dealer wall exists to rank yet.</p>
      </div>
    );
  }
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
      <h3 className="font-display text-[20px] font-semibold">Dealer wall scores</h3>
      <p className="mt-1 text-sm text-[var(--arth-n60)]">
        One bar per dealer. This is not a mixed enquiry list. Open a dealer to read late inside that wall.
      </p>
      <div className="mt-3 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid horizontal={false} stroke="var(--arth-n10)" />
            <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--arth-n60)", fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fill: "var(--arth-ink)", fontSize: 12 }} />
            <Tooltip content={<ChartTip />} cursor={{ fill: "var(--arth-n05)" }} />
            <Bar dataKey="score" name="Score" fill="var(--arth-ink)" radius={0} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
