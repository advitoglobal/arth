export function ScoreWallet({
  rows,
}: {
  rows: { amount: number; reason_key: string; note: string; created_at: Date }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--arth-n60)]">
        No point movement this month yet. The wallet shows each movement, never a total that jumps.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
      {rows.map((row, i) => (
        <li key={i} className="flex items-baseline justify-between gap-3 px-4 py-3">
          <span className="text-sm">{row.note}</span>
          <span
            className={`font-data tabular-nums ${row.amount < 0 ? "text-[var(--arth-overdue)]" : "text-[var(--arth-settled)]"}`}
          >
            {row.amount > 0 ? `+${row.amount}` : row.amount}
          </span>
        </li>
      ))}
    </ul>
  );
}
